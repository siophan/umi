import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';

import type {
  CouponListItem,
  ConfirmOrderResult,
  CreateOrderPayload,
  CreateOrderResult,
  OrderDetailResult,
  OrderItem,
  OrderSummary,
  UserAddressItem,
} from '@umi/shared';
import { toEntityId, toOptionalEntityId } from '@umi/shared';

import { getRequestUser, requireUser } from '../../lib/auth';
import { getDbPool } from '../../lib/db';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { requireAdmin } from '../admin/auth';

export const orderRouter: ExpressRouter = Router();

const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_CLOSED = 40;
const ORDER_REFUNDED = 90;

const ORDER_TYPE_SHOP = 20;

const FULFILLMENT_PENDING = 10;
const FULFILLMENT_PROCESSING = 20;
const FULFILLMENT_SHIPPED = 30;
const FULFILLMENT_COMPLETED = 40;
const FULFILLMENT_CANCELED = 90;
const FULFILLMENT_TYPE_SHIP = 10;

const COUPON_STATUS_UNUSED = 10;
const COUPON_STATUS_LOCKED = 20;
const COUPON_STATUS_USED = 30;
const COUPON_STATUS_EXPIRED = 90;

const COUPON_TYPE_CASH = 10;
const COUPON_TYPE_DISCOUNT = 20;
const COUPON_TYPE_SHIPPING = 30;

