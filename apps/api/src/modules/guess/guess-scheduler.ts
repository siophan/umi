import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import { appLogger } from '../../lib/logger';
import {
  PAY_STATUS_PAID,
  PAY_STATUS_REFUNDED,
  payChannelCodeToKey,
} from '../payment/payment-shared';
import { refundPayOrder } from '../payment/payment-service';
import {
  BET_CANCELED,
  BET_PENDING,
  BET_WAITING_PAY,
  GUESS_ABANDONED,
  GUESS_ACTIVE,
  GUESS_PENDING_SETTLE,
} from './guess-shared';

const SCHEDULER_INTERVAL_MS = 60_000;

type DueGuessRow = {
  id: number | string;
  end_time: Date | string;
  reveal_at: Date | string | null;
  min_participants: number | string | null;
};

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
 * 流标退款：竞猜未达最低参与人数时，把所有已支付的投注按原支付通道退回。
 *
 * 不放进单一长事务里：退款 API 是外部网络请求，长事务会持锁。
 * 改为"逐单退款 + 单笔幂等更新"，依赖 pay_status=50 防重入；scheduler tick 失败时下次 tick 自动续跑。
 */
async function refundAndAbandon(guessId: string) {
  const db = getDbPool();

  // 锁定 guess + 抢占处理权：只在 status=ACTIVE 时切到 ABANDONED 处理状态码外的"标记位"是没有的，
  // 这里直接预先把 guess 切到 ABANDONED，让其他 tick 看到非 ACTIVE 就跳过；
  // 即使本次中断，未退款的 bet 仍然 pay_status=20，下次会被同一函数继续清理。
  const claimConn = await db.getConnection();
  try {
    await claimConn.beginTransaction();
    const [lockRows] = await claimConn.query<mysql.RowDataPacket[]>(
      `SELECT status FROM guess WHERE id = ? FOR UPDATE`,
      [guessId],
    );
    const guess = lockRows[0] as { status: number | string } | undefined;
    if (!guess || Number(guess.status) !== GUESS_ACTIVE) {
      await claimConn.rollback();
      return;
    }
    await claimConn.execute(
      `UPDATE guess SET status = ? WHERE id = ?`,
      [GUESS_ABANDONED, guessId],
    );
    await claimConn.commit();
  } catch (error) {
    await claimConn.rollback();
    throw error;
  } finally {
    claimConn.release();
  }

  // 拉所有需要处理的 bet：已支付的要退款，未支付的直接取消。
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

    // 未支付的 bet：直接取消
    if (status === BET_WAITING_PAY) {
      await db.execute(
        `UPDATE guess_bet SET status = ? WHERE id = ? AND status = ?`,
        [BET_CANCELED, betId, BET_WAITING_PAY],
      );
      continue;
    }

    // 已退款过的跳过（幂等）
    if (payStatus === PAY_STATUS_REFUNDED) {
      await db.execute(
        `UPDATE guess_bet SET status = ? WHERE id = ? AND status <> ?`,
        [BET_CANCELED, betId, BET_CANCELED],
      );
      continue;
    }

    // 已支付的 bet：调真实退款
    if (payStatus !== PAY_STATUS_PAID || !row.pay_no || amountCents <= 0) {
      appLogger.warn(
        { betId, payStatus, payNo: row.pay_no, amountCents },
        '流标退款跳过：bet 状态异常',
      );
      continue;
    }

    const channelKey = payChannelCodeToKey(Number(row.pay_channel ?? 0));
    if (!channelKey) {
      appLogger.warn({ betId, payChannel: row.pay_channel }, '流标退款跳过：未知支付渠道');
      continue;
    }

    try {
      await refundPayOrder(channelKey, {
        payNo: row.pay_no,
        refundNo: `GBR${betId}`,
        totalCents: amountCents,
        refundCents: amountCents,
        reason: '竞猜流标全额退款',
      });
      await db.execute(
        `UPDATE guess_bet SET status = ?, pay_status = ? WHERE id = ?`,
        [BET_CANCELED, PAY_STATUS_REFUNDED, betId],
      );
      appLogger.info(
        { betId, channel: channelKey, payNo: row.pay_no, amountCents },
        '流标退款成功',
      );
    } catch (error) {
      appLogger.error(
        { err: error, betId, channel: channelKey, payNo: row.pay_no },
        '流标退款失败：单笔退款将在下个 tick 自动重试',
      );
    }
  }
}

