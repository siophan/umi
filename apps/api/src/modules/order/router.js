import { Router } from 'express';
import { toEntityId, toOptionalEntityId } from '@umi/shared';
import { getRequestUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';
import { requireAdmin } from '../admin/auth';
export const orderRouter = Router();
const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_CLOSED = 40;
const ORDER_REFUNDED = 90;
const FULFILLMENT_PENDING = 10;
const FULFILLMENT_PROCESSING = 20;
const FULFILLMENT_SHIPPED = 30;
const FULFILLMENT_COMPLETED = 40;
const FULFILLMENT_CANCELED = 90;
function mapOrderStatus(orderStatus, fulfillmentStatus) {
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
function mapOrderType(row) {
    if (row.guess_id) {
        return 'guess';
    }
    return 'shop';
}
function sanitizeOrderItem(row) {
    if (!row.item_id || !row.product_id || !row.product_name) {
        return null;
    }
    return {
        id: toEntityId(row.item_id),
        productId: toEntityId(row.product_id),
        productName: row.product_name,
        productImg: row.product_img || '',
        skuText: null,
        quantity: Number(row.quantity ?? 0),
        unitPrice: Number(row.unit_price ?? 0) / 100,
        itemAmount: Number(row.item_amount ?? 0) / 100,
    };
}
function mapOrderRows(rows) {
    const orderMap = new Map();
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
                amount: Number(row.amount ?? 0) / 100,
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
const orderListSql = `
  SELECT
    o.id,
    o.user_id,
    o.type,
    o.guess_id,
    g.title AS guess_title,
    o.amount,
    o.status,
    o.created_at,
    oi.id AS item_id,
    oi.product_id,
    COALESCE(p.name, bp.name) AS product_name,
    COALESCE(p.image_url, bp.default_img) AS product_img,
    oi.quantity,
    oi.unit_price,
    oi.item_amount,
    fo.status AS fulfillment_status
  FROM \`order\` o
  LEFT JOIN guess g ON g.id = o.guess_id
  LEFT JOIN order_item oi ON oi.order_id = o.id
  LEFT JOIN product p ON p.id = oi.product_id
  LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
  LEFT JOIN (
    SELECT current_fo.order_id, current_fo.status
    FROM fulfillment_order current_fo
    INNER JOIN (
      SELECT order_id, MAX(id) AS max_id
      FROM fulfillment_order
      WHERE order_id IS NOT NULL
      GROUP BY order_id
    ) latest_fo ON latest_fo.max_id = current_fo.id
  ) fo ON fo.order_id = o.id
`;
orderRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [rows] = await db.execute(`
        ${orderListSql}
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, oi.created_at ASC, oi.id ASC
      `, [user.id]);
    ok(response, { items: mapOrderRows(rows) });
}));
orderRouter.get('/admin/stats/overview', requireAdmin, asyncHandler(async (_request, response) => {
    const db = getDbPool();
    const [rows] = await db.execute(`
        SELECT
          COUNT(*) AS total_orders,
          SUM(CASE WHEN status IN (?, ?, ?) THEN 1 ELSE 0 END) AS paid_orders
        FROM \`order\`
      `, [ORDER_PAID, ORDER_FULFILLED, ORDER_REFUNDED]);
    const row = rows[0];
    ok(response, {
        totalOrders: Number(row?.total_orders ?? 0),
        paidOrders: Number(row?.paid_orders ?? 0),
    });
}));
orderRouter.get('/:id', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [rows] = await db.execute(`
        ${orderListSql}
        WHERE o.user_id = ?
          AND o.id = ?
        ORDER BY oi.created_at ASC, oi.id ASC
      `, [user.id, request.params.id]);
    const items = mapOrderRows(rows);
    const order = items[0];
    if (!order) {
        throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
    }
    ok(response, order);
}));
