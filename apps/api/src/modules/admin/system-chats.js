import { getDbPool } from '../../lib/db';
import { mapChatStatus, mapRiskLevel, toIsoString, toNumber, USER_RISK_NORMAL, } from './system-shared';
async function fetchAdminChatRows() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        CONCAT(LEAST(cm.sender_id, cm.receiver_id), ':', GREATEST(cm.sender_id, cm.receiver_id)) AS conversation_key,
        LEAST(cm.sender_id, cm.receiver_id) AS user_a_id,
        GREATEST(cm.sender_id, cm.receiver_id) AS user_b_id,
        upa.name AS user_a_name,
        upb.name AS user_b_name,
        ua.uid_code AS user_a_uid,
        ub.uid_code AS user_b_uid,
        ua.risk_level AS user_a_risk_level,
        ub.risk_level AS user_b_risk_level,
        COUNT(*) AS message_count,
        SUM(CASE WHEN cm.is_read = 0 THEN 1 ELSE 0 END) AS unread_message_count,
        MAX(cm.created_at) AS updated_at
      FROM chat_message cm
      INNER JOIN user ua ON ua.id = LEAST(cm.sender_id, cm.receiver_id)
      INNER JOIN user ub ON ub.id = GREATEST(cm.sender_id, cm.receiver_id)
      LEFT JOIN user_profile upa ON upa.user_id = ua.id
      LEFT JOIN user_profile upb ON upb.user_id = ub.id
      GROUP BY
        conversation_key,
        user_a_id,
        user_b_id,
        upa.name,
        upb.name,
        ua.uid_code,
        ub.uid_code,
        ua.risk_level,
        ub.risk_level
      ORDER BY updated_at DESC, conversation_key DESC
      LIMIT 100
    `);
    return rows;
}
function toChatSummary(row) {
    const riskLevel = mapRiskLevel(Math.max(toNumber(row.user_a_risk_level ?? USER_RISK_NORMAL), toNumber(row.user_b_risk_level ?? USER_RISK_NORMAL)));
    return {
        id: row.conversation_key,
        userA: {
            id: String(row.user_a_id),
            uid: row.user_a_uid ?? null,
            name: row.user_a_name || `用户 ${String(row.user_a_id)}`,
        },
        userB: {
            id: String(row.user_b_id),
            uid: row.user_b_uid ?? null,
            name: row.user_b_name || `用户 ${String(row.user_b_id)}`,
        },
        messages: toNumber(row.message_count),
        unreadMessages: toNumber(row.unread_message_count),
        riskLevel,
        status: mapChatStatus(riskLevel),
        updatedAt: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
    };
}
function parseConversationKey(value) {
    const [left, right, ...rest] = value.split(':');
    if (!left || !right || rest.length > 0) {
        throw new Error('聊天会话不存在');
    }
    try {
        const leftValue = BigInt(left);
        const rightValue = BigInt(right);
        return leftValue <= rightValue
            ? { userAId: left, userBId: right }
            : { userAId: right, userBId: left };
    }
    catch {
        throw new Error('聊天会话不存在');
    }
}
export async function getAdminChats() {
    const rows = await fetchAdminChatRows();
    const items = rows.map((row) => toChatSummary(row));
    return {
        items,
        summary: {
            total: items.length,
            review: items.filter((item) => item.status === 'review').length,
            escalated: items.filter((item) => item.status === 'escalated').length,
            highRisk: items.filter((item) => item.riskLevel === 'high').length,
        },
        basis: '基于 chat_message 真表按用户对聚合唯一会话，风险等级取双方 user.risk_level 的较高值；当前没有 admin 聊天抽检专表。',
    };
}
export async function getAdminChatDetail(conversationKey) {
    const { userAId, userBId } = parseConversationKey(conversationKey);
    const db = getDbPool();
    const [summaryRows] = await db.execute(`
      SELECT
        CONCAT(LEAST(cm.sender_id, cm.receiver_id), ':', GREATEST(cm.sender_id, cm.receiver_id)) AS conversation_key,
        LEAST(cm.sender_id, cm.receiver_id) AS user_a_id,
        GREATEST(cm.sender_id, cm.receiver_id) AS user_b_id,
        upa.name AS user_a_name,
        upb.name AS user_b_name,
        ua.uid_code AS user_a_uid,
        ub.uid_code AS user_b_uid,
        ua.risk_level AS user_a_risk_level,
        ub.risk_level AS user_b_risk_level,
        COUNT(*) AS message_count,
        SUM(CASE WHEN cm.is_read = 0 THEN 1 ELSE 0 END) AS unread_message_count,
        MAX(cm.created_at) AS updated_at
      FROM chat_message cm
      INNER JOIN user ua ON ua.id = LEAST(cm.sender_id, cm.receiver_id)
      INNER JOIN user ub ON ub.id = GREATEST(cm.sender_id, cm.receiver_id)
      LEFT JOIN user_profile upa ON upa.user_id = ua.id
      LEFT JOIN user_profile upb ON upb.user_id = ub.id
      WHERE LEAST(cm.sender_id, cm.receiver_id) = ? AND GREATEST(cm.sender_id, cm.receiver_id) = ?
      GROUP BY
        conversation_key,
        user_a_id,
        user_b_id,
        upa.name,
        upb.name,
        ua.uid_code,
        ub.uid_code,
        ua.risk_level,
        ub.risk_level
      LIMIT 1
    `, [userAId, userBId]);
    const summaryRow = summaryRows[0];
    if (!summaryRow) {
        throw new Error('聊天会话不存在');
    }
    const summary = toChatSummary(summaryRow);
    const [messageRows] = await db.execute(`
      SELECT
        cm.id,
        cm.sender_id,
        cm.receiver_id,
        sender_profile.name AS sender_name,
        receiver_profile.name AS receiver_name,
        cm.content,
        cm.is_read,
        cm.created_at
      FROM chat_message cm
      LEFT JOIN user_profile sender_profile ON sender_profile.user_id = cm.sender_id
      LEFT JOIN user_profile receiver_profile ON receiver_profile.user_id = cm.receiver_id
      WHERE (cm.sender_id = ? AND cm.receiver_id = ?)
         OR (cm.sender_id = ? AND cm.receiver_id = ?)
      ORDER BY cm.created_at ASC, cm.id ASC
    `, [userAId, userBId, userBId, userAId]);
    return {
        conversation: {
            id: summary.id,
            userA: {
                ...summary.userA,
                riskLevel: mapRiskLevel(summaryRow.user_a_risk_level),
            },
            userB: {
                ...summary.userB,
                riskLevel: mapRiskLevel(summaryRow.user_b_risk_level),
            },
            messages: summary.messages,
            unreadMessages: summary.unreadMessages,
            riskLevel: summary.riskLevel,
            status: summary.status,
            updatedAt: summary.updatedAt,
        },
        messages: messageRows.map((row) => ({
            id: String(row.id),
            senderId: String(row.sender_id),
            senderName: row.sender_name || `用户 ${String(row.sender_id)}`,
            receiverId: String(row.receiver_id),
            receiverName: row.receiver_name || `用户 ${String(row.receiver_id)}`,
            content: row.content,
            read: Boolean(row.is_read),
            createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
        })),
        basis: '基于 chat_message 真表返回会话消息时间线；管理后台详情读取不会修改已读状态或会话摘要。',
    };
}
