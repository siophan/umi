import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';
import {
  toEntityId,
  toOptionalEntityId,
  type GuessSummary,
  type ProductFeedItem,
  type ProductSummary,
  type SearchHotKeywordItem,
  type SearchHotResult,
  type SearchResult,
  type SearchSort,
  type SearchSuggestItem,
  type SearchSuggestResult,
  type SearchTab,
} from '@umi/shared';

import { getRequestUser, optionalUser } from '../../lib/auth';
import { HttpError, asyncHandler } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';

export const searchRouter: ExpressRouter = Router();

const PRODUCT_CATEGORY_BIZ_TYPE = 30;
const PRODUCT_INTERACTION_FAVORITE = 10;
const GUESS_REVIEW_APPROVED = 30;
const GUESS_PENDING_REVIEW = 20;
const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const SEARCH_LIMIT_DEFAULT = 12;
const SEARCH_LIMIT_MAX = 50;

type ProductRow = {
  id: number | string;
  name: string;
  price: number | string;
  original_price: number | string | null;
  guess_price: number | string | null;
  image_url: string | null;
  images: string | null;
  tags: string | null;
  sales?: number | string | null;
  rating?: number | string | null;
  stock: number | string | null;
  collab?: string | null;
  status: number | string;
  shop_name: string | null;
  brand_name: string | null;
  category_id: number | string | null;
  category: string | null;
  default_img?: string | null;
  created_at?: Date | string;
  favorited?: number | string | boolean | null;
};

type GuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  review_status: number | string;
  end_time: Date | string;
  creator_id: number | string;
  category: string | null;
  product_id: number | string | null;
  product_name: string | null;
  brand_name: string | null;
  product_img: string | null;
  product_price: number | string | null;
  product_guess_price: number | string | null;
  vote_total?: number | string | null;
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

function safeJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function isRecentProduct(createdAt?: Date | string) {
  if (!createdAt) {
    return false;
  }
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? false : Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 30;
}

function buildFeedTag(
  sourceTags: string[],
  details: {
    discountAmount: number;
    guessPrice: number;
    price: number;
    sales: number;
    isNew: boolean;
    collab: string | null | undefined;
  },
) {
  const preferredTag = sourceTags.find((item) => item.trim());
  if (preferredTag) return preferredTag.trim();
  if (details.collab) return '联名';
  if (details.discountAmount >= 10) return '特惠';
  if (details.isNew) return '新品';
  if (details.guessPrice < details.price) return '竞猜';
  if (details.sales > 0) return '爆款';
  return '优选';
}

function buildFeedMiniTag(
  tag: string,
  discountAmount: number,
  guessPrice: number,
  price: number,
  isNew: boolean,
  collab: string | null | undefined,
) {
  if (collab || tag.includes('联名') || tag.includes('限定')) return 'mt-limit';
  if (discountAmount >= 10 || tag.includes('特惠') || tag.includes('折扣')) return 'mt-sale';
  if (isNew || tag.includes('新品') || tag.includes('上新')) return 'mt-new';
  if (guessPrice < price || tag.includes('竞猜')) return 'mt-guess';
  return 'mt-hot';
}

/**
 * 把搜索结果里的商品行统一映射成商城 feed 结构。
 * 这里沿用商城页的展示派生规则，保证搜索商品卡和商城卡片口径一致。
 */
function sanitizeProductFeedItem(row: ProductRow, index: number): ProductFeedItem {
  const price = Number(row.price ?? 0) / 100;
  const originalPrice = Number(row.original_price ?? row.price ?? 0) / 100;
  const guessPrice = Number(row.guess_price ?? row.price ?? 0) / 100;
  const discountAmount = Math.max(0, originalPrice - price);
  const tags = safeJsonArray(row.tags);
  const isNew = isRecentProduct(row.created_at);
  const sales = Math.max(0, Number(row.sales ?? 0));
  const tag = buildFeedTag(tags, {
    discountAmount,
    guessPrice,
    price,
    sales,
    isNew,
    collab: row.collab,
  });

  return {
    id: toEntityId(row.id),
    name: row.name,
    categoryId: toOptionalEntityId(row.category_id),
    category: row.category || '未分类',
    price,
    originalPrice,
    discountAmount,
    sales,
    rating: Number(row.rating ?? 0),
    stock: Math.max(0, Number(row.stock ?? 0)),
    img: row.image_url || safeJsonArray(row.images)[0] || row.default_img || '',
    tag,
    miniTag: buildFeedMiniTag(tag, discountAmount, guessPrice, price, isNew, row.collab),
    height: 178 + (index % 4) * 14,
    brand: row.brand_name || '未知品牌',
    guessPrice,
    status: Number(row.status ?? 0) === 10 ? 'active' : String(row.status),
    shopName: row.shop_name || null,
    tags,
    collab: row.collab || null,
    isNew,
    favorited: Boolean(row.favorited),
  };
}

