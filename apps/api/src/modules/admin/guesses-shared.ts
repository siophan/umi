import type mysql from 'mysql2/promise';
import {
  toEntityId,
  toOptionalEntityId,
  type CreateAdminGuessPayload,
  type GuessSummary,
  type ProductSummary,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { PAY_STATUS_PAID } from '../payment/payment-shared';

export const GUESS_DRAFT = 10;
export const GUESS_PENDING_REVIEW = 20;
export const GUESS_ACTIVE = 30;
export const GUESS_PENDING_SETTLE = 35;
export const GUESS_SETTLED = 40;
export const GUESS_ABANDONED = 80;
export const GUESS_REJECTED = 90;
export const GUESS_TYPE_STANDARD = 10;
export const GUESS_SCOPE_PUBLIC = 10;
export const GUESS_SCOPE_FRIENDS = 20;
export const GUESS_SOURCE_OPERATION = 30;
export const GUESS_PRODUCT_SOURCE_PLATFORM = 10;
export const GUESS_PRODUCT_SOURCE_SHOP = 20;
export const SETTLEMENT_MODE_ORACLE = 10;

export const REVIEW_PENDING = 10;
export const REVIEW_APPROVED = 30;
export const REVIEW_REJECTED = 40;

export const REVIEW_ACTION_APPROVE = 20;
export const REVIEW_ACTION_REJECT = 30;
export const REVIEW_ACTION_ABANDON = 40;
export const REVIEW_ACTION_SETTLE = 50;
export const REVIEW_ACTION_EDIT = 60;

export const INVITATION_PENDING = 10;
export const INVITATION_ACCEPTED = 30;
export const INVITATION_REJECTED = 40;
export const INVITATION_EXPIRED = 90;

export const FRIEND_CONFIRM_CONFIRMED = 10;
export const FRIEND_CONFIRM_REJECTED = 20;

export const PK_RESULT_PENDING = 10;
export const PK_RESULT_INITIATOR_WIN = 30;
export const PK_RESULT_OPPONENT_WIN = 40;
export const PK_RESULT_DRAW = 50;
export const PK_RESULT_CANCELED = 90;

export type GuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  end_time: Date | string;
  created_at: Date | string | null;
  creator_id: number | string;
  creator_name: string | null;
  category_id: number | string | null;
  category: string | null;
  guess_image_url: string | null;
  product_id: number | string | null;
  product_name: string | null;
  brand_name: string | null;
  product_img: string | null;
  product_price: number | string | null;
  product_guess_price: number | string | null;
};

export type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds?: number | string;
  is_result: number | boolean;
};

export type GuessVoteRow = {
  guess_id: number | string;
  option_index: number | string;
  vote_count: number | string;
};

export type FriendGuessRow = {
  guess_id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  end_time: Date | string;
  creator_id: number | string;
  inviter_id: number | string | null;
  inviter_name: string | null;
  inviter_phone: string | null;
  product_name: string | null;
  invitation_count: number | string | null;
  pending_count: number | string | null;
  accepted_count: number | string | null;
  rejected_count: number | string | null;
  expired_count: number | string | null;
  confirm_count: number | string | null;
  reject_confirm_count: number | string | null;
  bet_participant_count: number | string | null;
  total_paid_amount: number | string | null;
  payment_mode: number | string | null;
  paid_by: number | string | null;
};

export type PkMatchRow = {
  id: number | string;
  guess_id: number | string;
  guess_title: string;
  guess_status: number | string;
  review_status: number | string;
  initiator_id: number | string;
  initiator_name: string | null;
  initiator_phone: string | null;
  opponent_id: number | string;
  opponent_name: string | null;
  opponent_phone: string | null;
  initiator_choice_idx: number | string | null;
  opponent_choice_idx: number | string | null;
  stake_amount: number | string | null;
  result: number | string;
  reward_type: number | string | null;
  reward_value: number | string | null;
  reward_ref_id: number | string | null;
  created_at: Date | string;
  settled_at: Date | string | null;
  product_name: string | null;
};

type GuessCategoryRow = {
  id: number | string;
  status: number | string;
  biz_type: number | string;
};

type CreateGuessProductRow = {
  id: number | string;
  shop_id: number | string | null;
  image_url: string | null;
  status: number | string;
  stock: number | string | null;
  frozen_stock: number | string | null;
  shop_status: number | string | null;
  brand_status: number | string | null;
  brand_product_status: number | string | null;
};

export type GuessReviewRow = {
  id: number | string;
  status: number | string;
  review_status: number | string;
};

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function toOptionalNumber(value: number | string | null | undefined) {
  return value == null ? null : Number(value);
}

export function toStringId(value: number | string | null | undefined) {
  return toEntityId(value ?? 0);
}

export function toOptionalStringId(value: number | string | null | undefined) {
  return toOptionalEntityId(value);
}

export function toIsoString(value: Date | string) {
  return new Date(value).toISOString();
}

