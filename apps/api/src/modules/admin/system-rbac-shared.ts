import type mysql from 'mysql2/promise';

import {
  findAdminPermissionDefinitionByCode,
  getAdminPermissionChildren,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  PERMISSION_STATUS_ACTIVE,
  ROLE_STATUS_ACTIVE,
  uniq,
} from './system-shared';

export type AdminRoleRow = {
  id: number | string;
  code: string;
  name: string;
  description: string | null;
  status: number | string;
  is_system: number | boolean;
  sort: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  member_count: number | string;
  permission_count: number | string;
  permission_modules: string | null;
};

export type AdminPermissionRow = {
  id: number | string;
  code: string;
  name: string;
  module: string | null;
  action: number | string | null;
  parent_id: number | string | null;
  status: number | string;
  sort: number | string;
  role_id: number | string | null;
};

export async function fetchAdminRolesWithStats() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ar.id,
        ar.code,
        ar.name,
        ar.description,
        ar.status,
        ar.is_system,
        ar.sort,
        ar.created_at,
        ar.updated_at,
        COUNT(DISTINCT aur.admin_user_id) AS member_count,
        COUNT(DISTINCT CASE
          WHEN ap.status = ${PERMISSION_STATUS_ACTIVE} THEN arp.permission_id
          ELSE NULL
        END) AS permission_count,
        GROUP_CONCAT(DISTINCT CASE
          WHEN ap.status = ${PERMISSION_STATUS_ACTIVE} THEN COALESCE(ap.module, '未分组')
          ELSE NULL
        END ORDER BY ap.sort ASC, ap.id ASC SEPARATOR ',') AS permission_modules
      FROM admin_role ar
      LEFT JOIN admin_user_role aur ON aur.role_id = ar.id
      LEFT JOIN admin_role_permission arp ON arp.role_id = ar.id
      LEFT JOIN admin_permission ap ON ap.id = arp.permission_id
      GROUP BY
        ar.id,
        ar.code,
        ar.name,
        ar.description,
        ar.status,
        ar.is_system,
        ar.sort,
        ar.created_at,
        ar.updated_at
      ORDER BY ar.sort ASC, ar.id ASC
    `,
  );

  return rows as AdminRoleRow[];
}

export async function findAdminRoleById(
  db: mysql.Pool | mysql.PoolConnection,
  roleId: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        code,
        name,
        description,
        status,
        is_system,
        sort,
        created_at,
        updated_at,
        0 AS member_count,
        0 AS permission_count,
        NULL AS permission_modules
      FROM admin_role
      WHERE id = ?
      LIMIT 1
    `,
    [roleId],
  );

  return (rows[0] as AdminRoleRow | undefined) ?? null;
}

export async function fetchActivePermissionsByIds(
  db: mysql.Pool | mysql.PoolConnection,
  permissionIds: string[],
) {
  if (permissionIds.length === 0) {
    return [];
  }

  const placeholders = permissionIds.map(() => '?').join(', ');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM admin_permission
      WHERE id IN (${placeholders})
        AND status = ?
    `,
    [...permissionIds, PERMISSION_STATUS_ACTIVE],
  );

  return rows.map((row) => String(row.id));
}

export async function fetchPermissionsByIds(
  db: mysql.Pool | mysql.PoolConnection,
  permissionIds: string[],
) {
  if (permissionIds.length === 0) {
    return [] as Array<{ id: string; code: string }>;
  }

  const placeholders = permissionIds.map(() => '?').join(', ');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, code
      FROM admin_permission
      WHERE id IN (${placeholders})
    `,
    permissionIds,
  );

  return (rows as Array<{ id: number | string; code: string }>).map((row) => ({
    id: String(row.id),
    code: row.code,
  }));
}