function mapGuessStatus(code: number | string): GuessSummary['status'] {
  const value = Number(code ?? 0);
  if (value === 10) return 'draft';
  if (value === 20) return 'pending_review';
  if (value === 40) return 'settled';
  if (value === 90) return 'cancelled';
  return 'active';
}

function mapGuessReviewStatus(code: number | string): GuessSummary['reviewStatus'] {
  const value = Number(code ?? 0);
  if (value === 10) return 'pending';
  if (value === GUESS_REVIEW_APPROVED) return 'approved';
  return 'rejected';
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

  return {
    id: toEntityId(row.id),
    title: row.title,
    status: mapGuessStatus(row.status),
    reviewStatus: mapGuessReviewStatus(row.review_status),
    category: row.category || '热门',
    endTime: new Date(row.end_time).toISOString(),
    creatorId: toEntityId(row.creator_id),
    product,
    options: options.map((option) => ({
      id: `${String(row.id)}-${Number(option.option_index)}`,
      optionIndex: Number(option.option_index),
      optionText: option.option_text,
      odds: Number(option.odds ?? 1),
      voteCount:
        Number(
          voteRows.find(
            (vote) =>
              String(vote.guess_id) === String(row.id) &&
              Number(vote.option_index) === Number(option.option_index),
          )?.vote_count ?? 0,
        ),
      isResult: Boolean(option.is_result),
    })),
  };
}

