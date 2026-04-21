import type mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import type {
  AdminSystemUserMutationResult,
  CreateAdminSystemUserPayload,
  ResetAdminSystemUserPasswordPayload,
  UpdateAdminSystemUserPayload,
  UpdateAdminSystemUserStatusPayload,
  UpdateAdminSystemUserStatusResult,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  ADMIN_STATUS_ACTIVE,
  ADMIN_STATUS_DISABLED,
  mapAdminStatus,
  normalizeAdminDisplayName,
  normalizeAdminPassword,
  normalizeAdminRoleIds,
  normalizeAdminUsername,
  normalizeOptionalContact,
  ROLE_STATUS_ACTIVE,
  splitCsv,
  toIsoString,
} from './system-shared';

type AdminSystemUserRow = {
  id: number | string;
  username: string;
  display_name: string | null;
  phone_number: string | null;
  email: string | null;
  status: number | string;
  last_login_at: Date | string | null;
  created_at: Date | string;
  role_names: string | null;
  role_codes: string | null;
  role_ids: string | null;
};

export interface AdminSystemUserItem {
  id: string;
  username: string;
  displayName: string;
  phoneNumber: string | null;
  email: string | null;
  role: string;
  roleCodes: string[];
  roleIds: string[];
  status: 'active' | 'disabled';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSystemUserListResult {
  items: AdminSystemUserItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
  };
}

async function fetchAdminSystemUsers() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        au.id,
        au.username,
        au.display_name,
        au.phone_number,
        au.email,
        au.status,
        au.last_login_at,
        au.created_at,
        GROUP_CONCAT(DISTINCT ar.name ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_names,
        GROUP_CONCAT(DISTINCT ar.code ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_codes,
        GROUP_CONCAT(DISTINCT CAST(ar.id AS CHAR) ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_ids
      FROM admin_user au
      LEFT JOIN admin_user_role aur ON aur.admin_user_id = au.id
      LEFT JOIN admin_role ar ON ar.id = aur.role_id
      GROUP BY
        au.id,
        au.username,
        au.display_name,
        au.phone_number,
        au.email,
        au.status,
        au.last_login_at,
        au.created_at
      ORDER BY au.last_login_at DESC, au.id DESC
    `,
  );

  return rows as AdminSystemUserRow[];
}

async function findAdminSystemUserById(
  db: mysql.Pool | mysql.PoolConnection,
  adminUserId: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        username,
        display_name,
        phone_number,
        email,
        status,
        last_login_at,
        created_at,
        NULL AS role_names,
        NULL AS role_codes,
        NULL AS role_ids
      FROM admin_user
      WHERE id = ?
      LIMIT 1
    `,
    [adminUserId],
  );

  return (rows[0] as AdminSystemUserRow | undefined) ?? null;
}

async function findAdminUserByUsername(
  db: mysql.Pool | mysql.PoolConnection,
  username: string,
  excludeId?: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM admin_user
      WHERE username = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `,
    excludeId ? [username, excludeId] : [username],
  );

  return rows.length > 0;
}

async function findAdminUserByPhoneNumber(
  db: mysql.Pool | mysql.PoolConnection,
  phoneNumber: string,
  excludeId?: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM admin_user
      WHERE phone_number = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `,
    excludeId ? [phoneNumber, excludeId] : [phoneNumber],
  );

  return rows.length > 0;
}

