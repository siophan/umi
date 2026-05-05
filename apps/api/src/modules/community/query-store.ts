import type mysql from 'mysql2/promise';
import type { CommunityFeedItem } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  COMMENT_TARGET_POST,
  POST_INTERACTION_BOOKMARK,
  POST_INTERACTION_LIKE,
  buildPostVisibilityClause,
  buildPostVisibilityParams,
  type PostRow,
} from './constants';

type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string | null;
};

type GuessVoteRow = {
  guess_id: number | string;
  choice_idx: number | string;
  vote_count: number | string;
};

export async function buildCommunityGuessInfoMap(rows: PostRow[]) {
  const guessIds = Array.from(
    new Set(
      rows
        .map((row) => Number(row.guess_id ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );
  const guessInfoMap = new Map<string, CommunityFeedItem['guessInfo']>();

  if (!guessIds.length) {
    return guessInfoMap;
  }

  const db = getDbPool();
  const placeholders = guessIds.map(() => '?').join(', ');
  const [optionRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT guess_id, option_index, option_text
      FROM guess_option
      WHERE guess_id IN (${placeholders})
      ORDER BY guess_id ASC, option_index ASC
    `,
    guessIds,
  );
  const [voteRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT guess_id, choice_idx, COUNT(*) AS vote_count
      FROM guess_bet
      WHERE guess_id IN (${placeholders})
      GROUP BY guess_id, choice_idx
    `,
    guessIds,
  );

  const optionMap = new Map<string, GuessOptionRow[]>();
  for (const row of optionRows as GuessOptionRow[]) {
    const key = String(row.guess_id);
    const list = optionMap.get(key) ?? [];
    list.push(row);
    optionMap.set(key, list);
  }

  const voteMap = new Map<string, Map<number, number>>();
  for (const row of voteRows as GuessVoteRow[]) {
    const key = String(row.guess_id);
    const list = voteMap.get(key) ?? new Map<number, number>();
    list.set(Number(row.choice_idx ?? 0), Number(row.vote_count ?? 0));
    voteMap.set(key, list);
  }

  for (const guessId of guessIds) {
    const options = (optionMap.get(String(guessId)) ?? []).slice(0, 2);
    if (options.length < 2 || !options[0].option_text || !options[1].option_text) {
      continue;
    }

    const votes = voteMap.get(String(guessId)) ?? new Map<number, number>();
    const firstCount = votes.get(Number(options[0].option_index ?? 0)) ?? 0;
    const secondCount = votes.get(Number(options[1].option_index ?? 1)) ?? 0;
    const total = firstCount + secondCount;
    const firstPct = total > 0 ? Math.round((firstCount / total) * 100) : 50;
    const secondPct = 100 - firstPct;

    guessInfoMap.set(String(guessId), {
      id: toEntityId(guessId),
      options: [options[0].option_text, options[1].option_text],
      participants: total,
      pcts: [firstPct, secondPct],
    });
  }

  return guessInfoMap;
}

export const COMMUNITY_FEED_PAGE_SIZE = 20;

export type FeedCursor = { createdAtMs: number; id: string };

export function parseFeedCursor(raw: string | null | undefined): FeedCursor | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf('_');
  if (idx <= 0) return null;
  const ms = Number(raw.slice(0, idx));
  const id = raw.slice(idx + 1);
  if (!Number.isFinite(ms) || ms <= 0 || !id) return null;
  return { createdAtMs: ms, id };
}

export function buildFeedCursor(row: PostRow): string {
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  return `${createdAt.getTime()}_${row.id}`;
}

function buildCursorClause(cursor: FeedCursor | null): { sql: string; params: Array<Date | string | number> } {
  if (!cursor) {
    return { sql: '', params: [] };
  }
  const dt = new Date(cursor.createdAtMs);
  return {
    sql: ' AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?))',
    params: [dt, dt, cursor.id],
  };
}

export async function fetchCommunityFeedRows(
  userId: string | null,
  tab: 'recommend' | 'follow',
  cursor: FeedCursor | null = null,
): Promise<{ rows: PostRow[]; nextCursor: string | null }> {
  const db = getDbPool();
  const visibilitySql = buildPostVisibilityClause('p');
  const viewerId = userId && userId.trim() ? userId : '0';
  const fetchSize = COMMUNITY_FEED_PAGE_SIZE + 1;
  const baseParams: Array<string | number> = [
    POST_INTERACTION_LIKE,
    COMMENT_TARGET_POST,
    viewerId,
    POST_INTERACTION_LIKE,
    viewerId,
    POST_INTERACTION_BOOKMARK,
  ];
  const cursorClause = buildCursorClause(cursor);

  if (tab === 'follow') {
    if (viewerId === '0') {
      return { rows: [], nextCursor: null };
    }

    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.title,
          p.content,
          p.tag,
          p.images,
          p.created_at,
          p.scope,
          p.guess_id,
          u.id AS author_id,
          u.uid_code AS author_uid_code,
          up.name AS author_name,
          up.avatar_url AS author_avatar_url,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM shop s
              WHERE s.user_id = u.id
                AND s.status = 10
            ) THEN 1
            ELSE 0
          END AS author_shop_verified,
          COALESCE((
            SELECT COUNT(*)
            FROM post_interaction pi
            WHERE pi.post_id = p.id
              AND pi.interaction_type = ?
          ), 0) AS likes,
          COALESCE((
            SELECT COUNT(*)
            FROM comment_item ci
            WHERE ci.target_id = p.id
              AND ci.target_type = ?
          ), 0) AS comments,
          COALESCE((
            SELECT COUNT(*)
            FROM post p2
            WHERE p2.repost_id = p.id
          ), 0) AS shares,
          EXISTS(
            SELECT 1
            FROM post_interaction pi2
            WHERE pi2.post_id = p.id
              AND pi2.user_id = ?
              AND pi2.interaction_type = ?
          ) AS liked,
          EXISTS(
            SELECT 1
            FROM post_interaction pi3
            WHERE pi3.post_id = p.id
              AND pi3.user_id = ?
              AND pi3.interaction_type = ?
          ) AS bookmarked
        FROM post p
        INNER JOIN user_follow uf ON uf.following_id = p.user_id
        INNER JOIN user u ON u.id = p.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE uf.follower_id = ?
          AND ${visibilitySql}${cursorClause.sql}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ${fetchSize}
      `,
      [...baseParams, viewerId, ...buildPostVisibilityParams(viewerId), ...cursorClause.params],
    );
    return finalizeFeedPage(rows as PostRow[]);
  }

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.repost_id,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi
          WHERE pi.post_id = p.id
            AND pi.interaction_type = ?
        ), 0) AS likes,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci
          WHERE ci.target_id = p.id
            AND ci.target_type = ?
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ${visibilitySql}${cursorClause.sql}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ${fetchSize}
    `,
    [...baseParams, ...buildPostVisibilityParams(viewerId), ...cursorClause.params],
  );
  return finalizeFeedPage(rows as PostRow[]);
}

function finalizeFeedPage(rows: PostRow[]): { rows: PostRow[]; nextCursor: string | null } {
  if (rows.length > COMMUNITY_FEED_PAGE_SIZE) {
    const trimmed = rows.slice(0, COMMUNITY_FEED_PAGE_SIZE);
    return { rows: trimmed, nextCursor: buildFeedCursor(trimmed[trimmed.length - 1]) };
  }
  return { rows, nextCursor: null };
}

export async function fetchCommunityPostRow(userId: string, postId: string) {
  const db = getDbPool();
  const visibilitySql = buildPostVisibilityClause('p');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi
          WHERE pi.post_id = p.id
            AND pi.interaction_type = ?
        ), 0) AS likes,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci
          WHERE ci.target_id = p.id
            AND ci.target_type = ?
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE p.id = ?
        AND ${visibilitySql}
      LIMIT 1
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      postId,
      ...buildPostVisibilityParams(userId),
    ],
  );
  return (rows[0] as PostRow | undefined) ?? null;
}
