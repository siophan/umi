import { Router } from 'express';
import { toEntityId, toOptionalEntityId } from '@umi/shared';
import { getRequestUser, optionalUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';
export const productRouter = Router();
const GUESS_ACTIVE = 30;
const REVIEW_APPROVED = 30;
const VIRTUAL_STATUS_STORED = 10;
const VIRTUAL_STATUS_LOCKED = 20;
const PHYSICAL_STATUS_STORED = 10;
const PHYSICAL_STATUS_CONSIGNING = 20;
const FULFILLMENT_PENDING = 10;
const FULFILLMENT_PROCESSING = 20;
const FULFILLMENT_SHIPPED = 30;
const CATEGORY_STATUS_ACTIVE = 10;
const PRODUCT_CATEGORY_BIZ_TYPE = 30;
const PRODUCT_INTERACTION_FAVORITE = 10;
function safeJsonArray(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    }
    catch {
        return [];
    }
}
function isRecentProduct(createdAt) {
    if (!createdAt) {
        return false;
    }
    const timestamp = new Date(createdAt).getTime();
    if (Number.isNaN(timestamp)) {
        return false;
    }
    return Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 30;
}
function buildFeedTag(sourceTags, { discountAmount, guessPrice, price, sales, isNew, collab, }) {
    const preferredTag = sourceTags.find((item) => item.trim());
    if (preferredTag) {
        return preferredTag.trim();
    }
    if (collab) {
        return '联名';
    }
    if (discountAmount >= 10) {
        return '特惠';
    }
    if (isNew) {
        return '新品';
    }
    if (guessPrice < price) {
        return '竞猜';
    }
    if (sales > 0) {
        return '爆款';
    }
    return '优选';
}
function buildFeedMiniTag(tag, discountAmount, guessPrice, price, isNew, collab) {
    if (collab || tag.includes('联名') || tag.includes('限定')) {
        return 'mt-limit';
    }
    if (discountAmount >= 10 || tag.includes('特惠') || tag.includes('折扣')) {
        return 'mt-sale';
    }
    if (isNew || tag.includes('新品') || tag.includes('上新')) {
        return 'mt-new';
    }
    if (guessPrice < price || tag.includes('竞猜')) {
        return 'mt-guess';
    }
    return 'mt-hot';
}
function sanitizeProductFeedItem(row, index) {
    const price = Number(row.price ?? 0) / 100;
    const originalPrice = Number(row.original_price ?? row.price ?? 0) / 100;
    const guessPrice = Number(row.guess_price ?? row.price ?? 0) / 100;
    const discountAmount = Math.max(0, originalPrice - price);
    const tags = safeJsonArray(row.tags);
    const isNew = isRecentProduct(row.created_at);
    const sales = Math.max(0, Number(row.sales ?? 0));
    const tag = buildFeedTag(tags, {
        discountAmount,
        guessPrice,
        price,
        sales,
        isNew,
        collab: row.collab,
    });
    return {
        id: toEntityId(row.id),
        name: row.name,
        categoryId: toOptionalEntityId(row.category_id),
        category: row.category || '未分类',
        price,
        originalPrice,
        discountAmount,
        sales,
        rating: Number(row.rating ?? 0),
        stock: Math.max(0, Number(row.stock ?? 0)),
        img: row.image_url || safeJsonArray(row.images)[0] || row.default_img || '',
        tag,
        miniTag: buildFeedMiniTag(tag, discountAmount, guessPrice, price, isNew, row.collab),
        height: 178 + (index % 4) * 14,
        brand: row.brand_name || '未知品牌',
        guessPrice,
        status: Number(row.status ?? 0) === 10 ? 'active' : String(row.status),
        shopName: row.shop_name || null,
        tags,
        collab: row.collab || null,
        isNew,
        favorited: Boolean(row.favorited),
    };
}
function sanitizeProductCategory(row) {
    return {
        id: toEntityId(row.id),
        name: row.name,
        iconUrl: row.icon_url,
        parentId: toOptionalEntityId(row.parent_id),
        level: Number(row.level ?? 0),
        sort: Number(row.sort ?? 0),
        count: Number(row.product_count ?? 0),
    };
}
function mapGuessStatus(code) {
    const value = Number(code ?? 0);
    if (value === 10)
        return 'draft';
    if (value === 20)
        return 'pending_review';
    if (value === 40)
        return 'settled';
    if (value === 90)
        return 'cancelled';
    return 'active';
}
function mapGuessReviewStatus(code) {
    return Number(code ?? 0) === REVIEW_APPROVED ? 'approved' : Number(code ?? 0) === 10 ? 'pending' : 'rejected';
}
function sanitizeWarehouseRow(row) {
    return {
        id: toEntityId(row.id),
        userId: toEntityId(row.user_id),
        productId: toEntityId(row.product_id ?? 0),
        productName: row.product_name || '未命名商品',
        productImg: row.product_img || null,
        quantity: Number(row.quantity ?? 0),
        price: Number(row.price ?? 0) / 100,
        status: row.status,
        warehouseType: row.warehouse_type,
        sourceType: row.source_type,
        consignPrice: row.consign_price === null ? null : Number(row.consign_price ?? 0) / 100,
        estimateDays: row.estimate_days === null ? null : Number(row.estimate_days ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
    };
}
/**
 * 读取单个商品的详情主数据。
 * 这里只查详情页通用字段，不混入竞猜、仓库、收藏等派生数据。
 */
async function getProductById(productId) {
    const db = getDbPool();
    // Use text protocol here because LIMIT bind values have been flaky with prepared statements locally.
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.guess_price,
        p.image_url,
        p.images,
        p.tags,
        p.sales,
        p.rating,
        p.stock,
        p.status,
        p.shop_id,
        s.name AS shop_name,
        b.name AS brand_name,
        bp.category_id,
        c.name AS category,
        p.brand_product_id,
        bp.brand_id
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
      WHERE p.id = ?
      LIMIT 1
    `, [productId]);
    return rows[0] ?? null;
}
/**
 * 确认商品存在。
 * 详情、收藏、加购等链路都先走这里，统一返回商品不存在错误。
 */
async function ensureProductExists(productId) {
    const product = await getProductById(productId);
    if (!product) {
        throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
    }
    return product;
}
/**
 * 批量读取当前用户的商品收藏态。
 * 商品列表和详情页都依赖这条链路回填 favorited 字段。
 */
async function getFavoritedProductIdSet(userId, productIds) {
    if (!productIds.length) {
        return new Set();
    }
    const db = getDbPool();
    const placeholders = productIds.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT product_id
      FROM product_interaction
      WHERE user_id = ?
        AND interaction_type = ?
        AND product_id IN (${placeholders})
    `, [userId, PRODUCT_INTERACTION_FAVORITE, ...productIds]);
    return new Set(rows.map((row) => toEntityId(row.product_id)));
}
/**
 * 新增商品收藏。
 * 用 NOT EXISTS 保证幂等，避免重复点击插入重复收藏记录。
 */
