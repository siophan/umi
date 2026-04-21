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
  product_status: number | string | null;
};

type OwnedCartItemRow = {
  id: number | string;
  product_id: number | string;
  quantity: number | string;
  checked: number | string | boolean | null;
  specs: string | null;
  stock: number | string | null;
  product_status: number | string | null;
};

/**
 * 安全解析商品图片数组。
 * 购物车页可能同时遇到 image_url、images、default_img 三种来源，这里统一兜底。
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

/**
 * 把购物车查询结果收口成前端契约。
 * 这里统一做金额、图片、状态和规格兜底，避免页面层自己重复判断。
 */
function sanitizeCartItem(row: CartRow): CartItem {
  return {
    id: toEntityId(row.id),
    productId: toEntityId(row.product_id),
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
    stock: Math.max(0, Number(row.stock ?? 0)),
    status: Number(row.product_status ?? 0) === 10 ? 'active' : 'unavailable',
  };
}

/**
 * 读取当前用户拥有的单条购物车记录。
 * 后续修改数量、勾选、删除都先走这条链路确认归属。
 */
async function getOwnedCartItem(userId: string, cartItemId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.product_id,
        ci.quantity,
        ci.checked,
        ci.specs,
        p.stock,
        p.status AS product_status
      FROM cart_item ci
      INNER JOIN product p ON p.id = ci.product_id
      WHERE ci.id = ?
        AND ci.user_id = ?
      LIMIT 1
    `,
    [cartItemId, userId],
  );

  return (rows[0] as OwnedCartItemRow | undefined) ?? null;
}

/**
 * 确认购物车项归属当前用户。
 * 找不到时统一抛购物车商品不存在，避免越权修改。
 */
async function ensureOwnedCartItem(userId: string, cartItemId: string) {
  const row = await getOwnedCartItem(userId, cartItemId);
  if (!row) {
    throw new HttpError(404, 'CART_ITEM_NOT_FOUND', '购物车商品不存在');
  }
  return row;
}

/**
 * 确认目标商品仍可加入购物车。
 * 只允许上架商品进入购物车，并返回实时库存用于数量校验。
 */
async function ensureProductAvailable(productId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, stock, status
      FROM product
      WHERE id = ?
      LIMIT 1
    `,
    [productId],
  );

  const row = (rows[0] as { id: number | string; stock: number | string | null; status: number | string | null } | undefined) ?? null;
  if (!row || Number(row.status ?? 0) !== 10) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
  }
  return {
    id: toEntityId(row.id),
    stock: Math.max(0, Number(row.stock ?? 0)),
  };
}

/**
 * 读取当前用户购物车列表。
 * 购物车页、角标和支付页购物车入口都复用这条主查询。
 */
export async function getCart(userId: string): Promise<CartListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.product_id,
        ci.quantity,
        ci.specs,
        ci.checked,
        s.id AS shop_id,
        s.name AS shop_name,
        COALESCE(s.logo_url, bp.default_img, p.image_url) AS shop_logo,
        b.name AS brand_name,
        p.name AS product_name,
        p.price,
        p.original_price,
        p.image_url,
        p.images,
        bp.default_img,
        p.stock,
        p.status AS product_status
      FROM cart_item ci
      INNER JOIN product p ON p.id = ci.product_id
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
 * 同商品同规格会合并数量，不额外拆出复杂 SKU 体系。
 */
export async function addCartItem(userId: string, payload: AddCartItemPayload): Promise<CartMutationResult> {
  const product = await ensureProductAvailable(payload.productId);
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
        AND specs = ?
      LIMIT 1
    `,
    [userId, payload.productId, specs],
  );

  const existing = (existingRows[0] as { id: number | string; quantity: number | string } | undefined) ?? null;

  if (existing) {
    const mergedQuantity = Math.min(99, Math.max(1, Number(existing.quantity ?? 1) + nextQuantity));
    const finalQuantity = product.stock > 0 ? Math.min(product.stock, mergedQuantity) : mergedQuantity;
    await db.execute(
      `
        UPDATE cart_item
        SET quantity = ?, checked = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [finalQuantity, checked, existing.id],
    );
    return { success: true, id: toEntityId(existing.id) };
  }

  const finalQuantity = product.stock > 0 ? Math.min(product.stock, nextQuantity) : nextQuantity;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO cart_item (user_id, product_id, quantity, specs, checked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, payload.productId, finalQuantity, specs, checked],
  );

  return { success: true, id: toEntityId(result.insertId) };
}

/**
 * 更新购物车商品数量或勾选状态。
 * 这里只允许改数量和 checked，库存上限在这里统一截断。
 */
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
  const cappedQuantity = Number(item.stock ?? 0) > 0 ? Math.min(Number(item.stock ?? 0), normalizedQuantity) : normalizedQuantity;
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

/**
 * 删除购物车商品。
 * 删除前先校验归属，避免跨用户删除别人的 cart_item。
 */
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