export async function fetchActivePermissionIdsByCodes(
  db: mysql.Pool | mysql.PoolConnection,
  codes: string[],
) {
  if (codes.length === 0) {
    return [] as string[];
  }

  const placeholders = codes.map(() => '?').join(', ');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, code
      FROM admin_permission
      WHERE code IN (${placeholders})
        AND status = ?
    `,
    [...codes, PERMISSION_STATUS_ACTIVE],
  );

  return (rows as Array<{ id: number | string; code: string }>).map((row) =>
    String(row.id),
  );
}

export async function expandRolePermissionIds(
  db: mysql.Pool | mysql.PoolConnection,
  permissionIds: string[],
) {
  const selectedPermissions = await fetchPermissionsByIds(db, permissionIds);
  const expandedCodes = uniq(
    selectedPermissions.flatMap((permission) => {
      const definition = findAdminPermissionDefinitionByCode(permission.code);
      if (!definition) {
        return [permission.code];
      }

      const childCodes = getAdminPermissionChildren(definition.code).map(
        (item) => item.code,
      );
      return [permission.code, ...childCodes];
    }),
  );

  return fetchActivePermissionIdsByCodes(db, expandedCodes);
}

export async function fetchAdminPermissionsByRole() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ap.id,
        ap.code,
        ap.name,
        ap.module,
        ap.action,
        ap.parent_id,
        ap.status,
        ap.sort,
        arp.role_id
      FROM admin_permission ap
      LEFT JOIN admin_role_permission arp ON arp.permission_id = ap.id
      WHERE ap.status = ?
      ORDER BY COALESCE(ap.module, '未分组') ASC, ap.sort ASC, ap.id ASC, arp.role_id ASC
    `,
    [PERMISSION_STATUS_ACTIVE],
  );

  return rows as AdminPermissionRow[];
}

export async function fetchAdminPermissionRows() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ap.id,
        ap.code,
        ap.name,
        ap.module,
        ap.action,
        ap.parent_id,
        parent.name AS parent_name,
        ap.status,
        ap.sort,
        COUNT(DISTINCT arp.role_id) AS assigned_role_count
      FROM admin_permission ap
      LEFT JOIN admin_permission parent ON parent.id = ap.parent_id
      LEFT JOIN admin_role_permission arp ON arp.permission_id = ap.id
      GROUP BY
        ap.id,
        ap.code,
        ap.name,
        ap.module,
        ap.action,
        ap.parent_id,
        parent.name,
        ap.status,
        ap.sort
      ORDER BY COALESCE(ap.module, '未分组') ASC, ap.sort ASC, ap.id ASC
    `,
  );

  return rows as Array<
    AdminPermissionRow & {
      parent_name: string | null;
      assigned_role_count: number | string;
    }
  >;
}

export async function fetchAdminPermissionById(permissionId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, code, name, module, action, parent_id, status, sort
      FROM admin_permission
      WHERE id = ?
      LIMIT 1
    `,
    [permissionId],
  );

  return (rows[0] as AdminPermissionRow | undefined) ?? null;
}

export async function findAdminPermissionByCode(
  db: mysql.Pool | mysql.PoolConnection,
  code: string,
  excludeId?: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM admin_permission
      WHERE code = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `,
    excludeId ? [code, excludeId] : [code],
  );

  return rows.length > 0;
}

export async function wouldCreatePermissionCycle(permissionId: string, parentId: string) {
  let currentId: string | null = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === permissionId) {
      return true;
    }
    if (visited.has(currentId)) {
      return true;
    }
    visited.add(currentId);
    const node = await fetchAdminPermissionById(currentId);
    currentId = node?.parent_id == null ? null : String(node.parent_id);
  }

  return false;
}

export async function fetchAdminPermissionTreeRows(
  db: mysql.Pool | mysql.PoolConnection,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, parent_id
      FROM admin_permission
    `,
  );

  return rows as Array<{
    id: number | string;
    parent_id: number | string | null;
  }>;
}

export async function collectAdminPermissionDescendantIds(
  db: mysql.Pool | mysql.PoolConnection,
  permissionId: string,
) {
  const rows = await fetchAdminPermissionTreeRows(db);
  const childrenByParent = new Map<string, string[]>();

  for (const row of rows) {
    if (row.parent_id == null) {
      continue;
    }

    const parentId = String(row.parent_id);
    const currentChildren = childrenByParent.get(parentId) ?? [];
    currentChildren.push(String(row.id));
    childrenByParent.set(parentId, currentChildren);
  }

  const descendants: string[] = [];
  const queue = [...(childrenByParent.get(permissionId) ?? [])];
  const seen = new Set(queue);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    descendants.push(currentId);

    for (const childId of childrenByParent.get(currentId) ?? []) {
      if (seen.has(childId)) {
        continue;
      }
      seen.add(childId);
      queue.push(childId);
    }
  }

  return descendants;
}

export { ROLE_STATUS_ACTIVE };
