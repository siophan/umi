import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
const NOTIFICATION_SYSTEM = 10;
const NOTIFICATION_ORDER = 20;
const NOTIFICATION_GUESS = 30;
const NOTIFICATION_SOCIAL = 40;
function sanitizeNotification(row) {
    const code = Number(row.type ?? NOTIFICATION_SYSTEM);
    return {
        id: toEntityId(row.id),
        type: code === NOTIFICATION_ORDER
            ? 'order'
            : code === NOTIFICATION_GUESS
                ? 'guess'
                : code === NOTIFICATION_SOCIAL
                    ? 'social'
                    : 'system',
        read: Boolean(row.is_read),
        title: row.title || '系统通知',
        content: row.content || '',
        createdAt: new Date(row.created_at).toISOString(),
    };
}
export async function getNotifications(userId) {
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id, type, title, content, is_read, created_at FROM notification WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`, [userId]);
    return { items: rows.map((row) => sanitizeNotification(row)) };
}
export async function markAllNotificationsRead(userId) {
    const db = getDbPool();
    await db.execute(`UPDATE notification SET is_read = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND is_read = 0`, [userId]);
}
export async function markNotificationRead(userId, notificationId) {
    const db = getDbPool();
    await db.execute(`
      UPDATE notification
      SET is_read = 1,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND id = ?
        AND is_read = 0
    `, [userId, notificationId]);
}
