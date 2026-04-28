import type mysql from 'mysql2/promise';

import type {
  CommunityCommentSort,
  CommunityDiscoveryResult,
  CommunityDiscoveryTopic,
  CommunityFeedItem,
  CommunityFeedResult,
  CommunityPostDetailResult,
  CommunitySearchResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { searchUsers } from '../social/store';
import {
  COMMENT_INTERACTION_LIKE,
  COMMENT_TARGET_POST,
  POST_INTERACTION_BOOKMARK,
  POST_INTERACTION_LIKE,
  POST_SCOPE_PUBLIC,
  type CommentRow,
  type PostRow,
  buildPostVisibilityClause,
  buildPostVisibilityParams,
} from './constants';
import {
  buildCommunityGuessInfoMap,
  fetchCommunityFeedRows,
  fetchCommunityPostRow,
} from './query-store';
import {
  sanitizeCommunityComment,
  sanitizeCommunityFeedItem,
} from './serializer';

export async function getCommunityFeed(
  userId: string | null,
  tab: 'recommend' | 'follow',
): Promise<CommunityFeedResult> {
  const rows = await fetchCommunityFeedRows(userId, tab);
  const guessInfoMap = await buildCommunityGuessInfoMap(rows);
  return {
    items: rows.map((row) => sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')))),
  };
}

export async function getCommunityPostDetail(
  userId: string,
  postId: string,
  sort: CommunityCommentSort = 'hot',
): Promise<CommunityPostDetailResult | null> {
  const db = getDbPool();
  const row = await fetchCommunityPostRow(userId, postId);
  if (!row) {
    return null;
  }

  const guessInfoMap = await buildCommunityGuessInfoMap([row]);
  const commentOrderSql = sort === 'newest'
    ? 'ci.created_at DESC, ci.id DESC'
    : `
        likes DESC,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item cir
          WHERE cir.parent_id = ci.id
            AND cir.target_type = ${COMMENT_TARGET_POST}
            AND cir.target_id = ?
        ), 0) DESC,
        ci.created_at ASC,
        ci.id ASC
      `;
  const commentParams =
    sort === 'newest'
      ? [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId]
      : [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId, postId];
  const [commentRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.content,
        ci.created_at,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_interaction cix
          WHERE cix.comment_id = ci.id
            AND cix.interaction_type = ?
        ), 0) AS likes,
        EXISTS(
          SELECT 1
          FROM comment_interaction cix2
          WHERE cix2.comment_id = ci.id
            AND cix2.user_id = ?
            AND cix2.interaction_type = ?
        ) AS liked,
        up.name AS author_name,
        u.uid_code AS author_uid_code,
        up.avatar_url AS author_avatar_url
      FROM comment_item ci
      INNER JOIN user u ON u.id = ci.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ci.target_type = ?
        AND ci.target_id = ?
        AND ci.parent_id IS NULL
      ORDER BY ${commentOrderSql}
      LIMIT 20
    `,
    commentParams,
  );
  const commentIds = (commentRows as CommentRow[]).map((item) => String(item.id));
  let replyRows: CommentRow[] = [];
  if (commentIds.length > 0) {
    const placeholders = commentIds.map(() => '?').join(', ');
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          ci.id,
          ci.parent_id,
          ci.content,
          ci.created_at,
          COALESCE((
            SELECT COUNT(*)
            FROM comment_interaction cix
            WHERE cix.comment_id = ci.id
              AND cix.interaction_type = ?
          ), 0) AS likes,
          EXISTS(
            SELECT 1
            FROM comment_interaction cix2
            WHERE cix2.comment_id = ci.id
              AND cix2.user_id = ?
              AND cix2.interaction_type = ?
          ) AS liked,
          up.name AS author_name,
          u.uid_code AS author_uid_code,
          up.avatar_url AS author_avatar_url
        FROM comment_item ci
        INNER JOIN user u ON u.id = ci.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE ci.target_type = ?
          AND ci.target_id = ?
          AND ci.parent_id IN (${placeholders})
        ORDER BY ci.created_at ASC, ci.id ASC
      `,
      [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId, ...commentIds],
    );
    replyRows = rows as CommentRow[];
  }

  const visibilitySql = buildPostVisibilityClause('p');
  const currentGuessId = row.guess_id == null ? null : String(row.guess_id);
  const currentTag = row.tag?.trim() || null;
  const [relatedRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.location,
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
      WHERE p.id <> ?
        AND p.type <> 20
        AND ${visibilitySql}
      ORDER BY
        CASE
          WHEN ? IS NOT NULL AND p.guess_id = ? THEN 2
          WHEN ? IS NOT NULL AND p.tag = ? THEN 1
          ELSE 0
        END DESC,
        p.created_at DESC,
        p.id DESC
      LIMIT 3
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      postId,
      currentGuessId,
      currentGuessId,
      currentTag,
      currentTag,
      ...buildPostVisibilityParams(userId),
    ],
  );
  const relatedGuessInfoMap = await buildCommunityGuessInfoMap(relatedRows as PostRow[]);

  return {
    post: sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? ''))),
    comments: (commentRows as CommentRow[]).map((item) => ({
      ...sanitizeCommunityComment(item),
      replies: replyRows
        .filter((reply) => String((reply as CommentRow & { parent_id?: number | string }).parent_id ?? '') === String(item.id))
        .map((reply) => sanitizeCommunityComment(reply)),
    })),
    related: (relatedRows as PostRow[]).map((item) =>
      sanitizeCommunityFeedItem(item, relatedGuessInfoMap.get(String(item.guess_id ?? ''))),
    ),
  };
}

