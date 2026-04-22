import type mysql from 'mysql2/promise';

import { toEntityId, type ProductFeedItem } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  getFavoritedProductIdSet,
  getProductCategories,
  ProductRow,
  PRODUCT_CATEGORY_BIZ_TYPE,
  sanitizeProductFeedItem,
} from './product-shared';

export async function getProductFeed(options: {
  limit?: number;
  keyword?: string;
  categoryId?: string;
  userId?: string | null;
}) {
  const limit = Math.min(50, Math.max(1, Number(options.limit ?? 20) || 20));
  const keyword = String(options.keyword ?? '').trim();
  const categoryId = String(options.categoryId ?? '').trim();
  const db = getDbPool();
  const whereClauses = ['p.status = 10'];
  const params: Array<string | number> = [];

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
    db.query<mysql.RowDataPacket[]>(
      `
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
      `,
      params,
    ),
    getProductCategories(),
  ]);

  const productIds = (rows as ProductRow[]).map((row) => toEntityId(row.id));
  const favoritedProductIds = options.userId
    ? await getFavoritedProductIdSet(options.userId, productIds)
    : new Set<string>();

  const items: ProductFeedItem[] = (rows as ProductRow[]).map((row, index) =>
    sanitizeProductFeedItem(
      { ...row, favorited: favoritedProductIds.has(toEntityId(row.id)) ? 1 : 0 },
      index,
    ),
  );

  return { items, categories };
}
