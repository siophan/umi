import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, GuessHistoryResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const REVIEW_APPROVED = 30;
const BET_PENDING = 10;
const BET_WON = 30;
const BET_LOST = 40;

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  token: string;
  userIds: number[];
  categoryId: number;
  brandId: number;
  brandProductId: number;
  productId: number;
  guessIds: number[];
  guessProductIds: number[];
  guessOptionIds: number[];
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
        created_at,
        updated_at
      ) VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [result.insertId, name],
  );
  return result.insertId;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const userId = await createUser(db, 'History User', seedKey, 'me');
  const bettorAId = await createUser(db, 'History Bettor A', seedKey, 'a1');
  const bettorBId = await createUser(db, 'History Bettor B', seedKey, 'b2');

  const token = `it_guess_history_${seedKey}`;
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
    [token, userId],
  );

  const [categoryResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO category (
        biz_type,
        parent_id,
        level,
        path,
        name,
        sort,
        status
      ) VALUES (30, NULL, 1, ?, ?, 0, 10)
    `,
    [`/guess-history-${seedKey}`, `GuessHistoryCat-${seedKey}`],
  );
  const [brandResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO brand (
        name,
        logo_url,
        category_id,
        status
      ) VALUES (?, ?, ?, 10)
    `,
    [`GuessHistoryBrand-${seedKey}`, 'https://example.com/guess-history-brand.png', categoryResult.insertId],
  );
  const [brandProductResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO brand_product (
        brand_id,
        name,
        category_id,
        guide_price,
        supply_price,
        default_img,
        images,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(), 10)
    `,
    [brandResult.insertId, `Guess History Product ${seedKey}`, categoryResult.insertId, 19900, 14900, 'https://example.com/guess-history-bp.png'],
  );
  const [productResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO product (
        brand_product_id,
        name,
        price,
        original_price,
        image_url,
        images,
        tags,
        stock,
        guess_price,
        status
      ) VALUES (?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), 10, ?, 10)
    `,
    [brandProductResult.insertId, `Guess History SKU ${seedKey}`, 15900, 18900, 'https://example.com/guess-history-product.png', 12900],
  );

  const guessIds: number[] = [];
  const guessProductIds: number[] = [];
  const guessOptionIds: number[] = [];
  const guessBetIds: number[] = [];

  const guessDefinitions = [
    { title: `History Active ${seedKey}`, status: GUESS_ACTIVE, scope: 10 },
    { title: `History Settled ${seedKey}`, status: GUESS_SETTLED, scope: 10 },
    { title: `History PK ${seedKey}`, status: GUESS_SETTLED, scope: 20 },
  ] as const;

  for (const definition of guessDefinitions) {
    const [guessResult] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess (
          title,
          type,
          source_type,
          status,
          end_time,
          creator_id,
          category_id,
          review_status,
          scope,
          settlement_mode
        ) VALUES (?, 10, 10, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), ?, ?, ?, ?, 10)
      `,
      [definition.title, definition.status, userId, categoryResult.insertId, REVIEW_APPROVED, definition.scope],
    );
    guessIds.push(guessResult.insertId);

    const [guessProductResult] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess_product (
          guess_id,
          product_id,
          option_idx,
          source_type,
          quantity
        ) VALUES (?, ?, 0, 10, 1)
      `,
      [guessResult.insertId, productResult.insertId],
    );
    guessProductIds.push(guessProductResult.insertId);

    const isSettledWinner = definition.status === GUESS_SETTLED ? 1 : 0;
    const [optionA] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess_option (
          guess_id,
          option_index,
          option_text,
          odds,
          is_result
        ) VALUES (?, 0, ?, 1.8, ?)
      `,
      [guessResult.insertId, '上涨', definition.scope === 20 ? 1 : 0],
    );
    const [optionB] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess_option (
          guess_id,
          option_index,
          option_text,
          odds,
          is_result
        ) VALUES (?, 1, ?, 2.1, ?)
      `,
      [guessResult.insertId, '下跌', definition.scope === 20 ? 0 : isSettledWinner],
    );
    guessOptionIds.push(optionA.insertId, optionB.insertId);
  }

  const [activeBetUser] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 0, 49, ?, ?)
    `,
    [userId, guessIds[0], productResult.insertId, BET_PENDING],
  );
  const [activeBetOtherA] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 0, 59, ?, ?)
    `,
    [bettorAId, guessIds[0], productResult.insertId, BET_PENDING],
  );
  const [activeBetOtherB] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 1, 69, ?, ?)
    `,
    [bettorBId, guessIds[0], productResult.insertId, BET_PENDING],
  );
  const [settledBetUser] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 1, 79, ?, ?)
    `,
    [userId, guessIds[1], productResult.insertId, BET_WON],
  );
  const [pkBetUser] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 1, 89, ?, ?)
    `,
    [userId, guessIds[2], productResult.insertId, BET_LOST],
  );
  const [pkBetOther] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 0, 99, ?, ?)
    `,
    [bettorAId, guessIds[2], productResult.insertId, BET_WON],
  );
  guessBetIds.push(
    activeBetUser.insertId,
    activeBetOtherA.insertId,
    activeBetOtherB.insertId,
    settledBetUser.insertId,
    pkBetUser.insertId,
    pkBetOther.insertId,
  );

  return {
    token,
    userIds: [userId, bettorAId, bettorBId],
    categoryId: categoryResult.insertId,
    brandId: brandResult.insertId,
    brandProductId: brandProductResult.insertId,
    productId: productResult.insertId,
    guessIds,
    guessProductIds,
    guessOptionIds,
    guessBetIds,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM guess_bet WHERE id IN (?, ?, ?, ?, ?, ?)', state.guessBetIds);
  await db.execute(
    'DELETE FROM guess_option WHERE id IN (?, ?, ?, ?, ?, ?)',
    state.guessOptionIds,
  );
  await db.execute('DELETE FROM guess_product WHERE id IN (?, ?, ?)', state.guessProductIds);
  await db.execute('DELETE FROM guess WHERE id IN (?, ?, ?)', state.guessIds);
  await db.execute('DELETE FROM auth_session WHERE token = ?', [state.token]);
  await db.execute('DELETE FROM product WHERE id = ?', [state.productId]);
  await db.execute('DELETE FROM brand_product WHERE id = ?', [state.brandProductId]);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?, ?)', state.userIds);
  await db.execute('DELETE FROM user WHERE id IN (?, ?, ?)', state.userIds);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const [unauthorized, historyResponse, aliasResponse] = await Promise.all([
        getJson(baseUrl, '/api/guesses/user/history'),
        getJson(baseUrl, '/api/guesses/user/history', {
          headers: { Authorization: `Bearer ${state.token}` },
        }),
        getJson(baseUrl, '/api/guesses/my-bets', {
          headers: { Authorization: `Bearer ${state.token}` },
        }),
      ]);

      assert.equal(unauthorized.response.status, 401);
      assert.equal(historyResponse.response.status, 200);
      assert.equal(aliasResponse.response.status, 200);

      const historyData = getEnvelopeData<GuessHistoryResult>(historyResponse.json);
      const aliasData = getEnvelopeData<GuessHistoryResult>(aliasResponse.json);

      assert.deepEqual(aliasData.stats, historyData.stats);
      assert.equal(historyData.stats.total, 3);
      assert.equal(historyData.stats.active, 1);
      assert.equal(historyData.stats.won, 1);
      assert.equal(historyData.stats.lost, 1);
      assert.equal(historyData.stats.pk, 1);
      assert.equal(historyData.stats.winRate, 50);

      assert.equal(historyData.active.length, 1);
      assert.equal(historyData.active[0]?.title, `History Active ${seedKey}`);
      assert.equal(historyData.active[0]?.participants, 3);
      assert.equal(historyData.active[0]?.choiceText, '上涨');
      assert.deepEqual(historyData.active[0]?.options, ['上涨', '下跌']);
      assert.deepEqual(historyData.active[0]?.optionProgress, [67, 33]);

      assert.equal(historyData.history.length, 2);
      assert.equal(historyData.history[0]?.title, `History PK ${seedKey}`);
      assert.equal(historyData.history[0]?.outcome, 'lost');
      assert.equal(historyData.history[1]?.title, `History Settled ${seedKey}`);
      assert.equal(historyData.history[1]?.outcome, 'won');
      assert.equal(historyData.history[1]?.resultText, '下跌');

      assert.equal(historyData.pk.length, 1);
      assert.equal(historyData.pk[0]?.title, `History PK ${seedKey}`);
      assert.equal(historyData.pk[0]?.leftName, 'History User');
      assert.equal(historyData.pk[0]?.leftChoice, '下跌');
      assert.equal(historyData.pk[0]?.rightChoice, '上涨');
    });

    console.log('api-guess-user-history.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-guess-user-history.db: failed');
  console.error(error);
  process.exitCode = 1;
});
