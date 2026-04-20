import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';
import type {
  SocialOverviewResult,
  SocialUserItem,
  UserSearchItem,
  UserSearchResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const FRIENDSHIP_PENDING = 10;
const FRIENDSHIP_ACCEPTED = 30;
const FRIENDSHIP_REJECTED = 40;

type SocialRow = {
  id: number | string;
  uid_code: string | null;
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

type UserSearchRow = SocialRow & {
  shop_name: string | null;
  relation: UserSearchItem['relation'];
};

function sanitizeSocialRow(row: SocialRow): SocialUserItem {
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);
  return {
    id: toEntityId(row.id),
    uid: row.uid_code ?? '',
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

function sanitizeUserSearchRow(row: UserSearchRow): UserSearchItem {
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);

  return {
    id: toEntityId(row.id),
    uid: row.uid_code ?? '',
    name: row.name || '未知用户',
    avatar: row.avatar_url ?? null,
    signature: row.signature ?? null,
    level: Number(row.level ?? 1),
    followers: Number(row.followers ?? 0),
    totalGuess,
    wins,
    winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
    shopVerified: Number(row.shop_verified ?? 0) > 0,
    shopName: row.shop_name ?? null,
    relation: row.relation ?? 'none',
  };
}

export async function getSocialOverview(userId: string): Promise<SocialOverviewResult> {
  const db = getDbPool();
  const socialSelect = `
    SELECT
      u.id,
      u.uid_code,
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

export async function acceptFriendRequest(viewerId: string, requesterId: string) {
  const db = getDbPool();

  const [pendingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
      LIMIT 1
    `,
    [requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  if (!pendingRows.length) {
    throw new Error('好友申请不存在');
  }

  await db.execute(
    `
      UPDATE friendship
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
    `,
    [FRIENDSHIP_ACCEPTED, requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  const [reverseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE user_id = ?
        AND friend_id = ?
      LIMIT 1
    `,
    [viewerId, requesterId],
  );

  if (reverseRows.length) {
    await db.execute(
      `
        UPDATE friendship
        SET status = ?,
            updated_at = CURRENT_TIMESTAMP(3)
        WHERE user_id = ?
          AND friend_id = ?
      `,
      [FRIENDSHIP_ACCEPTED, viewerId, requesterId],
    );
  } else {
    await db.execute(
      `
        INSERT INTO friendship (user_id, friend_id, status, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [viewerId, requesterId, FRIENDSHIP_ACCEPTED],
    );
  }

  return { success: true as const };
}

export async function rejectFriendRequest(viewerId: string, requesterId: string) {
  const db = getDbPool();

  const [pendingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
      LIMIT 1
    `,
    [requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  if (!pendingRows.length) {
    throw new Error('好友申请不存在');
  }

  await db.execute(
    `
      UPDATE friendship
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
    `,
    [FRIENDSHIP_REJECTED, requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  return { success: true as const };
}

export async function searchUsers(userId: string, q?: string): Promise<UserSearchResult> {
  const db = getDbPool();
  const keyword = q?.trim() || '';
  const likeKeyword = `%${keyword}%`;

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        u.id,
        u.uid_code,
        up.name,
        up.avatar_url,
        u.level,
        u.title,
        up.signature,
        COALESCE((SELECT COUNT(*) FROM user_follow f1 WHERE f1.following_id = u.id), 0) AS followers,
        COALESCE((SELECT COUNT(*) FROM user_follow f2 WHERE f2.follower_id = u.id), 0) AS following,
        COALESCE((SELECT COUNT(*) FROM guess_bet gb1 WHERE gb1.user_id = u.id), 0) AS total_guess,
        COALESCE((SELECT COUNT(*) FROM guess_bet gb2 WHERE gb2.user_id = u.id AND gb2.status = 30), 0) AS wins,
        CASE WHEN s.id IS NULL THEN 0 ELSE 1 END AS shop_verified,
        s.name AS shop_name,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendship f
            WHERE f.user_id = ?
              AND f.friend_id = u.id
              AND f.status = ?
          ) THEN 'friend'
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = ?
              AND uf.following_id = u.id
          ) THEN 'following'
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = u.id
              AND uf.following_id = ?
          ) THEN 'fan'
          ELSE 'none'
        END AS relation
      FROM user u
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN (
        SELECT current_shop.user_id, current_shop.name
        FROM shop current_shop
        INNER JOIN (
          SELECT user_id, MAX(id) AS max_id
          FROM shop
          WHERE status = 10
          GROUP BY user_id
        ) latest_shop ON latest_shop.max_id = current_shop.id
      ) s ON s.user_id = u.id
      WHERE u.id <> ?
        AND (
          ? = ''
          OR COALESCE(up.name, '') LIKE ?
          OR COALESCE(up.signature, '') LIKE ?
          OR COALESCE(u.uid_code, '') LIKE ?
          OR COALESCE(s.name, '') LIKE ?
        )
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendship f
            WHERE f.user_id = ?
              AND f.friend_id = u.id
              AND f.status = ?
          ) THEN 0
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = ?
              AND uf.following_id = u.id
          ) THEN 1
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = u.id
              AND uf.following_id = ?
          ) THEN 2
          ELSE 3
        END ASC,
        COALESCE((SELECT COUNT(*) FROM user_follow f1 WHERE f1.following_id = u.id), 0) DESC,
        COALESCE((SELECT COUNT(*) FROM guess_bet gb1 WHERE gb1.user_id = u.id), 0) DESC,
        u.created_at DESC
      LIMIT 12
    `,
    [
      userId,
      FRIENDSHIP_ACCEPTED,
      userId,
      userId,
      userId,
      keyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      userId,
      FRIENDSHIP_ACCEPTED,
      userId,
      userId,
    ],
  );

  return {
    items: (rows as UserSearchRow[]).map((row) => sanitizeUserSearchRow(row)),
  };
}
