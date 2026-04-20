export const COMMENT_TARGET_POST = 20;
export const COMMENT_INTERACTION_LIKE = 10;
export const REPORT_TARGET_POST = 10;
export const REPORT_STATUS_PENDING = 10;
export const REPORT_STATUS_REVIEWING = 20;
export const POST_INTERACTION_LIKE = 10;
export const POST_INTERACTION_BOOKMARK = 20;
export const POST_SCOPE_PUBLIC = 10;
const POST_SCOPE_FOLLOWERS = 20;
const POST_SCOPE_PRIVATE = 90;
export function postScopeValueToCode(value) {
    if (!value || value === 'public') {
        return POST_SCOPE_PUBLIC;
    }
    if (value === 'followers') {
        return POST_SCOPE_FOLLOWERS;
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
        ${alias}.scope = ${POST_SCOPE_PRIVATE}
        AND ${alias}.user_id = ?
      )
    )
  `;
}