export function fallbackUserName(
  name: string | null,
  phoneNumber: string | null,
  userId: number | string | null | undefined,
) {
  if (name?.trim()) {
    return name.trim();
  }

  if (phoneNumber) {
    return `用户${String(phoneNumber).slice(-4)}`;
  }

  if (userId != null) {
    return `用户${String(userId)}`;
  }

  return '未知用户';
}

export function mapGuessStatus(code: number | string): GuessSummary['status'] {
  const value = Number(code ?? 0);
  if (value === GUESS_DRAFT) return 'draft';
  if (value === GUESS_PENDING_REVIEW) return 'pending_review';
  if (value === GUESS_ACTIVE) return 'active';
  if (value === GUESS_PENDING_SETTLE) return 'pending_settle';
  if (value === GUESS_SETTLED) return 'settled';
  if (value === GUESS_ABANDONED) return 'abandoned';
  if (value === GUESS_REJECTED) return 'cancelled';
  return 'active';
}

export function mapGuessReviewStatus(code: number | string): GuessSummary['reviewStatus'] {
  const value = Number(code ?? 0);
  if (value === REVIEW_PENDING) {
    return 'pending';
  }
  if (value === REVIEW_APPROVED) {
    return 'approved';
  }
  return 'rejected';
}

export function normalizeGuessReviewStatus(status: string | null | undefined) {
  if (status === 'approved' || status === 'rejected') {
    return status;
  }

  throw new Error('审核状态不合法');
}

export function normalizeGuessOptionTexts(optionTexts: string[]) {
  const normalized = optionTexts.map((item) => item.trim()).filter((item) => item.length > 0);

  if (normalized.length < 2) {
    throw new Error('至少填写两个有效选项');
  }

  const uniqueCount = new Set(normalized.map((item) => item.toLowerCase())).size;
  if (uniqueCount !== normalized.length) {
    throw new Error('竞猜选项不能重复');
  }

  return normalized;
}

export function normalizeCreateGuessEndTime(endTime: string) {
  const value = endTime.trim();
  if (!value) {
    throw new Error('请设置截止时间');
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('截止时间不合法');
  }

  if (parsed.getTime() <= Date.now()) {
    throw new Error('截止时间必须晚于当前时间');
  }

  return parsed;
}

export async function requireActiveGuessCategory(categoryId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, status, biz_type
      FROM category
      WHERE id = ?
      LIMIT 1
    `,
    [categoryId],
  );

  const category = (rows[0] as GuessCategoryRow | undefined) ?? null;
  if (!category || toNumber(category.biz_type) !== 40) {
    throw new Error('竞猜分类不存在');
  }

  if (toNumber(category.status) !== 10) {
    throw new Error('竞猜分类未启用');
  }

  return category;
}

export async function requireGuessProductForCreate(productId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.shop_id,
        bp.default_img AS image_url,
        p.status,
        bp.stock,
        bp.frozen_stock,
        s.status AS shop_status,
        b.status AS brand_status,
        bp.status AS brand_product_status
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [productId],
  );

  const product = (rows[0] as CreateGuessProductRow | undefined) ?? null;
  if (!product) {
    throw new Error('关联商品不存在');
  }

  if (toNumber(product.status) !== 10) {
    throw new Error('关联商品不可用于创建竞猜');
  }

  if (product.shop_status != null && toNumber(product.shop_status) !== 10) {
    throw new Error('关联商品所属店铺不可用于创建竞猜');
  }

  if (product.brand_status != null && toNumber(product.brand_status) !== 10) {
    throw new Error('关联商品所属品牌不可用于创建竞猜');
  }

  if (product.brand_product_status != null && toNumber(product.brand_product_status) !== 10) {
    throw new Error('关联商品所属品牌商品不可用于创建竞猜');
  }

  if (toNumber(product.stock) - toNumber(product.frozen_stock) <= 0) {
    throw new Error('关联商品可用库存不足');
  }

  return product;
}

export function normalizeGuessRejectReason(
  status: 'approved' | 'rejected',
  rejectReason: string | null | undefined,
) {
  const value = rejectReason?.trim() ?? '';
  if (status === 'rejected' && !value) {
    throw new Error('请填写拒绝原因');
  }

  return value ? value.slice(0, 200) : null;
}

export function ensureGuessPendingReview(row: GuessReviewRow) {
  if (
    Number(row.status ?? 0) !== GUESS_PENDING_REVIEW ||
    Number(row.review_status ?? 0) !== REVIEW_PENDING
  ) {
    throw new Error('竞猜当前不可审核');
  }
}

function buildProductSummary(row: GuessRow): ProductSummary {
  return {
    id: toStringId(row.product_id),
    name: row.product_name || '未命名商品',
    brand: row.brand_name || '未知品牌',
    img: row.product_img || '',
    price: toNumber(row.product_price) / 100,
    guessPrice: toNumber(row.product_guess_price ?? row.product_price) / 100,
    category: row.category || '未分类',
    status: 'active',
  };
}

function buildVoteCountMap(voteRows: GuessVoteRow[]) {
  const map = new Map<string, number>();

  for (const row of voteRows) {
    map.set(`${String(row.guess_id)}:${Number(row.option_index)}`, toNumber(row.vote_count));
  }

  return map;
}

export function groupRowsByGuess<T extends { guess_id: number | string }>(rows: T[]) {
  const map = new Map<string, T[]>();

  for (const row of rows) {
    const guessId = String(row.guess_id);
    const current = map.get(guessId) || [];
    current.push(row);
    map.set(guessId, current);
  }

  return map;
}

export function buildGuessSummary(
  row: GuessRow,
  options: GuessOptionRow[],
  voteCountMap: Map<string, number>,
  participantCount = 0,
  paidAmount = 0,
): GuessSummary {
  return {
    id: toEntityId(row.id),
    title: row.title,
    status: mapGuessStatus(row.status),
    reviewStatus: mapGuessReviewStatus(row.review_status),
    categoryId: toOptionalStringId(row.category_id),
    category: row.category || '未分类',
    imageUrl: row.guess_image_url ?? null,
    endTime: toIsoString(row.end_time),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    creatorId: toEntityId(row.creator_id),
    creatorName: row.creator_name ?? null,
    product: buildProductSummary(row),
    participantCount,
    paidAmount,
    options: options.map((option) => ({
      id: `${String(row.id)}-${Number(option.option_index)}`,
      optionIndex: Number(option.option_index),
      optionText: option.option_text,
      odds: Number(option.odds ?? 1),
      voteCount: voteCountMap.get(`${String(row.id)}:${Number(option.option_index)}`) ?? 0,
      isResult: Boolean(option.is_result),
    })),
  };
}

export async function getGuessRows() {
  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.created_at,
        g.creator_id,
        COALESCE(
          au.display_name,
          au.username,
          up.name,
          IF(u.phone_number IS NOT NULL, CONCAT('用户', RIGHT(u.phone_number, 4)), NULL),
          CONCAT('用户', g.creator_id)
        ) AS creator_name,
        COALESCE(g.category_id, bp.category_id) AS category_id,
        g.image_url AS guess_image_url,
        COALESCE(gc.name, pc.name) AS category,
        p.id AS product_id,
        bp.name AS product_name,
        b.name AS brand_name,
        bp.default_img AS product_img,
        bp.guide_price AS product_price,
        bp.guide_price AS product_guess_price
      FROM guess g
      LEFT JOIN admin_user au ON au.id = g.creator_id
      LEFT JOIN user u ON u.id = g.creator_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category gc ON gc.id = g.category_id
      LEFT JOIN category pc ON pc.id = bp.category_id
      ORDER BY g.created_at DESC, g.id DESC
    `,
  );

  return rows as GuessRow[];
}

