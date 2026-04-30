import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import { appLogger } from '../../lib/logger';
import {
  PAY_STATUS_WAITING,
  PAY_STATUS_FAILED,
  PAY_STATUS_CLOSED,
  payChannelCodeToKey,
} from '../payment/payment-shared';
import { closePayOrder } from '../payment/payment-service';
import { BET_CANCELED, BET_WAITING_PAY } from './guess-shared';

type UnpaidBetRow = {
  id: number | string;
  status: number | string;
  pay_status: number | string | null;
  pay_channel: number | string | null;
  pay_no: string | null;
};

/**
 * settleAdminGuess 主事务提交后调用：把未支付 bet（pay_status IN waiting/failed/closed）
 * 全部 cancel 掉，并 best-effort 关闭支付渠道订单，避免开奖后还能继续支付。
 *
 * 仿 refundAbandonedGuessBets 的设计：不放进单一长事务里——关闭支付渠道是外部网络请求，
 * 长事务会持锁。失败的单子留作非阻塞 warn，最坏情况下渠道订单到期自然过期。
 */
export async function closeUnpaidGuessBetsAfterSettle(guessId: string): Promise<void> {
  const db = getDbPool();

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT id, status, pay_status, pay_channel, pay_no
      FROM guess_bet
      WHERE guess_id = ?
        AND status <> ?
        AND pay_status IN (?, ?, ?)
    `,
    [guessId, BET_CANCELED, PAY_STATUS_WAITING, PAY_STATUS_FAILED, PAY_STATUS_CLOSED],
  );

  for (const row of rows as UnpaidBetRow[]) {
    const betId = String(row.id);
    const status = Number(row.status);
    const payStatus = Number(row.pay_status ?? 0);

    // BET_WAITING_PAY 是创建后从未发起渠道下单（极少数情况：渠道下单失败已被本地标 cancel）
    if (status === BET_WAITING_PAY && !row.pay_no) {
      await db.execute(
        `UPDATE guess_bet SET status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = ?`,
        [BET_CANCELED, betId, BET_WAITING_PAY],
      );
      continue;
    }

    // 渠道订单可能还在 WAITING；best-effort close
    if (payStatus === PAY_STATUS_WAITING && row.pay_no) {
      const channelKey = payChannelCodeToKey(Number(row.pay_channel ?? 0));
      if (channelKey) {
        try {
          await closePayOrder(channelKey, row.pay_no);
        } catch (error) {
          appLogger.warn(
            { err: error, betId, channel: channelKey, payNo: row.pay_no },
            '[guess-settle] close pay order failed; bet 仍标记 cancelled',
          );
        }
      }
    }

    await db.execute(
      `UPDATE guess_bet
         SET status = ?, pay_status = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ? AND status <> ?`,
      [BET_CANCELED, PAY_STATUS_CLOSED, betId, BET_CANCELED],
    );
  }
}
