import { getDbPool } from '../../lib/db';
import { searchUsers } from '../social/store';
import { COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, POST_INTERACTION_BOOKMARK, POST_INTERACTION_LIKE, POST_SCOPE_PUBLIC, REPORT_STATUS_PENDING, REPORT_STATUS_REVIEWING, REPORT_TARGET_POST, buildPostVisibilityClause, postScopeValueToCode, } from './constants';
import { buildCommunityGuessInfoMap, fetchCommunityFeedRows, fetchCommunityPostRow, } from './query-store';
import { normalizeCommunityImages, sanitizeCommunityComment, sanitizeCommunityFeedItem, } from './serializer';
export async function getCommunityFeed(userId, tab) {
    const rows = await fetchCommunityFeedRows(userId, tab);
    const guessInfoMap = await buildCommunityGuessInfoMap(rows);
    return {
        items: rows.map((row) => sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')))),
    };
}
export async function getCommunityPostDetail(userId, postId, sort = 'hot') {
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
    const commentParams = sort === 'newest'
        ? [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId]
        : [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId, postId];
    const [commentRows] = await db.execute(`
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
    `, commentParams);
    const commentIds = commentRows.map((item) => String(item.id));
    let replyRows = [];
    if (commentIds.length > 0) {
        const placeholders = commentIds.map(() => '?').join(', ');
        const [rows] = await db.execute(`
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
      `, [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId, ...commentIds]);
        replyRows = rows;
    }
    const visibilitySql = buildPostVisibilityClause('p');
    const currentGuessId = row.guess_id == null ? null : String(row.guess_id);
    const currentTag = row.tag?.trim() || null;
    const [relatedRows] = await db.execute(`
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
    `, [
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
        userId,
        userId,
        userId,
    ]);
    const relatedGuessInfoMap = await buildCommunityGuessInfoMap(relatedRows);
    return {
        post: sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? ''))),
        comments: commentRows.map((item) => ({
            ...sanitizeCommunityComment(item),
            replies: replyRows
                .filter((reply) => String(reply.parent_id ?? '') === String(item.id))
                .map((reply) => sanitizeCommunityComment(reply)),
        })),
        related: relatedRows.map((item) => sanitizeCommunityFeedItem(item, relatedGuessInfoMap.get(String(item.guess_id ?? '')))),
    };
}
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
async function ensurePostExists(postId) {
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id FROM post WHERE id = ? LIMIT 1`, [postId]);
    if (!rows.length) {
        throw new Error('动态不存在');
    }
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
export async function searchCommunity(userId, q) {
    const keyword = q.trim();
    if (!keyword) {
        return { posts: [], users: [] };
    }
    const db = getDbPool();
    const likeKeyword = `%${keyword}%`;
    const visibilitySql = buildPostVisibilityClause('p');
    const [rows] = await db.execute(`
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
    `, [
        POST_INTERACTION_LIKE,
        COMMENT_TARGET_POST,
        userId,
        POST_INTERACTION_LIKE,
        userId,
        POST_INTERACTION_BOOKMARK,
        userId,
        userId,
        userId,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
    ]);
    const guessInfoMap = await buildCommunityGuessInfoMap(rows);
    return {
        posts: rows.map((row) => sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')))),
        users: (await searchUsers(userId, keyword)).items,
    };
}
export async function getCommunityDiscovery(userId) {
    const db = getDbPool();
    const visibilitySql = buildPostVisibilityClause('p');
    const [heroRows] = await db.execute(`
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
    `, [
        POST_INTERACTION_LIKE,
        COMMENT_TARGET_POST,
        userId,
        POST_INTERACTION_LIKE,
        userId,
        POST_INTERACTION_BOOKMARK,
        userId,
        userId,
        userId,
    ]);
    const heroRow = heroRows[0] ?? null;
    const heroGuessInfo = heroRow ? await buildCommunityGuessInfoMap([heroRow]) : new Map();
    const [tagRows] = await db.execute(`
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
    `);
    const hotTopics = tagRows
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
