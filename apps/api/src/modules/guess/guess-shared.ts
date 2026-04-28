import type mysql from 'mysql2/promise';

import { toEntityId, type GuessSummary, type ProductSummary } from '@umi/shared';

import { getDbPool } from '../../lib/db';

export const GUESS_ACTIVE = 30;
export const GUESS_PENDING_SETTLE = 35;
export const GUESS_SETTLED = 40;
export const GUESS_ABANDONED = 80;
export const GUESS_REJECTED = 90;
export const GUESS_DRAFT = 10;
export const GUESS_PENDING_REVIEW = 20;
export const BET_PENDING = 10;
export const BET_WON = 30;
export const BET_LOST = 40;
export const BET_CANCELED = 90;
export const REVIEW_PENDING = 10;
export const REVIEW_APPROVED = 30;

export const GUESS_INTERACTION_FAVORITE = 10;
export const GUESS_INTERACTION_LIKE = 20;
export const COMMENT_TARGET_GUESS = 10;
export const COMMENT_INTERACTION_LIKE = 10;

export type GuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  tags: string | null;
  description: string | null;
  topic_detail: string | null;
  end_time: Date | string;
  created_at: Date | string;
  creator_id: number | string;
  category_id: number | string | null;
  category: string | null;
  product_id: number | string | null;
  product_name: string | null;
  brand_name: string | null;
  product_img: string | null;
  product_price: number | string | null;
  product_guess_price: number | string | null;
};

export type GuessBetRow = {
  id: number | string;
  guess_id: number | string;
  choice_idx: number | string;
  amount: number | string | null;
  status: number | string;
  created_at: Date | string;
  guess_title: string;
  guess_status: number | string;
  guess_scope: number | string;
  guess_end_time: Date | string;
  result_text: string | null;
};

export type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds?: number | string;
  is_result: number | boolean;
};

export type GuessParticipantRow = {
  guess_id: number | string;
  participant_count: number | string;
};

export type GuessVoteRow = {
  guess_id: number | string;
  option_index: number | string;
  vote_count: number | string;
};

export function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function mapGuessStatus(code: number | string): GuessSummary['status'] {
  const value = Number(code ?? 0);
  if (value === GUESS_DRAFT) {
    return 'draft';
  }
  if (value === GUESS_PENDING_REVIEW) {
    return 'pending_review';
  }
  if (value === GUESS_PENDING_SETTLE) {
    return 'pending_settle';
  }
  if (value === GUESS_SETTLED) {
    return 'settled';
  }
  if (value === GUESS_ABANDONED) {
    return 'abandoned';
  }
  if (value === GUESS_REJECTED) {
    return 'cancelled';
  }
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
      GROUP BY guess_id, choice_idx
    `,
    [guessIds],
  );
  return rows as GuessVoteRow[];
}

export function buildGuessSummary(
  row: GuessRow,
  options: GuessOptionRow[],
  voteRows: GuessVoteRow[],
  extras: {
    totalOrders?: number;
    commentCount?: number;
    isFavorited?: boolean;
    userBet?: { choiceIdx: number; betId: string } | null;
  } = {},
): GuessSummary {
  const product: ProductSummary = {
    id: toEntityId(row.product_id ?? 0),
    name: row.product_name || '未命名商品',
    brand: row.brand_name || '未知品牌',
    img: row.product_img || '',
    price: Number(row.product_price ?? 0) / 100,
    guessPrice: Number(row.product_guess_price ?? row.product_price ?? 0) / 100,
    category: row.category || '未分类',
    status: 'active',
  };

  const voteCountByOption = new Map<number, number>();
  for (const vote of voteRows) {
    if (String(vote.guess_id) === String(row.id)) {
      voteCountByOption.set(Number(vote.option_index), Number(vote.vote_count ?? 0));
    }
  }

  const totalVotes = Array.from(voteCountByOption.values()).reduce((sum, count) => sum + count, 0);
  let tags: string[] = [];
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        tags = parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      tags = [];
    }
  }

  const summary: GuessSummary = {
    id: toEntityId(row.id),
    title: row.title,
    status: mapGuessStatus(row.status),
    reviewStatus: mapGuessReviewStatus(row.review_status),
    categoryId: row.category_id == null ? null : toEntityId(row.category_id),
    category: row.category || '热门',
    tags,
    description: row.description,
    topicDetail: row.topic_detail,
    endTime: new Date(row.end_time).toISOString(),
    creatorId: toEntityId(row.creator_id),
    product,
    totalOrders: extras.totalOrders ?? 0,
    options: options.map((option) => ({
      id: `${String(row.id)}-${Number(option.option_index)}`,
      optionIndex: Number(option.option_index),
      optionText: option.option_text,
      odds: Number(option.odds ?? 1),
      voteCount: voteCountByOption.get(Number(option.option_index)) ?? 0,
      isResult: Boolean(option.is_result),
    })),
  };
  if (typeof extras.commentCount === 'number') {
    summary.commentCount = extras.commentCount;
  }
  if (typeof extras.isFavorited === 'boolean') {
    summary.isFavorited = extras.isFavorited;
  }
  if (extras.userBet !== undefined) {
    summary.userBet = extras.userBet
      ? { choiceIdx: extras.userBet.choiceIdx, betId: toEntityId(extras.userBet.betId) }
      : null;
  }
  return summary;
}

export async function getGuessRows(
  whereSql = '',
  params: Array<string | number | Date> = [],
  limit?: number,
) {
  const db = getDbPool();
  const sqlParams = typeof limit === 'number' ? [...params, limit] : params;
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.tags,
        g.description,
        g.topic_detail,
        g.end_time,
        g.created_at,
        g.creator_id,
        g.category_id,
        c.name AS category,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        p.price AS product_price,
        p.guess_price AS product_guess_price
      FROM guess g
      LEFT JOIN (
        SELECT guess_id, MIN(product_id) AS product_id
        FROM guess_product
        GROUP BY guess_id
      ) gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = g.category_id
      ${whereSql}
      ORDER BY g.created_at DESC, g.id DESC
      ${typeof limit === 'number' ? 'LIMIT ?' : ''}
    `,
    sqlParams,
  );

  return rows as GuessRow[];
}

export function getChoiceText(row: GuessBetRow, options: GuessOptionRow[]) {
  return (
    options.find((option) => Number(option.option_index) === Number(row.choice_idx))?.option_text ||
    `选项 ${Number(row.choice_idx) + 1}`
  );
}
