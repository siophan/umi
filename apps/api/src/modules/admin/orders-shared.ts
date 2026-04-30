import { toEntityId, toOptionalEntityId, type OrderItem, type OrderSummary } from '@umi/shared';

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

export type NullableDate = Date | string | null;

export type AdminOrderQueryRow = {
  id: number | string;
  order_sn: string | null;
  user_id: number | string;
  type: number | string | null;
  guess_id: number | string | null;
  guess_title: string | null;
  amount: number | string | null;
  original_amount: number | string | null;
  coupon_discount: number | string | null;
  status: number | string;
  created_at: Date | string;
  uid_code: string | null;
  user_phone_number: string | null;
  user_name: string | null;
  user_avatar_url: string | null;
  address_id: number | string | null;
  address_name: string | null;
  address_phone_number: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  detail: string | null;
  item_id: number | string | null;
  product_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  specs: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  original_unit_price: number | string | null;
  item_amount: number | string | null;
  item_coupon_discount: number | string | null;
  fulfillment_id: number | string | null;
  fulfillment_sn: string | null;
  fulfillment_type: number | string | null;
  fulfillment_status: number | string | null;
  receiver_name: string | null;
  receiver_phone_number: string | null;
  detail_address: string | null;
  shipping_type: number | string | null;
  shipping_fee: number | string | null;
  total_amount: number | string | null;
  tracking_no: string | null;
  shipped_at: NullableDate;
  completed_at: NullableDate;
  fulfillment_created_at: NullableDate;
  refund_id: number | string | null;
  refund_no: string | null;
  refund_status: number | string | null;
  refund_amount: number | string | null;
  refund_reason: string | null;
  refund_review_note: string | null;
  refund_requested_at: NullableDate;
  refund_reviewed_at: NullableDate;
  refund_completed_at: NullableDate;
};

export type AdminTransactionPaymentRow = {
  order_id: number | string;
  order_sn: string | null;
  user_id: number | string;
  user_name: string | null;
  order_type: number | string | null;
  amount: number | string | null;
  status: number | string;
  created_at: Date | string;
};

export type AdminTransactionRefundRow = {
  id: number | string;
  refund_no: string | null;
  order_id: number | string;
  order_sn: string | null;
  user_id: number | string;
  user_name: string | null;
  order_type: number | string | null;
  refund_amount: number | string | null;
  status: number | string;
  requested_at: NullableDate;
  reviewed_at: NullableDate;
  completed_at: NullableDate;
  created_at: Date | string;
};

export type AdminLogisticsQueryRow = {
  id: number | string;
  fulfillment_sn: string | null;
  type: number | string | null;
  status: number | string;
  user_id: number | string;
  order_id: number | string | null;
  order_sn: string | null;
  receiver_name: string | null;
  phone_number: string | null;
  shipping_type: number | string | null;
  shipping_fee: number | string | null;
  total_amount: number | string | null;
  tracking_no: string | null;
  created_at: Date | string;
  shipped_at: NullableDate;
  completed_at: NullableDate;
  product_summary: string | null;
};

export type AdminConsignQueryRow = {
  id: number | string;
  trade_no: string | null;
  physical_item_id: number | string | null;
  seller_user_id: number | string;
  seller_user_name: string | null;
  buyer_user_id: number | string | null;
  buyer_user_name: string | null;
  order_id: number | string | null;
  order_sn: string | null;
  status: number | string;
  settlement_status: number | string | null;
  sale_amount: number | string | null;
  commission_amount: number | string | null;
  seller_amount: number | string | null;
  consign_price: number | string | null;
  listed_at: NullableDate;
  traded_at: NullableDate;
  settled_at: NullableDate;
  canceled_at: NullableDate;
  cancel_reason: string | null;
  created_at: Date | string;
  product_name: string | null;
  product_img: string | null;
  source_virtual_id: number | string | null;
};

export interface AdminOrderItem extends OrderItem {
  specs: string | null;
  originalUnitPrice: number;
  couponDiscount: number;
}

export interface AdminOrderRecord extends OrderSummary {
  orderSn: string | null;
  orderTypeCode: number | null;
  user: {
    id: string;
    uidCode: string | null;
    phoneNumber: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  originalAmount: number;
  couponDiscount: number;
  address: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    detail: string | null;
  } | null;
  fulfillment: {
    id: string;
    fulfillmentSn: string | null;
    typeCode: number | null;
    statusCode: number | null;
    receiverName: string | null;
    phoneNumber: string | null;
    detailAddress: string | null;
    shippingType: 'express' | 'same_city' | 'self_pickup' | 'unknown';
    shippingFee: number;
    totalAmount: number;
    trackingNo: string | null;
    shippedAt: string | null;
    completedAt: string | null;
    createdAt: string | null;
  } | null;
  refund: {
    id: string;
    refundNo: string | null;
    statusCode: number | null;
    refundAmount: number;
    reason: string | null;
    reviewNote: string | null;
    requestedAt: string | null;
    reviewedAt: string | null;
    completedAt: string | null;
  } | null;
  items: AdminOrderItem[];
}

