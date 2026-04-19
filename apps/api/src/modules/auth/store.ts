import { createHash, randomBytes } from 'node:crypto';
import type mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import type {
  AdminUserFilter,
  AdminUserListQuery,
  ChangePasswordPayload,
  ChatConversationListResult,
  ChatDetailResult,
  ChatMessageItem,
  CommunityCommentItem,
  CommunityDiscoveryResult,
  CommunityFeedItem,
  CommunityFeedResult,
  CommunityPostDetailResult,
  CommunityDiscoveryTopic,
  CommunitySearchResult,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
  LoginPayload,
  LoginResult,
  MeActivityResult,
  MeSummaryResult,
  MePostItem,
  NotificationItem,
  NotificationListResult,
  PublicUserActivityResult,
  RegisterPayload,
  SendCodeResult,
  SendChatMessagePayload,
  SmsBizType,
  SocialOverviewResult,
  SocialUserItem,
  UserSearchItem,
  UserSearchResult,
  UserPublicProfile,
  UserSummary,
} from '@joy/shared';

import { getDbPool } from '../../lib/db';
import { env } from '../../env';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const GENDER_UNKNOWN = 10;
const GENDER_MALE = 20;
const GENDER_FEMALE = 30;

const SMS_BIZ_LOGIN = 10;
const SMS_BIZ_REGISTER = 20;
const SMS_BIZ_RESET = 30;

const SMS_STATUS_SENT = 10;
const SMS_STATUS_VERIFIED = 30;
const SMS_STATUS_EXPIRED = 90;

const FRIENDSHIP_PENDING = 10;
const FRIENDSHIP_ACCEPTED = 30;
const FRIENDSHIP_REJECTED = 40;

const NOTIFICATION_SYSTEM = 10;
const NOTIFICATION_ORDER = 20;
const NOTIFICATION_GUESS = 30;
const NOTIFICATION_SOCIAL = 40;

const COMMENT_TARGET_POST = 20;
const COMMENT_INTERACTION_LIKE = 10;

const POST_INTERACTION_LIKE = 10;
const POST_INTERACTION_BOOKMARK = 20;
const POST_SCOPE_PUBLIC = 10;
const POST_SCOPE_FOLLOWERS = 20;
const POST_SCOPE_PRIVATE = 90;

const PROFILE_PRIVACY_PUBLIC = 10;
const PROFILE_PRIVACY_FRIENDS = 20;
const PROFILE_PRIVACY_PRIVATE = 90;

type UserRow = {
  id: number | string;
  uid_code: string | null;
  phone_number: string;
  password: string | null;
  banned: number | boolean;
  level: number | string;
  title: string | null;
  created_at: Date | string;
  name: string | null;
  avatar_url: string | null;
  signature: string | null;
  gender: number | string | null;
  birthday: Date | string | null;
  region: string | null;
  followers: number | string;
  following: number | string;
  order_count: number | string;
  total_guess: number | string;
  wins: number | string;
  shop_name: string | null;
  shop_verified: number | string;
  coins: number | string;
  works_privacy: number | string | null;
  fav_privacy: number | string | null;
};

type NotificationRow = {
  id: number;
  type: number | string | null;
  title: string | null;
  content: string | null;
  is_read: number | boolean;
  created_at: Date | string;
};

type SocialRow = {
  id: number | string;
  uid_code: string | null;
  name: string | null;
  avatar_url: string | null;
  level: number | string;
  title: string | null;
  signature: string | null;
  followers: number | string;
  following: number | string;
  total_guess: number | string;
  wins: number | string;
  shop_verified: number | string;
  created_at?: Date | string;
  message?: string | null;
  status?: number | string | null;
};

type UserSearchRow = SocialRow & {
  uid_code: string | null;
  shop_name: string | null;
  relation: UserSearchItem['relation'];
};

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

type PostRow = {
  id: number | string;
  title: string | null;
  content: string | null;
  tag: string | null;
  location?: string | null;
  images: string;
  repost_id?: number | string | null;
  likes: number | string;
  comments: number | string;
  shares?: number | string;
  created_at: Date | string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_id?: number | string;
  author_uid_code?: string | null;
  author_shop_verified?: number | string;
  liked?: number | string;
  bookmarked?: number | string;
  scope?: number | string;
  guess_id?: number | string | null;
};

type GuessOptionRow = {
  guess_id: number | string;
  option_index: number | string;
  option_text: string | null;
};

type GuessVoteRow = {
  guess_id: number | string;
  choice_idx: number | string;
  vote_count: number | string;
};

type CommentRow = {
  id: number | string;
  parent_id?: number | string | null;
  content: string | null;
  created_at: Date | string;
  likes?: number | string;
  liked?: number | string;
  author_name: string | null;
  author_uid_code: string | null;
  author_avatar_url: string | null;
};

function resolveUserRole(row: Pick<UserRow, 'shop_name' | 'shop_verified'>): UserSummary['role'] {
  if (Number(row.shop_verified ?? 0) > 0 || (row.shop_name ?? '').trim()) {
    return 'shop_owner';
  }
  return 'user';
}

function genderCodeToValue(code: number | string | null | undefined): UserSummary['gender'] {
  const value = Number(code ?? 0);
  if (value === GENDER_UNKNOWN) {
    return null;
  }
  if (value === GENDER_MALE) {
    return 'male';
  }
  if (value === GENDER_FEMALE) {
    return 'female';
  }
  return null;
}

function genderValueToCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  if (value === 'male') {
    return GENDER_MALE;
  }
  if (value === 'female') {
    return GENDER_FEMALE;
  }
  throw new Error('性别参数不合法');
}

function worksPrivacyCodeToValue(code: number | string | null | undefined): UserSummary['worksPrivacy'] {
  const value = Number(code ?? PROFILE_PRIVACY_PUBLIC);
  if (value === PROFILE_PRIVACY_FRIENDS) {
    return 'friends';
  }
  if (value === PROFILE_PRIVACY_PRIVATE) {
    return 'me';
  }
  return 'all';
}

function favPrivacyCodeToValue(code: number | string | null | undefined): UserSummary['favPrivacy'] {
  const value = Number(code ?? PROFILE_PRIVACY_PUBLIC);
  if (value === PROFILE_PRIVACY_PRIVATE) {
    return 'me';
  }
  return 'all';
}

function worksPrivacyValueToCode(value: UserSummary['worksPrivacy'] | null | undefined) {
  if (!value || value === 'all') {
    return PROFILE_PRIVACY_PUBLIC;
  }
  if (value === 'friends') {
    return PROFILE_PRIVACY_FRIENDS;
  }
  if (value === 'me') {
    return PROFILE_PRIVACY_PRIVATE;
  }
  throw new Error('作品隐私参数不合法');
}

function favPrivacyValueToCode(value: UserSummary['favPrivacy'] | null | undefined) {
  if (!value || value === 'all') {
    return PROFILE_PRIVACY_PUBLIC;
  }
  if (value === 'me') {
    return PROFILE_PRIVACY_PRIVATE;
  }
  throw new Error('收藏隐私参数不合法');
}

function smsBizTypeToCode(value: SmsBizType) {
  if (value === 'login') {
    return SMS_BIZ_LOGIN;
  }
  if (value === 'register') {
    return SMS_BIZ_REGISTER;
  }
  return SMS_BIZ_RESET;
}

function normalizeBirthday(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeBirthdayInput(value: string | null | undefined) {
  const raw = value?.trim() || '';
  if (!raw) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error('生日格式不合法');
  }
  if (raw > new Date().toISOString().slice(0, 10)) {
    throw new Error('生日不能晚于今天');
  }
  return raw;
}

function requireValidPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error('请输入正确的手机号');
  }
}

function hashSmsCode(phone: string, bizType: SmsBizType, code: string) {
  return createHash('sha256')
    .update(`${phone}:${bizType}:${code}:${env.smsCodePepper}`)
    .digest('hex');
}

function createSessionToken() {
  return randomBytes(32).toString('hex');
}

const UID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function safeJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function postScopeCodeToValue(code: number | string | null | undefined): CommunityFeedItem['scope'] {
  const value = Number(code ?? POST_SCOPE_PUBLIC);
  if (value === POST_SCOPE_FOLLOWERS) {
    return 'followers';
  }
  if (value === POST_SCOPE_PRIVATE) {
    return 'private';
  }
  return 'public';
}

