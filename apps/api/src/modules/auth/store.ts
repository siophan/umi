import { createHash, randomBytes } from 'node:crypto';
import type mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import type {
  ChangePasswordPayload,
  ChatConversationListResult,
  ChatDetailResult,
  ChatMessageItem,
  LoginPayload,
  LoginResult,
  MeActivityResult,
  MePostItem,
  NotificationItem,
  NotificationListResult,
  RegisterPayload,
  SendCodeResult,
  SendChatMessagePayload,
  SmsBizType,
  SocialOverviewResult,
  SocialUserItem,
  UserPublicProfile,
  UserSummary,
} from '@joy/shared';

import { getDbPool } from '../../lib/db';
import { env } from '../../env';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const GENDER_UNKNOWN = 10;
const GENDER_MALE = 20;
const GENDER_FEMALE = 30;

const SMS_BIZ_LOGIN = 10;
const SMS_BIZ_REGISTER = 20;
const SMS_BIZ_RESET = 30;

const SMS_STATUS_SENT = 10;
const SMS_STATUS_VERIFIED = 30;
const SMS_STATUS_EXPIRED = 90;

const FRIENDSHIP_PENDING = 10;
const FRIENDSHIP_ACCEPTED = 30;

const NOTIFICATION_SYSTEM = 10;
const NOTIFICATION_ORDER = 20;
const NOTIFICATION_GUESS = 30;
const NOTIFICATION_SOCIAL = 40;

const POST_INTERACTION_LIKE = 10;
const POST_INTERACTION_BOOKMARK = 20;

type UserRow = {
  id: number | string;
  uid_code: string | null;
  phone_number: string;
  password: string | null;
  level: number | string;
  title: string | null;
  created_at: Date | string;
  name: string | null;
  avatar_url: string | null;
  signature: string | null;
  gender: number | string | null;
  birthday: Date | string | null;
  region: string | null;
  followers: number | string;
  following: number | string;
  total_guess: number | string;
  wins: number | string;
  shop_name: string | null;
  shop_verified: number | string;
  coins: number | string;
};

type NotificationRow = {
  id: number;
  type: number | string | null;
  title: string | null;
  content: string | null;
  is_read: number | boolean;
  created_at: Date | string;
};

type SocialRow = {
  id: number | string;
  name: string | null;
  avatar_url: string | null;
  level: number | string;
  title: string | null;
  signature: string | null;
  followers: number | string;
  following: number | string;
  total_guess: number | string;
  wins: number | string;
  shop_verified: number | string;
  created_at?: Date | string;
  message?: string | null;
  status?: number | string | null;
};

type ChatConversationRow = {
  peer_id: number | string;
  unread_count: number | string;
  last_message: string;
  last_message_at: Date | string;
  peer_name: string | null;
  peer_avatar_url: string | null;
};

type ChatRow = {
  id: number;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  is_read: number | boolean;
  created_at: Date | string;
};

type PostRow = {
  id: number | string;
  title: string | null;
  content: string | null;
  tag: string | null;
  images: string;
  likes: number | string;
  comments: number | string;
  created_at: Date | string;
  author_name: string | null;
  author_avatar_url: string | null;
};

function resolveUserRole(row: Pick<UserRow, 'shop_name' | 'shop_verified'>): UserSummary['role'] {
  if (Number(row.shop_verified ?? 0) > 0 || (row.shop_name ?? '').trim()) {
    return 'shop_owner';
  }
  return 'user';
}

function genderCodeToValue(code: number | string | null | undefined): UserSummary['gender'] {
  const value = Number(code ?? 0);
  if (value === GENDER_UNKNOWN) {
    return null;
  }
  if (value === GENDER_MALE) {
    return 'male';
  }
  if (value === GENDER_FEMALE) {
    return 'female';
  }
  return null;
}

function genderValueToCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  if (value === 'male') {
    return GENDER_MALE;
  }
  if (value === 'female') {
    return GENDER_FEMALE;
  }
  throw new Error('性别参数不合法');
}

function smsBizTypeToCode(value: SmsBizType) {
  if (value === 'login') {
    return SMS_BIZ_LOGIN;
  }
  if (value === 'register') {
    return SMS_BIZ_REGISTER;
  }
  return SMS_BIZ_RESET;
}

