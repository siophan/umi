import type mysql from 'mysql2/promise';

import {
  toEntityId,
  toOptionalEntityId,
  type GuessSummary,
  type ProductCategoryItem,
  type ProductFeedItem,
  type WarehouseItem,
} from '@umi/shared';

import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';

export const GUESS_ACTIVE = 30;
export const REVIEW_APPROVED = 30;
export const VIRTUAL_STATUS_STORED = 10;
export const VIRTUAL_STATUS_LOCKED = 20;
export const PHYSICAL_STATUS_STORED = 10;
export const PHYSICAL_STATUS_CONSIGNING = 20;
export const FULFILLMENT_PENDING = 10;
export const FULFILLMENT_PROCESSING = 20;
export const FULFILLMENT_SHIPPED = 30;
export const CATEGORY_STATUS_ACTIVE = 10;
export const PRODUCT_CATEGORY_BIZ_TYPE = 30;
export const PRODUCT_INTERACTION_FAVORITE = 10;

export type ProductRow = {
  id: number | string;
  name: string;
  price: number | string;
  original_price: number | string | null;
  guess_price: number | string | null;
  image_url: string | null;
  images: string | null;
  tags: string | null;
  sales?: number | string | null;
  rating?: number | string | null;
  stock: number | string | null;
  collab?: string | null;
  status: number | string;
  shop_id: number | string | null;
  shop_user_id?: number | string | null;
  shop_logo?: string | null;
  shop_name: string | null;
  brand_name: string | null;
  category_id: number | string | null;
  category: string | null;
  brand_product_id: number | string | null;
  brand_id: number | string | null;
  default_img?: string | null;
  bp_video_url?: string | null;
  bp_detail_html?: string | null;
  bp_spec_table?: unknown;
  bp_package_list?: unknown;
  bp_freight?: number | string | null;
  bp_ship_from?: string | null;
  bp_delivery_days?: string | null;
  created_at?: Date | string;
  favorited?: number | string | boolean | null;
};

export type ProductCategoryRow = {
  id: number | string;
  name: string;
  icon_url: string | null;
  parent_id: number | string | null;
  level: number | string;
  sort: number | string;
  product_count: number | string | null;
};

export type GuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  end_time: Date | string;
  creator_id: number | string;
  category: string | null;
};

export type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds: number | string;
  is_result: number | boolean;
  vote_count: number | string;
};

export type WarehouseRow = {
  id: string;
  user_id: number | string;
  product_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  quantity: number | string;
  price: number | string;
  status: string;
  warehouse_type: 'virtual' | 'physical';
  source_type: string;
  consign_price: number | string | null;
  estimate_days: number | string | null;
  created_at: Date | string;
};

export type ProductReviewRow = {
  id: number | string;
  user_id: number | string;
  rating: number | string;
  content: string | null;
  created_at: Date | string;
  user_name: string | null;
  user_avatar: string | null;
};

export function safeJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function isRecentProduct(createdAt?: Date | string) {
  if (!createdAt) {
    return false;
  }
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 30;
}

function buildFeedTag(
  sourceTags: string[],
  {
    discountAmount,
    guessPrice,
    price,
    sales,
    isNew,
    collab,
  }: {
    discountAmount: number;
    guessPrice: number;
    price: number;
    sales: number;
    isNew: boolean;
    collab: string | null | undefined;
  },
) {
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

function buildFeedMiniTag(
  tag: string,
  discountAmount: number,
  guessPrice: number,
  price: number,
  isNew: boolean,
  collab: string | null | undefined,
) {
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

export function sanitizeProductFeedItem(row: ProductRow, index: number): ProductFeedItem {
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
    favorited: Boolean((row as ProductRow & { favorited?: number | string | boolean | null }).favorited),
  };
}

export function sanitizeProductCategory(row: ProductCategoryRow): ProductCategoryItem {
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

export function mapGuessStatus(code: number | string): GuessSummary['status'] {
  const value = Number(code ?? 0);
  if (value === 10) return 'draft';
  if (value === 20) return 'pending_review';
  if (value === 40) return 'settled';
  if (value === 90) return 'cancelled';
  return 'active';
}

export function mapGuessReviewStatus(code: number | string): GuessSummary['reviewStatus'] {
  return Number(code ?? 0) === REVIEW_APPROVED ? 'approved' : Number(code ?? 0) === 10 ? 'pending' : 'rejected';
}

export function sanitizeWarehouseRow(row: WarehouseRow): WarehouseItem {
  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.user_id),
    productId: toEntityId(row.product_id ?? 0),
    productName: row.product_name || '未命名商品',
    productImg: row.product_img || null,
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0) / 100,
    status: row.status as WarehouseItem['status'],
    warehouseType: row.warehouse_type,
    sourceType: row.source_type,
    consignPrice: row.consign_price === null ? null : Number(row.consign_price ?? 0) / 100,
    estimateDays: row.estimate_days === null ? null : Number(row.estimate_days ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getProductById(productId: string) {
  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
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
        p.status,
        p.shop_id,
        s.user_id AS shop_user_id,
        s.logo_url AS shop_logo,
        s.name AS shop_name,
        b.name AS brand_name,
        bp.category_id,
        c.name AS category,
        p.brand_product_id,
        bp.brand_id,
        bp.video_url     AS bp_video_url,
        bp.detail_html   AS bp_detail_html,
        bp.spec_table    AS bp_spec_table,
        bp.package_list  AS bp_package_list,
        bp.freight       AS bp_freight,
        bp.ship_from     AS bp_ship_from,
        bp.delivery_days AS bp_delivery_days
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
      WHERE p.id = ?
      LIMIT 1
    `,
    [productId],
  );

  return (rows[0] as ProductRow | undefined) ?? null;
}

export async function ensureProductExists(productId: string) {
  const product = await getProductById(productId);
  if (!product) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
  }
  return product;
}

export async function getFavoritedProductIdSet(userId: string, productIds: string[]) {
  if (!productIds.length) {
    return new Set<string>();
  }

  const db = getDbPool();
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT product_id
      FROM product_interaction
      WHERE user_id = ?
        AND interaction_type = ?
        AND product_id IN (${placeholders})
    `,
    [userId, PRODUCT_INTERACTION_FAVORITE, ...productIds],
  );

  return new Set((rows as Array<{ product_id: number | string }>).map((row) => toEntityId(row.product_id)));
}

export async function getProductCategories() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [PRODUCT_CATEGORY_BIZ_TYPE, CATEGORY_STATUS_ACTIVE],
  );

  return (rows as ProductCategoryRow[]).map((row) => sanitizeProductCategory(row));
}
