import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';

type DbPool = ReturnType<typeof getDbPool>;

type Where = {
  sql: string;
  params: Array<string | number>;
};

type CountRow = {
  count: number;
};

type SummaryItem = {
  table: string;
  count: number;
};

const CLEANUP_SCOPE = process.env.CLEANUP_SCOPE?.trim() || 'user';
const APPLY = process.env.CLEANUP_APPLY === '1';

const TEST_PROFILE_NAMES = [
  'Integration Buyer',
  'Other Buyer',
  'Order Detail User',
  'Foreign Order User',
  'Notify User',
  'Chat Peer',
  'Public Shop Owner',
  'Public Shop Bettor',
  'History User',
  'History Bettor A',
  'History Bettor B',
  'Social Me',
  'Accepted Friend',
  'Following Only',
  'Fan Only',
  'Pending Request',
  'Post Author',
  'Guest Product Owner',
  'Warehouse Admin User',
  'Integration Auth User',
  'Updated Auth User',
  'Validation User',
];

const CATEGORY_PATH_PATTERNS = [
  '/shop-%',
  '/public-shop-%',
  '/guess-%',
  '/guess-history-%',
  '/product-guest-%',
  '/warehouse-admin-%',
];

const CATEGORY_NAME_PATTERNS = [
  'ShopCat-%',
  'PublicShopCat-%',
  'GuessCat-%',
  'GuessHistoryCat-%',
  'ProductGuestCat-%',
  'Sneakers-%',
  'WarehouseAdminCat-%',
  'ShopGuardCat-%',
];

const SHOP_NAME_PATTERNS = [
  'Shop-%',
  'Public Shop %',
  'Product Guest Shop %',
  'Friend Shop %',
  'Shop Guard %',
];

const BRAND_NAME_PATTERNS = [
  'BrandMine-%',
  'BrandAvailable-%',
  'PublicBrand-%',
  'GuessBrand-%',
  'GuessHistoryBrand-%',
  'ProductGuestBrand-%',
  'Brand-%',
  'WarehouseAdminBrand-%',
  'ShopGuardBrand-%',
];

const BRAND_PRODUCT_NAME_PATTERNS = [
  'Mine Product %',
  'Available Product %',
  'Public Brand Product %',
  'GuessBrandProduct-%',
  'Guess History Product %',
  'Product Guest BP %',
  'Brand Product Target %',
  'Brand Product Rec %',
  'Warehouse Admin Product %',
  'Shop Guard Product %',
];

const PRODUCT_NAME_PATTERNS = [
  'Integration Product %',
  'Order Detail Product %',
  'Target Product %',
  'Recommendation Product %',
  'Product Guest SKU %',
  'Guess Product %',
  'Guess History SKU %',
  'Public Product %',
  'Seeded Shop Product %',
  'Warehouse Admin SKU %',
];

const GUESS_TITLE_PATTERNS = [
  'Guess Active %',
  'Guess Settled %',
  'History Active %',
  'History Settled %',
  'History PK %',
  'Public Guess %',
  'Product Guest Guess %',
];

const POST_TITLE_PATTERNS = [
  'Work Post %',
  'Bookmark Post %',
  'Liked Post %',
];

const TEST_MESSAGE_CONTENTS = [
  '你好，我先发一条',
  '收到',
  '继续聊',
];

const TOKEN_PATTERNS = ['it\\_%'];
const ORDER_SN_PATTERNS = ['itol%', 'itod%', 'itwh%', 'itov%'];
const FULFILLMENT_SN_PATTERNS = ['itfo%', 'itfod%', 'itfow%'];

const ADMIN_USERNAME_PATTERNS = [
  'admin\\_%',
  'guard\\_admin\\_%',
  'disabled\\_admin\\_%',
  'warehouse\\_admin\\_%',
];

const ADMIN_ROLE_CODE_PATTERNS = [
  'role\\_%',
  'guard-role-%',
  'warehouse-role-%',
];