async function favoriteProduct(userId, productId) {
    await ensureProductExists(productId);
    const db = getDbPool();
    await db.execute(`
      INSERT INTO product_interaction (user_id, product_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      WHERE NOT EXISTS (
        SELECT 1
        FROM product_interaction
        WHERE user_id = ?
          AND product_id = ?
          AND interaction_type = ?
      )
    `, [userId, productId, PRODUCT_INTERACTION_FAVORITE, userId, productId, PRODUCT_INTERACTION_FAVORITE]);
    return { success: true };
}
/**
 * 取消商品收藏。
 * 这里直接删关系，不额外要求商品仍然存在。
 */
async function unfavoriteProduct(userId, productId) {
    const db = getDbPool();
    await db.execute(`
      DELETE FROM product_interaction
      WHERE user_id = ?
        AND product_id = ?
        AND interaction_type = ?
    `, [userId, productId, PRODUCT_INTERACTION_FAVORITE]);
    return { success: true };
}
/**
 * 读取商品当前可展示的竞猜活动。
 * 只返回已审核且进行中的最新一场，避免详情页同时挂多场竞猜。
 */
async function getActiveGuess(productId, product) {
    const db = getDbPool();
    const [guessRows] = await db.execute(`
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        c.name AS category
      FROM guess g
      INNER JOIN guess_product gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
      WHERE gp.product_id = ?
        AND g.status = ?
        AND g.review_status = ?
      ORDER BY g.created_at DESC, g.id DESC
      LIMIT 1
    `, [productId, GUESS_ACTIVE, REVIEW_APPROVED]);
    const guess = guessRows[0] ?? null;
    if (!guess) {
        return null;
    }
    const [optionRows] = await db.execute(`
      SELECT
        go.guess_id,
        go.option_index,
        go.option_text,
        go.odds,
        go.is_result,
        COALESCE(votes.vote_count, 0) AS vote_count
      FROM guess_option go
      LEFT JOIN (
        SELECT guess_id, choice_idx, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id = ?
        GROUP BY guess_id, choice_idx
      ) votes
        ON votes.guess_id = go.guess_id
       AND votes.choice_idx = go.option_index
      WHERE go.guess_id = ?
      ORDER BY go.option_index ASC
    `, [guess.id, guess.id]);
    return {
        id: toEntityId(guess.id),
        title: guess.title,
        status: mapGuessStatus(guess.status),
        reviewStatus: mapGuessReviewStatus(guess.review_status),
        category: guess.category || product.category || '热门',
        endTime: new Date(guess.end_time).toISOString(),
        creatorId: toEntityId(guess.creator_id),
        product: {
            id: toEntityId(product.id),
            name: product.name,
            brand: product.brand_name || '未知品牌',
            img: product.image_url || safeJsonArray(product.images)[0] || '',
            price: Number(product.price ?? 0) / 100,
            guessPrice: Number(product.guess_price ?? product.price ?? 0) / 100,
            category: product.category || '未分类',
            status: Number(product.status ?? 0) === 10 ? 'active' : String(product.status),
        },
        options: optionRows.map((row) => ({
            id: `${String(row.guess_id)}-${Number(row.option_index)}`,
            optionIndex: Number(row.option_index),
            optionText: row.option_text,
            odds: Number(row.odds ?? 1),
            voteCount: Number(row.vote_count ?? 0),
            isResult: Boolean(row.is_result),
        })),
    };
}
/**
 * 汇总当前用户与该商品相关的仓库资产。
 * 这里把虚拟仓、实物仓和待发货履约单统一整理成详情页可直接消费的仓库列表。
 */
