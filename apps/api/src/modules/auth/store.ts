import { randomUUID } from 'node:crypto';
import type mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import type {
  LoginPayload,
  LoginResult,
  RegisterPayload,
  SmsBizType,
  SendCodeResult,
  UserPublicProfile,
  UserSummary,
} from '@joy/shared';

import { getDbPool } from '../../lib/db';
import { env } from '../../env';

type UserRow = {
  id: string;
  phone: string;
  password: string | null;
  name: string;
  role: string;
  coins: number | string;
  avatar?: string | null;
  level?: number | string;
  title?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  shop_name?: string | null;
  followers?: number | string;
  following?: number | string;
  win_rate?: number | string;
  total_guess?: number | string;
  wins?: number | string;
  join_date?: Date | string | null;
  shop_verified?: number | boolean;
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function cleanupExpiredSessions() {
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM auth_session
      WHERE expires_at <= CURRENT_TIMESTAMP
    `,
  );
}

function sanitizeUser(user: UserRow): UserSummary {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role as UserSummary['role'],
    coins: Number(user.coins ?? 0),
    avatar: user.avatar ?? null,
    level: Number(user.level ?? 1),
    title: user.title ?? null,
    signature: user.signature ?? null,
    gender: user.gender ?? null,
    birthday: user.birthday ?? null,
    region: user.region ?? null,
    shopName: user.shop_name ?? null,
    followers: Number(user.followers ?? 0),
    following: Number(user.following ?? 0),
    winRate: Number(user.win_rate ?? 0),
    totalGuess: Number(user.total_guess ?? 0),
    wins: Number(user.wins ?? 0),
    joinDate: user.join_date ? new Date(user.join_date).toISOString() : null,
    shopVerified: Boolean(user.shop_verified),
  };
}

function sanitizePublicUser(user: UserRow): UserPublicProfile {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar ?? null,
    level: Number(user.level ?? 1),
    title: user.title ?? null,
    signature: user.signature ?? null,
    gender: user.gender ?? null,
    region: user.region ?? null,
    followers: Number(user.followers ?? 0),
    following: Number(user.following ?? 0),
    winRate: Number(user.win_rate ?? 0),
    totalGuess: Number(user.total_guess ?? 0),
    wins: Number(user.wins ?? 0),
    joinDate: user.join_date ? new Date(user.join_date).toISOString() : null,
    shopVerified: Boolean(user.shop_verified),
  };
}

async function createSession(user: UserRow): Promise<LoginResult> {
  await cleanupExpiredSessions();

  const db = getDbPool();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.execute(
    `
      DELETE FROM auth_session
      WHERE user_id = ?
    `,
    [user.id],
  );

  await db.execute(
    `
      INSERT INTO auth_session (
        token,
        user_id,
        expires_at
      ) VALUES (?, ?, ?)
    `,
    [token, user.id, expiresAt],
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

function requireValidPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error('请输入正确的手机号');
  }
}

async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, phone, password, name, role, coins
           , avatar, level, title, signature, gender, birthday, region, shop_name
           , followers, following, win_rate, total_guess, wins, join_date, shop_verified
      FROM user
      WHERE phone = ?
      LIMIT 1
    `,
    [phone],
  );

  return (rows[0] as UserRow | undefined) ?? null;
}

async function findUserById(id: string): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, phone, password, name, role, coins
           , avatar, level, title, signature, gender, birthday, region, shop_name
           , followers, following, win_rate, total_guess, wins, join_date, shop_verified
      FROM user
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return (rows[0] as UserRow | undefined) ?? null;
}

async function updateUserPassword(userId: string, password: string) {
  const db = getDbPool();
  await db.execute(
    `
      UPDATE user
      SET password = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
    `,
    [password, userId],
  );
}

export async function sendCode(phone: string, bizType: SmsBizType): Promise<SendCodeResult> {
  requireValidPhone(phone);

  const db = getDbPool();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.execute(
    `
      UPDATE sms_verification_code
      SET status = 'invalidated',
          updated_at = CURRENT_TIMESTAMP
      WHERE phone = ?
        AND biz_type = ?
        AND status = 'pending'
    `,
    [phone, bizType],
  );

  await db.execute(
    `
      INSERT INTO sms_verification_code (
        phone,
        biz_type,
        code,
        status,
        expires_at
      ) VALUES (?, ?, ?, 'pending', ?)
    `,
    [phone, bizType, code, expiresAt],
  );

  return {
    sent: true,
    ...(env.nodeEnv !== 'production' ? { devCode: code } : {}),
  };
}