async function fetchActiveRolesByIds(
  db: mysql.Pool | mysql.PoolConnection,
  roleIds: string[],
) {
  const placeholders = roleIds.map(() => '?').join(', ');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM admin_role
      WHERE id IN (${placeholders})
        AND status = ?
    `,
    [...roleIds, ROLE_STATUS_ACTIVE],
  );

  return rows.map((row) => String(row.id));
}

async function replaceAdminUserRoles(
  db: mysql.PoolConnection,
  adminUserId: string,
  roleIds: string[],
) {
  await db.execute(
    `
      DELETE FROM admin_user_role
      WHERE admin_user_id = ?
    `,
    [adminUserId],
  );

  for (const roleId of roleIds) {
    await db.execute(
      `
        INSERT INTO admin_user_role (admin_user_id, role_id, created_at)
        VALUES (?, ?, NOW())
      `,
      [adminUserId, roleId],
    );
  }
}

export async function getAdminSystemUsers(): Promise<AdminSystemUserListResult> {
  const rows = await fetchAdminSystemUsers();
  const items = rows.map<AdminSystemUserItem>((row) => ({
    id: String(row.id),
    username: row.username,
    displayName: row.display_name || row.username,
    phoneNumber: row.phone_number ?? null,
    email: row.email ?? null,
    role: splitCsv(row.role_names).join(' / ') || '未分配角色',
    roleCodes: splitCsv(row.role_codes),
    roleIds: splitCsv(row.role_ids),
    status: mapAdminStatus(row.status),
    lastLoginAt: toIsoString(row.last_login_at),
    createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
  }));

  return {
    items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      disabled: items.filter((item) => item.status === 'disabled').length,
    },
  };
}

export async function createAdminSystemUser(
  payload: CreateAdminSystemUserPayload,
): Promise<AdminSystemUserMutationResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const username = normalizeAdminUsername(payload.username);
    const displayName = normalizeAdminDisplayName(payload.displayName);
    const password = normalizeAdminPassword(payload.password);
    const phoneNumber = normalizeOptionalContact(payload.phoneNumber, 20);
    const email = normalizeOptionalContact(payload.email, 100);
    const roleIds = normalizeAdminRoleIds(payload.roleIds);
    const status = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;

    if (await findAdminUserByUsername(connection, username)) {
      throw new Error('系统用户名已存在');
    }

    if (phoneNumber && (await findAdminUserByPhoneNumber(connection, phoneNumber))) {
      throw new Error('手机号已被其他系统用户占用');
    }

    const activeRoleIds = await fetchActiveRolesByIds(connection, roleIds);
    if (activeRoleIds.length !== roleIds.length) {
      throw new Error('存在无效角色或停用角色');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO admin_user (
          username,
          password_hash,
          display_name,
          phone_number,
          email,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [username, passwordHash, displayName, phoneNumber, email, status],
    );

    const adminUserId = String(result.insertId);
    await replaceAdminUserRoles(connection, adminUserId, activeRoleIds);
    await connection.commit();

    return { id: toEntityId(adminUserId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminSystemUser(
  adminUserId: string,
  payload: UpdateAdminSystemUserPayload,
): Promise<AdminSystemUserMutationResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const user = await findAdminSystemUserById(connection, adminUserId);
    if (!user) {
      throw new Error('系统用户不存在');
    }

    const username = normalizeAdminUsername(payload.username);
    const displayName = normalizeAdminDisplayName(payload.displayName);
    const phoneNumber = normalizeOptionalContact(payload.phoneNumber, 20);
    const email = normalizeOptionalContact(payload.email, 100);
    const roleIds = normalizeAdminRoleIds(payload.roleIds);

    if (await findAdminUserByUsername(connection, username, adminUserId)) {
      throw new Error('系统用户名已存在');
    }

    if (
      phoneNumber &&
      (await findAdminUserByPhoneNumber(connection, phoneNumber, adminUserId))
    ) {
      throw new Error('手机号已被其他系统用户占用');
    }

    const activeRoleIds = await fetchActiveRolesByIds(connection, roleIds);
    if (activeRoleIds.length !== roleIds.length) {
      throw new Error('存在无效角色或停用角色');
    }

    await connection.execute(
      `
        UPDATE admin_user
        SET username = ?,
            display_name = ?,
            phone_number = ?,
            email = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [username, displayName, phoneNumber, email, adminUserId],
    );

    await replaceAdminUserRoles(connection, adminUserId, activeRoleIds);
    await connection.commit();

    return { id: toEntityId(adminUserId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function resetAdminSystemUserPassword(
  adminUserId: string,
  payload: ResetAdminSystemUserPasswordPayload,
): Promise<AdminSystemUserMutationResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const user = await findAdminSystemUserById(connection, adminUserId);
    if (!user) {
      throw new Error('系统用户不存在');
    }

    const passwordHash = await bcrypt.hash(
      normalizeAdminPassword(payload.newPassword),
      10,
    );

    await connection.execute(
      `
        UPDATE admin_user
        SET password_hash = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [passwordHash, adminUserId],
    );

    await connection.commit();

    return { id: toEntityId(adminUserId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminSystemUserStatus(
  adminUserId: string,
  payload: UpdateAdminSystemUserStatusPayload,
  operatorAdminUserId: string,
): Promise<UpdateAdminSystemUserStatusResult> {
  const db = getDbPool();
  const targetStatus = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const user = await findAdminSystemUserById(connection, adminUserId);
    if (!user) {
      throw new Error('系统用户不存在');
    }

    if (adminUserId === operatorAdminUserId && targetStatus === ADMIN_STATUS_DISABLED) {
      throw new Error('不能停用当前登录账号');
    }

    await connection.execute(
      `
        UPDATE admin_user
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [targetStatus, adminUserId],
    );

    await connection.commit();

    return {
      id: toEntityId(user.id),
      status: payload.status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