function postScopeValueToCode(value: CreateCommunityPostPayload['scope'] | null | undefined) {
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

function createRandomUidCode(length = 8) {
  const bytes = randomBytes(length);
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += UID_ALPHABET[bytes[index] % UID_ALPHABET.length];
  }
  return result;
}

async function generateUniqueUidCode() {
  const db = getDbPool();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = createRandomUidCode(8);
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM user WHERE uid_code = ? LIMIT 1`,
      [code],
    );
    if (rows.length === 0) {
      return code;
    }
  }
  throw new Error('生成优米号失败，请稍后重试');
}

async function ensureUserUidCode(userId: string | number, currentCode: string | null | undefined) {
  if (currentCode && currentCode.trim()) {
    return currentCode.trim();
  }

  const db = getDbPool();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = createRandomUidCode(8);
    try {
      const [result] = await db.execute<mysql.ResultSetHeader>(
        `
          UPDATE user
          SET uid_code = ?, updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
            AND (uid_code IS NULL OR uid_code = '')
        `,
        [candidate, userId],
      );

      if (result.affectedRows > 0) {
        return candidate;
      }

      const [rows] = await db.execute<mysql.RowDataPacket[]>(
        `SELECT uid_code FROM user WHERE id = ? LIMIT 1`,
        [userId],
      );
      const existing = rows[0]?.uid_code;
      if (typeof existing === 'string' && existing.trim()) {
        return existing.trim();
      }
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('生成优米号失败，请稍后重试');
}

async function attachUserUidCode(row: UserRow | null): Promise<UserRow | null> {
  if (!row) {
    return null;
  }
  if (row.uid_code && row.uid_code.trim()) {
    return row;
  }
  return {
    ...row,
    uid_code: await ensureUserUidCode(row.id, row.uid_code),
  };
}

function sanitizeUser(row: UserRow): UserSummary {
  const totalOrders = Number(row.order_count ?? 0);
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);
  return {
    id: String(row.id),
    uid: row.uid_code || '',
    phone: row.phone_number,
    name: row.name || `用户${String(row.phone_number).slice(-4)}`,
    role: resolveUserRole(row),
    banned: Boolean(row.banned),
    coins: Number(row.coins ?? 0),
    avatar: row.avatar_url ?? null,
    level: Number(row.level ?? 1),
    title: row.title ?? null,
    signature: row.signature ?? null,
    gender: genderCodeToValue(row.gender),
    birthday: normalizeBirthday(row.birthday),
    region: row.region ?? null,
    shopName: row.shop_name ?? null,
    followers: Number(row.followers ?? 0),
    following: Number(row.following ?? 0),
    totalOrders,
    totalGuess,
    wins,
    winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
    joinDate: new Date(row.created_at).toISOString(),
    shopVerified: Number(row.shop_verified ?? 0) > 0,
    worksPrivacy: worksPrivacyCodeToValue(row.works_privacy),
    favPrivacy: favPrivacyCodeToValue(row.fav_privacy),
  };
}

function sanitizePublicUser(row: UserRow, worksVisible = true, likedVisible = true): UserPublicProfile {
  const user = sanitizeUser(row);
  return {
    id: user.id,
    uid: user.uid,
    name: user.name,
    avatar: user.avatar ?? null,
    level: user.level,
    title: user.title ?? null,
    signature: user.signature ?? null,
    gender: user.gender ?? null,
    birthday: user.birthday ?? null,
    region: user.region ?? null,
    followers: user.followers ?? 0,
    following: user.following ?? 0,
    winRate: user.winRate ?? 0,
    totalGuess: user.totalGuess ?? 0,
    wins: user.wins ?? 0,
    joinDate: user.joinDate ?? null,
    shopVerified: user.shopVerified ?? false,
    worksVisible,
    likedVisible,
    relation: 'none',
  };
}

async function resolveProfileVisibility(userId: string, viewerId?: string | null) {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  const sanitized = sanitizeUser(user);
  const isSelf = !!viewerId && String(viewerId) === String(userId);
  const isFriend = isSelf ? true : viewerId ? await areUsersFriends(String(userId), String(viewerId)) : false;
  const worksVisible =
    sanitized.worksPrivacy === 'me'
      ? isSelf
      : sanitized.worksPrivacy === 'friends'
        ? isSelf || isFriend
        : true;
  const likedVisible = sanitized.favPrivacy === 'me' ? isSelf : true;

  return { user, worksVisible, likedVisible };
}

async function getUserRelation(userId: string, viewerId?: string | null): Promise<UserPublicProfile['relation']> {
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
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [viewerId, userId, userId, viewerId],
  );
  const row = rows[0] as { is_following?: number | string; is_fan?: number | string } | undefined;
  if (Number(row?.is_following ?? 0) > 0) {
    return 'following';
  }
  if (Number(row?.is_fan ?? 0) > 0) {
    return 'fan';
  }
  return 'none';
}

function buildPostVisibilityClause(alias = 'p') {
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

async function buildCommunityGuessInfoMap(rows: PostRow[]) {
  const guessIds = Array.from(
    new Set(
      rows
        .map((row) => Number(row.guess_id ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );
  const guessInfoMap = new Map<string, CommunityFeedItem['guessInfo']>();

  if (!guessIds.length) {
    return guessInfoMap;
  }

  const db = getDbPool();
  const placeholders = guessIds.map(() => '?').join(', ');
  const [optionRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT guess_id, option_index, option_text
      FROM guess_option
      WHERE guess_id IN (${placeholders})
      ORDER BY guess_id ASC, option_index ASC
    `,
    guessIds,
  );
  const [voteRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT guess_id, choice_idx, COUNT(*) AS vote_count
      FROM guess_bet
      WHERE guess_id IN (${placeholders})
      GROUP BY guess_id, choice_idx
    `,
    guessIds,
  );

  const optionMap = new Map<string, GuessOptionRow[]>();
  for (const row of optionRows as GuessOptionRow[]) {
    const key = String(row.guess_id);
    const list = optionMap.get(key) ?? [];
    list.push(row);
    optionMap.set(key, list);
  }

  const voteMap = new Map<string, Map<number, number>>();
  for (const row of voteRows as GuessVoteRow[]) {
    const key = String(row.guess_id);
    const list = voteMap.get(key) ?? new Map<number, number>();
    list.set(Number(row.choice_idx ?? 0), Number(row.vote_count ?? 0));
    voteMap.set(key, list);
  }

  for (const guessId of guessIds) {
    const options = (optionMap.get(String(guessId)) ?? []).slice(0, 2);
    if (options.length < 2 || !options[0].option_text || !options[1].option_text) {
      continue;
    }

    const votes = voteMap.get(String(guessId)) ?? new Map<number, number>();
    const firstCount = votes.get(Number(options[0].option_index ?? 0)) ?? 0;
    const secondCount = votes.get(Number(options[1].option_index ?? 1)) ?? 0;
    const total = firstCount + secondCount;
    const firstPct = total > 0 ? Math.round((firstCount / total) * 100) : 50;
    const secondPct = 100 - firstPct;

    guessInfoMap.set(String(guessId), {
      id: String(guessId),
      options: [options[0].option_text, options[1].option_text],
      participants: total,
      pcts: [firstPct, secondPct],
    });
  }

  return guessInfoMap;
}

async function fetchCommunityFeedRows(userId: string, tab: 'recommend' | 'follow') {
  const db = getDbPool();
  const visibilitySql = buildPostVisibilityClause('p');
  const baseParams: Array<string | number> = [
    POST_INTERACTION_LIKE,
    COMMENT_TARGET_POST,
    userId,
    POST_INTERACTION_LIKE,
    userId,
    POST_INTERACTION_BOOKMARK,
  ];

  if (tab === 'follow') {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.title,
          p.content,
          p.tag,
          p.images,
          p.created_at,
          p.scope,
          p.guess_id,
          u.id AS author_id,
          u.uid_code AS author_uid_code,
          up.name AS author_name,
          up.avatar_url AS author_avatar_url,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM shop s
              WHERE s.user_id = u.id
                AND s.status = 10
            ) THEN 1
            ELSE 0
          END AS author_shop_verified,
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
          ), 0) AS comments,
          COALESCE((
            SELECT COUNT(*)
            FROM post p2
            WHERE p2.repost_id = p.id
          ), 0) AS shares,
          EXISTS(
            SELECT 1
            FROM post_interaction pi2
            WHERE pi2.post_id = p.id
              AND pi2.user_id = ?
              AND pi2.interaction_type = ?
          ) AS liked,
          EXISTS(
            SELECT 1
            FROM post_interaction pi3
            WHERE pi3.post_id = p.id
              AND pi3.user_id = ?
              AND pi3.interaction_type = ?
          ) AS bookmarked
        FROM post p
        INNER JOIN user_follow uf ON uf.following_id = p.user_id
        INNER JOIN user u ON u.id = p.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE uf.follower_id = ?
          AND ${visibilitySql}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 20
      `,
      [...baseParams, userId, userId, userId, userId],
    );
    return rows as PostRow[];
  }

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.repost_id,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
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
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ${visibilitySql}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 20
    `,
    [...baseParams, userId, userId, userId],
  );
  return rows as PostRow[];
}

async function fetchCommunityPostRow(userId: string, postId: string) {
  const db = getDbPool();
  const visibilitySql = buildPostVisibilityClause('p');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
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
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE p.id = ?
        AND ${visibilitySql}
      LIMIT 1
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      postId,
      userId,
      userId,
      userId,
    ],
  );
  return (rows[0] as PostRow | undefined) ?? null;
}

function sanitizeNotification(row: NotificationRow): NotificationItem {
  const code = Number(row.type ?? NOTIFICATION_SYSTEM);
  return {
    id: row.id,
    type:
      code === NOTIFICATION_ORDER
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

function sanitizeSocialRow(row: SocialRow): SocialUserItem {
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);
  return {
    id: String(row.id),
    uid: row.uid_code ?? '',
    name: row.name || '未知用户',
    avatar: row.avatar_url ?? null,
    level: Number(row.level ?? 1),
    title: row.title ?? null,
    signature: row.signature ?? null,
    followers: Number(row.followers ?? 0),
    following: Number(row.following ?? 0),
    winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
    shopVerified: Number(row.shop_verified ?? 0) > 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    message: row.message ?? null,
    status:
      row.status === undefined || row.status === null
        ? null
        : Number(row.status) === FRIENDSHIP_ACCEPTED
          ? 'accepted'
          : Number(row.status) === FRIENDSHIP_PENDING
            ? 'pending'
            : String(row.status),
  };
}

function sanitizeUserSearchRow(row: UserSearchRow): UserSearchItem {
  const totalGuess = Number(row.total_guess ?? 0);
  const wins = Number(row.wins ?? 0);

  return {
    id: String(row.id),
    uid: row.uid_code ?? '',
    name: row.name || '未知用户',
    avatar: row.avatar_url ?? null,
    signature: row.signature ?? null,
    level: Number(row.level ?? 1),
    followers: Number(row.followers ?? 0),
    totalGuess,
    wins,
    winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
    shopVerified: Number(row.shop_verified ?? 0) > 0,
    shopName: row.shop_name ?? null,
    relation: row.relation ?? 'none',
  };
}

function sanitizeChatMessage(row: ChatRow, userId: string): ChatMessageItem {
  return {
    id: row.id,
    from: String(row.sender_id) === userId ? 'me' : 'other',
    senderId: String(row.sender_id),
    receiverId: String(row.receiver_id),
    content: row.content,
    read: Boolean(row.is_read),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function sanitizePost(row: PostRow): MePostItem {
  return {
    id: String(row.id),
    title: row.title || '未命名动态',
    desc: row.content || '',
    tag: row.tag || null,
    images: safeJsonArray(row.images),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
    authorName: row.author_name ?? null,
    authorAvatar: row.author_avatar_url ?? null,
  };
}

function sanitizeCommunityFeedItem(
  row: PostRow,
  guessInfo?: CommunityFeedItem['guessInfo'],
): CommunityFeedItem {
  return {
    id: String(row.id),
    title: row.title || '未命名动态',
    desc: row.content || '',
    tag: row.tag ?? null,
    location: row.location ?? null,
    images: safeJsonArray(row.images),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    shares: Number(row.shares ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
    scope: postScopeCodeToValue(row.scope),
    liked: Number(row.liked ?? 0) > 0,
    bookmarked: Number(row.bookmarked ?? 0) > 0,
    author: {
      id: String(row.author_id ?? ''),
      uid: row.author_uid_code ?? '',
      name: row.author_name || '未知用户',
      avatar: row.author_avatar_url ?? null,
      verified: Number(row.author_shop_verified ?? 0) > 0,
    },
    guessInfo: guessInfo ?? null,
  };
}

function sanitizeCommunityComment(row: CommentRow): CommunityCommentItem {
  return {
    id: String(row.id),
    authorName: row.author_name || '未知用户',
    authorUid: row.author_uid_code || '',
    authorAvatar: row.author_avatar_url ?? null,
    content: row.content || '',
    createdAt: new Date(row.created_at).toISOString(),
    likes: Number(row.likes ?? 0),
    liked: Number(row.liked ?? 0) > 0,
    replies: [],
  };
}

function normalizeCommunityImages(images: string[] | undefined) {
  const normalized = (images ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  for (const image of normalized) {
    if (image.length > 1024 * 1024 * 2) {
      throw new Error('单张图片内容过大');
    }
  }
  return normalized;
}

async function cleanupExpiredSessions() {
  const db = getDbPool();
  await db.execute(`DELETE FROM auth_session WHERE expires_at <= CURRENT_TIMESTAMP`);
}

const userSelectSql = `
  SELECT
    u.id,
    u.uid_code,
    u.phone_number,
    u.password,
    u.banned,
    u.level,
    u.title,
    u.created_at,
    up.name,
    up.avatar_url,
    up.signature,
    up.gender,
    up.birthday,
    up.region,
    up.works_privacy,
    up.fav_privacy,
    COALESCE((
      SELECT COUNT(*)
      FROM user_follow uf
      WHERE uf.following_id = u.id
    ), 0) AS followers,
    COALESCE((
      SELECT COUNT(*)
      FROM user_follow uf
      WHERE uf.follower_id = u.id
    ), 0) AS following,
    COALESCE((
      SELECT COUNT(*)
      FROM \`order\` o
      WHERE o.user_id = u.id
    ), 0) AS order_count,
    COALESCE((
      SELECT COUNT(DISTINCT gb.guess_id)
      FROM guess_bet gb
      WHERE gb.user_id = u.id
    ), 0) AS total_guess,
    COALESCE((
      SELECT COUNT(DISTINCT gb.guess_id)
      FROM guess_bet gb
      WHERE gb.user_id = u.id
        AND gb.status = 30
    ), 0) AS wins,
    (
      SELECT s.name
      FROM shop s
      WHERE s.user_id = u.id
      LIMIT 1
    ) AS shop_name,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM shop s
        WHERE s.user_id = u.id
          AND s.status = 10
      ) THEN 1
      ELSE 0
    END AS shop_verified,
    COALESCE((
      SELECT cl.balance_after
      FROM coin_ledger cl
      WHERE cl.user_id = u.id
      ORDER BY cl.created_at DESC, cl.id DESC
      LIMIT 1
    ), 0) AS coins
  FROM user u
  LEFT JOIN user_profile up ON up.user_id = u.id
`;

async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${userSelectSql}
      WHERE u.phone_number = ?
      LIMIT 1
    `,
    [phone],
  );
  return attachUserUidCode((rows[0] as UserRow | undefined) ?? null);
}

async function findUserById(id: string | number): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${userSelectSql}
      WHERE u.id = ?
      LIMIT 1
    `,
    [id],
  );
  return attachUserUidCode((rows[0] as UserRow | undefined) ?? null);
}

