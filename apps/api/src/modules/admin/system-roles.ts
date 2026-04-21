import type mysql from 'mysql2/promise';

import type {
  CreateAdminRolePayload,
  CreateAdminRoleResult,
  UpdateAdminRolePayload,
  UpdateAdminRolePermissionsPayload,
  UpdateAdminRolePermissionsResult,
  UpdateAdminRoleResult,
  UpdateAdminRoleStatusPayload,
  UpdateAdminRoleStatusResult,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { ensureAdminPermissionCatalogSynced } from './permission-catalog';
import {
  ADMIN_STATUS_ACTIVE,
  ADMIN_STATUS_DISABLED,
  mapRoleModules,
  mapRolePermissionRange,
  mapRoleStatus,
  ROLE_STATUS_ACTIVE,
  toIsoString,
  toNumber,
  uniq,
} from './system-shared';
import {
  expandRolePermissionIds,
  fetchActivePermissionsByIds,
  fetchAdminRolesWithStats,
  findAdminRoleById,
} from './system-rbac-shared';

export interface AdminRoleListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissionRange: string;
  permissionModules: string[];
  memberCount: number;
  permissionCount: number;
  status: 'active' | 'disabled';
  isSystem: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoleListResult {
  items: AdminRoleListItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    members: number;
  };
}

export async function updateAdminRoleStatus(
  roleId: string,
  payload: UpdateAdminRoleStatusPayload,
): Promise<UpdateAdminRoleStatusResult> {
  const db = getDbPool();
  const targetStatus = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const role = await findAdminRoleById(connection, roleId);
    if (!role) {
      throw new Error('角色不存在');
    }

    if (Boolean(role.is_system) && targetStatus === ADMIN_STATUS_DISABLED) {
      throw new Error('系统内置角色不允许停用');
    }

    await connection.execute(
      `
        UPDATE admin_role
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [targetStatus, roleId],
    );

    await connection.commit();

    return {
      id: toEntityId(role.id),
      status: payload.status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminRolePermissions(
  roleId: string,
  payload: UpdateAdminRolePermissionsPayload,
): Promise<UpdateAdminRolePermissionsResult> {
  await ensureAdminPermissionCatalogSynced();
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const role = await findAdminRoleById(connection, roleId);
    if (!role) {
      throw new Error('角色不存在');
    }

    if (Number(role.status ?? 0) !== ROLE_STATUS_ACTIVE) {
      throw new Error('停用角色不允许分配权限');
    }

    const permissionIds = uniq(
      (payload.permissionIds ?? [])
        .map((item) => String(item ?? '').trim())
        .filter(Boolean),
    );
    const activeSelectedPermissionIds = await fetchActivePermissionsByIds(
      connection,
      permissionIds,
    );

    if (activeSelectedPermissionIds.length !== permissionIds.length) {
      throw new Error('存在无效权限或停用权限');
    }

    const activePermissionIds = await expandRolePermissionIds(
      connection,
      activeSelectedPermissionIds,
    );

    await connection.execute(
      `
        DELETE FROM admin_role_permission
        WHERE role_id = ?
      `,
      [roleId],
    );

    for (const permissionId of activePermissionIds) {
      await connection.execute(
        `
          INSERT INTO admin_role_permission (role_id, permission_id, created_at)
          VALUES (?, ?, NOW())
        `,
        [roleId, permissionId],
      );
    }

    await connection.commit();

    return {
      id: toEntityId(role.id),
      permissionIds: activePermissionIds.map((item) => toEntityId(item)),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createAdminRole(
  payload: CreateAdminRolePayload,
): Promise<CreateAdminRoleResult> {
  const code = payload.code.trim();
  const name = payload.name.trim();
  if (!code) throw new Error('角色编码不能为空');
  if (!name) throw new Error('角色名称不能为空');

  const db = getDbPool();
  const [existing] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM admin_role WHERE code = ? LIMIT 1`,
    [code],
  );
  if ((existing as mysql.RowDataPacket[]).length > 0) {
    throw new Error('角色编码已存在');
  }

  const status = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
  const sort = Math.max(0, Math.trunc(Number(payload.sort ?? 0) || 0));
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO admin_role (code, name, description, status, is_system, sort, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, NOW(), NOW())`,
    [code, name, payload.description?.trim() || null, status, sort],
  );

  return { id: toEntityId(result.insertId) };
}

export async function updateAdminRole(
  roleId: string,
  payload: UpdateAdminRolePayload,
): Promise<UpdateAdminRoleResult> {
  const code = payload.code.trim();
  const name = payload.name.trim();
  if (!code) throw new Error('角色编码不能为空');
  if (!name) throw new Error('角色名称不能为空');

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const role = await findAdminRoleById(connection, roleId);
    if (!role) {
      throw new Error('角色不存在');
    }

    if (Boolean(role.is_system)) {
      throw new Error('系统内置角色不允许编辑');
    }

    const [existing] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM admin_role WHERE code = ? AND id <> ? LIMIT 1`,
      [code, roleId],
    );
    if ((existing as mysql.RowDataPacket[]).length > 0) {
      throw new Error('角色编码已存在');
    }

    const sort = Math.max(0, Math.trunc(Number(payload.sort ?? 0) || 0));

    await connection.execute(
      `
        UPDATE admin_role
        SET code = ?, name = ?, description = ?, sort = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [code, name, payload.description?.trim() || null, sort, roleId],
    );

    await connection.commit();

    return { id: toEntityId(role.id) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getAdminRoles(): Promise<AdminRoleListResult> {
  await ensureAdminPermissionCatalogSynced();
  const rows = await fetchAdminRolesWithStats();
  const items = rows.map<AdminRoleListItem>((row) => {
    const modules = mapRoleModules(row.permission_modules);

    return {
      id: String(row.id),
      code: row.code,
      name: row.name,
      description: row.description ?? null,
      permissionRange: mapRolePermissionRange(modules),
      permissionModules: modules,
      memberCount: toNumber(row.member_count),
      permissionCount: toNumber(row.permission_count),
      status: mapRoleStatus(row.status),
      isSystem: Boolean(row.is_system),
      sort: toNumber(row.sort),
      createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
      updatedAt: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
    };
  });

  return {
    items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      disabled: items.filter((item) => item.status === 'disabled').length,
      members: items.reduce((sum, item) => sum + item.memberCount, 0),
    },
  };
}
