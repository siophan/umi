import { toEntityId, } from '@umi/shared';
import { POST_SCOPE_PUBLIC, REPORT_STATUS_PENDING, REPORT_STATUS_REVIEWING, } from '../community/constants';
export const REPORT_STATUS_RESOLVED = 30;
export const REPORT_STATUS_REJECTED = 40;
export const REPORT_REASON_SPAM = 10;
export const REPORT_REASON_EXPLICIT = 20;
export const REPORT_REASON_ABUSE = 30;
export const REPORT_REASON_FALSE_INFO = 40;
export const REPORT_REASON_OTHER = 90;
export const REPORT_ACTION_APPROVE = 10;
export const REPORT_ACTION_REJECT = 20;
export const REPORT_ACTION_BAN = 30;
export const GUESS_STATUS_ACTIVE = 30;
export const GUESS_REVIEW_APPROVED = 30;
export function toIso(value) {
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
export function sanitizePost(row) {
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
export function sanitizeComment(row) {
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
export function sanitizeReport(row) {
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
export function sanitizeLiveRoom(row) {
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
export function appendLikeFilter(clauses, values, condition, value) {
    const trimmed = value?.trim();
    if (!trimmed) {
        return;
    }
    clauses.push(condition);
    values.push(`%${trimmed}%`);
}
