import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { toEntityId } from '@umi/shared';
import { env } from '../../env';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
const ADMIN_STATUS_ACTIVE = 10;
const ADMIN_STATUS_DISABLED = 90;
const ROLE_STATUS_ACTIVE = 10;
const PERMISSION_STATUS_ACTIVE = 10;
export function getBearerToken(authorization) {
    return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}
function toBase64Url(value) {
    return Buffer.from(value).toString('base64url');
}
function fromBase64Url(value) {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}
function signAdminPayload(payload) {
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = createHmac('sha256', env.adminTokenSecret)
        .update(encodedPayload)
        .digest('base64url');
    return `${encodedPayload}.${signature}`;
}
function verifyAdminToken(token) {
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
    const payload = fromBase64Url(encodedPayload);
    if (!payload.adminUserId || payload.exp < Date.now()) {
        return null;
    }
    return payload;
}
function mapAdminStatus(code) {
    return code === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
async function findAdminUserByIdentity(identity) {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [identity, identity]);
    return rows[0] ?? null;
}
async function findAdminUserById(id) {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [id]);
    return rows[0] ?? null;
}
async function fetchAdminRoles(adminUserId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        ar.id,
        ar.code,
        ar.name
      FROM admin_user_role aur
      INNER JOIN admin_role ar ON ar.id = aur.role_id
      WHERE aur.admin_user_id = ?
        AND ar.status = ?
      ORDER BY ar.sort ASC, ar.id ASC
    `, [adminUserId, ROLE_STATUS_ACTIVE]);
    return rows.map((row) => ({
        id: toEntityId(row.id),
        code: row.code,
        name: row.name,
    }));
}
async function fetchAdminPermissions(adminUserId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT DISTINCT ap.code
      FROM admin_user_role aur
      INNER JOIN admin_role ar ON ar.id = aur.role_id
      INNER JOIN admin_role_permission arp ON arp.role_id = ar.id
      INNER JOIN admin_permission ap ON ap.id = arp.permission_id
      WHERE aur.admin_user_id = ?
        AND ar.status = ?
        AND ap.status = ?
      ORDER BY ap.code ASC
    `, [adminUserId, ROLE_STATUS_ACTIVE, PERMISSION_STATUS_ACTIVE]);
    return rows.map((row) => row.code);
}
async function sanitizeAdminUser(row) {
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
        permissions,
    };
}
async function requireValidAdminUser(row) {
    if (!row) {
        throw new Error('管理员账号不存在');
    }
    if (Number(row.status ?? 0) !== ADMIN_STATUS_ACTIVE) {
        throw new Error('管理员账号已停用');
    }
    return row;
}
export async function adminLogin(payload, loginIp) {
    const identity = payload.username.trim();
    if (!identity) {
        throw new Error('请输入后台用户名');
    }
    if (!payload.password) {
        throw new Error('请输入密码');
    }
    const user = await requireValidAdminUser(await findAdminUserByIdentity(identity));
    const valid = await bcrypt.compare(payload.password, user.password_hash);
    if (!valid) {
        throw new Error('用户名或密码错误');
    }
    const db = getDbPool();
    await db.execute(`
      UPDATE admin_user
      SET last_login_at = CURRENT_TIMESTAMP(3),
          last_login_ip = ?
      WHERE id = ?
    `, [loginIp ?? null, user.id]);
    const token = signAdminPayload({
        adminUserId: String(toEntityId(user.id)),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return {
        token,
        user: await sanitizeAdminUser(user),
    };
}
export async function getAdminByToken(token) {
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
export async function changeAdminPassword(adminUserId, payload) {
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
    await db.execute(`
      UPDATE admin_user
      SET password_hash = ?
      WHERE id = ?
    `, [hashedPassword, adminUserId]);
    return { success: true };
}
export async function logoutAdminByToken(_token) {
    return { success: true };
}
async function resolveAdmin(authorization) {
    const token = getBearerToken(authorization);
    return token ? getAdminByToken(token) : null;
}
export async function requireAdminByAuthorization(authorization) {
    const user = await resolveAdmin(authorization);
    if (!user) {
        return { ok: false, status: 401, message: '请先登录' };
    }
    return { ok: true, user };
}
export async function requireAdmin(request, _response, next) {
    try {
        const user = await resolveAdmin(request.headers.authorization);
        if (!user) {
            next(new HttpError(401, 'ADMIN_AUTH_REQUIRED', '请先登录'));
            return;
        }
        request.adminUser = user;
        next();
    }
    catch (error) {
        next(error);
    }
}
export function getRequestAdmin(request) {
    if (!request.adminUser) {
        throw new HttpError(401, 'ADMIN_AUTH_REQUIRED', '请先登录');
    }
    return request.adminUser;
}