export async function searchCommunity(userId: string, q: string): Promise<CommunitySearchResult> {
  const keyword = q.trim();
  if (!keyword) {
    return { posts: [], users: [] };
  }

  const db = getDbPool();
  const likeKeyword = `%${keyword}%`;
  const visibilitySql = buildPostVisibilityClause('p');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.location,
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
      WHERE ${visibilitySql}
        AND (
          COALESCE(p.title, '') LIKE ?
          OR COALESCE(p.content, '') LIKE ?
          OR COALESCE(p.tag, '') LIKE ?
          OR COALESCE(up.name, '') LIKE ?
        )
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 20
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      ...buildPostVisibilityParams(userId),
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
    ],
  );
  const guessInfoMap = await buildCommunityGuessInfoMap(rows as PostRow[]);

  return {
    posts: (rows as PostRow[]).map((row) =>
      sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? ''))),
    ),
    users: (await searchUsers(userId, keyword)).items,
  };
}

export async function getCommunityDiscovery(userId: string | null): Promise<CommunityDiscoveryResult> {
  const db = getDbPool();
  const visibilitySql = buildPostVisibilityClause('p');
  const viewerId = userId && userId.trim() ? userId : '0';
  const [heroRows] = await db.execute<mysql.RowDataPacket[]>(
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
      WHERE ${visibilitySql}
      ORDER BY (
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi4
          WHERE pi4.post_id = p.id
            AND pi4.interaction_type = ${POST_INTERACTION_LIKE}
        ), 0) * 3
        + COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci2
          WHERE ci2.target_id = p.id
            AND ci2.target_type = ${COMMENT_TARGET_POST}
        ), 0) * 2
        + COALESCE((
          SELECT COUNT(*)
          FROM post p3
          WHERE p3.repost_id = p.id
        ), 0)
      ) DESC, p.created_at DESC, p.id DESC
      LIMIT 1
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      viewerId,
      POST_INTERACTION_LIKE,
      viewerId,
      POST_INTERACTION_BOOKMARK,
      ...buildPostVisibilityParams(viewerId),
    ],
  );
  const heroRow = (heroRows[0] as PostRow | undefined) ?? null;
  const heroGuessInfo = heroRow ? await buildCommunityGuessInfoMap([heroRow]) : new Map<string, CommunityFeedItem['guessInfo']>();

  const [tagRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.tag,
        COUNT(*) AS post_count,
        MAX(p.created_at) AS latest_created_at
      FROM post p
      WHERE p.scope = ${POST_SCOPE_PUBLIC}
        AND p.tag IS NOT NULL
        AND p.tag <> ''
      GROUP BY p.tag
      ORDER BY post_count DESC, latest_created_at DESC
      LIMIT 6
    `,
  );

  const hotTopics: CommunityDiscoveryTopic[] = (
    tagRows as Array<{ tag?: string; post_count?: number | string; latest_created_at?: Date | string }>
  )
    .filter((row) => (row.tag ?? '').trim())
    .map((row) => ({
      text: String(row.tag).trim(),
      desc: `${Number(row.post_count ?? 0)}条相关动态`,
      href: `/community-search?q=${encodeURIComponent(String(row.tag).trim())}`,
    }));

  return {
    hero: heroRow ? sanitizeCommunityFeedItem(heroRow, heroGuessInfo.get(String(heroRow.guess_id ?? ''))) : null,
    hotTopics,
  };
}
