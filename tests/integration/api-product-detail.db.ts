import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, ProductDetailResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const GUESS_ACTIVE = 30;
const REVIEW_APPROVED = 30;

type SeedState = {
  token: string;
  userId: number;
  otherUserId: number;
  categoryId: number;
  brandId: number;
  brandProductIds: number[];
  shopId: number;
  productIds: number[];
  guessId: number;
  guessOptionIds: number[];
  guessBetIds: number[];
  guessProductId: number;
  virtualWarehouseId: number;
};

type DbPool = ReturnType<typeof getDbPool>;

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}3`;
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
    `
      INSERT INTO user_profile (user_id, name, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [result.insertId, name],
  );

  return result.insertId;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const userId = await createUser(
    db,
    'Product User',
    uniquePhone(`${seedKey}111`),
    `p${seedKey.slice(-6)}a`,
  );
  const otherUserId = await createUser(
    db,
    'Other Product User',
    uniquePhone(`${seedKey}222`),
    `p${seedKey.slice(-6)}b`,
  );

  const token = `it_product_${seedKey}`;
  await db.execute(
    `
      INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())
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
    [`/${seedKey}`, `Sneakers-${seedKey}`],
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
    [`Brand-${seedKey}`, 'https://example.com/brand.png', categoryResult.insertId],
  );

  const [brandProductTargetResult] = await db.execute<mysql.ResultSetHeader>(
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
    [brandResult.insertId, `Brand Product Target ${seedKey}`, categoryResult.insertId, 19900, 12900, 'https://example.com/bpt.png'],
  );
  const [brandProductRecResult] = await db.execute<mysql.ResultSetHeader>(
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
    [brandResult.insertId, `Brand Product Rec ${seedKey}`, categoryResult.insertId, 15900, 9900, 'https://example.com/bpr.png'],
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
    [userId, `Shop-${seedKey}`, categoryResult.insertId, 'integration shop', 'https://example.com/shop.png'],
  );

  const [targetProductResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(?, ?), JSON_ARRAY(?, ?), ?, ?, 10)
    `,
    [
      shopResult.insertId,
      brandProductTargetResult.insertId,
      `Target Product ${seedKey}`,
      12900,
      15900,
      'https://example.com/target-main.png',
      'https://example.com/target-main.png',
      'https://example.com/target-alt.png',
      'rare',
      'drop',
      12,
      9900,
    ],
  );
  const [recProductResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), ?, ?, 10)
    `,
    [
      shopResult.insertId,
      brandProductRecResult.insertId,
      `Recommendation Product ${seedKey}`,
      10900,
      13900,
      'https://example.com/recommend.png',
      5,
      8900,
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
      ) VALUES (?, 10, 10, ?, DATE_ADD(NOW(), INTERVAL 2 DAY), ?, ?, ?, 10, 10)
    `,
    [`Guess-${seedKey}`, GUESS_ACTIVE, userId, categoryResult.insertId, REVIEW_APPROVED],
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
    [guessResult.insertId, targetProductResult.insertId, shopResult.insertId],
  );

  const [optionYesResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_option (
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      ) VALUES (?, 0, ?, 1.72, 0)
    `,
    [guessResult.insertId, '会'],
  );
  const [optionNoResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_option (
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      ) VALUES (?, 1, ?, 2.18, 0)
    `,
    [guessResult.insertId, '不会'],
  );

  const [betAResult] = await db.execute<mysql.ResultSetHeader>(
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
    [userId, guessResult.insertId, targetProductResult.insertId],
  );
  const [betBResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id,
        guess_id,
        choice_idx,
        amount,
        product_id,
        status
      ) VALUES (?, ?, 0, 59, ?, 10)
    `,
    [otherUserId, guessResult.insertId, targetProductResult.insertId],
  );

  const [virtualWarehouseResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO virtual_warehouse (
        user_id,
        product_id,
        quantity,
        frozen_quantity,
        price,
        source_type,
        source_id,
        status,
        type,
        fragment_value
      ) VALUES (?, ?, 1, 0, ?, 10, ?, 10, 10, 0)
    `,
    [userId, targetProductResult.insertId, 12900, guessResult.insertId],
  );

  return {
    token,
    userId,
    otherUserId,
    categoryId: categoryResult.insertId,
    brandId: brandResult.insertId,
    brandProductIds: [brandProductTargetResult.insertId, brandProductRecResult.insertId],
    shopId: shopResult.insertId,
    productIds: [targetProductResult.insertId, recProductResult.insertId],
    guessId: guessResult.insertId,
    guessOptionIds: [optionYesResult.insertId, optionNoResult.insertId],
    guessBetIds: [betAResult.insertId, betBResult.insertId],
    guessProductId: guessProductResult.insertId,
    virtualWarehouseId: virtualWarehouseResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM virtual_warehouse WHERE id = ?', [state.virtualWarehouseId]);
  await db.execute('DELETE FROM guess_bet WHERE id IN (?, ?)', state.guessBetIds);
  await db.execute('DELETE FROM guess_option WHERE id IN (?, ?)', state.guessOptionIds);
  await db.execute('DELETE FROM guess_product WHERE id = ?', [state.guessProductId]);
  await db.execute('DELETE FROM guess WHERE id = ?', [state.guessId]);
  await db.execute('DELETE FROM product WHERE id IN (?, ?)', state.productIds);
  await db.execute('DELETE FROM shop WHERE id = ?', [state.shopId]);
  await db.execute('DELETE FROM brand_product WHERE id IN (?, ?)', state.brandProductIds);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM auth_session WHERE token = ?', [state.token]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?)', [state.userId, state.otherUserId]);
  await db.execute('DELETE FROM user WHERE id IN (?, ?)', [state.userId, state.otherUserId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const { response, json } = await getJson(baseUrl, `/api/products/${state.productIds[0]}`, {
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });

      assert.equal(response.status, 200);
      const data = getEnvelopeData<ProductDetailResult>(json);

      assert.equal(data.product.name, `Target Product ${seedKey}`);
      assert.equal(data.product.brand, `Brand-${seedKey}`);
      assert.equal(data.product.category, `Sneakers-${seedKey}`);
      assert.equal(data.product.price, 129);
      assert.equal(data.product.guessPrice, 99);
      assert.equal(data.product.originalPrice, 159);
      assert.equal(data.product.shopId, String(state.shopId));
      assert.equal(data.product.shopName, `Shop-${seedKey}`);
      assert.deepEqual(data.product.tags, ['rare', 'drop']);
      assert.ok(data.product.images.includes('https://example.com/target-alt.png'));

      assert.ok(data.activeGuess, 'activeGuess should exist');
      assert.equal(data.activeGuess?.title, `Guess-${seedKey}`);
      assert.equal(data.activeGuess?.category, `Sneakers-${seedKey}`);
      assert.equal(data.activeGuess?.options.length, 2);
      assert.deepEqual(
        data.activeGuess?.options.map((option) => option.voteCount),
        [2, 0],
      );

      assert.equal(data.warehouseItems.length, 1);
      assert.equal(data.warehouseItems[0]?.warehouseType, 'virtual');
      assert.equal(data.warehouseItems[0]?.sourceType, '竞猜奖励');
      assert.equal(data.warehouseItems[0]?.price, 129);

      assert.ok(data.recommendations.length >= 1, 'recommendations should include same-brand product');
      assert.equal(data.recommendations[0]?.name, `Recommendation Product ${seedKey}`);
      assert.equal(data.recommendations[0]?.category, `Sneakers-${seedKey}`);
    });

    console.log('api-product-detail.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-product-detail.db: failed');
  console.error(error);
  process.exitCode = 1;
});
