import type mysql from 'mysql2/promise';

import type {
  CompleteAdminOrderRefundPayload,
  CompleteAdminOrderRefundResult,
  DeliverAdminLogisticsPayload,
  DeliverAdminLogisticsResult,
  ReviewAdminOrderRefundPayload,
  ReviewAdminOrderRefundResult,
  ShipAdminOrderPayload,
  ShipAdminOrderResult,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { appLogger } from '../../lib/logger';
import { refundPayOrder } from '../payment/payment-service';
import {
  PAY_STATUS_PAID,
  PAY_STATUS_REFUNDED,
  payChannelCodeToKey,
} from '../payment/payment-shared';
import {
  FULFILLMENT_PENDING,
  FULFILLMENT_PROCESSING,
  FULFILLMENT_SHIPPED,
  FULFILLMENT_COMPLETED,
  ORDER_CLOSED,
  ORDER_PENDING,
  ORDER_REFUNDED,
  REFUND_APPROVED,
  REFUND_COMPLETED,
  REFUND_PENDING,
  REFUND_REJECTED,
  REFUND_REVIEWING,
  SHIPPING_EXPRESS,
  SHIPPING_SAME_CITY,
  SHIPPING_SELF_PICKUP,
} from './orders-shared';
import { OPERATOR_ROLE_ADMIN } from '../order/order-shared';

type OrderActionRow = {
  id: number | string;
  status: number | string | null;
  pay_no?: string | null;
  pay_channel?: number | string | null;
  pay_status?: number | string | null;
  amount?: number | string | null;
};

type FulfillmentActionRow = {
  id: number | string;
  status: number | string | null;
};

type RefundActionRow = {
  id: number | string;
  status: number | string | null;
  refund_no?: string | null;
  refund_amount?: number | string | null;
};

function toShippingTypeCode(value: ShipAdminOrderPayload['shippingType']) {
  if (value === 'same_city') {
    return SHIPPING_SAME_CITY;
  }
  if (value === 'self_pickup') {
    return SHIPPING_SELF_PICKUP;
  }
  return SHIPPING_EXPRESS;
}

async function getOrderForUpdate(
  connection: mysql.PoolConnection,
  orderId: string,
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, status, pay_no, pay_channel, pay_status, amount
      FROM \`order\`
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [orderId],
  );

  return (rows[0] as OrderActionRow | undefined) ?? null;
}

async function getLatestFulfillmentForUpdate(
  connection: mysql.PoolConnection,
  orderId: string,
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, status
      FROM fulfillment_order
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
    `,
    [orderId],
  );

  return (rows[0] as FulfillmentActionRow | undefined) ?? null;
}

