import type mysql from 'mysql2/promise';
import {
  toEntityId,
  toOptionalEntityId,
  type AbandonAdminGuessPayload,
  type AbandonAdminGuessResult,
  type AdminGuessParticipantsResult,
  type CreateAdminGuessPayload,
  type CreateAdminGuessResult,
  type GuessListResult,
  type ReviewAdminGuessPayload,
  type ReviewAdminGuessResult,
  type SettleAdminGuessPayload,
  type SettleAdminGuessResult,
  type UpdateAdminGuessPayload,
  type UpdateAdminGuessResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { GUESS_ABANDONED, GUESS_SETTLED, BET_WON, BET_LOST, BET_CANCELED } from '../guess/guess-shared';
import { refundAbandonedGuessBets } from '../guess/guess-abandon';
import { closeUnpaidGuessBetsAfterSettle } from '../guess/guess-settle';
import {
  PAY_STATUS_WAITING,
  PAY_STATUS_PAID,
  PAY_STATUS_FAILED,
  PAY_STATUS_CLOSED,
  PAY_STATUS_REFUNDED,
  PAY_CHANNEL_WECHAT,
  PAY_CHANNEL_ALIPAY,
} from '../payment/payment-shared';
import {
  GUESS_ACTIVE,
  GUESS_PENDING_REVIEW,
  GUESS_PENDING_SETTLE,
  GUESS_PRODUCT_SOURCE_PLATFORM,
  GUESS_PRODUCT_SOURCE_SHOP,
  GUESS_REJECTED,
  GUESS_SCOPE_PUBLIC,
  GUESS_SOURCE_OPERATION,
  GUESS_TYPE_STANDARD,
  REVIEW_ACTION_ABANDON,
  REVIEW_ACTION_APPROVE,
  REVIEW_ACTION_EDIT,
  REVIEW_ACTION_REJECT,
  REVIEW_ACTION_SETTLE,
  REVIEW_APPROVED,
  REVIEW_PENDING,
  REVIEW_REJECTED,
  SETTLEMENT_MODE_ORACLE,
  type GuessReviewRow,
  buildGuessSummary,
  buildVoteCountLookup,
  ensureGuessPendingReview,
  getGuessOptionRows,
  getGuessPaidAmounts,
  getGuessParticipantCounts,
  getGuessRows,
  getGuessVoteRows,
  normalizeCreateGuessEndTime,
  normalizeGuessOptionTexts,
  normalizeGuessRejectReason,
  normalizeGuessReviewStatus,
  mapGuessReviewStatus,
  mapGuessStatus,
  requireActiveGuessCategory,
  requireGuessProductForCreate,
  groupRowsByGuess,
} from './guesses-shared';

const COMMENT_TARGET_GUESS = 10;
const REVIEW_ACTION_SUBMIT = 10;

type AdminGuessDetailBaseRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  creator_id: number | string;
  creator_name: string | null;
  category_name: string | null;
  description: string | null;
  topic_detail: string | null;
  guess_image_url: string | null;
  scope: number | string;
  settlement_mode: number | string;
  end_time: Date | string | null;
  settled_at: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  product_id: number | string | null;
  product_name: string | null;
  brand_name: string | null;
  product_image_url: string | null;
  product_price: number | string | null;
  product_guess_price: number | string | null;
};

type AdminGuessOptionStatRow = {
  id: number | string;
  option_index: number | string;
  option_text: string;
  odds: number | string | null;
  is_result: number | boolean;
  vote_count: number | string | null;
  vote_amount: number | string | null;
};

type AdminGuessAggregateRow = {
  total_bets: number | string | null;
  total_participants: number | string | null;
  total_amount: number | string | null;
};

type AdminGuessReviewLogRow = {
  id: number | string;
  action: number | string;
  from_status: number | string;
  to_status: number | string;
  note: string | null;
  reviewer_id: number | string | null;
  reviewer_name: string | null;
  created_at: Date | string | null;
};