export async function getGuessOptionRows(guessIds: string[]) {
  if (guessIds.length === 0) {
    return [] as GuessOptionRow[];
  }

  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      FROM guess_option
      WHERE guess_id IN (?)
      ORDER BY guess_id ASC, option_index ASC
    `,
    [guessIds],
  );

  return rows as GuessOptionRow[];
}

export async function getGuessVoteRows(guessIds: string[]) {
  if (guessIds.length === 0) {
    return [] as GuessVoteRow[];
  }

  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        guess_id,
        choice_idx AS option_index,
        COUNT(*) AS vote_count
      FROM guess_bet
      WHERE guess_id IN (?)
        AND pay_status = ?
      GROUP BY guess_id, choice_idx
    `,
    [guessIds, PAY_STATUS_PAID],
  );

  return rows as GuessVoteRow[];
}

export async function getGuessParticipantCounts(guessIds: string[]) {
  const map = new Map<string, number>();
  if (guessIds.length === 0) {
    return map;
  }

  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        guess_id,
        COUNT(DISTINCT user_id) AS participant_count
      FROM guess_bet
      WHERE guess_id IN (?)
        AND pay_status = ?
      GROUP BY guess_id
    `,
    [guessIds, PAY_STATUS_PAID],
  );

  for (const row of rows as Array<{ guess_id: number | string; participant_count: number | string }>) {
    map.set(String(row.guess_id), Number(row.participant_count ?? 0));
  }

  return map;
}

export async function getGuessPaidAmounts(guessIds: string[]) {
  const map = new Map<string, number>();
  if (guessIds.length === 0) {
    return map;
  }

  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        guess_id,
        COALESCE(SUM(amount), 0) AS paid_amount
      FROM guess_bet
      WHERE guess_id IN (?)
        AND pay_status = ?
      GROUP BY guess_id
    `,
    [guessIds, PAY_STATUS_PAID],
  );

  for (const row of rows as Array<{ guess_id: number | string; paid_amount: number | string }>) {
    map.set(String(row.guess_id), Number(row.paid_amount ?? 0));
  }

  return map;
}

export async function getOptionTextMap(guessIds: string[]) {
  const optionRows = await getGuessOptionRows(guessIds);
  const optionTextMap = new Map<string, string>();

  for (const option of optionRows) {
    optionTextMap.set(`${String(option.guess_id)}:${Number(option.option_index)}`, option.option_text);
  }

  return optionTextMap;
}

export function buildVoteCountLookup(voteRows: GuessVoteRow[]) {
  return buildVoteCountMap(voteRows);
}
