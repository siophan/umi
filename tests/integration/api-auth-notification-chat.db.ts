import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type {
  ApiEnvelope,
  ChatConversationListResult,
  ChatDetailResult,
  NotificationListResult,
} from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  token: string;
  userId: number;
  peerId: number;
  notificationIds: number[];
  conversationIds: number[];
  chatMessageIds: number[];
};

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}8`;
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function createUser(db: DbPool, name: string, phone: string, uidCode: string) {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user (
        uid_code,
        phone_number,
        password,
        achievements
      ) VALUES (?, ?, '', JSON_ARRAY())
    `,
    [uidCode, phone],
  );
  await db.execute(
    'INSERT INTO user_profile (user_id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))',
    [result.insertId, name],
  );
  return result.insertId;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const userId = await createUser(db, 'Notify User', uniquePhone(`${seedKey}111`), `n${seedKey.slice(-6)}a`);
  const peerId = await createUser(db, 'Chat Peer', uniquePhone(`${seedKey}222`), `n${seedKey.slice(-6)}b`);

  const token = `it_notify_chat_${seedKey}`;
  await db.execute(
    'INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())',
    [token, userId],
  );

  const [notificationA] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO notification (
        user_id,
        type,
        title,
        content,
        is_read
      ) VALUES (?, 30, ?, ?, 0)
    `,
    [userId, '竞猜提醒', '你有新的竞猜消息'],
  );
  const [notificationB] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO notification (
        user_id,
        type,
        title,
        content,
        is_read
      ) VALUES (?, 20, ?, ?, 1)
    `,
    [userId, '订单更新', '订单已发货'],
  );

  const [messageA] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_message (
        sender_id,
        receiver_id,
        content,
        is_read
      ) VALUES (?, ?, ?, 0)
    `,
    [peerId, userId, '你好，我先发一条'],
  );
  const [messageB] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_message (
        sender_id,
        receiver_id,
        content,
        is_read
      ) VALUES (?, ?, ?, 1)
    `,
    [userId, peerId, '收到'],
  );

  const [conversationUser] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_conversation (
        user_id,
        peer_id,
        last_message_id,
        unread_count,
        last_message,
        last_message_at
      ) VALUES (?, ?, ?, 1, ?, NOW())
    `,
    [userId, peerId, messageA.insertId, '你好，我先发一条'],
  );
  const [conversationPeer] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_conversation (
        user_id,
        peer_id,
        last_message_id,
        unread_count,
        last_message,
        last_message_at
      ) VALUES (?, ?, ?, 0, ?, NOW())
    `,
    [peerId, userId, messageB.insertId, '收到'],
  );

  return {
    token,
    userId,
    peerId,
    notificationIds: [notificationA.insertId, notificationB.insertId],
    conversationIds: [conversationUser.insertId, conversationPeer.insertId],
    chatMessageIds: [messageA.insertId, messageB.insertId],
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) return;
  await db.execute('DELETE FROM chat_conversation WHERE id IN (?, ?)', state.conversationIds);
  await db.execute('DELETE FROM chat_message WHERE id IN (?, ?, ?)', [
    state.chatMessageIds[0],
    state.chatMessageIds[1],
    state.chatMessageIds[2] ?? -1,
  ]);
  await db.execute('DELETE FROM notification WHERE id IN (?, ?)', state.notificationIds);
  await db.execute('DELETE FROM auth_session WHERE token = ?', [state.token]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?)', [state.userId, state.peerId]);
  await db.execute('DELETE FROM user WHERE id IN (?, ?)', [state.userId, state.peerId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const notificationsResponse = await getJson(baseUrl, '/api/auth/notifications', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(notificationsResponse.response.status, 200);
      const notifications = getEnvelopeData<NotificationListResult>(notificationsResponse.json);
      assert.equal(notifications.items.length, 2);
      assert.deepEqual(
        notifications.items.map((item) => item.type).sort(),
        ['guess', 'order'],
      );

      const readAllResponse = await getJson(baseUrl, '/api/auth/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(readAllResponse.response.status, 200);

      const notificationsAfter = await getJson(baseUrl, '/api/auth/notifications', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const notificationsAfterData = getEnvelopeData<NotificationListResult>(notificationsAfter.json);
      assert.ok(notificationsAfterData.items.every((item) => item.read));

      const chatsResponse = await getJson(baseUrl, '/api/auth/chats', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(chatsResponse.response.status, 200);
      const chats = getEnvelopeData<ChatConversationListResult>(chatsResponse.json);
      assert.equal(chats.items.length, 1);
      assert.equal(chats.items[0]?.unreadCount, 1);
      assert.equal(chats.items[0]?.name, 'Chat Peer');

      const detailResponse = await getJson(baseUrl, `/api/auth/chats/${state.peerId}`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(detailResponse.response.status, 200);
      const detail = getEnvelopeData<ChatDetailResult>(detailResponse.json);
      assert.equal(detail.peer.name, 'Chat Peer');
      assert.equal(detail.items.length, 2);
      assert.equal(detail.items[0]?.from, 'other');

      const chatsAfterDetail = await getJson(baseUrl, '/api/auth/chats', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const chatsAfterDetailData = getEnvelopeData<ChatConversationListResult>(chatsAfterDetail.json);
      assert.equal(chatsAfterDetailData.items[0]?.unreadCount, 0);

      const sendResponse = await getJson(baseUrl, `/api/auth/chats/${state.peerId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '继续聊' }),
      });
      assert.equal(sendResponse.response.status, 200);

      const detailAfterSend = await getJson(baseUrl, `/api/auth/chats/${state.peerId}`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const detailAfterSendData = getEnvelopeData<ChatDetailResult>(detailAfterSend.json);
      assert.equal(detailAfterSendData.items.length, 3);
      assert.equal(detailAfterSendData.items[2]?.content, '继续聊');
      state.chatMessageIds.push(Number(detailAfterSendData.items[2]?.id));
    });

    console.log('api-auth-notification-chat.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-auth-notification-chat.db: failed');
  console.error(error);
  process.exitCode = 1;
});