type AdminGuessEvidenceRow = {
  id: number | string;
  source_type: string;
  matched_index: number | string | null;
  confidence: number | string | null;
  reason: string | null;
  verified_at: Date | string | null;
  created_at: Date | string | null;
  query_payload: unknown;
  response_payload: unknown;
};

type AdminGuessCommentRow = {
  id: number | string;
  author_name: string | null;
  author_phone: string | null;
  content: string;
  created_at: Date | string | null;
  reply_count: number | string | null;
};

function parseUnknownJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapReviewActionLabel(action: number | string) {
  const code = Number(action ?? 0);
  if (code === REVIEW_ACTION_APPROVE) {
    return { action: 'approve' as const, label: '审核通过' as const };
  }
  if (code === REVIEW_ACTION_REJECT) {
    return { action: 'reject' as const, label: '审核拒绝' as const };
  }
  if (code === REVIEW_ACTION_ABANDON) {
    return { action: 'abandon' as const, label: '运营作废' as const };
  }
  if (code === REVIEW_ACTION_SETTLE) {
    return { action: 'settle' as const, label: '手动开奖' as const };
  }
  if (code === REVIEW_ACTION_EDIT) {
    return { action: 'edit' as const, label: '运营编辑' as const };
  }
  return { action: 'submit' as const, label: '提交审核' as const };
}

export async function getAdminGuesses(): Promise<GuessListResult> {
  const rows = await getGuessRows();
  const guessIds = rows.map((row) => String(row.id));
  const [optionRows, voteRows, participantCounts, paidAmounts] = await Promise.all([
    getGuessOptionRows(guessIds),
    getGuessVoteRows(guessIds),
    getGuessParticipantCounts(guessIds),
    getGuessPaidAmounts(guessIds),
  ]);

  const optionsByGuess = groupRowsByGuess(optionRows);
  const voteCountMap = buildVoteCountLookup(voteRows);

  return {
    items: rows.map((row) =>
      buildGuessSummary(
        row,
        optionsByGuess.get(String(row.id)) || [],
        voteCountMap,
        participantCounts.get(String(row.id)) ?? 0,
        paidAmounts.get(String(row.id)) ?? 0,
      ),
    ),
    nextCursor: null,
    hasMore: false,
  };
}