function normalizeBirthday(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeBirthdayInput(value: string | null | undefined) {
  const raw = value?.trim() || '';
  if (!raw) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error('生日格式不合法');
  }
  if (raw > new Date().toISOString().slice(0, 10)) {
    throw new Error('生日不能晚于今天');
  }
  return raw;
}

function requireValidPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error('请输入正确的手机号');
  }
}

function hashSmsCode(phone: string, bizType: SmsBizType, code: string) {
  return createHash('sha256')
    .update(`${phone}:${bizType}:${code}:${env.smsCodePepper}`)
    .digest('hex');
}

function createSessionToken() {
  return randomBytes(32).toString('hex');
}

const UID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function safeJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

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
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM user WHERE uid_code = ? LIMIT 1`,
      [code],
    );
    if (rows.length === 0) {
      return code;
    }
  }
  throw new Error('生成优米号失败，请稍后重试');
}

async function ensureUserUidCode(userId: string | number, currentCode: string | null | undefined) {
  if (currentCode && currentCode.trim()) {
    return currentCode.trim();
  }

  const db = getDbPool();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = createRandomUidCode(8);
    try {
      const [result] = await db.execute<mysql.ResultSetHeader>(
        `
          UPDATE user
          SET uid_code = ?, updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
            AND (uid_code IS NULL OR uid_code = '')
        `,
        [candidate, userId],
      );

      if (result.affectedRows > 0) {
        return candidate;
      }

      const [rows] = await db.execute<mysql.RowDataPacket[]>(
        `SELECT uid_code FROM user WHERE id = ? LIMIT 1`,
        [userId],
      );
      const existing = rows[0]?.uid_code;
      if (typeof existing === 'string' && existing.trim()) {
        return existing.trim();
      }
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('生成优米号失败，请稍后重试');
}

async function attachUserUidCode(row: UserRow | null): Promise<UserRow | null> {
  if (!row) {
    return null;
  }
  if (row.uid_code && row.uid_code.trim()) {
    return row;
  }
  return {
    ...row,
    uid_code: await ensureUserUidCode(row.id, row.uid_code),
  };
}

function sanitizeUser(row: UserRow): UserSummary {
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);
  return {
    id: String(row.id),
    uid: row.uid_code || '',
    phone: row.phone_number,
    name: row.name || `用户${String(row.phone_number).slice(-4)}`,
    role: resolveUserRole(row),
    coins: Number(row.coins ?? 0),
    avatar: row.avatar_url ?? null,
    level: Number(row.level ?? 1),
    title: row.title ?? null,
    signature: row.signature ?? null,
    gender: genderCodeToValue(row.gender),
    birthday: normalizeBirthday(row.birthday),
    region: row.region ?? null,
    shopName: row.shop_name ?? null,
    followers: Number(row.followers ?? 0),
    following: Number(row.following ?? 0),
    totalGuess,
    wins,
    winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
    joinDate: new Date(row.created_at).toISOString(),
    shopVerified: Number(row.shop_verified ?? 0) > 0,
  };
}

function sanitizePublicUser(row: UserRow): UserPublicProfile {
  const user = sanitizeUser(row);
  return {
    id: user.id,
    uid: user.uid,
    name: user.name,
    avatar: user.avatar ?? null,
    level: user.level,
    title: user.title ?? null,
    signature: user.signature ?? null,
    gender: user.gender ?? null,
    birthday: user.birthday ?? null,
    region: user.region ?? null,
    followers: user.followers ?? 0,
    following: user.following ?? 0,
    winRate: user.winRate ?? 0,
    totalGuess: user.totalGuess ?? 0,
    wins: user.wins ?? 0,
    joinDate: user.joinDate ?? null,
    shopVerified: user.shopVerified ?? false,
  };
}

function sanitizeNotification(row: NotificationRow): NotificationItem {
  const code = Number(row.type ?? NOTIFICATION_SYSTEM);
  return {
    id: row.id,
    type:
      code === NOTIFICATION_ORDER
        ? 'order'
        : code === NOTIFICATION_GUESS
          ? 'guess'
          : code === NOTIFICATION_SOCIAL
            ? 'social'
            : 'system',
    read: Boolean(row.is_read),
    title: row.title || '系统通知',
    content: row.content || '',
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function sanitizeSocialRow(row: SocialRow): SocialUserItem {
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);
  return {
    id: String(row.id),
    name: row.name || '未知用户',
    avatar: row.avatar_url ?? null,
    level: Number(row.level ?? 1),
    title: row.title ?? null,
    signature: row.signature ?? null,
    followers: Number(row.followers ?? 0),
    following: Number(row.following ?? 0),
    winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
    shopVerified: Number(row.shop_verified ?? 0) > 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    message: row.message ?? null,
    status:
      row.status === undefined || row.status === null
        ? null
        : Number(row.status) === FRIENDSHIP_ACCEPTED
          ? 'accepted'
          : Number(row.status) === FRIENDSHIP_PENDING
            ? 'pending'
            : String(row.status),
  };
}

function sanitizeChatMessage(row: ChatRow, userId: string): ChatMessageItem {
  return {
    id: row.id,
    from: String(row.sender_id) === userId ? 'me' : 'other',
    senderId: String(row.sender_id),
    receiverId: String(row.receiver_id),
    content: row.content,
    read: Boolean(row.is_read),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function sanitizePost(row: PostRow): MePostItem {
  return {
    id: String(row.id),
    title: row.title || '未命名动态',
    desc: row.content || '',
    tag: row.tag || null,
    images: safeJsonArray(row.images),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
    authorName: row.author_name ?? null,
    authorAvatar: row.author_avatar_url ?? null,
  };
}

async function cleanupExpiredSessions() {
  const db = getDbPool();
  await db.execute(`DELETE FROM auth_session WHERE expires_at <= CURRENT_TIMESTAMP`);
}

const userSelectSql = `
  SELECT
    u.id,
    u.uid_code,
    u.phone_number,
    u.password,
    u.level,
    u.title,
    u.created_at,
    up.name,
    up.avatar_url,
    up.signature,
    up.gender,
    up.birthday,
    up.region,
    COALESCE((
      SELECT COUNT(*)
      FROM user_follow uf
      WHERE uf.following_id = u.id
    ), 0) AS followers,
    COALESCE((
      SELECT COUNT(*)
      FROM user_follow uf
      WHERE uf.follower_id = u.id
    ), 0) AS following,
    COALESCE((
      SELECT COUNT(*)
      FROM guess_bet gb
      WHERE gb.user_id = u.id
    ), 0) AS total_guess,
    COALESCE((
      SELECT COUNT(*)
      FROM guess_bet gb
      WHERE gb.user_id = u.id
        AND gb.status = 30
    ), 0) AS wins,
    (
      SELECT s.name
      FROM shop s
      WHERE s.user_id = u.id
      LIMIT 1
    ) AS shop_name,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM shop s
        WHERE s.user_id = u.id
          AND s.status = 10
      ) THEN 1
      ELSE 0
    END AS shop_verified,
    COALESCE((
      SELECT cl.balance_after
      FROM coin_ledger cl
      WHERE cl.user_id = u.id
      ORDER BY cl.created_at DESC, cl.id DESC
      LIMIT 1
    ), 0) AS coins
  FROM user u
  LEFT JOIN user_profile up ON up.user_id = u.id
