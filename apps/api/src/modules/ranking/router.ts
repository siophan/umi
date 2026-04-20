import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';
import type { RankingItem, RankingListResult, RankingPeriodType, RankingType } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';

export const rankingRouter: ExpressRouter = Router();

const BOARD_GUESS_WINS = 10;
const BOARD_GUESS_WIN_RATE = 20;
const BOARD_INVITE_COUNT = 30;
const PERIOD_DAILY = 10;
const PERIOD_WEEKLY = 20;
const PERIOD_MONTHLY = 30;
const PERIOD_ALL_TIME = 40;

type RankingRow = {
  rank_no: number | string;
  user_id: number | string;
  score: number | string;
  extra_json: string | Record<string, unknown> | null;
  period_value: number | string;
  user_name: string | null;
  avatar_url: string | null;
  level: number | string | null;
};

function mapRankingType(input: string): RankingType {
  const value = input.trim();
  if (value === 'guessWins' || value === 'earnings' || value === 'wins') {
    return 'guessWins';
  }
  if (value === 'inviteCount' || value === 'active' || value === 'invites') {
    return 'inviteCount';
  }
  return 'winRate';
}

function mapBoardTypeCode(type: RankingType) {
  if (type === 'guessWins') {
    return BOARD_GUESS_WINS;
  }
  if (type === 'inviteCount') {
    return BOARD_INVITE_COUNT;
  }
  return BOARD_GUESS_WIN_RATE;
}

function mapPeriodType(input: string): RankingPeriodType {
  const value = input.trim();
  if (value === 'daily') {
    return 'daily';
  }
  if (value === 'weekly') {
    return 'weekly';
  }
  if (value === 'monthly') {
    return 'monthly';
  }
  return 'allTime';
}

function mapPeriodTypeCode(type: RankingPeriodType) {
  if (type === 'daily') {
    return PERIOD_DAILY;
  }
  if (type === 'weekly') {
    return PERIOD_WEEKLY;
  }
  if (type === 'monthly') {
    return PERIOD_MONTHLY;
  }
  return PERIOD_ALL_TIME;
}

function parseExtraJson(raw: string | Record<string, unknown> | null) {
  if (!raw) {
    return {} as Record<string, unknown>;
  }
  if (typeof raw === 'object') {
    return raw;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {} as Record<string, unknown>;
  }
}

function formatRankingValue(type: RankingType, score: number, extraJson: Record<string, unknown>) {
  if (type === 'winRate') {
    const winRateValue = Number(extraJson.winRate ?? extraJson.win_rate ?? score ?? 0);
    return `${winRateValue.toFixed(1)}%`;
  }

  if (type === 'inviteCount') {
    const inviteValue = Number(extraJson.inviteCount ?? extraJson.invite_count ?? score ?? 0);
    return `${inviteValue}人`;
  }

  const winsValue = Number(extraJson.wins ?? extraJson.guessWins ?? score ?? 0);
  return `${winsValue}场`;
}

rankingRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const type = mapRankingType(typeof request.query.type === 'string' ? request.query.type : 'winRate');
    const periodType = mapPeriodType(
      typeof request.query.periodType === 'string' ? request.query.periodType : 'allTime',
    );
    const limit = Math.min(Math.max(Number(request.query.limit ?? 20) || 20, 1), 100);
    const boardTypeCode = mapBoardTypeCode(type);
    const periodTypeCode = mapPeriodTypeCode(periodType);
    const db = getDbPool();

    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          le.rank_no,
          le.user_id,
          le.score,
          le.extra_json,
          le.period_value,
          up.name AS user_name,
          up.avatar_url,
          u.level
        FROM leaderboard_entry le
        INNER JOIN user u ON u.id = le.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE le.board_type = ?
          AND le.period_type = ?
          AND le.period_value = (
            SELECT MAX(period_value)
            FROM leaderboard_entry
            WHERE board_type = ?
              AND period_type = ?
          )
        ORDER BY le.rank_no ASC, le.id ASC
        LIMIT ?
      `,
      [boardTypeCode, periodTypeCode, boardTypeCode, periodTypeCode, limit],
    );

    const rankingRows = rows as RankingRow[];
    const periodValue = rankingRows[0] ? String(rankingRows[0].period_value) : '0';

    ok(response, {
      items: rankingRows.map((row) => {
        const score = Number(row.score ?? 0);
        const extraJson = parseExtraJson(row.extra_json);
        return {
          rank: Number(row.rank_no ?? 0),
          userId: toEntityId(row.user_id),
          nickname: row.user_name || '匿名用户',
          avatar: row.avatar_url,
          level: Number(row.level ?? 1),
          value: formatRankingValue(type, score, extraJson),
          score,
          type,
          periodType,
          periodValue,
        } satisfies RankingItem;
      }),
      total: rankingRows.length,
      type,
      periodType,
      periodValue,
    } satisfies RankingListResult);
  }),
);
