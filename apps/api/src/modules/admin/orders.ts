import type mysql from 'mysql2/promise';

import { toEntityId, toOptionalEntityId, type OrderItem, type OrderSummary } from '@umi/shared';

import { getDbPool } from '../../lib/db';

const ORDER_TYPE_GUESS_REWARD = 10;
const ORDER_TYPE_SHOP = 20;

const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_CLOSED = 40;
const ORDER_REFUNDED = 90;

const REFUND_PENDING = 10;
const REFUND_REVIEWING = 20;
const REFUND_APPROVED = 30;
const REFUND_REJECTED = 40;
const REFUND_COMPLETED = 90;

const FULFILLMENT_PENDING = 10;
const FULFILLMENT_PROCESSING = 20;
const FULFILLMENT_SHIPPED = 30;
const FULFILLMENT_COMPLETED = 40;
const FULFILLMENT_CANCELED = 90;

const SHIPPING_EXPRESS = 10;
const SHIPPING_SAME_CITY = 20;
const SHIPPING_SELF_PICKUP = 30;

const CONSIGN_LISTED = 10;
const CONSIGN_TRADED = 20;
const CONSIGN_CANCELED = 30;

type NullableDate = Date | string | null;

type AdminOrderQueryRow = {
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
  refund_requested_at: NullableDate;
  refund_completed_at: NullableDate;
};

type AdminTransactionPaymentRow = {
  order_id: number | string;
  order_sn: string | null;
  user_id: number | string;
  user_name: string | null;
  order_type: number | string | null;
  amount: number | string | null;
  status: number | string;
  created_at: Date | string;
};

