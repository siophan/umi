import type mysql from 'mysql2/promise';
import type { ConfirmOrderResult, CreateOrderPayload } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import {
  buildOrderSn,
  COUPON_STATUS_UNUSED,
  COUPON_TYPE_CASH,
  COUPON_TYPE_DISCOUNT,
  type AddressRow,
  type CartPurchaseRow,
  type CouponRow,
  FULFILLMENT_COMPLETED,
  OPERATOR_ROLE_USER,
  ORDER_FULFILLED,
  ORDER_PAID,
  ORDER_PENDING,
  ORDER_TYPE_SHOP,
  parseCouponCondition,
  type ProductPurchaseRow,
} from './order-shared';

async function getAddressForUser(connection: mysql.Connection | mysql.PoolConnection, userId: string, addressId: string) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, user_id, name, phone_number, province, city, district, detail, tag, is_default
      FROM address
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [addressId, userId],
  );

  const row = (rows[0] as AddressRow | undefined) ?? null;
  if (!row) {
    throw new HttpError(404, 'ADDRESS_NOT_FOUND', '收货地址不存在');
  }
  return row;
}

async function getAvailableCoupon(
  connection: mysql.Connection | mysql.PoolConnection,
  userId: string,
  couponId: string | null | undefined,
  originalAmountCents: number,
) {
  if (!couponId) {
    return { couponRow: null as CouponRow | null, discountCents: 0 };
  }

  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, coupon_no, name, amount, type, condition, expire_at, source_type, status
      FROM coupon
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [couponId, userId],
  );

  const row = (rows[0] as CouponRow | undefined) ?? null;
  if (!row) {
    throw new HttpError(404, 'COUPON_NOT_FOUND', '优惠券不存在');
  }
  if (Number(row.status ?? 0) !== COUPON_STATUS_UNUSED) {
    throw new HttpError(400, 'COUPON_INVALID', '优惠券不可用');
  }
  if (row.expire_at && new Date(row.expire_at).getTime() < Date.now()) {
    throw new HttpError(400, 'COUPON_EXPIRED', '优惠券已过期');
  }

  const type = Number(row.type ?? 0);
  const minAmountCents = parseCouponCondition(row.condition);
  if (minAmountCents > 0 && originalAmountCents < minAmountCents) {
    throw new HttpError(400, 'COUPON_CONDITION_NOT_MET', '订单金额未满足优惠券条件');
  }

  let discountCents = 0;
  if (type === COUPON_TYPE_CASH || type === 30) {
    discountCents = Math.min(originalAmountCents, Number(row.amount ?? 0));
  } else if (type === COUPON_TYPE_DISCOUNT) {
    const discountRate = Math.max(0, Math.min(100, Number(row.amount ?? 0)));
    discountCents = Math.round((originalAmountCents * (100 - discountRate)) / 100);
  }

  return { couponRow: row, discountCents };
}

