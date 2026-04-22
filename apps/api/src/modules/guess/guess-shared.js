import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
export const GUESS_ACTIVE = 30;
export const GUESS_SETTLED = 40;
export const GUESS_REJECTED = 90;
export const GUESS_DRAFT = 10;
export const GUESS_PENDING_REVIEW = 20;
export const BET_PENDING = 10;
export const BET_WON = 30;
export const BET_LOST = 40;
export const REVIEW_PENDING = 10;
export const REVIEW_APPROVED = 30;
export function getRouteParam(value) {
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
export function mapGuessStatus(code) {
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
export function mapGuessReviewStatus(code) {
    const value = Number(code ?? 0);
    if (value === REVIEW_PENDING) {
        return 'pending';
    }
    if (value === REVIEW_APPROVED) {
        return 'approved';
    }
    return 'rejected';
}
export async function getGuessOptionRows(guessIds) {
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
export async function getGuessVoteRows(guessIds) {
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
export function buildGuessSummary(row, options, voteRows) {
    const product = {
        id: toEntityId(row.product_id ?? 0),
        name: row.product_name || '未命名商品',
        brand: row.brand_name || '未知品牌',
        img: row.product_img || '',
        price: Number(row.product_price ?? 0) / 100,
        guessPrice: Number(row.product_guess_price ?? row.product_price ?? 0) / 100,
        category: row.category || '未分类',
        status: 'active',
    };
    return {
        id: toEntityId(row.id),
        title: row.title,
        status: mapGuessStatus(row.status),
        reviewStatus: mapGuessReviewStatus(row.review_status),
        category: row.category || '热门',
        endTime: new Date(row.end_time).toISOString(),
        creatorId: toEntityId(row.creator_id),
        product,
        options: options.map((option) => ({
            id: `${String(row.id)}-${Number(option.option_index)}`,
            optionIndex: Number(option.option_index),
            optionText: option.option_text,
            odds: Number(option.odds ?? 1),
            voteCount: voteRows.find((vote) => String(vote.guess_id) === String(row.id) &&
                Number(vote.option_index) === Number(option.option_index))?.vote_count
                ? Number(voteRows.find((vote) => String(vote.guess_id) === String(row.id) &&
                    Number(vote.option_index) === Number(option.option_index))?.vote_count)
                : 0,
            isResult: Boolean(option.is_result),
        })),
    };
}
export async function getGuessRows(whereSql = '', params = [], limit) {
    const db = getDbPool();
    const sqlParams = typeof limit === 'number' ? [...params, limit] : params;
    const [rows] = await db.query(`
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        c.name AS category,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        p.price AS product_price,
        p.guess_price AS product_guess_price
      FROM guess g
      LEFT JOIN guess_product gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id
      ${whereSql}
      ORDER BY g.created_at DESC, g.id DESC
      ${typeof limit === 'number' ? 'LIMIT ?' : ''}
    `, sqlParams);
    return rows;
}
export function getChoiceText(row, options) {
    return (options.find((option) => Number(option.option_index) === Number(row.choice_idx))?.option_text ||
        `选项 ${Number(row.choice_idx) + 1}`);
}
