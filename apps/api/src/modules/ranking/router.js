import { Router } from 'express';
import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
export const rankingRouter = Router();
const BOARD_GUESS_WINS = 10;
const BOARD_GUESS_WIN_RATE = 20;
const BOARD_INVITE_COUNT = 30;
const PERIOD_DAILY = 10;
const PERIOD_WEEKLY = 20;
const PERIOD_MONTHLY = 30;
const PERIOD_ALL_TIME = 40;
/**
 * 对外兼容几种旧参数命名，最终统一映射到当前榜单类型枚举。
 */
function mapRankingType(input) {
    const value = input.trim();
    if (value === 'guessWins' || value === 'earnings' || value === 'wins') {
        return 'guessWins';
    }
    if (value === 'inviteCount' || value === 'active' || value === 'invites') {
        return 'inviteCount';
    }
    return 'winRate';
}
function mapBoardTypeCode(type) {
    if (type === 'guessWins') {
        return BOARD_GUESS_WINS;
    }
    if (type === 'inviteCount') {
        return BOARD_INVITE_COUNT;
    }
    return BOARD_GUESS_WIN_RATE;
}
function mapPeriodType(input) {
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
function mapPeriodTypeCode(type) {
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
/**
 * 排行榜额外统计挂在 extra_json，解析失败时直接降级为空对象，不能把榜单接口整条打挂。
 */
function parseExtraJson(raw) {
    if (!raw) {
        return {};
    }
    if (typeof raw === 'object') {
        return raw;
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
/**
 * 榜单展示值优先使用 extra_json 里的业务口径，score 只作为兜底原始分值。
 */
function formatRankingValue(type, score, extraJson) {
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
rankingRouter.get('/', asyncHandler(async (request, response) => {
    const type = mapRankingType(typeof request.query.type === 'string' ? request.query.type : 'winRate');
    const periodType = mapPeriodType(typeof request.query.periodType === 'string' ? request.query.periodType : 'allTime');
    const limit = Math.min(Math.max(Number(request.query.limit ?? 20) || 20, 1), 100);
    const boardTypeCode = mapBoardTypeCode(type);
    const periodTypeCode = mapPeriodTypeCode(periodType);
    const db = getDbPool();
    const [rows] = await db.query(`
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
      `, [boardTypeCode, periodTypeCode, boardTypeCode, periodTypeCode, limit]);
    const rankingRows = rows;
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
            };
        }),
        total: rankingRows.length,
        type,
        periodType,
        periodValue,
    });
}));
