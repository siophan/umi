import { toEntityId } from '@umi/shared';
import { POST_SCOPE_PUBLIC, } from './constants';
function safeJsonArray(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    }
    catch {
        return [];
    }
}
function postScopeCodeToValue(code) {
    const value = Number(code ?? POST_SCOPE_PUBLIC);
    if (value === 20) {
        return 'followers';
    }
    if (value === 90) {
        return 'private';
    }
    return 'public';
}
export function sanitizePost(row) {
    return {
        id: toEntityId(row.id),
        title: row.title || '未命名动态',
        desc: row.content || '',
        tag: row.tag || null,
        images: safeJsonArray(row.images),
        likes: Number(row.likes ?? 0),
        comments: Number(row.comments ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
        authorName: row.author_name ?? null,
        authorAvatar: row.author_avatar_url ?? null,
    };
}
export function sanitizeCommunityFeedItem(row, guessInfo) {
    return {
        id: toEntityId(row.id),
        title: row.title || '未命名动态',
        desc: row.content || '',
        tag: row.tag ?? null,
        location: row.location ?? null,
        images: safeJsonArray(row.images),
        likes: Number(row.likes ?? 0),
        comments: Number(row.comments ?? 0),
        shares: Number(row.shares ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
        scope: postScopeCodeToValue(row.scope),
        liked: Number(row.liked ?? 0) > 0,
        bookmarked: Number(row.bookmarked ?? 0) > 0,
        author: {
            id: toEntityId(row.author_id ?? 0),
            uid: row.author_uid_code ?? '',
            name: row.author_name || '未知用户',
            avatar: row.author_avatar_url ?? null,
            verified: Number(row.author_shop_verified ?? 0) > 0,
        },
        guessInfo: guessInfo ?? null,
    };
}
export function sanitizeCommunityComment(row) {
    return {
        id: toEntityId(row.id),
        authorName: row.author_name || '未知用户',
        authorUid: row.author_uid_code || '',
        authorAvatar: row.author_avatar_url ?? null,
        content: row.content || '',
        createdAt: new Date(row.created_at).toISOString(),
        likes: Number(row.likes ?? 0),
        liked: Number(row.liked ?? 0) > 0,
        replies: [],
    };
}
export function normalizeCommunityImages(images) {
    const normalized = (images ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3);
    for (const image of normalized) {
        if (image.length > 1024 * 1024 * 2) {
            throw new Error('单张图片内容过大');
        }
    }
    return normalized;
}
