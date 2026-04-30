import type { CouponListItem, OrderDetailResult, OrderItem, OrderSummary, UserAddressItem } from '@umi/shared';
import { toEntityId, toOptionalEntityId } from '@umi/shared';

export const ORDER_PENDING = 10;
export const ORDER_PAID = 20;
export const ORDER_FULFILLED = 30;
export const ORDER_CLOSED = 40;
export const ORDER_REFUNDED = 90;

export const ORDER_TYPE_SHOP = 20;

export const OPERATOR_ROLE_USER = 10;
export const OPERATOR_ROLE_ADMIN = 20;
export const OPERATOR_ROLE_SYSTEM = 30;

export const FULFILLMENT_PENDING = 10;
export const FULFILLMENT_PROCESSING = 20;
export const FULFILLMENT_SHIPPED = 30;
export const FULFILLMENT_COMPLETED = 40;
export const FULFILLMENT_CANCELED = 90;
export const FULFILLMENT_TYPE_SHIP = 10;

export const COUPON_STATUS_UNUSED = 10;
export const COUPON_STATUS_LOCKED = 20;
export const COUPON_STATUS_USED = 30;
export const COUPON_STATUS_EXPIRED = 90;

export const COUPON_TYPE_CASH = 10;
export const COUPON_TYPE_DISCOUNT = 20;
export const COUPON_TYPE_SHIPPING = 30;

export type OrderRow = {
  id: number | string;
  order_sn?: string | null;
  user_id: number | string;
  type: number | string | null;
  guess_id: number | string | null;
  guess_title: string | null;
  amount: number | string | null;
  original_amount?: number | string | null;
  coupon_discount?: number | string | null;
  status: number | string;
  created_at: Date | string;
  item_id: number | string | null;
  product_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  item_amount: number | string | null;
  item_specs?: string | null;
  fulfillment_status: number | string | null;
  address_id?: number | string | null;
  address_name?: string | null;
  address_phone_number?: string | null;
  address_province?: string | null;
  address_city?: string | null;
  address_district?: string | null;
  address_detail?: string | null;
  address_tag?: string | null;
  address_is_default?: number | string | boolean | null;
  coupon_id?: number | string | null;
  coupon_no?: string | null;
  coupon_name?: string | null;
  coupon_amount?: number | string | null;
  coupon_type?: number | string | null;
  coupon_condition?: string | null;
  coupon_expire_at?: Date | string | null;
  coupon_source_type?: number | string | null;
  coupon_status?: number | string | null;
  fulfillment_id?: number | string | null;
  fulfillment_receiver_name?: string | null;
  fulfillment_phone_number?: string | null;
  fulfillment_province?: string | null;
  fulfillment_city?: string | null;
  fulfillment_district?: string | null;
  fulfillment_detail_address?: string | null;
  fulfillment_shipping_type?: number | string | null;
  fulfillment_shipping_fee?: number | string | null;
  fulfillment_tracking_no?: string | null;
  fulfillment_shipped_at?: Date | string | null;
  fulfillment_completed_at?: Date | string | null;
};

export type OrderLogRow = {
  id: number | string;
  from_status: number | string | null;
  to_status: number | string | null;
  note: string | null;
  created_at: Date | string;
};

export type ProductPurchaseRow = {
  product_id: number | string;
  shop_id: number | string | null;
  price: number | string | null;
  original_price: number | string | null;
  stock: number | string | null;
  product_status: number | string | null;
};

export type CartPurchaseRow = ProductPurchaseRow & {
  cart_item_id: number | string;
  quantity: number | string | null;
  specs: string | null;
};

export type AddressRow = {
  id: number | string;
  user_id: number | string;
  name: string | null;
  phone_number: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  detail: string | null;
  tag: string | null;
  is_default: number | string | boolean | null;
};

export type CouponRow = {
  id: number | string;
  coupon_no: string | null;
  name: string | null;
  amount: number | string | null;
  type: number | string | null;
  condition: string | null;
  expire_at: Date | string | null;
  source_type: number | string | null;
  status: number | string | null;
};

export function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function toMoney(value: number | string | null | undefined) {
  return Number(value ?? 0) / 100;
}

function mapCouponType(type: number): CouponListItem['type'] {
  if (type === COUPON_TYPE_DISCOUNT) {
    return 'percent';
  }
  if (type === COUPON_TYPE_SHIPPING) {
    return 'shipping';
  }
  return 'amount';
}

function mapCouponStatus(status: number, expireAt: Date | string | null): CouponListItem['status'] {
  const expired = expireAt ? new Date(expireAt).getTime() < Date.now() : false;
  if (status === COUPON_STATUS_USED) {
    return 'used';
  }
  if (status === COUPON_STATUS_LOCKED) {
    return 'locked';
  }
  if (status === COUPON_STATUS_EXPIRED || expired) {
    return 'expired';
  }
  return 'unused';
}

