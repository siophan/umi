import { toEntityId, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, POST_INTERACTION_LIKE, POST_SCOPE_PUBLIC, REPORT_STATUS_PENDING, REPORT_STATUS_REVIEWING, REPORT_TARGET_POST, } from '../community/constants';
const REPORT_STATUS_RESOLVED = 30;
const REPORT_STATUS_REJECTED = 40;
const REPORT_REASON_SPAM = 10;
const REPORT_REASON_EXPLICIT = 20;
const REPORT_REASON_ABUSE = 30;
const REPORT_REASON_FALSE_INFO = 40;
const REPORT_REASON_OTHER = 90;
const REPORT_ACTION_APPROVE = 10;
const REPORT_ACTION_REJECT = 20;
const REPORT_ACTION_BAN = 30;
const GUESS_STATUS_ACTIVE = 30;
const GUESS_REVIEW_APPROVED = 30;
function toIso(value) {
    return value ? new Date(value).toISOString() : null;
}
function parseJsonArray(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
        }
    }
    catch {
        return [];
    }
    return [];
}
function mapPostScope(scope) {
    const code = Number(scope ?? 0);
    if (code === POST_SCOPE_PUBLIC) {
        return { key: 'public', label: '公开' };
    }
    if (code === 20) {
        return { key: 'followers', label: '粉丝可见' };
    }
    if (code === 90) {
        return { key: 'private', label: '仅自己可见' };
    }
    return { key: 'unknown', label: '未知' };
}
function mapPostType(row) {
    if (row.repost_id != null || Number(row.type ?? 0) === 20) {
        return { key: 'repost', label: '转发动态' };
    }
    if (row.guess_id != null) {
        return { key: 'guess', label: '竞猜动态' };
    }
    return { key: 'post', label: '普通动态' };
}
function sanitizePost(row) {
    const scope = mapPostScope(row.scope);
    const type = mapPostType(row);
    return {
        id: toEntityId(row.id),
        title: row.title,
        content: row.content?.trim() || '',
        tag: row.tag,
        type: type.key,
        typeLabel: type.label,
        scope: scope.key,
        scopeLabel: scope.label,
        authorId: toEntityId(row.author_id),
        authorUid: row.author_uid,
        authorName: row.author_name?.trim() || `用户 ${row.author_id}`,
        guessId: row.guess_id == null ? null : toEntityId(row.guess_id),
        guessTitle: row.guess_title,
        images: parseJsonArray(row.images),
        likeCount: Number(row.like_count ?? 0),
        commentCount: Number(row.comment_count ?? 0),
        repostCount: Number(row.repost_count ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
    };
}
function sanitizeComment(row) {
    return {
        id: toEntityId(row.id),
        targetType: 'post',
        targetPostId: row.target_post_id == null ? null : toEntityId(row.target_post_id),
        targetPostTitle: row.target_post_title,
        parentId: row.parent_id == null ? null : toEntityId(row.parent_id),
        content: row.content?.trim() || '',
        authorId: toEntityId(row.author_id),
        authorUid: row.author_uid,
        authorName: row.author_name?.trim() || `用户 ${row.author_id}`,
        likeCount: Number(row.like_count ?? 0),
        replyCount: Number(row.reply_count ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
    };
}
function mapReportReason(reasonType) {
    const code = Number(reasonType ?? 0);
    if (code === REPORT_REASON_SPAM) {
        return { key: 'spam', label: '垃圾广告' };
    }
    if (code === REPORT_REASON_EXPLICIT) {
        return { key: 'explicit', label: '低俗色情' };
    }
    if (code === REPORT_REASON_ABUSE) {
        return { key: 'abuse', label: '人身攻击' };
    }
    if (code === REPORT_REASON_FALSE_INFO) {
        return { key: 'false_info', label: '虚假信息' };
    }
    return { key: 'other', label: '其他原因' };
}
function mapReportStatus(status) {
    const code = Number(status ?? 0);
    if (code === REPORT_STATUS_PENDING) {
        return { key: 'pending', label: '待处理' };
    }
    if (code === REPORT_STATUS_REVIEWING) {
        return { key: 'reviewing', label: '处理中' };
    }
    if (code === REPORT_STATUS_RESOLVED) {
        return { key: 'resolved', label: '已处理' };
    }
    return { key: 'rejected', label: '已驳回' };
}
function mapReportHandleAction(handleAction) {
    const code = Number(handleAction ?? 0);
    if (code === REPORT_ACTION_APPROVE) {
        return { key: 'approve', label: '采纳举报' };
    }
    if (code === REPORT_ACTION_REJECT) {
        return { key: 'reject', label: '驳回举报' };
    }
    if (code === REPORT_ACTION_BAN) {
        return { key: 'ban', label: '封禁用户' };
    }
    return { key: null, label: null };
}
function sanitizeReport(row) {
    const reason = mapReportReason(row.reason_type);
    const status = mapReportStatus(row.status);
    const handleAction = mapReportHandleAction(row.handle_action);
    return {
        id: toEntityId(row.id),
        reporterUserId: toEntityId(row.reporter_user_id),
        reporterUid: row.reporter_uid,
        reporterName: row.reporter_name?.trim() || `用户 ${row.reporter_user_id}`,
        targetType: 'post',
        targetId: toEntityId(row.target_id),
        targetTitle: row.target_title,
        targetContent: row.target_content,
        targetAuthorId: row.target_author_id == null ? null : toEntityId(row.target_author_id),
        targetAuthorUid: row.target_author_uid,
        targetAuthorName: row.target_author_name,
        reasonType: reason.key,
        reasonLabel: reason.label,
        reasonDetail: row.reason_detail,
        status: status.key,
        statusLabel: status.label,
        handleAction: handleAction.key,
        handleActionLabel: handleAction.label,
        handleNote: row.handle_note,
        handledAt: toIso(row.handled_at),
        createdAt: new Date(row.created_at).toISOString(),
    };
}
function deriveLiveStatus(rawStatus, startTime) {
    const code = rawStatus == null ? null : Number(rawStatus);
    const startValue = startTime ? new Date(startTime).getTime() : null;
    if (code != null && code >= 90) {
        return { key: 'ended', label: '已结束' };
    }
    if (startValue != null && startValue > Date.now()) {
        return { key: 'upcoming', label: '预告中' };
    }
    return { key: 'live', label: '直播中' };
}
function sanitizeLiveRoom(row) {
    const status = deriveLiveStatus(row.status, row.start_time);
    return {
        id: toEntityId(row.id),
        title: row.title?.trim() || `直播 ${row.id}`,
        imageUrl: row.image_url,
        hostId: row.host_id == null ? null : toEntityId(row.host_id),
        hostUid: row.host_uid,
        hostName: row.host_name?.trim() || (row.host_id == null ? '未知主播' : `主播 ${row.host_id}`),
        rawStatusCode: row.status == null ? null : Number(row.status),
        status: status.key,
        statusLabel: status.label,
        startTime: toIso(row.start_time),
        guessCount: Number(row.guess_count ?? 0),
        currentGuessTitle: row.current_guess_title,
        participantCount: Number(row.participant_count ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
    };
}
function appendLikeFilter(clauses, values, condition, value) {
    const trimmed = value?.trim();
    if (!trimmed) {
        return;
    }
    clauses.push(condition);
    values.push(`%${trimmed}%`);
}
async function deletePostCascade(connection, postId) {
    const [postRows] = await connection.execute('SELECT id FROM post WHERE id = ? LIMIT 1', [postId]);
    if (postRows.length === 0) {
        throw new HttpError(404, 'ADMIN_COMMUNITY_POST_NOT_FOUND', '动态不存在');
    }
    const [commentRows] = await connection.execute('SELECT id FROM comment_item WHERE target_type = ? AND target_id = ?', [COMMENT_TARGET_POST, postId]);
    const commentIds = commentRows.map((row) => String(row.id));
    if (commentIds.length > 0) {
        await connection.query('DELETE FROM comment_interaction WHERE comment_id IN (?)', [commentIds]);
        await connection.execute('DELETE FROM comment_item WHERE target_type = ? AND target_id = ?', [COMMENT_TARGET_POST, postId]);
    }
    await connection.execute('DELETE FROM post_interaction WHERE post_id = ?', [postId]);
    await connection.execute('DELETE FROM post WHERE id = ?', [postId]);
}
async function deleteCommentCascade(connection, commentId) {
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
async function fetchReportById(connection, reportId) {
    const [rows] = await connection.execute(`
      SELECT
        ri.id,
        ri.reporter_user_id,
        reporter.uid_code AS reporter_uid,
        reporter_profile.name AS reporter_name,
        ri.target_type,
        ri.target_id,
        p.title AS target_title,
        p.content AS target_content,
        p.user_id AS target_author_id,
        target_author.uid_code AS target_author_uid,
        target_author_profile.name AS target_author_name,
        ri.reason_type,
        ri.reason_detail,
        ri.status,
        ri.handle_action,
        ri.handle_note,
        ri.handled_at,
        ri.created_at
      FROM report_item ri
      INNER JOIN user reporter ON reporter.id = ri.reporter_user_id
      LEFT JOIN user_profile reporter_profile ON reporter_profile.user_id = reporter.id
      LEFT JOIN post p
        ON ri.target_type = ?
       AND p.id = ri.target_id
      LEFT JOIN user target_author
        ON target_author.id = p.user_id
      LEFT JOIN user_profile target_author_profile
        ON target_author_profile.user_id = target_author.id
      WHERE ri.id = ?
      LIMIT 1
    `, [REPORT_TARGET_POST, reportId]);
    if (rows.length === 0) {
        return null;
    }
    return sanitizeReport(rows[0]);
}
export async function getAdminCommunityPosts(params) {
    const db = getDbPool();
    const clauses = [];
    const values = [POST_INTERACTION_LIKE, COMMENT_TARGET_POST];
    appendLikeFilter(clauses, values, 'p.title LIKE ?', params.title);
    appendLikeFilter(clauses, values, 'COALESCE(up.name, \'\') LIKE ?', params.author);
    appendLikeFilter(clauses, values, 'COALESCE(p.tag, \'\') LIKE ?', params.tag);
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
    appendLikeFilter(clauses, values, 'COALESCE(up.name, \'\') LIKE ?', params.author);
    appendLikeFilter(clauses, values, 'COALESCE(p.title, \'\') LIKE ?', params.postTitle);
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
export async function getAdminCommunityReports(params) {
    const db = getDbPool();
    const clauses = [];
    const values = [REPORT_TARGET_POST];
    appendLikeFilter(clauses, values, 'COALESCE(reporter_profile.name, \'\') LIKE ?', params.reporter);
    if (params.reasonType) {
        const code = params.reasonType === 'spam'
            ? REPORT_REASON_SPAM
            : params.reasonType === 'explicit'
                ? REPORT_REASON_EXPLICIT
                : params.reasonType === 'abuse'
                    ? REPORT_REASON_ABUSE
                    : params.reasonType === 'false_info'
                        ? REPORT_REASON_FALSE_INFO
                        : REPORT_REASON_OTHER;
        clauses.push('ri.reason_type = ?');
        values.push(code);
    }
    appendLikeFilter(clauses, values, '(COALESCE(p.title, \'\') LIKE ? OR COALESCE(p.content, \'\') LIKE ?)', params.targetKeyword);
    if (params.targetKeyword?.trim()) {
        values.push(`%${params.targetKeyword.trim()}%`);
    }
    if (params.status) {
        const statusCode = params.status === 'pending'
            ? REPORT_STATUS_PENDING
            : params.status === 'reviewing'
                ? REPORT_STATUS_REVIEWING
                : params.status === 'resolved'
                    ? REPORT_STATUS_RESOLVED
                    : REPORT_STATUS_REJECTED;
        clauses.push('ri.status = ?');
        values.push(statusCode);
    }
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await db.execute(`
      SELECT
        ri.id,
        ri.reporter_user_id,
        reporter.uid_code AS reporter_uid,
        reporter_profile.name AS reporter_name,
        ri.target_type,
        ri.target_id,
        p.title AS target_title,
        p.content AS target_content,
        p.user_id AS target_author_id,
        target_author.uid_code AS target_author_uid,
        target_author_profile.name AS target_author_name,
        ri.reason_type,
        ri.reason_detail,
        ri.status,
        ri.handle_action,
        ri.handle_note,
        ri.handled_at,
        ri.created_at
      FROM report_item ri
      INNER JOIN user reporter ON reporter.id = ri.reporter_user_id
      LEFT JOIN user_profile reporter_profile ON reporter_profile.user_id = reporter.id
      LEFT JOIN post p
        ON ri.target_type = ?
       AND p.id = ri.target_id
      LEFT JOIN user target_author
        ON target_author.id = p.user_id
      LEFT JOIN user_profile target_author_profile
        ON target_author_profile.user_id = target_author.id
      ${whereSql}
      ORDER BY
        CASE ri.status
          WHEN ${REPORT_STATUS_PENDING} THEN 0
          WHEN ${REPORT_STATUS_REVIEWING} THEN 1
          WHEN ${REPORT_STATUS_RESOLVED} THEN 2
          ELSE 3
        END ASC,
        ri.created_at DESC,
        ri.id DESC
    `, values);
    const items = rows.map(sanitizeReport);
    return {
        items,
        summary: {
            total: items.length,
            pending: items.filter((item) => item.status === 'pending').length,
            reviewing: items.filter((item) => item.status === 'reviewing').length,
            resolved: items.filter((item) => item.status === 'resolved').length,
            rejected: items.filter((item) => item.status === 'rejected').length,
        },
    };
}
export async function updateAdminCommunityReport(reportId, adminId, payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    const note = payload.note?.trim() || null;
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`
        SELECT
          ri.id,
          ri.status,
          ri.target_type,
          ri.target_id,
          p.user_id AS target_author_id
        FROM report_item ri
        LEFT JOIN post p
          ON ri.target_type = ?
         AND p.id = ri.target_id
        WHERE ri.id = ?
        LIMIT 1
        FOR UPDATE
      `, [REPORT_TARGET_POST, reportId]);
        if (rows.length === 0) {
            throw new HttpError(404, 'ADMIN_COMMUNITY_REPORT_NOT_FOUND', '举报记录不存在');
        }
        const report = rows[0];
        const currentStatus = Number(report.status ?? 0);
        if (currentStatus === REPORT_STATUS_RESOLVED || currentStatus === REPORT_STATUS_REJECTED) {
            throw new HttpError(400, 'ADMIN_COMMUNITY_REPORT_ALREADY_HANDLED', '举报记录已处理');
        }
        if (payload.action === 'review') {
            await connection.execute(`
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = NULL, handle_note = ?, handled_at = NULL, updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `, [REPORT_STATUS_REVIEWING, adminId, note, reportId]);
        }
        else if (payload.action === 'approve') {
            if (Number(report.target_type ?? 0) === REPORT_TARGET_POST) {
                await deletePostCascade(connection, String(report.target_id));
            }
            await connection.execute(`
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = ?, handle_note = ?, handled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `, [REPORT_STATUS_RESOLVED, adminId, REPORT_ACTION_APPROVE, note, reportId]);
        }
        else if (payload.action === 'reject') {
            await connection.execute(`
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = ?, handle_note = ?, handled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `, [REPORT_STATUS_REJECTED, adminId, REPORT_ACTION_REJECT, note, reportId]);
        }
        else {
            if (report.target_author_id != null) {
                await connection.execute('UPDATE user SET banned = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [report.target_author_id]);
            }
            if (Number(report.target_type ?? 0) === REPORT_TARGET_POST) {
                await deletePostCascade(connection, String(report.target_id));
            }
            await connection.execute(`
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = ?, handle_note = ?, handled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `, [REPORT_STATUS_RESOLVED, adminId, REPORT_ACTION_BAN, note, reportId]);
        }
        const item = await fetchReportById(connection, reportId);
        if (!item) {
            throw new HttpError(404, 'ADMIN_COMMUNITY_REPORT_NOT_FOUND', '举报记录不存在');
        }
        await connection.commit();
        return { item };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getAdminLiveRooms(params) {
    const db = getDbPool();
    const clauses = [];
    const values = [GUESS_STATUS_ACTIVE, GUESS_REVIEW_APPROVED, GUESS_STATUS_ACTIVE, GUESS_REVIEW_APPROVED];
    appendLikeFilter(clauses, values, 'COALESCE(l.title, \'\') LIKE ?', params.title);
    appendLikeFilter(clauses, values, 'COALESCE(up.name, \'\') LIKE ?', params.host);
    appendLikeFilter(clauses, values, 'COALESCE(current_guess_title, \'\') LIKE ?', params.guessTitle);
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await db.execute(`
      SELECT *
      FROM (
        SELECT
          l.id,
          l.title,
          l.image_url,
          l.host_id,
          u.uid_code AS host_uid,
          up.name AS host_name,
          l.status,
          l.start_time,
          l.created_at,
          l.updated_at,
          COALESCE((
            SELECT COUNT(*)
            FROM guess g
            WHERE g.creator_id = l.host_id
              AND g.status = ?
              AND g.review_status = ?
          ), 0) AS guess_count,
          (
            SELECT g.title
            FROM guess g
            WHERE g.creator_id = l.host_id
              AND g.status = ?
              AND g.review_status = ?
            ORDER BY g.created_at DESC, g.id DESC
            LIMIT 1
          ) AS current_guess_title,
          COALESCE((
            SELECT COUNT(*)
            FROM guess_bet gb
            INNER JOIN guess g2 ON g2.id = gb.guess_id
            WHERE g2.creator_id = l.host_id
              AND g2.status = ${GUESS_STATUS_ACTIVE}
              AND g2.review_status = ${GUESS_REVIEW_APPROVED}
          ), 0) AS participant_count
        FROM live l
        LEFT JOIN user u ON u.id = l.host_id
        LEFT JOIN user_profile up ON up.user_id = u.id
      ) AS live_rows
      ${whereSql}
      ORDER BY COALESCE(start_time, created_at) DESC, id DESC
    `, values);
    const items = rows.map(sanitizeLiveRoom);
    return {
        items,
        summary: {
            total: items.length,
            live: items.filter((item) => item.status === 'live').length,
            upcoming: items.filter((item) => item.status === 'upcoming').length,
            ended: items.filter((item) => item.status === 'ended').length,
        },
    };
}