type AdminTransactionRefundRow = {
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

type AdminLogisticsQueryRow = {
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

type AdminConsignQueryRow = {
  id: number | string;
  trade_no: string | null;
  physical_item_id: number | string | null;
  seller_user_id: number | string;
  buyer_user_id: number | string | null;
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
    requestedAt: string | null;
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
  buyerUserId: string | null;
  orderId: string | null;
  orderSn: string | null;
  price: number;
  listingPrice: number | null;
  commissionAmount: number;
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
}

type ShippingType = AdminLogisticsRow['shippingType'];

function toMoney(value: number | string | null | undefined) {
  return Number(value ?? 0) / 100;
}

function toNullableIso(value: NullableDate) {
  return value ? new Date(value).toISOString() : null;
}

function toOrderTypeLabel(code: number | null, guessId: string | null) {
  if (code === ORDER_TYPE_GUESS_REWARD || guessId) {
    return 'guess_reward';
  }
  if (code === ORDER_TYPE_SHOP) {
    return 'shop_order';
  }
  return null;
}

function toShippingType(code: number | string | null): ShippingType {
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

function toShippingTypeLabel(type: AdminLogisticsRow['shippingType']) {
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

function inferCarrier(
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

function mapAdminOrderStatus(
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

  if (orderStatus === ORDER_CLOSED || refundStatus === REFUND_REJECTED) {
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

function mapPaymentStatusLabel(orderStatus: number) {
  if (orderStatus === ORDER_PENDING) {
    return '待支付';
  }
  if (orderStatus === ORDER_CLOSED) {
    return '已关闭';
  }
  if (orderStatus === ORDER_REFUNDED) {
    return '退款链路';
  }
  return '已入账';
}

function mapRefundStatusLabel() {
  return '退款链路';
}

function mapLogisticsStatus(code: number): Pick<AdminLogisticsRow, 'status' | 'statusLabel'> {
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

function mapConsignStatusLabel(row: AdminConsignQueryRow) {
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

function mapConsignSourceType(row: AdminConsignQueryRow) {
  if (row.source_virtual_id) {
    return { value: '仓库调入', derived: true };
  }
  return { value: '仓库商品', derived: true };
}

function sanitizeOrderItem(row: AdminOrderQueryRow): AdminOrderItem | null {
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

const adminOrdersSql = `
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
    rf.requested_at AS refund_requested_at,
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

export async function getAdminOrders(): Promise<AdminOrderRecord[]> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(adminOrdersSql);
  const orderMap = new Map<string, AdminOrderRecord>();

  for (const row of rows as AdminOrderQueryRow[]) {
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
        orderType: toOrderTypeLabel(
          row.type == null ? null : Number(row.type),
          guessId,
        ),
        orderTypeCode: row.type == null ? null : Number(row.type),
        guessId,
        guessTitle: row.guess_title || null,
        amount: toMoney(row.amount),
        originalAmount: toMoney(row.original_amount),
        couponDiscount: toMoney(row.coupon_discount),
        status: mapAdminOrderStatus(
          Number(row.status ?? 0),
          row.fulfillment_status == null ? null : Number(row.fulfillment_status),
          row.refund_status == null ? null : Number(row.refund_status),
        ),
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
              typeCode:
                row.fulfillment_type == null ? null : Number(row.fulfillment_type),
              statusCode:
                row.fulfillment_status == null ? null : Number(row.fulfillment_status),
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
              requestedAt: toNullableIso(row.refund_requested_at),
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

export async function getAdminTransactions(): Promise<AdminTransactionRow[]> {
  const db = getDbPool();
  const [paymentRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        o.id AS order_id,
        o.order_sn,
        o.user_id,
        up.name AS user_name,
        o.type AS order_type,
        o.amount,
        o.status,
        o.created_at
      FROM \`order\` o
      LEFT JOIN user_profile up ON up.user_id = o.user_id
      ORDER BY o.created_at DESC, o.id DESC
    `,
  );
  const [refundRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        rf.id,
        rf.refund_no,
        rf.order_id,
        o.order_sn,
        rf.user_id,
        up.name AS user_name,
        o.type AS order_type,
        rf.refund_amount,
        rf.status,
        rf.requested_at,
        rf.reviewed_at,
        rf.completed_at,
        rf.created_at
      FROM order_refund rf
      INNER JOIN \`order\` o ON o.id = rf.order_id
      LEFT JOIN user_profile up ON up.user_id = rf.user_id
      ORDER BY COALESCE(rf.completed_at, rf.reviewed_at, rf.requested_at, rf.created_at) DESC, rf.id DESC
    `,
  );

  const payments = (paymentRows as AdminTransactionPaymentRow[]).map((row) => ({
    id: row.order_sn || `PAY-${String(row.order_id)}`,
    orderId: String(toEntityId(row.order_id)),
    orderSn: row.order_sn,
    userId: String(toEntityId(row.user_id)),
    userName: row.user_name,
    channel:
      Number(row.order_type ?? 0) === ORDER_TYPE_GUESS_REWARD
        ? '竞猜奖励'
        : '订单支付（渠道未建模）',
    channelDerived: Number(row.order_type ?? 0) !== ORDER_TYPE_GUESS_REWARD,
    amount: toMoney(row.amount),
    direction: 'payment' as const,
    statusLabel: mapPaymentStatusLabel(Number(row.status ?? 0)),
    statusCode: Number(row.status ?? 0),
    sourceTable: 'order' as const,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  const refunds = (refundRows as AdminTransactionRefundRow[]).map((row) => ({
    id: row.refund_no || `RF-${String(row.id)}`,
    orderId: String(toEntityId(row.order_id)),
    orderSn: row.order_sn,
    userId: String(toEntityId(row.user_id)),
    userName: row.user_name,
    channel:
      Number(row.order_type ?? 0) === ORDER_TYPE_GUESS_REWARD
        ? '竞猜奖励退款'
        : '订单退款',
    channelDerived: true,
    amount: -toMoney(row.refund_amount),
    direction: 'refund' as const,
    statusLabel: mapRefundStatusLabel(),
    statusCode: Number(row.status ?? 0),
    sourceTable: 'order_refund' as const,
    createdAt:
      toNullableIso(row.completed_at) ||
      toNullableIso(row.reviewed_at) ||
      toNullableIso(row.requested_at) ||
      new Date(row.created_at).toISOString(),
  }));

  return [...payments, ...refunds].sort((left, right) => {
    const timeDiff =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return right.id.localeCompare(left.id);
  });
}

export async function getAdminLogistics(): Promise<AdminLogisticsRow[]> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        fo.id,
        fo.fulfillment_sn,
        fo.type,
        fo.status,
        fo.user_id,
        fo.order_id,
        o.order_sn,
        fo.receiver_name,
        fo.phone_number,
        fo.shipping_type,
        fo.shipping_fee,
        fo.total_amount,
        fo.tracking_no,
        fo.created_at,
        fo.shipped_at,
        fo.completed_at,
        GROUP_CONCAT(DISTINCT COALESCE(p.name, bp.name) ORDER BY foi.id SEPARATOR ' / ') AS product_summary
      FROM fulfillment_order fo
      LEFT JOIN \`order\` o ON o.id = fo.order_id
      LEFT JOIN fulfillment_order_item foi ON foi.fulfillment_order_id = fo.id
      LEFT JOIN product p ON p.id = foi.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      GROUP BY
        fo.id,
        fo.fulfillment_sn,
        fo.type,
        fo.status,
        fo.user_id,
        fo.order_id,
        o.order_sn,
        fo.receiver_name,
        fo.phone_number,
        fo.shipping_type,
        fo.shipping_fee,
        fo.total_amount,
        fo.tracking_no,
        fo.created_at,
        fo.shipped_at,
        fo.completed_at
      ORDER BY COALESCE(fo.shipped_at, fo.created_at) DESC, fo.id DESC
    `,
  );

  return (rows as AdminLogisticsQueryRow[]).map((row) => {
    const shippingType = toShippingType(row.shipping_type);
    const { carrier, derived } = inferCarrier(shippingType, row.tracking_no);
    const status = mapLogisticsStatus(Number(row.status ?? 0));

    return {
      id: String(toEntityId(row.id)),
      fulfillmentSn: row.fulfillment_sn,
      orderId: row.order_id ? String(toEntityId(row.order_id)) : null,
      orderSn: row.order_sn,
      userId: String(toEntityId(row.user_id)),
      receiver: row.receiver_name,
      phoneNumber: row.phone_number,
      carrier,
      carrierDerived: derived,
      trackingNo: row.tracking_no,
      shippingType,
      shippingTypeLabel: toShippingTypeLabel(shippingType),
      shippingFee: toMoney(row.shipping_fee),
      totalAmount: toMoney(row.total_amount),
      status: status.status,
      statusLabel: status.statusLabel,
      productSummary: row.product_summary || '待补明细',
      createdAt: new Date(row.created_at).toISOString(),
      shippedAt: toNullableIso(row.shipped_at),
      completedAt: toNullableIso(row.completed_at),
    };
  });
}

export async function getAdminConsignRows(): Promise<AdminConsignRow[]> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ct.id,
        ct.trade_no,
        ct.physical_item_id,
        ct.seller_user_id,
        ct.buyer_user_id,
        ct.order_id,
        o.order_sn,
        ct.status,
        ct.settlement_status,
        ct.sale_amount,
        ct.commission_amount,
        ct.seller_amount,
        pw.consign_price,
        ct.listed_at,
        ct.traded_at,
        ct.settled_at,
        ct.canceled_at,
        ct.created_at,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        pw.source_virtual_id
      FROM consign_trade ct
      LEFT JOIN physical_warehouse pw ON pw.id = ct.physical_item_id
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN \`order\` o ON o.id = ct.order_id
      ORDER BY COALESCE(ct.traded_at, ct.canceled_at, ct.listed_at, ct.created_at) DESC, ct.id DESC
    `,
  );

  return (rows as AdminConsignQueryRow[]).map((row) => {
    const sourceType = mapConsignSourceType(row);
    return {
      id: String(toEntityId(row.id)),
      tradeNo: row.trade_no,
      physicalItemId: row.physical_item_id ? String(toEntityId(row.physical_item_id)) : null,
      productName: row.product_name || '未命名商品',
      productImg: row.product_img,
      userId: String(toEntityId(row.seller_user_id)),
      buyerUserId: row.buyer_user_id ? String(toEntityId(row.buyer_user_id)) : null,
      orderId: row.order_id ? String(toEntityId(row.order_id)) : null,
      orderSn: row.order_sn,
      price: toMoney(row.sale_amount ?? row.consign_price),
      listingPrice: row.consign_price == null ? null : toMoney(row.consign_price),
      commissionAmount: toMoney(row.commission_amount),
      sellerAmount: toMoney(row.seller_amount),
      statusCode: Number(row.status ?? 0),
      settlementStatusCode:
        row.settlement_status == null ? null : Number(row.settlement_status),
      statusLabel: mapConsignStatusLabel(row),
      sourceType: sourceType.value,
      sourceTypeDerived: sourceType.derived,
      createdAt: new Date(row.created_at).toISOString(),
      listedAt: toNullableIso(row.listed_at),
      tradedAt: toNullableIso(row.traded_at),
      settledAt: toNullableIso(row.settled_at),
      canceledAt: toNullableIso(row.canceled_at),
    };
  });
}
