import type mysql from 'mysql2/promise';
import type { OrderListResult, OrderListSummary, OrderListTab } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import {
  FULFILLMENT_CANCELED,
  FULFILLMENT_COMPLETED,
  FULFILLMENT_PENDING,
  FULFILLMENT_PROCESSING,
  FULFILLMENT_SHIPPED,
  ORDER_CLOSED,
  ORDER_FULFILLED,
  ORDER_PAID,
  ORDER_PENDING,
  ORDER_REFUNDED,
  orderListSql,
  toMoney,
  type OrderLogRow,
  type OrderRow,
  mapOrderDetail,
  mapOrderRows,
} from './order-shared';

const ORDERS_PAGE_SIZE = 20;

const latestFulfillmentJoin = `
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

function buildTabClause(tab: OrderListTab): string {
  if (tab === 'pending') {
    return `AND (o.status = ${ORDER_PENDING} OR (o.status = ${ORDER_PAID} AND (fo.status IS NULL OR fo.status IN (${FULFILLMENT_PENDING}, ${FULFILLMENT_PROCESSING}))))`;
  }
  if (tab === 'shipped') {
    return `AND o.status = ${ORDER_PAID} AND fo.status IN (${FULFILLMENT_SHIPPED}, ${FULFILLMENT_COMPLETED})`;
  }
  if (tab === 'done') {
    return `AND o.status = ${ORDER_FULFILLED}`;
  }
  if (tab === 'refund') {
    return `AND (o.status IN (${ORDER_CLOSED}, ${ORDER_REFUNDED}) OR (o.status = ${ORDER_PAID} AND fo.status = ${FULFILLMENT_CANCELED}))`;
  }
  return '';
}

export async function fetchUserOrders(
  userId: string,
  tab: OrderListTab,
  cursor: string | null,
): Promise<OrderListResult> {
  const db = getDbPool();
  const cursorDate = cursor ? new Date(cursor) : null;
  if (cursorDate && Number.isNaN(cursorDate.getTime())) {
    throw new HttpError(400, 'ORDER_CURSOR_INVALID', '游标格式错误');
  }

  const tabClause = buildTabClause(tab);

  const idParams: Array<string | Date | number> = [userId];
  if (cursorDate) idParams.push(cursorDate);
  idParams.push(ORDERS_PAGE_SIZE + 1);

  const [idRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT o.id, o.created_at
      FROM \`order\` o
      ${latestFulfillmentJoin}
      WHERE o.user_id = ?
        ${cursorDate ? 'AND o.created_at < ?' : ''}
        ${tabClause}
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ?
    `,
    idParams,
  );

  const summary = await fetchUserOrderSummary(userId);

  if (!idRows.length) {
    return { items: [], nextCursor: null, summary };
  }

  const hasMore = idRows.length > ORDERS_PAGE_SIZE;
  const pagedIdRows = hasMore ? idRows.slice(0, ORDERS_PAGE_SIZE) : idRows;
  const ids = pagedIdRows.map((r) => (r as { id: number | string }).id);
  const lastRow = pagedIdRows[pagedIdRows.length - 1] as { created_at: Date | string };
  const nextCursor = hasMore ? new Date(lastRow.created_at).toISOString() : null;

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      ${orderListSql}
      WHERE o.id IN (${placeholders})
      ORDER BY o.created_at DESC, o.id DESC, oi.created_at ASC, oi.id ASC
    `,
    ids,
  );

  return {
    items: mapOrderRows(rows as OrderRow[]),
    nextCursor,
    summary,
  };
}

async function fetchUserOrderSummary(userId: string): Promise<OrderListSummary> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN o.guess_id IS NOT NULL THEN 1 ELSE 0 END) AS guess_won,
        SUM(CASE WHEN o.guess_id IS NULL THEN 1 ELSE 0 END) AS bought,
        COALESCE(SUM(o.amount), 0) AS total_spent,
        SUM(CASE WHEN o.status = ${ORDER_PENDING}
              OR (o.status = ${ORDER_PAID} AND (fo.status IS NULL OR fo.status IN (${FULFILLMENT_PENDING}, ${FULFILLMENT_PROCESSING})))
            THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN o.status = ${ORDER_PAID} AND fo.status IN (${FULFILLMENT_SHIPPED}, ${FULFILLMENT_COMPLETED})
            THEN 1 ELSE 0 END) AS shipped_count
      FROM \`order\` o
      ${latestFulfillmentJoin}
      WHERE o.user_id = ?
    `,
    [userId],
  );

  const row = rows[0] as
    | {
        total?: number | string;
        guess_won?: number | string;
        bought?: number | string;
        total_spent?: number | string;
        pending_count?: number | string;
        shipped_count?: number | string;
      }
    | undefined;

  return {
    total: Number(row?.total ?? 0),
    guessWon: Number(row?.guess_won ?? 0),
    bought: Number(row?.bought ?? 0),
    totalSpent: toMoney(row?.total_spent),
    pendingCount: Number(row?.pending_count ?? 0),
    shippedCount: Number(row?.shipped_count ?? 0),
  };
}

export async function fetchOrderDetail(userId: string, orderId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${orderListSql}
      WHERE o.user_id = ?
        AND o.id = ?
      ORDER BY oi.created_at ASC, oi.id ASC
    `,
    [userId, orderId],
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
    [orderId],
  );

  const order = mapOrderDetail(rows as OrderRow[], logRows as OrderLogRow[]);
  if (!order) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
  }

  return order;
}

export async function fetchAdminOrderOverview() {
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

  const row = rows[0] as { total_orders?: number | string; paid_orders?: number | string } | undefined;
  return {
    totalOrders: Number(row?.total_orders ?? 0),
    paidOrders: Number(row?.paid_orders ?? 0),
  };
}

