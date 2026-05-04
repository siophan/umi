import type mysql from 'mysql2/promise';

import type {
  AddCartItemPayload,
  CartItem,
  CartListResult,
  CartMutationResult,
  UpdateCartItemPayload,
} from '@umi/shared';
import { toEntityId, toOptionalEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';

type CartRow = {
  id: number | string;
  product_id: number | string;
  brand_product_sku_id: number | string;
  quantity: number | string;
  specs: string | null;
  checked: number | string | boolean | null;
  shop_id: number | string | null;
  shop_name: string | null;
  shop_logo: string | null;
  brand_name: string | null;
  product_name: string | null;
  price: number | string | null;
  original_price: number | string | null;
  image_url: string | null;
  images: string | null;
  default_img: string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  product_status: number | string | null;
  sku_status: number | string | null;
};

type OwnedCartItemRow = {
  id: number | string;
  product_id: number | string;
  brand_product_sku_id: number | string;
  quantity: number | string;
  checked: number | string | boolean | null;
  specs: string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  product_status: number | string | null;
  sku_status: number | string | null;
};

/**
 * 安全解析商品图片数组。
 */
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

function sanitizeCartItem(row: CartRow): CartItem {
  const skuActive = Number(row.sku_status ?? 0) === 10;
  return {
    id: toEntityId(row.id),
    productId: toEntityId(row.product_id),
    brandProductSkuId: toEntityId(row.brand_product_sku_id),
    shopId: toOptionalEntityId(row.shop_id),
    brand: row.brand_name || '未知品牌',
    shop: row.shop_name || '未知店铺',
    shopLogo: row.shop_logo || '',
    name: row.product_name || '商品已下架',
    specs: row.specs?.trim() || '默认规格',
    img: row.image_url || safeJsonArray(row.images)[0] || row.default_img || '',
    price: Number(row.price ?? 0) / 100,
    originalPrice: Number(row.original_price ?? row.price ?? 0) / 100,
    quantity: Math.max(1, Number(row.quantity ?? 1)),
    checked: Boolean(row.checked),
    stock: Math.max(0, Number(row.stock ?? 0) - Number(row.frozen_stock ?? 0)),
    status: Number(row.product_status ?? 0) === 10 && skuActive ? 'active' : 'unavailable',
  };
}

async function getOwnedCartItem(userId: string, cartItemId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.product_id,
        ci.brand_product_sku_id,
        ci.quantity,
        ci.checked,
        ci.specs,
        bps.stock,
        bps.frozen_stock,
        bps.status AS sku_status,
        p.status AS product_status
      FROM cart_item ci
      INNER JOIN product p ON p.id = ci.product_id
      INNER JOIN brand_product_sku bps ON bps.id = ci.brand_product_sku_id
      WHERE ci.id = ?
        AND ci.user_id = ?
      LIMIT 1
    `,
    [cartItemId, userId],
  );

  return (rows[0] as OwnedCartItemRow | undefined) ?? null;
}

async function ensureOwnedCartItem(userId: string, cartItemId: string) {
  const row = await getOwnedCartItem(userId, cartItemId);
  if (!row) {
    throw new HttpError(404, 'CART_ITEM_NOT_FOUND', '购物车商品不存在');
  }
  return row;
}

/**
 * 校验目标 SKU 可加入购物车，返回可用库存（stock - frozen_stock）。
 */
async function ensureProductAvailable(productId: string, skuId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.status AS product_status,
        bps.id AS sku_id,
        bps.status AS sku_status,
        bps.stock,
        bps.frozen_stock
      FROM product p
      INNER JOIN brand_product_sku bps ON bps.id = ?
      WHERE p.id = ?
        AND bps.brand_product_id = p.brand_product_id
      LIMIT 1
    `,
    [skuId, productId],
  );

  const row = rows[0] as
    | {
        id: number | string;
        product_status: number | string | null;
        sku_id: number | string;
        sku_status: number | string | null;
        stock: number | string | null;
        frozen_stock: number | string | null;
      }
    | undefined;

  if (!row || Number(row.product_status ?? 0) !== 10) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
  }
  if (Number(row.sku_status ?? 0) !== 10) {
    throw new HttpError(404, 'PRODUCT_SKU_NOT_FOUND', '商品规格不可用');
  }
  return {
    id: toEntityId(row.id),
    skuId: toEntityId(row.sku_id),
    stock: Math.max(0, Number(row.stock ?? 0) - Number(row.frozen_stock ?? 0)),
  };
}

