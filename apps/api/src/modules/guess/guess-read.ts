import type { GuessListResult } from '@umi/shared';

import { HttpError } from '../../lib/errors';
import {
  buildGuessSummary,
  getGuessOptionRows,
  getGuessRows,
  getGuessVoteRows,
  getRouteParam,
  GUESS_ACTIVE,
  REVIEW_APPROVED,
} from './guess-shared';

const GUESS_SCOPE_PUBLIC = 10;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type CursorPayload = { createdAt: Date; id: string };

const MAX_TIMESTAMP_MS = 8_640_000_000_000_000;

function decodeCursor(raw: string): CursorPayload {
  const decoded = Buffer.from(raw, 'base64url').toString('utf-8');
  const sep = decoded.indexOf('|');
  if (sep <= 0) {
    throw new HttpError(400, 'INVALID_CURSOR', '游标格式不合法');
  }
  const createdAtMs = Number(decoded.slice(0, sep));
  const id = decoded.slice(sep + 1);
  if (
    !Number.isFinite(createdAtMs) ||
    Math.abs(createdAtMs) > MAX_TIMESTAMP_MS ||
    !id
  ) {
    throw new HttpError(400, 'INVALID_CURSOR', '游标格式不合法');
  }
  return { createdAt: new Date(createdAtMs), id };
}

function encodeCursor(createdAt: Date | string, id: string | number): string {
  const ms = new Date(createdAt).getTime();
  return Buffer.from(`${ms}|${id}`, 'utf-8').toString('base64url');
}

export async function getGuessList(query: {
  q?: string;
  limit?: string | number | undefined;
  cursor?: string;
}): Promise<GuessListResult> {
  const keyword = typeof query.q === 'string' ? query.q.trim() : '';
  const requestedLimit = typeof query.limit === 'string' ? Number.parseInt(query.limit, 10) : Number(query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const whereClauses = [
    'g.review_status = ?',
    'g.status = ?',
    'g.scope = ?',
    'g.end_time > NOW()',
  ];
  const params: Array<string | number | Date> = [REVIEW_APPROVED, GUESS_ACTIVE, GUESS_SCOPE_PUBLIC];

  if (keyword) {
    const like = `%${keyword}%`;
    whereClauses.push('(g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
    params.push(like, like, like, like);
  }

  const cursorRaw = typeof query.cursor === 'string' ? query.cursor.trim() : '';
  if (cursorRaw) {
    const cursor = decodeCursor(cursorRaw);
    whereClauses.push('(g.created_at < ? OR (g.created_at = ? AND g.id < ?))');
    params.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  const rows = await getGuessRows(`WHERE ${whereClauses.join(' AND ')}`, params, limit + 1);
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const guessIds = pageRows.map((row) => String(row.id));
  const [options, votes] = await Promise.all([getGuessOptionRows(guessIds), getGuessVoteRows(guessIds)]);
  const optionsByGuess = new Map<string, typeof options>();
  for (const option of options) {
    const key = String(option.guess_id);
    const current = optionsByGuess.get(key) || [];
    current.push(option);
    optionsByGuess.set(key, current);
  }

  const voteByGuess = new Map<string, typeof votes>();
  for (const vote of votes) {
    const key = String(vote.guess_id);
    const current = voteByGuess.get(key) || [];
    current.push(vote);
    voteByGuess.set(key, current);
  }

  const last = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.created_at, last.id) : null;

  return {
    items: pageRows.map((row) =>
      buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], voteByGuess.get(String(row.id)) || []),
    ),
    nextCursor,
    hasMore,
  };
}

export async function getGuessDetail(routeParam: string | string[] | undefined) {
  const rows = await getGuessRows('WHERE g.id = ?', [getRouteParam(routeParam)]);
  const row = rows[0];

  if (!row) {
    throw new HttpError(404, 'GUESS_NOT_FOUND', 'Guess not found');
  }

  const [options, votes] = await Promise.all([getGuessOptionRows([String(row.id)]), getGuessVoteRows([String(row.id)])]);
  return buildGuessSummary(row, options, votes);
}

export async function getGuessStats(routeParam: string | string[] | undefined) {
  const rows = await getGuessRows('WHERE g.id = ?', [getRouteParam(routeParam)]);
  const row = rows[0];

  if (!row) {
    throw new HttpError(404, 'GUESS_NOT_FOUND', 'Guess not found');
  }

  const votes = await getGuessVoteRows([String(row.id)]);
  return {
    totalVotes: votes.reduce((sum, option) => sum + Number(option.vote_count ?? 0), 0),
    optionCount: votes.length,
  };
}