async function getLatestRefundForUpdate(
  connection: mysql.PoolConnection,
  orderId: string,
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, status, refund_no, refund_amount
      FROM order_refund
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
    `,
    [orderId],
  );

  return (rows[0] as RefundActionRow | undefined) ?? null;
}

export async function shipAdminOrder(
  orderId: string,
  payload: ShipAdminOrderPayload,
): Promise<ShipAdminOrderResult> {
  const trackingNo = payload.trackingNo?.trim() || null;
  if (payload.shippingType === 'express' && !trackingNo) {
    throw new Error('快递发货必须填写物流单号');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const order = await getOrderForUpdate(connection, orderId);
    if (!order) {
      throw new HttpError(404, 'ADMIN_ORDER_NOT_FOUND', '订单不存在');
    }

    const orderStatus = Number(order.status ?? 0);
    if (orderStatus === ORDER_PENDING) {
      throw new Error('待支付订单不支持发货');
    }
    if (orderStatus === ORDER_CLOSED) {
      throw new Error('已关闭订单不支持发货');
    }
    if (orderStatus === ORDER_REFUNDED) {
      throw new Error('已退款订单不支持发货');
    }

    const fulfillment = await getLatestFulfillmentForUpdate(connection, orderId);
    if (!fulfillment) {
      throw new Error('订单缺少履约单，暂不能发货');
    }

    const fulfillmentStatus = Number(fulfillment.status ?? 0);
    if (
      fulfillmentStatus !== FULFILLMENT_PENDING &&
      fulfillmentStatus !== FULFILLMENT_PROCESSING
    ) {
      throw new Error('当前履约状态不支持发货');
    }

    const shippedAt = new Date().toISOString();
    await connection.execute(
      `
        UPDATE fulfillment_order
        SET
          shipping_type = ?,
          tracking_no = ?,
          status = ?,
          shipped_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [toShippingTypeCode(payload.shippingType), trackingNo, FULFILLMENT_SHIPPED, fulfillment.id],
    );

    await connection.commit();

    return {
      id: toEntityId(order.id),
      fulfillmentId: toEntityId(fulfillment.id),
      fulfillmentStatus: 'shipped',
      shippingType: payload.shippingType,
      trackingNo,
      shippedAt,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reviewAdminOrderRefund(
  orderId: string,
  payload: ReviewAdminOrderRefundPayload,
  reviewerId: string,
): Promise<ReviewAdminOrderRefundResult> {
  const reviewNote = payload.reviewNote?.trim() || null;
  if (payload.status === 'rejected' && !reviewNote) {
    throw new Error('请填写拒绝原因');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const order = await getOrderForUpdate(connection, orderId);
    if (!order) {
      throw new HttpError(404, 'ADMIN_ORDER_NOT_FOUND', '订单不存在');
    }

    const refund = await getLatestRefundForUpdate(connection, orderId);
    if (!refund) {
      throw new Error('订单没有退款申请');
    }

    const refundStatus = Number(refund.status ?? 0);
    if (refundStatus !== REFUND_PENDING && refundStatus !== REFUND_REVIEWING) {
      throw new Error('当前退款状态不支持审核');
    }

    const nextStatus =
      payload.status === 'approved' ? REFUND_APPROVED : REFUND_REJECTED;
    const reviewedAt = new Date().toISOString();

    await connection.execute(
      `
        UPDATE order_refund
        SET
          status = ?,
          reviewer_id = ?,
          review_note = ?,
          reviewed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [nextStatus, reviewerId, reviewNote, refund.id],
    );

    await connection.commit();

    return {
      id: toEntityId(order.id),
      refundId: toEntityId(refund.id),
      status: payload.status,
      reviewedAt,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function completeAdminOrderRefund(
  orderId: string,
  _payload: CompleteAdminOrderRefundPayload,
  adminUserId: string,
): Promise<CompleteAdminOrderRefundResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const order = await getOrderForUpdate(connection, orderId);
    if (!order) {
      throw new HttpError(404, 'ADMIN_ORDER_NOT_FOUND', '订单不存在');
    }

    const refund = await getLatestRefundForUpdate(connection, orderId);
    if (!refund) {
      throw new Error('订单没有退款申请');
    }

    const refundStatus = Number(refund.status ?? 0);
    if (refundStatus !== REFUND_APPROVED) {
      throw new Error('当前退款状态不支持完成退款');
    }

    // 调原通道退款前先校验支付态：必须是已支付才能退；幂等情况下 pay_status 已是 REFUNDED
    // 也要继续走完 DB 收尾流程（避免 admin 重试时 DB 留在中间态）
    const payStatus = Number(order.pay_status ?? 0);
    if (payStatus !== PAY_STATUS_PAID && payStatus !== PAY_STATUS_REFUNDED) {
      throw new Error('订单支付状态异常，无法退款');
    }

    const channelKey = payChannelCodeToKey(Number(order.pay_channel ?? 0));
    if (!channelKey || !order.pay_no) {
      throw new Error('订单缺少支付渠道或支付单号，无法发起退款');
    }

    const totalCents = Number(order.amount ?? 0);
    const refundCents = Number(refund.refund_amount ?? totalCents);
    if (totalCents <= 0 || refundCents <= 0) {
      throw new Error('订单金额异常，无法退款');
    }
    if (refundCents > totalCents) {
      throw new Error('退款金额超过订单金额');
    }

    const refundNo = refund.refund_no?.trim() || `OR${order.id}R${refund.id}`;

    // 调网关退款；refund_no 是幂等键，重试时网关返回相同结果不会重复扣款
    if (payStatus === PAY_STATUS_PAID) {
      try {
        await refundPayOrder(channelKey, {
          payNo: order.pay_no,
          refundNo,
          totalCents,
          refundCents,
          reason: '后台完成退款',
        });
      } catch (error) {
        appLogger.error(
          { err: error, orderId: order.id, payNo: order.pay_no, channel: channelKey },
          '[completeAdminOrderRefund] 网关退款失败',
        );
        throw new HttpError(
          502,
          'ADMIN_ORDER_REFUND_GATEWAY_FAILED',
          error instanceof Error ? error.message : '退款网关请求失败，请稍后再试',
        );
      }
    }

    const previousOrderStatus = Number(order.status ?? 0);
    const completedAt = new Date().toISOString();

    await connection.execute(
      `
        UPDATE order_refund
        SET
          status = ?,
          refund_no = ?,
          completed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [REFUND_COMPLETED, refundNo, refund.id],
    );

    await connection.execute(
      `
        UPDATE \`order\`
        SET
          status = ?,
          pay_status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [ORDER_REFUNDED, PAY_STATUS_REFUNDED, order.id],
    );

    // 退款完成 → 全单退货入库；按 order_item.quantity 把 brand_product_sku.stock 加回去。
    // 注意：markOrderPaid 时 frozen_stock 已经清掉了，这里只动 stock（按 SKU 维度）。
    await connection.execute(
      `
        UPDATE brand_product_sku bps
          INNER JOIN order_item oi ON oi.brand_product_sku_id = bps.id
          SET bps.stock = bps.stock + oi.quantity,
              bps.updated_at = CURRENT_TIMESTAMP(3)
        WHERE oi.order_id = ?
      `,
      [order.id],
    );

    await connection.execute(
      `
        INSERT INTO order_status_log (
          order_id, from_status, to_status, operator_id, operator_role, note, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [order.id, previousOrderStatus, ORDER_REFUNDED, adminUserId, OPERATOR_ROLE_ADMIN, '后台完成退款'],
    );

    await connection.commit();
    appLogger.info(
      { orderId: order.id, refundId: refund.id, refundNo, channel: channelKey, refundCents },
      '[completeAdminOrderRefund] 退款完成',
    );

    return {
      id: toEntityId(order.id),
      refundId: toEntityId(refund.id),
      status: 'completed',
      completedAt,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deliverAdminLogistics(
  fulfillmentId: string,
  _payload: DeliverAdminLogisticsPayload,
): Promise<DeliverAdminLogisticsResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, order_id, status
        FROM fulfillment_order
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [fulfillmentId],
    );

    const fulfillment = (rows[0] as (FulfillmentActionRow & { order_id?: number | string | null }) | undefined) ?? null;
    if (!fulfillment?.order_id) {
      throw new HttpError(404, 'ADMIN_LOGISTICS_NOT_FOUND', '物流记录不存在');
    }

    const fulfillmentStatus = Number(fulfillment.status ?? 0);
    if (fulfillmentStatus !== FULFILLMENT_SHIPPED) {
      throw new Error('当前物流状态不支持标记签收');
    }

    const completedAt = new Date().toISOString();
    await connection.execute(
      `
        UPDATE fulfillment_order
        SET
          status = ?,
          completed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [FULFILLMENT_COMPLETED, fulfillment.id],
    );

    await connection.commit();

    return {
      id: toEntityId(fulfillment.id),
      orderId: toEntityId(fulfillment.order_id),
      status: 'completed',
      completedAt,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
