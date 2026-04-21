import { getDbPool } from '../../lib/db';
import { mapNotificationAudience, mapNotificationAudienceTargetType, mapNotificationTargetType, mapNotificationType, NOTIFICATION_TYPE_GUESS, NOTIFICATION_TYPE_ORDER, NOTIFICATION_TYPE_SOCIAL, NOTIFICATION_TYPE_SYSTEM, toIsoString, toNumber, uniq, } from './system-shared';
const NOTIFICATION_BATCH_BASE_SQL = `
  SELECT
    SHA2(
      CONCAT_WS(
        '#',
        COALESCE(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s.%f'), ''),
        COALESCE(CAST(type AS CHAR), ''),
        COALESCE(title, ''),
        COALESCE(content, ''),
        COALESCE(CAST(target_type AS CHAR), ''),
        COALESCE(CAST(target_id AS CHAR), ''),
        COALESCE(action_url, '')
      ),
      256
    ) AS notification_key,
    title,
    content,
    type,
    target_type,
    target_id,
    action_url,
    MIN(created_at) AS batch_created_at,
    COUNT(*) AS recipient_count,
    SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS read_count,
    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
    MAX(created_at) AS last_created_at
  FROM notification
  GROUP BY
    notification_key,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s.%f'),
    title,
    content,
    type,
    target_type,
    target_id,
    action_url
`;
function clampPagination(page, pageSize) {
    const safePage = Number.isFinite(page) && Number(page) > 0 ? Math.floor(Number(page)) : 1;
    const safePageSize = Number.isFinite(pageSize) && Number(pageSize) > 0
        ? Math.min(Math.floor(Number(pageSize)), 100)
        : 10;
    return { page: safePage, pageSize: safePageSize };
}
function mapNotificationTypeCode(type) {
    if (type === 'order')
        return NOTIFICATION_TYPE_ORDER;
    if (type === 'guess')
        return NOTIFICATION_TYPE_GUESS;
    if (type === 'social')
        return NOTIFICATION_TYPE_SOCIAL;
    if (type === 'system')
        return NOTIFICATION_TYPE_SYSTEM;
    return null;
}
function buildNotificationWhereClause(query) {
    const clauses = [];
    const params = [];
    if (query.keyword?.trim()) {
        clauses.push('b.title LIKE ?');
        params.push(`%${query.keyword.trim()}%`);
    }
    const typeCode = mapNotificationTypeCode(query.type);
    if (typeCode != null) {
        clauses.push('b.type = ?');
        params.push(typeCode);
    }
    if (query.audience === 'all_users') {
        clauses.push('b.target_type IS NULL');
    }
    else if (query.audience) {
        clauses.push('b.target_type = ?');
        params.push(mapNotificationAudienceTargetType(query.audience));
    }
    return {
        sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
        params,
    };
}
async function fetchNotificationRecipientIds(connection, audience) {
    if (audience === 'order_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT o.user_id AS user_id
        FROM \`order\` o
        INNER JOIN user u ON u.id = o.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'guess_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT gb.user_id AS user_id
        FROM guess_bet gb
        INNER JOIN user u ON u.id = gb.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'post_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT p.user_id AS user_id
        FROM post p
        INNER JOIN user u ON u.id = p.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'chat_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT candidate.user_id AS user_id
        FROM (
          SELECT sender_id AS user_id FROM chat_message
          UNION
          SELECT receiver_id AS user_id FROM chat_message
        ) candidate
        INNER JOIN user u ON u.id = candidate.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    const [rows] = await connection.execute(`
      SELECT id
      FROM user
      WHERE COALESCE(banned, 0) = 0
    `);
    return rows
        .map((row) => row.id)
        .filter((value) => value != null)
        .map((value) => String(value));
}
async function fetchAdminNotificationBatches(query) {
    const db = getDbPool();
    const { page, pageSize } = clampPagination(query.page, query.pageSize);
    const offset = (page - 1) * pageSize;
    const whereClause = buildNotificationWhereClause(query);
    const [rows] = await db.query(`
      SELECT b.*
      FROM (
        ${NOTIFICATION_BATCH_BASE_SQL}
      ) b
      ${whereClause.sql}
      ORDER BY b.last_created_at DESC, b.notification_key DESC
      LIMIT ? OFFSET ?
    `, [...whereClause.params, pageSize, offset]);
    const [countRows] = await db.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(b.recipient_count), 0) AS sent,
        COALESCE(SUM(b.read_count), 0) AS \`read\`,
        COALESCE(SUM(b.unread_count), 0) AS unread
      FROM (
        ${NOTIFICATION_BATCH_BASE_SQL}
      ) b
      ${whereClause.sql}
    `, whereClause.params);
    return {
        items: rows,
        summary: (countRows[0] ?? {
            total: 0,
            sent: 0,
            read: 0,
            unread: 0,
        }),
        page,
        pageSize,
    };
}
export async function getAdminNotifications(query = {}) {
    const result = await fetchAdminNotificationBatches(query);
    const items = result.items.map((row) => ({
        id: row.notification_key,
        title: row.title || '系统通知',
        content: row.content ?? null,
        audience: mapNotificationAudience(row.target_type),
        type: mapNotificationType(row.type),
        status: 'sent',
        targetType: mapNotificationTargetType(row.target_type),
        targetId: row.target_id == null ? null : String(row.target_id),
        actionUrl: row.action_url ?? null,
        recipientCount: toNumber(row.recipient_count),
        readCount: toNumber(row.read_count),
        unreadCount: toNumber(row.unread_count),
        createdAt: toIsoString(row.batch_created_at) ?? new Date(0).toISOString(),
        sentAt: toIsoString(row.last_created_at) ?? new Date(0).toISOString(),
    }));
    return {
        items,
        total: toNumber(result.summary.total),
        page: result.page,
        pageSize: result.pageSize,
        summary: {
            total: toNumber(result.summary.total),
            sent: toNumber(result.summary.sent),
            read: toNumber(result.summary.read),
            unread: toNumber(result.summary.unread),
        },
        basis: '基于 notification 真表按消息载荷聚合为发送批次视图；搜索、筛选和分页都建立在真实批次全集上。',
    };
}
export async function createAdminNotification(payload) {
    const title = payload.title.trim();
    const content = payload.content.trim();
    if (!title) {
        throw new Error('通知标题不能为空');
    }
    if (!content) {
        throw new Error('通知内容不能为空');
    }
    const type = payload.type === 'order'
        ? NOTIFICATION_TYPE_ORDER
        : payload.type === 'guess'
            ? NOTIFICATION_TYPE_GUESS
            : payload.type === 'social'
                ? NOTIFICATION_TYPE_SOCIAL
                : NOTIFICATION_TYPE_SYSTEM;
    const targetType = mapNotificationAudienceTargetType(payload.audience);
    const db = getDbPool();
    const connection = await db.getConnection();
    const batchCreatedAt = new Date();
    try {
        await connection.beginTransaction();
        const recipientIds = uniq(await fetchNotificationRecipientIds(connection, payload.audience));
        if (recipientIds.length === 0) {
            throw new Error('当前筛选人群没有可发送用户');
        }
        for (const userId of recipientIds) {
            await connection.execute(`
          INSERT INTO notification (
            user_id,
            type,
            title,
            content,
            target_type,
            target_id,
            action_url,
            is_read,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, NULL, ?, 0, ?, ?)
        `, [
                userId,
                type,
                title,
                content,
                targetType,
                payload.actionUrl?.trim() || null,
                batchCreatedAt,
                batchCreatedAt,
            ]);
        }
        await connection.commit();
        return { sentCount: recipientIds.length };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