async function findUserByUidCode(uidCode: string): Promise<UserRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${userSelectSql}
      WHERE u.uid_code = ?
      LIMIT 1
    `,
    [uidCode],
  );
  return attachUserUidCode((rows[0] as UserRow | undefined) ?? null);
}

async function findUserByPublicKey(key: string | number): Promise<UserRow | null> {
  const normalized = String(key ?? '').trim();
  if (!normalized) {
    return null;
  }

  return findUserByUidCode(normalized);
}

function buildAdminUserFilterWhere(query: AdminUserListQuery) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  const keyword = query.keyword?.trim();

  if (keyword) {
    const like = `%${keyword}%`;
    conditions.push(
      `(source.name LIKE ? OR source.uid_code LIKE ? OR source.phone_number LIKE ? OR source.shop_name LIKE ? OR source.region LIKE ?)`,
    );
    params.push(like, like, like, like, like);
  }

  if (query.role === 'user') {
    conditions.push(`source.shop_verified = 0 AND (source.shop_name IS NULL OR source.shop_name = '')`);
  } else if (query.role === 'shop_owner') {
    conditions.push(`(source.shop_verified > 0 OR (source.shop_name IS NOT NULL AND source.shop_name <> ''))`);
  } else if (query.role === 'banned') {
    conditions.push(`source.banned > 0`);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

async function getAdminUserSummaryCounts() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        COUNT(*) AS total_users,
        SUM(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM shop s
              WHERE s.user_id = u.id
                AND s.status = 10
            ) THEN 1
            ELSE 0
          END
        ) AS verified_users,
        SUM(CASE WHEN u.banned = 1 THEN 1 ELSE 0 END) AS banned_users
      FROM user u
    `,
  );
  const row = rows[0] as {
    total_users?: number | string;
    verified_users?: number | string;
    banned_users?: number | string;
  } | undefined;

  return {
    totalUsers: Number(row?.total_users ?? 0),
    verifiedUsers: Number(row?.verified_users ?? 0),
    bannedUsers: Number(row?.banned_users ?? 0),
  };
}

