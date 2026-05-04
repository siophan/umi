import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';
import type {
  FetchBetPayStatusResult,
  GuessBetPayStatus,
  GuessPayChannel,
  ParticipateGuessResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { appLogger } from '../../lib/logger';
import { closePayOrder, createPayOrder, queryPayOrder } from '../payment/payment-service';
import {
  generatePayNo,
  payChannelCodeToKey,
  payChannelKeyToCode,
  PAY_STATUS_CLOSED,
  PAY_STATUS_FAILED,
  PAY_STATUS_PAID,
  PAY_STATUS_REFUNDED,
  PAY_STATUS_WAITING,
} from '../payment/payment-shared';
import {
  BET_CANCELED,
  BET_PENDING,
  BET_WAITING_PAY,
  GUESS_ACTIVE,
} from './guess-shared';

const PAY_EXPIRES_SEC = 5 * 60; // 5 分钟

type GuessForBetRow = {
  id: number | string;
  status: number | string;
  end_time: Date | string;
  product_id: number | string | null;
  brand_product_sku_id: number | string | null;
  product_price: number | string | null;
  product_name: string | null;
};

async function loadGuessForBet(guessId: string): Promise<GuessForBetRow> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.status,
        g.end_time,
        gp.product_id,
        gp.brand_product_sku_id,
        COALESCE(bps.guess_price, bps.guide_price) AS product_price,
        bp.name AS product_name
      FROM guess g
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS gp_id
        FROM guess_product
        GROUP BY guess_id
      ) latest_gp ON latest_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = latest_gp.gp_id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = gp.brand_product_sku_id
      WHERE g.id = ?
      LIMIT 1
    `,
    [guessId],
  );
  if (!rows.length) {
    throw new HttpError(404, 'GUESS_NOT_FOUND', '竞猜不存在');
  }
  return rows[0] as GuessForBetRow;
}

async function ensureGuessOptionExists(guessId: string, choiceIdx: number): Promise<void> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT 1 FROM guess_option WHERE guess_id = ? AND option_index = ? LIMIT 1',
    [guessId, choiceIdx],
  );
  if (!rows.length) {
    throw new HttpError(400, 'GUESS_OPTION_NOT_FOUND', '竞猜选项不存在');
  }
}

async function ensureNoPaidBet(userId: string, guessId: string): Promise<void> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT 1 FROM guess_bet WHERE user_id = ? AND guess_id = ? AND pay_status = ? LIMIT 1',
    [userId, guessId, PAY_STATUS_PAID],
  );
  if (rows.length) {
    throw new HttpError(409, 'GUESS_ALREADY_PARTICIPATED', '你已参与本次竞猜');
  }
}

export async function createGuessBetPayment(
  userId: string,
  guessId: string,
  payload: { choiceIdx: number; quantity?: number; payChannel: GuessPayChannel },
  clientIp: string,
): Promise<ParticipateGuessResult> {
  const choiceIdx = Number(payload.choiceIdx);
  if (!Number.isFinite(choiceIdx) || choiceIdx < 0) {
    throw new HttpError(400, 'GUESS_CHOICE_INVALID', '请选择竞猜选项');
  }
  if (payload.payChannel !== 'wechat' && payload.payChannel !== 'alipay') {
    throw new HttpError(400, 'PAY_CHANNEL_INVALID', '不支持的支付渠道');
  }
  const quantity = Math.max(1, Math.floor(Number(payload.quantity ?? 1)));

  const guess = await loadGuessForBet(guessId);
  if (Number(guess.status) !== GUESS_ACTIVE) {
    throw new HttpError(400, 'GUESS_NOT_ACTIVE', '竞猜不在进行中');
  }
  if (new Date(guess.end_time).getTime() <= Date.now()) {
    throw new HttpError(400, 'GUESS_ENDED', '竞猜已结束');
  }
  await ensureGuessOptionExists(guessId, choiceIdx);
  await ensureNoPaidBet(userId, guessId);

  const unitPriceCents = Math.round(Number(guess.product_price ?? 0));
  const amountCents = unitPriceCents * quantity;
  if (amountCents <= 0) {
    throw new HttpError(400, 'GUESS_AMOUNT_INVALID', '竞猜押金为 0，无法发起支付');
  }

  const expiresAt = new Date(Date.now() + PAY_EXPIRES_SEC * 1000);

  if (!guess.product_id || !guess.brand_product_sku_id) {
    throw new HttpError(400, 'GUESS_PRODUCT_MISSING', '竞猜未关联奖品 SKU');
  }

  const db = getDbPool();
  // INSERT bet (waiting). pay_no 暂用 NULL, 拿 id 后立刻 UPDATE 写入。
  const [insertResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id, guess_id, choice_idx, amount, product_id, brand_product_sku_id, coupon_id,
        status, pay_status, pay_channel, pay_expires_at,
        reward_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [
      userId,
      guessId,
      choiceIdx,
      amountCents,
      guess.product_id,
      guess.brand_product_sku_id,
      BET_WAITING_PAY,
      PAY_STATUS_WAITING,
      payChannelKeyToCode(payload.payChannel),
      expiresAt,
    ],
  );
  const betId = String(insertResult.insertId);
  const payNo = generatePayNo(betId.slice(-6));

  await db.execute(
    'UPDATE guess_bet SET pay_no = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
    [payNo, betId],
  );

  try {
    const productName = guess.product_name ?? '竞猜参与押金';
    const result = await createPayOrder(payload.payChannel, {
      payNo,
      amountCents,
      subject: productName.slice(0, 64),
      clientIp,
      expiresInSec: PAY_EXPIRES_SEC,
    });
    return {
      betId: toEntityId(betId),
      guessId: toEntityId(guess.id),
      choiceIdx,
      payNo,
      payChannel: payload.payChannel,
      payUrl: result.payUrl,
      expiresAt: result.expiresAt.toISOString(),
    };
  } catch (error) {
    await db.execute(
      'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [PAY_STATUS_FAILED, BET_CANCELED, betId],
    );
    appLogger.error({ err: error, payNo, betId }, '[guess-pay] gateway create failed');
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '支付下单失败，请稍后再试');
  }
}

/**
 * 核心幂等点：
 * 1. SELECT FOR UPDATE 锁 bet
 * 2. 已 paid → return（回调重发安全）
 * 3. 状态不是 waiting → 跳过 + warn
 * 4. 检查 user/guess 已有其他 paid bet → 当前这笔 mark refunded + log
 *    （本期不调退款 API，schema 已留位 pay_status=50）
 * 5. UPDATE bet status=PENDING, pay_status=paid, pay_trade_no, paid_at
 */
export async function markBetPaid(
  payNo: string,
  tradeNo: string,
  paidAt: Date,
): Promise<void> {
  const db = getDbPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, user_id, guess_id, pay_status FROM guess_bet WHERE pay_no = ? FOR UPDATE',
      [payNo],
    );
    const bet = rows[0] as
      | {
          id: number | string;
          user_id: number | string;
          guess_id: number | string;
          pay_status: number | string;
        }
      | undefined;
    if (!bet) {
      appLogger.warn({ payNo }, '[markBetPaid] pay_no not found in guess_bet');
      await connection.rollback();
      return;
    }
    const currentStatus = Number(bet.pay_status);
    if (currentStatus === PAY_STATUS_PAID) {
      await connection.rollback();
      return;
    }
    if (currentStatus !== PAY_STATUS_WAITING) {
      appLogger.warn(
        { payNo, currentStatus },
        '[markBetPaid] bet pay_status not waiting; skipping',
      );
      await connection.rollback();
      return;
    }

    const [dupes] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM guess_bet WHERE user_id = ? AND guess_id = ? AND pay_status = ? AND id != ? LIMIT 1',
      [bet.user_id, bet.guess_id, PAY_STATUS_PAID, bet.id],
    );
    if (dupes.length) {
      appLogger.warn(
        { payNo, betId: bet.id, otherBetId: (dupes[0] as { id: number }).id },
        '[markBetPaid] duplicate paid bet detected; marking current as refunded (TODO: trigger refund API)',
      );
      await connection.execute(
        'UPDATE guess_bet SET pay_status = ?, pay_trade_no = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [PAY_STATUS_REFUNDED, tradeNo, paidAt, bet.id],
      );
      await connection.commit();
      return;
    }

    await connection.execute(
      `UPDATE guess_bet
         SET status = ?, pay_status = ?, pay_trade_no = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [BET_PENDING, PAY_STATUS_PAID, tradeNo, paidAt, bet.id],
    );
    await connection.commit();
    appLogger.info({ payNo, betId: bet.id }, '[markBetPaid] paid');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