`;

async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${userSelectSql}
      WHERE u.phone_number = ?
      LIMIT 1
    `,
    [phone],
  );
  return attachUserUidCode((rows[0] as UserRow | undefined) ?? null);
}

async function findUserById(id: string | number): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${userSelectSql}
      WHERE u.id = ?
      LIMIT 1
    `,
    [id],
  );
  return attachUserUidCode((rows[0] as UserRow | undefined) ?? null);
}

async function verifyUserPassword(user: UserRow, password: string) {
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

async function updateUserPassword(userId: string, password: string) {
  const db = getDbPool();
  await db.execute(`UPDATE user SET password = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [password, userId]);
}

async function createUserProfile(userId: number, name: string) {
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO user_profile (user_id, name, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, name],
  );
}

async function createSession(user: UserRow): Promise<LoginResult> {
  await cleanupExpiredSessions();
  const db = getDbPool();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.execute(`DELETE FROM auth_session WHERE user_id = ?`, [user.id]);
  await db.execute(
    `
      INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [token, user.id, expiresAt],
  );
  return { token, user: sanitizeUser(user) };
}

export async function sendCode(phone: string, bizType: SmsBizType): Promise<SendCodeResult> {
  requireValidPhone(phone);
  const db = getDbPool();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = hashSmsCode(phone, bizType, code);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const bizTypeCode = smsBizTypeToCode(bizType);

  await db.execute(
    `
      UPDATE sms_verification_code
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE phone_number = ?
        AND biz_type = ?
        AND status = ?
    `,
    [SMS_STATUS_EXPIRED, phone, bizTypeCode, SMS_STATUS_SENT],
  );

  await db.execute(
    `
      INSERT INTO sms_verification_code (
        phone_number,
        biz_type,
        code_hash,
        status,
        expires_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [phone, bizTypeCode, codeHash, SMS_STATUS_SENT, expiresAt],
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
      SELECT id, code_hash, expires_at
      FROM sms_verification_code
      WHERE phone_number = ?
        AND biz_type = ?
        AND status = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [phone, smsBizTypeToCode(bizType), SMS_STATUS_SENT],
  );

  const record = rows[0] as { id: number; code_hash: string; expires_at: Date } | undefined;
  if (!record) {
    throw new Error('验证码未发送或已过期');
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await db.execute(
      `UPDATE sms_verification_code SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [SMS_STATUS_EXPIRED, record.id],
    );
    throw new Error('验证码已过期');
  }

  if (record.code_hash !== hashSmsCode(phone, bizType, code)) {
    throw new Error('验证码错误');
  }

  await db.execute(
    `
      UPDATE sms_verification_code
      SET status = ?,
          used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [SMS_STATUS_VERIFIED, record.id],
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
      const uidCode = await generateUniqueUidCode();
      const [result] = await db.execute<mysql.ResultSetHeader>(
        `
          INSERT INTO user (
            uid_code,
            phone_number,
            password,
            achievements
          ) VALUES (?, ?, '', JSON_ARRAY())
        `,
        [uidCode, payload.phone],
      );
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

export async function register(payload: RegisterPayload): Promise<LoginResult> {
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
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user (
        uid_code,
        phone_number,
        password,
        achievements
      ) VALUES (?, ?, ?, JSON_ARRAY())
    `,
    [uidCode, payload.phone, hashedPassword],
  );
  await createUserProfile(result.insertId, payload.name.trim());

  const user = await findUserById(result.insertId);
  if (!user) {
    throw new Error('注册成功后读取用户失败');
  }
  return createSession(user);
}

export async function changePassword(
  userId: string,
  payload: ChangePasswordPayload,
) {
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

  return { success: true as const };
}

export async function getUserByToken(token: string): Promise<UserSummary | null> {
  if (!token) {
    return null;
  }
  await cleanupExpiredSessions();
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT user_id, expires_at FROM auth_session WHERE token = ? LIMIT 1`,
    [token],
  );
  const session = rows[0] as { user_id: number; expires_at: Date } | undefined;
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

export async function logoutByToken(token: string): Promise<void> {
  if (!token) {
    return;
  }
  const db = getDbPool();
  await db.execute(`DELETE FROM auth_session WHERE token = ?`, [token]);
}

type UpdatePayload = {
  name?: string;
  avatar?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  shopName?: string | null;
};

export async function updateMe(userId: string, payload: UpdatePayload): Promise<UserSummary> {
  const db = getDbPool();
  const updates: string[] = [];
  const values: Array<string | number | null> = [];

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (name.length < 2) {
      throw new Error('昵称长度至少2位');
    }
    updates.push('name = ?');
    values.push(name);
  }
  if (payload.avatar !== undefined) {
    updates.push('avatar_url = ?');
    values.push(payload.avatar || null);
  }
  if (payload.signature !== undefined) {
    updates.push('signature = ?');
    values.push(payload.signature?.trim() || null);
  }
  if (payload.gender !== undefined) {
    updates.push('gender = ?');
    values.push(genderValueToCode(payload.gender));
  }
  if (payload.birthday !== undefined) {
    updates.push('birthday = ?');
    values.push(normalizeBirthdayInput(payload.birthday));
  }
  if (payload.region !== undefined) {
    updates.push('region = ?');
    values.push(payload.region?.trim() || null);
  }

  if (updates.length > 0) {
    const name = payload.name?.trim() || '未命名用户';
    await db.execute(
      `
        INSERT INTO user_profile (user_id, name, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(3)
      `,
      [userId, name],
    );
    await db.execute(
      `UPDATE user_profile SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ?`,
      [...values, userId],
    );
  }

  if (payload.shopName !== undefined) {
    await db.execute(
      `
        UPDATE shop
        SET name = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE user_id = ?
      `,
      [payload.shopName?.trim() || null, userId],
    );
  }

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

export async function getMeActivity(userId: string): Promise<MeActivityResult> {
  const db = getDbPool();

  const [worksRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi
          WHERE pi.post_id = p.id
            AND pi.interaction_type = ?
        ), 0) AS likes,
        0 AS comments
      FROM post p
      LEFT JOIN user_profile up ON up.user_id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `,
    [POST_INTERACTION_LIKE, userId],
  );

  const [bookmarkRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.interaction_type = ?
        ), 0) AS likes,
        0 AS comments
      FROM post_interaction pi
      INNER JOIN post p ON p.id = pi.post_id
      LEFT JOIN user_profile up ON up.user_id = p.user_id
      WHERE pi.user_id = ?
        AND pi.interaction_type = ?
      ORDER BY pi.created_at DESC
      LIMIT 20
    `,
    [POST_INTERACTION_LIKE, userId, POST_INTERACTION_BOOKMARK],
  );

  const [likeRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.interaction_type = ?
        ), 0) AS likes,
        0 AS comments
      FROM post_interaction pi
      INNER JOIN post p ON p.id = pi.post_id
      LEFT JOIN user_profile up ON up.user_id = p.user_id
      WHERE pi.user_id = ?
        AND pi.interaction_type = ?
      ORDER BY pi.created_at DESC
      LIMIT 20
    `,
    [POST_INTERACTION_LIKE, userId, POST_INTERACTION_LIKE],
  );

  const [messageCountRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COALESCE(SUM(unread_count), 0) AS unread_count FROM chat_conversation WHERE user_id = ?`,
    [userId],
  );

  return {
    unreadMessageCount: Number((messageCountRows[0] as { unread_count?: number | string } | undefined)?.unread_count ?? 0),
    works: worksRows.map((row) => sanitizePost(row as PostRow)),
    bookmarks: bookmarkRows.map((row) => sanitizePost(row as PostRow)),
    likes: likeRows.map((row) => sanitizePost(row as PostRow)),
  };
}