const ADMIN_PERMISSION_CODE_PATTERNS = [
  'dashboard:view:%',
  'guard:view:%',
  'warehouse:view:%',
];

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniq(values: number[]) {
  return [...new Set(values.filter((value) => Number.isInteger(value) && value > 0))];
}

function equalsWhere(column: string, values: Array<string | number>): Where | null {
  if (values.length === 0) {
    return null;
  }
  return {
    sql: `${column} IN (${values.map(() => '?').join(', ')})`,
    params: values,
  };
}

function likeWhere(column: string, patterns: string[]): Where | null {
  if (patterns.length === 0) {
    return null;
  }
  return {
    sql: patterns.map(() => `${column} LIKE ? ESCAPE '\\\\'`).join(' OR '),
    params: patterns,
  };
}

function orWhere(parts: Array<Where | null>): Where {
  const present = parts.filter(Boolean) as Where[];
  if (present.length === 0) {
    return { sql: '1 = 0', params: [] };
  }
  return {
    sql: present.map((part) => `(${part.sql})`).join(' OR '),
    params: present.flatMap((part) => part.params),
  };
}

async function selectIds(db: DbPool, sql: string, params: Array<string | number> = []) {
  const [rows] = await db.query<Array<{ id: number } & Record<string, unknown>>>(sql, params);
  return uniq(rows.map((row) => Number(row.id)));
}

async function selectStrings(
  db: DbPool,
  sql: string,
  params: Array<string | number> = [],
  key = 'value',
) {
  const [rows] = await db.query<Array<Record<string, unknown>>>(sql, params);
  return [...new Set(rows.map((row) => String(row[key] ?? '')).filter(Boolean))];
}

async function countRows(db: DbPool, table: string, where: Where) {
  const [rows] = await db.query<CountRow[]>(
    `SELECT COUNT(*) AS count FROM ${table} WHERE ${where.sql}`,
    where.params,
  );
  return Number(rows[0]?.count ?? 0);
}

async function deleteWhere(db: DbPool, table: string, where: Where) {
  if (where.sql === '1 = 0') {
    return 0;
  }
  const [result] = await db.query<mysql.ResultSetHeader>(
    `DELETE FROM ${table} WHERE ${where.sql}`,
    where.params,
  );
  return Number(result.affectedRows ?? 0);
}