async function getWarehouseItems(userId, productId) {
    const db = getDbPool();
    const [virtualRows] = await db.execute(`
      SELECT
        CONCAT('vw-', vw.id) AS id,
        vw.user_id,
        vw.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        vw.quantity,
        vw.price,
        CASE WHEN vw.status = ? THEN 'stored' ELSE 'locked' END AS status,
        'virtual' AS warehouse_type,
        CASE
          WHEN vw.source_type = 10 THEN '竞猜奖励'
          WHEN vw.source_type = 20 THEN '订单入仓'
          WHEN vw.source_type = 30 THEN '兑换入仓'
          ELSE '手工入仓'
        END AS source_type,
        NULL AS consign_price,
        NULL AS estimate_days,
        vw.created_at
      FROM virtual_warehouse vw
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE vw.user_id = ?
        AND vw.product_id = ?
        AND vw.status IN (?, ?)
      ORDER BY vw.created_at DESC, vw.id DESC
    `, [VIRTUAL_STATUS_STORED, userId, productId, VIRTUAL_STATUS_STORED, VIRTUAL_STATUS_LOCKED]);
    const [physicalRows] = await db.execute(`
      SELECT
        CONCAT('pw-', pw.id) AS id,
        pw.user_id,
        pw.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        pw.quantity,
        pw.price,
        CASE
          WHEN pw.status = ? THEN 'delivered'
          WHEN pw.status = ? THEN 'consigning'
          ELSE 'completed'
        END AS status,
        'physical' AS warehouse_type,
        '仓库商品' AS source_type,
        pw.consign_price,
        pw.estimate_days,
        pw.created_at
      FROM physical_warehouse pw
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE pw.user_id = ?
        AND pw.product_id = ?
        AND pw.status IN (?, ?)
      ORDER BY pw.created_at DESC, pw.id DESC
    `, [PHYSICAL_STATUS_STORED, PHYSICAL_STATUS_CONSIGNING, userId, productId, PHYSICAL_STATUS_STORED, PHYSICAL_STATUS_CONSIGNING]);
    const [fulfillmentRows] = await db.execute(`
      SELECT
        CONCAT('fo-', fo.id, '-', oi.id) AS id,
        fo.user_id,
        oi.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        oi.quantity,
        oi.item_amount AS price,
        'shipping' AS status,
        'physical' AS warehouse_type,
        CASE WHEN o.guess_id IS NULL THEN '商家发货' ELSE '竞猜奖励' END AS source_type,
        NULL AS consign_price,
        NULL AS estimate_days,
        COALESCE(fo.shipped_at, fo.created_at) AS created_at
      FROM fulfillment_order fo
      INNER JOIN \`order\` o ON o.id = fo.order_id
      INNER JOIN order_item oi ON oi.order_id = o.id
      LEFT JOIN product p ON p.id = oi.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE fo.user_id = ?
        AND oi.product_id = ?
        AND fo.status IN (?, ?, ?)
      ORDER BY fo.created_at DESC, fo.id DESC
    `, [userId, productId, FULFILLMENT_PENDING, FULFILLMENT_PROCESSING, FULFILLMENT_SHIPPED]);
    return [...virtualRows, ...physicalRows, ...fulfillmentRows].map((row) => sanitizeWarehouseRow(row));
}
/**
 * 读取详情页“猜你喜欢”。
 * 目前优先按同品牌/同店铺回推荐，维持老详情页的推荐密度和相关性。
 */