export async function listUsersForAdmin(query: AdminUserListQuery = {}) {
  const db = getDbPool();
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 20) || 20));
  const offset = (page - 1) * pageSize;
  const filters = buildAdminUserFilterWhere(query);

  const [countResult, listResult, summary] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM (
          ${userSelectSql}
        ) source
        ${filters.whereSql}
      `,
      filters.params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT *
        FROM (
          ${userSelectSql}
        ) source
        ${filters.whereSql}
        ORDER BY source.created_at DESC, source.id DESC
        LIMIT ?
        OFFSET ?
      `,
      [...filters.params, pageSize, offset],
    ),
    getAdminUserSummaryCounts(),
  ]);
  const [countRows] = countResult;
  const [rows] = listResult;

  const total = Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0);

  const normalizedRows = await Promise.all(
    rows.map((row) => attachUserUidCode(row as UserRow)),
  );

  return {
    items: normalizedRows
      .filter((row): row is UserRow => row != null)
      .map((row) => sanitizeUser(row)),
    total,
    page,
    pageSize,
    summary,
  };
}

export async function getUserSummaryById(userId: string | number): Promise<UserSummary | null> {
  const row = await findUserById(userId);
  return row ? sanitizeUser(row) : null;
}

export async function setUserBanned(userId: string | number, banned: boolean) {
  const db = getDbPool();
  await db.execute(
    `
      UPDATE user
      SET banned = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
    `,
    [banned ? 1 : 0, userId],
  );
  return getUserSummaryById(userId);
}

async function areUsersFriends(userId: string, viewerId: string) {
  if (!viewerId || userId === viewerId) {
    return userId === viewerId;
  }

  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE status = ?
        AND (
          (user_id = ? AND friend_id = ?)
          OR (user_id = ? AND friend_id = ?)
        )
      LIMIT 1
    `,
    [FRIENDSHIP_ACCEPTED, userId, viewerId, viewerId, userId],
  );
  return rows.length > 0;
}

async function verifyUserPassword(user: UserRow, password: string) {
  if (!user.password) {
    return false;
  }

  if (user.password.startsWith('$2')) {
    return bcrypt.compare(password, user.password);
  }

  const valid = user.password === password;
  if (valid) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUserPassword(String(user.id), hashedPassword);
  }
  return valid;
}

async function updateUserPassword(userId: string, password: string) {
  const db = getDbPool();
  await db.execute(`UPDATE user SET password = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [password, userId]);
}

async function createUserProfile(userId: number, name: string) {
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO user_profile (user_id, name, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, name],
  );
}

async function createSession(user: UserRow): Promise<LoginResult> {
  await cleanupExpiredSessions();
  const db = getDbPool();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.execute(`DELETE FROM auth_session WHERE user_id = ?`, [user.id]);
  await db.execute(
    `
      INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [token, user.id, expiresAt],
  );
  return { token, user: sanitizeUser(user) };
}

export async function sendCode(phone: string, bizType: SmsBizType): Promise<SendCodeResult> {
  requireValidPhone(phone);
  const db = getDbPool();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = hashSmsCode(phone, bizType, code);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const bizTypeCode = smsBizTypeToCode(bizType);

  await db.execute(
    `
      UPDATE sms_verification_code
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE phone_number = ?
        AND biz_type = ?
        AND status = ?
    `,
    [SMS_STATUS_EXPIRED, phone, bizTypeCode, SMS_STATUS_SENT],
  );

  await db.execute(
    `
      INSERT INTO sms_verification_code (
        phone_number,
        biz_type,
        code_hash,
        status,
        expires_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [phone, bizTypeCode, codeHash, SMS_STATUS_SENT, expiresAt],
  );

  return {
    sent: true,
    ...(env.nodeEnv !== 'production' ? { devCode: code } : {}),
  };
}

async function requireCode(phone: string, code: string, bizType: SmsBizType) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, code_hash, expires_at
      FROM sms_verification_code
      WHERE phone_number = ?
        AND biz_type = ?
        AND status = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [phone, smsBizTypeToCode(bizType), SMS_STATUS_SENT],
  );

  const record = rows[0] as { id: number; code_hash: string; expires_at: Date } | undefined;
  if (!record) {
    throw new Error('验证码未发送或已过期');
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await db.execute(
      `UPDATE sms_verification_code SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [SMS_STATUS_EXPIRED, record.id],
    );
    throw new Error('验证码已过期');
  }

  if (record.code_hash !== hashSmsCode(phone, bizType, code)) {
    throw new Error('验证码错误');
  }

  await db.execute(
    `
      UPDATE sms_verification_code
      SET status = ?,
          used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [SMS_STATUS_VERIFIED, record.id],
  );
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  requireValidPhone(payload.phone);

  if (payload.method === 'code') {
    if (!payload.code) {
      throw new Error('验证码不能为空');
    }

    await requireCode(payload.phone, payload.code, 'login');
    let user = await findUserByPhone(payload.phone);

    if (!user) {
      const db = getDbPool();
      const uidCode = await generateUniqueUidCode();
      const [result] = await db.execute<mysql.ResultSetHeader>(
        `
          INSERT INTO user (
            uid_code,
            phone_number,
            password,
            achievements
          ) VALUES (?, ?, '', JSON_ARRAY())
        `,
        [uidCode, payload.phone],
      );
      await createUserProfile(result.insertId, `用户${payload.phone.slice(-4)}`);
      user = await findUserById(result.insertId);
    }

    if (!user) {
      throw new Error('登录成功后读取用户失败');
    }

    return createSession(user);
  }

  const user = await findUserByPhone(payload.phone);
  if (!user) {
    throw new Error('用户不存在');
  }
  if (!payload.password) {
    throw new Error('密码不能为空');
  }
  if (!user.password) {
    throw new Error('该账号未设置密码，请使用验证码或重新注册');
  }

  const valid = await verifyUserPassword(user, payload.password);

  if (!valid) {
    throw new Error('密码错误');
  }

  const freshUser = await findUserById(user.id);
  if (!freshUser) {
    throw new Error('用户不存在');
  }
  return createSession(freshUser);
}

