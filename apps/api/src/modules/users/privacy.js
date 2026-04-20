import { getDbPool } from '../../lib/db';
import { findUserById } from './query-store';
import { sanitizeUser } from './model';
const FRIENDSHIP_ACCEPTED = 30;
async function areUsersFriends(userId, viewerId) {
    if (!viewerId || userId === viewerId) {
        return userId === viewerId;
    }
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id
      FROM friendship
      WHERE status = ?
        AND (
          (user_id = ? AND friend_id = ?)
          OR (user_id = ? AND friend_id = ?)
        )
      LIMIT 1
    `, [FRIENDSHIP_ACCEPTED, userId, viewerId, viewerId, userId]);
    return rows.length > 0;
}
export async function resolveProfileVisibility(userId, viewerId) {
    const user = await findUserById(userId);
    if (!user) {
        return null;
    }
    const sanitized = sanitizeUser(user);
    const isSelf = !!viewerId && String(viewerId) === String(userId);
    const isFriend = isSelf ? true : viewerId ? await areUsersFriends(String(userId), String(viewerId)) : false;
    const worksVisible = sanitized.worksPrivacy === 'me'
        ? isSelf
        : sanitized.worksPrivacy === 'friends'
            ? isSelf || isFriend
            : true;
    const likedVisible = sanitized.favPrivacy === 'me' ? isSelf : true;
    return { user, worksVisible, likedVisible };
}
export async function getUserRelation(userId, viewerId) {
    if (!viewerId) {
        return 'none';
    }
    if (String(userId) === String(viewerId)) {
        return 'self';
    }
    if (await areUsersFriends(String(userId), String(viewerId))) {
        return 'friend';
    }
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        EXISTS(
          SELECT 1
          FROM user_follow uf
          WHERE uf.follower_id = ?
            AND uf.following_id = ?
        ) AS is_following,
        EXISTS(
          SELECT 1
          FROM user_follow uf
          WHERE uf.follower_id = ?
            AND uf.following_id = ?
        ) AS is_fan
    `, [viewerId, userId, userId, viewerId]);
    const row = rows[0];
    if (Number(row?.is_following ?? 0) > 0) {
        return 'following';
    }
    if (Number(row?.is_fan ?? 0) > 0) {
        return 'fan';
    }
    return 'none';
}
