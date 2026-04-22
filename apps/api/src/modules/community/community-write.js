import { getDbPool } from '../../lib/db';
import { COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, POST_INTERACTION_BOOKMARK, POST_INTERACTION_LIKE, REPORT_STATUS_PENDING, REPORT_STATUS_REVIEWING, REPORT_TARGET_POST, postScopeValueToCode, } from './constants';
import { buildCommunityGuessInfoMap, fetchCommunityPostRow, } from './query-store';
import { normalizeCommunityImages, sanitizeCommunityComment, sanitizeCommunityFeedItem, } from './serializer';
function normalizeCommunityPostContent(content) {
    const trimmed = content.trim();
    if (!trimmed) {
        throw new Error('动态内容不能为空');
    }
    if (trimmed.length > 2000) {
        throw new Error('动态内容不能超过 2000 字');
    }
    return trimmed;
}
function buildCommunityPostTitle(content) {
    const compact = content.replace(/\s+/g, ' ').trim();
    return compact.length > 40 ? compact.slice(0, 40) : compact;
}
function normalizeCommunityTag(tag) {
    const normalized = tag?.trim() || null;
    if (normalized && normalized.length > 20) {
        throw new Error('动态标签不能超过 20 字');
    }
    return normalized;
}
function normalizeCommunityLocation(location) {
    const normalized = location?.trim() || null;
    if (normalized && normalized.length > 100) {
        throw new Error('地点信息不能超过 100 字');
    }
    return normalized;
}
async function normalizeGuessId(guessId) {
    const normalized = guessId?.trim() || '';
    if (!normalized) {
        return null;
    }
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id FROM guess WHERE id = ? LIMIT 1`, [normalized]);
    if (!rows.length) {
        throw new Error('关联竞猜不存在');
    }
    return normalized;
}
async function ensurePostExists(postId) {
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id FROM post WHERE id = ? LIMIT 1`, [postId]);
    if (!rows.length) {
        throw new Error('动态不存在');
    }
}
async function ensureCommunityCommentExists(commentId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id
      FROM comment_item
      WHERE id = ?
        AND target_type = ?
      LIMIT 1
    `, [commentId, COMMENT_TARGET_POST]);
    if (!rows.length) {
        throw new Error('评论不存在');
    }
}
export async function createCommunityPost(userId, payload) {
    const db = getDbPool();
    const content = normalizeCommunityPostContent(payload.content);
    const title = buildCommunityPostTitle(content);
    const tag = normalizeCommunityTag(payload.tag);
    const location = normalizeCommunityLocation(payload.location);
    const scope = postScopeValueToCode(payload.scope);
    const guessId = await normalizeGuessId(payload.guessId);
    const images = normalizeCommunityImages(payload.images);
    const [result] = await db.execute(`
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        guess_id,
        location,
        scope,
        created_at,
        updated_at
      ) VALUES (?, 10, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `, [userId, title, content, JSON.stringify(images), tag, guessId, location, scope]);
    const row = await fetchCommunityPostRow(userId, String(result.insertId));
    if (!row) {
        throw new Error('动态创建成功后读取失败');
    }
    const guessInfoMap = await buildCommunityGuessInfoMap([row]);
    return sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')));
}
export async function createCommunityComment(userId, postId, payload) {
    await ensurePostExists(postId);
    const content = payload.content.trim();
    if (!content) {
        throw new Error('评论内容不能为空');
    }
    if (content.length > 500) {
        throw new Error('评论内容不能超过 500 字');
    }
    let parentId = null;
    if (payload.parentId?.trim()) {
        const db = getDbPool();
        const [rows] = await db.execute(`
        SELECT id, parent_id
        FROM comment_item
        WHERE id = ?
          AND target_type = ?
          AND target_id = ?
        LIMIT 1
      `, [payload.parentId.trim(), COMMENT_TARGET_POST, postId]);
        if (!rows.length) {
            throw new Error('回复目标不存在');
        }
        const targetRow = rows[0];
        parentId = targetRow.parent_id == null ? String(targetRow.id) : String(targetRow.parent_id);
    }
    const db = getDbPool();
    const [result] = await db.execute(`
      INSERT INTO comment_item (
        target_type,
        target_id,
        user_id,
        parent_id,
        content,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `, [COMMENT_TARGET_POST, postId, userId, parentId, content]);
    const [rows] = await db.execute(`
      SELECT
        ci.id,
        ci.content,
        ci.created_at,
        0 AS likes,
        0 AS liked,
        up.name AS author_name,
        u.uid_code AS author_uid_code,
        up.avatar_url AS author_avatar_url
      FROM comment_item ci
      INNER JOIN user u ON u.id = ci.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ci.id = ?
      LIMIT 1
    `, [result.insertId]);
    const row = rows[0];
    if (!row) {
        throw new Error('评论发送成功后读取失败');
    }
    return sanitizeCommunityComment(row);
}
export async function likeCommunityComment(userId, commentId) {
    await ensureCommunityCommentExists(commentId);
    const db = getDbPool();
    await db.execute(`
      INSERT INTO comment_interaction (user_id, comment_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
        FROM comment_interaction
        WHERE user_id = ?
          AND comment_id = ?
          AND interaction_type = ?
      )
    `, [userId, commentId, COMMENT_INTERACTION_LIKE, userId, commentId, COMMENT_INTERACTION_LIKE]);
    return { success: true };
}
export async function unlikeCommunityComment(userId, commentId) {
    const db = getDbPool();
    await db.execute(`
      DELETE FROM comment_interaction
      WHERE user_id = ?
        AND comment_id = ?
        AND interaction_type = ?
    `, [userId, commentId, COMMENT_INTERACTION_LIKE]);
    return { success: true };
}
export async function reportCommunityPost(userId, postId, payload) {
    const post = await fetchCommunityPostRow(userId, postId);
    if (!post) {
        throw new Error('动态不存在或不可见');
    }
    const reasonType = Number(payload.reasonType ?? 90);
    if (![10, 20, 30, 40, 90].includes(reasonType)) {
        throw new Error('举报原因不合法');
    }
    const reasonDetail = payload.reasonDetail?.trim() || null;
    if (reasonDetail && reasonDetail.length > 255) {
        throw new Error('补充说明不能超过 255 字');
    }
    const db = getDbPool();
    const [existingRows] = await db.execute(`
      SELECT id
      FROM report_item
      WHERE reporter_user_id = ?
        AND target_type = ?
        AND target_id = ?
        AND status IN (?, ?)
      LIMIT 1
    `, [userId, REPORT_TARGET_POST, postId, REPORT_STATUS_PENDING, REPORT_STATUS_REVIEWING]);
    if (existingRows.length) {
        throw new Error('你已经举报过这条动态，请等待处理');
    }
    await db.execute(`
      INSERT INTO report_item (
        reporter_user_id,
        target_type,
        target_id,
        reason_type,
        reason_detail,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `, [userId, REPORT_TARGET_POST, postId, reasonType, reasonDetail, REPORT_STATUS_PENDING]);
    return { success: true };
}
export async function repostCommunityPost(userId, postId, payload) {
    const original = await fetchCommunityPostRow(userId, postId);
    if (!original) {
        throw new Error('原动态不存在或不可见');
    }
    const db = getDbPool();
    const content = normalizeCommunityPostContent(payload.content || '转发动态');
    const title = buildCommunityPostTitle(content);
    const location = normalizeCommunityLocation(payload.location);
    const scope = postScopeValueToCode(payload.scope);
    const images = normalizeCommunityImages(payload.images);
    const rootPostId = String(original.repost_id ?? original.id);
    const [result] = await db.execute(`
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        guess_id,
        location,
        scope,
        repost_id,
        created_at,
        updated_at
      ) VALUES (?, 20, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `, [
        userId,
        title,
        content,
        JSON.stringify(images),
        '转发',
        original.guess_id ?? null,
        location,
        scope,
        rootPostId,
    ]);
    const row = await fetchCommunityPostRow(userId, String(result.insertId));
    if (!row) {
        throw new Error('转发成功后读取失败');
    }
    const guessInfoMap = await buildCommunityGuessInfoMap([row]);
    return sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')));
}
export async function likeCommunityPost(userId, postId) {
    await ensurePostExists(postId);
    const db = getDbPool();
    await db.execute(`
      INSERT INTO post_interaction (user_id, post_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      WHERE NOT EXISTS (
        SELECT 1
        FROM post_interaction
        WHERE user_id = ?
          AND post_id = ?
          AND interaction_type = ?
      )
    `, [userId, postId, POST_INTERACTION_LIKE, userId, postId, POST_INTERACTION_LIKE]);
    return { success: true };
}
export async function unlikeCommunityPost(userId, postId) {
    const db = getDbPool();
    await db.execute(`
      DELETE FROM post_interaction
      WHERE user_id = ?
        AND post_id = ?
        AND interaction_type = ?
    `, [userId, postId, POST_INTERACTION_LIKE]);
    return { success: true };
}
export async function bookmarkCommunityPost(userId, postId) {
    await ensurePostExists(postId);
    const db = getDbPool();
    await db.execute(`
      INSERT INTO post_interaction (user_id, post_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      WHERE NOT EXISTS (
        SELECT 1
        FROM post_interaction
        WHERE user_id = ?
          AND post_id = ?
          AND interaction_type = ?
      )
    `, [userId, postId, POST_INTERACTION_BOOKMARK, userId, postId, POST_INTERACTION_BOOKMARK]);
    return { success: true };
}
export async function unbookmarkCommunityPost(userId, postId) {
    const db = getDbPool();
    await db.execute(`
      DELETE FROM post_interaction
      WHERE user_id = ?
        AND post_id = ?
        AND interaction_type = ?
    `, [userId, postId, POST_INTERACTION_BOOKMARK]);
    return { success: true };
}