export async function getNotifications(userId: string): Promise<NotificationListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, type, title, content, is_read, created_at FROM notification WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    [userId],
  );
  return { items: rows.map((row) => sanitizeNotification(row as NotificationRow)) };
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const db = getDbPool();
  await db.execute(`UPDATE notification SET is_read = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND is_read = 0`, [userId]);
}

export async function getSocialOverview(userId: string): Promise<SocialOverviewResult> {
  const db = getDbPool();
  const socialSelect = `
    SELECT
      u.id,
      up.name,
      up.avatar_url,
      u.level,
      u.title,
      up.signature,
      COALESCE((SELECT COUNT(*) FROM user_follow f1 WHERE f1.following_id = u.id), 0) AS followers,
      COALESCE((SELECT COUNT(*) FROM user_follow f2 WHERE f2.follower_id = u.id), 0) AS following,
      COALESCE((SELECT COUNT(*) FROM guess_bet gb1 WHERE gb1.user_id = u.id), 0) AS total_guess,
      COALESCE((SELECT COUNT(*) FROM guess_bet gb2 WHERE gb2.user_id = u.id AND gb2.status = 30), 0) AS wins,
      CASE WHEN EXISTS (SELECT 1 FROM shop s WHERE s.user_id = u.id AND s.status = 10) THEN 1 ELSE 0 END AS shop_verified
    FROM user u
    LEFT JOIN user_profile up ON up.user_id = u.id
  `;

  const [friendRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${socialSelect}
      INNER JOIN friendship f ON f.friend_id = u.id
      WHERE f.user_id = ?
        AND f.status = ?
      ORDER BY f.updated_at DESC
    `,
    [userId, FRIENDSHIP_ACCEPTED],
  );

  const [followingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${socialSelect}
      INNER JOIN user_follow uf ON uf.following_id = u.id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
    `,
    [userId],
  );

  const [fanRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${socialSelect}
      INNER JOIN user_follow uf ON uf.follower_id = u.id
      WHERE uf.following_id = ?
      ORDER BY uf.created_at DESC
    `,
    [userId],
  );

  const [requestRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        social.*,
      f.message,
      f.status
      FROM (
        ${socialSelect}
      ) social
      INNER JOIN friendship f ON f.user_id = social.id
      WHERE f.friend_id = ?
        AND f.status = ?
      ORDER BY f.updated_at DESC
    `,
    [userId, FRIENDSHIP_PENDING],
  );

  return {
    friends: friendRows.map((row) => sanitizeSocialRow(row as SocialRow)),
    following: followingRows.map((row) => sanitizeSocialRow(row as SocialRow)),
    fans: fanRows.map((row) => sanitizeSocialRow(row as SocialRow)),
    requests: requestRows.map((row) => sanitizeSocialRow(row as SocialRow)),
  };
}

