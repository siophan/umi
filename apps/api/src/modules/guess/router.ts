import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';
import { toEntityId, type GuessHistoryResult, type GuessListResult, type GuessSummary, type ProductSummary } from '@umi/shared';

import { getRequestUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';

export const guessRouter: ExpressRouter = Router();

const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const GUESS_REJECTED = 90;
const GUESS_DRAFT = 10;
const GUESS_PENDING_REVIEW = 20;
const BET_PENDING = 10;
const BET_WON = 30;
const BET_LOST = 40;
const REVIEW_PENDING = 10;
const REVIEW_APPROVED = 30;

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

type GuessBetRow = {
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

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds?: number | string;
  is_result: number | boolean;
};

type GuessParticipantRow = {
  guess_id: number | string;
  participant_count: number | string;
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
  const value = Number(code ?? 0);
  if (value === REVIEW_PENDING) {
    return 'pending';
  }
  if (value === REVIEW_APPROVED) {
    return 'approved';
  }
  return 'rejected';
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
        voteRows.find(
          (vote) =>
            String(vote.guess_id) === String(row.id) &&
            Number(vote.option_index) === Number(option.option_index),
        )?.vote_count
          ? Number(
              voteRows.find(
                (vote) =>
                  String(vote.guess_id) === String(row.id) &&
                  Number(vote.option_index) === Number(option.option_index),
              )?.vote_count,
            )
          : 0,
      isResult: Boolean(option.is_result),
    })),
  };
}

