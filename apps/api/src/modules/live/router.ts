import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';
import type { LiveDetailResult, LiveGuessSummary, LiveListItem, LiveListResult } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError, asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import {
  LIVE_STATUS_LIVE,
  LIVE_STATUS_UPCOMING,
  deriveLiveStatusKey,
  toPublicLiveStatus,
} from './live-status';

export const liveRouter: ExpressRouter = Router();

const GUESS_ACTIVE = 30;
const REVIEW_APPROVED = 30;
const GUESS_SCOPE_PUBLIC = 10;

type LiveRow = {
  id: number | string;
  host_id: number | string | null;
  title: string;
  image_url: string | null;
  status: string | number | null;
  start_time: Date | string | null;
  host_name: string | null;
  host_avatar: string | null;
};

type GuessRow = {
  id: number | string;
  creator_id: number | string;
  title: string;
  category: string | null;
  end_time: Date | string | null;
};

type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string;
  odds: number | string | null;
};

type GuessVoteRow = {
  guess_id: number | string;
  option_index: number | string;
  vote_count: number | string;
};

/**
 * 直播卡片里的当前竞猜摘要统一在后端组装，避免前端再拼选项、赔率和投票占比。
 */
function buildCurrentGuess(
  row: GuessRow,
  optionRows: GuessOptionRow[],
  voteRows: GuessVoteRow[],
): LiveGuessSummary {
  const totalVotes = voteRows.reduce((sum, item) => sum + Number(item.vote_count ?? 0), 0);
  const sortedOptions = optionRows
    .slice()
    .sort((left, right) => Number(left.option_index) - Number(right.option_index));
  const voteCountByOption = new Map<number, number>();
  for (const vote of voteRows) {
    voteCountByOption.set(Number(vote.option_index), Number(vote.vote_count ?? 0));
  }

  const options = sortedOptions.map((item) => item.option_text);
  const odds = sortedOptions.map((item) => Number(item.odds ?? 1));
  const pcts = sortedOptions.map((item) => {
    const voteCount = voteCountByOption.get(Number(item.option_index)) ?? 0;
    return totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  });

  return {
    id: toEntityId(row.id),
    title: row.title,
    category: row.category,
    options,
    odds,
    pcts,
    endTime: row.end_time ? new Date(row.end_time).toISOString() : null,
  };
}

/**
 * 直播主表查询保持薄层，只负责拿直播与主播基础信息，过滤掉已结束/被封禁的直播。
 */
async function fetchLiveRows(liveId?: string) {
  const db = getDbPool();
  const params: Array<string | number> = [LIVE_STATUS_UPCOMING, LIVE_STATUS_LIVE];
  const idClause = liveId ? 'AND l.id = ?' : '';
  if (liveId) {
    params.push(liveId);
  }

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        l.id,
        l.host_id,
        l.title,
        l.image_url,
        l.status,
        l.start_time,
        up.name AS host_name,
        up.avatar_url AS host_avatar
      FROM live l
      LEFT JOIN user_profile up ON up.user_id = l.host_id
      WHERE l.status IN (?, ?)
        ${idClause}
      ORDER BY COALESCE(l.start_time, l.created_at) DESC, l.id DESC
    `,
    params,
  );

  return rows as LiveRow[];
}

/**
 * 直播列表还要补齐主播当前竞猜、竞猜场次和参与人数，这里集中做一次批量组装。
 */
async function buildLiveItems(liveRows: LiveRow[]) {
  if (liveRows.length === 0) {
    return [] as LiveListItem[];
  }

  const hostIds = liveRows
    .map((row) => (row.host_id == null ? '' : String(row.host_id)))
    .filter(Boolean);

  const db = getDbPool();
  let guessRows: GuessRow[] = [];
  let optionRows: GuessOptionRow[] = [];
  let voteRows: GuessVoteRow[] = [];

  if (hostIds.length > 0) {
    const [guesses] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          g.id,
          g.creator_id,
          g.title,
          c.name AS category,
          g.end_time
        FROM guess g
        LEFT JOIN category c ON c.id = g.category_id
        WHERE g.creator_id IN (?)
          AND g.status = ?
          AND g.review_status = ?
          AND g.scope = ?
          AND g.end_time > NOW()
        ORDER BY g.end_time ASC, g.id ASC
      `,
      [hostIds, GUESS_ACTIVE, REVIEW_APPROVED, GUESS_SCOPE_PUBLIC],
    );

    guessRows = guesses as GuessRow[];
    const guessIds = guessRows.map((row) => String(row.id));

    if (guessIds.length > 0) {
      const [options] = await db.query<mysql.RowDataPacket[]>(
        `
          SELECT
            guess_id,
            option_index,
            option_text,
            odds
          FROM guess_option
          WHERE guess_id IN (?)
          ORDER BY guess_id ASC, option_index ASC
        `,
        [guessIds],
      );

      const [votes] = await db.query<mysql.RowDataPacket[]>(
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

      optionRows = options as GuessOptionRow[];
      voteRows = votes as GuessVoteRow[];
    }
  }

  const guessesByHost = new Map<string, GuessRow[]>();
  for (const row of guessRows) {
    const key = String(row.creator_id);
    const current = guessesByHost.get(key) || [];
    current.push(row);
    guessesByHost.set(key, current);
  }

  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const row of optionRows) {
    const key = String(row.guess_id);
    const current = optionsByGuess.get(key) || [];
    current.push(row);
    optionsByGuess.set(key, current);
  }

  const votesByGuess = new Map<string, GuessVoteRow[]>();
  for (const row of voteRows) {
    const key = String(row.guess_id);
    const current = votesByGuess.get(key) || [];
    current.push(row);
    votesByGuess.set(key, current);
  }

  return liveRows.map((row) => {
    const hostId = row.host_id == null ? null : String(row.host_id);
    const hostGuesses = hostId ? guessesByHost.get(hostId) || [] : [];
    const currentGuessRow = hostGuesses[0] || null;
    const currentGuess = currentGuessRow
      ? buildCurrentGuess(
          currentGuessRow,
          optionsByGuess.get(String(currentGuessRow.id)) || [],
          votesByGuess.get(String(currentGuessRow.id)) || [],
        )
      : null;
    const participants = hostGuesses.reduce((sum, guess) => {
      const voteList = votesByGuess.get(String(guess.id)) || [];
      return sum + voteList.reduce((voteSum, item) => voteSum + Number(item.vote_count ?? 0), 0);
    }, 0);

    return {
      id: toEntityId(row.id),
      title: row.title,
      imageUrl: row.image_url,
      status: toPublicLiveStatus(deriveLiveStatusKey(row.status, row.start_time)),
      startTime: row.start_time ? new Date(row.start_time).toISOString() : null,
      hostId: hostId ? toEntityId(hostId) : null,
      hostName: row.host_name || '主播',
      hostAvatar: row.host_avatar,
      guessCount: hostGuesses.length,
      participants,
      currentGuess,
    } satisfies LiveListItem;
  });
}

liveRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const limit = Math.min(Math.max(Number(request.query.limit ?? 20) || 20, 1), 50);
    const liveRows = await fetchLiveRows();
    const items = (await buildLiveItems(liveRows)).slice(0, limit);
    ok(response, { items } satisfies LiveListResult);
  }),
);

liveRouter.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const items = await buildLiveItems(await fetchLiveRows(String(request.params.id)));
    const item = items[0];
    if (!item) {
      throw new HttpError(404, 'LIVE_NOT_FOUND', '直播不存在');
    }
    ok(response, item satisfies LiveDetailResult);
  }),
);