type BetRowForQuery = {
  id: number | string;
  user_id: number | string;
  pay_no: string | null;
  pay_status: number | string;
  pay_channel: number | string | null;
  pay_expires_at: Date | string | null;
  paid_at: Date | string | null;
};

function mapPayStatusCodeToKey(code: number | string): GuessBetPayStatus {
  const value = Number(code);
  if (value === PAY_STATUS_PAID) return 'paid';
  if (value === PAY_STATUS_FAILED) return 'failed';
  if (value === PAY_STATUS_CLOSED) return 'closed';
  return 'waiting';
}

export async function queryGuessBetPayStatus(
  userId: string,
  betId: string,
): Promise<FetchBetPayStatusResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT id, user_id, pay_no, pay_status, pay_channel, pay_expires_at, paid_at FROM guess_bet WHERE id = ? LIMIT 1',
    [betId],
  );
  const bet = rows[0] as BetRowForQuery | undefined;
  if (!bet) {
    throw new HttpError(404, 'BET_NOT_FOUND', '竞猜记录不存在');
  }
  if (String(bet.user_id) !== String(userId)) {
    throw new HttpError(403, 'BET_FORBIDDEN', '无权访问该竞猜记录');
  }

  const currentStatus = Number(bet.pay_status);

  // 已是终态 → 直接返回
  if (currentStatus !== PAY_STATUS_WAITING) {
    return {
      betId: toEntityId(bet.id),
      payStatus: mapPayStatusCodeToKey(currentStatus),
      paidAt: bet.paid_at ? new Date(bet.paid_at).toISOString() : null,
    };
  }

  // 过期 → mark closed
  if (bet.pay_expires_at && new Date(bet.pay_expires_at).getTime() < Date.now()) {
    await db.execute(
      'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
      [PAY_STATUS_CLOSED, BET_CANCELED, bet.id, PAY_STATUS_WAITING],
    );
    return { betId: toEntityId(bet.id), payStatus: 'closed', paidAt: null };
  }

  // 主动查询网关兜底
  const channelKey = payChannelCodeToKey(bet.pay_channel);
  if (!channelKey || !bet.pay_no) {
    return { betId: toEntityId(bet.id), payStatus: 'waiting', paidAt: null };
  }

  try {
    const queryResult = await queryPayOrder(channelKey, bet.pay_no);
    if (queryResult.status === 'paid' && queryResult.tradeNo) {
      await markBetPaid(bet.pay_no, queryResult.tradeNo, queryResult.paidAt ?? new Date());
      return {
        betId: toEntityId(bet.id),
        payStatus: 'paid',
        paidAt: (queryResult.paidAt ?? new Date()).toISOString(),
      };
    }
    if (queryResult.status === 'closed') {
      await db.execute(
        'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
        [PAY_STATUS_CLOSED, BET_CANCELED, bet.id, PAY_STATUS_WAITING],
      );
      return { betId: toEntityId(bet.id), payStatus: 'closed', paidAt: null };
    }
    if (queryResult.status === 'failed') {
      await db.execute(
        'UPDATE guess_bet SET pay_status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
        [PAY_STATUS_FAILED, bet.id, PAY_STATUS_WAITING],
      );
      return { betId: toEntityId(bet.id), payStatus: 'failed', paidAt: null };
    }
    return { betId: toEntityId(bet.id), payStatus: 'waiting', paidAt: null };
  } catch (error) {
    appLogger.warn({ err: error, betId: bet.id }, '[queryGuessBetPayStatus] gateway query failed');
    return { betId: toEntityId(bet.id), payStatus: 'waiting', paidAt: null };
  }
}

