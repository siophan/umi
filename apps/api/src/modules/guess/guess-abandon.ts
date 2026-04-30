import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import { appLogger } from '../../lib/logger';
import {
  PAY_STATUS_PAID,
  PAY_STATUS_REFUNDED,
  payChannelCodeToKey,
} from '../payment/payment-shared';
import { refundPayOrder } from '../payment/payment-service';
import { BET_CANCELED, BET_PENDING, BET_WAITING_PAY } from './guess-shared';

type RefundableBetRow = {
  id: number | string;
  user_id: number | string;
  amount: number | string | null;
  status: number | string;
  pay_status: number | string | null;
  pay_channel: number | string | null;
  pay_no: string | null;
};

/**
 * 假设 guess 已切到 GUESS_ABANDONED；逐单退款 + 单笔幂等更新。
 * 不放进单一长事务里：退款 API 是外部网络请求，长事务会持锁。失败的单子下次 tick 自动续跑。
 */
export async function refundAbandonedGuessBets(guessId: string): Promise<void> {
  const db = getDbPool();

  const [pendingRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT id, user_id, amount, status, pay_status, pay_channel, pay_no
      FROM guess_bet
      WHERE guess_id = ?
        AND status IN (?, ?)
    `,
    [guessId, BET_WAITING_PAY, BET_PENDING],
  );

  for (const row of pendingRows as RefundableBetRow[]) {
    const betId = String(row.id);
    const status = Number(row.status);
    const payStatus = Number(row.pay_status ?? 0);
    const amountCents = Number(row.amount ?? 0);

    if (status === BET_WAITING_PAY) {
      await db.execute(
        `UPDATE guess_bet SET status = ? WHERE id = ? AND status = ?`,
        [BET_CANCELED, betId, BET_WAITING_PAY],
      );
      continue;
    }

    if (payStatus === PAY_STATUS_REFUNDED) {
      await db.execute(
        `UPDATE guess_bet SET status = ? WHERE id = ? AND status <> ?`,
        [BET_CANCELED, betId, BET_CANCELED],
      );
      continue;
    }

    if (payStatus !== PAY_STATUS_PAID || !row.pay_no || amountCents <= 0) {
      appLogger.warn(
        { betId, payStatus, payNo: row.pay_no, amountCents },
        '作废退款跳过：bet 状态异常',
      );
      continue;
    }

    const channelKey = payChannelCodeToKey(Number(row.pay_channel ?? 0));
    if (!channelKey) {
      appLogger.warn({ betId, payChannel: row.pay_channel }, '作废退款跳过：未知支付渠道');
      continue;
    }

    try {
      await refundPayOrder(channelKey, {
        payNo: row.pay_no,
        refundNo: `GBR${betId}`,
        totalCents: amountCents,
        refundCents: amountCents,
        reason: '竞猜作废全额退款',
      });
      await db.execute(
        `UPDATE guess_bet SET status = ?, pay_status = ? WHERE id = ?`,
        [BET_CANCELED, PAY_STATUS_REFUNDED, betId],
      );
      appLogger.info(
        { betId, channel: channelKey, payNo: row.pay_no, amountCents },
        '作废退款成功',
      );
    } catch (error) {
      appLogger.error(
        { err: error, betId, channel: channelKey, payNo: row.pay_no },
        '作废退款失败：单笔退款将在下个 tick 自动重试',
      );
    }
  }
}
