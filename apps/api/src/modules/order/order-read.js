import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { ORDER_FULFILLED, ORDER_PAID, ORDER_REFUNDED, orderListSql, mapOrderDetail, mapOrderRows } from './order-shared';
export async function fetchUserOrders(userId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      ${orderListSql}
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, oi.created_at ASC, oi.id ASC
    `, [userId]);
    return { items: mapOrderRows(rows) };
}
export async function fetchOrderDetail(userId, orderId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      ${orderListSql}
      WHERE o.user_id = ?
        AND o.id = ?
      ORDER BY oi.created_at ASC, oi.id ASC
    `, [userId, orderId]);
    if (!rows.length) {
        throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
    }
    const [logRows] = await db.execute(`
      SELECT id, from_status, to_status, note, created_at
      FROM order_status_log
      WHERE order_id = ?
      ORDER BY created_at ASC, id ASC
    `, [orderId]);
    const order = mapOrderDetail(rows, logRows);
    if (!order) {
        throw new HttpError(404, 'ORDER_NOT_FOUND', '订单不存在');
    }
    return order;
}
export async function fetchAdminOrderOverview() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status IN (?, ?, ?) THEN 1 ELSE 0 END) AS paid_orders
      FROM \`order\`
    `, [ORDER_PAID, ORDER_FULFILLED, ORDER_REFUNDED]);
    const row = rows[0];
    return {
        totalOrders: Number(row?.total_orders ?? 0),
        paidOrders: Number(row?.paid_orders ?? 0),
    };
}
