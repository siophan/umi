import type mysql from 'mysql2/promise';

import { ADMIN_PERMISSION_DEFINITIONS } from '@umi/shared';

import { getDbPool } from '../../lib/db';

const ACTION_CODE_MAP = {
  view: 10,
  create: 20,
  edit: 30,
  manage: 40,
} as const;

const PERMISSION_STATUS_ACTIVE = 10;
const OBSOLETE_PERMISSION_CODES = [
  'user.manage',
  'shop.manage',
  'brand.manage',
  'product.manage',
  'guess.manage',
  'guess.create.view',
  'order.manage',
  'order.logistics.view',
  'marketing.manage',
  'community.manage',
  'community.live.danmaku.view',
  'system.manage',
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
