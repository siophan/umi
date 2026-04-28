import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import { appLogger } from '../../lib/logger';
import {
  BET_CANCELED,
  BET_PENDING,
  GUESS_ABANDONED,
  GUESS_ACTIVE,
  GUESS_PENDING_SETTLE,
} from './guess-shared';

const COIN_LEDGER_TYPE_REFUND = 30;
const COIN_LEDGER_SOURCE_GUESS = 10;
const SCHEDULER_INTERVAL_MS = 60_000;

type DueGuessRow = {
  id: number | string;
  end_time: Date | string;
  reveal_at: Date | string | null;
  min_participants: number | string | null;
};

type PendingBetRow = {
  id: number | string;
  user_id: number | string;
  amount: number | string | null;
};

async function refundBetsAndAbandon(connection: mysql.PoolConnection, guessId: string) {
  const [betRows] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT id, user_id, amount
      FROM guess_bet
      WHERE guess_id = ? AND status = ?
      FOR UPDATE
    `,
    [guessId, BET_PENDING],
  );

  for (const row of betRows as PendingBetRow[]) {
    const userId = String(row.user_id);
    const amount = Number(row.amount ?? 0);

    await connection.execute(
      `UPDATE guess_bet SET status = ? WHERE id = ?`,
      [BET_CANCELED, row.id],
    );

    if (amount <= 0) {
      continue;
    }

    const [balanceRows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT COALESCE((
          SELECT cl.balance_after
          FROM coin_ledger cl
          WHERE cl.user_id = ?
          ORDER BY cl.created_at DESC, cl.id DESC
          LIMIT 1
        ), 0) AS balance
      `,
      [userId],
    );
    const currentBalance = Number((balanceRows[0] as { balance: number | string } | undefined)?.balance ?? 0);
    const balanceAfter = currentBalance + amount;

    await connection.execute(
      `
        INSERT INTO coin_ledger (
          user_id, type, amount, balance_after, source_type, source_id, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        COIN_LEDGER_TYPE_REFUND,
        amount,
        balanceAfter,
        COIN_LEDGER_SOURCE_GUESS,
        row.id,
        '竞猜流标退款',
      ],
    );
  }

  await connection.execute(
    `UPDATE guess SET status = ? WHERE id = ?`,
    [GUESS_ABANDONED, guessId],
  );
}

async function processDueGuess(row: DueGuessRow) {
  const guessId = String(row.id);
  const minParticipants = row.min_participants == null ? null : Number(row.min_participants);
  const hasReveal = row.reveal_at != null;

  const db = getDbPool();
  const connection = await db.getConnection();
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
        await refundBetsAndAbandon(connection, guessId);
        await connection.commit();
        appLogger.info(
          { guessId, participants, minParticipants },
          'Guess abandoned: below minimum participants, bets refunded',
        );
        return;
      }
    }

    if (hasReveal) {
      await connection.execute(
        `UPDATE guess SET status = ? WHERE id = ?`,
        [GUESS_PENDING_SETTLE, guessId],
      );
      await connection.commit();
      appLogger.info({ guessId }, 'Guess advanced to pending_settle');
      return;
    }

    await connection.rollback();
  } catch (error) {
    await connection.rollback();
    appLogger.error({ err: error, guessId }, 'processDueGuess failed');
  } finally {
    connection.release();
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