async function requireCode(phone: string, code: string, bizType: SmsBizType) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, code, expires_at
      FROM sms_verification_code
      WHERE phone = ?
        AND biz_type = ?
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [phone, bizType],
  );

  const record = rows[0] as
    | {
        id: number;
        code: string;
        expires_at: Date;
      }
    | undefined;

  if (!record) {
    throw new Error('验证码未发送或已过期');
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await db.execute(
      `
        UPDATE sms_verification_code
        SET status = 'expired',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [record.id],
    );
    throw new Error('验证码已过期');
  }

  if (record.code !== code) {
    throw new Error('验证码错误');
  }

  await db.execute(
    `
      UPDATE sms_verification_code
      SET status = 'used',
          used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [record.id],
  );
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  requireValidPhone(payload.phone);

  if (payload.method === 'code') {
    if (!payload.code) {
      throw new Error('验证码不能为空');
    }
    await requireCode(payload.phone, payload.code, 'login');

    let user = await findUserByPhone(payload.phone);
    if (!user) {
      const db = getDbPool();
      const userId = `user-${randomUUID().slice(0, 8)}`;
      await db.execute(
        `
          INSERT INTO user (
            id,
            phone,
            password,
            name,
            role,
            coins,
            created_at,
            updated_at
          ) VALUES (?, ?, '', ?, 'user', 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        [userId, payload.phone, `用户${payload.phone.slice(-4)}`],
      );

      user = await findUserById(userId);
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

  let valid = false;

  if (user.password.startsWith('$2')) {
    valid = await bcrypt.compare(payload.password, user.password);
  } else {
    valid = user.password === payload.password;
    if (valid) {
      const hashedPassword = await bcrypt.hash(payload.password, 10);
      await updateUserPassword(user.id, hashedPassword);
      user.password = hashedPassword;
    }
  }

  if (!valid) {
    throw new Error('密码错误');
  }

  return createSession(user);
}

export async function register(payload: RegisterPayload): Promise<LoginResult> {
  requireValidPhone(payload.phone);

  const existingUser = await findUserByPhone(payload.phone);
  if (existingUser) {
    throw new Error('该手机号已注册');
  }

  if (!payload.password || payload.password.length < 6) {
    throw new Error('密码长度至少6位');
  }

  if (!payload.name || payload.name.trim().length < 2) {
    throw new Error('昵称长度至少2位');
  }

  await requireCode(payload.phone, payload.code, 'register');

  const db = getDbPool();
  const userId = `user-${randomUUID().slice(0, 8)}`;
  const hashedPassword = await bcrypt.hash(payload.password, 10);
  await db.execute(
    `
      INSERT INTO user (
        id,
        phone,
        password,
        name,
        role,
        coins,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'user', 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, payload.phone, hashedPassword, payload.name.trim()],
  );

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('注册成功后读取用户失败');
  }

  return createSession(user);
}

export async function getUserByToken(token: string): Promise<UserSummary | null> {
  await cleanupExpiredSessions();

  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT user_id, expires_at
      FROM auth_session
      WHERE token = ?
      LIMIT 1
    `,
    [token],
  );

  const session = rows[0] as
    | {
        user_id: string;
        expires_at: Date;
      }
    | undefined;

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db.execute(
      `
        DELETE FROM auth_session
        WHERE token = ?
      `,
      [token],
    );
    return null;
  }

  const user = await findUserById(session.user_id);
  return user ? sanitizeUser(user) : null;
}

export async function logoutByToken(token: string): Promise<void> {
  await cleanupExpiredSessions();

  if (!token) {
    return;
  }

  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM auth_session
      WHERE token = ?
    `,
    [token],
  );
}

type UpdateMePayload = {
  name?: string;
  avatar?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  shopName?: string | null;
};

export async function updateMe(userId: string, payload: UpdateMePayload): Promise<UserSummary> {
  const updates: string[] = [];
  const values: Array<string | null> = [];

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (name.length < 2) {
      throw new Error('昵称长度至少2位');
    }
    updates.push('name = ?');
    values.push(name);
  }

  if (payload.avatar !== undefined) {
    updates.push('avatar = ?');
    values.push(payload.avatar || null);
  }

  if (payload.signature !== undefined) {
    updates.push('signature = ?');
    values.push(payload.signature?.trim() || null);
  }

  if (payload.gender !== undefined) {
    const gender = payload.gender || null;
    if (gender && !['female', 'male', 'other'].includes(gender)) {
      throw new Error('性别参数不合法');
    }
    updates.push('gender = ?');
    values.push(gender);
  }

  if (payload.birthday !== undefined) {
    updates.push('birthday = ?');
    values.push(payload.birthday?.trim() || null);
  }

  if (payload.region !== undefined) {
    updates.push('region = ?');
    values.push(payload.region?.trim() || null);
  }

  if (payload.shopName !== undefined) {
    updates.push('shop_name = ?');
    values.push(payload.shopName?.trim() || null);
  }

  if (updates.length === 0) {
    throw new Error('没有可更新的字段');
  }

  const db = getDbPool();
  await db.execute(
    `
      UPDATE user
      SET ${updates.join(', ')},
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
    `,
    [...values, userId],
  );

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  return sanitizeUser(user);
}

export async function getUserProfileById(userId: string): Promise<UserPublicProfile | null> {
  const user = await findUserById(userId);
  return user ? sanitizePublicUser(user) : null;
}