function mapCouponSource(sourceType: number) {
  if (sourceType === 10) {
    return '后台发放';
  }
  if (sourceType === 20) {
    return '活动奖励';
  }
  if (sourceType === 30) {
    return '补偿发放';
  }
  return '系统发放';
}

export function sanitizeCoupon(row: CouponRow): CouponListItem {
  const sourceType = Number(row.source_type ?? 0);
  const type = mapCouponType(Number(row.type ?? 0));
  // cash / shipping 在 DB 存"分"→ 转元；percent 存 0-100 折扣百分制保持不变。
  const amount = type === 'percent' ? Number(row.amount ?? 0) : toMoney(row.amount);
  return {
    id: toEntityId(row.id),
    couponNo: row.coupon_no || '',
    name: row.name || '优惠券',
    amount,
    type,
    condition: row.condition || '',
    expireAt: toIso(row.expire_at),
    status: mapCouponStatus(Number(row.status ?? 0), row.expire_at),
    sourceType,
    source: mapCouponSource(sourceType),
  };
}

export function sanitizeAddress(row: AddressRow): UserAddressItem {
  return {
    id: toEntityId(row.id),
    name: row.name || '',
    phone: row.phone_number || '',
    province: row.province || '',
    city: row.city || '',
    district: row.district || '',
    detail: row.detail || '',
    tag: row.tag?.trim() || null,
    isDefault: Boolean(row.is_default),
  };
}

export function mapOrderStatus(orderStatus: number, fulfillmentStatus?: number | null): OrderSummary['status'] {
  if (orderStatus === ORDER_REFUNDED) {
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
    if (fulfillmentStatus === FULFILLMENT_PENDING || fulfillmentStatus === FULFILLMENT_PROCESSING) {
      return 'paid';
    }
    return 'paid';
  }

  return 'pending';
}

function mapFulfillmentStatus(
  status: number | null | undefined,
): NonNullable<OrderDetailResult['fulfillment']>['status'] {
  if (status === FULFILLMENT_PROCESSING) {
    return 'processing';
  }
  if (status === FULFILLMENT_SHIPPED) {
    return 'shipping';
  }
  if (status === FULFILLMENT_COMPLETED) {
    return 'completed';
  }
  if (status === FULFILLMENT_CANCELED) {
    return 'cancelled';
  }
  return 'pending';
}

function mapOrderType(row: OrderRow) {
  if (row.guess_id) {
    return 'guess';
  }
  return 'shop';
}

function mapStatusLabel(status: number | string | null | undefined) {
  const value = Number(status ?? 0);
  if (value === ORDER_PENDING) return '待支付';
  if (value === ORDER_PAID) return '已支付';
  if (value === ORDER_FULFILLED) return '已完成';
  if (value === ORDER_CLOSED) return '已关闭';
  if (value === ORDER_REFUNDED) return '已退款';
  if (value === FULFILLMENT_PENDING) return '待发货';
  if (value === FULFILLMENT_PROCESSING) return '处理中';
  if (value === FULFILLMENT_SHIPPED) return '已发货';
  if (value === FULFILLMENT_COMPLETED) return '已签收';
  if (value === FULFILLMENT_CANCELED) return '已取消';
  return '状态更新';
}

function sanitizeOrderItem(row: OrderRow): OrderItem | null {
  if (!row.item_id || !row.product_id || !row.product_name) {
    return null;
  }

  return {
    id: toEntityId(row.item_id),
    productId: toEntityId(row.product_id),
    productName: row.product_name,
    productImg: row.product_img || '',
    skuText: row.item_specs?.trim() || null,
    quantity: Number(row.quantity ?? 0),
    unitPrice: toMoney(row.unit_price),
    itemAmount: toMoney(row.item_amount),
  };
}

export function mapOrderRows(rows: OrderRow[]): OrderSummary[] {
  const orderMap = new Map<string, OrderSummary>();

  for (const row of rows) {
    const id = toEntityId(row.id);
    let order = orderMap.get(id);

    if (!order) {
      order = {
        id,
        userId: toEntityId(row.user_id),
        orderType: mapOrderType(row),
        guessId: toOptionalEntityId(row.guess_id),
        guessTitle: row.guess_title || null,
        amount: toMoney(row.amount),
        status: mapOrderStatus(Number(row.status ?? 0), row.fulfillment_status === null ? null : Number(row.fulfillment_status)),
        createdAt: new Date(row.created_at).toISOString(),
        items: [],
      };
      orderMap.set(id, order);
    }

    const item = sanitizeOrderItem(row);
    if (item) {
      order.items.push(item);
    }
  }

  return Array.from(orderMap.values());
}

