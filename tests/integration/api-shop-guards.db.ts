import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  ownerToken: string;
  outsiderToken: string;
  userIds: number[];
  categoryId: number;
  shopId: number;
  brandId: number;
  brandProductId: number;
  authApplyId: number;
  authId: number;
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

async function createUser(db: DbPool, name: string, seedKey: string, token: string) {
  const [userResult] = await db.execute<mysql.ResultSetHeader>(
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
    [userResult.insertId, name],
  );
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
    [token, userResult.insertId],
  );
  return userResult.insertId;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const ownerToken = `it_shop_guard_owner_${seedKey}`;
  const outsiderToken = `it_shop_guard_out_${seedKey}`;
  const ownerId = await createUser(db, 'Shop Guard Owner', `${seedKey}owner`, ownerToken);
  const outsiderId = await createUser(db, 'Shop Guard Outsider', `${seedKey}out`, outsiderToken);

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
    [`/shop-guard-${seedKey}`, `ShopGuardCat-${seedKey}`],
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
    [ownerId, `Shop Guard ${seedKey}`, categoryResult.insertId, 'shop guard', 'https://example.com/shop-guard.png'],
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
    [`ShopGuardBrand-${seedKey}`, 'https://example.com/shop-guard-brand.png', categoryResult.insertId],
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
    [brandResult.insertId, `Shop Guard Product ${seedKey}`, categoryResult.insertId, 14900, 10900, 'https://example.com/shop-guard-product.png'],
  );

  const [authApplyResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO shop_brand_auth_apply (
        apply_no,
        shop_id,
        brand_id,
        reason,
        license,
        status
      ) VALUES (?, ?, ?, ?, ?, 30)
    `,
    [`BAG${seedKey}`.slice(0, 32), shopResult.insertId, brandResult.insertId, '已有授权', 'https://example.com/license.png'],
  );

  const [authResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO shop_brand_auth (
        auth_no,
        shop_id,
        brand_id,
        auth_type,
        auth_scope,
        scope_value,
        status
      ) VALUES (?, ?, ?, 10, 10, NULL, 10)
    `,
    [`AUTHG${seedKey}`.slice(0, 64), shopResult.insertId, brandResult.insertId],
  );

  return {
    ownerToken,
    outsiderToken,
    userIds: [ownerId, outsiderId],
    categoryId: categoryResult.insertId,
    shopId: shopResult.insertId,
    brandId: brandResult.insertId,
    brandProductId: brandProductResult.insertId,
    authApplyId: authApplyResult.insertId,
    authId: authResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }
  await db.execute('DELETE FROM product WHERE shop_id = ?', [state.shopId]);
  await db.execute('DELETE FROM shop_brand_auth WHERE id = ?', [state.authId]);
  await db.execute('DELETE FROM shop_brand_auth_apply WHERE id = ?', [state.authApplyId]);
  await db.execute('DELETE FROM brand_product WHERE id = ?', [state.brandProductId]);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM shop WHERE id = ?', [state.shopId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM auth_session WHERE token IN (?, ?)', [state.ownerToken, state.outsiderToken]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?)', state.userIds);
  await db.execute('DELETE FROM user WHERE id IN (?, ?)', state.userIds);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const duplicateApply = await getJson(baseUrl, '/api/shops/brand-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.ownerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: String(state.brandId),
          reason: '再申请一次',
        }),
      });
      assert.equal(duplicateApply.response.status, 400);

      const outsiderBrandProducts = await getJson(
        baseUrl,
        `/api/shops/brand-products?brandId=${state.brandId}`,
        {
          headers: { Authorization: `Bearer ${state.outsiderToken}` },
        },
      );
      assert.equal(outsiderBrandProducts.response.status, 400);

      const outsiderAddProducts = await getJson(baseUrl, '/api/shops/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.outsiderToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: String(state.brandId),
          brandProductIds: [String(state.brandProductId)],
        }),
      });
      assert.equal(outsiderAddProducts.response.status, 400);

      const unauthOverview = await getJson(baseUrl, '/api/shops/me');
      assert.equal(unauthOverview.response.status, 401);
    });

    console.log('api-shop-guards.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-shop-guards.db: failed');
  console.error(error);
  process.exitCode = 1;
});
