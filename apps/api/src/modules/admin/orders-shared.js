import { toEntityId, toOptionalEntityId } from '@umi/shared';
export const ORDER_TYPE_GUESS_REWARD = 10;
export const ORDER_TYPE_SHOP = 20;
export const ORDER_PENDING = 10;
export const ORDER_PAID = 20;
export const ORDER_FULFILLED = 30;
export const ORDER_CLOSED = 40;
export const ORDER_REFUNDED = 90;
export const REFUND_PENDING = 10;
export const REFUND_REVIEWING = 20;
export const REFUND_APPROVED = 30;
export const REFUND_REJECTED = 40;
export const REFUND_COMPLETED = 90;
export const FULFILLMENT_PENDING = 10;
export const FULFILLMENT_PROCESSING = 20;
export const FULFILLMENT_SHIPPED = 30;
export const FULFILLMENT_COMPLETED = 40;
export const FULFILLMENT_CANCELED = 90;
export const SHIPPING_EXPRESS = 10;
export const SHIPPING_SAME_CITY = 20;
export const SHIPPING_SELF_PICKUP = 30;
export const CONSIGN_LISTED = 10;
export const CONSIGN_TRADED = 20;
export const CONSIGN_CANCELED = 30;
export function toMoney(value) {
    return Number(value ?? 0) / 100;
}
export function toNullableIso(value) {
    return value ? new Date(value).toISOString() : null;
}
export function toOrderTypeLabel(code, guessId) {
    if (code === ORDER_TYPE_GUESS_REWARD || guessId) {
        return 'guess_reward';
    }
    if (code === ORDER_TYPE_SHOP) {
        return 'shop_order';
    }
    return null;
}
export function toShippingType(code) {
    const value = Number(code ?? 0);
    if (value === SHIPPING_EXPRESS) {
        return 'express';
    }
    if (value === SHIPPING_SAME_CITY) {
        return 'same_city';
    }
    if (value === SHIPPING_SELF_PICKUP) {
        return 'self_pickup';
    }
    return 'unknown';
}
export function toShippingTypeLabel(type) {
    if (type === 'express') {
        return '快递物流';
    }
    if (type === 'same_city') {
        return '同城配送';
    }
    if (type === 'self_pickup') {
        return '用户自提';
    }
    return '待确认';
}
export function inferCarrier(shippingType, trackingNo) {
    if (shippingType === 'same_city') {
        return { carrier: '同城配送', derived: false };
    }
    if (shippingType === 'self_pickup') {
        return { carrier: '用户自提', derived: false };
    }
    if (!trackingNo) {
        return { carrier: '待录入', derived: true };
    }
    const normalized = trackingNo.toUpperCase();
    if (normalized.startsWith('SF')) {
        return { carrier: '顺丰速运', derived: true };
    }
    if (normalized.startsWith('JD')) {
        return { carrier: '京东快递', derived: true };
    }
    if (normalized.startsWith('YT')) {
        return { carrier: '圆通速递', derived: true };
    }
    if (normalized.startsWith('ZT')) {
        return { carrier: '中通快递', derived: true };
    }
    return { carrier: '快递物流', derived: true };
}
function formatSpecs(specs) {
    if (!specs) {
        return null;
    }
    const raw = specs.trim();
    if (!raw) {
        return null;
    }
    if (!raw.startsWith('{') && !raw.startsWith('[')) {
        return raw;
    }
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => String(item).trim())
                .filter(Boolean)
                .join(' / ');
        }
        if (parsed && typeof parsed === 'object') {
            return Object.entries(parsed)
                .map(([key, value]) => `${key}:${String(value)}`)
                .join(' / ');
        }
    }
    catch { }
    return raw;
}
export function mapAdminOrderStatus(orderStatus, fulfillmentStatus, refundStatus) {
    if (refundStatus === REFUND_PENDING ||
        refundStatus === REFUND_REVIEWING ||
        refundStatus === REFUND_APPROVED) {
        return 'refund_pending';
    }
    if (orderStatus === ORDER_REFUNDED || refundStatus === REFUND_COMPLETED) {
        return 'refunded';
    }
    if (orderStatus === ORDER_CLOSED) {
        return 'cancelled';
    }
    if (orderStatus === ORDER_PENDING) {
        return 'pending';
    }
    if (orderStatus === ORDER_FULFILLED) {
        return 'completed';
    }
    if (orderStatus === ORDER_PAID) {
        if (fulfillmentStatus === FULFILLMENT_SHIPPED) {
            return 'shipping';
        }
        if (fulfillmentStatus === FULFILLMENT_COMPLETED) {
            return 'delivered';
        }
        if (fulfillmentStatus === FULFILLMENT_CANCELED) {
            return 'cancelled';
        }
        return 'paid';
    }
    return 'pending';
}
export function mapPaymentStatusLabel(orderStatus) {
    if (orderStatus === ORDER_REFUNDED) {
        return '已退款';
    }
    return '已入账';
}
export function mapRefundStatusLabel(refundStatus) {
    if (refundStatus === REFUND_PENDING) {
        return '待审核';
    }
    if (refundStatus === REFUND_REVIEWING) {
        return '审核中';
    }
    if (refundStatus === REFUND_APPROVED) {
        return '已通过';
    }
    if (refundStatus === REFUND_REJECTED) {
        return '已拒绝';
    }
    if (refundStatus === REFUND_COMPLETED) {
        return '已完成';
    }
    return '退款中';
}
export function mapLogisticsStatus(code) {
    if (code === FULFILLMENT_SHIPPED) {
        return { status: 'shipping', statusLabel: '配送中' };
    }
    if (code === FULFILLMENT_COMPLETED) {
        return { status: 'completed', statusLabel: '已完成' };
    }
    if (code === FULFILLMENT_CANCELED) {
        return { status: 'cancelled', statusLabel: '已取消' };
    }
    return { status: 'stored', statusLabel: '在库' };
}
export function mapConsignStatusLabel(row) {
    const status = Number(row.status ?? 0);
    if (status === CONSIGN_CANCELED) {
        return '已取消';
    }
    if (status === CONSIGN_TRADED) {
        return row.settled_at ? '已成交' : '待结算';
    }
    if (status === CONSIGN_LISTED) {
        return '寄售中';
    }
    return '待确认';
}
export function mapConsignSourceType(row) {
    if (row.source_virtual_id) {
        return { value: '仓库调入', derived: true };
    }
    return { value: '仓库商品', derived: true };
}
export function sanitizeOrderItem(row) {
    if (!row.item_id || !row.product_id || !row.product_name) {
        return null;
    }
    return {
        id: toEntityId(row.item_id),
        productId: toEntityId(row.product_id),
        productName: row.product_name,
        productImg: row.product_img || '',
        skuText: formatSpecs(row.specs),
        specs: row.specs,
        quantity: Number(row.quantity ?? 0),
        unitPrice: toMoney(row.unit_price),
        originalUnitPrice: toMoney(row.original_unit_price),
        itemAmount: toMoney(row.item_amount),
        couponDiscount: toMoney(row.item_coupon_discount),
    };
}
export const adminOrdersSql = `
  SELECT
    o.id,
    o.order_sn,
    o.user_id,
    o.type,
    o.guess_id,
    g.title AS guess_title,
    o.amount,
    o.original_amount,
    o.coupon_discount,
    o.status,
    o.created_at,
    u.uid_code,
    u.phone_number AS user_phone_number,
    up.name AS user_name,
    up.avatar_url AS user_avatar_url,
    a.id AS address_id,
    a.name AS address_name,
    a.phone_number AS address_phone_number,
    a.province,
    a.city,
    a.district,
    a.detail,
    oi.id AS item_id,
    oi.product_id,
    COALESCE(p.name, bp.name) AS product_name,
    COALESCE(p.image_url, bp.default_img) AS product_img,
    oi.specs,
    oi.quantity,
    oi.unit_price,
    oi.original_unit_price,
    oi.item_amount,
    oi.coupon_discount AS item_coupon_discount,
    fo.id AS fulfillment_id,
    fo.fulfillment_sn,
    fo.type AS fulfillment_type,
    fo.status AS fulfillment_status,
    fo.receiver_name,
    fo.phone_number AS receiver_phone_number,
    fo.detail_address,
    fo.shipping_type,
    fo.shipping_fee,
    fo.total_amount,
    fo.tracking_no,
    fo.shipped_at,
    fo.completed_at,
    fo.created_at AS fulfillment_created_at,
    rf.id AS refund_id,
    rf.refund_no,
    rf.status AS refund_status,
    rf.refund_amount,
    rf.reason AS refund_reason,
    rf.review_note AS refund_review_note,
    rf.requested_at AS refund_requested_at,
    rf.reviewed_at AS refund_reviewed_at,
    rf.completed_at AS refund_completed_at
  FROM \`order\` o
  LEFT JOIN guess g ON g.id = o.guess_id
  LEFT JOIN user u ON u.id = o.user_id
  LEFT JOIN user_profile up ON up.user_id = o.user_id
  LEFT JOIN address a ON a.id = o.address_id
  LEFT JOIN order_item oi ON oi.order_id = o.id
  LEFT JOIN product p ON p.id = oi.product_id
  LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
  LEFT JOIN (
    SELECT current_fo.*
    FROM fulfillment_order current_fo
    INNER JOIN (
      SELECT order_id, MAX(id) AS max_id
      FROM fulfillment_order
      WHERE order_id IS NOT NULL
      GROUP BY order_id
    ) latest_fo ON latest_fo.max_id = current_fo.id
  ) fo ON fo.order_id = o.id
  LEFT JOIN (
    SELECT current_rf.*
    FROM order_refund current_rf
    INNER JOIN (
      SELECT order_id, MAX(id) AS max_id
      FROM order_refund
      GROUP BY order_id
    ) latest_rf ON latest_rf.max_id = current_rf.id
  ) rf ON rf.order_id = o.id
  ORDER BY o.created_at DESC, oi.created_at ASC, oi.id ASC
`;
export function toEntityStringId(value) {
    return String(toEntityId(value));
}
export function toOptionalEntityStringId(value) {
    return value == null ? null : String(toOptionalEntityId(value));
}
