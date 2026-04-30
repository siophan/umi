import type mysql from 'mysql2/promise';

import type { AdminUserListQuery } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { sanitizeUser, type UserRow } from './model';
import { findUserById } from './query-store';

function buildAdminUserFilterWhere(query: AdminUserListQuery) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  const keyword = query.keyword?.trim();
  const phone = query.phone?.trim();
  const shopName = query.shopName?.trim();

  if (keyword) {
    const like = `%${keyword}%`;
    conditions.push(
      `(source.name LIKE ? OR source.uid_code LIKE ? OR source.phone_number LIKE ? OR source.shop_name LIKE ? OR source.region LIKE ?)`,
    );
    params.push(like, like, like, like, like);
  }

  if (phone) {
    conditions.push(`source.phone_number LIKE ?`);
    params.push(`%${phone}%`);
  }

  if (shopName) {
    conditions.push(`source.shop_name LIKE ?`);
    params.push(`%${shopName}%`);
  }

  if (query.role === 'user') {
    conditions.push(`source.shop_verified = 0`);
  } else if (query.role === 'shop_owner') {
    conditions.push(`source.shop_verified > 0`);
  } else if (query.role === 'banned') {
    conditions.push(`source.banned > 0`);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

async function getAdminUserSummaryCounts() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        COUNT(*) AS total_users,
        SUM(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM shop s
              WHERE s.user_id = u.id
                AND s.status = 10
            ) THEN 1
            ELSE 0
          END
        ) AS verified_users,
        SUM(CASE WHEN u.banned = 1 THEN 1 ELSE 0 END) AS banned_users
      FROM user u
    `,
  );
  const row = rows[0] as {
    total_users?: number | string;
    verified_users?: number | string;
    banned_users?: number | string;
  } | undefined;

  return {
    totalUsers: Number(row?.total_users ?? 0),
    verifiedUsers: Number(row?.verified_users ?? 0),
    bannedUsers: Number(row?.banned_users ?? 0),
  };
}

const adminUserSelectSql = `
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
    END AS shop_verified,
    COALESCE((
      SELECT COUNT(*)
      FROM user invited
      WHERE invited.invited_by = u.id
    ), 0) AS invite_count
  FROM user u
  LEFT JOIN user_profile up ON up.user_id = u.id
`;

async function attachAdminRows(rows: mysql.RowDataPacket[]) {
  return Promise.all(rows.map((row) => findUserById((row as UserRow).id)));
}

export async function listUsersForAdmin(query: AdminUserListQuery = {}) {
  const db = getDbPool();
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 20) || 20));
  const offset = (page - 1) * pageSize;
  const filters = buildAdminUserFilterWhere(query);

  const [countResult, listResult, summary] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM (
          ${adminUserSelectSql}
        ) source
        ${filters.whereSql}
      `,
      filters.params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT *
        FROM (
          ${adminUserSelectSql}
        ) source
        ${filters.whereSql}
        ORDER BY source.created_at DESC, source.id DESC
        LIMIT ?
        OFFSET ?
      `,
      [...filters.params, pageSize, offset],
    ),
    getAdminUserSummaryCounts(),
  ]);
  const [countRows] = countResult;
  const [rows] = listResult;
  const total = Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0);
  const normalizedRows = await attachAdminRows(rows);

  return {
    items: normalizedRows
      .filter((row): row is UserRow => row != null)
      .map((row) => sanitizeUser(row)),
    total,
    page,
    pageSize,
    summary,
  };
}

export async function setUserBanned(userId: string | number, banned: boolean) {
  const db = getDbPool();
  await db.execute(
    `
      UPDATE user
      SET banned = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
    `,
    [banned ? 1 : 0, userId],
  );
  const user = await findUserById(userId);
  return user ? sanitizeUser(user) : null;
}
