import { findAdminPermissionDefinitionByCode, getAdminPermissionChildren, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { PERMISSION_STATUS_ACTIVE, ROLE_STATUS_ACTIVE, uniq, } from './system-shared';
export async function fetchAdminRolesWithStats() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `);
    return rows;
}
export async function findAdminRoleById(db, roleId) {
    const [rows] = await db.execute(`
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
    `, [roleId]);
    return rows[0] ?? null;
}
export async function fetchActivePermissionsByIds(db, permissionIds) {
    if (permissionIds.length === 0) {
        return [];
    }
    const placeholders = permissionIds.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_permission
      WHERE id IN (${placeholders})
        AND status = ?
    `, [...permissionIds, PERMISSION_STATUS_ACTIVE]);
    return rows.map((row) => String(row.id));
}
export async function fetchPermissionsByIds(db, permissionIds) {
    if (permissionIds.length === 0) {
        return [];
    }
    const placeholders = permissionIds.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id, code
      FROM admin_permission
      WHERE id IN (${placeholders})
    `, permissionIds);
    return rows.map((row) => ({
        id: String(row.id),
        code: row.code,
    }));
}
export async function fetchActivePermissionIdsByCodes(db, codes) {
    if (codes.length === 0) {
        return [];
    }
    const placeholders = codes.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id, code
      FROM admin_permission
      WHERE code IN (${placeholders})
        AND status = ?
    `, [...codes, PERMISSION_STATUS_ACTIVE]);
    return rows.map((row) => String(row.id));
}
export async function expandRolePermissionIds(db, permissionIds) {
    const selectedPermissions = await fetchPermissionsByIds(db, permissionIds);
    const expandedCodes = uniq(selectedPermissions.flatMap((permission) => {
        const definition = findAdminPermissionDefinitionByCode(permission.code);
        if (!definition) {
            return [permission.code];
        }
        const childCodes = getAdminPermissionChildren(definition.code).map((item) => item.code);
        return [permission.code, ...childCodes];
    }));
    return fetchActivePermissionIdsByCodes(db, expandedCodes);
}
export async function fetchAdminPermissionsByRole() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [PERMISSION_STATUS_ACTIVE]);
    return rows;
}
export async function fetchAdminPermissionRows() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `);
    return rows;
}
export async function fetchAdminPermissionById(permissionId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id, code, name, module, action, parent_id, status, sort
      FROM admin_permission
      WHERE id = ?
      LIMIT 1
    `, [permissionId]);
    return rows[0] ?? null;
}
export async function findAdminPermissionByCode(db, code, excludeId) {
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_permission
      WHERE code = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `, excludeId ? [code, excludeId] : [code]);
    return rows.length > 0;
}
export async function wouldCreatePermissionCycle(permissionId, parentId) {
    let currentId = parentId;
    const visited = new Set();
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
export async function fetchAdminPermissionTreeRows(db) {
    const [rows] = await db.execute(`
      SELECT id, parent_id
      FROM admin_permission
    `);
    return rows;
}
export async function collectAdminPermissionDescendantIds(db, permissionId) {
    const rows = await fetchAdminPermissionTreeRows(db);
    const childrenByParent = new Map();
    for (const row of rows) {
        if (row.parent_id == null) {
            continue;
        }
        const parentId = String(row.parent_id);
        const currentChildren = childrenByParent.get(parentId) ?? [];
        currentChildren.push(String(row.id));
        childrenByParent.set(parentId, currentChildren);
    }
    const descendants = [];
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
