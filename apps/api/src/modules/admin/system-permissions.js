import { findAdminPermissionDefinitionByCode, toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { ensureAdminPermissionCatalogSynced } from './permission-catalog';
import { mapPermissionAction, mapPermissionStatus, mapRoleStatus, normalizeAdminPermissionAction, normalizeAdminPermissionCode, normalizeAdminPermissionModule, normalizeAdminPermissionName, normalizeAdminPermissionParentId, normalizePermissionLevel, PERMISSION_STATUS_ACTIVE, permissionLevelWeight, ROLE_STATUS_ACTIVE, toNumber, toPermissionActionCode, toPermissionStatusCode, uniq, } from './system-shared';
import { collectAdminPermissionDescendantIds, fetchAdminPermissionById, fetchAdminPermissionRows, fetchAdminPermissionsByRole, fetchAdminRolesWithStats, findAdminPermissionByCode, wouldCreatePermissionCycle, } from './system-rbac-shared';
export async function getAdminPermissionsMatrix() {
    await ensureAdminPermissionCatalogSynced();
    const [roleRows, permissionRows] = await Promise.all([
        fetchAdminRolesWithStats(),
        fetchAdminPermissionsByRole(),
    ]);
    const activeRoles = roleRows.filter((row) => Number(row.status ?? 0) === ROLE_STATUS_ACTIVE);
    const roleItems = activeRoles.map((row) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        status: mapRoleStatus(row.status),
        isSystem: Boolean(row.is_system),
    }));
    const permissionsByModule = new Map();
    const permissionRoleMap = new Map();
    for (const row of permissionRows) {
        const moduleName = row.module?.trim() || '未分组';
        const permissionId = String(row.id);
        let moduleEntry = permissionsByModule.get(moduleName);
        if (!moduleEntry) {
            moduleEntry = {
                module: moduleName,
                permissions: [],
                cells: [],
            };
            permissionsByModule.set(moduleName, moduleEntry);
        }
        if (!moduleEntry.permissions.some((permission) => permission.id === permissionId)) {
            moduleEntry.permissions.push({
                id: permissionId,
                code: row.code,
                name: row.name,
                action: mapPermissionAction(row.action),
                parentId: row.parent_id == null ? null : String(row.parent_id),
                enabledRoleIds: [],
            });
        }
        if (row.role_id == null) {
            continue;
        }
        const roleId = String(row.role_id);
        let rolePermissionMap = permissionRoleMap.get(moduleName);
        if (!rolePermissionMap) {
            rolePermissionMap = new Map();
            permissionRoleMap.set(moduleName, rolePermissionMap);
        }
        const currentRows = rolePermissionMap.get(roleId) ?? [];
        currentRows.push(row);
        rolePermissionMap.set(roleId, currentRows);
    }
    for (const moduleEntry of permissionsByModule.values()) {
        for (const permission of moduleEntry.permissions) {
            const enabledRoleIds = permissionRows
                .filter((row) => String(row.id) === permission.id &&
                row.role_id != null &&
                activeRoles.some((role) => String(role.id) === String(row.role_id)))
                .map((row) => String(row.role_id));
            permission.enabledRoleIds = uniq(enabledRoleIds);
        }
        const modulePermissionMap = permissionRoleMap.get(moduleEntry.module) ?? new Map();
        moduleEntry.cells = roleItems.map((role) => {
            const rowsForRole = modulePermissionMap.get(role.id) ?? [];
            const permissionCodes = uniq(rowsForRole.map((row) => row.code));
            const permissionNames = uniq(rowsForRole.map((row) => row.name));
            const level = rowsForRole.reduce((currentLevel, row) => {
                const nextLevel = normalizePermissionLevel(mapPermissionAction(row.action));
                return permissionLevelWeight(nextLevel) > permissionLevelWeight(currentLevel)
                    ? nextLevel
                    : currentLevel;
            }, 'none');
            return {
                roleId: role.id,
                roleCode: role.code,
                roleName: role.name,
                level,
                permissionCodes,
                permissionNames,
            };
        });
    }
    const modules = Array.from(permissionsByModule.values()).sort((left, right) => left.module.localeCompare(right.module, 'zh-CN'));
    return {
        roles: roleItems,
        modules,
        summary: {
            roles: roleItems.length,
            modules: modules.length,
            permissions: permissionRows
                .filter((row) => Number(row.status ?? 0) === PERMISSION_STATUS_ACTIVE)
                .map((row) => String(row.id))
                .filter((value, index, array) => array.indexOf(value) === index).length,
        },
    };
}
export async function getAdminPermissions() {
    await ensureAdminPermissionCatalogSynced();
    const rows = await fetchAdminPermissionRows();
    const items = rows.map((row) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        module: row.module?.trim() || '未分组',
        action: mapPermissionAction(row.action),
        parentId: row.parent_id == null ? null : String(row.parent_id),
        parentName: row.parent_name ?? null,
        status: mapPermissionStatus(row.status),
        sort: toNumber(row.sort),
        assignedRoleCount: toNumber(row.assigned_role_count),
        isBuiltIn: findAdminPermissionDefinitionByCode(row.code) != null,
    }));
    return {
        items,
        summary: {
            total: items.length,
            active: items.filter((item) => item.status === 'active').length,
            disabled: items.filter((item) => item.status === 'disabled').length,
            modules: uniq(items.map((item) => item.module)).length,
        },
    };
}
export async function createAdminPermission(payload) {
    const code = normalizeAdminPermissionCode(payload.code);
    const name = normalizeAdminPermissionName(payload.name);
    const module = normalizeAdminPermissionModule(payload.module);
    const action = normalizeAdminPermissionAction(payload.action);
    const parentId = normalizeAdminPermissionParentId(payload.parentId ? String(payload.parentId) : null);
    const sort = toNumber(payload.sort ?? 0);
    const status = toPermissionStatusCode(payload.status ?? 'active');
    const db = getDbPool();
    if (await findAdminPermissionByCode(db, code)) {
        throw new Error('权限编码已存在');
    }
    if (parentId) {
        const parent = await fetchAdminPermissionById(parentId);
        if (!parent) {
            throw new Error('父权限不存在');
        }
    }
    const [result] = await db.execute(`
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
    `, [code, name, module, toPermissionActionCode(action), parentId, status, sort]);
    return {
        id: toEntityId(result.insertId),
    };
}
export async function updateAdminPermission(permissionId, payload) {
    const permission = await fetchAdminPermissionById(permissionId);
    if (!permission) {
        throw new Error('权限不存在');
    }
    if (findAdminPermissionDefinitionByCode(permission.code)) {
        throw new Error('系统内置权限不允许编辑');
    }
    const code = normalizeAdminPermissionCode(payload.code);
    const name = normalizeAdminPermissionName(payload.name);
    const module = normalizeAdminPermissionModule(payload.module);
    const action = normalizeAdminPermissionAction(payload.action);
    const parentId = normalizeAdminPermissionParentId(payload.parentId ? String(payload.parentId) : null);
    const sort = toNumber(payload.sort ?? 0);
    const db = getDbPool();
    if (await findAdminPermissionByCode(db, code, permissionId)) {
        throw new Error('权限编码已存在');
    }
    if (parentId) {
        if (parentId === permissionId) {
            throw new Error('父权限不能是自己');
        }
        const parent = await fetchAdminPermissionById(parentId);
        if (!parent) {
            throw new Error('父权限不存在');
        }
        if (await wouldCreatePermissionCycle(permissionId, parentId)) {
            throw new Error('父权限不能是自己的子权限');
        }
    }
    await db.execute(`
      UPDATE admin_permission
      SET
        code = ?,
        name = ?,
        module = ?,
        action = ?,
        parent_id = ?,
        sort = ?
      WHERE id = ?
    `, [code, name, module, toPermissionActionCode(action), parentId, sort, permissionId]);
    return {
        id: toEntityId(permission.id),
    };
}
export async function updateAdminPermissionStatus(permissionId, payload) {
    const permission = await fetchAdminPermissionById(permissionId);
    if (!permission) {
        throw new Error('权限不存在');
    }
    const db = getDbPool();
    const targetStatus = toPermissionStatusCode(payload.status);
    if (payload.status === 'disabled') {
        const descendantIds = await collectAdminPermissionDescendantIds(db, permissionId);
        const affectedIds = [permissionId, ...descendantIds];
        const placeholders = affectedIds.map(() => '?').join(', ');
        await db.execute(`
        UPDATE admin_permission
        SET status = ?
        WHERE id IN (${placeholders})
      `, [targetStatus, ...affectedIds]);
    }
    else {
        await db.execute(`
        UPDATE admin_permission
        SET status = ?
        WHERE id = ?
      `, [targetStatus, permissionId]);
    }
    return {
        id: toEntityId(permission.id),
        status: payload.status,
    };
}
