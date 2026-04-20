import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, PublicShopDetailResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const GUESS_ACTIVE = 30;

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  ownerId: number;
  bettorId: number;
  categoryId: number;
  shopId: number;
  brandId: number;
  brandProductId: number;
  productId: number;
  guessId: number;
  guessProductId: number;
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
  const ownerId = await createUser(db, 'Public Shop Owner', uniquePhone(`${seedKey}111`), `u${seedKey.slice(-6)}a`);
  const bettorId = await createUser(db, 'Public Shop Bettor', uniquePhone(`${seedKey}222`), `u${seedKey.slice(-6)}b`);

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
    [`/public-shop-${seedKey}`, `PublicShopCat-${seedKey}`],
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
      ) VALUES (?, ?, ?, ?, ?, 10)
    `,
    [ownerId, `Public Shop ${seedKey}`, categoryResult.insertId, 'public shop desc', 'https://example.com/public-shop.png'],
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
    [`PublicBrand-${seedKey}`, 'https://example.com/public-brand.png', categoryResult.insertId],
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
    [brandResult.insertId, `Public Brand Product ${seedKey}`, categoryResult.insertId, 16900, 12900, 'https://example.com/public-bp.png'],
  );

  const [productResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO product (
        shop_id,
        brand_product_id,
        name,
        price,
        original_price,
        image_url,
        images,
        tags,
        stock,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), 10, 10)
    `,
    [shopResult.insertId, brandProductResult.insertId, `Public Product ${seedKey}`, 12900, 15900, 'https://example.com/public-product.png'],
  );

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
      ) VALUES (?, 10, 10, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), ?, ?, 30, 10, 10)
    `,
    [`Public Guess ${seedKey}`, GUESS_ACTIVE, ownerId, categoryResult.insertId],
  );

  const [guessProductResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_product (
        guess_id,
        product_id,
        option_idx,
        source_type,
        shop_id,
        quantity
      ) VALUES (?, ?, 0, 10, ?, 1)
    `,
    [guessResult.insertId, productResult.insertId, shopResult.insertId],
  );

  const [optionAR] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_option (
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      ) VALUES (?, 0, ?, 1.8, 0)
    `,
    [guessResult.insertId, '会'],
  );
  const [optionBR] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_option (
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      ) VALUES (?, 1, ?, 2.0, 0)
    `,
    [guessResult.insertId, '不会'],
  );

  const [betAR] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 0, 49, ?, 10)
    `,
    [ownerId, guessResult.insertId, productResult.insertId],
  );
  const [betBR] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 1, 59, ?, 10)
    `,
    [bettorId, guessResult.insertId, productResult.insertId],
  );

  return {
    ownerId,
    bettorId,
    categoryId: categoryResult.insertId,
    shopId: shopResult.insertId,
    brandId: brandResult.insertId,
    brandProductId: brandProductResult.insertId,
    productId: productResult.insertId,
    guessId: guessResult.insertId,
    guessProductId: guessProductResult.insertId,
    guessOptionIds: [optionAR.insertId, optionBR.insertId],
    guessBetIds: [betAR.insertId, betBR.insertId],
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) return;
  await db.execute('DELETE FROM guess_bet WHERE id IN (?, ?)', state.guessBetIds);
  await db.execute('DELETE FROM guess_option WHERE id IN (?, ?)', state.guessOptionIds);
  await db.execute('DELETE FROM guess_product WHERE id = ?', [state.guessProductId]);
  await db.execute('DELETE FROM guess WHERE id = ?', [state.guessId]);
  await db.execute('DELETE FROM product WHERE id = ?', [state.productId]);
  await db.execute('DELETE FROM shop WHERE id = ?', [state.shopId]);
  await db.execute('DELETE FROM brand_product WHERE id = ?', [state.brandProductId]);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?)', [state.ownerId, state.bettorId]);
  await db.execute('DELETE FROM user WHERE id IN (?, ?)', [state.ownerId, state.bettorId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const response = await getJson(baseUrl, `/api/shops/${state.shopId}`);
      assert.equal(response.response.status, 200);
      const data = getEnvelopeData<PublicShopDetailResult>(response.json);

      assert.equal(data.shop?.name, `Public Shop ${seedKey}`);
      assert.equal(data.shop?.category, `PublicShopCat-${seedKey}`);
      assert.equal(data.products.length, 1);
      assert.equal(data.products[0]?.name, `Public Product ${seedKey}`);
      assert.equal(data.products[0]?.brand, `PublicBrand-${seedKey}`);
      assert.equal(data.guesses.length, 1);
      assert.equal(data.guesses[0]?.title, `Public Guess ${seedKey}`);
      assert.deepEqual(data.guesses[0]?.options, ['会', '不会']);
      assert.deepEqual(data.guesses[0]?.votes, [50, 50]);
    });

    console.log('api-shop-public.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-shop-public.db: failed');
  console.error(error);
  process.exitCode = 1;
});
