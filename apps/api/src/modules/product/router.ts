import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';

import type { GuessSummary, ProductCategoryItem, ProductDetailResult, ProductFeedItem, ProductSummary, WarehouseItem } from '@joy/shared';

import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';
import { getUserByToken } from '../auth/store';

export const productRouter: ExpressRouter = Router();

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

type ProductRow = {
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
  shop_name: string | null;
  brand_name: string | null;
  category_id: number | string | null;
  category: string | null;
  brand_product_id: number | string | null;
  brand_id: number | string | null;
  default_img?: string | null;
  created_at?: Date | string;
};

type ProductCategoryRow = {
  id: number | string;
  name: string;
  icon_url: string | null;
  parent_id: number | string | null;
  level: number | string;
  sort: number | string;
  product_count: number | string | null;
};

type GuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  end_time: Date | string;
  creator_id: number | string;
  category: string | null;
};

type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds: number | string;
  is_result: number | boolean;
  vote_count: number | string;
};

type WarehouseRow = {
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

function getBearerToken(authorization?: string) {
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function safeJsonArray(value: unknown): string[] {
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

function buildFeedMiniTag(tag: string, discountAmount: number, guessPrice: number, price: number, isNew: boolean, collab: string | null | undefined) {
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

function sanitizeProductFeedItem(row: ProductRow, index: number): ProductFeedItem {
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
    id: String(row.id),
    name: row.name,
    categoryId: row.category_id == null ? null : String(row.category_id),
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
  };
}

function sanitizeProductCategory(row: ProductCategoryRow): ProductCategoryItem {
  return {
    id: String(row.id),
    name: row.name,
    iconUrl: row.icon_url,
    parentId: row.parent_id == null ? null : String(row.parent_id),
    level: Number(row.level ?? 0),
    sort: Number(row.sort ?? 0),
    count: Number(row.product_count ?? 0),
  };
}

function mapGuessStatus(code: number | string): GuessSummary['status'] {
  const value = Number(code ?? 0);
  if (value === 10) return 'draft';
  if (value === 20) return 'pending_review';
  if (value === 40) return 'settled';
  if (value === 90) return 'cancelled';
  return 'active';
}

function mapGuessReviewStatus(code: number | string): GuessSummary['reviewStatus'] {
  return Number(code ?? 0) === REVIEW_APPROVED ? 'approved' : Number(code ?? 0) === 10 ? 'pending' : 'rejected';
}

function sanitizeWarehouseRow(row: WarehouseRow): WarehouseItem {
  return {
    id: row.id,
    userId: String(row.user_id),
    productId: row.product_id ? String(row.product_id) : '',
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

async function getProductById(productId: string) {
  const db = getDbPool();
  // Use text protocol here because LIMIT bind values have been flaky with prepared statements locally.
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
    `,
    [productId],
  );

  return (rows[0] as ProductRow | undefined) ?? null;
}

async function getActiveGuess(productId: string, product: ProductRow): Promise<GuessSummary | null> {
  const db = getDbPool();
  const [guessRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [productId, GUESS_ACTIVE, REVIEW_APPROVED],
  );

  const guess = (guessRows[0] as GuessRow | undefined) ?? null;
  if (!guess) {
    return null;
  }

  const [optionRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [guess.id, guess.id],
  );

  return {
    id: String(guess.id),
    title: guess.title,
    status: mapGuessStatus(guess.status),
    reviewStatus: mapGuessReviewStatus(guess.review_status),
    category: guess.category || product.category || '热门',
    endTime: new Date(guess.end_time).toISOString(),
    creatorId: String(guess.creator_id),
    product: {
      id: String(product.id),
      name: product.name,
      brand: product.brand_name || '未知品牌',
      img: product.image_url || safeJsonArray(product.images)[0] || '',
      price: Number(product.price ?? 0) / 100,
      guessPrice: Number(product.guess_price ?? product.price ?? 0) / 100,
      category: product.category || '未分类',
      status: Number(product.status ?? 0) === 10 ? 'active' : String(product.status),
    },
    options: (optionRows as GuessOptionRow[]).map((row) => ({
      id: `${String(row.guess_id)}-${Number(row.option_index)}`,
      optionIndex: Number(row.option_index),
      optionText: row.option_text,
      odds: Number(row.odds ?? 1),
      voteCount: Number(row.vote_count ?? 0),
      isResult: Boolean(row.is_result),
    })),
  };
}

async function getWarehouseItems(userId: string, productId: string) {
  const db = getDbPool();
  const [virtualRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [VIRTUAL_STATUS_STORED, userId, productId, VIRTUAL_STATUS_STORED, VIRTUAL_STATUS_LOCKED],
  );

  const [physicalRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [PHYSICAL_STATUS_STORED, PHYSICAL_STATUS_CONSIGNING, userId, productId, PHYSICAL_STATUS_STORED, PHYSICAL_STATUS_CONSIGNING],
  );

  const [fulfillmentRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [userId, productId, FULFILLMENT_PENDING, FULFILLMENT_PROCESSING, FULFILLMENT_SHIPPED],
  );

  return [...(virtualRows as WarehouseRow[]), ...(physicalRows as WarehouseRow[]), ...(fulfillmentRows as WarehouseRow[])].map(
    (row) => sanitizeWarehouseRow(row),
  );
}

async function getRecommendations(product: ProductRow) {
  const db = getDbPool();
  // Use text protocol here because LIMIT bind values have been flaky with prepared statements locally.
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
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
      LIMIT 3
    `,
    [product.id, product.brand_id ?? 0, product.shop_id ?? 0],
  );

  return (rows as Array<{
    id: number | string;
    name: string;
    price: number | string;
    guess_price: number | string | null;
    image_url: string | null;
    status: number | string;
    category: string | null;
    brand_name: string | null;
  }>).map(
    (row): ProductSummary => ({
      id: String(row.id),
      name: row.name,
      brand: row.brand_name || '未知品牌',
      img: row.image_url || '',
      price: Number(row.price ?? 0) / 100,
      guessPrice: Number(row.guess_price ?? row.price ?? 0) / 100,
      category: row.category || '未分类',
      status: Number(row.status ?? 0) === 10 ? 'active' : String(row.status),
    }),
  );
}

async function getProductCategories() {
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

productRouter.get('/:id', async (request, response) => {
  const product = await getProductById(request.params.id);

  if (!product) {
    response.status(404).json({ success: false, message: '商品不存在' });
    return;
  }

  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;
  const [activeGuess, warehouseItems, recommendations] = await Promise.all([
    getActiveGuess(request.params.id, product),
    user ? getWarehouseItems(user.id, request.params.id) : Promise.resolve([]),
    getRecommendations(product),
  ]);

  const images = [product.image_url, ...safeJsonArray(product.images)].filter(
    (item, index, array): item is string => typeof item === 'string' && item.trim().length > 0 && array.indexOf(item) === index,
  );

  const result: ProductDetailResult = {
    product: {
      id: String(product.id),
      name: product.name,
      brand: product.brand_name || '未知品牌',
      img: images[0] || '',
      price: Number(product.price ?? 0) / 100,
      guessPrice: Number(product.guess_price ?? product.price ?? 0) / 100,
      category: product.category || '未分类',
      status: Number(product.status ?? 0) === 10 ? 'active' : String(product.status),
      shopId: product.shop_id ? String(product.shop_id) : null,
      shopName: product.shop_name || null,
      images,
      originalPrice: Number(product.original_price ?? product.price ?? 0) / 100,
      stock: Number(product.stock ?? 0),
      tags: safeJsonArray(product.tags),
      description: `${product.brand_name || '品牌'} ${product.name}，支持直购、竞猜和仓库换购。`,
    },
    activeGuess,
    warehouseItems,
    recommendations,
  };

  ok(response, result);
});

productRouter.get('/', async (request, response) => {
  const limit = Math.min(50, Math.max(1, Number(request.query.limit ?? 20) || 20));
  const keyword = String(request.query.q ?? '').trim();
  const categoryId = String(request.query.categoryId ?? '').trim();
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

  const items: ProductFeedItem[] = (rows as ProductRow[]).map((row, index) => sanitizeProductFeedItem(row, index));

  ok(response, { items, categories });
});
