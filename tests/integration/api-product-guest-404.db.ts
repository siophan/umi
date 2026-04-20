import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, ProductDetailResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const GUESS_ACTIVE = 30;
const REVIEW_APPROVED = 30;

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  userId: number;
  categoryId: number;
  brandId: number;
  brandProductId: number;
  shopId: number;
  productId: number;
  guessId: number;
  guessProductId: number;
  guessOptionIds: number[];
  guessBetId: number;
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

async function createUser(db: DbPool, name: string, seedKey: string) {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO user (
        uid_code,
        phone_number,
        password,
        achievements
      ) VALUES (?, ?, '', JSON_ARRAY())
    `,
    [uniqueUid(seedKey), uniquePhone(seedKey), ''],
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
  const userId = await createUser(db, 'Guest Product Owner', seedKey);

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
    [`/product-guest-${seedKey}`, `ProductGuestCat-${seedKey}`],
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
    [`ProductGuestBrand-${seedKey}`, 'https://example.com/product-guest-brand.png', categoryResult.insertId],
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
    [brandResult.insertId, `Product Guest BP ${seedKey}`, categoryResult.insertId, 16900, 12900, 'https://example.com/product-guest-bp.png'],
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
    [userId, `Product Guest Shop ${seedKey}`, categoryResult.insertId, 'guest product shop', 'https://example.com/product-guest-shop.png'],
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
        guess_price,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(?), JSON_ARRAY(?, ?), 6, ?, 10)
    `,
    [
      shopResult.insertId,
      brandProductResult.insertId,
      `Product Guest SKU ${seedKey}`,
      12900,
      15900,
      'https://example.com/product-guest-main.png',
      'https://example.com/product-guest-main.png',
      'guest',
      'detail',
      9900,
    ],
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
      ) VALUES (?, 10, 10, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), ?, ?, ?, 10, 10)
    `,
    [`Product Guest Guess ${seedKey}`, GUESS_ACTIVE, userId, categoryResult.insertId, REVIEW_APPROVED],
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
  const [optionA] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_option (
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      ) VALUES (?, 0, ?, 1.7, 0)
    `,
    [guessResult.insertId, '会涨'],
  );
  const [optionB] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_option (
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      ) VALUES (?, 1, ?, 2.1, 0)
    `,
    [guessResult.insertId, '不会涨'],
  );
  const [guessBetResult] = await db.execute<mysql.ResultSetHeader>(
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
    [userId, guessResult.insertId, productResult.insertId],
  );

  return {
    userId,
    categoryId: categoryResult.insertId,
    brandId: brandResult.insertId,
    brandProductId: brandProductResult.insertId,
    shopId: shopResult.insertId,
    productId: productResult.insertId,
    guessId: guessResult.insertId,
    guessProductId: guessProductResult.insertId,
    guessOptionIds: [optionA.insertId, optionB.insertId],
    guessBetId: guessBetResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }
  await db.execute('DELETE FROM guess_bet WHERE id = ?', [state.guessBetId]);
  await db.execute('DELETE FROM guess_option WHERE id IN (?, ?)', state.guessOptionIds);
  await db.execute('DELETE FROM guess_product WHERE id = ?', [state.guessProductId]);
  await db.execute('DELETE FROM guess WHERE id = ?', [state.guessId]);
  await db.execute('DELETE FROM product WHERE id = ?', [state.productId]);
  await db.execute('DELETE FROM shop WHERE id = ?', [state.shopId]);
  await db.execute('DELETE FROM brand_product WHERE id = ?', [state.brandProductId]);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM user_profile WHERE user_id = ?', [state.userId]);
  await db.execute('DELETE FROM user WHERE id = ?', [state.userId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const guestResponse = await getJson(baseUrl, `/api/products/${state.productId}`);
      assert.equal(guestResponse.response.status, 200);
      const guestData = getEnvelopeData<ProductDetailResult>(guestResponse.json);
      assert.equal(guestData.product.name, `Product Guest SKU ${seedKey}`);
      assert.equal(guestData.product.brand, `ProductGuestBrand-${seedKey}`);
      assert.equal(guestData.product.category, `ProductGuestCat-${seedKey}`);
      assert.equal(guestData.product.price, 129);
      assert.equal(guestData.product.guessPrice, 99);
      assert.equal(guestData.warehouseItems.length, 0);
      assert.ok(guestData.activeGuess);
      assert.equal(guestData.activeGuess?.title, `Product Guest Guess ${seedKey}`);
      assert.equal(guestData.activeGuess?.options.length, 2);

      const missingResponse = await getJson(baseUrl, '/api/products/999999999');
      assert.equal(missingResponse.response.status, 404);
    });

    console.log('api-product-guest-404.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-product-guest-404.db: failed');
  console.error(error);
  process.exitCode = 1;
});