type OrderRow = {
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

type OrderLogRow = {
  id: number | string;
  from_status: number | string | null;
  to_status: number | string | null;
  note: string | null;
  created_at: Date | string;
};

type ProductPurchaseRow = {
  product_id: number | string;
  shop_id: number | string | null;
  price: number | string | null;
  original_price: number | string | null;
  stock: number | string | null;
  product_status: number | string | null;
};

type CartPurchaseRow = ProductPurchaseRow & {
  cart_item_id: number | string;
  quantity: number | string | null;
  specs: string | null;
};

type AddressRow = {
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

type CouponRow = {
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

function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function toMoney(value: number | string | null | undefined) {
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

function sanitizeCoupon(row: CouponRow): CouponListItem {
  const sourceType = Number(row.source_type ?? 0);
  return {
    id: toEntityId(row.id),
    couponNo: row.coupon_no || '',
    name: row.name || '优惠券',
    amount: toMoney(row.amount),
    type: mapCouponType(Number(row.type ?? 0)),
    condition: row.condition || '',
    expireAt: toIso(row.expire_at),
    status: mapCouponStatus(Number(row.status ?? 0), row.expire_at),
    sourceType,
    source: mapCouponSource(sourceType),
  };
}

function sanitizeAddress(row: AddressRow): UserAddressItem {
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

function mapOrderStatus(orderStatus: number, fulfillmentStatus?: number | null): OrderSummary['status'] {
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
  if (value === ORDER_PENDING) {
    return '待支付';
  }
  if (value === ORDER_PAID) {
    return '已支付';
  }
  if (value === ORDER_FULFILLED) {
    return '已完成';
  }
  if (value === ORDER_CLOSED) {
    return '已关闭';
  }
  if (value === ORDER_REFUNDED) {
    return '已退款';
  }
  if (value === FULFILLMENT_PENDING) {
    return '待发货';
  }
  if (value === FULFILLMENT_PROCESSING) {
    return '处理中';
  }
  if (value === FULFILLMENT_SHIPPED) {
    return '已发货';
  }
  if (value === FULFILLMENT_COMPLETED) {
    return '已签收';
  }
  if (value === FULFILLMENT_CANCELED) {
    return '已取消';
  }
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

function mapOrderRows(rows: OrderRow[]): OrderSummary[] {
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

function mapOrderDetail(rows: OrderRow[], logs: OrderLogRow[]): OrderDetailResult | null {
  const summary = mapOrderRows(rows)[0];
  const row = rows[0];
  if (!summary || !row) {
    return null;
  }

  const address = row.address_id
    ? sanitizeAddress({
        id: row.address_id,
        user_id: row.user_id,
        name: row.address_name || row.fulfillment_receiver_name || null,
        phone_number: row.address_phone_number || row.fulfillment_phone_number || null,
        province: row.address_province || row.fulfillment_province || null,
        city: row.address_city || row.fulfillment_city || null,
        district: row.address_district || row.fulfillment_district || null,
        detail: row.address_detail || row.fulfillment_detail_address || null,
        tag: row.address_tag || null,
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
    : [
        {
          id: toEntityId(`1`),
          status: '订单创建',
          note: null,
          createdAt: summary.createdAt,
        },
      ];

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

const orderListSql = `
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
    COALESCE(p.name, bp.name) AS product_name,
    COALESCE(p.image_url, bp.default_img) AS product_img,
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

function parseCouponCondition(condition: string | null) {
  const value = condition || '';
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Math.round(Number(match[1]) * 100) : 0;
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
  if (type === COUPON_TYPE_CASH || type === COUPON_TYPE_SHIPPING) {
    discountCents = Math.min(originalAmountCents, Number(row.amount ?? 0));
  } else if (type === COUPON_TYPE_DISCOUNT) {
    const discountRate = Math.max(0, Math.min(100, Number(row.amount ?? 0)));
    discountCents = Math.round((originalAmountCents * (100 - discountRate)) / 100);
  }

  return { couponRow: row, discountCents };
}

function buildOrderSn() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `OD${stamp}${rand}`;
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

async function createOrder(userId: string, payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const address = await getAddressForUser(connection, userId, String(payload.addressId));
    const purchaseItems = payload.source === 'cart'
      ? await getCartPurchaseRows(connection, userId, payload)
      : await getProductPurchaseRows(connection, payload);

    const originalAmountCents = purchaseItems.reduce(
      (sum, item) => sum + Number(item.row.price ?? 0) * item.quantity,
      0,
    );
    const { couponRow, discountCents } = await getAvailableCoupon(connection, userId, payload.couponId, originalAmountCents);
    const payableAmountCents = Math.max(0, originalAmountCents - discountCents);
    const orderSn = buildOrderSn();

    const [orderResult] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO \`order\` (
          order_sn, user_id, type, guess_id, amount, original_amount, coupon_id, coupon_discount, address_id, status, created_at, updated_at
        )
        VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        orderSn,
        userId,
        ORDER_TYPE_SHOP,
        payableAmountCents,
        originalAmountCents,
        couponRow ? couponRow.id : null,
        discountCents,
        payload.addressId,
        ORDER_PAID,
      ],
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
        [
          orderId,
          item.productId,
          item.specs || '',
          item.quantity,
          unitPrice,
          originalUnitPrice,
          itemAmount,
          itemDiscount,
        ],
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
      [orderId, ORDER_PENDING, ORDER_PAID, userId, 'user', payload.note?.trim() || '用户提交订单'],
    );

    await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO fulfillment_order (
          fulfillment_sn, type, status, user_id, order_id, shop_id, address_id, receiver_name, phone_number, province, city, district,
          detail_address, shipping_type, shipping_fee, total_amount, tracking_no, shipped_at, completed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        `FO${Date.now()}${Math.floor(Math.random() * 9000) + 1000}`,
        FULFILLMENT_TYPE_SHIP,
        FULFILLMENT_PENDING,
        userId,
        orderId,
        purchaseItems[0]?.row.shop_id ?? null,
        payload.addressId,
        address.name,
        address.phone_number,
        address.province,
        address.city,
        address.district,
        address.detail,
        FULFILLMENT_TYPE_SHIP,
        0,
        payableAmountCents,
      ],
    );

    if (couponRow) {
      await connection.execute(
        `
          UPDATE coupon
          SET status = ?, used_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
            AND user_id = ?
        `,
        [COUPON_STATUS_USED, couponRow.id, userId],
      );
    }

    if (payload.source === 'cart') {
      const cartItems = purchaseItems as unknown as Array<{ cartItemId: string }>;
      await connection.execute(
        `
          DELETE FROM cart_item
          WHERE user_id = ?
            AND id IN (${cartItems.map(() => '?').join(', ')})
        `,
        [userId, ...cartItems.map((item) => item.cartItemId)],
      );
    }

    await connection.commit();
    return { id: orderId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function confirmOrder(userId: string, orderId: string): Promise<ConfirmOrderResult> {
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
      [orderId, row.status ?? ORDER_PAID, ORDER_FULFILLED, userId, 'user', '用户确认收货'],
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

orderRouter.get(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        ${orderListSql}
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, oi.created_at ASC, oi.id ASC
      `,
      [user.id],
    );

    ok(response, { items: mapOrderRows(rows as OrderRow[]) });
  }),
);

orderRouter.post(
  '/',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_CREATE_FAILED',
      message: '创建订单失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await createOrder(user.id, request.body as CreateOrderPayload));
    },
  ),
);

orderRouter.get(
  '/admin/stats/overview',
  requireAdmin,
  asyncHandler(async (_request, response) => {
    const db = getDbPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          COUNT(*) AS total_orders,
          SUM(CASE WHEN status IN (?, ?, ?) THEN 1 ELSE 0 END) AS paid_orders
        FROM \`order\`
      `,
      [ORDER_PAID, ORDER_FULFILLED, ORDER_REFUNDED],
    );

    const row = rows[0] as
      | { total_orders?: number | string; paid_orders?: number | string }
      | undefined;
    ok(response, {
      totalOrders: Number(row?.total_orders ?? 0),
      paidOrders: Number(row?.paid_orders ?? 0),
    });
  }),
);

orderRouter.get(
  '/:id',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        ${orderListSql}
        WHERE o.user_id = ?
          AND o.id = ?
        ORDER BY oi.created_at ASC, oi.id ASC
      `,
      [user.id, request.params.id],
    );

    if (!(rows as OrderRow[]).length) {
      throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
    }

    const [logRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, from_status, to_status, note, created_at
        FROM order_status_log
        WHERE order_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [request.params.id],
    );

    const order = mapOrderDetail(rows as OrderRow[], logRows as OrderLogRow[]);
    if (!order) {
      throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
    }

    ok(response, order);
  }),
);

orderRouter.post(
  '/:id/confirm',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_CONFIRM_FAILED',
      message: '确认收货失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await confirmOrder(user.id, String(request.params.id)));
    },
  ),
);

orderRouter.post(
  '/:id/urge',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_URGE_FAILED',
      message: '催发货失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      const orderId = String(request.params.id);
      const db = getDbPool();
      const [rows] = await db.execute<mysql.RowDataPacket[]>(
        `SELECT id, status FROM \`order\` WHERE id = ? AND user_id = ? LIMIT 1`,
        [orderId, user.id],
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
        [orderId, row.status, row.status, user.id, 'user', '用户催发货'],
      );
      ok(response, { success: true as const });
    },
  ),
);

orderRouter.post(
  '/:id/review',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_REVIEW_FAILED',
      message: '提交评价失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      const orderId = String(request.params.id);
      const { productId, rating, content } = request.body as { productId: string; rating: number; content?: string };
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
        [productId, orderId, user.id, ORDER_FULFILLED],
      );
      if (!(rows as mysql.RowDataPacket[]).length) {
        throw new HttpError(403, 'REVIEW_NOT_ALLOWED', '只能评价已完成订单中的商品');
      }
      await db.execute(
        `INSERT INTO product_review (order_id, user_id, product_id, rating, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), content = VALUES(content), updated_at = CURRENT_TIMESTAMP(3)`,
        [orderId, user.id, productId, ratingNum, content?.trim() || null],
      );
      ok(response, { success: true as const });
    },
  ),
);
