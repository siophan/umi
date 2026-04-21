import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  ORDER_TYPE_GUESS_REWARD,
  ORDER_PAID,
  ORDER_FULFILLED,
  ORDER_REFUNDED,
  type AdminTransactionPaymentRow,
  type AdminTransactionRefundRow,
  type AdminTransactionRow,
  mapPaymentStatusLabel,
  mapRefundStatusLabel,
  toMoney,
  toNullableIso,
} from './orders-shared';

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
      WHERE o.status IN (?, ?, ?)
      ORDER BY o.created_at DESC, o.id DESC
    `,
    [ORDER_PAID, ORDER_FULFILLED, ORDER_REFUNDED],
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
    channel: Number(row.order_type ?? 0) === ORDER_TYPE_GUESS_REWARD ? '竞猜奖励退款' : '订单退款',
    channelDerived: true,
    amount: -toMoney(row.refund_amount),
    direction: 'refund' as const,
    statusLabel: mapRefundStatusLabel(Number(row.status ?? 0)),
    statusCode: Number(row.status ?? 0),
    sourceTable: 'order_refund' as const,
    createdAt:
      toNullableIso(row.completed_at) ||
      toNullableIso(row.reviewed_at) ||
      toNullableIso(row.requested_at) ||
      new Date(row.created_at).toISOString(),
  }));

  return [...payments, ...refunds].sort((left, right) => {
    const timeDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return right.id.localeCompare(left.id);
  });
}
