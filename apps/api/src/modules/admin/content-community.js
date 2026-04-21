import { toEntityId, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, POST_INTERACTION_LIKE, } from '../community/constants';
import { appendLikeFilter, sanitizeComment, sanitizePost, } from './content-shared';
export async function deletePostCascade(connection, postId) {
    const [postRows] = await connection.execute('SELECT id FROM post WHERE id = ? LIMIT 1', [postId]);
    if (postRows.length === 0) {
        throw new HttpError(404, 'ADMIN_COMMUNITY_POST_NOT_FOUND', '动态不存在');
    }
    const [commentRows] = await connection.execute('SELECT id FROM comment_item WHERE target_type = ? AND target_id = ?', [COMMENT_TARGET_POST, postId]);
    const commentIds = commentRows.map((row) => String(row.id));
    if (commentIds.length > 0) {
        await connection.query('DELETE FROM comment_interaction WHERE comment_id IN (?)', [commentIds]);
        await connection.execute('DELETE FROM comment_item WHERE target_type = ? AND target_id = ?', [
            COMMENT_TARGET_POST,
            postId,
        ]);
    }
    await connection.execute('DELETE FROM post_interaction WHERE post_id = ?', [postId]);
    await connection.execute('DELETE FROM post WHERE id = ?', [postId]);
}
export async function deleteCommentCascade(connection, commentId) {
    const [commentRows] = await connection.execute('SELECT id FROM comment_item WHERE id = ? LIMIT 1', [commentId]);
    if (commentRows.length === 0) {
        throw new HttpError(404, 'ADMIN_COMMUNITY_COMMENT_NOT_FOUND', '评论不存在');
    }
    const [relatedRows] = await connection.execute('SELECT id FROM comment_item WHERE id = ? OR parent_id = ?', [commentId, commentId]);
    const relatedIds = relatedRows.map((row) => String(row.id));
    if (relatedIds.length > 0) {
        await connection.query('DELETE FROM comment_interaction WHERE comment_id IN (?)', [relatedIds]);
        await connection.query('DELETE FROM comment_item WHERE id IN (?)', [relatedIds]);
    }
}
export async function getAdminCommunityPosts(params) {
    const db = getDbPool();
    const clauses = [];
    const values = [POST_INTERACTION_LIKE, COMMENT_TARGET_POST];
    appendLikeFilter(clauses, values, 'p.title LIKE ?', params.title);
    appendLikeFilter(clauses, values, "COALESCE(up.name, '') LIKE ?", params.author);
    appendLikeFilter(clauses, values, "COALESCE(p.tag, '') LIKE ?", params.tag);
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await db.execute(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.type,
        p.scope,
        p.guess_id,
        p.repost_id,
        p.images,
        p.created_at,
        p.updated_at,
        u.id AS author_id,
        u.uid_code AS author_uid,
        up.name AS author_name,
        g.title AS guess_title,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi
          WHERE pi.post_id = p.id
            AND pi.interaction_type = ?
        ), 0) AS like_count,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci
          WHERE ci.target_type = ?
            AND ci.target_id = p.id
        ), 0) AS comment_count,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS repost_count
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN guess g ON g.id = p.guess_id
      ${whereSql}
      ORDER BY p.created_at DESC, p.id DESC
    `, values);
    return {
        items: rows.map(sanitizePost),
    };
}
export async function deleteAdminCommunityPost(postId) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await deletePostCascade(connection, postId);
        await connection.commit();
        return { id: toEntityId(postId), success: true };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getAdminCommunityComments(params) {
    const db = getDbPool();
    const clauses = ['ci.target_type = ?'];
    const values = [
        COMMENT_INTERACTION_LIKE,
        COMMENT_TARGET_POST,
        COMMENT_TARGET_POST,
    ];
    appendLikeFilter(clauses, values, 'ci.content LIKE ?', params.content);
    appendLikeFilter(clauses, values, "COALESCE(up.name, '') LIKE ?", params.author);
    appendLikeFilter(clauses, values, "COALESCE(p.title, '') LIKE ?", params.postTitle);
    const [rows] = await db.execute(`
      SELECT
        ci.id,
        ci.parent_id,
        ci.content,
        ci.created_at,
        u.id AS author_id,
        u.uid_code AS author_uid,
        up.name AS author_name,
        p.id AS target_post_id,
        p.title AS target_post_title,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_interaction cix
          WHERE cix.comment_id = ci.id
            AND cix.interaction_type = ?
        ), 0) AS like_count,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item reply
          WHERE reply.parent_id = ci.id
        ), 0) AS reply_count
      FROM comment_item ci
      INNER JOIN user u ON u.id = ci.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN post p
        ON ci.target_type = ?
       AND p.id = ci.target_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY ci.created_at DESC, ci.id DESC
    `, values);
    return {
        items: rows.map(sanitizeComment),
    };
}
export async function deleteAdminCommunityComment(commentId) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await deleteCommentCascade(connection, commentId);
        await connection.commit();
        return { id: toEntityId(commentId), success: true };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
