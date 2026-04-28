import type mysql from 'mysql2/promise';

import { toEntityId, type GuessCommentListResult, type GuessCommentSummary } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { COMMENT_INTERACTION_LIKE, COMMENT_TARGET_GUESS } from './guess-shared';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function listGuessComments(
  guessId: string,
  options: { limit?: number; currentUserId?: string | null } = {},
): Promise<GuessCommentListResult> {
  const limit = Math.min(Math.max(Math.floor(options.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const currentUserId = options.currentUserId ?? null;
  const db = getDbPool();

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.user_id,
        ci.parent_id,
        ci.content,
        ci.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar,
        (
          SELECT COUNT(*)
          FROM comment_interaction cir
          WHERE cir.comment_id = ci.id
            AND cir.interaction_type = ?
        ) AS likes,
        ${currentUserId ? `(
          SELECT 1
          FROM comment_interaction cir2
          WHERE cir2.comment_id = ci.id
            AND cir2.user_id = ?
            AND cir2.interaction_type = ?
          LIMIT 1
        )` : 'NULL'} AS liked
      FROM comment_item ci
      LEFT JOIN user_profile up ON up.user_id = ci.user_id
      WHERE ci.target_type = ?
        AND ci.target_id = ?
      ORDER BY ci.created_at DESC, ci.id DESC
      LIMIT ?
    `,
    currentUserId
      ? [COMMENT_INTERACTION_LIKE, currentUserId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_GUESS, guessId, limit]
      : [COMMENT_INTERACTION_LIKE, COMMENT_TARGET_GUESS, guessId, limit],
  );

  const [countRows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS cnt FROM comment_item WHERE target_type = ? AND target_id = ?',
    [COMMENT_TARGET_GUESS, guessId],
  );
  const total = Number((countRows[0] as { cnt?: number } | undefined)?.cnt ?? 0);

  const items: GuessCommentSummary[] = (rows as Array<{
    id: number | string;
    user_id: number | string;
    parent_id: number | string | null;
    content: string;
    created_at: Date | string;
    author_name: string | null;
    author_avatar: string | null;
    likes: number | string;
    liked: number | string | null;
  }>).map((row) => ({
    id: toEntityId(row.id),
    authorId: toEntityId(row.user_id),
    authorName: row.author_name || '用户',
    authorAvatar: row.author_avatar || null,
    content: row.content,
    parentId: row.parent_id == null ? null : toEntityId(row.parent_id),
    likes: Number(row.likes ?? 0),
    liked: Boolean(row.liked),
    createdAt: new Date(row.created_at).toISOString(),
  }));

  return { items, total };
}
