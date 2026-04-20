import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, GuessListResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const REVIEW_APPROVED = 30;

type GuessStatsResult = {
  totalVotes: number;
  optionCount: number;
};

type SeedState = {
  categoryId: number;
  brandId: number;
  brandProductId: number;
  productId: number;
  guessIds: number[];
  guessProductIds: number[];
  guessOptionIds: number[];
  guessBetIds: number[];
};

type DbPool = ReturnType<typeof getDbPool>;

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
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
    [`/guess-${seedKey}`, `GuessCat-${seedKey}`],
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
    [`GuessBrand-${seedKey}`, 'https://example.com/guess-brand.png', categoryResult.insertId],
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
    [brandResult.insertId, `GuessBrandProduct-${seedKey}`, categoryResult.insertId, 16900, 11900, 'https://example.com/guess-product.png'],
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
      ) VALUES (?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), ?, ?, 10)
    `,
    [brandProductResult.insertId, `Guess Product ${seedKey}`, 12900, 15900, 'https://example.com/guess-item.png', 20, 9900],
  );

  const [activeGuessResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, 10, 10, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), 1, ?, ?, 10, 10)
    `,
    [`Guess Active ${seedKey}`, GUESS_ACTIVE, categoryResult.insertId, REVIEW_APPROVED],
  );
  const [settledGuessResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, 10, 10, ?, DATE_ADD(NOW(), INTERVAL 2 DAY), 1, ?, ?, 10, 10)
    `,
    [`Guess Settled ${seedKey}`, GUESS_SETTLED, categoryResult.insertId, REVIEW_APPROVED],
  );

  const [activeGuessProductResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_product (
        guess_id,
        product_id,
        option_idx,
        source_type,
        quantity
      ) VALUES (?, ?, 0, 10, 1)
    `,
    [activeGuessResult.insertId, productResult.insertId],
  );
  const [settledGuessProductResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_product (
        guess_id,
        product_id,
        option_idx,
        source_type,
        quantity
      ) VALUES (?, ?, 0, 10, 1)
    `,
    [settledGuessResult.insertId, productResult.insertId],
  );

  const optionIds: number[] = [];
  const betIds: number[] = [];

  for (const guessId of [activeGuessResult.insertId, settledGuessResult.insertId]) {
    const [optionAR] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess_option (
          guess_id,
          option_index,
          option_text,
          odds,
          is_result
        ) VALUES (?, 0, ?, 1.80, 0)
      `,
      [guessId, '是'],
    );
    const [optionBR] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess_option (
          guess_id,
          option_index,
          option_text,
          odds,
          is_result
        ) VALUES (?, 1, ?, 2.05, ?)
      `,
      [guessId, '否', guessId === settledGuessResult.insertId ? 1 : 0],
    );
    optionIds.push(optionAR.insertId, optionBR.insertId);
  }

  const [bet1] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (1, ?, 0, 49, ?, 10)
    `,
    [activeGuessResult.insertId, productResult.insertId],
  );
  const [bet2] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (2, ?, 0, 59, ?, 10)
    `,
    [activeGuessResult.insertId, productResult.insertId],
  );
  const [bet3] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (3, ?, 1, 69, ?, 30)
    `,
    [settledGuessResult.insertId, productResult.insertId],
  );
  betIds.push(bet1.insertId, bet2.insertId, bet3.insertId);

  return {
    categoryId: categoryResult.insertId,
    brandId: brandResult.insertId,
    brandProductId: brandProductResult.insertId,
    productId: productResult.insertId,
    guessIds: [activeGuessResult.insertId, settledGuessResult.insertId],
    guessProductIds: [activeGuessProductResult.insertId, settledGuessProductResult.insertId],
    guessOptionIds: optionIds,
    guessBetIds: betIds,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM guess_bet WHERE id IN (?, ?, ?)', state.guessBetIds);
  await db.execute('DELETE FROM guess_option WHERE id IN (?, ?, ?, ?)', state.guessOptionIds);
  await db.execute('DELETE FROM guess_product WHERE id IN (?, ?)', state.guessProductIds);
  await db.execute('DELETE FROM guess WHERE id IN (?, ?)', state.guessIds);
  await db.execute('DELETE FROM product WHERE id = ?', [state.productId]);
  await db.execute('DELETE FROM brand_product WHERE id = ?', [state.brandProductId]);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const [listResult, detailResult, statsResult] = await Promise.all([
        getJson(baseUrl, '/api/guesses'),
        getJson(baseUrl, `/api/guesses/${state.guessIds[0]}`),
        getJson(baseUrl, `/api/guesses/${state.guessIds[0]}/stats`),
      ]);

      assert.equal(listResult.response.status, 200);
      assert.equal(detailResult.response.status, 200);
      assert.equal(statsResult.response.status, 200);

      const listData = getEnvelopeData<GuessListResult>(listResult.json);
      const detailData = getEnvelopeData<GuessListResult['items'][number]>(detailResult.json);
      const statsData = getEnvelopeData<GuessStatsResult>(statsResult.json);

      const activeItem = listData.items.find((item) => item.id === String(state.guessIds[0]));
      assert.ok(activeItem, 'active guess should appear in list');
      assert.equal(activeItem.title, `Guess Active ${seedKey}`);
      assert.equal(activeItem.category, `GuessCat-${seedKey}`);
      assert.equal(activeItem.product.name, `Guess Product ${seedKey}`);
      assert.deepEqual(
        activeItem.options.map((option) => option.voteCount),
        [2, 0],
      );

      const settledItem = listData.items.find((item) => item.id === String(state.guessIds[1]));
      assert.ok(settledItem, 'settled guess should appear in list');
      assert.equal(settledItem.status, 'settled');

      assert.equal(detailData.id, String(state.guessIds[0]));
      assert.equal(detailData.category, `GuessCat-${seedKey}`);
      assert.equal(detailData.product.brand, `GuessBrand-${seedKey}`);
      assert.equal(detailData.product.price, 129);
      assert.equal(detailData.product.guessPrice, 99);
      assert.equal(detailData.options.length, 2);
      assert.equal(detailData.options[0]?.optionText, '是');

      assert.equal(statsData.totalVotes, 2);
      assert.equal(statsData.optionCount, 1);
    });

    console.log('api-guess.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-guess.db: failed');
  console.error(error);
  process.exitCode = 1;
});