export async function cancelGuessBet(
  userId: string,
  betId: string,
): Promise<{ success: true; betId: string }> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT id, user_id, pay_no, pay_status, pay_channel FROM guess_bet WHERE id = ? LIMIT 1',
    [betId],
  );
  const bet = rows[0] as
    | {
        id: number | string;
        user_id: number | string;
        pay_no: string | null;
        pay_status: number | string;
        pay_channel: number | string | null;
      }
    | undefined;
  if (!bet) {
    throw new HttpError(404, 'BET_NOT_FOUND', '竞猜记录不存在');
  }
  if (String(bet.user_id) !== String(userId)) {
    throw new HttpError(403, 'BET_FORBIDDEN', '无权操作该竞猜记录');
  }
  if (Number(bet.pay_status) !== PAY_STATUS_WAITING) {
    throw new HttpError(409, 'BET_NOT_CANCELLABLE', '当前状态不能取消');
  }

  const channelKey = payChannelCodeToKey(bet.pay_channel);
  if (channelKey && bet.pay_no) {
    await closePayOrder(channelKey, bet.pay_no);
  }

  await db.execute(
    'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
    [PAY_STATUS_CLOSED, BET_CANCELED, bet.id, PAY_STATUS_WAITING],
  );
  return { success: true, betId: String(bet.id) };
}
