import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';
import type { FetchOrderPayStatusResult, GuessPayChannel, OrderPayStatus } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { appLogger } from '../../lib/logger';
import { closePayOrder, createPayOrder, queryPayOrder } from '../payment/payment-service';
import {
  generatePayNo,
  payChannelCodeToKey,
  payChannelKeyToCode,
  PAY_NO_PREFIX_ORDER,
  PAY_STATUS_CLOSED,
  PAY_STATUS_FAILED,
  PAY_STATUS_PAID,
  PAY_STATUS_WAITING,
} from '../payment/payment-shared';
import {
  COUPON_STATUS_USED,
  FULFILLMENT_PENDING,
  FULFILLMENT_TYPE_SHIP,
  OPERATOR_ROLE_SYSTEM,
  ORDER_CLOSED,
  ORDER_PAID,
  ORDER_PENDING,
} from './order-shared';

const PAY_EXPIRES_SEC = 5 * 60;

/**
 * 订单关闭/取消时把占用的 brand_product_sku.frozen_stock 释放回去。
 * 仅在 PENDING → CLOSED 切换的事务里幂等执行；其他状态来源（已 PAID 后退款）不调用。
 */
async function releaseOrderFrozenStock(orderId: number | string): Promise<void> {
  const db = getDbPool();
  await db.execute(
    `UPDATE brand_product_sku bps
       INNER JOIN order_item oi ON oi.brand_product_sku_id = bps.id
       SET bps.frozen_stock = GREATEST(bps.frozen_stock - oi.quantity, 0),
           bps.updated_at = CURRENT_TIMESTAMP(3)
     WHERE oi.order_id = ?`,
    [orderId],
  );
}

type OrderForPayRow = {
  id: number | string;
  user_id: number | string;
  order_sn: string;
  amount: number | string;
  status: number | string;
  pay_status: number | string;
  pay_no: string | null;
  address_id: number | string | null;
  coupon_id: number | string | null;
  /** 取首项作为支付主体名 */
  product_name: string | null;
};

async function loadOrderForPay(orderId: string, userId: string): Promise<OrderForPayRow> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        o.id,
        o.user_id,
        o.order_sn,
        o.amount,
        o.status,
        o.pay_status,
        o.pay_no,
        o.address_id,
        o.coupon_id,
        bp.name AS product_name
      FROM \`order\` o
      LEFT JOIN order_item oi ON oi.order_id = o.id
      LEFT JOIN product p ON p.id = oi.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE o.id = ?
      ORDER BY oi.id ASC
      LIMIT 1
    `,
    [orderId],
  );
  const row = rows[0] as OrderForPayRow | undefined;
  if (!row) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
  }
  if (String(row.user_id) !== String(userId)) {
    throw new HttpError(403, 'ORDER_FORBIDDEN', '无权操作该订单');
  }
  return row;
}

/**
 * 给已存在的 PENDING 订单发起一次真实支付。
 * 复用同一笔 pay_no（首次创建）或重新生成（前一次过期）。
 * 当前简化处理：每次都新生成 pay_no + 重置 pay_expires_at，并把上一次（如有）通过网关 close。
 */
