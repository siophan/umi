import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { GUESS_REVIEW_APPROVED, GUESS_STATUS_ACTIVE, appendLikeFilter, sanitizeLiveRoom, } from './content-shared';
const LIVE_STATUS_ENDED = 90;
async function fetchAdminLiveRoomById(id) {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
      WHERE l.id = ?
      LIMIT 1
    `, [
        GUESS_STATUS_ACTIVE,
        GUESS_REVIEW_APPROVED,
        GUESS_STATUS_ACTIVE,
        GUESS_REVIEW_APPROVED,
        id,
    ]);
    const row = rows[0];
    return row ? sanitizeLiveRoom(row) : null;
}
export async function getAdminLiveRooms(params) {
    const db = getDbPool();
    const clauses = [];
    const values = [
        GUESS_STATUS_ACTIVE,
        GUESS_REVIEW_APPROVED,
        GUESS_STATUS_ACTIVE,
        GUESS_REVIEW_APPROVED,
    ];
    appendLikeFilter(clauses, values, "COALESCE(l.title, '') LIKE ?", params.title);
    appendLikeFilter(clauses, values, "COALESCE(up.name, '') LIKE ?", params.host);
    appendLikeFilter(clauses, values, "COALESCE(current_guess_title, '') LIKE ?", params.guessTitle);
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
export async function stopAdminLiveRoom(id) {
    const db = getDbPool();
    const existing = await fetchAdminLiveRoomById(id);
    if (!existing) {
        throw new HttpError(404, 'ADMIN_LIVE_NOT_FOUND', '直播不存在');
    }
    if (existing.status !== 'live') {
        throw new HttpError(400, 'ADMIN_LIVE_NOT_ACTIVE', '仅直播中的房间允许强制下播');
    }
    await db.execute(`
      UPDATE live
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [LIVE_STATUS_ENDED, id]);
    const item = await fetchAdminLiveRoomById(id);
    if (!item) {
        throw new HttpError(404, 'ADMIN_LIVE_NOT_FOUND', '直播不存在');
    }
    return { item };
}
