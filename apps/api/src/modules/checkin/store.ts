import type mysql from 'mysql2/promise';

import type { CheckinResult, CheckinStatus } from '@umi/shared';

import { getDbPool } from '../../lib/db';

type CheckinRow = mysql.RowDataPacket & {
  checkin_date: Date | string;
  streak: number | string;
  total: number | string;
  reward: number | string;
};

function formatDate(date: Date): string {
  // YYYY-MM-DD（server 本地时区）— DATE 列不存时间，纯按自然日去重
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dateOnlyString(value: Date | string): string {
  if (value instanceof Date) return formatDate(value);
  // mysql2 在 namedPlaceholders / dateStrings 默认设置下，DATE 列回到 JS 多为 'YYYY-MM-DD'
  // 但仍可能是带时分秒的 ISO 字符串，统一截前 10 位
  return String(value).slice(0, 10);
}

async function fetchLatestRow(
  db: mysql.Pool,
  userId: string,
): Promise<CheckinRow | null> {
  const [rows] = await db.execute<CheckinRow[]>(
    `
      SELECT checkin_date, streak, total, reward
      FROM user_checkin
      WHERE user_id = ?
      ORDER BY checkin_date DESC
      LIMIT 1
    `,
    [userId],
  );
  return rows[0] ?? null;
}

export async function getCheckinStatus(userId: string): Promise<CheckinStatus> {
  const db = getDbPool();
  const last = await fetchLatestRow(db, userId);

  const today = formatDate(new Date());
  if (!last) {
    return { streak: 0, total: 0, checkedToday: false, lastCheckinDate: null };
  }

  const lastDate = dateOnlyString(last.checkin_date);
  const checkedToday = lastDate === today;

  // 中断判定：上次签到不是今天也不是昨天，连续天数从前端展示视角应清零
  // 但 streak 列存的是写入当时的连续天数，这里只在"展示连续 streak"时按是否中断折算
  const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const stillStreak = lastDate === today || lastDate === yesterday;

  return {
    streak: stillStreak ? Number(last.streak) : 0,
    total: Number(last.total),
    checkedToday,
    lastCheckinDate: lastDate,
  };
}

export async function performCheckin(userId: string): Promise<CheckinResult> {
  const db = getDbPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 锁本人最近一行，防同一秒并发双写
    const [rows] = await conn.execute<CheckinRow[]>(
      `
        SELECT checkin_date, streak, total, reward
        FROM user_checkin
        WHERE user_id = ?
        ORDER BY checkin_date DESC
        LIMIT 1
        FOR UPDATE
      `,
      [userId],
    );
    const last = rows[0] ?? null;

    const today = formatDate(new Date());
    if (last && dateOnlyString(last.checkin_date) === today) {
      // 已签：直接回滚事务，把当前状态回给前端，由 router 翻成 ALREADY_CHECKED 错误
      await conn.rollback();
      return {
        alreadyChecked: true,
        streak: Number(last.streak),
        total: Number(last.total),
        reward: 0,
      };
    }

    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const isConsecutive = last && dateOnlyString(last.checkin_date) === yesterday;
    const streak = isConsecutive ? Number(last.streak) + 1 : 1;
    const total = (last ? Number(last.total) : 0) + 1;
    const reward = 0; // 奖励发券待 #品牌发券改造 落地后再绑模板（详见 CLAUDE.md #29）

    try {
      await conn.execute(
        `
          INSERT INTO user_checkin (user_id, checkin_date, streak, total, reward)
          VALUES (?, ?, ?, ?, ?)
        `,
        [userId, today, streak, total, reward],
      );
    } catch (insertError) {
      // 同一用户首次签到的并发写入：FOR UPDATE 锁不到空集，两条 conn 都会到 INSERT；
      // 后到的撞 (user_id, checkin_date) UNIQUE → ER_DUP_ENTRY，等价于"已签今日"
      const code = (insertError as { code?: string } | null)?.code;
      if (code === 'ER_DUP_ENTRY') {
        await conn.rollback();
        const fresh = await fetchLatestRow(db, userId);
        return {
          alreadyChecked: true,
          streak: fresh ? Number(fresh.streak) : 0,
          total: fresh ? Number(fresh.total) : 0,
          reward: 0,
        };
      }
      throw insertError;
    }

    await conn.commit();

    return {
      alreadyChecked: false,
      streak,
      total,
      reward,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