export interface AdminTransactionRow {
  id: string;
  orderId: string;
  orderSn: string | null;
  userId: string;
  userName: string | null;
  channel: string;
  channelDerived: boolean;
  amount: number;
  direction: 'payment' | 'refund';
  statusLabel: string;
  statusCode: number | null;
  sourceTable: 'order' | 'order_refund';
  createdAt: string;
}

export interface AdminLogisticsRow {
  id: string;
  fulfillmentSn: string | null;
  orderId: string | null;
  orderSn: string | null;
  userId: string;
  receiver: string | null;
  phoneNumber: string | null;
  carrier: string;
  carrierDerived: boolean;
  trackingNo: string | null;
  shippingType: 'express' | 'same_city' | 'self_pickup' | 'unknown';
  shippingTypeLabel: string;
  shippingFee: number;
  totalAmount: number;
  status: 'stored' | 'shipping' | 'completed' | 'cancelled';
  statusLabel: string;
  productSummary: string;
  createdAt: string;
  shippedAt: string | null;
  completedAt: string | null;
}

export interface AdminConsignRow {
  id: string;
  tradeNo: string | null;
  physicalItemId: string | null;
  productName: string;
  productImg: string | null;
  userId: string;
  userName: string | null;
  buyerUserId: string | null;
  buyerUserName: string | null;
  orderId: string | null;
  orderSn: string | null;
  price: number;
  listingPrice: number | null;
  commissionAmount: number;
  commissionRate: number | null;
  sellerAmount: number;
  statusCode: number;
  settlementStatusCode: number | null;
  statusLabel: string;
  sourceType: string;
  sourceTypeDerived: boolean;
  createdAt: string;
  listedAt: string | null;
  tradedAt: string | null;
  settledAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
}

export interface AdminConsignListResult {
  items: AdminConsignRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<string, number>;
}

type ShippingType = AdminLogisticsRow['shippingType'];

export function toMoney(value: number | string | null | undefined) {
  return Number(value ?? 0) / 100;
}

export function toNullableIso(value: NullableDate) {
  return value ? new Date(value).toISOString() : null;
}

export function toOrderTypeLabel(code: number | null, guessId: string | null) {
  if (code === ORDER_TYPE_GUESS_REWARD || guessId) {
    return 'guess_reward';
  }
  if (code === ORDER_TYPE_SHOP) {
    return 'shop_order';
  }
  return null;
}

export function toShippingType(code: number | string | null): ShippingType {
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

export function toShippingTypeLabel(type: AdminLogisticsRow['shippingType']) {
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

export function inferCarrier(
  shippingType: AdminLogisticsRow['shippingType'],
  trackingNo: string | null,
) {
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

function formatSpecs(specs: string | null) {
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
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter(Boolean)
        .join(' / ');
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([key, value]) => `${key}:${String(value)}`)
        .join(' / ');
    }
  } catch {}

  return raw;
}

export function mapAdminOrderStatus(
  orderStatus: number,
  fulfillmentStatus?: number | null,
  refundStatus?: number | null,
): OrderSummary['status'] {
  if (
    refundStatus === REFUND_PENDING ||
    refundStatus === REFUND_REVIEWING ||
    refundStatus === REFUND_APPROVED
  ) {
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

export function mapPaymentStatusLabel(orderStatus: number) {
  if (orderStatus === ORDER_REFUNDED) {
    return '已退款';
  }
  return '已入账';
}

export function mapRefundStatusLabel(refundStatus: number) {
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

export function mapLogisticsStatus(
  code: number,
): Pick<AdminLogisticsRow, 'status' | 'statusLabel'> {
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

export function mapConsignStatusLabel(row: AdminConsignQueryRow) {
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

export function mapConsignSourceType(row: AdminConsignQueryRow) {
  if (row.source_virtual_id) {
    return { value: '仓库调入', derived: true };
  }
  return { value: '仓库商品', derived: true };
}

export function sanitizeOrderItem(row: AdminOrderQueryRow): AdminOrderItem | null {
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
    bp.name AS product_name,
    bp.default_img AS product_img,
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

export function toEntityStringId(value: number | string) {
  return String(toEntityId(value));
}

export function toOptionalEntityStringId(value: number | string | null | undefined) {
  return value == null ? null : String(toOptionalEntityId(value));
}