async function getFavoritedProductIdSet(userId: string, productIds: string[]) {
  if (!productIds.length) return new Set<string>();
  const db = getDbPool();
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT product_id
      FROM product_interaction
      WHERE user_id = ?
        AND interaction_type = ?
        AND product_id IN (${placeholders})
    `,
    [userId, PRODUCT_INTERACTION_FAVORITE, ...productIds],
  );
  return new Set((rows as Array<{ product_id: number | string }>).map((row) => toEntityId(row.product_id)));
}

/**
 * 商品搜索主查询。
 * 搜索命中范围固定在商品名、品牌、分类和店铺名，不从前端当前结果里再做二次假筛选。
 */
async function searchProducts(
  query: string,
  sort: SearchSort,
  limit: number,
  userId?: string,
): Promise<SearchResult['products']> {
  const db = getDbPool();
  const like = `%${query}%`;
  const whereClauses = [
    'p.status = 10',
    '(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR s.name LIKE ?)',
  ];
  const countParams: Array<string | number> = [like, like, like, like];
  const orderBy =
    sort === 'price-asc'
      ? 'COALESCE(p.price, 0) ASC, p.created_at DESC, p.id DESC'
      : sort === 'price-desc'
        ? 'COALESCE(p.price, 0) DESC, p.created_at DESC, p.id DESC'
        : sort === 'rating'
          ? 'COALESCE(p.rating, 0) DESC, COALESCE(p.sales, 0) DESC, p.id DESC'
          : 'COALESCE(p.sales, 0) DESC, p.created_at DESC, p.id DESC';
  const [countRows, rows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
        WHERE ${whereClauses.join(' AND ')}
      `,
      countParams,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.name,
          p.price,
          p.original_price,
          p.guess_price,
          p.image_url,
          p.images,
          p.tags,
          p.sales,
          p.rating,
          p.stock,
          p.collab,
          p.status,
          p.created_at,
          s.name AS shop_name,
          bp.default_img,
          bp.category_id,
          b.name AS brand_name,
          c.name AS category
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id AND c.biz_type = ${PRODUCT_CATEGORY_BIZ_TYPE}
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT ?
      `,
      [...countParams, limit],
    ),
  ]);

  const resultRows = rows[0] as ProductRow[];
  const productIds = resultRows.map((row) => toEntityId(row.id));
  const favoritedProductIds = userId ? await getFavoritedProductIdSet(userId, productIds) : new Set<string>();
  return {
    total: Number((countRows[0] as mysql.RowDataPacket[])[0]?.total ?? 0),
    items: resultRows.map((row, index) =>
      sanitizeProductFeedItem(
        { ...row, favorited: favoritedProductIds.has(toEntityId(row.id)) ? 1 : 0 },
        index,
      ),
    ),
  };
}

/**
 * 竞猜搜索需要补齐选项和投票数，避免列表页再逐条发请求拼竞猜摘要。
 */
async function getGuessOptionsAndVotes(guessIds: string[]) {
  if (!guessIds.length) {
    return {
      optionsByGuess: new Map<string, GuessOptionRow[]>(),
      votesByGuess: new Map<string, GuessVoteRow[]>(),
    };
  }
  const db = getDbPool();
  const [optionRows, voteRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, option_index, option_text, odds, is_result
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `,
      [guessIds],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id, choice_idx
      `,
      [guessIds],
    ),
  ]);

  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const option of optionRows[0] as GuessOptionRow[]) {
    const key = String(option.guess_id);
    const current = optionsByGuess.get(key) || [];
    current.push(option);
    optionsByGuess.set(key, current);
  }

  const votesByGuess = new Map<string, GuessVoteRow[]>();
  for (const vote of voteRows[0] as GuessVoteRow[]) {
    const key = String(vote.guess_id);
    const current = votesByGuess.get(key) || [];
    current.push(vote);
    votesByGuess.set(key, current);
  }

  return { optionsByGuess, votesByGuess };
}

/**
 * 竞猜搜索只返回已审核且仍可展示的竞猜，和用户端其他竞猜列表的可见性口径保持一致。
 */
async function searchGuesses(query: string, limit: number): Promise<SearchResult['guesses']> {
  const db = getDbPool();
  const like = `%${query}%`;
  const params = [GUESS_REVIEW_APPROVED, GUESS_PENDING_REVIEW, GUESS_ACTIVE, GUESS_SETTLED, like, like, like, like];
  const [countRows, rows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(DISTINCT g.id) AS total
        FROM guess g
        LEFT JOIN guess_product gp ON gp.guess_id = g.id
        LEFT JOIN product p ON p.id = gp.product_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
          AND (g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)
      `,
      params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          g.id,
          g.title,
          g.status,
          g.review_status,
          g.end_time,
          g.creator_id,
          c.name AS category,
          p.id AS product_id,
          p.name AS product_name,
          b.name AS brand_name,
          COALESCE(p.image_url, bp.default_img) AS product_img,
          p.price AS product_price,
          p.guess_price AS product_guess_price,
          COUNT(gb.id) AS vote_total
        FROM guess g
        LEFT JOIN guess_product gp ON gp.guess_id = g.id
        LEFT JOIN product p ON p.id = gp.product_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        LEFT JOIN guess_bet gb ON gb.guess_id = g.id
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
          AND (g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)
        GROUP BY
          g.id,
          g.title,
          g.status,
          g.review_status,
          g.end_time,
          g.creator_id,
          c.name,
          p.id,
          p.name,
          b.name,
          COALESCE(p.image_url, bp.default_img),
          p.price,
          p.guess_price
        ORDER BY vote_total DESC, g.created_at DESC, g.id DESC
        LIMIT ?
      `,
      [...params, limit],
    ),
  ]);

  const resultRows = rows[0] as GuessRow[];
  const guessIds = resultRows.map((row) => String(row.id));
  const { optionsByGuess, votesByGuess } = await getGuessOptionsAndVotes(guessIds);
  return {
    total: Number((countRows[0] as mysql.RowDataPacket[])[0]?.total ?? 0),
    items: resultRows.map((row) =>
      buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], votesByGuess.get(String(row.id)) || []),
    ),
  };
}

/**
 * 热搜目前没有独立统计表，先用商品销量和竞猜参与热度混排，后续再替换成真实搜索统计源。
 */
async function getHotSearches(limit: number): Promise<SearchHotResult> {
  const db = getDbPool();
  const [productRows, guessRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT p.name AS keyword, COALESCE(p.sales, 0) AS score
        FROM product p
        WHERE p.status = 10
        ORDER BY COALESCE(p.sales, 0) DESC, p.created_at DESC, p.id DESC
        LIMIT 6
      `,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT g.title AS keyword, COUNT(gb.id) AS score
        FROM guess g
        LEFT JOIN guess_bet gb ON gb.guess_id = g.id
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
        GROUP BY g.id, g.title, g.created_at
        ORDER BY score DESC, g.created_at DESC, g.id DESC
        LIMIT 4
      `,
      [GUESS_REVIEW_APPROVED, GUESS_PENDING_REVIEW, GUESS_ACTIVE, GUESS_SETTLED],
    ),
  ]);

  const merged = [
    ...(productRows[0] as Array<{ keyword: string; score: number | string }>).map((row) => ({
      keyword: row.keyword,
      score: Number(row.score ?? 0),
      source: 'product' as const,
    })),
    ...(guessRows[0] as Array<{ keyword: string; score: number | string }>).map((row) => ({
      keyword: row.keyword,
      score: Number(row.score ?? 0),
      source: 'guess' as const,
    })),
  ]
    .filter((item) => item.keyword?.trim())
    .sort((left, right) => right.score - left.score)
    .filter((item, index, array) => array.findIndex((candidate) => candidate.keyword === item.keyword) === index)
    .slice(0, limit);

  const items: SearchHotKeywordItem[] = merged.map((item, index) => ({
    keyword: item.keyword,
    rank: index + 1,
    badge: index < 2 ? '热' : index < 4 ? '新' : index === 4 ? '↑' : '',
    source: item.source,
  }));
  return { items };
}

/**
 * 联想词同时覆盖商品、品牌和竞猜，前端按 type 区分展示，不再额外猜测来源。
 */
async function getSearchSuggestions(query: string, limit: number): Promise<SearchSuggestResult> {
  const keyword = query.trim();
  if (!keyword) {
    return { query: '', items: [] };
  }

  const db = getDbPool();
  const prefixLike = `${keyword}%`;
  const containsLike = `%${keyword}%`;
  const [productRows, brandRows, guessRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT p.name AS text
        FROM product p
        WHERE p.status = 10
          AND p.name LIKE ?
        ORDER BY
          CASE WHEN p.name LIKE ? THEN 0 ELSE 1 END ASC,
          COALESCE(p.sales, 0) DESC,
          p.created_at DESC,
          p.id DESC
        LIMIT ?
      `,
      [containsLike, prefixLike, limit],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT DISTINCT b.name AS text
        FROM brand b
        WHERE b.name LIKE ?
        ORDER BY CASE WHEN b.name LIKE ? THEN 0 ELSE 1 END ASC, b.name ASC
        LIMIT ?
      `,
      [containsLike, prefixLike, limit],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT g.title AS text
        FROM guess g
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
          AND g.title LIKE ?
        ORDER BY
          CASE WHEN g.title LIKE ? THEN 0 ELSE 1 END ASC,
          g.created_at DESC,
          g.id DESC
        LIMIT ?
      `,
      [
        GUESS_REVIEW_APPROVED,
        GUESS_PENDING_REVIEW,
        GUESS_ACTIVE,
        GUESS_SETTLED,
        containsLike,
        prefixLike,
        limit,
      ],
    ),
  ]);

  const items = [
    ...(productRows[0] as Array<{ text: string }>).map((row) => ({ text: row.text, type: 'product' as const })),
    ...(brandRows[0] as Array<{ text: string }>).map((row) => ({ text: row.text, type: 'brand' as const })),
    ...(guessRows[0] as Array<{ text: string }>).map((row) => ({ text: row.text, type: 'guess' as const })),
  ]
    .filter((item) => item.text?.trim())
    .filter((item, index, array) => array.findIndex((candidate) => candidate.text === item.text) === index)
    .slice(0, limit) as SearchSuggestItem[];

  return {
    query: keyword,
    items,
  };
}

