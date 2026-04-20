import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../env';
import { getDbPool } from '../../lib/db';
import { sanitizeUser } from '../users/model';
import { findUserById, findUserByPhone } from '../users/query-store';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SMS_BIZ_LOGIN = 10;
const SMS_BIZ_REGISTER = 20;
const SMS_BIZ_RESET = 30;
const SMS_STATUS_SENT = 10;
const SMS_STATUS_VERIFIED = 30;
const SMS_STATUS_EXPIRED = 90;
function smsBizTypeToCode(value) {
    if (value === 'login') {
        return SMS_BIZ_LOGIN;
    }
    if (value === 'register') {
        return SMS_BIZ_REGISTER;
    }
    return SMS_BIZ_RESET;
}
function requireValidPhone(phone) {
    if (!/^1\d{10}$/.test(phone)) {
        throw new Error('请输入正确的手机号');
    }
}
function hashSmsCode(phone, bizType, code) {
    return createHash('sha256')
        .update(`${phone}:${bizType}:${code}:${env.smsCodePepper}`)
        .digest('hex');
}
function createSessionToken() {
    return randomBytes(32).toString('hex');
}
const UID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function createRandomUidCode(length = 8) {
    const bytes = randomBytes(length);
    let result = '';
    for (let index = 0; index < length; index += 1) {
        result += UID_ALPHABET[bytes[index] % UID_ALPHABET.length];
    }
    return result;
}
async function generateUniqueUidCode() {
    const db = getDbPool();
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = createRandomUidCode(8);
        const [rows] = await db.execute(`SELECT id FROM user WHERE uid_code = ? LIMIT 1`, [code]);
        if (rows.length === 0) {
            return code;
        }
    }
    throw new Error('生成优米号失败，请稍后重试');
}
async function cleanupExpiredSessions() {
    const db = getDbPool();
    await db.execute(`DELETE FROM auth_session WHERE expires_at <= CURRENT_TIMESTAMP`);
}
async function verifyUserPassword(user, password) {
    if (!user.password) {
        return false;
    }
    if (user.password.startsWith('$2')) {
        return bcrypt.compare(password, user.password);
    }
    const valid = user.password === password;
    if (valid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await updateUserPassword(String(user.id), hashedPassword);
    }
    return valid;
}
async function updateUserPassword(userId, password) {
    const db = getDbPool();
    await db.execute(`UPDATE user SET password = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [password, userId]);
}
async function clearUserSessions(userId) {
    const db = getDbPool();
    await db.execute(`DELETE FROM auth_session WHERE user_id = ?`, [userId]);
}
async function createUserProfile(userId, name, avatar) {
    const db = getDbPool();
    await db.execute(`
      INSERT INTO user_profile (user_id, name, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `, [userId, name, avatar ?? null]);
}
async function createSession(user) {
    await cleanupExpiredSessions();
    const db = getDbPool();
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.execute(`DELETE FROM auth_session WHERE user_id = ?`, [user.id]);
    await db.execute(`
      INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [token, user.id, expiresAt]);
    return { token, user: sanitizeUser(user) };
}
export async function sendCode(phone, bizType) {
    requireValidPhone(phone);
    const db = getDbPool();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = hashSmsCode(phone, bizType, code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const bizTypeCode = smsBizTypeToCode(bizType);
    await db.execute(`
      UPDATE sms_verification_code
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE phone_number = ?
        AND biz_type = ?
        AND status = ?
    `, [SMS_STATUS_EXPIRED, phone, bizTypeCode, SMS_STATUS_SENT]);
    await db.execute(`
      INSERT INTO sms_verification_code (
        phone_number,
        biz_type,
        code_hash,
        status,
        expires_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [phone, bizTypeCode, codeHash, SMS_STATUS_SENT, expiresAt]);
    return {
        sent: true,
        ...(env.nodeEnv !== 'production' ? { devCode: code } : {}),
    };
}
async function requireCode(phone, code, bizType) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id, code_hash, expires_at
      FROM sms_verification_code
      WHERE phone_number = ?
        AND biz_type = ?
        AND status = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [phone, smsBizTypeToCode(bizType), SMS_STATUS_SENT]);
    const record = rows[0];
    if (!record) {
        throw new Error('验证码未发送或已过期');
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
        await db.execute(`UPDATE sms_verification_code SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [SMS_STATUS_EXPIRED, record.id]);
        throw new Error('验证码已过期');
    }
    if (record.code_hash !== hashSmsCode(phone, bizType, code)) {
        throw new Error('验证码错误');
    }
    await db.execute(`
      UPDATE sms_verification_code
      SET status = ?,
          used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [SMS_STATUS_VERIFIED, record.id]);
}
export async function login(payload) {
    requireValidPhone(payload.phone);
    if (payload.method === 'code') {
        if (!payload.code) {
            throw new Error('验证码不能为空');
        }
        await requireCode(payload.phone, payload.code, 'login');
        let user = await findUserByPhone(payload.phone);
        if (!user) {
            const db = getDbPool();
            const uidCode = await generateUniqueUidCode();
            const [result] = await db.execute(`
          INSERT INTO user (
            uid_code,
            phone_number,
            password,
            achievements
          ) VALUES (?, ?, '', JSON_ARRAY())
        `, [uidCode, payload.phone]);
            await createUserProfile(result.insertId, `用户${payload.phone.slice(-4)}`);
            user = await findUserById(result.insertId);
        }
        if (!user) {
            throw new Error('登录成功后读取用户失败');
        }
        return createSession(user);
    }
    const user = await findUserByPhone(payload.phone);
    if (!user) {
        throw new Error('用户不存在');
    }
    if (!payload.password) {
        throw new Error('密码不能为空');
    }
    if (!user.password) {
        throw new Error('该账号未设置密码，请使用验证码或重新注册');
    }
    const valid = await verifyUserPassword(user, payload.password);
    if (!valid) {
        throw new Error('密码错误');
    }
    const freshUser = await findUserById(user.id);
    if (!freshUser) {
        throw new Error('用户不存在');
    }
    return createSession(freshUser);
}
export async function register(payload) {
    requireValidPhone(payload.phone);
    if (!payload.password || payload.password.length < 6) {
        throw new Error('密码长度至少6位');
    }
    if (!payload.name || payload.name.trim().length < 2) {
        throw new Error('昵称长度至少2位');
    }
    const existing = await findUserByPhone(payload.phone);
    if (existing) {
        throw new Error('该手机号已注册');
    }
    await requireCode(payload.phone, payload.code, 'register');
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const db = getDbPool();
    const uidCode = await generateUniqueUidCode();
    const [result] = await db.execute(`
      INSERT INTO user (
        uid_code,
        phone_number,
        password,
        achievements
      ) VALUES (?, ?, ?, JSON_ARRAY())
    `, [uidCode, payload.phone, hashedPassword]);
    await createUserProfile(result.insertId, payload.name.trim(), payload.avatar);
    const user = await findUserById(result.insertId);
    if (!user) {
        throw new Error('注册成功后读取用户失败');
    }
    return createSession(user);
}
export async function resetPassword(payload) {
    requireValidPhone(payload.phone);
    if (!payload.newPassword || payload.newPassword.length < 6) {
        throw new Error('新密码长度至少6位');
    }
    const user = await findUserByPhone(payload.phone);
    if (!user) {
        throw new Error('用户不存在');
    }
    await requireCode(payload.phone, payload.code, 'reset_password');
    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
    await updateUserPassword(String(user.id), hashedPassword);
    await clearUserSessions(String(user.id));
    return { success: true };
}
export async function changePassword(userId, payload) {
    const user = await findUserById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    if (!payload.newPassword || payload.newPassword.length < 6) {
        throw new Error('新密码长度至少6位');
    }
    if (user.password) {
        if (!payload.currentPassword) {
            throw new Error('当前密码不能为空');
        }
        const valid = await verifyUserPassword(user, payload.currentPassword);
        if (!valid) {
            throw new Error('当前密码错误');
        }
    }
    if (payload.currentPassword && payload.currentPassword === payload.newPassword) {
        throw new Error('新密码不能与当前密码相同');
    }
    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
    await updateUserPassword(userId, hashedPassword);
    return { success: true };
}
export async function getUserByToken(token) {
    if (!token) {
        return null;
    }
    await cleanupExpiredSessions();
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT user_id, expires_at FROM auth_session WHERE token = ? LIMIT 1`, [token]);
    const session = rows[0];
    if (!session) {
        return null;
    }
    if (new Date(session.expires_at).getTime() < Date.now()) {
        await db.execute(`DELETE FROM auth_session WHERE token = ?`, [token]);
        return null;
    }
    const user = await findUserById(session.user_id);
    return user ? sanitizeUser(user) : null;
}
export async function logoutByToken(token) {
    if (!token) {
        return;
    }
    const db = getDbPool();
    await db.execute(`DELETE FROM auth_session WHERE token = ?`, [token]);
}