export async function getAdminGuessDetail(guessId: string) {
  const db = getDbPool();
  const [guessRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.creator_id,
        COALESCE(au.display_name, au.username, up.name, IF(u.phone_number IS NOT NULL, CONCAT('用户', RIGHT(u.phone_number, 4)), NULL), CONCAT('用户', g.creator_id)) AS creator_name,
        gc.name AS category_name,
        g.description,
        g.topic_detail,
        g.image_url AS guess_image_url,
        g.scope,
        g.settlement_mode,
        g.end_time,
        g.settled_at,
        g.created_at,
        g.updated_at,
        p.id AS product_id,
        bp.name AS product_name,
        b.name AS brand_name,
        COALESCE(bp.default_img, g.image_url) AS product_image_url,
        p.price AS product_price,
        p.guess_price AS product_guess_price
      FROM guess g
      LEFT JOIN admin_user au ON au.id = g.creator_id
      LEFT JOIN user u ON u.id = g.creator_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN category gc ON gc.id = g.category_id
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE g.id = ?
      LIMIT 1
    `,
    [guessId],
  );

  const guess = guessRows[0] as AdminGuessDetailBaseRow | undefined;
  if (!guess) {
    throw new Error('竞猜不存在');
  }

  const [optionRows, aggregateRows, reviewRows, evidenceRows, commentRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          go.id,
          go.option_index,
          go.option_text,
          go.odds,
          go.is_result,
          COALESCE(stats.vote_count, 0) AS vote_count,
          COALESCE(stats.vote_amount, 0) AS vote_amount
        FROM guess_option go
        LEFT JOIN (
          SELECT
            choice_idx AS option_index,
            COUNT(*) AS vote_count,
            COALESCE(SUM(amount), 0) AS vote_amount
          FROM guess_bet
          WHERE guess_id = ? AND pay_status = ?
          GROUP BY choice_idx
        ) stats ON stats.option_index = go.option_index
        WHERE go.guess_id = ?
        ORDER BY go.option_index ASC
      `,
      [guessId, PAY_STATUS_PAID, guessId],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          COUNT(*) AS total_bets,
          COUNT(DISTINCT user_id) AS total_participants,
          COALESCE(SUM(amount), 0) AS total_amount
        FROM guess_bet
        WHERE guess_id = ? AND pay_status = ?
      `,
      [guessId, PAY_STATUS_PAID],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          grl.id,
          grl.action,
          grl.from_status,
          grl.to_status,
          grl.note,
          grl.reviewer_id,
          COALESCE(au.display_name, au.username) AS reviewer_name,
          grl.created_at
        FROM guess_review_log grl
        LEFT JOIN admin_user au ON au.id = grl.reviewer_id
        WHERE grl.guess_id = ?
        ORDER BY grl.created_at DESC, grl.id DESC
      `,
      [guessId],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          goe.id,
          goe.source_type,
          goe.matched_index,
          goe.confidence,
          goe.reason,
          goe.verified_at,
          goe.created_at,
          goe.query_payload,
          goe.response_payload
        FROM guess_oracle_evidence goe
        WHERE goe.guess_id = ?
        ORDER BY goe.created_at DESC, goe.id DESC
      `,
      [guessId],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          ci.id,
          up.name AS author_name,
          u.phone_number AS author_phone,
          ci.content,
          ci.created_at,
          (
            SELECT COUNT(*)
            FROM comment_item reply
            WHERE reply.parent_id = ci.id
          ) AS reply_count
        FROM comment_item ci
        LEFT JOIN user u ON u.id = ci.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE ci.target_type = ?
          AND ci.target_id = ?
          AND ci.parent_id IS NULL
        ORDER BY ci.created_at DESC, ci.id DESC
        LIMIT 20
      `,
      [COMMENT_TARGET_GUESS, guessId],
    ),
  ]);

  const aggregate = (aggregateRows[0][0] as AdminGuessAggregateRow | undefined) ?? {
    total_bets: 0,
    total_participants: 0,
    total_amount: 0,
  };

  return {
    guess: {
      id: toEntityId(guess.id),
      title: guess.title,
      status: mapGuessStatus(guess.status),
      reviewStatus: mapGuessReviewStatus(guess.review_status),
      category: guess.category_name ?? '-',
      creatorId: toEntityId(guess.creator_id),
      creatorName: guess.creator_name ?? '-',
      description: guess.description ?? null,
      topicDetail: guess.topic_detail ?? null,
      imageUrl: guess.guess_image_url ?? null,
      scope: Number(guess.scope ?? 0) === GUESS_SCOPE_PUBLIC ? 'public' : 'friends',
      settlementMode: Number(guess.settlement_mode ?? 0) === SETTLEMENT_MODE_ORACLE ? 'oracle' : 'manual',
      endTime: guess.end_time ? new Date(guess.end_time).toISOString() : null,
      settledAt: guess.settled_at ? new Date(guess.settled_at).toISOString() : null,
      createdAt: guess.created_at ? new Date(guess.created_at).toISOString() : null,
      updatedAt: guess.updated_at ? new Date(guess.updated_at).toISOString() : null,
      product: {
        id: toOptionalEntityId(guess.product_id),
        name: guess.product_name ?? '-',
        brand: guess.brand_name ?? '-',
        price: Number(guess.product_price ?? 0),
        guessPrice: Number(guess.product_guess_price ?? 0),
        imageUrl: guess.product_image_url ?? null,
      },
      options: optionRows[0].map((row) => ({
        id: toEntityId((row as AdminGuessOptionStatRow).id),
        optionIndex: Number((row as AdminGuessOptionStatRow).option_index ?? 0),
        optionText: (row as AdminGuessOptionStatRow).option_text,
        odds: Number((row as AdminGuessOptionStatRow).odds ?? 0),
        voteCount: Number((row as AdminGuessOptionStatRow).vote_count ?? 0),
        voteAmount: Number((row as AdminGuessOptionStatRow).vote_amount ?? 0),
        isResult: Boolean(Number((row as AdminGuessOptionStatRow).is_result ?? 0)),
      })),
    },
    stats: {
      totalBets: Number(aggregate.total_bets ?? 0),
      totalParticipants: Number(aggregate.total_participants ?? 0),
      totalAmount: Number(aggregate.total_amount ?? 0),
    },
    reviewLogs: reviewRows[0].map((row) => {
      const current = row as AdminGuessReviewLogRow;
      const action = mapReviewActionLabel(current.action);
      return {
        id: toEntityId(current.id),
        action: action.action,
        actionLabel: action.label,
        fromStatus: Number(current.from_status ?? 0),
        toStatus: Number(current.to_status ?? 0),
        note: current.note ?? null,
        reviewerId: toOptionalEntityId(current.reviewer_id),
        reviewerName: current.reviewer_name ?? null,
        createdAt: current.created_at ? new Date(current.created_at).toISOString() : null,
      };
    }),
    comments: commentRows[0].map((row) => {
      const current = row as AdminGuessCommentRow;
      return {
        id: toEntityId(current.id),
        authorName:
          current.author_name?.trim() ||
          (current.author_phone ? `用户${String(current.author_phone).slice(-4)}` : '未知用户'),
        content: current.content,
        createdAt: current.created_at ? new Date(current.created_at).toISOString() : null,
        replyCount: Number(current.reply_count ?? 0),
      };
    }),
    oracleEvidence: evidenceRows[0].map((row) => {
      const current = row as AdminGuessEvidenceRow;
      return {
        id: toEntityId(current.id),
        sourceType: current.source_type,
        matchedIndex:
          current.matched_index == null ? null : Number(current.matched_index),
        confidence:
          current.confidence == null ? null : Number(current.confidence),
        reason: current.reason ?? null,
        verifiedAt: current.verified_at ? new Date(current.verified_at).toISOString() : null,
        createdAt: current.created_at ? new Date(current.created_at).toISOString() : null,
        queryPayload: parseUnknownJson(current.query_payload),
        responsePayload: parseUnknownJson(current.response_payload),
      };
    }),
  };
}