export function mapOrderDetail(rows: OrderRow[], logs: OrderLogRow[]): OrderDetailResult | null {
  const summary = mapOrderRows(rows)[0];
  const row = rows[0];
  if (!summary || !row) {
    return null;
  }

  const address = row.address_id
    ? sanitizeAddress({
        id: row.address_id,
        user_id: row.user_id,
        name: row.address_name ?? row.fulfillment_receiver_name ?? null,
        phone_number: row.address_phone_number ?? row.fulfillment_phone_number ?? null,
        province: row.address_province ?? row.fulfillment_province ?? null,
        city: row.address_city ?? row.fulfillment_city ?? null,
        district: row.address_district ?? row.fulfillment_district ?? null,
        detail: row.address_detail ?? row.fulfillment_detail_address ?? null,
        tag: row.address_tag ?? null,
        is_default: row.address_is_default ?? 0,
      })
    : null;

  const coupon = row.coupon_id
    ? sanitizeCoupon({
        id: row.coupon_id,
        coupon_no: row.coupon_no || null,
        name: row.coupon_name || null,
        amount: row.coupon_amount ?? 0,
        type: row.coupon_type ?? 0,
        condition: row.coupon_condition || null,
        expire_at: row.coupon_expire_at || null,
        source_type: row.coupon_source_type ?? 0,
        status: row.coupon_status ?? 0,
      })
    : null;

  const fulfillment = row.fulfillment_id
    ? {
        id: toEntityId(row.fulfillment_id),
        status: mapFulfillmentStatus(Number(row.fulfillment_status ?? FULFILLMENT_PENDING)),
        receiverName: row.fulfillment_receiver_name || row.address_name || '',
        phoneNumber: row.fulfillment_phone_number || row.address_phone_number || '',
        province: row.fulfillment_province || row.address_province || '',
        city: row.fulfillment_city || row.address_city || '',
        district: row.fulfillment_district || row.address_district || '',
        detailAddress: row.fulfillment_detail_address || row.address_detail || '',
        shippingType: row.fulfillment_shipping_type === null ? null : Number(row.fulfillment_shipping_type),
        shippingFee: toMoney(row.fulfillment_shipping_fee),
        trackingNo: row.fulfillment_tracking_no || null,
        shippedAt: toIso(row.fulfillment_shipped_at),
        completedAt: toIso(row.fulfillment_completed_at),
      }
    : null;

  const statusLogs = logs.length
    ? logs.map((log) => ({
        id: toEntityId(log.id),
        status: mapStatusLabel(log.to_status),
        note: log.note,
        createdAt: new Date(log.created_at).toISOString(),
      }))
    : [{ id: toEntityId('1'), status: '订单创建', note: null, createdAt: summary.createdAt }];

  return {
    ...summary,
    orderSn: row.order_sn || summary.id,
    originalAmount: toMoney(row.original_amount),
    couponDiscount: toMoney(row.coupon_discount),
    address,
    coupon,
    fulfillment,
    logs: statusLogs,
  };
}

export const orderListSql = `
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
    oi.id AS item_id,
    oi.product_id,
    bp.name AS product_name,
    bp.default_img AS product_img,
    oi.quantity,
    oi.unit_price,
    oi.item_amount,
    oi.specs AS item_specs,
    fo.status AS fulfillment_status,
    a.id AS address_id,
    a.name AS address_name,
    a.phone_number AS address_phone_number,
    a.province AS address_province,
    a.city AS address_city,
    a.district AS address_district,
    a.detail AS address_detail,
    a.tag AS address_tag,
    a.is_default AS address_is_default,
    c.id AS coupon_id,
    c.coupon_no,
    c.name AS coupon_name,
    c.amount AS coupon_amount,
    c.type AS coupon_type,
    c.condition AS coupon_condition,
    c.expire_at AS coupon_expire_at,
    c.source_type AS coupon_source_type,
    c.status AS coupon_status,
    fo.id AS fulfillment_id,
    fo.receiver_name AS fulfillment_receiver_name,
    fo.phone_number AS fulfillment_phone_number,
    fo.province AS fulfillment_province,
    fo.city AS fulfillment_city,
    fo.district AS fulfillment_district,
    fo.detail_address AS fulfillment_detail_address,
    fo.shipping_type AS fulfillment_shipping_type,
    fo.shipping_fee AS fulfillment_shipping_fee,
    fo.tracking_no AS fulfillment_tracking_no,
    fo.shipped_at AS fulfillment_shipped_at,
    fo.completed_at AS fulfillment_completed_at
  FROM \`order\` o
  LEFT JOIN guess g ON g.id = o.guess_id
  LEFT JOIN order_item oi ON oi.order_id = o.id
  LEFT JOIN product p ON p.id = oi.product_id
  LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
  LEFT JOIN address a ON a.id = o.address_id
  LEFT JOIN coupon c ON c.id = o.coupon_id
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
`;

export function parseCouponCondition(condition: string | null) {
  const value = condition || '';
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Math.round(Number(match[1]) * 100) : 0;
}

export function buildOrderSn() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OD${stamp}${rand}`;
}

