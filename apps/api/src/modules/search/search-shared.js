import { toEntityId, toOptionalEntityId, } from '@umi/shared';
export const PRODUCT_CATEGORY_BIZ_TYPE = 30;
export const PRODUCT_INTERACTION_FAVORITE = 10;
export const GUESS_REVIEW_APPROVED = 30;
export const GUESS_PENDING_REVIEW = 20;
export const GUESS_ACTIVE = 30;
export const GUESS_SETTLED = 40;
export const SEARCH_LIMIT_DEFAULT = 12;
export const SEARCH_LIMIT_MAX = 50;
export function safeJsonArray(value) {
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
export function isRecentProduct(createdAt) {
    if (!createdAt) {
        return false;
    }
    const timestamp = new Date(createdAt).getTime();
    return Number.isNaN(timestamp) ? false : Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 30;
}
export function buildFeedTag(sourceTags, details) {
    const preferredTag = sourceTags.find((item) => item.trim());
    if (preferredTag)
        return preferredTag.trim();
    if (details.collab)
        return '联名';
    if (details.discountAmount >= 10)
        return '特惠';
    if (details.isNew)
        return '新品';
    if (details.guessPrice < details.price)
        return '竞猜';
    if (details.sales > 0)
        return '爆款';
    return '优选';
}
export function buildFeedMiniTag(tag, discountAmount, guessPrice, price, isNew, collab) {
    if (collab || tag.includes('联名') || tag.includes('限定'))
        return 'mt-limit';
    if (discountAmount >= 10 || tag.includes('特惠') || tag.includes('折扣'))
        return 'mt-sale';
    if (isNew || tag.includes('新品') || tag.includes('上新'))
        return 'mt-new';
    if (guessPrice < price || tag.includes('竞猜'))
        return 'mt-guess';
    return 'mt-hot';
}
/**
 * 把搜索结果里的商品行统一映射成商城 feed 结构。
 * 这里沿用商城页的展示派生规则，保证搜索商品卡和商城卡片口径一致。
 */
export function sanitizeProductFeedItem(row, index) {
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
export function mapGuessStatus(code) {
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
export function mapGuessReviewStatus(code) {
    const value = Number(code ?? 0);
    if (value === 10)
        return 'pending';
    if (value === GUESS_REVIEW_APPROVED)
        return 'approved';
    return 'rejected';
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
            voteCount: Number(voteRows.find((vote) => String(vote.guess_id) === String(row.id) &&
                Number(vote.option_index) === Number(option.option_index))?.vote_count ?? 0),
            isResult: Boolean(option.is_result),
        })),
    };
}
