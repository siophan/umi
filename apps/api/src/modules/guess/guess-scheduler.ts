import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import { appLogger } from '../../lib/logger';
import { PAY_STATUS_REFUNDED } from '../payment/payment-shared';
import { refundAbandonedGuessBets } from './guess-abandon';
import {
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

/**
 * 流标退款：竞猜未达最低参与人数时，先把 guess 抢占到 ABANDONED，再逐单退款。
 * 抢占成功后调 refundAbandonedGuessBets 复用同一份退款循环。
 */
async function refundAndAbandon(guessId: string) {
  const db = getDbPool();

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

  await refundAbandonedGuessBets(guessId);
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
      await refundAbandonedGuessBets(String(row.id));
    } catch (error) {
      appLogger.error({ err: error, guessId: row.id }, 'retry refundAbandonedGuessBets failed');
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
