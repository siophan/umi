import type mysql from 'mysql2/promise';

import { toEntityId, toOptionalEntityId, type GuessSummary, type ProductDetailResult, type ProductSummary } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  CATEGORY_STATUS_ACTIVE,
  FULFILLMENT_PENDING,
  FULFILLMENT_PROCESSING,
  FULFILLMENT_SHIPPED,
  getFavoritedProductIdSet,
  getProductById,
  getProductCategories,
  GuessOptionRow,
  GuessRow,
  GUESS_ACTIVE,
  mapGuessReviewStatus,
  mapGuessStatus,
  PHYSICAL_STATUS_CONSIGNING,
  PHYSICAL_STATUS_STORED,
  ProductReviewRow,
  ProductRow,
  PRODUCT_CATEGORY_BIZ_TYPE,
  REVIEW_APPROVED,
  safeJsonArray,
  sanitizeWarehouseRow,
  VIRTUAL_STATUS_LOCKED,
  VIRTUAL_STATUS_STORED,
  WarehouseRow,
} from './product-shared';

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
      LIMIT 6
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
      id: toEntityId(row.id),
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

async function getRecentProductReviews(productId: string) {
  const db = getDbPool();
  let rows: mysql.RowDataPacket[];
  try {
    [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
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
      `,
      [productId],
    );
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    throw error;
  }

  return (rows as ProductReviewRow[]).map((row) => ({
    id: toEntityId(row.id),
    userName: row.user_name?.trim() || `用户${String(row.user_id)}`,
    userAvatar: row.user_avatar?.trim() || null,
    rating: Math.max(1, Math.min(5, Math.trunc(Number(row.rating) || 5))),
    content: row.content?.trim() || null,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function getProductDetail(productId: string, userId?: string | null): Promise<ProductDetailResult> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  const [activeGuess, warehouseItems, recommendations, favoritedProductIds, reviews] = await Promise.all([
    getActiveGuess(productId, product),
    userId ? getWarehouseItems(userId, productId) : Promise.resolve([]),
    getRecommendations(product),
    userId ? getFavoritedProductIdSet(userId, [productId]) : Promise.resolve(new Set<string>()),
    getRecentProductReviews(productId),
  ]);

  const images = [product.image_url, ...safeJsonArray(product.images)].filter(
    (item, index, array): item is string =>
      typeof item === 'string' &&
      item.trim().length > 0 &&
      array.indexOf(item) === index,
  );

  return {
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
}
