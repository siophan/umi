import { HttpError } from '../../lib/errors';
import {
  buildGuessSummary,
  getGuessOptionRows,
  getGuessRows,
  getGuessVoteRows,
  getRouteParam,
  GUESS_ACTIVE,
  GUESS_PENDING_REVIEW,
  GUESS_SETTLED,
  REVIEW_APPROVED,
} from './guess-shared';

export async function getGuessList(query: { q?: string; limit?: string | number | undefined }) {
  const keyword = typeof query.q === 'string' ? query.q.trim() : '';
  const requestedLimit = typeof query.limit === 'string' ? Number.parseInt(query.limit, 10) : Number(query.limit);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : undefined;
  const whereClauses = ['g.review_status = ?', 'g.status IN (?, ?, ?)'];
  const params: Array<string | number> = [REVIEW_APPROVED, GUESS_PENDING_REVIEW, GUESS_ACTIVE, GUESS_SETTLED];

  if (keyword) {
    const like = `%${keyword}%`;
    whereClauses.push('(g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
    params.push(like, like, like, like);
  }

  const rows = await getGuessRows(`WHERE ${whereClauses.join(' AND ')}`, params, limit);
  const guessIds = rows.map((row) => String(row.id));
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

  return {
    items: rows.map((row) =>
      buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], voteByGuess.get(String(row.id)) || []),
    ),
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