export async function getCart(userId: string): Promise<CartListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.product_id,
        ci.brand_product_sku_id,
        ci.quantity,
        ci.specs,
        ci.checked,
        s.id AS shop_id,
        s.name AS shop_name,
        COALESCE(s.logo_url, bp.default_img) AS shop_logo,
        b.name AS brand_name,
        bp.name AS product_name,
        bps.guide_price AS price,
        bps.guide_price AS original_price,
        COALESCE(bps.image, bp.default_img) AS image_url,
        bp.images AS images,
        bps.stock,
        bps.frozen_stock,
        bps.status AS sku_status,
        p.status AS product_status
      FROM cart_item ci
      INNER JOIN product p ON p.id = ci.product_id
      INNER JOIN brand_product_sku bps ON bps.id = ci.brand_product_sku_id
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE ci.user_id = ?
      ORDER BY ci.updated_at DESC, ci.id DESC
    `,
    [userId],
  );

  return {
    items: (rows as CartRow[]).map((row) => sanitizeCartItem(row)),
    promoThreshold: 200,
  };
}

/**
 * 新增购物车商品。
 * 合并键：(user_id, product_id, brand_product_sku_id)。
 */
export async function addCartItem(userId: string, payload: AddCartItemPayload): Promise<CartMutationResult> {
  if (!payload.brandProductSkuId) {
    throw new HttpError(400, 'CART_SKU_REQUIRED', '请选择商品规格');
  }
  const product = await ensureProductAvailable(payload.productId, payload.brandProductSkuId);
  const nextQuantity = Math.min(99, Math.max(1, Number(payload.quantity ?? 1) || 1));
  const checked = payload.checked === undefined ? 1 : payload.checked ? 1 : 0;
  const specs = payload.specs?.trim() || '';
  const db = getDbPool();

  const [existingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, quantity
      FROM cart_item
      WHERE user_id = ?
        AND product_id = ?
        AND brand_product_sku_id = ?
      LIMIT 1
    `,
    [userId, payload.productId, payload.brandProductSkuId],
  );

  const existing = (existingRows[0] as { id: number | string; quantity: number | string } | undefined) ?? null;

  if (existing) {
    const mergedQuantity = Math.min(99, Math.max(1, Number(existing.quantity ?? 1) + nextQuantity));
    const finalQuantity = product.stock > 0 ? Math.min(product.stock, mergedQuantity) : mergedQuantity;
    await db.execute(
      `
        UPDATE cart_item
        SET quantity = ?, specs = ?, checked = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [finalQuantity, specs, checked, existing.id],
    );
    return { success: true, id: toEntityId(existing.id) };
  }

  const finalQuantity = product.stock > 0 ? Math.min(product.stock, nextQuantity) : nextQuantity;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO cart_item (user_id, product_id, brand_product_sku_id, quantity, specs, checked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, payload.productId, payload.brandProductSkuId, finalQuantity, specs, checked],
  );

  return { success: true, id: toEntityId(result.insertId) };
}

export async function updateCartItem(userId: string, cartItemId: string, payload: UpdateCartItemPayload): Promise<CartMutationResult> {
  if (payload.quantity === undefined && payload.checked === undefined) {
    throw new HttpError(400, 'CART_UPDATE_INVALID', '至少提供一个更新字段');
  }

  const item = await ensureOwnedCartItem(userId, cartItemId);
  const nextQuantityRaw = payload.quantity === undefined ? Number(item.quantity ?? 1) : Number(payload.quantity);
  if (!Number.isFinite(nextQuantityRaw) || nextQuantityRaw < 1) {
    throw new HttpError(400, 'CART_QUANTITY_INVALID', '购物车数量不合法');
  }

  const normalizedQuantity = Math.min(99, Math.max(1, Math.trunc(nextQuantityRaw)));
  const availableStock = Math.max(0, Number(item.stock ?? 0) - Number(item.frozen_stock ?? 0));
  const cappedQuantity = availableStock > 0 ? Math.min(availableStock, normalizedQuantity) : normalizedQuantity;
  const nextChecked = payload.checked === undefined ? (item.checked ? 1 : 0) : payload.checked ? 1 : 0;
  const db = getDbPool();

  await db.execute(
    `
      UPDATE cart_item
      SET quantity = ?, checked = ?, updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
        AND user_id = ?
    `,
    [cappedQuantity, nextChecked, cartItemId, userId],
  );

  return { success: true, id: toEntityId(cartItemId) };
}

export async function removeCartItem(userId: string, cartItemId: string): Promise<CartMutationResult> {
  await ensureOwnedCartItem(userId, cartItemId);
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM cart_item
      WHERE id = ?
        AND user_id = ?
    `,
    [cartItemId, userId],
  );

  return { success: true, id: toEntityId(cartItemId) };
}