async function getGuessRows(whereSql = '', params: Array<string | number> = [], limit?: number) {
  const db = getDbPool();
  const sqlParams = typeof limit === 'number' ? [...params, limit] : params;
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
      FROM guess g
      LEFT JOIN guess_product gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id
      ${whereSql}
      ORDER BY g.created_at DESC, g.id DESC
      ${typeof limit === 'number' ? 'LIMIT ?' : ''}
    `,
    sqlParams,
  );

  return rows as GuessRow[];
}

function getChoiceText(row: GuessBetRow, options: GuessOptionRow[]) {
  return options.find((option) => Number(option.option_index) === Number(row.choice_idx))?.option_text || `选项 ${Number(row.choice_idx) + 1}`;
}

async function getUserHistoryResult(userId: string, userName: string): Promise<GuessHistoryResult> {
  const db = getDbPool();
  const [betRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        gb.id,
        gb.guess_id,
        gb.choice_idx,
        gb.amount,
        gb.status,
        gb.created_at,
        g.title AS guess_title,
        g.status AS guess_status,
        g.scope AS guess_scope,
        g.end_time AS guess_end_time,
        result_option.option_text AS result_text
      FROM guess_bet gb
      INNER JOIN guess g ON g.id = gb.guess_id
      LEFT JOIN guess_option result_option
        ON result_option.guess_id = g.id
       AND result_option.is_result = 1
      WHERE gb.user_id = ?
      ORDER BY gb.created_at DESC, gb.id DESC
      LIMIT 100
    `,
    [userId],
  );

  const typedBetRows = betRows as GuessBetRow[];
  const guessIds = Array.from(new Set(typedBetRows.map((row) => String(row.guess_id))));
  let optionRows: GuessOptionRow[] = [];
  let participantRows: GuessParticipantRow[] = [];
  let voteRows: GuessVoteRow[] = [];

  if (guessIds.length > 0) {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, option_index, option_text, is_result
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `,
      [guessIds],
    );
    optionRows = rows as GuessOptionRow[];

    const [participantCountRows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, COUNT(*) AS participant_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id
      `,
      [guessIds],
    );
    participantRows = participantCountRows as GuessParticipantRow[];

    const [optionVoteRows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id, choice_idx
      `,
      [guessIds],
    );
    voteRows = optionVoteRows as GuessVoteRow[];
  }

  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const row of optionRows) {
    const guessId = String(row.guess_id);
    const list = optionsByGuess.get(guessId) || [];
    list.push(row);
    optionsByGuess.set(guessId, list);
  }

  const participantsByGuess = new Map<string, number>();
  for (const row of participantRows) {
    participantsByGuess.set(String(row.guess_id), Number(row.participant_count ?? 0));
  }

  const voteCountByGuessOption = new Map<string, number>();
  for (const row of voteRows) {
    voteCountByGuessOption.set(`${String(row.guess_id)}:${Number(row.option_index)}`, Number(row.vote_count ?? 0));
  }

  const active = typedBetRows
    .filter((row) => Number(row.guess_status) === GUESS_ACTIVE && Number(row.status) === BET_PENDING)
    .map((row) => {
      const options = optionsByGuess.get(String(row.guess_id)) || [];
      const totalVotes = options.reduce(
        (sum, option) => sum + (voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0),
        0,
      );
      return {
        betId: toEntityId(row.id),
        guessId: toEntityId(row.guess_id),
        title: row.guess_title,
        participants: participantsByGuess.get(String(row.guess_id)) ?? 0,
        endTime: new Date(row.guess_end_time).toISOString(),
        choiceText: getChoiceText(row, options),
        optionProgress: options.map((option) => {
          const votes = voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0;
          return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        }),
        options: options.map((option) => option.option_text),
      };
    });

  const settledRows = typedBetRows.filter((row) => Number(row.guess_status) === GUESS_SETTLED || Number(row.guess_status) === GUESS_REJECTED);
  const history = settledRows.map((row) => {
    const options = optionsByGuess.get(String(row.guess_id)) || [];
    const outcome: GuessHistoryResult['history'][number]['outcome'] = Number(row.status) === BET_WON ? 'won' : 'lost';
    return {
      betId: toEntityId(row.id),
      guessId: toEntityId(row.guess_id),
      title: row.guess_title,
      date: new Date(row.created_at).toISOString().slice(0, 10),
      choiceText: getChoiceText(row, options),
      resultText: row.result_text || (Number(row.guess_status) === GUESS_REJECTED ? '竞猜未通过' : '待结算'),
      outcome,
      rewardText: outcome === 'won' ? '🎉 猜中' : '未中奖',
    };
  });

  const pk = settledRows
    .filter((row) => Number(row.guess_scope) === 20)
    .map((row) => {
      const options = optionsByGuess.get(String(row.guess_id)) || [];
      const outcome: GuessHistoryResult['pk'][number]['outcome'] = Number(row.status) === BET_WON ? 'won' : 'lost';
      return {
        betId: toEntityId(row.id),
        guessId: toEntityId(row.guess_id),
        title: row.guess_title,
        outcome,
        leftName: userName,
        leftChoice: getChoiceText(row, options),
        rightName: '对手',
        rightChoice: row.result_text || '待确认',
        footer: `${participantsByGuess.get(String(row.guess_id)) ?? 0} 人参与 · ${new Date(row.created_at).toISOString().slice(0, 10)}`,
      };
    });

  const wonCount = history.filter((row) => row.outcome === 'won').length;
  const lostCount = history.filter((row) => row.outcome === 'lost').length;
  return {
    stats: {
      total: typedBetRows.length,
      active: active.length,
      won: wonCount,
      lost: lostCount,
      pk: pk.length,
      winRate: wonCount + lostCount > 0 ? Number(((wonCount / (wonCount + lostCount)) * 100).toFixed(1)) : 0,
    },
    active,
    history,
    pk,
  };
}

guessRouter.get(
  '/user/history',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getUserHistoryResult(user.id, user.name));
  }),
);

guessRouter.get(
  '/my-bets',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getUserHistoryResult(user.id, user.name));
  }),
);

guessRouter.get('/', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
  const requestedLimit =
    typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : undefined;
  const whereClauses = ['g.review_status = ?', 'g.status IN (?, ?, ?)'];
  const params: Array<string | number> = [
    REVIEW_APPROVED,
    GUESS_PENDING_REVIEW,
    GUESS_ACTIVE,
    GUESS_SETTLED,
  ];

  if (query) {
    const like = `%${query}%`;
    whereClauses.push('(g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
    params.push(like, like, like, like);
  }

  const rows = await getGuessRows(`WHERE ${whereClauses.join(' AND ')}`, params, limit);
  const guessIds = rows.map((row) => String(row.id));
  const [options, votes] = await Promise.all([getGuessOptionRows(guessIds), getGuessVoteRows(guessIds)]);
  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const option of options) {
    const key = String(option.guess_id);
    const current = optionsByGuess.get(key) || [];
    current.push(option);
    optionsByGuess.set(key, current);
  }

  const voteByGuess = new Map<string, GuessVoteRow[]>();
  for (const vote of votes) {
    const key = String(vote.guess_id);
    const current = voteByGuess.get(key) || [];
    current.push(vote);
    voteByGuess.set(key, current);
  }

  const items: GuessListResult['items'] = rows.map((row) =>
    buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], voteByGuess.get(String(row.id)) || []),
  );
  ok(response, { items });
});

guessRouter.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const rows = await getGuessRows('WHERE g.id = ?', [getRouteParam(request.params.id)]);
    const row = rows[0];

    if (!row) {
      throw new HttpError(404, 'GUESS_NOT_FOUND', 'Guess not found');
    }

    const [options, votes] = await Promise.all([
      getGuessOptionRows([String(row.id)]),
      getGuessVoteRows([String(row.id)]),
    ]);

    ok(response, buildGuessSummary(row, options, votes));
  }),
);

guessRouter.get(
  '/:id/stats',
  asyncHandler(async (request, response) => {
    const rows = await getGuessRows('WHERE g.id = ?', [getRouteParam(request.params.id)]);
    const row = rows[0];

    if (!row) {
      throw new HttpError(404, 'GUESS_NOT_FOUND', 'Guess not found');
    }

    const votes = await getGuessVoteRows([String(row.id)]);
    ok(response, {
      totalVotes: votes.reduce(
        (sum, option) => sum + Number(option.vote_count ?? 0),
        0,
      ),
      optionCount: votes.length,
    });
  }),
);
