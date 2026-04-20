import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type {
  ApiEnvelope,
  MeActivityResult,
  SocialOverviewResult,
} from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const FRIENDSHIP_PENDING = 10;
const FRIENDSHIP_ACCEPTED = 30;
const POST_TYPE_NORMAL = 10;
const POST_SCOPE_PUBLIC = 10;
const POST_INTERACTION_LIKE = 10;
const POST_INTERACTION_BOOKMARK = 20;

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  token: string;
  userIds: number[];
  shopId: number;
  friendshipIds: number[];
  followIds: number[];
  postIds: number[];
  interactionIds: number[];
  conversationId: number;
  guessBetIds: number[];
};

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = `${Date.now()}${seed.replace(/\D/g, '')}${Math.floor(Math.random() * 1000)}`
    .slice(-10)
    .padStart(10, '0');
  return `1${digits}`;
}

function uniqueUid(seed: string) {
  return `${seed}${Math.random().toString(36).slice(2, 8)}`.slice(-8);
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function createUser(db: DbPool, name: string, seedKey: string, suffix: string) {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user (
        uid_code,
        phone_number,
        password,
        achievements
      ) VALUES (?, ?, '', JSON_ARRAY())
    `,
    [uniqueUid(`${seedKey}${suffix}`), uniquePhone(`${seedKey}${suffix}`), ''],
  );

  await db.execute(
    `
      INSERT INTO user_profile (
        user_id,
        name,
        avatar_url,
        signature,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [result.insertId, name, `https://example.com/${suffix}.png`, `${name} signature`],
  );

  return result.insertId;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const meId = await createUser(db, 'Social Me', seedKey, 'me');
  const friendId = await createUser(db, 'Accepted Friend', seedKey, 'fr');
  const followingId = await createUser(db, 'Following Only', seedKey, 'fg');
  const fanId = await createUser(db, 'Fan Only', seedKey, 'fa');
  const requesterId = await createUser(db, 'Pending Request', seedKey, 'rq');
  const authorId = await createUser(db, 'Post Author', seedKey, 'au');

  const token = `it_auth_social_${seedKey}`;
  await db.execute(
    `
      INSERT INTO auth_session (
        token,
        user_id,
        expires_at,
        created_at,
        updated_at
      ) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())
    `,
    [token, meId],
  );

  const [shopResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO shop (
        user_id,
        name,
        category_id,
        description,
        logo_url,
        status
      ) VALUES (?, ?, NULL, ?, ?, 10)
    `,
    [friendId, `Friend Shop ${seedKey}`, 'friend verified shop', 'https://example.com/friend-shop.png'],
  );

  const [friendshipAccepted] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO friendship (
        user_id,
        friend_id,
        status,
        message
      ) VALUES (?, ?, ?, ?)
    `,
    [meId, friendId, FRIENDSHIP_ACCEPTED, 'already friends'],
  );
  const [friendshipPending] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO friendship (
        user_id,
        friend_id,
        status,
        message
      ) VALUES (?, ?, ?, ?)
    `,
    [requesterId, meId, FRIENDSHIP_PENDING, 'let us connect'],
  );

  const [followA] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user_follow (
        follower_id,
        following_id
      ) VALUES (?, ?)
    `,
    [meId, followingId],
  );
  const [followB] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user_follow (
        follower_id,
        following_id
      ) VALUES (?, ?)
    `,
    [fanId, meId],
  );

  const [workPost] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        scope
      ) VALUES (?, ?, ?, ?, JSON_ARRAY(?), ?, ?)
    `,
    [meId, POST_TYPE_NORMAL, `Work Post ${seedKey}`, 'my own work', 'https://example.com/work.png', 'work', POST_SCOPE_PUBLIC],
  );
  const [bookmarkPost] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        scope
      ) VALUES (?, ?, ?, ?, JSON_ARRAY(?), ?, ?)
    `,
    [authorId, POST_TYPE_NORMAL, `Bookmark Post ${seedKey}`, 'bookmark target', 'https://example.com/bookmark.png', 'bookmark', POST_SCOPE_PUBLIC],
  );
  const [likedPost] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        scope
      ) VALUES (?, ?, ?, ?, JSON_ARRAY(?), ?, ?)
    `,
    [authorId, POST_TYPE_NORMAL, `Liked Post ${seedKey}`, 'liked target', 'https://example.com/liked.png', 'liked', POST_SCOPE_PUBLIC],
  );

  const [likeWork] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post_interaction (
        user_id,
        post_id,
        interaction_type
      ) VALUES (?, ?, ?)
    `,
    [friendId, workPost.insertId, POST_INTERACTION_LIKE],
  );
  const [bookmarkLink] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post_interaction (
        user_id,
        post_id,
        interaction_type
      ) VALUES (?, ?, ?)
    `,
    [meId, bookmarkPost.insertId, POST_INTERACTION_BOOKMARK],
  );
  const [likeLink] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post_interaction (
        user_id,
        post_id,
        interaction_type
      ) VALUES (?, ?, ?)
    `,
    [meId, likedPost.insertId, POST_INTERACTION_LIKE],
  );
  const [likeLinkExtra] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post_interaction (
        user_id,
        post_id,
        interaction_type
      ) VALUES (?, ?, ?)
    `,
    [friendId, likedPost.insertId, POST_INTERACTION_LIKE],
  );

  const [conversationResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO chat_conversation (
        user_id,
        peer_id,
        last_message,
        last_message_at,
        unread_count
      ) VALUES (?, ?, ?, NOW(), 3)
    `,
    [meId, friendId, 'unread ping'],
  );

  const [guessBetFriend] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, 1001, 0, 49, 2001, 30)
    `,
    [friendId],
  );
  const [guessBetFollowing] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, 1002, 1, 59, 2002, 10)
    `,
    [followingId],
  );

  return {
    token,
    userIds: [meId, friendId, followingId, fanId, requesterId, authorId],
    shopId: shopResult.insertId,
    friendshipIds: [friendshipAccepted.insertId, friendshipPending.insertId],
    followIds: [followA.insertId, followB.insertId],
    postIds: [workPost.insertId, bookmarkPost.insertId, likedPost.insertId],
    interactionIds: [likeWork.insertId, bookmarkLink.insertId, likeLink.insertId, likeLinkExtra.insertId],
    conversationId: conversationResult.insertId,
    guessBetIds: [guessBetFriend.insertId, guessBetFollowing.insertId],
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM guess_bet WHERE id IN (?, ?)', state.guessBetIds);
  await db.execute('DELETE FROM chat_conversation WHERE id = ?', [state.conversationId]);
  await db.execute('DELETE FROM post_interaction WHERE id IN (?, ?, ?, ?)', state.interactionIds);
  await db.execute('DELETE FROM post WHERE id IN (?, ?, ?)', state.postIds);
  await db.execute('DELETE FROM user_follow WHERE id IN (?, ?)', state.followIds);
  await db.execute('DELETE FROM friendship WHERE id IN (?, ?)', state.friendshipIds);
  await db.execute('DELETE FROM shop WHERE id = ?', [state.shopId]);
  await db.execute('DELETE FROM auth_session WHERE token = ?', [state.token]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?, ?, ?, ?, ?)', state.userIds);
  await db.execute('DELETE FROM user WHERE id IN (?, ?, ?, ?, ?, ?)', state.userIds);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const [socialResponse, activityResponse] = await Promise.all([
        getJson(baseUrl, '/api/auth/social', {
          headers: { Authorization: `Bearer ${state.token}` },
        }),
        getJson(baseUrl, '/api/auth/me/activity', {
          headers: { Authorization: `Bearer ${state.token}` },
        }),
      ]);

      assert.equal(socialResponse.response.status, 200);
      assert.equal(activityResponse.response.status, 200);

      const socialData = getEnvelopeData<SocialOverviewResult>(socialResponse.json);
      const activityData = getEnvelopeData<MeActivityResult>(activityResponse.json);

      assert.equal(socialData.friends.length, 1);
      assert.equal(socialData.friends[0]?.name, 'Accepted Friend');
      assert.equal(socialData.friends[0]?.status, null);
      assert.equal(socialData.friends[0]?.shopVerified, true);
      assert.equal(socialData.friends[0]?.winRate, 100);

      assert.equal(socialData.following.length, 1);
      assert.equal(socialData.following[0]?.name, 'Following Only');
      assert.equal(socialData.following[0]?.winRate, 0);

      assert.equal(socialData.fans.length, 1);
      assert.equal(socialData.fans[0]?.name, 'Fan Only');

      assert.equal(socialData.requests.length, 1);
      assert.equal(socialData.requests[0]?.name, 'Pending Request');
      assert.equal(socialData.requests[0]?.status, 'pending');
      assert.equal(socialData.requests[0]?.message, 'let us connect');

      assert.equal(activityData.unreadMessageCount, 3);
      assert.equal(activityData.works.length, 1);
      assert.equal(activityData.works[0]?.title, `Work Post ${seedKey}`);
      assert.equal(activityData.works[0]?.likes, 1);
      assert.deepEqual(activityData.works[0]?.images, ['https://example.com/work.png']);

      assert.equal(activityData.bookmarks.length, 1);
      assert.equal(activityData.bookmarks[0]?.title, `Bookmark Post ${seedKey}`);
      assert.equal(activityData.bookmarks[0]?.authorName, 'Post Author');

      assert.equal(activityData.likes.length, 1);
      assert.equal(activityData.likes[0]?.title, `Liked Post ${seedKey}`);
      assert.equal(activityData.likes[0]?.likes, 2);
    });

    console.log('api-auth-social-activity.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-auth-social-activity.db: failed');
  console.error(error);
  process.exitCode = 1;
});
