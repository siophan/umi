import { createHmac } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import bcrypt from 'bcryptjs';
import type mysql from 'mysql2/promise';

import { findAdminPermissionDefinitionByCode, toEntityId } from '@umi/shared';
import type {
  AdminLoginPayload,
  AdminLoginResult,
  AdminProfile,
  ChangePasswordPayload,
} from '@umi/shared';

import { env } from '../../env';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { ensureAdminPermissionCatalogSynced } from './permission-catalog';

const ADMIN_STATUS_ACTIVE = 10;
const ADMIN_STATUS_DISABLED = 90;
const ROLE_STATUS_ACTIVE = 10;
const PERMISSION_STATUS_ACTIVE = 10;

type AdminUserRow = {
  id: number | string;
  username: string;
  password_hash: string;
  display_name: string | null;
  phone_number: string | null;
  email: string | null;
  status: number | string;
};

type AdminRoleRow = {
  id: number | string;
  code: string;
  name: string;
};

type AdminPermissionRow = {
  code: string;
  module: string | null;
};

type AdminTokenPayload = {
  adminUserId: string;
  exp: number;
};

export function getBearerToken(authorization?: string) {
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function signAdminPayload(payload: AdminTokenPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', env.adminTokenSecret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token: string): AdminTokenPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac('sha256', env.adminTokenSecret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  const payload = fromBase64Url<AdminTokenPayload>(encodedPayload);
  if (!payload.adminUserId || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

function mapAdminStatus(code: number) {
  return code === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}

async function findAdminUserByIdentity(identity: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        username,
        password_hash,
        display_name,
        phone_number,
        email,
        status
      FROM admin_user
      WHERE username = ?
         OR phone_number = ?
      LIMIT 1
    `,
    [identity, identity],
  );

  return (rows[0] as AdminUserRow | undefined) ?? null;
}

async function findAdminUserById(id: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        username,
        password_hash,
        display_name,
        phone_number,
        email,
        status
      FROM admin_user
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return (rows[0] as AdminUserRow | undefined) ?? null;
}

async function fetchAdminRoles(adminUserId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ar.id,
        ar.code,
        ar.name
      FROM admin_user_role aur
      INNER JOIN admin_role ar ON ar.id = aur.role_id
      WHERE aur.admin_user_id = ?
        AND ar.status = ?
      ORDER BY ar.sort ASC, ar.id ASC
    `,
    [adminUserId, ROLE_STATUS_ACTIVE],
  );

  return (rows as AdminRoleRow[]).map((row) => ({
    id: toEntityId(row.id),
    code: row.code,
    name: row.name,
  }));
}

async function fetchAdminPermissions(adminUserId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT DISTINCT ap.code, ap.module
      FROM admin_user_role aur
      INNER JOIN admin_role ar ON ar.id = aur.role_id
      INNER JOIN admin_role_permission arp ON arp.role_id = ar.id
      INNER JOIN admin_permission ap ON ap.id = arp.permission_id
      WHERE aur.admin_user_id = ?
        AND ar.status = ?
        AND ap.status = ?
      ORDER BY ap.code ASC
    `,
    [adminUserId, ROLE_STATUS_ACTIVE, PERMISSION_STATUS_ACTIVE],
  );

  return rows as AdminPermissionRow[];
}

async function sanitizeAdminUser(row: AdminUserRow): Promise<AdminProfile> {
  await ensureAdminPermissionCatalogSynced();
  const adminUserId = toEntityId(row.id);
  const roles = await fetchAdminRoles(adminUserId);
  const permissions = await fetchAdminPermissions(adminUserId);

  return {
    id: adminUserId,
    username: row.username,
    displayName: row.display_name || row.username,
    phoneNumber: row.phone_number,
    email: row.email,
    status: mapAdminStatus(Number(row.status ?? 0)),
    roles,
    permissions: permissions.map((item) => item.code),
    permissionModules: Array.from(
      new Set(
        permissions
          .map((item) => item.module?.trim() || '')
          .filter(Boolean),
      ),
    ),
  };
}

async function requireValidAdminUser(row: AdminUserRow | null) {
  if (!row) {
    throw new Error('管理员账号不存在');
  }

  if (Number(row.status ?? 0) !== ADMIN_STATUS_ACTIVE) {
    throw new Error('管理员账号已停用');
  }

  return row;
}

export async function adminLogin(
  payload: AdminLoginPayload,
  loginIp?: string | null,
): Promise<AdminLoginResult> {
  const identity = payload.username.trim();
  if (!identity) {
    throw new Error('请输入后台用户名');
  }
  if (!payload.password) {
    throw new Error('请输入密码');
  }

  const user = await requireValidAdminUser(
    await findAdminUserByIdentity(identity),
  );

  const valid = await bcrypt.compare(payload.password, user.password_hash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }

  const db = getDbPool();
  await db.execute(
    `
      UPDATE admin_user
      SET last_login_at = CURRENT_TIMESTAMP(3),
          last_login_ip = ?
      WHERE id = ?
    `,
    [loginIp ?? null, user.id],
  );

  const token = signAdminPayload({
    adminUserId: String(toEntityId(user.id)),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return {
    token,
    user: await sanitizeAdminUser(user),
  };
}

export async function getAdminByToken(token: string): Promise<AdminProfile | null> {
  const payload = verifyAdminToken(token);
  if (!payload) {
    return null;
  }

  const user = await findAdminUserById(payload.adminUserId);
  if (!user || Number(user.status ?? 0) !== ADMIN_STATUS_ACTIVE) {
    return null;
  }

  return sanitizeAdminUser(user);
}

export async function changeAdminPassword(
  adminUserId: string,
  payload: ChangePasswordPayload,
) {
  const user = await requireValidAdminUser(await findAdminUserById(adminUserId));

  if (!payload.currentPassword) {
    throw new Error('当前密码不能为空');
  }
  if (!payload.newPassword || payload.newPassword.length < 6) {
    throw new Error('新密码长度至少6位');
  }

  const valid = await bcrypt.compare(payload.currentPassword, user.password_hash);
  if (!valid) {
    throw new Error('当前密码错误');
  }

  if (payload.currentPassword === payload.newPassword) {
    throw new Error('新密码不能与当前密码相同');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
  const db = getDbPool();
  await db.execute(
    `
      UPDATE admin_user
      SET password_hash = ?
      WHERE id = ?
    `,
    [hashedPassword, adminUserId],
  );

  return { success: true as const };
}

export async function logoutAdminByToken(_token: string) {
  return { success: true as const };
}

async function resolveAdmin(
  authorization?: string,
): Promise<AdminProfile | null> {
  const token = getBearerToken(authorization);
  return token ? getAdminByToken(token) : null;
}

function matchesRoutePrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function resolveActionPermissionCode(viewCode: string, method: string) {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'GET') {
    return [viewCode];
  }

  const action =
    normalizedMethod === 'POST'
      ? 'create'
      : normalizedMethod === 'PUT' || normalizedMethod === 'PATCH'
        ? 'edit'
        : 'manage';
  const actionCode = viewCode.endsWith('.view')
    ? `${viewCode.slice(0, -'.view'.length)}.${action}`
    : `${viewCode}.${action}`;

  return findAdminPermissionDefinitionByCode(actionCode) ? [actionCode] : [viewCode];
}

function resolveAdminRoutePermissionCodes(method: string, path: string) {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === 'GET' && path === '/dashboard/stats') {
    return ['dashboard.view'];
  }

  if (matchesRoutePrefix(path, '/community/posts')) {
    return resolveActionPermissionCode('community.posts.view', method);
  }

  if (matchesRoutePrefix(path, '/community/comments')) {
    return resolveActionPermissionCode('community.comments.view', method);
  }

  if (matchesRoutePrefix(path, '/community/reports')) {
    return resolveActionPermissionCode('community.reports.view', method);
  }

  if (matchesRoutePrefix(path, '/lives')) {
    return resolveActionPermissionCode('community.live.list.view', method);
  }

  if (matchesRoutePrefix(path, '/chats')) {
    return resolveActionPermissionCode('community.chats.view', method);
  }

  if (matchesRoutePrefix(path, '/users')) {
    return resolveActionPermissionCode('user.list.view', method);
  }

  if (matchesRoutePrefix(path, '/system-users')) {
    return resolveActionPermissionCode('system.users.view', method);
  }

  if (matchesRoutePrefix(path, '/roles')) {
    return resolveActionPermissionCode('system.roles.view', method);
  }

  if (matchesRoutePrefix(path, '/permissions')) {
    return resolveActionPermissionCode('system.permissions.view', method);
  }

  if (matchesRoutePrefix(path, '/categories')) {
    return resolveActionPermissionCode('system.categories.view', method);
  }

  if (matchesRoutePrefix(path, '/notifications')) {
    return resolveActionPermissionCode('system.notifications.view', method);
  }

  if (matchesRoutePrefix(path, '/payment-settings')) {
    return resolveActionPermissionCode('system.settings.view', method);
  }

  if (matchesRoutePrefix(path, '/guesses/friends')) {
    return resolveActionPermissionCode('guess.friends.view', method);
  }

  if (matchesRoutePrefix(path, '/pk')) {
    return resolveActionPermissionCode('guess.pk.view', method);
  }

  if (matchesRoutePrefix(path, '/guesses')) {
    return resolveActionPermissionCode('guess.list.view', method);
  }

  if (matchesRoutePrefix(path, '/orders/transactions')) {
    return resolveActionPermissionCode('order.transactions.view', method);
  }

  if (matchesRoutePrefix(path, '/orders/logistics')) {
    return resolveActionPermissionCode('order.list.view', method);
  }

  if (matchesRoutePrefix(path, '/orders/consign')) {
    return resolveActionPermissionCode('order.warehouse.consign.view', method);
  }

  if (matchesRoutePrefix(path, '/orders')) {
    return resolveActionPermissionCode('order.list.view', method);
  }

  if (matchesRoutePrefix(path, '/equity')) {
    return resolveActionPermissionCode('marketing.equity.view', method);
  }

  if (matchesRoutePrefix(path, '/banners')) {
    return resolveActionPermissionCode('marketing.banners.view', method);
  }

  if (matchesRoutePrefix(path, '/checkin/rewards')) {
    return resolveActionPermissionCode('marketing.checkin.view', method);
  }

  if (matchesRoutePrefix(path, '/invites')) {
    return resolveActionPermissionCode('marketing.invite.view', method);
  }

  if (matchesRoutePrefix(path, '/coupons')) {
    return resolveActionPermissionCode('marketing.coupons.view', method);
  }

  if (matchesRoutePrefix(path, '/rankings')) {
    return resolveActionPermissionCode('marketing.rankings.view', method);
  }

  if (matchesRoutePrefix(path, '/products/brand-library')) {
    return resolveActionPermissionCode('product.brands.view', method);
  }

  if (matchesRoutePrefix(path, '/products')) {
    return resolveActionPermissionCode('product.brands.view', method);
  }

  if (matchesRoutePrefix(path, '/shops/applies')) {
    return resolveActionPermissionCode('shop.apply.view', method);
  }

  if (matchesRoutePrefix(path, '/shops/products')) {
    return resolveActionPermissionCode('shop.products.view', method);
  }

  if (matchesRoutePrefix(path, '/shops')) {
    return resolveActionPermissionCode('shop.list.view', method);
  }

  if (matchesRoutePrefix(path, '/brands/auth-applies')) {
    return resolveActionPermissionCode('brand.auth.view', method);
  }

  if (matchesRoutePrefix(path, '/brands/auth-records')) {
    return resolveActionPermissionCode('brand.auth.view', method);
  }

  if (matchesRoutePrefix(path, '/brands')) {
    return resolveActionPermissionCode('brand.list.view', method);
  }

  return null;
}

export async function requireAdminByAuthorization(authorization?: string) {
  const user = await resolveAdmin(authorization);

  if (!user) {
    return { ok: false as const, status: 401, message: '请先登录' };
  }

  return { ok: true as const, user };
}

export async function requireAdmin(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const user = await resolveAdmin(request.headers.authorization);

    if (!user) {
      next(new HttpError(401, 'ADMIN_AUTH_REQUIRED', '请先登录'));
      return;
    }

    request.adminUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdminRoutePermission(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const admin = getRequestAdmin(request);
    const requiredCodes = resolveAdminRoutePermissionCodes(
      request.method,
      request.path,
    );

    if (!requiredCodes || requiredCodes.length === 0) {
      next(new HttpError(403, 'ADMIN_PERMISSION_REQUIRED', '无权访问该接口'));
      return;
    }

    if (requiredCodes.some((code) => admin.permissions.includes(code))) {
      next();
      return;
    }

    next(new HttpError(403, 'ADMIN_PERMISSION_REQUIRED', '无权访问该接口'));
  } catch (error) {
    next(error);
  }
}

export function getRequestAdmin(request: Request): AdminProfile {
  if (!request.adminUser) {
    throw new HttpError(401, 'ADMIN_AUTH_REQUIRED', '请先登录');
  }

  return request.adminUser;
}