export async function register(payload: RegisterPayload): Promise<LoginResult> {
  requireValidPhone(payload.phone);
  if (!payload.password || payload.password.length < 6) {
    throw new Error('密码长度至少6位');
  }
  if (!payload.name || payload.name.trim().length < 2) {
    throw new Error('昵称长度至少2位');
  }

  const existing = await findUserByPhone(payload.phone);
  if (existing) {
    throw new Error('该手机号已注册');
  }

  await requireCode(payload.phone, payload.code, 'register');
  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const db = getDbPool();
  const uidCode = await generateUniqueUidCode();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user (
        uid_code,
        phone_number,
        password,
        achievements
      ) VALUES (?, ?, ?, JSON_ARRAY())
    `,
    [uidCode, payload.phone, hashedPassword],
  );
  await createUserProfile(result.insertId, payload.name.trim());

  const user = await findUserById(result.insertId);
  if (!user) {
    throw new Error('注册成功后读取用户失败');
  }
  return createSession(user);
}

export async function changePassword(
  userId: string,
  payload: ChangePasswordPayload,
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  if (!payload.newPassword || payload.newPassword.length < 6) {
    throw new Error('新密码长度至少6位');
  }

  if (user.password) {
    if (!payload.currentPassword) {
      throw new Error('当前密码不能为空');
    }

    const valid = await verifyUserPassword(user, payload.currentPassword);
    if (!valid) {
      throw new Error('当前密码错误');
    }
  }

  if (payload.currentPassword && payload.currentPassword === payload.newPassword) {
    throw new Error('新密码不能与当前密码相同');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
  await updateUserPassword(userId, hashedPassword);

  return { success: true as const };
}

export async function getUserByToken(token: string): Promise<UserSummary | null> {
  if (!token) {
    return null;
  }
  await cleanupExpiredSessions();
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT user_id, expires_at FROM auth_session WHERE token = ? LIMIT 1`,
    [token],
  );
  const session = rows[0] as { user_id: number; expires_at: Date } | undefined;
  if (!session) {
    return null;
  }
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db.execute(`DELETE FROM auth_session WHERE token = ?`, [token]);
    return null;
  }
  const user = await findUserById(session.user_id);
  return user ? sanitizeUser(user) : null;
}

export async function logoutByToken(token: string): Promise<void> {
  if (!token) {
    return;
  }
  const db = getDbPool();
  await db.execute(`DELETE FROM auth_session WHERE token = ?`, [token]);
}

type UpdatePayload = {
  name?: string;
  avatar?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  worksPrivacy?: UserSummary['worksPrivacy'];
  favPrivacy?: UserSummary['favPrivacy'];
};

export async function updateMe(userId: string, payload: UpdatePayload): Promise<UserSummary> {
  const db = getDbPool();
  const updates: string[] = [];
  const values: Array<string | number | null> = [];

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
    await db.execute(
      `
        INSERT INTO user_profile (user_id, name, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(3)
      `,
      [userId, name],
    );
    await db.execute(
      `UPDATE user_profile SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ?`,
      [...values, userId],
    );
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  return sanitizeUser(user);
}

export async function getUserProfileById(userId: string, viewerId?: string | null): Promise<UserPublicProfile | null> {
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

export async function getUserPublicActivity(userId: string, viewerId?: string | null): Promise<PublicUserActivityResult | null> {
  const targetUser = await findUserByPublicKey(userId);
  const visibility = targetUser ? await resolveProfileVisibility(String(targetUser.id), viewerId) : null;
  if (!visibility) {
    return null;
  }

  const db = getDbPool();
  let works: MePostItem[] = [];
  let likes: MePostItem[] = [];

  if (visibility.worksVisible) {
    const [worksRows] = await db.execute<mysql.RowDataPacket[]>(
      `
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
      `,
      [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId],
    );
    works = (worksRows as PostRow[]).map((row) => sanitizePost(row));
  }

  if (visibility.likedVisible) {
    const [likeRows] = await db.execute<mysql.RowDataPacket[]>(
      `
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
      `,
      [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId, POST_INTERACTION_LIKE],
    );
    likes = (likeRows as PostRow[]).map((row) => sanitizePost(row));
  }

  return {
    worksVisible: visibility.worksVisible,
    likedVisible: visibility.likedVisible,
    works,
    likes,
  };
}

export async function followUser(viewerId: string, targetUserId: string) {
  if (String(viewerId) === String(targetUserId)) {
    throw new Error('不能关注自己');
  }

  const target = await findUserById(targetUserId);
  if (!target) {
    throw new Error('用户不存在');
  }

  const db = getDbPool();
  const [existing] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM user_follow
      WHERE follower_id = ?
        AND following_id = ?
      LIMIT 1
    `,
    [viewerId, targetUserId],
  );
  if (existing.length === 0) {
    await db.execute(
      `
        INSERT INTO user_follow (follower_id, following_id, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [viewerId, targetUserId],
    );
  }

  return { success: true as const };
}

export async function unfollowUser(viewerId: string, targetUserId: string) {
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM user_follow
      WHERE follower_id = ?
        AND following_id = ?
    `,
    [viewerId, targetUserId],
  );
  return { success: true as const };
}

export async function getCommunityFeed(
  userId: string,
  tab: 'recommend' | 'follow',
): Promise<CommunityFeedResult> {
  const rows = await fetchCommunityFeedRows(userId, tab);
  const guessInfoMap = await buildCommunityGuessInfoMap(rows);

  return {
    items: rows.map((row) => sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')))),
  };
}

export async function getCommunityPostDetail(
  userId: string,
  postId: string,
): Promise<CommunityPostDetailResult | null> {
  const db = getDbPool();
  const row = await fetchCommunityPostRow(userId, postId);
  if (!row) {
    return null;
  }

  const guessInfoMap = await buildCommunityGuessInfoMap([row]);
  const [commentRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.content,
        ci.created_at,
        COALESCE((
          SELECT COUNT(*)
          FROM comment_interaction cix
          WHERE cix.comment_id = ci.id
            AND cix.interaction_type = ?
        ), 0) AS likes,
        EXISTS(
          SELECT 1
          FROM comment_interaction cix2
          WHERE cix2.comment_id = ci.id
            AND cix2.user_id = ?
            AND cix2.interaction_type = ?
        ) AS liked,
        up.name AS author_name,
        u.uid_code AS author_uid_code,
        up.avatar_url AS author_avatar_url
      FROM comment_item ci
      INNER JOIN user u ON u.id = ci.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ci.target_type = ?
        AND ci.target_id = ?
        AND ci.parent_id IS NULL
      ORDER BY ci.created_at DESC, ci.id DESC
      LIMIT 20
    `,
    [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId],
  );
  const commentIds = (commentRows as CommentRow[]).map((item) => String(item.id));
  let replyRows: CommentRow[] = [];
  if (commentIds.length > 0) {
    const placeholders = commentIds.map(() => '?').join(', ');
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          ci.id,
          ci.parent_id,
          ci.content,
          ci.created_at,
          COALESCE((
            SELECT COUNT(*)
            FROM comment_interaction cix
            WHERE cix.comment_id = ci.id
              AND cix.interaction_type = ?
          ), 0) AS likes,
          EXISTS(
            SELECT 1
            FROM comment_interaction cix2
            WHERE cix2.comment_id = ci.id
              AND cix2.user_id = ?
              AND cix2.interaction_type = ?
          ) AS liked,
          up.name AS author_name,
          u.uid_code AS author_uid_code,
          up.avatar_url AS author_avatar_url
        FROM comment_item ci
        INNER JOIN user u ON u.id = ci.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE ci.target_type = ?
          AND ci.target_id = ?
          AND ci.parent_id IN (${placeholders})
        ORDER BY ci.created_at ASC, ci.id ASC
      `,
      [COMMENT_INTERACTION_LIKE, userId, COMMENT_INTERACTION_LIKE, COMMENT_TARGET_POST, postId, ...commentIds],
    );
    replyRows = rows as CommentRow[];
  }

  const visibilitySql = buildPostVisibilityClause('p');
  const currentGuessId = row.guess_id == null ? null : String(row.guess_id);
  const currentTag = row.tag?.trim() || null;
  const [relatedRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.location,
        p.images,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
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
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE p.id <> ?
        AND p.type <> 20
        AND ${visibilitySql}
      ORDER BY
        CASE
          WHEN ? IS NOT NULL AND p.guess_id = ? THEN 2
          WHEN ? IS NOT NULL AND p.tag = ? THEN 1
          ELSE 0
        END DESC,
        p.created_at DESC,
        p.id DESC
      LIMIT 3
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      postId,
      currentGuessId,
      currentGuessId,
      currentTag,
      currentTag,
      userId,
      userId,
      userId,
    ],
  );
  const relatedGuessInfoMap = await buildCommunityGuessInfoMap(relatedRows as PostRow[]);

  return {
    post: sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? ''))),
    comments: (commentRows as CommentRow[]).map((item) => ({
      ...sanitizeCommunityComment(item),
      replies: replyRows
        .filter((reply) => String((reply as CommentRow & { parent_id?: number | string }).parent_id ?? '') === String(item.id))
        .map((reply) => sanitizeCommunityComment(reply)),
    })),
    related: (relatedRows as PostRow[]).map((item) =>
      sanitizeCommunityFeedItem(item, relatedGuessInfoMap.get(String(item.guess_id ?? ''))),
    ),
  };
}

function normalizeCommunityPostContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('动态内容不能为空');
  }
  if (trimmed.length > 2000) {
    throw new Error('动态内容不能超过 2000 字');
  }
  return trimmed;
}

function buildCommunityPostTitle(content: string) {
  const compact = content.replace(/\s+/g, ' ').trim();
  return compact.length > 40 ? compact.slice(0, 40) : compact;
}

function normalizeCommunityTag(tag: string | null | undefined) {
  const normalized = tag?.trim() || null;
  if (normalized && normalized.length > 20) {
    throw new Error('动态标签不能超过 20 字');
  }
  return normalized;
}

function normalizeCommunityLocation(location: string | null | undefined) {
  const normalized = location?.trim() || null;
  if (normalized && normalized.length > 100) {
    throw new Error('地点信息不能超过 100 字');
  }
  return normalized;
}

async function normalizeGuessId(guessId: string | null | undefined) {
  const normalized = guessId?.trim() || '';
  if (!normalized) {
    return null;
  }

  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM guess WHERE id = ? LIMIT 1`,
    [normalized],
  );
  if (!rows.length) {
    throw new Error('关联竞猜不存在');
  }
  return normalized;
}