async function getProductPurchaseRows(
  connection: mysql.Connection | mysql.PoolConnection,
  payload: CreateOrderPayload,
): Promise<Array<{ productId: string; quantity: number; specs: string | null; row: ProductPurchaseRow }>> {
  if (!payload.productId) {
    throw new HttpError(400, 'ORDER_PRODUCT_REQUIRED', '缺少商品信息');
  }

  const quantity = Math.max(1, Math.trunc(Number(payload.quantity ?? 1) || 1));
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id AS product_id, shop_id, price, original_price, stock, status AS product_status
      FROM product
      WHERE id = ?
      LIMIT 1
    `,
    [payload.productId],
  );

  const row = (rows[0] as ProductPurchaseRow | undefined) ?? null;
  if (!row || Number(row.product_status ?? 0) !== 10) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
  }
  if (Number(row.stock ?? 0) < quantity) {
    throw new HttpError(400, 'PRODUCT_STOCK_NOT_ENOUGH', '商品库存不足');
  }

  return [{ productId: toEntityId(row.product_id), quantity, specs: null, row }];
}

async function getCartPurchaseRows(
  connection: mysql.Connection | mysql.PoolConnection,
  userId: string,
  payload: CreateOrderPayload,
): Promise<Array<{ cartItemId: string; productId: string; quantity: number; specs: string | null; row: CartPurchaseRow }>> {
  const cartItemIds = Array.isArray(payload.cartItemIds) ? payload.cartItemIds.filter(Boolean) : [];
  if (!cartItemIds.length) {
    throw new HttpError(400, 'ORDER_CART_ITEMS_REQUIRED', '请选择购物车商品');
  }

  const placeholders = cartItemIds.map(() => '?').join(', ');
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id AS cart_item_id,
        ci.product_id,
        ci.quantity,
        ci.specs,
        p.shop_id,
        p.price,
        p.original_price,
        p.stock,
        p.status AS product_status
      FROM cart_item ci
      INNER JOIN product p ON p.id = ci.product_id
      WHERE ci.user_id = ?
        AND ci.id IN (${placeholders})
      ORDER BY ci.id ASC
    `,
    [userId, ...cartItemIds],
  );

  const items = rows as CartPurchaseRow[];
  if (items.length !== cartItemIds.length) {
    throw new HttpError(404, 'CART_ITEM_NOT_FOUND', '部分购物车商品不存在');
  }

  return items.map((row) => {
    const quantity = Math.max(1, Number(row.quantity ?? 1));
    if (Number(row.product_status ?? 0) !== 10) {
      throw new HttpError(400, 'PRODUCT_NOT_AVAILABLE', '购物车中存在不可下单商品');
    }
    if (Number(row.stock ?? 0) < quantity) {
      throw new HttpError(400, 'PRODUCT_STOCK_NOT_ENOUGH', '购物车中存在库存不足商品');
    }
    return {
      cartItemId: toEntityId(row.cart_item_id),
      productId: toEntityId(row.product_id),
      quantity,
      specs: row.specs?.trim() || null,
      row,
    };
  });
}

/**
 * 创建一笔待支付订单。
 * 库存即时扣减做"占用"，但优惠券核销 / 履约单创建 / 购物车清空都延后到 markOrderPaid。
 * 库存归还由后续支付超时清理 job 处理（本期 TODO）。
 */