export async function createAdminGuess(
  payload: CreateAdminGuessPayload,
  creatorId: string,
): Promise<CreateAdminGuessResult> {
  const title = payload.title.trim();
  if (!title) {
    throw new Error('竞猜标题不能为空');
  }

  if (!payload.categoryId) {
    throw new Error('请选择竞猜分类');
  }

  if (!payload.productId) {
    throw new Error('请选择关联商品');
  }

  const endTime = normalizeCreateGuessEndTime(payload.endTime);
  const optionTexts = normalizeGuessOptionTexts(payload.optionTexts);
  const product = await requireGuessProductForCreate(String(payload.productId));
  await requireActiveGuessCategory(String(payload.categoryId));

  const description = payload.description?.trim() || null;
  const imageUrl = payload.imageUrl?.trim() || product.image_url || null;
  const guessProductSourceType =
    product.shop_id == null ? GUESS_PRODUCT_SOURCE_PLATFORM : GUESS_PRODUCT_SOURCE_SHOP;

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [guessResult] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess (
          title,
          type,
          source_type,
          image_url,
          status,
          end_time,
          creator_id,
          category_id,
          description,
          review_status,
          scope,
          settlement_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        GUESS_TYPE_STANDARD,
        GUESS_SOURCE_OPERATION,
        imageUrl,
        GUESS_ACTIVE,
        endTime,
        creatorId,
        payload.categoryId,
        description,
        REVIEW_APPROVED,
        GUESS_SCOPE_PUBLIC,
        SETTLEMENT_MODE_ORACLE,
      ],
    );

    const guessId = String(guessResult.insertId);

    await connection.execute(
      `
        INSERT INTO guess_product (
          guess_id,
          product_id,
          option_idx,
          source_type,
          shop_id,
          quantity
        ) VALUES (?, ?, 0, ?, ?, 1)
      `,
      [guessId, payload.productId, guessProductSourceType, product.shop_id],
    );

    for (const [index, optionText] of optionTexts.entries()) {
      await connection.execute(
        `
          INSERT INTO guess_option (
            guess_id,
            option_index,
            option_text,
            odds,
            is_result
          ) VALUES (?, ?, ?, 1, 0)
        `,
        [guessId, index, optionText],
      );
    }

    await connection.commit();

    return {
      id: toEntityId(guessId),
      status: 'active',
      reviewStatus: 'approved',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminGuess(
  guessId: string,
  adminId: string,
  payload: UpdateAdminGuessPayload,
): Promise<UpdateAdminGuessResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [guessRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, status, title, description, image_url, end_time FROM guess WHERE id = ? LIMIT 1 FOR UPDATE`,
      [guessId],
    );
    const guess = guessRows[0] as
      | {
          id: number | string;
          status: number | string;
          title: string;
          description: string | null;
          image_url: string | null;
          end_time: Date | string | null;
        }
      | undefined;
    if (!guess) {
      throw new Error('竞猜不存在');
    }

    const status = Number(guess.status ?? 0);
    if (status === GUESS_SETTLED || status === GUESS_ABANDONED || status === GUESS_REJECTED) {
      throw new Error('当前状态的竞猜不可编辑');
    }

    const updates: string[] = [];
    const params: Array<string | Date | null> = [];
    const diff: Record<string, { from: unknown; to: unknown }> = {};

    if (payload.title !== undefined) {
      const title = payload.title.trim();
      if (!title) {
        throw new Error('竞猜标题不能为空');
      }
      if (title !== guess.title) {
        updates.push('title = ?');
        params.push(title);
        diff.title = { from: guess.title, to: title };
      }
    }

    if (payload.description !== undefined) {
      const next = payload.description?.trim() || null;
      if (next !== (guess.description ?? null)) {
        updates.push('description = ?');
        params.push(next);
        diff.description = { from: guess.description ?? null, to: next };
      }
    }

    if (payload.imageUrl !== undefined) {
      const next = payload.imageUrl?.trim() || null;
      if (next !== (guess.image_url ?? null)) {
        updates.push('image_url = ?');
        params.push(next);
        diff.imageUrl = { from: guess.image_url ?? null, to: next };
      }
    }

    if (payload.endTime !== undefined) {
      const parsed = new Date(payload.endTime);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error('截止时间不合法');
      }
      if (parsed.getTime() <= Date.now()) {
        throw new Error('截止时间必须晚于当前时间');
      }
      const currentEndTime = guess.end_time ? new Date(guess.end_time).getTime() : 0;
      if (parsed.getTime() < currentEndTime) {
        throw new Error('截止时间只能延长');
      }
      if (parsed.getTime() !== currentEndTime) {
        updates.push('end_time = ?');
        params.push(parsed);
        diff.endTime = {
          from: guess.end_time ? new Date(guess.end_time).toISOString() : null,
          to: parsed.toISOString(),
        };
      }
    }

    if (updates.length === 0) {
      await connection.rollback();
      return { id: toEntityId(guessId) };
    }

    params.push(guessId);
    await connection.execute(
      `UPDATE guess SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      params,
    );

    await connection.execute(
      `
        INSERT INTO guess_review_log (
          guess_id, reviewer_id, action, from_status, to_status, note,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [guessId, adminId, REVIEW_ACTION_EDIT, status, status, JSON.stringify(diff)],
    );

    await connection.commit();
    return { id: toEntityId(guessId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function abandonAdminGuess(
  guessId: string,
  adminId: string,
  payload: AbandonAdminGuessPayload,
): Promise<AbandonAdminGuessResult> {
  const reason = payload.reason?.trim();
  if (!reason) {
    throw new Error('请填写作废理由');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [guessRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, status FROM guess WHERE id = ? LIMIT 1 FOR UPDATE`,
      [guessId],
    );
    const guess = guessRows[0] as { id: number | string; status: number | string } | undefined;
    if (!guess) {
      throw new Error('竞猜不存在');
    }

    const fromStatus = Number(guess.status ?? 0);
    if (fromStatus === GUESS_SETTLED) {
      throw new Error('已结算的竞猜不能作废');
    }

    if (fromStatus !== GUESS_ABANDONED) {
      await connection.execute(
        `UPDATE guess SET status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [GUESS_ABANDONED, guessId],
      );
    }

    await connection.execute(
      `
        INSERT INTO guess_review_log (
          guess_id,
          reviewer_id,
          action,
          from_status,
          to_status,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [guessId, adminId, REVIEW_ACTION_ABANDON, fromStatus, GUESS_ABANDONED, reason],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await refundAbandonedGuessBets(guessId);

  return {
    id: toEntityId(guessId),
    status: 'abandoned',
  };
}

export async function reviewAdminGuess(
  guessId: string,
  reviewerId: string,
  payload: ReviewAdminGuessPayload,
): Promise<ReviewAdminGuessResult> {
  const status = normalizeGuessReviewStatus(payload.status);
  const rejectReason = normalizeGuessRejectReason(status, payload.rejectReason);
  const nextGuessStatus = status === 'approved' ? GUESS_ACTIVE : GUESS_REJECTED;
  const nextReviewStatus = status === 'approved' ? REVIEW_APPROVED : REVIEW_REJECTED;
  const action = status === 'approved' ? REVIEW_ACTION_APPROVE : REVIEW_ACTION_REJECT;
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [guessRows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT id, status, review_status
        FROM guess
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [guessId],
    );
    const guess = guessRows[0] as GuessReviewRow | undefined;

    if (!guess) {
      throw new Error('竞猜不存在');
    }

    ensureGuessPendingReview(guess);

    await connection.execute(
      `
        UPDATE guess
        SET
          status = ?,
          review_status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [nextGuessStatus, nextReviewStatus, guessId],
    );

    await connection.execute(
      `
        INSERT INTO guess_review_log (
          guess_id,
          reviewer_id,
          action,
          from_status,
          to_status,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [guessId, reviewerId, action, Number(guess.status ?? 0), nextGuessStatus, rejectReason],
    );

    await connection.commit();

    return {
      id: toEntityId(guess.id),
      status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function settleAdminGuess(
  guessId: string,
  adminId: string,
  payload: SettleAdminGuessPayload,
): Promise<SettleAdminGuessResult> {
  const winnerOptionIndex = Number(payload.winnerOptionIndex);
  if (!Number.isInteger(winnerOptionIndex) || winnerOptionIndex < 0) {
    throw new Error('请选择开奖结果');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [guessRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, status FROM guess WHERE id = ? LIMIT 1 FOR UPDATE`,
      [guessId],
    );
    const guess = guessRows[0] as { id: number | string; status: number | string } | undefined;
    if (!guess) {
      throw new Error('竞猜不存在');
    }

    const fromStatus = Number(guess.status ?? 0);
    if (fromStatus !== GUESS_PENDING_SETTLE && fromStatus !== GUESS_ACTIVE) {
      throw new Error('当前竞猜状态不可开奖');
    }

    const [optionRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id FROM guess_option WHERE guess_id = ? AND option_index = ? LIMIT 1`,
      [guessId, winnerOptionIndex],
    );
    if (!optionRows[0]) {
      throw new Error('开奖选项不存在');
    }

    await connection.execute(
      `UPDATE guess_option SET is_result = 0 WHERE guess_id = ?`,
      [guessId],
    );
    await connection.execute(
      `UPDATE guess_option SET is_result = 1 WHERE guess_id = ? AND option_index = ?`,
      [guessId, winnerOptionIndex],
    );

    await connection.execute(
      `UPDATE guess SET status = ?, settled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [GUESS_SETTLED, guessId],
    );

    // 仅 paid bet 推到 won/lost；未支付 bet 在事务后由 closeUnpaidGuessBetsAfterSettle 取消
    await connection.execute(
      `UPDATE guess_bet
         SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE guess_id = ? AND pay_status = ? AND choice_idx = ?`,
      [BET_WON, guessId, PAY_STATUS_PAID, winnerOptionIndex],
    );
    await connection.execute(
      `UPDATE guess_bet
         SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE guess_id = ? AND pay_status = ? AND choice_idx <> ?`,
      [BET_LOST, guessId, PAY_STATUS_PAID, winnerOptionIndex],
    );

    await connection.execute(
      `
        INSERT INTO guess_review_log (
          guess_id, reviewer_id, action, from_status, to_status, note,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [guessId, adminId, REVIEW_ACTION_SETTLE, fromStatus, GUESS_SETTLED, `手动开奖，获胜选项序号 ${winnerOptionIndex}`],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await closeUnpaidGuessBetsAfterSettle(guessId);

  return { id: toEntityId(guessId), status: 'settled' };
}

type AdminGuessBetRow = {
  id: number | string;
  user_id: number | string;
  user_name: string | null;
  phone_number: string | null;
  choice_idx: number | string;
  option_text: string | null;
  amount: number | string | null;
  status: number | string;
  pay_status: number | string | null;
  pay_channel: number | string | null;
  created_at: Date | string | null;
};

function mapBetStatus(value: number | string): 'pending' | 'won' | 'lost' | 'cancelled' {
  const code = Number(value ?? 0);
  if (code === BET_WON) return 'won';
  if (code === BET_LOST) return 'lost';
  if (code === BET_CANCELED) return 'cancelled';
  return 'pending';
}

function mapPayStatus(value: number | string | null): 'waiting' | 'paid' | 'failed' | 'closed' | 'refunded' {
  const code = Number(value ?? 0);
  if (code === PAY_STATUS_PAID) return 'paid';
  if (code === PAY_STATUS_FAILED) return 'failed';
  if (code === PAY_STATUS_CLOSED) return 'closed';
  if (code === PAY_STATUS_REFUNDED) return 'refunded';
  return 'waiting';
}

function mapPayChannel(value: number | string | null): 'wechat' | 'alipay' | null {
  const code = Number(value ?? 0);
  if (code === PAY_CHANNEL_WECHAT) return 'wechat';
  if (code === PAY_CHANNEL_ALIPAY) return 'alipay';
  return null;
}

export async function getAdminGuessParticipants(
  guessId: string,
  page: number,
  pageSize: number,
): Promise<AdminGuessParticipantsResult> {
  const db = getDbPool();
  const offset = (page - 1) * pageSize;

  const [[countRow], [rows]] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM guess_bet WHERE guess_id = ?`,
      [guessId],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          gb.id,
          gb.user_id,
          COALESCE(
            up.name,
            IF(u.phone_number IS NOT NULL, CONCAT('用户', RIGHT(u.phone_number, 4)), NULL),
            CONCAT('用户', gb.user_id)
          ) AS user_name,
          u.phone_number,
          gb.choice_idx,
          go.option_text,
          gb.amount,
          gb.status,
          gb.pay_status,
          gb.pay_channel,
          gb.created_at
        FROM guess_bet gb
        LEFT JOIN user u ON u.id = gb.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        LEFT JOIN guess_option go
          ON go.guess_id = gb.guess_id AND go.option_index = gb.choice_idx
        WHERE gb.guess_id = ?
        ORDER BY gb.created_at DESC, gb.id DESC
        LIMIT ? OFFSET ?
      `,
      [guessId, pageSize, offset],
    ),
  ]);

  const total = Number((countRow[0] as { total: number })?.total ?? 0);

  return {
    items: rows.map((row) => {
      const r = row as AdminGuessBetRow;
      return {
        id: toEntityId(r.id),
        userId: toEntityId(r.user_id),
        userName: r.user_name ?? `用户${String(r.user_id)}`,
        phoneNumber: r.phone_number ? String(r.phone_number) : null,
        choiceIdx: Number(r.choice_idx ?? 0),
        optionText: r.option_text ?? '-',
        amount: Number(r.amount ?? 0),
        betStatus: mapBetStatus(r.status),
        payStatus: mapPayStatus(r.pay_status),
        payChannel: mapPayChannel(r.pay_channel),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
      };
    }),
    total,
    page,
    pageSize,
  };
}