export async function getChatConversations(userId: string): Promise<ChatConversationListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        cc.peer_id,
        cc.unread_count,
        cc.last_message,
        cc.last_message_at,
        up.name AS peer_name,
        up.avatar_url AS peer_avatar_url
      FROM chat_conversation cc
      LEFT JOIN user_profile up ON up.user_id = cc.peer_id
      WHERE cc.user_id = ?
      ORDER BY cc.last_message_at DESC, cc.updated_at DESC
    `,
    [userId],
  );

  return {
    items: (rows as ChatConversationRow[]).map((row) => ({
      userId: String(row.peer_id),
      name: row.peer_name || '未知用户',
      avatar: row.peer_avatar_url ?? null,
      unreadCount: Number(row.unread_count ?? 0),
      lastMessage: row.last_message,
      lastMessageAt: new Date(row.last_message_at).toISOString(),
    })),
  };
}

export async function getChatDetail(userId: string, peerId: string): Promise<ChatDetailResult> {
  const peer = await findUserById(peerId);
  if (!peer) {
    throw new Error('聊天对象不存在');
  }
  const db = getDbPool();
  await db.execute(
    `UPDATE chat_message SET is_read = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
    [peerId, userId],
  );
  await db.execute(
    `UPDATE chat_conversation SET unread_count = 0, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND peer_id = ?`,
    [userId, peerId],
  );
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, sender_id, receiver_id, content, is_read, created_at
      FROM chat_message
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC, id ASC
    `,
    [userId, peerId, peerId, userId],
  );

  return {
    peer: {
      id: String(peer.id),
      name: peer.name || '未知用户',
      avatar: peer.avatar_url ?? null,
      level: Number(peer.level ?? 1),
      title: peer.title ?? null,
      signature: peer.signature ?? null,
      followers: Number(peer.followers ?? 0),
      following: Number(peer.following ?? 0),
      winRate: Number(sanitizeUser(peer).winRate ?? 0),
      shopVerified: Number(peer.shop_verified ?? 0) > 0,
    },
    items: (rows as ChatRow[]).map((row) => sanitizeChatMessage(row, userId)),
  };
}

async function upsertConversationSummary(userId: string, peerId: string, lastMessage: string, unreadMode: 'reset' | 'increment') {
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO chat_conversation (
        user_id,
        peer_id,
        unread_count,
        last_message,
        last_message_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        unread_count = ${unreadMode === 'increment' ? 'chat_conversation.unread_count + 1' : '0'},
        last_message = VALUES(last_message),
        last_message_at = VALUES(last_message_at),
        updated_at = CURRENT_TIMESTAMP(3)
    `,
    [userId, peerId, unreadMode === 'increment' ? 1 : 0, lastMessage],
  );
}

export async function sendChatMessage(userId: string, peerId: string, payload: SendChatMessagePayload): Promise<ChatMessageItem> {
  const peer = await findUserById(peerId);
  if (!peer) {
    throw new Error('聊天对象不存在');
  }
  const content = payload.content.trim();
  if (!content) {
    throw new Error('消息内容不能为空');
  }
  const db = getDbPool();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_message (sender_id, receiver_id, content, is_read, created_at, updated_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, peerId, content],
  );
  await Promise.all([
    upsertConversationSummary(userId, peerId, content, 'reset'),
    upsertConversationSummary(peerId, userId, content, 'increment'),
  ]);
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, sender_id, receiver_id, content, is_read, created_at FROM chat_message WHERE id = ? LIMIT 1`,
    [result.insertId],
  );
  const row = rows[0] as ChatRow | undefined;
  if (!row) {
    throw new Error('消息发送成功后读取失败');
  }
  return sanitizeChatMessage(row, userId);
}
