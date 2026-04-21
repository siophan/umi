import { getDbPool } from '../../lib/db';
import { GUESS_ACTIVE, GUESS_REJECTED, GUESS_SETTLED, PK_RESULT_CANCELED, PK_RESULT_DRAW, PK_RESULT_INITIATOR_WIN, PK_RESULT_OPPONENT_WIN, PK_RESULT_PENDING, fallbackUserName, getOptionTextMap, toIsoString, toNumber, toOptionalNumber, toOptionalStringId, } from './guesses-shared';
function mapPkMatchStatus(row) {
    const result = Number(row.result ?? 0);
    const guessStatus = Number(row.guess_status ?? 0);
    const reviewStatus = Number(row.review_status ?? 0);
    if (result === PK_RESULT_CANCELED || guessStatus === GUESS_REJECTED) {
        return 'cancelled';
    }
    if (result === PK_RESULT_INITIATOR_WIN ||
        result === PK_RESULT_OPPONENT_WIN ||
        result === PK_RESULT_DRAW ||
        guessStatus === GUESS_SETTLED) {
        return 'completed';
    }
    if (guessStatus === GUESS_ACTIVE && reviewStatus === 30) {
        return 'active';
    }
    return 'pending';
}
function mapPkMatchStatusLabel(status) {
    if (status === 'active') {
        return '进行中';
    }
    if (status === 'completed') {
        return '完成';
    }
    if (status === 'cancelled') {
        return '已取消';
    }
    return '待开赛';
}
async function getPkMatchRows() {
    const db = getDbPool();
    const [rows] = await db.query(`
      SELECT
        pk.id,
        pk.guess_id,
        g.title AS guess_title,
        g.status AS guess_status,
        g.review_status,
        pk.initiator_id,
        initiator_profile.name AS initiator_name,
        initiator_user.phone_number AS initiator_phone,
        pk.opponent_id,
        opponent_profile.name AS opponent_name,
        opponent_user.phone_number AS opponent_phone,
        pk.initiator_choice_idx,
        pk.opponent_choice_idx,
        pk.stake_amount,
        pk.result,
        pk.reward_type,
        pk.reward_value,
        pk.reward_ref_id,
        pk.created_at,
        pk.settled_at,
        p.name AS product_name
      FROM pk_record pk
      INNER JOIN guess g ON g.id = pk.guess_id
      LEFT JOIN user initiator_user ON initiator_user.id = pk.initiator_id
      LEFT JOIN user_profile initiator_profile
        ON initiator_profile.user_id = pk.initiator_id
      LEFT JOIN user opponent_user ON opponent_user.id = pk.opponent_id
      LEFT JOIN user_profile opponent_profile
        ON opponent_profile.user_id = pk.opponent_id
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      ORDER BY pk.created_at DESC, pk.id DESC
    `);
    return rows;
}
function mapPkResultText(row, leftUser, rightUser) {
    const result = Number(row.result ?? 0);
    if (result === PK_RESULT_INITIATOR_WIN) {
        return `${leftUser} 获胜`;
    }
    if (result === PK_RESULT_OPPONENT_WIN) {
        return `${rightUser} 获胜`;
    }
    if (result === PK_RESULT_DRAW) {
        return '平局';
    }
    if (result === PK_RESULT_CANCELED) {
        return '已取消';
    }
    if (Number(row.guess_status) === GUESS_ACTIVE) {
        return '待结算';
    }
    return '待开赛';
}
export async function getAdminPkMatches() {
    const rows = await getPkMatchRows();
    const optionTextMap = await getOptionTextMap(Array.from(new Set(rows.map((row) => String(row.guess_id)))));
    return {
        items: rows.map((row) => {
            const leftUser = fallbackUserName(row.initiator_name, row.initiator_phone, row.initiator_id);
            const rightUser = fallbackUserName(row.opponent_name, row.opponent_phone, row.opponent_id);
            const status = mapPkMatchStatus(row);
            return {
                id: String(row.id),
                guessId: String(row.guess_id),
                title: `${row.product_name || row.guess_title} PK 局`,
                leftUserId: String(row.initiator_id),
                leftUser,
                rightUserId: String(row.opponent_id),
                rightUser,
                leftChoice: row.initiator_choice_idx == null
                    ? null
                    : optionTextMap.get(`${String(row.guess_id)}:${Number(row.initiator_choice_idx)}`) ||
                        null,
                rightChoice: row.opponent_choice_idx == null
                    ? null
                    : optionTextMap.get(`${String(row.guess_id)}:${Number(row.opponent_choice_idx)}`) ||
                        null,
                stake: toNumber(row.stake_amount),
                result: mapPkResultText(row, leftUser, rightUser),
                resultCode: Number(row.result ?? PK_RESULT_PENDING),
                status,
                statusLabel: mapPkMatchStatusLabel(status),
                rewardType: toOptionalNumber(row.reward_type),
                rewardValue: toOptionalNumber(row.reward_value),
                rewardRefId: toOptionalStringId(row.reward_ref_id),
                createdAt: toIsoString(row.created_at),
                settledAt: row.settled_at ? toIsoString(row.settled_at) : null,
            };
        }),
    };
}
export async function getAdminPkMatchStats() {
    const rows = await getPkMatchRows();
    return rows.reduce((stats, row) => {
        const status = mapPkMatchStatus(row);
        stats.total += 1;
        stats.totalStakeAmount += toNumber(row.stake_amount);
        if (status === 'pending') {
            stats.pending += 1;
        }
        else if (status === 'active') {
            stats.active += 1;
        }
        else if (status === 'completed') {
            stats.completed += 1;
        }
        else if (status === 'cancelled') {
            stats.cancelled += 1;
        }
        return stats;
    }, {
        total: 0,
        pending: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        totalStakeAmount: 0,
    });
}
