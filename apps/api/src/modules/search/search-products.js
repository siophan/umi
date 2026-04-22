import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { PRODUCT_CATEGORY_BIZ_TYPE, PRODUCT_INTERACTION_FAVORITE, sanitizeProductFeedItem, } from './search-shared';
async function getFavoritedProductIdSet(userId, productIds) {
    if (!productIds.length)
        return new Set();
    const db = getDbPool();
    const placeholders = productIds.map(() => '?').join(', ');
    const [rows] = await db.query(`
      SELECT product_id
      FROM product_interaction
      WHERE user_id = ?
        AND interaction_type = ?
        AND product_id IN (${placeholders})
    `, [userId, PRODUCT_INTERACTION_FAVORITE, ...productIds]);
    return new Set(rows.map((row) => toEntityId(row.product_id)));
}
/**
 * 商品搜索主查询。
 * 搜索命中范围固定在商品名、品牌、分类和店铺名，不从前端当前结果里再做二次假筛选。
 */
export async function searchProducts(query, sort, limit, userId) {
    const db = getDbPool();
    const like = `%${query}%`;
    const whereClauses = [
        'p.status = 10',
        '(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR s.name LIKE ?)',
    ];
    const countParams = [like, like, like, like];
    const orderBy = sort === 'price-asc'
        ? 'COALESCE(p.price, 0) ASC, p.created_at DESC, p.id DESC'
        : sort === 'price-desc'
            ? 'COALESCE(p.price, 0) DESC, p.created_at DESC, p.id DESC'
            : sort === 'rating'
                ? 'COALESCE(p.rating, 0) DESC, COALESCE(p.sales, 0) DESC, p.id DESC'
                : 'COALESCE(p.sales, 0) DESC, p.created_at DESC, p.id DESC';
    const [countRows, rows] = await Promise.all([
        db.query(`
        SELECT COUNT(*) AS total
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
        WHERE ${whereClauses.join(' AND ')}
      `, countParams),
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
        ORDER BY ${orderBy}
        LIMIT ?
      `, [...countParams, limit]),
    ]);
    const resultRows = rows[0];
    const productIds = resultRows.map((row) => toEntityId(row.id));
    const favoritedProductIds = userId ? await getFavoritedProductIdSet(userId, productIds) : new Set();
    return {
        total: Number(countRows[0][0]?.total ?? 0),
        items: resultRows.map((row, index) => sanitizeProductFeedItem({ ...row, favorited: favoritedProductIds.has(toEntityId(row.id)) ? 1 : 0 }, index)),
    };
}