export async function createOrderPayment(
  userId: string,
  orderId: string,
  channel: GuessPayChannel,
  clientIp: string,
): Promise<{
  orderId: string;
  orderSn: string;
  payNo: string;
  payChannel: GuessPayChannel;
  payUrl: string;
  expiresAt: Date;
}> {
  if (channel !== 'wechat' && channel !== 'alipay') {
    throw new HttpError(400, 'PAY_CHANNEL_INVALID', '不支持的支付渠道');
  }

  const order = await loadOrderForPay(orderId, userId);
  const status = Number(order.status);
  if (status !== ORDER_PENDING) {
    if (status === ORDER_PAID) {
      throw new HttpError(409, 'ORDER_ALREADY_PAID', '订单已支付');
    }
    if (status === ORDER_CLOSED) {
      throw new HttpError(409, 'ORDER_CLOSED', '订单已关闭');
    }
    throw new HttpError(400, 'ORDER_STATUS_INVALID', '当前订单状态不可支付');
  }

  const amountCents = Math.round(Number(order.amount ?? 0));
  if (amountCents <= 0) {
    throw new HttpError(400, 'ORDER_AMOUNT_INVALID', '订单金额异常');
  }

  // 关闭旧的网关单（best effort），避免同一笔订单两条 pay_no 都活着
  if (order.pay_no) {
    const previousChannel = payChannelCodeToKey(
      // pay_channel 取自上一次写入的渠道
      // 这里直接尝试两次也行，但已知 channel 时只关一次
      null,
    );
    if (previousChannel) {
      try {
        await closePayOrder(previousChannel, order.pay_no);
      } catch {
        /* ignore */
      }
    }
  }

  const payNo = generatePayNo(String(order.id).slice(-6), PAY_NO_PREFIX_ORDER);
  const expiresAt = new Date(Date.now() + PAY_EXPIRES_SEC * 1000);

  const db = getDbPool();
  await db.execute(
    `UPDATE \`order\`
       SET pay_status = ?, pay_channel = ?, pay_no = ?, pay_expires_at = ?, updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [PAY_STATUS_WAITING, payChannelKeyToCode(channel), payNo, expiresAt, order.id],
  );

  try {
    const subject = order.product_name ?? '商城订单';
    const result = await createPayOrder(channel, {
      payNo,
      amountCents,
      subject: subject.slice(0, 64),
      clientIp,
      expiresInSec: PAY_EXPIRES_SEC,
    });
    return {
      orderId: toEntityId(order.id),
      orderSn: order.order_sn,
      payNo,
      payChannel: channel,
      payUrl: result.payUrl,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    await db.execute(
      'UPDATE `order` SET pay_status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [PAY_STATUS_FAILED, order.id],
    );
    appLogger.error({ err: error, payNo, orderId: order.id }, '[order-pay] gateway create failed');
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '支付下单失败，请稍后再试');
  }
}

/**
 * 支付回调 / 主动查询命中"已支付"时调用。
 * 在事务内：锁订单 → 校验状态 → 转 PAID + 创建 fulfillment + 删购物车（最佳尝试）+ 核销券 + 状态日志。
 * 关键：只在 pay_status=waiting + status=PENDING 才推进，重复回调安全跳过。
 */
export async function markOrderPaid(payNo: string, tradeNo: string, paidAt: Date): Promise<void> {
  const db = getDbPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, user_id, status, pay_status, address_id, amount, coupon_id
         FROM \`order\` WHERE pay_no = ? FOR UPDATE`,
      [payNo],
    );
    const order = rows[0] as
      | {
          id: number | string;
          user_id: number | string;
          status: number | string;
          pay_status: number | string;
          address_id: number | string | null;
          amount: number | string;
          coupon_id: number | string | null;
        }
      | undefined;
    if (!order) {
      appLogger.warn({ payNo }, '[markOrderPaid] pay_no not found in order');
      await connection.rollback();
      return;
    }
    const currentPay = Number(order.pay_status);
    if (currentPay === PAY_STATUS_PAID) {
      await connection.rollback();
      return;
    }
    if (currentPay !== PAY_STATUS_WAITING) {
      appLogger.warn({ payNo, currentPay }, '[markOrderPaid] pay_status not waiting; skipping');
      await connection.rollback();
      return;
    }
    if (Number(order.status) !== ORDER_PENDING) {
      appLogger.warn({ payNo, status: order.status }, '[markOrderPaid] order status not pending');
      await connection.rollback();
      return;
    }

    await connection.execute(
      `UPDATE \`order\`
         SET status = ?, pay_status = ?, pay_trade_no = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [ORDER_PAID, PAY_STATUS_PAID, tradeNo, paidAt, order.id],
    );

    await connection.execute(
      `INSERT INTO order_status_log (order_id, from_status, to_status, operator_id, operator_role, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [order.id, ORDER_PENDING, ORDER_PAID, order.user_id, OPERATOR_ROLE_SYSTEM, '支付成功'],
    );

    // 库存：占用转扣减——同时减 stock 与 frozen_stock（按 SKU 维度）
    await connection.execute(
      `UPDATE brand_product_sku bps
         INNER JOIN order_item oi ON oi.brand_product_sku_id = bps.id
         SET bps.stock = GREATEST(bps.stock - oi.quantity, 0),
             bps.frozen_stock = GREATEST(bps.frozen_stock - oi.quantity, 0),
             bps.updated_at = CURRENT_TIMESTAMP(3)
       WHERE oi.order_id = ?`,
      [order.id],
    );

    if (order.coupon_id) {
      await connection.execute(
        `UPDATE coupon SET status = ?, used_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ? AND user_id = ?`,
        [COUPON_STATUS_USED, order.coupon_id, order.user_id],
      );
    }

    // 取地址 + 任意一项 shop_id 用于建履约单
    const [addressRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT name, phone_number, province, city, district, detail
         FROM address WHERE id = ? LIMIT 1`,
      [order.address_id],
    );
    const address = addressRows[0] as
      | {
          name: string;
          phone_number: string;
          province: string;
          city: string;
          district: string;
          detail: string;
        }
      | undefined;

    const [itemRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT oi.product_id, p.shop_id
         FROM order_item oi LEFT JOIN product p ON p.id = oi.product_id
         WHERE oi.order_id = ? ORDER BY oi.id ASC LIMIT 1`,
      [order.id],
    );
    const firstShop = itemRows[0] as { shop_id: number | string | null } | undefined;

    if (address) {
      await connection.execute(
        `INSERT INTO fulfillment_order (
           fulfillment_sn, type, status, user_id, order_id, shop_id, address_id, receiver_name, phone_number,
           province, city, district, detail_address, shipping_type, shipping_fee, total_amount, tracking_no,
           shipped_at, completed_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        [
          `FO${Date.now()}${Math.floor(Math.random() * 9000) + 1000}`,
          FULFILLMENT_TYPE_SHIP,
          FULFILLMENT_PENDING,
          order.user_id,
          order.id,
          firstShop?.shop_id ?? null,
          order.address_id,
          address.name,
          address.phone_number,
          address.province,
          address.city,
          address.district,
          address.detail,
          FULFILLMENT_TYPE_SHIP,
          0,
          Number(order.amount ?? 0),
        ],
      );
    } else {
      appLogger.warn({ orderId: order.id }, '[markOrderPaid] address missing, skip fulfillment');
    }

    // 删除购物车里被该订单消费的项（按 product + sku 精准匹配）
    await connection.execute(
      `DELETE ci FROM cart_item ci
         INNER JOIN order_item oi
           ON oi.product_id = ci.product_id
          AND oi.brand_product_sku_id = ci.brand_product_sku_id
         WHERE oi.order_id = ? AND ci.user_id = ?`,
      [order.id, order.user_id],
    );

    await connection.commit();
    appLogger.info({ payNo, orderId: order.id }, '[markOrderPaid] paid');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function mapPayStatusCodeToKey(code: number | string): OrderPayStatus {
  const value = Number(code);
  if (value === PAY_STATUS_PAID) return 'paid';
  if (value === PAY_STATUS_FAILED) return 'failed';
  if (value === PAY_STATUS_CLOSED) return 'closed';
  return 'waiting';
}

type OrderPayQueryRow = {
  id: number | string;
  user_id: number | string;
  pay_no: string | null;
  pay_status: number | string;
  pay_channel: number | string | null;
  pay_expires_at: Date | string | null;
  paid_at: Date | string | null;
  status: number | string;
};

export async function queryOrderPayStatus(
  userId: string,
  orderId: string,
): Promise<FetchOrderPayStatusResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, user_id, pay_no, pay_status, pay_channel, pay_expires_at, paid_at, status
       FROM \`order\` WHERE id = ? LIMIT 1`,
    [orderId],
  );
  const order = rows[0] as OrderPayQueryRow | undefined;
  if (!order) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
  }
  if (String(order.user_id) !== String(userId)) {
    throw new HttpError(403, 'ORDER_FORBIDDEN', '无权访问该订单');
  }

  const currentPay = Number(order.pay_status);
  if (currentPay !== PAY_STATUS_WAITING) {
    return {
      orderId: toEntityId(order.id),
      payStatus: mapPayStatusCodeToKey(currentPay),
      paidAt: order.paid_at ? new Date(order.paid_at).toISOString() : null,
    };
  }

  // 过期 → close + 解冻 brand_product.frozen_stock
  if (order.pay_expires_at && new Date(order.pay_expires_at).getTime() < Date.now()) {
    const [closeResult] = await db.execute<mysql.ResultSetHeader>(
      `UPDATE \`order\` SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ? AND pay_status = ?`,
      [PAY_STATUS_CLOSED, ORDER_CLOSED, order.id, PAY_STATUS_WAITING],
    );
    if (closeResult.affectedRows > 0) {
      await releaseOrderFrozenStock(order.id);
    }
    return { orderId: toEntityId(order.id), payStatus: 'closed', paidAt: null };
  }

  const channelKey = payChannelCodeToKey(order.pay_channel);
  if (!channelKey || !order.pay_no) {
    return { orderId: toEntityId(order.id), payStatus: 'waiting', paidAt: null };
  }

  try {
    const queryResult = await queryPayOrder(channelKey, order.pay_no);
    if (queryResult.status === 'paid' && queryResult.tradeNo) {
      await markOrderPaid(order.pay_no, queryResult.tradeNo, queryResult.paidAt ?? new Date());
      return {
        orderId: toEntityId(order.id),
        payStatus: 'paid',
        paidAt: (queryResult.paidAt ?? new Date()).toISOString(),
      };
    }
    if (queryResult.status === 'closed') {
      const [closeResult] = await db.execute<mysql.ResultSetHeader>(
        `UPDATE \`order\` SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ? AND pay_status = ?`,
        [PAY_STATUS_CLOSED, ORDER_CLOSED, order.id, PAY_STATUS_WAITING],
      );
      if (closeResult.affectedRows > 0) {
        await releaseOrderFrozenStock(order.id);
      }
      return { orderId: toEntityId(order.id), payStatus: 'closed', paidAt: null };
    }
    if (queryResult.status === 'failed') {
      await db.execute(
        `UPDATE \`order\` SET pay_status = ?, updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ? AND pay_status = ?`,
        [PAY_STATUS_FAILED, order.id, PAY_STATUS_WAITING],
      );
      return { orderId: toEntityId(order.id), payStatus: 'failed', paidAt: null };
    }
    return { orderId: toEntityId(order.id), payStatus: 'waiting', paidAt: null };
  } catch (error) {
    appLogger.warn({ err: error, orderId: order.id }, '[queryOrderPayStatus] gateway query failed');
    return { orderId: toEntityId(order.id), payStatus: 'waiting', paidAt: null };
  }
}