export async function createPendingOrder(
  userId: string,
  payload: CreateOrderPayload,
): Promise<{ orderId: string; orderSn: string; amountCents: number }> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await getAddressForUser(connection, userId, String(payload.addressId));
    const cartPurchaseItems = payload.source === 'cart' ? await getCartPurchaseRows(connection, userId, payload) : null;
    const productPurchaseItems = payload.source === 'product' ? await getProductPurchaseRows(connection, payload) : null;
    const purchaseItems = cartPurchaseItems ?? productPurchaseItems ?? [];

    if (!purchaseItems.length) {
      throw new HttpError(400, 'ORDER_ITEMS_REQUIRED', '请选择要购买的商品');
    }

    const originalAmountCents = purchaseItems.reduce((sum, item) => sum + Number(item.row.price ?? 0) * item.quantity, 0);
    const { couponRow, discountCents } = await getAvailableCoupon(connection, userId, payload.couponId, originalAmountCents);
    const payableAmountCents = Math.max(0, originalAmountCents - discountCents);
    if (payableAmountCents <= 0) {
      throw new HttpError(400, 'ORDER_AMOUNT_INVALID', '订单金额异常');
    }
    const orderSn = buildOrderSn();

    const [orderResult] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO \`order\` (
          order_sn, user_id, type, guess_id, amount, original_amount, coupon_id, coupon_discount, address_id, status, created_at, updated_at
        )
        VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [orderSn, userId, ORDER_TYPE_SHOP, payableAmountCents, originalAmountCents, couponRow ? couponRow.id : null, discountCents, payload.addressId, ORDER_PENDING],
    );

    const orderId = toEntityId(orderResult.insertId);
    const itemCount = purchaseItems.length;

    for (const item of purchaseItems) {
      const unitPrice = Number(item.row.price ?? 0);
      const originalUnitPrice = Number(item.row.original_price ?? item.row.price ?? 0);
      const itemAmount = unitPrice * item.quantity;
      const itemDiscount = itemCount > 0 ? Math.floor(discountCents / itemCount) : 0;

      await connection.execute(
        `
          INSERT INTO order_item (
            order_id, product_id, specs, quantity, unit_price, original_unit_price, item_amount, coupon_discount, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        [orderId, item.productId, item.specs || '', item.quantity, unitPrice, originalUnitPrice, itemAmount, itemDiscount],
      );

      await connection.execute(
        `
          UPDATE product
          SET
            stock = GREATEST(stock - ?, 0),
            sales = sales + ?,
            updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [item.quantity, item.quantity, item.productId],
      );
    }

    await connection.execute(
      `
        INSERT INTO order_status_log (order_id, from_status, to_status, operator_id, operator_role, note, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [orderId, ORDER_PENDING, ORDER_PENDING, userId, OPERATOR_ROLE_USER, payload.note?.trim() || '用户提交订单'],
    );

    await connection.commit();
    return { orderId, orderSn, amountCents: payableAmountCents };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 用户确认收货。
 * 会同步推进订单状态、履约状态，并记录状态流转日志。
 */
export async function confirmOrder(userId: string, orderId: string): Promise<ConfirmOrderResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          o.id,
          o.status,
          fo.id AS fulfillment_id,
          fo.status AS fulfillment_status
        FROM \`order\` o
        LEFT JOIN fulfillment_order fo ON fo.order_id = o.id
        WHERE o.id = ?
          AND o.user_id = ?
        ORDER BY fo.id DESC
        LIMIT 1
      `,
      [orderId, userId],
    );

    const row = rows[0] as
      | { id: number | string; status: number | string | null; fulfillment_id: number | string | null; fulfillment_status: number | string | null }
      | undefined;

    if (!row?.id) {
      throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
    }

    if (Number(row.status ?? 0) === ORDER_FULFILLED) {
      await connection.rollback();
      return { success: true, id: toEntityId(orderId), status: 'completed' };
    }

    await connection.execute(
      `
        UPDATE \`order\`
        SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
          AND user_id = ?
      `,
      [ORDER_FULFILLED, orderId, userId],
    );

    if (row.fulfillment_id) {
      await connection.execute(
        `
          UPDATE fulfillment_order
          SET status = ?, completed_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [FULFILLMENT_COMPLETED, row.fulfillment_id],
      );
    }

    await connection.execute(
      `
        INSERT INTO order_status_log (order_id, from_status, to_status, operator_id, operator_role, note, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [orderId, row.status ?? ORDER_PAID, ORDER_FULFILLED, userId, OPERATOR_ROLE_USER, '用户确认收货'],
    );

    await connection.commit();
    return { success: true, id: toEntityId(orderId), status: 'completed' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function urgeOrder(userId: string, orderId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, status FROM \`order\` WHERE id = ? AND user_id = ? LIMIT 1`,
    [orderId, userId],
  );
  const row = rows[0] as { id: number | string; status: number | string } | undefined;

  if (!row?.id) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
  }
  if (Number(row.status) !== ORDER_PAID) {
    throw new HttpError(400, 'ORDER_URGE_NOT_ALLOWED', '当前订单状态不支持催发货');
  }

  await db.execute(
    `INSERT INTO order_status_log (order_id, from_status, to_status, operator_id, operator_role, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [orderId, row.status, row.status, userId, OPERATOR_ROLE_USER, '用户催发货'],
  );

  return { success: true as const };
}

export async function reviewOrder(userId: string, orderId: string, productId: string, rating: number, content?: string) {
  if (!productId) {
    throw new HttpError(400, 'REVIEW_PRODUCT_REQUIRED', '请指定评价商品');
  }

  const ratingNum = Math.max(1, Math.min(5, Math.trunc(Number(rating) || 5)));
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT o.id FROM \`order\` o
     INNER JOIN order_item oi ON oi.order_id = o.id AND oi.product_id = ?
     WHERE o.id = ? AND o.user_id = ? AND o.status = ?
     LIMIT 1`,
    [productId, orderId, userId, ORDER_FULFILLED],
  );

  if (!(rows as mysql.RowDataPacket[]).length) {
    throw new HttpError(403, 'REVIEW_NOT_ALLOWED', '只能评价已完成订单中的商品');
  }

  await db.execute(
    `INSERT INTO product_review (order_id, user_id, product_id, rating, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), content = VALUES(content), updated_at = CURRENT_TIMESTAMP(3)`,
    [orderId, userId, productId, ratingNum, content?.trim() || null],
  );

  return { success: true as const };
}

