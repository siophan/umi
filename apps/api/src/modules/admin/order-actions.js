import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { FULFILLMENT_PENDING, FULFILLMENT_PROCESSING, FULFILLMENT_SHIPPED, ORDER_CLOSED, ORDER_PENDING, ORDER_REFUNDED, REFUND_APPROVED, REFUND_COMPLETED, REFUND_PENDING, REFUND_REJECTED, REFUND_REVIEWING, SHIPPING_EXPRESS, SHIPPING_SAME_CITY, SHIPPING_SELF_PICKUP, } from './orders-shared';
function toShippingTypeCode(value) {
    if (value === 'same_city') {
        return SHIPPING_SAME_CITY;
    }
    if (value === 'self_pickup') {
        return SHIPPING_SELF_PICKUP;
    }
    return SHIPPING_EXPRESS;
}
async function getOrderForUpdate(connection, orderId) {
    const [rows] = await connection.execute(`
      SELECT id, status
      FROM \`order\`
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
    `, [orderId]);
    return rows[0] ?? null;
}
async function getLatestFulfillmentForUpdate(connection, orderId) {
    const [rows] = await connection.execute(`
      SELECT id, status
      FROM fulfillment_order
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
    `, [orderId]);
    return rows[0] ?? null;
}
async function getLatestRefundForUpdate(connection, orderId) {
    const [rows] = await connection.execute(`
      SELECT id, status
      FROM order_refund
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
    `, [orderId]);
    return rows[0] ?? null;
}
export async function shipAdminOrder(orderId, payload) {
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
        if (fulfillmentStatus !== FULFILLMENT_PENDING &&
            fulfillmentStatus !== FULFILLMENT_PROCESSING) {
            throw new Error('当前履约状态不支持发货');
        }
        const shippedAt = new Date().toISOString();
        await connection.execute(`
        UPDATE fulfillment_order
        SET
          shipping_type = ?,
          tracking_no = ?,
          status = ?,
          shipped_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [toShippingTypeCode(payload.shippingType), trackingNo, FULFILLMENT_SHIPPED, fulfillment.id]);
        await connection.commit();
        return {
            id: toEntityId(order.id),
            fulfillmentId: toEntityId(fulfillment.id),
            fulfillmentStatus: 'shipped',
            shippingType: payload.shippingType,
            trackingNo,
            shippedAt,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function reviewAdminOrderRefund(orderId, payload, reviewerId) {
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
        const nextStatus = payload.status === 'approved' ? REFUND_APPROVED : REFUND_REJECTED;
        const reviewedAt = new Date().toISOString();
        await connection.execute(`
        UPDATE order_refund
        SET
          status = ?,
          reviewer_id = ?,
          review_note = ?,
          reviewed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [nextStatus, reviewerId, reviewNote, refund.id]);
        await connection.commit();
        return {
            id: toEntityId(order.id),
            refundId: toEntityId(refund.id),
            status: payload.status,
            reviewedAt,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function completeAdminOrderRefund(orderId, _payload, adminUserId) {
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
        const previousOrderStatus = Number(order.status ?? 0);
        const completedAt = new Date().toISOString();
        await connection.execute(`
        UPDATE order_refund
        SET
          status = ?,
          completed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [REFUND_COMPLETED, refund.id]);
        await connection.execute(`
        UPDATE \`order\`
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [ORDER_REFUNDED, order.id]);
        await connection.execute(`
        INSERT INTO order_status_log (
          order_id, from_status, to_status, operator_id, operator_role, note, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `, [order.id, previousOrderStatus, ORDER_REFUNDED, adminUserId, 'admin', '后台完成退款']);
        await connection.commit();
        return {
            id: toEntityId(order.id),
            refundId: toEntityId(refund.id),
            status: 'completed',
            completedAt,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
