import type mysql from 'mysql2/promise';

import {
  toEntityId,
  type GuessCommentSummary,
  type PostGuessCommentPayload,
  type ToggleGuessFavoriteResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import {
  COMMENT_INTERACTION_LIKE,
  COMMENT_TARGET_GUESS,
  GUESS_INTERACTION_FAVORITE,
} from './guess-shared';

export async function addGuessFavorite(userId: string, guessId: string): Promise<ToggleGuessFavoriteResult> {
  await ensureGuessExists(guessId);
  const db = getDbPool();
  await db.execute(
    `
      INSERT IGNORE INTO guess_interaction (user_id, guess_id, interaction_type, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, guessId, GUESS_INTERACTION_FAVORITE],
  );
  return { guessId: toEntityId(guessId), favorited: true };
}

export async function removeGuessFavorite(userId: string, guessId: string): Promise<ToggleGuessFavoriteResult> {
  const db = getDbPool();
  await db.execute(
    'DELETE FROM guess_interaction WHERE user_id = ? AND guess_id = ? AND interaction_type = ?',
    [userId, guessId, GUESS_INTERACTION_FAVORITE],
  );
  return { guessId: toEntityId(guessId), favorited: false };
}

async function ensureGuessExists(guessId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT 1 FROM guess WHERE id = ? LIMIT 1',
    [guessId],
  );
  if (!rows.length) {
    throw new HttpError(404, 'GUESS_NOT_FOUND', '竞猜不存在');
  }
}

async function ensureGuessCommentExists(commentId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM comment_item WHERE id = ? AND target_type = ? LIMIT 1',
    [commentId, COMMENT_TARGET_GUESS],
  );
  if (!rows.length) {
    throw new HttpError(404, 'COMMENT_NOT_FOUND', '评论不存在');
  }
}

export async function postGuessComment(
  userId: string,
  guessId: string,
  payload: PostGuessCommentPayload,
): Promise<GuessCommentSummary> {
  const content = payload.content?.trim() || '';
  if (!content) {
    throw new HttpError(400, 'COMMENT_CONTENT_EMPTY', '评论内容不能为空');
  }
  if (content.length > 500) {
    throw new HttpError(400, 'COMMENT_CONTENT_TOO_LONG', '评论内容过长');
  }
  await ensureGuessExists(guessId);

  let parentId: string | null = null;
  if (payload.parentId) {
    const db = getDbPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, parent_id
        FROM comment_item
        WHERE id = ?
          AND target_type = ?
          AND target_id = ?
        LIMIT 1
      `,
      [String(payload.parentId), COMMENT_TARGET_GUESS, guessId],
    );
    if (!rows.length) {
      throw new HttpError(400, 'COMMENT_PARENT_NOT_FOUND', '回复目标不存在');
    }
    const target = rows[0] as { id: number | string; parent_id?: number | string | null };
    parentId = target.parent_id == null ? String(target.id) : String(target.parent_id);
  }

  const db = getDbPool();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO comment_item (
        target_type, target_id, user_id, parent_id, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [COMMENT_TARGET_GUESS, guessId, userId, parentId, content],
  );

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.user_id,
        ci.parent_id,
        ci.content,
        ci.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar
      FROM comment_item ci
      LEFT JOIN user_profile up ON up.user_id = ci.user_id
      WHERE ci.id = ?
      LIMIT 1
    `,
    [result.insertId],
  );
  const row = rows[0] as
    | {
        id: number | string;
        user_id: number | string;
        parent_id: number | string | null;
        content: string;
        created_at: Date | string;
        author_name: string | null;
        author_avatar: string | null;
      }
    | undefined;
  if (!row) {
    throw new HttpError(500, 'COMMENT_INSERT_FAILED', '评论发送后读取失败');
  }
  return {
    id: toEntityId(row.id),
    authorId: toEntityId(row.user_id),
    authorName: row.author_name || '用户',
    authorAvatar: row.author_avatar || null,
    content: row.content,
    parentId: row.parent_id == null ? null : toEntityId(row.parent_id),
    likes: 0,
    liked: false,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function likeGuessComment(userId: string, commentId: string) {
  await ensureGuessCommentExists(commentId);
  const db = getDbPool();
  await db.execute(
    `
      INSERT IGNORE INTO comment_interaction (user_id, comment_id, interaction_type, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, commentId, COMMENT_INTERACTION_LIKE],
  );
  return { success: true as const };
}

export async function unlikeGuessComment(userId: string, commentId: string) {
  await ensureGuessCommentExists(commentId);
  const db = getDbPool();
  await db.execute(
    'DELETE FROM comment_interaction WHERE user_id = ? AND comment_id = ? AND interaction_type = ?',
    [userId, commentId, COMMENT_INTERACTION_LIKE],
  );
  return { success: true as const };
}
