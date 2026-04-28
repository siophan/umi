import type { CreateCommunityPostPayload } from '@umi/shared';

export const COMMENT_TARGET_POST = 20;
export const COMMENT_INTERACTION_LIKE = 10;
export const REPORT_TARGET_POST = 10;
export const REPORT_STATUS_PENDING = 10;
export const REPORT_STATUS_REVIEWING = 20;

export const POST_INTERACTION_LIKE = 10;
export const POST_INTERACTION_BOOKMARK = 20;
export const POST_SCOPE_PUBLIC = 10;
const POST_SCOPE_FOLLOWERS = 20;
export const POST_SCOPE_FRIENDS = 30;
const POST_SCOPE_PRIVATE = 90;

export type PostRow = {
  id: number | string;
  title: string | null;
  content: string | null;
  tag: string | null;
  location?: string | null;
  images: string;
  repost_id?: number | string | null;
  likes: number | string;
  comments: number | string;
  shares?: number | string;
  created_at: Date | string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_id?: number | string;
  author_uid_code?: string | null;
  author_shop_verified?: number | string;
  liked?: number | string;
  bookmarked?: number | string;
  scope?: number | string;
  guess_id?: number | string | null;
};

export type CommentRow = {
  id: number | string;
  parent_id?: number | string | null;
  content: string | null;
  created_at: Date | string;
  likes?: number | string;
  liked?: number | string;
  author_name: string | null;
  author_uid_code: string | null;
  author_avatar_url: string | null;
};

export function postScopeValueToCode(value: CreateCommunityPostPayload['scope'] | null | undefined) {
  if (!value || value === 'public') {
    return POST_SCOPE_PUBLIC;
  }
  if (value === 'followers') {
    return POST_SCOPE_FOLLOWERS;
  }
  if (value === 'friends') {
    return POST_SCOPE_FRIENDS;
  }
  if (value === 'private') {
    return POST_SCOPE_PRIVATE;
  }
  throw new Error('动态可见范围不合法');
}

export function buildPostVisibilityClause(alias = 'p') {
  return `
    (
      ${alias}.scope = ${POST_SCOPE_PUBLIC}
      OR (
        ${alias}.scope = ${POST_SCOPE_FOLLOWERS}
        AND (
          ${alias}.user_id = ?
          OR EXISTS (
            SELECT 1
            FROM user_follow uf_visible
            WHERE uf_visible.follower_id = ?
              AND uf_visible.following_id = ${alias}.user_id
          )
        )
      )
      OR (
        ${alias}.scope = ${POST_SCOPE_FRIENDS}
        AND (
          ${alias}.user_id = ?
          OR (
            EXISTS (
              SELECT 1
              FROM user_follow uf_friends_a
              WHERE uf_friends_a.follower_id = ?
                AND uf_friends_a.following_id = ${alias}.user_id
            )
            AND EXISTS (
              SELECT 1
              FROM user_follow uf_friends_b
              WHERE uf_friends_b.follower_id = ${alias}.user_id
                AND uf_friends_b.following_id = ?
            )
          )
        )
      )
      OR (
        ${alias}.scope = ${POST_SCOPE_PRIVATE}
        AND ${alias}.user_id = ?
      )
    )
  `;
}

export function buildPostVisibilityParams(viewerId: string) {
  return [viewerId, viewerId, viewerId, viewerId, viewerId, viewerId];
}
