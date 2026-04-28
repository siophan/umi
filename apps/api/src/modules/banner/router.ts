import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';
import type { BannerListResult, GuessSummary, ProductSummary } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError, asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';

export const bannerRouter: ExpressRouter = Router();

const ALLOWED_POSITIONS = ['home_hero', 'mall_hero', 'mall_banner'] as const;
const BANNER_ACTIVE = 10;

const TARGET_GUESS = 10;
const TARGET_POST = 20;
const TARGET_PRODUCT = 30;
const TARGET_SHOP = 40;
const TARGET_PAGE = 50;
const TARGET_EXTERNAL = 90;
const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const GUESS_REJECTED = 90;
const GUESS_DRAFT = 10;
const GUESS_PENDING_REVIEW = 20;
const GUESS_SCOPE_PUBLIC = 10;
const REVIEW_PENDING = 10;
const REVIEW_APPROVED = 30;

type BannerRow = {
  id: number | string;
  position: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  target_type: number | string | null;
  target_id: number | string | null;
  action_url: string | null;
  sort: number | string | null;
};

type GuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  end_time: Date | string | null;
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

type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds?: number | string;
  is_result: number | boolean;
};

type GuessVoteRow = {
  guess_id: number | string;
  option_index: number | string;
  vote_count: number | string;
};

function mapGuessStatus(code: number | string): GuessSummary['status'] {
  const value = Number(code ?? 0);
  if (value === GUESS_DRAFT) {
    return 'draft';
  }
  if (value === GUESS_PENDING_REVIEW) {
    return 'pending_review';
  }
  if (value === GUESS_SETTLED) {
    return 'settled';
  }
  if (value === GUESS_REJECTED) {
    return 'cancelled';
  }
  return 'active';
}

function mapGuessReviewStatus(code: number | string): GuessSummary['reviewStatus'] {
  return Number(code ?? 0) === REVIEW_PENDING
    ? 'pending'
    : Number(code ?? 0) === REVIEW_APPROVED
      ? 'approved'
      : 'rejected';
}

function mapTargetType(code: number | string | null): BannerListResult['items'][number]['targetType'] {
  const value = Number(code ?? 0);
  if (value === TARGET_GUESS) {
    return 'guess';
  }
  if (value === TARGET_POST) {
    return 'post';
  }
  if (value === TARGET_PRODUCT) {
    return 'product';
  }
  if (value === TARGET_SHOP) {
    return 'shop';
  }
  if (value === TARGET_PAGE) {
    return 'page';
  }
  return 'external';
}

function buildTargetPath(
  targetType: BannerListResult['items'][number]['targetType'],
  targetId: string | null,
  actionUrl: string | null,
) {
  if (targetType === 'external' || targetType === 'page') {
    return actionUrl;
  }
  if (!targetId) {
    return actionUrl;
  }
  if (targetType === 'guess') {
    return `/guess/${targetId}`;
  }
  if (targetType === 'post') {
    return `/post/${targetId}`;
  }
  if (targetType === 'product') {
    return `/product/${targetId}`;
  }
  if (targetType === 'shop') {
    return `/shop/${targetId}`;
  }
  return actionUrl;
}

function buildGuessSummary(
  row: GuessRow,
  options: GuessOptionRow[],
  voteRows: GuessVoteRow[],
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

  return {
    id: toEntityId(row.id),
    title: row.title,
    status: mapGuessStatus(row.status),
    reviewStatus: mapGuessReviewStatus(row.review_status),
    categoryId: row.category_id == null ? null : toEntityId(row.category_id),
    category: row.category || '热门',
    endTime: row.end_time ? new Date(row.end_time).toISOString() : new Date().toISOString(),
    creatorId: toEntityId(row.creator_id),
    product,
    options: options.map((option) => ({
      id: `${String(row.id)}-${Number(option.option_index)}`,
      optionIndex: Number(option.option_index),
      optionText: option.option_text,
      odds: Number(option.odds ?? 1),
      voteCount: voteCountByOption.get(Number(option.option_index)) ?? 0,
      isResult: Boolean(option.is_result),
    })),
  };
}