searchRouter.get(
  '/',
  optionalUser,
  asyncHandler(async (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    if (!query) {
      throw new HttpError(400, 'SEARCH_QUERY_REQUIRED', '缺少搜索关键词');
    }
    const tab =
      request.query.tab === 'product' || request.query.tab === 'guess' || request.query.tab === 'all'
        ? (request.query.tab as SearchTab)
        : 'all';
    const sort =
      request.query.sort === 'sales' ||
      request.query.sort === 'price-asc' ||
      request.query.sort === 'price-desc' ||
      request.query.sort === 'rating' ||
      request.query.sort === 'default'
        ? (request.query.sort as SearchSort)
        : 'default';
    const rawLimit = typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), SEARCH_LIMIT_MAX)
      : SEARCH_LIMIT_DEFAULT;
    const user = request.user ? getRequestUser(request) : null;

    const [products, guesses] = await Promise.all([
      tab === 'guess' ? Promise.resolve({ items: [], total: 0 }) : searchProducts(query, sort, limit, user?.id),
      tab === 'product' ? Promise.resolve({ items: [], total: 0 }) : searchGuesses(query, limit),
    ]);

    ok(response, {
      query,
      tab,
      sort,
      products,
      guesses,
    } satisfies SearchResult);
  }),
);

searchRouter.get(
  '/hot',
  asyncHandler(async (request, response) => {
    const rawLimit = typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
    ok(response, await getHotSearches(limit));
  }),
);

searchRouter.get(
  '/suggest',
  asyncHandler(async (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const rawLimit = typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
    ok(response, await getSearchSuggestions(query, limit));
  }),
);