async function main() {
  assertDbConfigured();

  const db = getDbPool();
  const includeAdmin = CLEANUP_SCOPE === 'all';

  const tokenWhere = likeWhere('token', TOKEN_PATTERNS)!;
  const baseUserIds = uniq([
    ...await selectIds(
      db,
      `
        SELECT DISTINCT user_id AS id
        FROM auth_session
        WHERE ${tokenWhere.sql}
      `,
      tokenWhere.params,
    ),
    ...await selectIds(
      db,
      `
        SELECT user_id AS id
        FROM user_profile
        WHERE ${orWhere([
          equalsWhere('name', TEST_PROFILE_NAMES),
        ]).sql}
      `,
      TEST_PROFILE_NAMES,
    ),
  ]);

  const categoryWhere = orWhere([
    likeWhere('path', CATEGORY_PATH_PATTERNS),
    likeWhere('name', CATEGORY_NAME_PATTERNS),
  ]);
  const categoryIds = await selectIds(
    db,
    `SELECT id FROM category WHERE ${categoryWhere.sql}`,
    categoryWhere.params,
  );

  const shopWhere = orWhere([
    likeWhere('name', SHOP_NAME_PATTERNS),
    equalsWhere('user_id', baseUserIds),
  ]);
  const shopIds = await selectIds(
    db,
    `SELECT id FROM shop WHERE ${shopWhere.sql}`,
    shopWhere.params,
  );

  const brandWhere = orWhere([
    likeWhere('name', BRAND_NAME_PATTERNS),
    equalsWhere('category_id', categoryIds),
  ]);
  const brandIds = await selectIds(
    db,
    `SELECT id FROM brand WHERE ${brandWhere.sql}`,
    brandWhere.params,
  );

  const brandProductWhere = orWhere([
    likeWhere('name', BRAND_PRODUCT_NAME_PATTERNS),
    equalsWhere('brand_id', brandIds),
    equalsWhere('category_id', categoryIds),
  ]);
  const brandProductIds = await selectIds(
    db,
    `SELECT id FROM brand_product WHERE ${brandProductWhere.sql}`,
    brandProductWhere.params,
  );

  const productWhere = orWhere([
    likeWhere('name', PRODUCT_NAME_PATTERNS),
    equalsWhere('shop_id', shopIds),
    equalsWhere('brand_product_id', brandProductIds),
  ]);
  const productIds = await selectIds(
    db,
    `SELECT id FROM product WHERE ${productWhere.sql}`,
    productWhere.params,
  );

  const guessWhere = orWhere([
    likeWhere('title', GUESS_TITLE_PATTERNS),
    equalsWhere('category_id', categoryIds),
    equalsWhere('creator_id', baseUserIds),
  ]);
  const guessIds = await selectIds(
    db,
    `SELECT id FROM guess WHERE ${guessWhere.sql}`,
    guessWhere.params,
  );

  const guessProductIds = await selectIds(
    db,
    `
      SELECT id
      FROM guess_product
      WHERE ${orWhere([
        equalsWhere('guess_id', guessIds),
        equalsWhere('product_id', productIds),
      ]).sql}
    `,
    orWhere([
      equalsWhere('guess_id', guessIds),
      equalsWhere('product_id', productIds),
    ]).params,
  );
  const guessOptionIds = await selectIds(
    db,
    `SELECT id FROM guess_option WHERE ${equalsWhere('guess_id', guessIds)?.sql ?? '1 = 0'}`,
    equalsWhere('guess_id', guessIds)?.params ?? [],
  );

  const orderWhere = orWhere([
    likeWhere('order_sn', ORDER_SN_PATTERNS),
    equalsWhere('user_id', baseUserIds),
  ]);
  const orderIds = await selectIds(
    db,
    'SELECT id FROM `order` WHERE ' + orderWhere.sql,
    orderWhere.params,
  );

  const fulfillmentWhere = orWhere([
    likeWhere('fulfillment_sn', FULFILLMENT_SN_PATTERNS),
    equalsWhere('order_id', orderIds),
  ]);
  const fulfillmentIds = await selectIds(
    db,
    'SELECT id FROM fulfillment_order WHERE ' + fulfillmentWhere.sql,
    fulfillmentWhere.params,
  );

  const postWhere = orWhere([
    likeWhere('title', POST_TITLE_PATTERNS),
    equalsWhere('user_id', baseUserIds),
  ]);
  const postIds = await selectIds(
    db,
    `SELECT id FROM post WHERE ${postWhere.sql}`,
    postWhere.params,
  );

  const chatMessageWhere = orWhere([
    equalsWhere('sender_id', baseUserIds),
    equalsWhere('receiver_id', baseUserIds),
    equalsWhere('content', TEST_MESSAGE_CONTENTS),
  ]);
  const chatMessageIds = await selectIds(
    db,
    `SELECT id FROM chat_message WHERE ${chatMessageWhere.sql}`,
    chatMessageWhere.params,
  );

  const chatConversationWhere = orWhere([
    equalsWhere('user_id', baseUserIds),
    equalsWhere('peer_id', baseUserIds),
    equalsWhere('last_message_id', chatMessageIds),
  ]);
  const chatConversationIds = await selectIds(
    db,
    `SELECT id FROM chat_conversation WHERE ${chatConversationWhere.sql}`,
    chatConversationWhere.params,
  );

  const relatedUserIds = uniq([
    ...await selectIds(
      db,
      `
        SELECT DISTINCT user_id AS id
        FROM shop
        WHERE ${equalsWhere('id', shopIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('id', shopIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT user_id AS id
        FROM \`order\`
        WHERE ${equalsWhere('id', orderIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('id', orderIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT sender_id AS id
        FROM chat_message
        WHERE ${equalsWhere('id', chatMessageIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('id', chatMessageIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT receiver_id AS id
        FROM chat_message
        WHERE ${equalsWhere('id', chatMessageIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('id', chatMessageIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT following_id AS id
        FROM user_follow
        WHERE ${equalsWhere('follower_id', baseUserIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('follower_id', baseUserIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT follower_id AS id
        FROM user_follow
        WHERE ${equalsWhere('following_id', baseUserIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('following_id', baseUserIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT friend_id AS id
        FROM friendship
        WHERE ${equalsWhere('user_id', baseUserIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('user_id', baseUserIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT user_id AS id
        FROM friendship
        WHERE ${equalsWhere('friend_id', baseUserIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('friend_id', baseUserIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT user_id AS id
        FROM virtual_warehouse
        WHERE ${equalsWhere('product_id', productIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('product_id', productIds)?.params ?? [],
    ),
    ...await selectIds(
      db,
      `
        SELECT DISTINCT user_id AS id
        FROM physical_warehouse
        WHERE ${equalsWhere('product_id', productIds)?.sql ?? '1 = 0'}
      `,
      equalsWhere('product_id', productIds)?.params ?? [],
    ),
  ]);

  const userIds = uniq([...baseUserIds, ...relatedUserIds]);
  const phoneNumbers = userIds.length > 0
    ? await selectStrings(
        db,
        `
          SELECT phone_number AS value
          FROM user
          WHERE ${equalsWhere('id', userIds)?.sql ?? '1 = 0'}
        `,
        equalsWhere('id', userIds)?.params ?? [],
      )
    : [];

  const shopAuthApplyWhere = orWhere([
    equalsWhere('shop_id', shopIds),
    equalsWhere('brand_id', brandIds),
  ]);
  const shopAuthWhere = orWhere([
    equalsWhere('shop_id', shopIds),
    equalsWhere('brand_id', brandIds),
  ]);
  const guessBetWhere = orWhere([
    equalsWhere('guess_id', guessIds),
    equalsWhere('user_id', userIds),
  ]);
  const orderItemWhere = orWhere([
    equalsWhere('order_id', orderIds),
    equalsWhere('product_id', productIds),
  ]);
  const virtualWhere = orWhere([
    equalsWhere('user_id', userIds),
    equalsWhere('product_id', productIds),
  ]);
  const physicalWhere = orWhere([
    equalsWhere('user_id', userIds),
    equalsWhere('product_id', productIds),
  ]);
  const notificationWhere = equalsWhere('user_id', userIds) ?? { sql: '1 = 0', params: [] };
  const coinLedgerWhere = equalsWhere('user_id', userIds) ?? { sql: '1 = 0', params: [] };
  const postInteractionWhere = orWhere([
    equalsWhere('user_id', userIds),
    equalsWhere('post_id', postIds),
  ]);
  const friendshipWhere = orWhere([
    equalsWhere('user_id', userIds),
    equalsWhere('friend_id', userIds),
  ]);
  const userFollowWhere = orWhere([
    equalsWhere('follower_id', userIds),
    equalsWhere('following_id', userIds),
  ]);
  const authSessionWhere = orWhere([
    likeWhere('token', TOKEN_PATTERNS),
    equalsWhere('user_id', userIds),
  ]);
  const smsWhere = equalsWhere('phone_number', phoneNumbers) ?? { sql: '1 = 0', params: [] };
  const userProfileWhere = equalsWhere('user_id', userIds) ?? { sql: '1 = 0', params: [] };
  const userWhere = equalsWhere('id', userIds) ?? { sql: '1 = 0', params: [] };

  const summaries: SummaryItem[] = [
    { table: 'auth_session', count: await countRows(db, 'auth_session', authSessionWhere) },
    { table: 'sms_verification_code', count: await countRows(db, 'sms_verification_code', smsWhere) },
    { table: 'user', count: await countRows(db, 'user', userWhere) },
    { table: 'user_profile', count: await countRows(db, 'user_profile', userProfileWhere) },
    { table: 'coin_ledger', count: await countRows(db, 'coin_ledger', coinLedgerWhere) },
    { table: 'notification', count: await countRows(db, 'notification', notificationWhere) },
    { table: 'chat_message', count: await countRows(db, 'chat_message', chatMessageWhere) },
    { table: 'chat_conversation', count: await countRows(db, 'chat_conversation', chatConversationWhere) },
    { table: 'friendship', count: await countRows(db, 'friendship', friendshipWhere) },
    { table: 'user_follow', count: await countRows(db, 'user_follow', userFollowWhere) },
    { table: 'post', count: await countRows(db, 'post', postWhere) },
    { table: 'post_interaction', count: await countRows(db, 'post_interaction', postInteractionWhere) },
    { table: 'guess_bet', count: await countRows(db, 'guess_bet', guessBetWhere) },
    { table: 'guess_option', count: await countRows(db, 'guess_option', equalsWhere('id', guessOptionIds) ?? { sql: '1 = 0', params: [] }) },
    { table: 'guess_product', count: await countRows(db, 'guess_product', equalsWhere('id', guessProductIds) ?? { sql: '1 = 0', params: [] }) },
    { table: 'guess', count: await countRows(db, 'guess', equalsWhere('id', guessIds) ?? { sql: '1 = 0', params: [] }) },
    { table: 'fulfillment_order', count: await countRows(db, 'fulfillment_order', fulfillmentWhere) },
    { table: 'order_item', count: await countRows(db, 'order_item', orderItemWhere) },
    { table: 'order', count: await countRows(db, '`order`', orderWhere) },
    { table: 'virtual_warehouse', count: await countRows(db, 'virtual_warehouse', virtualWhere) },
    { table: 'physical_warehouse', count: await countRows(db, 'physical_warehouse', physicalWhere) },
    { table: 'product', count: await countRows(db, 'product', productWhere) },
    { table: 'shop_brand_auth_apply', count: await countRows(db, 'shop_brand_auth_apply', shopAuthApplyWhere) },
    { table: 'shop_brand_auth', count: await countRows(db, 'shop_brand_auth', shopAuthWhere) },
    { table: 'shop', count: await countRows(db, 'shop', shopWhere) },
    { table: 'brand_product', count: await countRows(db, 'brand_product', brandProductWhere) },
    { table: 'brand', count: await countRows(db, 'brand', brandWhere) },
    { table: 'category', count: await countRows(db, 'category', categoryWhere) },
  ];

  if (includeAdmin) {
    const adminUserWhere = likeWhere('username', ADMIN_USERNAME_PATTERNS)!;
    const adminRoleWhere = likeWhere('code', ADMIN_ROLE_CODE_PATTERNS)!;
    const adminPermissionWhere = likeWhere('code', ADMIN_PERMISSION_CODE_PATTERNS)!;
    const adminUserIds = await selectIds(
      db,
      `SELECT id FROM admin_user WHERE ${adminUserWhere.sql}`,
      adminUserWhere.params,
    );
    const adminRoleIds = await selectIds(
      db,
      `SELECT id FROM admin_role WHERE ${adminRoleWhere.sql}`,
      adminRoleWhere.params,
    );
    const adminPermissionIds = await selectIds(
      db,
      `SELECT id FROM admin_permission WHERE ${adminPermissionWhere.sql}`,
      adminPermissionWhere.params,
    );

    summaries.push(
      { table: 'admin_user_role', count: await countRows(db, 'admin_user_role', orWhere([equalsWhere('admin_user_id', adminUserIds), equalsWhere('role_id', adminRoleIds)])) },
      { table: 'admin_role_permission', count: await countRows(db, 'admin_role_permission', orWhere([equalsWhere('role_id', adminRoleIds), equalsWhere('permission_id', adminPermissionIds)])) },
      { table: 'admin_permission', count: await countRows(db, 'admin_permission', adminPermissionWhere) },
      { table: 'admin_role', count: await countRows(db, 'admin_role', adminRoleWhere) },
      { table: 'admin_user', count: await countRows(db, 'admin_user', adminUserWhere) },
    );

    if (APPLY) {
      await deleteWhere(db, 'admin_user_role', orWhere([equalsWhere('admin_user_id', adminUserIds), equalsWhere('role_id', adminRoleIds)]));
      await deleteWhere(db, 'admin_role_permission', orWhere([equalsWhere('role_id', adminRoleIds), equalsWhere('permission_id', adminPermissionIds)]));
      await deleteWhere(db, 'admin_permission', adminPermissionWhere);
      await deleteWhere(db, 'admin_role', adminRoleWhere);
      await deleteWhere(db, 'admin_user', adminUserWhere);
    }
  }

  console.log('=== DB Test Residue Scan ===');
  console.log(`Scope: ${CLEANUP_SCOPE}`);
  console.log(`Mode: ${APPLY ? 'apply' : 'scan'}`);
  console.log('');
  console.log('table\tcount');
  for (const item of summaries) {
    console.log(`${item.table}\t${item.count}`);
  }
  console.log('');
  console.log(`Candidate users: ${userIds.length}`);
  console.log(`Candidate phones: ${phoneNumbers.length}`);
  console.log(`Candidate products: ${productIds.length}`);
  console.log(`Candidate orders: ${orderIds.length}`);
  console.log(`Candidate guesses: ${guessIds.length}`);

  if (!APPLY) {
    console.log('');
    console.log('Scan only. Set CLEANUP_APPLY=1 to delete the rows above.');
    return;
  }

  await deleteWhere(db, 'guess_bet', guessBetWhere);
  await deleteWhere(db, 'guess_option', equalsWhere('id', guessOptionIds) ?? { sql: '1 = 0', params: [] });
  await deleteWhere(db, 'guess_product', equalsWhere('id', guessProductIds) ?? { sql: '1 = 0', params: [] });
  await deleteWhere(db, 'guess', equalsWhere('id', guessIds) ?? { sql: '1 = 0', params: [] });

  await deleteWhere(db, 'post_interaction', postInteractionWhere);
  await deleteWhere(db, 'post', postWhere);
  await deleteWhere(db, 'user_follow', userFollowWhere);
  await deleteWhere(db, 'friendship', friendshipWhere);
  await deleteWhere(db, 'chat_conversation', chatConversationWhere);
  await deleteWhere(db, 'chat_message', chatMessageWhere);
  await deleteWhere(db, 'notification', notificationWhere);
  await deleteWhere(db, 'coin_ledger', coinLedgerWhere);

  await deleteWhere(db, 'physical_warehouse', physicalWhere);
  await deleteWhere(db, 'virtual_warehouse', virtualWhere);
  await deleteWhere(db, 'fulfillment_order', fulfillmentWhere);
  await deleteWhere(db, 'order_item', orderItemWhere);
  await deleteWhere(db, '`order`', orderWhere);

  await deleteWhere(db, 'product', productWhere);
  await deleteWhere(db, 'shop_brand_auth', shopAuthWhere);
  await deleteWhere(db, 'shop_brand_auth_apply', shopAuthApplyWhere);
  await deleteWhere(db, 'shop', shopWhere);
  await deleteWhere(db, 'brand_product', brandProductWhere);
  await deleteWhere(db, 'brand', brandWhere);
  await deleteWhere(db, 'category', categoryWhere);

  await deleteWhere(db, 'auth_session', authSessionWhere);
  await deleteWhere(db, 'sms_verification_code', smsWhere);
  await deleteWhere(db, 'user_profile', userProfileWhere);
  await deleteWhere(db, 'user', userWhere);

  console.log('');
  console.log('Cleanup applied.');
}

void main().catch((error) => {
  console.error('db-test-residue: failed');
  console.error(error);
  process.exitCode = 1;
});
