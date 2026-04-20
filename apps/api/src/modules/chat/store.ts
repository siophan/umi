import type mysql from 'mysql2/promise';

import { toEntityId, type UserId } from '@umi/shared';
import type {
  ChatConversationListResult,
  ChatDetailResult,
  ChatMessageItem,
  SendChatMessagePayload,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { getUserSummaryById } from '../users/query-store';

type ChatConversationRow = {
  peer_id: number | string;
  unread_count: number | string;
  last_message: string;
  last_message_at: Date | string;
  peer_name: string | null;
  peer_avatar_url: string | null;
};

type ChatRow = {
  id: number;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  is_read: number | boolean;
  created_at: Date | string;
};

function sanitizeChatMessage(row: ChatRow, userId: string): ChatMessageItem {
  const senderId = toEntityId<UserId>(row.sender_id);
  const receiverId = toEntityId<UserId>(row.receiver_id);
  return {
    id: toEntityId(row.id),
    from: senderId === userId ? 'me' : 'other',
    senderId,
    receiverId,
    content: row.content,
    read: Boolean(row.is_read),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function upsertConversationSummary(
  userId: string,
  peerId: string,
  lastMessage: string,
  unreadMode: 'reset' | 'increment',
) {
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO chat_conversation (
        user_id,
        peer_id,
        unread_count,
        last_message,
        last_message_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        unread_count = ${unreadMode === 'increment' ? 'chat_conversation.unread_count + 1' : '0'},
        last_message = VALUES(last_message),
        last_message_at = VALUES(last_message_at),
        updated_at = CURRENT_TIMESTAMP(3)
    `,
    [userId, peerId, unreadMode === 'increment' ? 1 : 0, lastMessage],
  );
}

export async function getChatConversations(userId: string): Promise<ChatConversationListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        cc.peer_id,
        cc.unread_count,
        cc.last_message,
        cc.last_message_at,
        up.name AS peer_name,
        up.avatar_url AS peer_avatar_url
      FROM chat_conversation cc
      LEFT JOIN user_profile up ON up.user_id = cc.peer_id
      WHERE cc.user_id = ?
      ORDER BY cc.last_message_at DESC, cc.updated_at DESC
    `,
    [userId],
  );

  return {
    items: (rows as ChatConversationRow[]).map((row) => ({
      userId: toEntityId(row.peer_id),
      name: row.peer_name || '未知用户',
      avatar: row.peer_avatar_url ?? null,
      unreadCount: Number(row.unread_count ?? 0),
      lastMessage: row.last_message,
      lastMessageAt: new Date(row.last_message_at).toISOString(),
    })),
  };
}

export async function getChatDetail(userId: string, peerId: string): Promise<ChatDetailResult> {
  const peer = await getUserSummaryById(peerId);
  if (!peer) {
    throw new Error('聊天对象不存在');
  }
  const db = getDbPool();
  await db.execute(
    `UPDATE chat_message SET is_read = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
    [peerId, userId],
  );
  await db.execute(
    `UPDATE chat_conversation SET unread_count = 0, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND peer_id = ?`,
    [userId, peerId],
  );
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, sender_id, receiver_id, content, is_read, created_at
      FROM chat_message
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC, id ASC
    `,
    [userId, peerId, peerId, userId],
  );

  return {
    peer: {
      id: peer.id,
      uid: peer.uid,
      name: peer.name,
      avatar: peer.avatar,
      level: peer.level,
      title: peer.title,
      signature: peer.signature,
      followers: peer.followers,
      following: peer.following,
      winRate: peer.winRate,
      shopVerified: peer.shopVerified,
    },
    items: (rows as ChatRow[]).map((row) => sanitizeChatMessage(row, userId)),
  };
}

export async function sendChatMessage(
  userId: string,
  peerId: string,
  payload: SendChatMessagePayload,
): Promise<ChatMessageItem> {
  const peer = await getUserSummaryById(peerId);
  if (!peer) {
    throw new Error('聊天对象不存在');
  }
  const content = payload.content.trim();
  if (!content) {
    throw new Error('消息内容不能为空');
  }
  const db = getDbPool();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_message (sender_id, receiver_id, content, is_read, created_at, updated_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, peerId, content],
  );
  await Promise.all([
    upsertConversationSummary(userId, peerId, content, 'reset'),
    upsertConversationSummary(peerId, userId, content, 'increment'),
  ]);
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, sender_id, receiver_id, content, is_read, created_at FROM chat_message WHERE id = ? LIMIT 1`,
    [result.insertId],
  );
  const row = rows[0] as ChatRow | undefined;
  if (!row) {
    throw new Error('消息发送成功后读取失败');
  }
  return sanitizeChatMessage(row, userId);
}
