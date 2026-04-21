import { toEntityId, toOptionalEntityId, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
const GUESS_DRAFT = 10;
const GUESS_PENDING_REVIEW = 20;
const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const GUESS_REJECTED = 90;
const GUESS_SCOPE_FRIENDS = 20;
const REVIEW_PENDING = 10;
const REVIEW_APPROVED = 30;
const REVIEW_REJECTED = 40;
const REVIEW_ACTION_SUBMIT = 10;
const REVIEW_ACTION_APPROVE = 20;
const REVIEW_ACTION_REJECT = 30;
const INVITATION_PENDING = 10;
const INVITATION_ACCEPTED = 30;
const INVITATION_REJECTED = 40;
const INVITATION_EXPIRED = 90;
const FRIEND_CONFIRM_CONFIRMED = 10;
const FRIEND_CONFIRM_REJECTED = 20;
const PK_RESULT_PENDING = 10;
const PK_RESULT_INITIATOR_WIN = 30;
const PK_RESULT_OPPONENT_WIN = 40;
const PK_RESULT_DRAW = 50;
const PK_RESULT_CANCELED = 90;
function toNumber(value) {
    return Number(value ?? 0);
}
function toOptionalNumber(value) {
    return value == null ? null : Number(value);
}
function toStringId(value) {
    return toEntityId(value ?? 0);
}
function toOptionalStringId(value) {
    return toOptionalEntityId(value);
}
function toIsoString(value) {
    return new Date(value).toISOString();
}
function fallbackUserName(name, phoneNumber, userId) {
    if (name?.trim()) {
        return name.trim();
    }
    if (phoneNumber) {
        return `用户${String(phoneNumber).slice(-4)}`;
    }
    if (userId != null) {
        return `用户${String(userId)}`;
    }
    return '未知用户';
}
function mapGuessStatus(code) {
    const value = Number(code ?? 0);
    if (value === GUESS_DRAFT) {
        return 'draft';
    }
    if (value === GUESS_PENDING_REVIEW) {
        return 'pending_review';
    }
    if (value === GUESS_SETTLED) {
        return 'settled';
    }
    if (value === GUESS_REJECTED) {
        return 'cancelled';
    }
    return 'active';
}
function mapGuessReviewStatus(code) {
    const value = Number(code ?? 0);
    if (value === REVIEW_PENDING) {
        return 'pending';
    }
    if (value === REVIEW_APPROVED) {
        return 'approved';
    }
    return 'rejected';
}
function normalizeGuessReviewStatus(status) {
    if (status === 'approved' || status === 'rejected') {
        return status;
    }
    throw new Error('审核状态不合法');
}
function normalizeGuessRejectReason(status, rejectReason) {
    const value = rejectReason?.trim() ?? '';
    if (status === 'rejected' && !value) {
        throw new Error('请填写拒绝原因');
    }
    return value ? value.slice(0, 200) : null;
}
function ensureGuessPendingReview(row) {
    if (Number(row.status ?? 0) !== GUESS_PENDING_REVIEW ||
        Number(row.review_status ?? 0) !== REVIEW_PENDING) {
        throw new Error('竞猜当前不可审核');
    }
}
function mapFriendGuessStatus(guessStatus, reviewStatus) {
    const status = Number(guessStatus ?? 0);
    const review = Number(reviewStatus ?? 0);
    if (status === GUESS_ACTIVE && review === REVIEW_APPROVED) {
        return 'active';
    }
    if (status === GUESS_SETTLED || status === GUESS_REJECTED) {
        return 'ended';
    }
    return 'pending';
}
function mapFriendGuessStatusLabel(status) {
    if (status === 'active') {
        return '进行中';
    }
    if (status === 'ended') {
        return '已结束';
    }
    return '待开赛';
}
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
    if (guessStatus === GUESS_ACTIVE && reviewStatus === REVIEW_APPROVED) {
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
function buildProductSummary(row) {
    return {
        id: toStringId(row.product_id),
        name: row.product_name || '未命名商品',
        brand: row.brand_name || '未知品牌',
        img: row.product_img || '',
        price: toNumber(row.product_price) / 100,
        guessPrice: toNumber(row.product_guess_price ?? row.product_price) / 100,
        category: row.category || '未分类',
        status: 'active',
    };
}
function buildVoteCountMap(voteRows) {
    const map = new Map();
    for (const row of voteRows) {
        map.set(`${String(row.guess_id)}:${Number(row.option_index)}`, toNumber(row.vote_count));
    }
    return map;
}
function groupRowsByGuess(rows) {
    const map = new Map();
    for (const row of rows) {
        const guessId = String(row.guess_id);
        const current = map.get(guessId) || [];
        current.push(row);
        map.set(guessId, current);
    }
    return map;
}
function buildGuessSummary(row, options, voteCountMap) {
    return {
        id: toEntityId(row.id),
        title: row.title,
        status: mapGuessStatus(row.status),
        reviewStatus: mapGuessReviewStatus(row.review_status),
        category: row.category || '未分类',
        endTime: toIsoString(row.end_time),
        creatorId: toEntityId(row.creator_id),
        product: buildProductSummary(row),
        options: options.map((option) => ({
            id: `${String(row.id)}-${Number(option.option_index)}`,
            optionIndex: Number(option.option_index),
            optionText: option.option_text,
            odds: Number(option.odds ?? 1),
            voteCount: voteCountMap.get(`${String(row.id)}:${Number(option.option_index)}`) ?? 0,
            isResult: Boolean(option.is_result),
        })),
    };
}
async function getGuessRows() {
    const db = getDbPool();
    const [rows] = await db.query(`
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        COALESCE(gc.name, pc.name) AS category,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        p.price AS product_price,
        p.guess_price AS product_guess_price
      FROM guess g
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category gc ON gc.id = g.category_id
      LEFT JOIN category pc ON pc.id = bp.category_id
      ORDER BY g.created_at DESC, g.id DESC
    `);
    return rows;
}
async function getGuessOptionRows(guessIds) {
    if (guessIds.length === 0) {
        return [];
    }
    const db = getDbPool();
    const [rows] = await db.query(`
      SELECT
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      FROM guess_option
      WHERE guess_id IN (?)
      ORDER BY guess_id ASC, option_index ASC
    `, [guessIds]);
    return rows;
}
async function getGuessVoteRows(guessIds) {
    if (guessIds.length === 0) {
        return [];
    }
    const db = getDbPool();
    const [rows] = await db.query(`
      SELECT
        guess_id,
        choice_idx AS option_index,
        COUNT(*) AS vote_count
      FROM guess_bet
      WHERE guess_id IN (?)
      GROUP BY guess_id, choice_idx
    `, [guessIds]);
    return rows;
}
async function getOptionTextMap(guessIds) {
    const optionRows = await getGuessOptionRows(guessIds);
    const optionTextMap = new Map();
    for (const option of optionRows) {
        optionTextMap.set(`${String(option.guess_id)}:${Number(option.option_index)}`, option.option_text);
    }
    return optionTextMap;
}
export async function getAdminGuesses() {
    const rows = await getGuessRows();
    const guessIds = rows.map((row) => String(row.id));
    const [optionRows, voteRows] = await Promise.all([
        getGuessOptionRows(guessIds),
        getGuessVoteRows(guessIds),
    ]);
    const optionsByGuess = groupRowsByGuess(optionRows);
    const voteCountMap = buildVoteCountMap(voteRows);
    return {
        items: rows.map((row) => buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], voteCountMap)),
    };
}
export async function reviewAdminGuess(guessId, reviewerId, payload) {
    const status = normalizeGuessReviewStatus(payload.status);
    const rejectReason = normalizeGuessRejectReason(status, payload.rejectReason);
    const nextGuessStatus = status === 'approved' ? GUESS_ACTIVE : GUESS_REJECTED;
    const nextReviewStatus = status === 'approved' ? REVIEW_APPROVED : REVIEW_REJECTED;
    const action = status === 'approved' ? REVIEW_ACTION_APPROVE : REVIEW_ACTION_REJECT;
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [guessRows] = await connection.execute(`
        SELECT id, status, review_status
        FROM guess
        WHERE id = ?
        LIMIT 1
      `, [guessId]);
        const guess = guessRows[0];
        if (!guess) {
            throw new Error('竞猜不存在');
        }
        ensureGuessPendingReview(guess);
        await connection.execute(`
        UPDATE guess
        SET
          status = ?,
          review_status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [nextGuessStatus, nextReviewStatus, guessId]);
        await connection.execute(`
        INSERT INTO guess_review_log (
          guess_id,
          reviewer_id,
          action,
          from_status,
          to_status,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `, [guessId, reviewerId, action, Number(guess.status ?? 0), nextGuessStatus, rejectReason]);
        await connection.commit();
        return {
            id: toEntityId(guess.id),
            status,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
async function getFriendGuessRows() {
    const db = getDbPool();
    const [rows] = await db.query(`
      SELECT
        g.id AS guess_id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        invitation_stats.inviter_id,
        inviter_profile.name AS inviter_name,
        inviter_user.phone_number AS inviter_phone,
        p.name AS product_name,
        invitation_stats.invitation_count,
        invitation_stats.pending_count,
        invitation_stats.accepted_count,
        invitation_stats.rejected_count,
        invitation_stats.expired_count,
        COALESCE(confirm_stats.confirm_count, 0) AS confirm_count,
        COALESCE(confirm_stats.reject_confirm_count, 0) AS reject_confirm_count,
        COALESCE(bet_stats.bet_participant_count, 0) AS bet_participant_count,
        invitation_stats.total_paid_amount,
        invitation_stats.payment_mode,
        invitation_stats.paid_by
      FROM guess g
      INNER JOIN (
        SELECT
          guess_id,
          MIN(inviter_id) AS inviter_id,
          COUNT(*) AS invitation_count,
          SUM(CASE WHEN status = ${INVITATION_PENDING} THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN status = ${INVITATION_ACCEPTED} THEN 1 ELSE 0 END) AS accepted_count,
          SUM(CASE WHEN status = ${INVITATION_REJECTED} THEN 1 ELSE 0 END) AS rejected_count,
          SUM(CASE WHEN status = ${INVITATION_EXPIRED} THEN 1 ELSE 0 END) AS expired_count,
          SUM(COALESCE(paid_amount, 0)) AS total_paid_amount,
          MAX(payment_mode) AS payment_mode,
          MAX(paid_by) AS paid_by
        FROM guess_invitation
        GROUP BY guess_id
      ) invitation_stats ON invitation_stats.guess_id = g.id
      LEFT JOIN (
        SELECT
          guess_id,
          SUM(CASE WHEN action = ${FRIEND_CONFIRM_CONFIRMED} THEN 1 ELSE 0 END) AS confirm_count,
          SUM(CASE WHEN action = ${FRIEND_CONFIRM_REJECTED} THEN 1 ELSE 0 END) AS reject_confirm_count
        FROM friend_guess_confirm
        GROUP BY guess_id
      ) confirm_stats ON confirm_stats.guess_id = g.id
      LEFT JOIN (
        SELECT guess_id, COUNT(*) AS bet_participant_count
        FROM guess_bet
        GROUP BY guess_id
      ) bet_stats ON bet_stats.guess_id = g.id
      LEFT JOIN user inviter_user
        ON inviter_user.id = COALESCE(invitation_stats.inviter_id, g.creator_id)
      LEFT JOIN user_profile inviter_profile
        ON inviter_profile.user_id = inviter_user.id
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      WHERE g.scope = ${GUESS_SCOPE_FRIENDS}
      ORDER BY g.created_at DESC, g.id DESC
    `);
    return rows;
}
export async function getAdminFriendGuesses() {
    const rows = await getFriendGuessRows();
    return {
        items: rows.map((row) => {
            const status = mapFriendGuessStatus(row.status, row.review_status);
            const acceptedInvitations = toNumber(row.accepted_count);
            const betParticipantCount = toNumber(row.bet_participant_count);
            const participants = Math.max(2, acceptedInvitations + 1, betParticipantCount);
            const inviterId = toOptionalStringId(row.inviter_id ?? row.creator_id) ?? '';
            return {
                id: `friend-${String(row.guess_id)}`,
                guessId: String(row.guess_id),
                roomName: `${row.title} 好友房`,
                inviterId,
                inviter: fallbackUserName(row.inviter_name, row.inviter_phone, row.inviter_id ?? row.creator_id),
                participants,
                reward: row.product_name || row.title,
                status,
                statusLabel: mapFriendGuessStatusLabel(status),
                endTime: toIsoString(row.end_time),
                invitationCount: toNumber(row.invitation_count),
                pendingInvitations: toNumber(row.pending_count),
                acceptedInvitations,
                rejectedInvitations: toNumber(row.rejected_count),
                expiredInvitations: toNumber(row.expired_count),
                confirmedResults: toNumber(row.confirm_count),
                rejectedResults: toNumber(row.reject_confirm_count),
                betParticipantCount,
                paidAmount: toNumber(row.total_paid_amount),
                paymentMode: toOptionalNumber(row.payment_mode),
                paidBy: toOptionalStringId(row.paid_by),
            };
        }),
    };
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
                    : optionTextMap.get(`${String(row.guess_id)}:${Number(row.initiator_choice_idx)}`) || null,
                rightChoice: row.opponent_choice_idx == null
                    ? null
                    : optionTextMap.get(`${String(row.guess_id)}:${Number(row.opponent_choice_idx)}`) || null,
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