export async function createCommunityPost(userId: string, payload: CreateCommunityPostPayload) {
  const db = getDbPool();
  const content = normalizeCommunityPostContent(payload.content);
  const title = buildCommunityPostTitle(content);
  const tag = normalizeCommunityTag(payload.tag);
  const location = normalizeCommunityLocation(payload.location);
  const scope = postScopeValueToCode(payload.scope);
  const guessId = await normalizeGuessId(payload.guessId);
  const images = normalizeCommunityImages(payload.images);

  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        guess_id,
        location,
        scope,
        created_at,
        updated_at
      ) VALUES (?, 10, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, title, content, JSON.stringify(images), tag, guessId, location, scope],
  );

  const row = await fetchCommunityPostRow(userId, String(result.insertId));
  if (!row) {
    throw new Error('动态创建成功后读取失败');
  }
  const guessInfoMap = await buildCommunityGuessInfoMap([row]);
  return sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')));
}

export async function createCommunityComment(
  userId: string,
  postId: string,
  payload: CreateCommunityCommentPayload,
) {
  await ensurePostExists(postId);
  const content = payload.content.trim();
  if (!content) {
    throw new Error('评论内容不能为空');
  }
  if (content.length > 500) {
    throw new Error('评论内容不能超过 500 字');
  }

  let parentId: string | null = null;
  if (payload.parentId?.trim()) {
    const db = getDbPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM comment_item
        WHERE id = ?
          AND target_type = ?
          AND target_id = ?
        LIMIT 1
      `,
      [payload.parentId.trim(), COMMENT_TARGET_POST, postId],
    );
    if (!rows.length) {
      throw new Error('回复目标不存在');
    }
    parentId = payload.parentId.trim();
  }

  const db = getDbPool();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO comment_item (
        target_type,
        target_id,
        user_id,
        parent_id,
        content,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [COMMENT_TARGET_POST, postId, userId, parentId, content],
  );

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ci.id,
        ci.content,
        ci.created_at,
        0 AS likes,
        0 AS liked,
        up.name AS author_name,
        u.uid_code AS author_uid_code,
        up.avatar_url AS author_avatar_url
      FROM comment_item ci
      INNER JOIN user u ON u.id = ci.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ci.id = ?
      LIMIT 1
    `,
    [result.insertId],
  );
  const row = rows[0] as CommentRow | undefined;
  if (!row) {
    throw new Error('评论发送成功后读取失败');
  }
  return sanitizeCommunityComment(row);
}

async function ensureCommunityCommentExists(commentId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM comment_item
      WHERE id = ?
        AND target_type = ?
      LIMIT 1
    `,
    [commentId, COMMENT_TARGET_POST],
  );
  if (!rows.length) {
    throw new Error('评论不存在');
  }
}

export async function likeCommunityComment(userId: string, commentId: string) {
  await ensureCommunityCommentExists(commentId);
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO comment_interaction (user_id, comment_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
        FROM comment_interaction
        WHERE user_id = ?
          AND comment_id = ?
          AND interaction_type = ?
      )
    `,
    [userId, commentId, COMMENT_INTERACTION_LIKE, userId, commentId, COMMENT_INTERACTION_LIKE],
  );
  return { success: true };
}

export async function unlikeCommunityComment(userId: string, commentId: string) {
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM comment_interaction
      WHERE user_id = ?
        AND comment_id = ?
        AND interaction_type = ?
    `,
    [userId, commentId, COMMENT_INTERACTION_LIKE],
  );
  return { success: true };
}

export async function repostCommunityPost(
  userId: string,
  postId: string,
  payload: CreateCommunityPostPayload,
) {
  const original = await fetchCommunityPostRow(userId, postId);
  if (!original) {
    throw new Error('原动态不存在或不可见');
  }

  const db = getDbPool();
  const content = normalizeCommunityPostContent(payload.content || '转发动态');
  const title = buildCommunityPostTitle(content);
  const location = normalizeCommunityLocation(payload.location);
  const scope = postScopeValueToCode(payload.scope);
  const images = normalizeCommunityImages(payload.images);
  const rootPostId = String(original.repost_id ?? original.id);

  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO post (
        user_id,
        type,
        title,
        content,
        images,
        tag,
        guess_id,
        location,
        scope,
        repost_id,
        created_at,
        updated_at
      ) VALUES (?, 20, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [
      userId,
      title,
      content,
      JSON.stringify(images),
      '转发',
      original.guess_id ?? null,
      location,
      scope,
      rootPostId,
    ],
  );
  const row = await fetchCommunityPostRow(userId, String(result.insertId));
  if (!row) {
    throw new Error('转发成功后读取失败');
  }
  const guessInfoMap = await buildCommunityGuessInfoMap([row]);
  return sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? '')));
}

export async function searchCommunity(userId: string, q: string): Promise<CommunitySearchResult> {
  const keyword = q.trim();
  if (!keyword) {
    return { posts: [], users: [] };
  }

  const db = getDbPool();
  const likeKeyword = `%${keyword}%`;
  const visibilitySql = buildPostVisibilityClause('p');
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.location,
        p.images,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
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
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ${visibilitySql}
        AND (
          COALESCE(p.title, '') LIKE ?
          OR COALESCE(p.content, '') LIKE ?
          OR COALESCE(p.tag, '') LIKE ?
          OR COALESCE(up.name, '') LIKE ?
        )
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 20
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      userId,
      userId,
      userId,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
    ],
  );
  const guessInfoMap = await buildCommunityGuessInfoMap(rows as PostRow[]);

  return {
    posts: (rows as PostRow[]).map((row) =>
      sanitizeCommunityFeedItem(row, guessInfoMap.get(String(row.guess_id ?? ''))),
    ),
    users: (await searchUsers(userId, keyword)).items,
  };
}

export async function getCommunityDiscovery(userId: string): Promise<CommunityDiscoveryResult> {
  const db = getDbPool();
  const visibilitySql = buildPostVisibilityClause('p');
  const [heroRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.title,
        p.content,
        p.tag,
        p.images,
        p.created_at,
        p.scope,
        p.guess_id,
        u.id AS author_id,
        u.uid_code AS author_uid_code,
        up.name AS author_name,
        up.avatar_url AS author_avatar_url,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM shop s
            WHERE s.user_id = u.id
              AND s.status = 10
          ) THEN 1
          ELSE 0
        END AS author_shop_verified,
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
        ), 0) AS comments,
        COALESCE((
          SELECT COUNT(*)
          FROM post p2
          WHERE p2.repost_id = p.id
        ), 0) AS shares,
        EXISTS(
          SELECT 1
          FROM post_interaction pi2
          WHERE pi2.post_id = p.id
            AND pi2.user_id = ?
            AND pi2.interaction_type = ?
        ) AS liked,
        EXISTS(
          SELECT 1
          FROM post_interaction pi3
          WHERE pi3.post_id = p.id
            AND pi3.user_id = ?
            AND pi3.interaction_type = ?
        ) AS bookmarked
      FROM post p
      INNER JOIN user u ON u.id = p.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      WHERE ${visibilitySql}
      ORDER BY (
        COALESCE((
          SELECT COUNT(*)
          FROM post_interaction pi4
          WHERE pi4.post_id = p.id
            AND pi4.interaction_type = ${POST_INTERACTION_LIKE}
        ), 0) * 3
        + COALESCE((
          SELECT COUNT(*)
          FROM comment_item ci2
          WHERE ci2.target_id = p.id
            AND ci2.target_type = ${COMMENT_TARGET_POST}
        ), 0) * 2
        + COALESCE((
          SELECT COUNT(*)
          FROM post p3
          WHERE p3.repost_id = p.id
        ), 0)
      ) DESC, p.created_at DESC, p.id DESC
      LIMIT 1
    `,
    [
      POST_INTERACTION_LIKE,
      COMMENT_TARGET_POST,
      userId,
      POST_INTERACTION_LIKE,
      userId,
      POST_INTERACTION_BOOKMARK,
      userId,
      userId,
      userId,
    ],
  );
  const heroRow = (heroRows[0] as PostRow | undefined) ?? null;
  const heroGuessInfo = heroRow ? await buildCommunityGuessInfoMap([heroRow]) : new Map<string, CommunityFeedItem['guessInfo']>();

  const [tagRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.tag,
        COUNT(*) AS post_count,
        MAX(p.created_at) AS latest_created_at
      FROM post p
      WHERE p.scope = ${POST_SCOPE_PUBLIC}
        AND p.tag IS NOT NULL
        AND p.tag <> ''
      GROUP BY p.tag
      ORDER BY post_count DESC, latest_created_at DESC
      LIMIT 6
    `,
  );

  const hotTopics: CommunityDiscoveryTopic[] = (tagRows as Array<{ tag?: string; post_count?: number | string; latest_created_at?: Date | string }>)
    .filter((row) => (row.tag ?? '').trim())
    .map((row) => ({
      text: String(row.tag).trim(),
      desc: `${Number(row.post_count ?? 0)}条相关动态`,
      href: `/community-search?q=${encodeURIComponent(String(row.tag).trim())}`,
    }));

  return {
    hero: heroRow ? sanitizeCommunityFeedItem(heroRow, heroGuessInfo.get(String(heroRow.guess_id ?? ''))) : null,
    hotTopics,
  };
}

async function ensurePostExists(postId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM post WHERE id = ? LIMIT 1`,
    [postId],
  );
  if (!rows.length) {
    throw new Error('动态不存在');
  }
}

