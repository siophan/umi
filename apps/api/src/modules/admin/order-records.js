import { toEntityId, toOptionalEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { adminOrdersSql, mapAdminOrderStatus, sanitizeOrderItem, toMoney, toNullableIso, toOrderTypeLabel, toShippingType, } from './orders-shared';
export async function getAdminOrders() {
    const db = getDbPool();
    const [rows] = await db.execute(adminOrdersSql);
    const orderMap = new Map();
    for (const row of rows) {
        const orderId = toEntityId(row.id);
        let order = orderMap.get(orderId);
        if (!order) {
            const guessId = toOptionalEntityId(row.guess_id);
            order = {
                id: orderId,
                orderSn: row.order_sn,
                userId: toEntityId(row.user_id),
                user: {
                    id: String(toEntityId(row.user_id)),
                    uidCode: row.uid_code,
                    phoneNumber: row.user_phone_number,
                    name: row.user_name,
                    avatarUrl: row.user_avatar_url,
                },
                orderType: toOrderTypeLabel(row.type == null ? null : Number(row.type), guessId),
                orderTypeCode: row.type == null ? null : Number(row.type),
                guessId,
                guessTitle: row.guess_title || null,
                amount: toMoney(row.amount),
                originalAmount: toMoney(row.original_amount),
                couponDiscount: toMoney(row.coupon_discount),
                status: mapAdminOrderStatus(Number(row.status ?? 0), row.fulfillment_status == null ? null : Number(row.fulfillment_status), row.refund_status == null ? null : Number(row.refund_status)),
                createdAt: new Date(row.created_at).toISOString(),
                address: row.address_id
                    ? {
                        id: String(toEntityId(row.address_id)),
                        name: row.address_name,
                        phoneNumber: row.address_phone_number,
                        province: row.province,
                        city: row.city,
                        district: row.district,
                        detail: row.detail,
                    }
                    : null,
                fulfillment: row.fulfillment_id
                    ? {
                        id: String(toEntityId(row.fulfillment_id)),
                        fulfillmentSn: row.fulfillment_sn,
                        typeCode: row.fulfillment_type == null ? null : Number(row.fulfillment_type),
                        statusCode: row.fulfillment_status == null ? null : Number(row.fulfillment_status),
                        receiverName: row.receiver_name,
                        phoneNumber: row.receiver_phone_number,
                        detailAddress: row.detail_address,
                        shippingType: toShippingType(row.shipping_type),
                        shippingFee: toMoney(row.shipping_fee),
                        totalAmount: toMoney(row.total_amount),
                        trackingNo: row.tracking_no,
                        shippedAt: toNullableIso(row.shipped_at),
                        completedAt: toNullableIso(row.completed_at),
                        createdAt: toNullableIso(row.fulfillment_created_at),
                    }
                    : null,
                refund: row.refund_id
                    ? {
                        id: String(toEntityId(row.refund_id)),
                        refundNo: row.refund_no,
                        statusCode: row.refund_status == null ? null : Number(row.refund_status),
                        refundAmount: toMoney(row.refund_amount),
                        reason: row.refund_reason,
                        reviewNote: row.refund_review_note,
                        requestedAt: toNullableIso(row.refund_requested_at),
                        reviewedAt: toNullableIso(row.refund_reviewed_at),
                        completedAt: toNullableIso(row.refund_completed_at),
                    }
                    : null,
                items: [],
            };
            orderMap.set(orderId, order);
        }
        const item = sanitizeOrderItem(row);
        if (item) {
            order.items.push(item);
        }
    }
    return Array.from(orderMap.values());
}
export async function getAdminOrderDetail(orderId) {
    const items = await getAdminOrders();
    const matched = items.find((item) => item.id === orderId);
    if (!matched) {
        throw new HttpError(404, 'ADMIN_ORDER_NOT_FOUND', '订单不存在');
    }
    return matched;
}
