import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { BET_LOST, BET_WON } from '../guess/guess-shared';
const BOARD_GUESS_WINS = 10;
const BOARD_GUESS_WIN_RATE = 20;
const BOARD_INVITE_COUNT = 30;
const PERIOD_DAILY = 10;
const PERIOD_WEEKLY = 20;
const PERIOD_MONTHLY = 30;
const PERIOD_ALL_TIME = 40;
function mapBoardTypeCode(type) {
    if (type === 'guessWins') {
        return BOARD_GUESS_WINS;
    }
    if (type === 'inviteCount') {
        return BOARD_INVITE_COUNT;
    }
    return BOARD_GUESS_WIN_RATE;
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
function mapBoardType(code) {
    if (code === BOARD_GUESS_WINS) {
        return 'guessWins';
    }
    if (code === BOARD_INVITE_COUNT) {
        return 'inviteCount';
    }
    return 'winRate';
}
function mapBoardTypeLabel(type) {
    if (type === 'guessWins') {
        return '猜中次数榜';
    }
    if (type === 'inviteCount') {
        return '邀请榜';
    }
    return '胜率榜';
}
function mapPeriodType(code) {
    if (code === PERIOD_DAILY) {
        return 'daily';
    }
    if (code === PERIOD_WEEKLY) {
        return 'weekly';
    }
    if (code === PERIOD_MONTHLY) {
        return 'monthly';
    }
    return 'allTime';
}
function mapPeriodTypeLabel(type) {
    if (type === 'daily') {
        return '日榜';
    }
    if (type === 'weekly') {
        return '周榜';
    }
    if (type === 'monthly') {
        return '月榜';
    }
    return '总榜';
}
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
function formatExtraSummary(type, extraJson) {
    if (type === 'winRate') {
        const wins = Number(extraJson.wins ?? extraJson.guessWins ?? 0);
        const total = Number(extraJson.totalGuesses ?? extraJson.total_guesses ?? 0);
        if (wins > 0 || total > 0) {
            return `猜中 ${wins} / 共 ${total}`;
        }
        return null;
    }
    if (type === 'inviteCount') {
        const invited = Number(extraJson.inviteCount ?? extraJson.invite_count ?? 0);
        return invited > 0 ? `邀请 ${invited} 人` : null;
    }
    const wins = Number(extraJson.wins ?? extraJson.guessWins ?? 0);
    const streak = Number(extraJson.winStreak ?? extraJson.win_streak ?? 0);
    if (streak > 0) {
        return `最长连胜 ${streak} 场`;
    }
    return wins > 0 ? `猜中 ${wins} 场` : null;
}
function formatPeriodLabel(periodType, periodValue) {
    if (periodType === 'allTime' || periodValue === '0') {
        return '总榜';
    }
    if (periodType === 'daily' && /^\d{8}$/.test(periodValue)) {
        const year = periodValue.slice(0, 4);
        const month = periodValue.slice(4, 6);
        const day = periodValue.slice(6, 8);
        return `${year}-${month}-${day}`;
    }
    if (periodType === 'weekly' && /^\d{6}$/.test(periodValue)) {
        const year = periodValue.slice(0, 4);
        const week = periodValue.slice(4, 6);
        return `${year} 第${week}周`;
    }
    if (periodType === 'monthly' && /^\d{6}$/.test(periodValue)) {
        const year = periodValue.slice(0, 4);
        const month = periodValue.slice(4, 6);
        return `${year}-${month}`;
    }
    return periodValue;
}
function toDateTimeString(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
function pad2(value) {
    return String(value).padStart(2, '0');
}
function getIsoWeekParts(date) {
    const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return {
        year: current.getUTCFullYear(),
        week,
    };
}
function resolvePeriodValue(periodType, rawValue) {
    if (periodType === 'allTime') {
        return '0';
    }
    const trimmed = rawValue?.trim();
    if (trimmed) {
        return trimmed;
    }
    const now = new Date();
    if (periodType === 'daily') {
        return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
    }
    if (periodType === 'weekly') {
        const { year, week } = getIsoWeekParts(now);
        return `${year}${pad2(week)}`;
    }
    return `${now.getFullYear()}${pad2(now.getMonth() + 1)}`;
}
function buildRefreshTargets(payload) {
    const boardTypes = payload.boardType
        ? [payload.boardType]
        : ['guessWins', 'winRate', 'inviteCount'];
    const periodType = payload.periodType ?? 'allTime';
    const periodValue = resolvePeriodValue(periodType, payload.periodValue);
    return boardTypes.map((boardType) => ({
        boardType,
        periodType,
        periodValue,
    }));
}
function buildPeriodWhereSql(column, target) {
    if (target.periodType === 'allTime') {
        return { sql: '', params: [] };
    }
    if (target.periodType === 'daily') {
        return {
            sql: ` AND DATE_FORMAT(${column}, '%Y%m%d') = ?`,
            params: [target.periodValue],
        };
    }
    if (target.periodType === 'weekly') {
        return {
            sql: ` AND DATE_FORMAT(${column}, '%x%v') = ?`,
            params: [target.periodValue],
        };
    }
    return {
        sql: ` AND DATE_FORMAT(${column}, '%Y%m') = ?`,
        params: [target.periodValue],
    };
}
async function fetchGuessWinsRows(connection, target) {
    const period = buildPeriodWhereSql('gb.created_at', target);
    const [rows] = await connection.query(`
      SELECT
        gb.user_id,
        COUNT(*) AS wins
      FROM guess_bet gb
      WHERE gb.status = ?
      ${period.sql}
      GROUP BY gb.user_id
      HAVING wins > 0
      ORDER BY wins DESC, gb.user_id ASC
    `, [BET_WON, ...period.params]);
    return rows;
}
async function fetchWinRateRows(connection, target) {
    const period = buildPeriodWhereSql('gb.created_at', target);
    const [rows] = await connection.query(`
      SELECT
        gb.user_id,
        SUM(CASE WHEN gb.status = ? THEN 1 ELSE 0 END) AS wins,
        COUNT(*) AS total_guesses
      FROM guess_bet gb
      WHERE gb.status IN (?, ?)
      ${period.sql}
      GROUP BY gb.user_id
      HAVING total_guesses > 0
      ORDER BY (wins / total_guesses) DESC, wins DESC, gb.user_id ASC
    `, [BET_WON, BET_WON, BET_LOST, ...period.params]);
    return rows;
}
async function fetchInviteCountRows(connection, target) {
    const period = buildPeriodWhereSql('u.created_at', target);
    const [rows] = await connection.query(`
      SELECT
        u.invited_by AS user_id,
        COUNT(*) AS invite_count
      FROM user u
      WHERE u.invited_by IS NOT NULL
      ${period.sql}
      GROUP BY u.invited_by
      HAVING invite_count > 0
      ORDER BY invite_count DESC, u.invited_by ASC
    `, period.params);
    return rows;
}
async function replaceLeaderboardEntries(connection, target, generatedAt) {
    const boardTypeCode = mapBoardTypeCode(target.boardType);
    const periodTypeCode = mapPeriodTypeCode(target.periodType);
    await connection.execute(`
      DELETE FROM leaderboard_entry
      WHERE board_type = ?
        AND period_type = ?
        AND CAST(period_value AS CHAR) = ?
    `, [boardTypeCode, periodTypeCode, target.periodValue]);
    if (target.boardType === 'guessWins') {
        const rows = await fetchGuessWinsRows(connection, target);
        for (const [index, row] of rows.entries()) {
            const wins = Number(row.wins ?? 0);
            await connection.execute(`
          INSERT INTO leaderboard_entry (
            board_type,
            period_type,
            period_value,
            user_id,
            rank_no,
            score,
            extra_json,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                boardTypeCode,
                periodTypeCode,
                target.periodValue,
                row.user_id,
                index + 1,
                wins,
                JSON.stringify({ wins }),
                generatedAt,
                generatedAt,
            ]);
        }
        return rows.length;
    }
    if (target.boardType === 'winRate') {
        const rows = await fetchWinRateRows(connection, target);
        for (const [index, row] of rows.entries()) {
            const wins = Number(row.wins ?? 0);
            const totalGuesses = Number(row.total_guesses ?? 0);
            const winRate = totalGuesses > 0 ? Number(((wins / totalGuesses) * 100).toFixed(1)) : 0;
            await connection.execute(`
          INSERT INTO leaderboard_entry (
            board_type,
            period_type,
            period_value,
            user_id,
            rank_no,
            score,
            extra_json,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                boardTypeCode,
                periodTypeCode,
                target.periodValue,
                row.user_id,
                index + 1,
                winRate,
                JSON.stringify({ winRate, wins, totalGuesses }),
                generatedAt,
                generatedAt,
            ]);
        }
        return rows.length;
    }
    const rows = await fetchInviteCountRows(connection, target);
    for (const [index, row] of rows.entries()) {
        const inviteCount = Number(row.invite_count ?? 0);
        await connection.execute(`
        INSERT INTO leaderboard_entry (
          board_type,
          period_type,
          period_value,
          user_id,
          rank_no,
          score,
          extra_json,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            boardTypeCode,
            periodTypeCode,
            target.periodValue,
            row.user_id,
            index + 1,
            inviteCount,
            JSON.stringify({ inviteCount }),
            generatedAt,
            generatedAt,
        ]);
    }
    return rows.length;
}
function mapRankingSummaryItem(row) {
    const boardType = mapBoardType(Number(row.board_type));
    const periodType = mapPeriodType(Number(row.period_type));
    const periodValue = String(row.period_value ?? '0');
    const topScore = Number(row.top_score ?? 0);
    const topExtraJson = parseExtraJson(row.top_extra_json);
    return {
        id: `${boardType}:${periodType}:${periodValue}`,
        boardType,
        boardTypeLabel: mapBoardTypeLabel(boardType),
        periodType,
        periodTypeLabel: mapPeriodTypeLabel(periodType),
        periodValue,
        periodLabel: formatPeriodLabel(periodType, periodValue),
        entryCount: Number(row.entry_count ?? 0),
        topUserId: row.top_user_id == null ? null : toEntityId(row.top_user_id),
        topUserName: row.top_user_name || null,
        topUserUid: row.top_user_uid || null,
        topScore,
        topValue: formatRankingValue(boardType, topScore, topExtraJson),
        generatedAt: toDateTimeString(row.generated_at),
    };
}
function mapRankingEntryItem(boardType, row) {
    const score = Number(row.score ?? 0);
    const extraJson = parseExtraJson(row.extra_json);
    return {
        rank: Number(row.rank_no ?? 0),
        userId: toEntityId(row.user_id),
        userUid: row.user_uid || null,
        nickname: row.user_name || '匿名用户',
        avatar: row.avatar_url || null,
        level: Number(row.level ?? 1),
        score,
        value: formatRankingValue(boardType, score, extraJson),
        extraSummary: formatExtraSummary(boardType, extraJson),
    };
}
export async function getAdminRankings(filters) {
    const db = getDbPool();
    const conditions = [];
    const params = [];
    if (filters.boardType) {
        conditions.push('summary.board_type = ?');
        params.push(mapBoardTypeCode(filters.boardType));
    }
    if (filters.periodType) {
        conditions.push('summary.period_type = ?');
        params.push(mapPeriodTypeCode(filters.periodType));
    }
    if (filters.periodValue?.trim()) {
        conditions.push('CAST(summary.period_value AS CHAR) = ?');
        params.push(filters.periodValue.trim());
    }
    if (filters.topUser?.trim()) {
        const keyword = `%${filters.topUser.trim()}%`;
        conditions.push('(COALESCE(up.name, \'\') LIKE ? OR COALESCE(u.uid_code, \'\') LIKE ?)');
        params.push(keyword, keyword);
    }
    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.query(`
      SELECT
        summary.board_type,
        summary.period_type,
        summary.period_value,
        summary.generated_at,
        summary.entry_count,
        summary.top_user_id,
        summary.top_score,
        summary.top_extra_json,
        up.name AS top_user_name,
        u.uid_code AS top_user_uid
      FROM (
        SELECT
          le.board_type,
          le.period_type,
          le.period_value,
          MAX(le.updated_at) AS generated_at,
          COUNT(*) AS entry_count,
          MAX(CASE WHEN le.rank_no = 1 THEN le.user_id END) AS top_user_id,
          MAX(CASE WHEN le.rank_no = 1 THEN le.score END) AS top_score,
          MAX(CASE WHEN le.rank_no = 1 THEN le.extra_json END) AS top_extra_json
        FROM leaderboard_entry le
        GROUP BY le.board_type, le.period_type, le.period_value
      ) summary
      LEFT JOIN user u ON u.id = summary.top_user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      ${whereSql}
      ORDER BY summary.generated_at DESC, summary.board_type ASC, summary.period_type ASC, summary.period_value DESC
    `, params);
    const items = rows.map(mapRankingSummaryItem);
    return {
        items,
        summary: {
            total: items.length,
            guessWins: items.filter((item) => item.boardType === 'guessWins').length,
            winRate: items.filter((item) => item.boardType === 'winRate').length,
            inviteCount: items.filter((item) => item.boardType === 'inviteCount').length,
        },
    };
}
export async function getAdminRankingDetail(boardType, periodType, periodValue) {
    const db = getDbPool();
    const boardTypeCode = mapBoardTypeCode(boardType);
    const periodTypeCode = mapPeriodTypeCode(periodType);
    const [rows] = await db.query(`
      SELECT
        le.rank_no,
        le.user_id,
        le.score,
        le.extra_json,
        le.updated_at,
        up.name AS user_name,
        u.uid_code AS user_uid,
        up.avatar_url,
        u.level
      FROM leaderboard_entry le
      INNER JOIN user u ON u.id = le.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE le.board_type = ?
        AND le.period_type = ?
        AND CAST(le.period_value AS CHAR) = ?
      ORDER BY le.rank_no ASC, le.id ASC
    `, [boardTypeCode, periodTypeCode, periodValue]);
    const rankingRows = rows;
    const generatedAt = rankingRows[0]?.updated_at
        ? toDateTimeString(rankingRows[0].updated_at)
        : new Date().toISOString();
    return {
        boardType,
        boardTypeLabel: mapBoardTypeLabel(boardType),
        periodType,
        periodTypeLabel: mapPeriodTypeLabel(periodType),
        periodValue,
        periodLabel: formatPeriodLabel(periodType, periodValue),
        generatedAt,
        totalEntries: rankingRows.length,
        items: rankingRows.map((row) => mapRankingEntryItem(boardType, row)),
    };
}
export async function refreshAdminRankings(payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const generatedAt = new Date();
        const targets = buildRefreshTargets(payload);
        const items = [];
        for (const target of targets) {
            const entryCount = await replaceLeaderboardEntries(connection, target, generatedAt);
            items.push({
                boardType: target.boardType,
                periodType: target.periodType,
                periodValue: target.periodValue,
                entryCount,
                generatedAt: generatedAt.toISOString(),
            });
        }
        await connection.commit();
        return { items };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