async function processDueGuess(row: DueGuessRow) {
  const guessId = String(row.id);
  const minParticipants = row.min_participants == null ? null : Number(row.min_participants);
  const hasReveal = row.reveal_at != null;

  const db = getDbPool();
  const connection = await db.getConnection();
  let shouldAbandon = false;

  try {
    await connection.beginTransaction();

    const [lockRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, status FROM guess WHERE id = ? FOR UPDATE`,
      [guessId],
    );
    const guess = lockRows[0] as { status: number | string } | undefined;
    if (!guess || Number(guess.status) !== GUESS_ACTIVE) {
      await connection.rollback();
      return;
    }

    if (minParticipants != null) {
      const [countRows] = await connection.query<mysql.RowDataPacket[]>(
        `
          SELECT COUNT(DISTINCT user_id) AS participants
          FROM guess_bet
          WHERE guess_id = ? AND status = ?
        `,
        [guessId, BET_PENDING],
      );
      const participants = Number((countRows[0] as { participants: number | string } | undefined)?.participants ?? 0);

      if (participants < minParticipants) {
        await connection.rollback();
        shouldAbandon = true;
        appLogger.info(
          { guessId, participants, minParticipants },
          'Guess due to abandon: below minimum participants',
        );
      } else if (hasReveal) {
        await connection.execute(
          `UPDATE guess SET status = ? WHERE id = ?`,
          [GUESS_PENDING_SETTLE, guessId],
        );
        await connection.commit();
        appLogger.info({ guessId }, 'Guess advanced to pending_settle');
        return;
      } else {
        await connection.rollback();
        return;
      }
    } else if (hasReveal) {
      await connection.execute(
        `UPDATE guess SET status = ? WHERE id = ?`,
        [GUESS_PENDING_SETTLE, guessId],
      );
      await connection.commit();
      appLogger.info({ guessId }, 'Guess advanced to pending_settle');
      return;
    } else {
      await connection.rollback();
      return;
    }
  } catch (error) {
    await connection.rollback();
    appLogger.error({ err: error, guessId }, 'processDueGuess failed');
    return;
  } finally {
    connection.release();
  }

  if (shouldAbandon) {
    try {
      await refundAndAbandon(guessId);
    } catch (error) {
      appLogger.error({ err: error, guessId }, 'refundAndAbandon failed');
    }
  }
}

async function runGuessTransitionTick() {
  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT id, end_time, reveal_at, min_participants
      FROM guess
      WHERE status = ?
        AND end_time <= NOW()
        AND (min_participants IS NOT NULL OR reveal_at IS NOT NULL)
      LIMIT 100
    `,
    [GUESS_ACTIVE],
  );

  for (const row of rows as DueGuessRow[]) {
    await processDueGuess(row);
  }

  // 续跑：处理之前流标但未完成退款的 bet
  // ABANDONED 状态下仍可能有 pay_status=PAID 的 bet（前一轮退款 API 失败）
  const [retryRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT DISTINCT g.id
      FROM guess g
      JOIN guess_bet b ON b.guess_id = g.id
      WHERE g.status = ?
        AND b.status IN (?, ?)
        AND (b.pay_status IS NULL OR b.pay_status <> ?)
      LIMIT 20
    `,
    [GUESS_ABANDONED, BET_WAITING_PAY, BET_PENDING, PAY_STATUS_REFUNDED],
  );

  for (const row of retryRows as { id: number | string }[]) {
    try {
      await refundAndAbandon(String(row.id));
    } catch (error) {
      appLogger.error({ err: error, guessId: row.id }, 'retry refundAndAbandon failed');
    }
  }
}

let timer: NodeJS.Timeout | null = null;

export function startGuessScheduler() {
  if (timer) {
    return;
  }
  const tick = () => {
    runGuessTransitionTick().catch((error) => {
      appLogger.error({ err: error }, 'guess scheduler tick failed');
    });
  };
  tick();
  timer = setInterval(tick, SCHEDULER_INTERVAL_MS);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  appLogger.info({ intervalMs: SCHEDULER_INTERVAL_MS }, 'Guess scheduler started');
}

export function stopGuessScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