async function getRecommendations(product) {
    const db = getDbPool();
    // Use text protocol here because LIMIT bind values have been flaky with prepared statements locally.
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.guess_price,
        p.image_url,
        p.status,
        c.name AS category,
        b.name AS brand_name
      FROM product p
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
      WHERE p.id <> ?
        AND (
          (bp.brand_id IS NOT NULL AND bp.brand_id = ?)
          OR (p.shop_id IS NOT NULL AND p.shop_id = ?)
        )
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 6
    `, [product.id, product.brand_id ?? 0, product.shop_id ?? 0]);
    return rows.map((row) => ({
        id: toEntityId(row.id),
        name: row.name,
        brand: row.brand_name || '未知品牌',
        img: row.image_url || '',
        price: Number(row.price ?? 0) / 100,
        guessPrice: Number(row.guess_price ?? row.price ?? 0) / 100,
        category: row.category || '未分类',
        status: Number(row.status ?? 0) === 10 ? 'active' : String(row.status),
    }));
}
/**
 * 读取最近商品评价。
 * 本地测试库缺表时降级为空数组，避免评价子链路把详情页接口整体打成 500。
 */
async function getRecentProductReviews(productId) {
    const db = getDbPool();
    let rows;
    try {
        [rows] = await db.execute(`
        SELECT
          pr.id,
          pr.user_id,
          pr.rating,
          pr.content,
          pr.created_at,
          up.name AS user_name,
          up.avatar_url AS user_avatar
        FROM product_review pr
        LEFT JOIN user_profile up ON up.user_id = pr.user_id
        WHERE pr.product_id = ?
        ORDER BY pr.created_at DESC, pr.id DESC
        LIMIT 3
      `, [productId]);
    }
    catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
        // 本地测试库不一定补了 product_review；这里降级为空评价，不能把商品详情接口直接打成 500。
        if (code === 'ER_NO_SUCH_TABLE') {
            return [];
        }
        throw error;
    }
    return rows.map((row) => ({
        id: toEntityId(row.id),
        userName: row.user_name?.trim() || `用户${String(row.user_id)}`,
        userAvatar: row.user_avatar?.trim() || null,
        rating: Math.max(1, Math.min(5, Math.trunc(Number(row.rating) || 5))),
        content: row.content?.trim() || null,
        createdAt: new Date(row.created_at).toISOString(),
    }));
}
/**
 * 读取商城商品分类池。
 * 分类列表直接来自 category 主表，不再从首屏商品 feed 里反推。
 */
async function getProductCategories() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        c.id,
        c.name,
        c.icon_url,
        c.parent_id,
        c.level,
        c.sort,
        COALESCE(pc.product_count, 0) AS product_count
      FROM category c
      LEFT JOIN (
        SELECT
          bp.category_id,
          COUNT(DISTINCT p.id) AS product_count
        FROM brand_product bp
        INNER JOIN product p ON p.brand_product_id = bp.id AND p.status = 10
        GROUP BY bp.category_id
      ) pc ON pc.category_id = c.id
      WHERE c.biz_type = ?
        AND c.status = ?
      ORDER BY c.level ASC, c.sort ASC, c.id ASC
    `, [PRODUCT_CATEGORY_BIZ_TYPE, CATEGORY_STATUS_ACTIVE]);
    return rows.map((row) => sanitizeProductCategory(row));
}
productRouter.get('/:id', optionalUser, asyncHandler(async (request, response) => {
    const productId = Array.isArray(request.params.id)
        ? request.params.id[0] ?? ''
        : request.params.id;
    const product = await getProductById(productId);
    if (!product) {
        throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
    }
    const [activeGuess, warehouseItems, recommendations, favoritedProductIds, reviews] = await Promise.all([
        getActiveGuess(productId, product),
        request.user
            ? getWarehouseItems(request.user.id, productId)
            : Promise.resolve([]),
        getRecommendations(product),
        request.user
            ? getFavoritedProductIdSet(request.user.id, [productId])
            : Promise.resolve(new Set()),
        getRecentProductReviews(productId),
    ]);
    const images = [product.image_url, ...safeJsonArray(product.images)].filter((item, index, array) => typeof item === 'string' &&
        item.trim().length > 0 &&
        array.indexOf(item) === index);
    const result = {
        product: {
            id: toEntityId(product.id),
            name: product.name,
            brand: product.brand_name || '未知品牌',
            img: images[0] || '',
            price: Number(product.price ?? 0) / 100,
            guessPrice: Number(product.guess_price ?? product.price ?? 0) / 100,
            category: product.category || '未分类',
            status: Number(product.status ?? 0) === 10 ? 'active' : String(product.status),
            shopId: toOptionalEntityId(product.shop_id),
            shopName: product.shop_name || null,
            images,
            originalPrice: Number(product.original_price ?? product.price ?? 0) / 100,
            stock: Number(product.stock ?? 0),
            sales: Number(product.sales ?? 0),
            rating: Number(product.rating ?? 0),
            tags: safeJsonArray(product.tags),
            description: `${product.brand_name || '品牌'} ${product.name}，支持直购、竞猜和仓库换购。`,
            favorited: favoritedProductIds.has(productId),
        },
        activeGuess,
        warehouseItems,
        recommendations,
        reviews,
    };
    ok(response, result);
}));
productRouter.get('/', optionalUser, async (request, response) => {
    const limit = Math.min(50, Math.max(1, Number(request.query.limit ?? 20) || 20));
    const keyword = String(request.query.q ?? '').trim();
    const categoryId = String(request.query.categoryId ?? '').trim();
    const db = getDbPool();
    const whereClauses = ['p.status = 10'];
    const params = [];
    if (keyword) {
        whereClauses.push('(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
        const like = `%${keyword}%`;
        params.push(like, like, like);
    }
    if (categoryId) {
        whereClauses.push('bp.category_id = ?');
        params.push(categoryId);
    }
    params.push(limit);
    const [[rows], categories] = await Promise.all([
        db.query(`
        SELECT
          p.id,
          p.name,
          p.price,
          p.original_price,
          p.guess_price,
          p.image_url,
          p.images,
          p.tags,
          p.sales,
          p.rating,
          p.stock,
          p.collab,
          p.status,
          p.created_at,
          s.name AS shop_name,
          bp.default_img,
          bp.category_id,
          b.name AS brand_name,
          c.name AS category
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY COALESCE(p.sales, 0) DESC, p.created_at DESC, p.id DESC
        LIMIT ?
      `, params),
        getProductCategories(),
    ]);
    const productIds = rows.map((row) => toEntityId(row.id));
    const favoritedProductIds = request.user
        ? await getFavoritedProductIdSet(request.user.id, productIds)
        : new Set();
    const items = rows.map((row, index) => sanitizeProductFeedItem({ ...row, favorited: favoritedProductIds.has(toEntityId(row.id)) ? 1 : 0 }, index));
    ok(response, { items, categories });
});
productRouter.post('/:id/favorite', requireUser, withErrorBoundary({
    status: 400,
    code: 'PRODUCT_FAVORITE_FAILED',
    message: '收藏商品失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await favoriteProduct(user.id, String(request.params.id)));
}));
productRouter.delete('/:id/favorite', requireUser, withErrorBoundary({
    status: 400,
    code: 'PRODUCT_UNFAVORITE_FAILED',
    message: '取消收藏商品失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await unfavoriteProduct(user.id, String(request.params.id)));
}));
