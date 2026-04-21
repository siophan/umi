import { toEntityId, toOptionalEntityId, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
export const GUESS_DRAFT = 10;
export const GUESS_PENDING_REVIEW = 20;
export const GUESS_ACTIVE = 30;
export const GUESS_SETTLED = 40;
export const GUESS_REJECTED = 90;
export const GUESS_TYPE_STANDARD = 10;
export const GUESS_SCOPE_PUBLIC = 10;
export const GUESS_SCOPE_FRIENDS = 20;
export const GUESS_SOURCE_OPERATION = 30;
export const GUESS_PRODUCT_SOURCE_PLATFORM = 10;
export const GUESS_PRODUCT_SOURCE_SHOP = 20;
export const SETTLEMENT_MODE_ORACLE = 10;
export const REVIEW_PENDING = 10;
export const REVIEW_APPROVED = 30;
export const REVIEW_REJECTED = 40;
export const REVIEW_ACTION_APPROVE = 20;
export const REVIEW_ACTION_REJECT = 30;
export const INVITATION_PENDING = 10;
export const INVITATION_ACCEPTED = 30;
export const INVITATION_REJECTED = 40;
export const INVITATION_EXPIRED = 90;
export const FRIEND_CONFIRM_CONFIRMED = 10;
export const FRIEND_CONFIRM_REJECTED = 20;
export const PK_RESULT_PENDING = 10;
export const PK_RESULT_INITIATOR_WIN = 30;
export const PK_RESULT_OPPONENT_WIN = 40;
export const PK_RESULT_DRAW = 50;
export const PK_RESULT_CANCELED = 90;
export function toNumber(value) {
    return Number(value ?? 0);
}
export function toOptionalNumber(value) {
    return value == null ? null : Number(value);
}
export function toStringId(value) {
    return toEntityId(value ?? 0);
}
export function toOptionalStringId(value) {
    return toOptionalEntityId(value);
}
export function toIsoString(value) {
    return new Date(value).toISOString();
}
export function fallbackUserName(name, phoneNumber, userId) {
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
export function normalizeGuessReviewStatus(status) {
    if (status === 'approved' || status === 'rejected') {
        return status;
    }
    throw new Error('审核状态不合法');
}
export function normalizeGuessOptionTexts(optionTexts) {
    const normalized = optionTexts.map((item) => item.trim()).filter((item) => item.length > 0);
    if (normalized.length < 2) {
        throw new Error('至少填写两个有效选项');
    }
    const uniqueCount = new Set(normalized.map((item) => item.toLowerCase())).size;
    if (uniqueCount !== normalized.length) {
        throw new Error('竞猜选项不能重复');
    }
    return normalized;
}
export function normalizeCreateGuessEndTime(endTime) {
    const value = endTime.trim();
    if (!value) {
        throw new Error('请设置截止时间');
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('截止时间不合法');
    }
    if (parsed.getTime() <= Date.now()) {
        throw new Error('截止时间必须晚于当前时间');
    }
    return parsed;
}
export async function requireActiveGuessCategory(categoryId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id, status, biz_type
      FROM category
      WHERE id = ?
      LIMIT 1
    `, [categoryId]);
    const category = rows[0] ?? null;
    if (!category || toNumber(category.biz_type) !== 40) {
        throw new Error('竞猜分类不存在');
    }
    if (toNumber(category.status) !== 10) {
        throw new Error('竞猜分类未启用');
    }
    return category;
}
export async function requireGuessProductForCreate(productId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        p.id,
        p.shop_id,
        p.image_url,
        p.status,
        p.stock,
        p.frozen_stock,
        s.status AS shop_status,
        b.status AS brand_status,
        bp.status AS brand_product_status
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE p.id = ?
      LIMIT 1
    `, [productId]);
    const product = rows[0] ?? null;
    if (!product) {
        throw new Error('关联商品不存在');
    }
    if (toNumber(product.status) !== 10) {
        throw new Error('关联商品不可用于创建竞猜');
    }
    if (product.shop_status != null && toNumber(product.shop_status) !== 10) {
        throw new Error('关联商品所属店铺不可用于创建竞猜');
    }
    if (product.brand_status != null && toNumber(product.brand_status) !== 10) {
        throw new Error('关联商品所属品牌不可用于创建竞猜');
    }
    if (product.brand_product_status != null && toNumber(product.brand_product_status) !== 10) {
        throw new Error('关联商品所属品牌商品不可用于创建竞猜');
    }
    if (toNumber(product.stock) - toNumber(product.frozen_stock) <= 0) {
        throw new Error('关联商品可用库存不足');
    }
    return product;
}
export function normalizeGuessRejectReason(status, rejectReason) {
    const value = rejectReason?.trim() ?? '';
    if (status === 'rejected' && !value) {
        throw new Error('请填写拒绝原因');
    }
    return value ? value.slice(0, 200) : null;
}
export function ensureGuessPendingReview(row) {
    if (Number(row.status ?? 0) !== GUESS_PENDING_REVIEW ||
        Number(row.review_status ?? 0) !== REVIEW_PENDING) {
        throw new Error('竞猜当前不可审核');
    }
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
export function groupRowsByGuess(rows) {
    const map = new Map();
    for (const row of rows) {
        const guessId = String(row.guess_id);
        const current = map.get(guessId) || [];
        current.push(row);
        map.set(guessId, current);
    }
    return map;
}
export function buildGuessSummary(row, options, voteCountMap) {
    return {
        id: toEntityId(row.id),
        title: row.title,
        status: mapGuessStatus(row.status),
        reviewStatus: mapGuessReviewStatus(row.review_status),
        categoryId: toOptionalStringId(row.category_id),
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
export async function getGuessRows() {
    const db = getDbPool();
    const [rows] = await db.query(`
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        g.category_id,
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
export async function getOptionTextMap(guessIds) {
    const optionRows = await getGuessOptionRows(guessIds);
    const optionTextMap = new Map();
    for (const option of optionRows) {
        optionTextMap.set(`${String(option.guess_id)}:${Number(option.option_index)}`, option.option_text);
    }
    return optionTextMap;
}
export function buildVoteCountLookup(voteRows) {
    return buildVoteCountMap(voteRows);
}
