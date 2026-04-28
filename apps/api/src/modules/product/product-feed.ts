import type mysql from 'mysql2/promise';

import { toEntityId, type ProductFeedItem } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  getFavoritedProductIdSet,
  ProductRow,
  PRODUCT_CATEGORY_BIZ_TYPE,
  sanitizeProductFeedItem,
} from './product-shared';

export type ProductFeedSort = 'default' | 'sales' | 'price_asc' | 'rating';

const SORT_CLAUSES: Record<ProductFeedSort, string> = {
  default: 'COALESCE(p.sales, 0) DESC, p.created_at DESC, p.id DESC',
  sales: 'COALESCE(p.sales, 0) DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id DESC',
  rating: 'COALESCE(p.rating, 0) DESC, p.id DESC',
};

function normalizeSort(value: unknown): ProductFeedSort {
  if (value === 'sales' || value === 'price_asc' || value === 'rating' || value === 'default') {
    return value;
  }
  return 'default';
}

export async function getProductFeed(options: {
  limit?: number;
  offset?: number;
  keyword?: string;
  categoryId?: string;
  sort?: ProductFeedSort;
  userId?: string | null;
}) {
  const limit = Math.min(50, Math.max(1, Number(options.limit ?? 20) || 20));
  const offset = Math.max(0, Number(options.offset ?? 0) || 0);
  const keyword = String(options.keyword ?? '').trim();
  const categoryId = String(options.categoryId ?? '').trim();
  const sort = normalizeSort(options.sort);
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

  const whereSql = whereClauses.join(' AND ');

  const listParams = [...params, limit, offset];
  const [[rows], [countRows]] = await Promise.all([
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
        WHERE ${whereSql}
        ORDER BY ${SORT_CLAUSES[sort]}
        LIMIT ? OFFSET ?
      `,
      listParams,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(DISTINCT p.id) AS total
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
        WHERE ${whereSql}
      `,
      params,
    ),
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

  const total = Number(((countRows as Array<{ total: number | string }>)[0]?.total) ?? 0);

  return { items, total };
}