async function getGuessSummaries(guessIds: string[]) {
  if (guessIds.length === 0) {
    return new Map<string, GuessSummary>();
  }

  const db = getDbPool();
  const [guessRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        g.category_id,
        c.name AS category,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name,
        COALESCE(p.image_url, bp.default_img, g.image_url) AS product_img,
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
      WHERE g.id IN (?)
        AND g.status = ?
        AND g.review_status = ?
        AND g.scope = ?
        AND g.end_time > NOW()
    `,
    [guessIds, GUESS_ACTIVE, REVIEW_APPROVED, GUESS_SCOPE_PUBLIC],
  );

  const [optionRows] = await db.query<mysql.RowDataPacket[]>(
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

  const [voteRows] = await db.query<mysql.RowDataPacket[]>(
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

  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const row of optionRows as GuessOptionRow[]) {
    const key = String(row.guess_id);
    const current = optionsByGuess.get(key) || [];
    current.push(row);
    optionsByGuess.set(key, current);
  }

  const votesByGuess = new Map<string, GuessVoteRow[]>();
  for (const row of voteRows as GuessVoteRow[]) {
    const key = String(row.guess_id);
    const current = votesByGuess.get(key) || [];
    current.push(row);
    votesByGuess.set(key, current);
  }

  return new Map(
    (guessRows as GuessRow[]).map((row) => [
      String(row.id),
      buildGuessSummary(
        row,
        optionsByGuess.get(String(row.id)) || [],
        votesByGuess.get(String(row.id)) || [],
      ),
    ]),
  );
}

bannerRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const position = typeof request.query.position === 'string' ? request.query.position.trim() : '';
    if (position && !ALLOWED_POSITIONS.includes(position as (typeof ALLOWED_POSITIONS)[number])) {
      throw new HttpError(400, 'INVALID_POSITION', `position 仅支持 ${ALLOWED_POSITIONS.join(', ')}`);
    }
    const limit = Math.min(Math.max(Number(request.query.limit ?? 5) || 5, 1), 10);
    const db = getDbPool();
    const params: Array<string | number> = [BANNER_ACTIVE];
    const positionSql = position ? 'AND position = ?' : '';

    if (position) {
      params.push(position);
    }
    params.push(limit);

    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          id,
          position,
          title,
          subtitle,
          image_url,
          target_type,
          target_id,
          action_url,
          sort
        FROM banner
        WHERE status = ?
          ${positionSql}
          AND (start_at IS NULL OR start_at <= CURRENT_TIMESTAMP(3))
          AND (end_at IS NULL OR end_at >= CURRENT_TIMESTAMP(3))
        ORDER BY sort DESC, created_at DESC, id DESC
        LIMIT ?
      `,
      params,
    );

    const bannerRows = rows as BannerRow[];
    const guessMap = await getGuessSummaries(
      bannerRows
        .filter((row) => Number(row.target_type ?? 0) === TARGET_GUESS && row.target_id != null)
        .map((row) => String(row.target_id)),
    );

    ok(response, {
      items: bannerRows.map((row) => {
        const targetType = mapTargetType(row.target_type);
        const targetId = row.target_id == null ? null : String(row.target_id);
        return {
          id: toEntityId(row.id),
          position: row.position,
          title: row.title,
          subtitle: row.subtitle,
          imageUrl: row.image_url,
          targetType,
          targetId: targetId ? toEntityId(targetId) : null,
          actionUrl: row.action_url,
          sort: Number(row.sort ?? 0),
          targetPath: buildTargetPath(targetType, targetId, row.action_url),
          guess: targetId ? guessMap.get(targetId) ?? null : null,
        };
      }),
    } satisfies BannerListResult);
  }),
);