export async function likeCommunityPost(userId: string, postId: string) {
  await ensurePostExists(postId);
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO post_interaction (user_id, post_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      WHERE NOT EXISTS (
        SELECT 1
        FROM post_interaction
        WHERE user_id = ?
          AND post_id = ?
          AND interaction_type = ?
      )
    `,
    [userId, postId, POST_INTERACTION_LIKE, userId, postId, POST_INTERACTION_LIKE],
  );
  return { success: true as const };
}

export async function unlikeCommunityPost(userId: string, postId: string) {
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM post_interaction
      WHERE user_id = ?
        AND post_id = ?
        AND interaction_type = ?
    `,
    [userId, postId, POST_INTERACTION_LIKE],
  );
  return { success: true as const };
}

export async function bookmarkCommunityPost(userId: string, postId: string) {
  await ensurePostExists(postId);
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO post_interaction (user_id, post_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      WHERE NOT EXISTS (
        SELECT 1
        FROM post_interaction
        WHERE user_id = ?
          AND post_id = ?
          AND interaction_type = ?
      )
    `,
    [userId, postId, POST_INTERACTION_BOOKMARK, userId, postId, POST_INTERACTION_BOOKMARK],
  );
  return { success: true as const };
}

export async function unbookmarkCommunityPost(userId: string, postId: string) {
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM post_interaction
      WHERE user_id = ?
        AND post_id = ?
        AND interaction_type = ?
    `,
    [userId, postId, POST_INTERACTION_BOOKMARK],
  );
  return { success: true as const };
}

