import type mysql from 'mysql2/promise';

import {
  ADMIN_PERMISSION_DEFINITIONS,
  getAdminPermissionChildren,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const ACTION_CODE_MAP = {
  view: 10,
  create: 20,
  edit: 30,
  manage: 40,
} as const;

const PERMISSION_STATUS_ACTIVE = 10;
const OBSOLETE_PERMISSION_CODES = [
  'brand.apply.view',
  'product.list.view',
  'product.auth.list.view',
  'product.auth.records.view',
] as const;

type ExistingPermissionRow = {
  id: number | string;
  code: string;
  status: number | string;
};

let syncPromise: Promise<void> | null = null;

function toPermissionActionCode(action: keyof typeof ACTION_CODE_MAP) {
  return ACTION_CODE_MAP[action];
}

async function fetchPermissionsByCodes(
  connection: mysql.PoolConnection,
  codes: string[],
) {
  if (codes.length === 0) {
    return [] as ExistingPermissionRow[];
  }

  const placeholders = codes.map(() => '?').join(', ');
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, code, status
      FROM admin_permission
      WHERE code IN (${placeholders})
    `,
    codes,
  );

  return rows as ExistingPermissionRow[];
}

async function deletePermissionsByCodes(
  connection: mysql.PoolConnection,
  codes: readonly string[],
) {
  if (codes.length === 0) {
    return;
  }

  const placeholders = codes.map(() => '?').join(', ');
  await connection.execute(
    `
      DELETE arp
      FROM admin_role_permission arp
      INNER JOIN admin_permission ap ON ap.id = arp.permission_id
      WHERE ap.code IN (${placeholders})
    `,
    [...codes],
  );

  await connection.execute(
    `
      DELETE FROM admin_permission
      WHERE code IN (${placeholders})
    `,
    [...codes],
  );
}

async function fetchRoleIdsByPermissionCodes(
  connection: mysql.PoolConnection,
  codes: string[],
) {
  if (codes.length === 0) {
    return new Map<string, string[]>();
  }

  const placeholders = codes.map(() => '?').join(', ');
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT arp.role_id, ap.code
      FROM admin_role_permission arp
      INNER JOIN admin_permission ap ON ap.id = arp.permission_id
      WHERE ap.code IN (${placeholders})
    `,
    codes,
  );

  const rolesByCode = new Map<string, string[]>();
  for (const row of rows as Array<{ role_id: number | string; code: string }>) {
    const roleIds = rolesByCode.get(row.code) ?? [];
    roleIds.push(String(row.role_id));
    rolesByCode.set(row.code, roleIds);
  }

  return rolesByCode;
}

async function syncAdminPermissionCatalog() {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await deletePermissionsByCodes(connection, OBSOLETE_PERMISSION_CODES);

    const existingPermissions = await fetchPermissionsByCodes(
      connection,
      ADMIN_PERMISSION_DEFINITIONS.map((item) => item.code),
    );
    const existingByCode = new Map(
      existingPermissions.map((item) => [item.code, item]),
    );
    const codeToId = new Map<string, string>();

    for (const definition of ADMIN_PERMISSION_DEFINITIONS) {
      const existing = existingByCode.get(definition.code);
      const parentId = definition.parentCode
        ? codeToId.get(definition.parentCode) ?? null
        : null;

      if (existing) {
        await connection.execute(
          `
            UPDATE admin_permission
            SET
              name = ?,
              module = ?,
              action = ?,
              parent_id = ?,
              sort = ?
            WHERE id = ?
          `,
          [
            definition.name,
            definition.module,
            toPermissionActionCode(definition.action),
            parentId,
            definition.sort,
            existing.id,
          ],
        );
        codeToId.set(definition.code, String(existing.id));
        continue;
      }

      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `
          INSERT INTO admin_permission (
            code,
            name,
            module,
            action,
            parent_id,
            status,
            sort,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          definition.code,
          definition.name,
          definition.module,
          toPermissionActionCode(definition.action),
          parentId,
          PERMISSION_STATUS_ACTIVE,
          definition.sort,
        ],
      );
      codeToId.set(definition.code, String(result.insertId));
    }

    const rootCodes = ADMIN_PERMISSION_DEFINITIONS.filter(
      (item) => !item.parentCode,
    ).map((item) => item.code);
    const roleIdsByRootCode = await fetchRoleIdsByPermissionCodes(
      connection,
      rootCodes,
    );

    for (const rootCode of rootCodes) {
      const childDefinitions = getAdminPermissionChildren(rootCode);
      const roleIds = roleIdsByRootCode.get(rootCode) ?? [];

      for (const child of childDefinitions) {
        const permissionId = codeToId.get(child.code);
        if (!permissionId) {
          continue;
        }

        for (const roleId of roleIds) {
          await connection.execute(
            `
              INSERT IGNORE INTO admin_role_permission (role_id, permission_id, created_at)
              VALUES (?, ?, NOW())
            `,
            [roleId, permissionId],
          );
        }
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function ensureAdminPermissionCatalogSynced(force = false) {
  if (!syncPromise || force) {
    syncPromise = syncAdminPermissionCatalog().catch((error) => {
      syncPromise = null;
      throw error;
    });
  }

  return syncPromise;
}
