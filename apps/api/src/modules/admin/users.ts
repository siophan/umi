import type mysql from 'mysql2/promise';

import {
  toEntityId,
  toOptionalEntityId,
  type
  AdminUserGuessListResult,
  AdminUserOrderListResult,
  GuessSummary,
  OrderItem,
  OrderSummary,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const GUESS_DRAFT = 10;
const GUESS_PENDING_REVIEW = 20;
const GUESS_SETTLED = 40;
const GUESS_REJECTED = 90;
const REVIEW_PENDING = 10;
const REVIEW_APPROVED = 30;

const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_CLOSED = 40;
const ORDER_REFUNDED = 90;

const FULFILLMENT_PENDING = 10;
const FULFILLMENT_PROCESSING = 20;
const FULFILLMENT_SHIPPED = 30;
const FULFILLMENT_COMPLETED = 40;
const FULFILLMENT_CANCELED = 90;

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

type OrderRow = {
  id: number | string;
  user_id: number | string;
  type: number | string | null;
  guess_id: number | string | null;
  guess_title: string | null;
  amount: number | string | null;
  status: number | string;
  created_at: Date | string;
  item_id: number | string | null;
  product_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  item_amount: number | string | null;
  fulfillment_status: number | string | null;
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
  const value = Number(code ?? 0);
  if (value === REVIEW_PENDING) {
    return 'pending';
  }
  if (value === REVIEW_APPROVED) {
    return 'approved';
  }
  return 'rejected';
}

function buildGuessSummary(
  row: GuessRow,
  options: GuessOptionRow[],
  voteRows: GuessVoteRow[],
): GuessSummary {
  return {
    id: toEntityId(row.id),
    title: row.title,
    status: mapGuessStatus(row.status),
    reviewStatus: mapGuessReviewStatus(row.review_status),
    category: row.category || '未分类',
    endTime: new Date(row.end_time).toISOString(),
    creatorId: toEntityId(row.creator_id),
    product: {
      id: toEntityId(row.product_id ?? 0),
      name: row.product_name || '未命名商品',
      brand: row.brand_name || '未知品牌',
      img: row.product_img || '',
      price: Number(row.product_price ?? 0) / 100,
      guessPrice: Number(row.product_guess_price ?? row.product_price ?? 0) / 100,
      category: row.category || '未分类',
      status: 'active',
    },
    options: options.map((option) => ({
      id: `${String(row.id)}-${Number(option.option_index)}`,
      optionIndex: Number(option.option_index),
      optionText: option.option_text,
      odds: Number(option.odds ?? 1),
      voteCount: Number(
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

function mapOrderStatus(
  orderStatus: number,
  fulfillmentStatus?: number | null,
): OrderSummary['status'] {
  if (orderStatus === ORDER_REFUNDED) {
    return 'refunded';
  }
  if (orderStatus === ORDER_CLOSED) {
    return 'cancelled';
  }
  if (orderStatus === ORDER_PENDING) {
    return 'pending';
  }
  if (orderStatus === ORDER_FULFILLED) {
    return 'completed';
  }

  if (orderStatus === ORDER_PAID) {
    if (fulfillmentStatus === FULFILLMENT_SHIPPED) {
      return 'shipping';
    }
    if (fulfillmentStatus === FULFILLMENT_COMPLETED) {
      return 'delivered';
    }
    if (fulfillmentStatus === FULFILLMENT_CANCELED) {
      return 'cancelled';
    }
    if (
      fulfillmentStatus === FULFILLMENT_PENDING ||
      fulfillmentStatus === FULFILLMENT_PROCESSING
    ) {
      return 'paid';
    }
    return 'paid';
  }

  return 'pending';
}

function sanitizeOrderItem(row: OrderRow): OrderItem | null {
  if (!row.item_id || !row.product_id || !row.product_name) {
    return null;
  }

  return {
    id: toEntityId(row.item_id),
    productId: toEntityId(row.product_id),
    productName: row.product_name,
    productImg: row.product_img || '',
    skuText: null,
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? 0) / 100,
    itemAmount: Number(row.item_amount ?? 0) / 100,
  };
}

function mapOrderRows(rows: OrderRow[]): OrderSummary[] {
  const orderMap = new Map<string, OrderSummary>();

  for (const row of rows) {
    const id = toEntityId(row.id);
    let order = orderMap.get(id);

    if (!order) {
      order = {
        id,
        userId: toEntityId(row.user_id),
        orderType: row.guess_id ? 'guess' : 'shop',
        guessId: toOptionalEntityId(row.guess_id),
        guessTitle: row.guess_title || null,
        amount: Number(row.amount ?? 0) / 100,
        status: mapOrderStatus(
          Number(row.status ?? 0),
          row.fulfillment_status == null ? null : Number(row.fulfillment_status),
        ),
        createdAt: new Date(row.created_at).toISOString(),
        items: [],
      };
      orderMap.set(id, order);
    }

    const item = sanitizeOrderItem(row);
    if (item) {
      order.items.push(item);
    }
  }

  return Array.from(orderMap.values());
}

function sortByIds<T extends { id: string }>(items: T[], ids: string[]) {
  const indexes = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort(
    (left, right) =>
      (indexes.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (indexes.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

async function getGuessOptionRows(guessIds: string[]) {
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

async function getGuessVoteRows(guessIds: string[]) {
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

export async function getAdminUserGuesses(
  userId: string,
  page = 1,
  pageSize = 10,
): Promise<AdminUserGuessListResult> {
  const db = getDbPool();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;
  const [[countRows], [guessIdRows]] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(DISTINCT gb.guess_id) AS total
        FROM guess_bet gb
        WHERE gb.user_id = ?
      `,
      [userId],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          gb.guess_id AS id,
          MAX(gb.created_at) AS last_bet_at
        FROM guess_bet gb
        WHERE gb.user_id = ?
        GROUP BY gb.guess_id
        ORDER BY last_bet_at DESC, gb.guess_id DESC
        LIMIT ?
        OFFSET ?
      `,
      [userId, safePageSize, offset],
    ),
  ]);

  const guessIds = (guessIdRows as Array<{ id: number | string }>).map((row) =>
    String(row.id),
  );

  if (guessIds.length === 0) {
    return {
      items: [],
      total: Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0),
      page: safePage,
      pageSize: safePageSize,
    };
  }

  const [rows] = await db.query<mysql.RowDataPacket[]>(
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
        p.guess_price AS product_guess_price
      FROM guess_bet gb
      INNER JOIN guess g ON g.id = gb.guess_id
      LEFT JOIN guess_product gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id
      WHERE g.id IN (?)
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
    `,
    [guessIds],
  );

  const typedRows = rows as GuessRow[];
  const [optionRows, voteRows] = await Promise.all([
    getGuessOptionRows(guessIds),
    getGuessVoteRows(guessIds),
  ]);
  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  const votesByGuess = new Map<string, GuessVoteRow[]>();

  optionRows.forEach((row) => {
    const key = String(row.guess_id);
    optionsByGuess.set(key, [...(optionsByGuess.get(key) ?? []), row]);
  });
  voteRows.forEach((row) => {
    const key = String(row.guess_id);
    votesByGuess.set(key, [...(votesByGuess.get(key) ?? []), row]);
  });

  return {
    items: sortByIds(
      typedRows.map((row) =>
        buildGuessSummary(
          row,
          optionsByGuess.get(String(row.id)) ?? [],
          votesByGuess.get(String(row.id)) ?? [],
        ),
      ),
      guessIds,
    ),
    total: Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0),
    page: safePage,
    pageSize: safePageSize,
  };
}

const adminUserOrderSql = `
  SELECT
    o.id,
    o.user_id,
    o.type,
    o.guess_id,
    g.title AS guess_title,
    o.amount,
    o.status,
    o.created_at,
    oi.id AS item_id,
    oi.product_id,
    COALESCE(p.name, bp.name) AS product_name,
    COALESCE(p.image_url, bp.default_img) AS product_img,
    oi.quantity,
    oi.unit_price,
    oi.item_amount,
    fo.status AS fulfillment_status
  FROM \`order\` o
  LEFT JOIN guess g ON g.id = o.guess_id
  LEFT JOIN order_item oi ON oi.order_id = o.id
  LEFT JOIN product p ON p.id = oi.product_id
  LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
  LEFT JOIN (
    SELECT current_fo.order_id, current_fo.status
    FROM fulfillment_order current_fo
    INNER JOIN (
      SELECT order_id, MAX(id) AS max_id
      FROM fulfillment_order
      WHERE order_id IS NOT NULL
      GROUP BY order_id
    ) latest_fo ON latest_fo.max_id = current_fo.id
  ) fo ON fo.order_id = o.id
`;

export async function getAdminUserOrders(
  userId: string,
  page = 1,
  pageSize = 10,
): Promise<AdminUserOrderListResult> {
  const db = getDbPool();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;
  const [[countRows], [orderIdRows]] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM \`order\`
        WHERE user_id = ?
      `,
      [userId],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM \`order\`
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?
        OFFSET ?
      `,
      [userId, safePageSize, offset],
    ),
  ]);

  const orderIds = (orderIdRows as Array<{ id: number | string }>).map((row) =>
    String(row.id),
  );

  if (orderIds.length === 0) {
    return {
      items: [],
      total: Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0),
      page: safePage,
      pageSize: safePageSize,
    };
  }

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      ${adminUserOrderSql}
      WHERE o.id IN (?)
      ORDER BY o.created_at DESC, oi.created_at ASC, oi.id ASC
    `,
    [orderIds],
  );

  return {
    items: sortByIds(mapOrderRows(rows as OrderRow[]), orderIds),
    total: Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0),
    page: safePage,
    pageSize: safePageSize,
  };
}