export async function getMeActivity(userId: string): Promise<MeActivityResult> {
  const db = getDbPool();

  const [worksRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId],
  );

  const [bookmarkRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId, POST_INTERACTION_BOOKMARK],
  );

  const [likeRows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [POST_INTERACTION_LIKE, COMMENT_TARGET_POST, userId, POST_INTERACTION_LIKE],
  );

  const [messageCountRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COALESCE(SUM(unread_count), 0) AS unread_count FROM chat_conversation WHERE user_id = ?`,
    [userId],
  );

  return {
    unreadMessageCount: Number((messageCountRows[0] as { unread_count?: number | string } | undefined)?.unread_count ?? 0),
    works: worksRows.map((row) => sanitizePost(row as PostRow)),
    bookmarks: bookmarkRows.map((row) => sanitizePost(row as PostRow)),
    likes: likeRows.map((row) => sanitizePost(row as PostRow)),
  };
}

export async function getMeSummary(userId: string): Promise<MeSummaryResult> {
  const db = getDbPool();

  const [activeOrderRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT COUNT(*) AS active_order_count
      FROM \`order\`
      WHERE user_id = ?
        AND status IN (10, 20)
    `,
    [userId],
  );

  const [availableCouponRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT COUNT(*) AS available_coupon_count
      FROM coupon
      WHERE user_id = ?
        AND status = 10
        AND (expire_at IS NULL OR expire_at >= CURRENT_TIMESTAMP)
    `,
    [userId],
  );

  const [virtualWarehouseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT COALESCE(SUM(quantity), 0) AS total_quantity
      FROM virtual_warehouse
      WHERE user_id = ?
        AND status IN (10, 20, 30)
    `,
    [userId],
  );

  const [fulfillmentWarehouseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT COALESCE(SUM(oi.quantity), 0) AS total_quantity
      FROM fulfillment_order fo
      INNER JOIN \`order\` o ON o.id = fo.order_id
      INNER JOIN order_item oi ON oi.order_id = o.id
      WHERE fo.user_id = ?
        AND fo.status IN (10, 20, 30)
    `,
    [userId],
  );

  const [physicalWarehouseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT COALESCE(SUM(quantity), 0) AS total_quantity
      FROM physical_warehouse
      WHERE user_id = ?
        AND status IN (10, 20, 30)
    `,
    [userId],
  );

  const warehouseItemCount =
    Number((virtualWarehouseRows[0] as { total_quantity?: number | string } | undefined)?.total_quantity ?? 0) +
    Number((fulfillmentWarehouseRows[0] as { total_quantity?: number | string } | undefined)?.total_quantity ?? 0) +
    Number((physicalWarehouseRows[0] as { total_quantity?: number | string } | undefined)?.total_quantity ?? 0);

  return {
    activeOrderCount: Number(
      (activeOrderRows[0] as { active_order_count?: number | string } | undefined)?.active_order_count ?? 0,
    ),
    warehouseItemCount,
    availableCouponCount: Number(
      (availableCouponRows[0] as { available_coupon_count?: number | string } | undefined)?.available_coupon_count ?? 0,
    ),
  };
}

export async function getNotifications(userId: string): Promise<NotificationListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, type, title, content, is_read, created_at FROM notification WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    [userId],
  );
  return { items: rows.map((row) => sanitizeNotification(row as NotificationRow)) };
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const db = getDbPool();
  await db.execute(`UPDATE notification SET is_read = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND is_read = 0`, [userId]);
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const db = getDbPool();
  await db.execute(
    `
      UPDATE notification
      SET is_read = 1,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND id = ?
        AND is_read = 0
    `,
    [userId, notificationId],
  );
}

export async function getSocialOverview(userId: string): Promise<SocialOverviewResult> {
  const db = getDbPool();
  const socialSelect = `
    SELECT
      u.id,
      u.uid_code,
      up.name,
      up.avatar_url,
      u.level,
      u.title,
      up.signature,
      COALESCE((SELECT COUNT(*) FROM user_follow f1 WHERE f1.following_id = u.id), 0) AS followers,
      COALESCE((SELECT COUNT(*) FROM user_follow f2 WHERE f2.follower_id = u.id), 0) AS following,
      COALESCE((SELECT COUNT(*) FROM guess_bet gb1 WHERE gb1.user_id = u.id), 0) AS total_guess,
      COALESCE((SELECT COUNT(*) FROM guess_bet gb2 WHERE gb2.user_id = u.id AND gb2.status = 30), 0) AS wins,
      CASE WHEN EXISTS (SELECT 1 FROM shop s WHERE s.user_id = u.id AND s.status = 10) THEN 1 ELSE 0 END AS shop_verified
    FROM user u
    LEFT JOIN user_profile up ON up.user_id = u.id
  `;

  const [friendRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${socialSelect}
      INNER JOIN friendship f ON f.friend_id = u.id
      WHERE f.user_id = ?
        AND f.status = ?
      ORDER BY f.updated_at DESC
    `,
    [userId, FRIENDSHIP_ACCEPTED],
  );

  const [followingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${socialSelect}
      INNER JOIN user_follow uf ON uf.following_id = u.id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
    `,
    [userId],
  );

  const [fanRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      ${socialSelect}
      INNER JOIN user_follow uf ON uf.follower_id = u.id
      WHERE uf.following_id = ?
      ORDER BY uf.created_at DESC
    `,
    [userId],
  );

  const [requestRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        social.*,
      f.message,
      f.status
      FROM (
        ${socialSelect}
      ) social
      INNER JOIN friendship f ON f.user_id = social.id
      WHERE f.friend_id = ?
        AND f.status = ?
      ORDER BY f.updated_at DESC
    `,
    [userId, FRIENDSHIP_PENDING],
  );

  return {
    friends: friendRows.map((row) => sanitizeSocialRow(row as SocialRow)),
    following: followingRows.map((row) => sanitizeSocialRow(row as SocialRow)),
    fans: fanRows.map((row) => sanitizeSocialRow(row as SocialRow)),
    requests: requestRows.map((row) => sanitizeSocialRow(row as SocialRow)),
  };
}

export async function acceptFriendRequest(viewerId: string, requesterId: string) {
  const db = getDbPool();

  const [pendingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
      LIMIT 1
    `,
    [requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  if (!pendingRows.length) {
    throw new Error('好友申请不存在');
  }

  await db.execute(
    `
      UPDATE friendship
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
    `,
    [FRIENDSHIP_ACCEPTED, requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  const [reverseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE user_id = ?
        AND friend_id = ?
      LIMIT 1
    `,
    [viewerId, requesterId],
  );

  if (reverseRows.length) {
    await db.execute(
      `
        UPDATE friendship
        SET status = ?,
            updated_at = CURRENT_TIMESTAMP(3)
        WHERE user_id = ?
          AND friend_id = ?
      `,
      [FRIENDSHIP_ACCEPTED, viewerId, requesterId],
    );
  } else {
    await db.execute(
      `
        INSERT INTO friendship (user_id, friend_id, status, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [viewerId, requesterId, FRIENDSHIP_ACCEPTED],
    );
  }

  return { success: true as const };
}

export async function rejectFriendRequest(viewerId: string, requesterId: string) {
  const db = getDbPool();

  const [pendingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM friendship
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
      LIMIT 1
    `,
    [requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  if (!pendingRows.length) {
    throw new Error('好友申请不存在');
  }

  await db.execute(
    `
      UPDATE friendship
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND friend_id = ?
        AND status = ?
    `,
    [FRIENDSHIP_REJECTED, requesterId, viewerId, FRIENDSHIP_PENDING],
  );

  return { success: true as const };
}

export async function searchUsers(userId: string, q?: string): Promise<UserSearchResult> {
  const db = getDbPool();
  const keyword = q?.trim() || '';
  const likeKeyword = `%${keyword}%`;

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        u.id,
        u.uid_code,
        up.name,
        up.avatar_url,
        u.level,
        u.title,
        up.signature,
        COALESCE((SELECT COUNT(*) FROM user_follow f1 WHERE f1.following_id = u.id), 0) AS followers,
        COALESCE((SELECT COUNT(*) FROM user_follow f2 WHERE f2.follower_id = u.id), 0) AS following,
        COALESCE((SELECT COUNT(*) FROM guess_bet gb1 WHERE gb1.user_id = u.id), 0) AS total_guess,
        COALESCE((SELECT COUNT(*) FROM guess_bet gb2 WHERE gb2.user_id = u.id AND gb2.status = 30), 0) AS wins,
        CASE WHEN s.id IS NULL THEN 0 ELSE 1 END AS shop_verified,
        s.name AS shop_name,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendship f
            WHERE f.user_id = ?
              AND f.friend_id = u.id
              AND f.status = ?
          ) THEN 'friend'
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = ?
              AND uf.following_id = u.id
          ) THEN 'following'
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = u.id
              AND uf.following_id = ?
          ) THEN 'fan'
          ELSE 'none'
        END AS relation
      FROM user u
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN (
        SELECT current_shop.user_id, current_shop.name
        FROM shop current_shop
        INNER JOIN (
          SELECT user_id, MAX(id) AS max_id
          FROM shop
          WHERE status = 10
          GROUP BY user_id
        ) latest_shop ON latest_shop.max_id = current_shop.id
      ) s ON s.user_id = u.id
      WHERE u.id <> ?
        AND (
          ? = ''
          OR COALESCE(up.name, '') LIKE ?
          OR COALESCE(up.signature, '') LIKE ?
          OR COALESCE(u.uid_code, '') LIKE ?
          OR COALESCE(s.name, '') LIKE ?
        )
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendship f
            WHERE f.user_id = ?
              AND f.friend_id = u.id
              AND f.status = ?
          ) THEN 0
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = ?
              AND uf.following_id = u.id
          ) THEN 1
          WHEN EXISTS (
            SELECT 1
            FROM user_follow uf
            WHERE uf.follower_id = u.id
              AND uf.following_id = ?
          ) THEN 2
          ELSE 3
        END ASC,
        COALESCE((SELECT COUNT(*) FROM user_follow f1 WHERE f1.following_id = u.id), 0) DESC,
        COALESCE((SELECT COUNT(*) FROM guess_bet gb1 WHERE gb1.user_id = u.id), 0) DESC,
        u.created_at DESC
      LIMIT 12
    `,
    [
      userId,
      FRIENDSHIP_ACCEPTED,
      userId,
      userId,
      userId,
      keyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      userId,
      FRIENDSHIP_ACCEPTED,
      userId,
      userId,
    ],
  );

  return {
    items: (rows as UserSearchRow[]).map((row) => sanitizeUserSearchRow(row)),
  };
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
      userId: String(row.peer_id),
      name: row.peer_name || '未知用户',
      avatar: row.peer_avatar_url ?? null,
      unreadCount: Number(row.unread_count ?? 0),
      lastMessage: row.last_message,
      lastMessageAt: new Date(row.last_message_at).toISOString(),
    })),
  };
}

export async function getChatDetail(userId: string, peerId: string): Promise<ChatDetailResult> {
  const peer = await findUserById(peerId);
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
      id: String(peer.id),
      uid: peer.uid_code ?? '',
      name: peer.name || '未知用户',
      avatar: peer.avatar_url ?? null,
      level: Number(peer.level ?? 1),
      title: peer.title ?? null,
      signature: peer.signature ?? null,
      followers: Number(peer.followers ?? 0),
      following: Number(peer.following ?? 0),
      winRate: Number(sanitizeUser(peer).winRate ?? 0),
      shopVerified: Number(peer.shop_verified ?? 0) > 0,
    },
    items: (rows as ChatRow[]).map((row) => sanitizeChatMessage(row, userId)),
  };
}

async function upsertConversationSummary(userId: string, peerId: string, lastMessage: string, unreadMode: 'reset' | 'increment') {
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

export async function sendChatMessage(userId: string, peerId: string, payload: SendChatMessagePayload): Promise<ChatMessageItem> {
  const peer = await findUserById(peerId);
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
