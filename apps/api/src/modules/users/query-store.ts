import { randomBytes } from 'node:crypto';
import type mysql from 'mysql2/promise';

import type { UserSummary } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { sanitizeUser, type UserRow } from './model';

const UID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const userSelectSql = `
  SELECT
    u.id,
    u.uid_code,
    u.phone_number,
    u.password,
    u.banned,
    u.level,
    u.title,
    u.created_at,
    up.name,
    up.avatar_url,
    up.signature,
    up.gender,
    up.birthday,
    up.region,
    up.works_privacy,
    up.fav_privacy,
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
      FROM \`order\` o
      WHERE o.user_id = u.id
    ), 0) AS order_count,
    COALESCE((
      SELECT COUNT(DISTINCT gb.guess_id)
      FROM guess_bet gb
      WHERE gb.user_id = u.id
    ), 0) AS total_guess,
    COALESCE((
      SELECT COUNT(DISTINCT gb.guess_id)
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
    END AS shop_verified
  FROM user u
  LEFT JOIN user_profile up ON up.user_id = u.id
`;

function createRandomUidCode(length = 8) {
  const bytes = randomBytes(length);
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += UID_ALPHABET[bytes[index] % UID_ALPHABET.length];
  }
  return result;
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

export async function findUserByPhone(phone: string): Promise<UserRow | null> {
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

export async function findUserById(id: string | number): Promise<UserRow | null> {
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

async function findUserByUidCode(uidCode: string): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${userSelectSql}
      WHERE u.uid_code = ?
      LIMIT 1
    `,
    [uidCode],
  );
  return attachUserUidCode((rows[0] as UserRow | undefined) ?? null);
}

export async function findUserByPublicKey(key: string | number): Promise<UserRow | null> {
  const normalized = String(key ?? '').trim();
  if (!normalized) {
    return null;
  }

  return findUserByUidCode(normalized);
}

export async function getUserSummaryById(userId: string | number): Promise<UserSummary | null> {
  const row = await findUserById(userId);
  return row ? sanitizeUser(row) : null;
}
