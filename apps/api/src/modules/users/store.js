import { getDbPool } from '../../lib/db';
import { COMMENT_TARGET_POST, POST_INTERACTION_BOOKMARK, POST_INTERACTION_LIKE, } from '../community/constants';
import { sanitizePost } from '../community/serializer';
import { favPrivacyValueToCode, genderValueToCode, normalizeBirthdayInput, sanitizePublicUser, sanitizeUser, worksPrivacyValueToCode, } from './model';
import { getUserRelation, resolveProfileVisibility, } from './privacy';
import { findUserById, findUserByPublicKey, } from './query-store';
export async function getUserProfileById(userId, viewerId) {
    const targetUser = await findUserByPublicKey(userId);
    const visibility = targetUser ? await resolveProfileVisibility(String(targetUser.id), viewerId) : null;
    if (!visibility) {
        return null;
    }
    const relation = await getUserRelation(String(visibility.user.id), viewerId);
    return {
        ...sanitizePublicUser(visibility.user, visibility.worksVisible, visibility.likedVisible),
        relation,
    };
}
export async function getUserPublicActivity(userId, viewerId) {
    const targetUser = await findUserByPublicKey(userId);
    const visibility = targetUser ? await resolveProfileVisibility(String(targetUser.id), viewerId) : null;
    if (!visibility) {
        return null;
    }
    const db = getDbPool();
    let works = [];
    let likes = [];
    if (visibility.worksVisible) {
        const [worksRows] = await db.execute(`
        SELECT
          p.id,
          p.title,
          p.content,
          p.tag,
          p.images,
          p.created_at,
          up.name AS author_name,
          up.avatar_url AS author_avatar_url,
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
          ), 0) AS comments
        FROM post p
        LEFT JOIN user_profile up ON up.user_id = p.user_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 20
      `, [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId]);
        works = worksRows.map((row) => sanitizePost(row));
    }
    if (visibility.likedVisible) {
        const [likeRows] = await db.execute(`
        SELECT
          p.id,
          p.title,
          p.content,
          p.tag,
          p.images,
          p.created_at,
          up.name AS author_name,
          up.avatar_url AS author_avatar_url,
          COALESCE((
            SELECT COUNT(*)
            FROM post_interaction pi2
            WHERE pi2.post_id = p.id
              AND pi2.interaction_type = ?
          ), 0) AS likes,
          COALESCE((
            SELECT COUNT(*)
            FROM comment_item ci
            WHERE ci.target_id = p.id
              AND ci.target_type = ?
          ), 0) AS comments
        FROM post_interaction pi
        INNER JOIN post p ON p.id = pi.post_id
        LEFT JOIN user_profile up ON up.user_id = p.user_id
        WHERE pi.user_id = ?
          AND pi.interaction_type = ?
        ORDER BY pi.created_at DESC
        LIMIT 20
      `, [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId, POST_INTERACTION_LIKE]);
        likes = likeRows.map((row) => sanitizePost(row));
    }
    return {
        worksVisible: visibility.worksVisible,
        likedVisible: visibility.likedVisible,
        works,
        likes,
    };
}
export async function followUser(viewerId, targetUserId) {
    if (String(viewerId) === String(targetUserId)) {
        throw new Error('不能关注自己');
    }
    const target = await findUserById(targetUserId);
    if (!target) {
        throw new Error('用户不存在');
    }
    const db = getDbPool();
    const [existing] = await db.execute(`
      SELECT id
      FROM user_follow
      WHERE follower_id = ?
        AND following_id = ?
      LIMIT 1
    `, [viewerId, targetUserId]);
    if (existing.length === 0) {
        await db.execute(`
        INSERT INTO user_follow (follower_id, following_id, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `, [viewerId, targetUserId]);
    }
    return { success: true };
}
export async function unfollowUser(viewerId, targetUserId) {
    const db = getDbPool();
    await db.execute(`
      DELETE FROM user_follow
      WHERE follower_id = ?
        AND following_id = ?
    `, [viewerId, targetUserId]);
    return { success: true };
}
export async function getMeActivity(userId) {
    const db = getDbPool();
    const [worksRows] = await db.execute(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
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
        ), 0) AS comments
      FROM post p
      LEFT JOIN user_profile up ON up.user_id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId]);
    const [bookmarkRows] = await db.execute(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.interaction_type = ?
        ), 0) AS likes,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci
          WHERE ci.target_id = p.id
            AND ci.target_type = ?
        ), 0) AS comments
      FROM post_interaction pi
      INNER JOIN post p ON p.id = pi.post_id
      LEFT JOIN user_profile up ON up.user_id = p.user_id
      WHERE pi.user_id = ?
        AND pi.interaction_type = ?
      ORDER BY pi.created_at DESC
      LIMIT 20
    `, [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId, POST_INTERACTION_BOOKMARK]);
    const [likeRows] = await db.execute(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.interaction_type = ?
        ), 0) AS likes,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci
          WHERE ci.target_id = p.id
            AND ci.target_type = ?
        ), 0) AS comments
      FROM post_interaction pi
      INNER JOIN post p ON p.id = pi.post_id
      LEFT JOIN user_profile up ON up.user_id = p.user_id
      WHERE pi.user_id = ?
        AND pi.interaction_type = ?
      ORDER BY pi.created_at DESC
      LIMIT 20
    `, [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId, POST_INTERACTION_LIKE]);
    const [messageCountRows] = await db.execute(`SELECT COALESCE(SUM(unread_count), 0) AS unread_count FROM chat_conversation WHERE user_id = ?`, [userId]);
    return {
        unreadMessageCount: Number(messageCountRows[0]?.unread_count ?? 0),
        works: worksRows.map((row) => sanitizePost(row)),
        bookmarks: bookmarkRows.map((row) => sanitizePost(row)),
        likes: likeRows.map((row) => sanitizePost(row)),
    };
}
export async function updateMe(userId, payload) {
    const db = getDbPool();
    const updates = [];
    const values = [];
    if (payload.name !== undefined) {
        const name = payload.name.trim();
        if (name.length < 2) {
            throw new Error('昵称长度至少2位');
        }
        updates.push('name = ?');
        values.push(name);
    }
    if (payload.avatar !== undefined) {
        updates.push('avatar_url = ?');
        values.push(payload.avatar || null);
    }
    if (payload.signature !== undefined) {
        updates.push('signature = ?');
        values.push(payload.signature?.trim() || null);
    }
    if (payload.gender !== undefined) {
        updates.push('gender = ?');
        values.push(genderValueToCode(payload.gender));
    }
    if (payload.birthday !== undefined) {
        updates.push('birthday = ?');
        values.push(normalizeBirthdayInput(payload.birthday));
    }
    if (payload.region !== undefined) {
        updates.push('region = ?');
        values.push(payload.region?.trim() || null);
    }
    if (payload.worksPrivacy !== undefined) {
        updates.push('works_privacy = ?');
        values.push(worksPrivacyValueToCode(payload.worksPrivacy));
    }
    if (payload.favPrivacy !== undefined) {
        updates.push('fav_privacy = ?');
        values.push(favPrivacyValueToCode(payload.favPrivacy));
    }
    if (updates.length > 0) {
        const name = payload.name?.trim() || '未命名用户';
        await db.execute(`
        INSERT INTO user_profile (user_id, name, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(3)
      `, [userId, name]);
        await db.execute(`UPDATE user_profile SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ?`, [...values, userId]);
    }
    const user = await findUserById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    return sanitizeUser(user);
}
export async function getMeSummary(userId) {
    const db = getDbPool();
    const [activeOrderRows] = await db.execute(`
      SELECT COUNT(*) AS active_order_count
      FROM \`order\`
      WHERE user_id = ?
        AND status IN (10, 20)
    `, [userId]);
    const [availableCouponRows] = await db.execute(`
      SELECT COUNT(*) AS available_coupon_count
      FROM coupon
      WHERE user_id = ?
        AND status = 10
        AND (expire_at IS NULL OR expire_at >= CURRENT_TIMESTAMP)
    `, [userId]);
    const [virtualWarehouseRows] = await db.execute(`
      SELECT COALESCE(SUM(quantity), 0) AS total_quantity
      FROM virtual_warehouse
      WHERE user_id = ?
        AND status IN (10, 20, 30)
    `, [userId]);
    const [fulfillmentWarehouseRows] = await db.execute(`
      SELECT COALESCE(SUM(oi.quantity), 0) AS total_quantity
      FROM fulfillment_order fo
      INNER JOIN \`order\` o ON o.id = fo.order_id
      INNER JOIN order_item oi ON oi.order_id = o.id
      WHERE fo.user_id = ?
        AND fo.status IN (10, 20, 30)
    `, [userId]);
    const [physicalWarehouseRows] = await db.execute(`
      SELECT COALESCE(SUM(quantity), 0) AS total_quantity
      FROM physical_warehouse
      WHERE user_id = ?
        AND status IN (10, 20, 30)
    `, [userId]);
    const warehouseItemCount = Number(virtualWarehouseRows[0]?.total_quantity ?? 0) +
        Number(fulfillmentWarehouseRows[0]?.total_quantity ?? 0) +
        Number(physicalWarehouseRows[0]?.total_quantity ?? 0);
    return {
        activeOrderCount: Number(activeOrderRows[0]?.active_order_count ?? 0),
        warehouseItemCount,
        availableCouponCount: Number(availableCouponRows[0]?.available_coupon_count ?? 0),
    };
}
