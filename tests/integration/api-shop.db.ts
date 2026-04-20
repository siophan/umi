import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type {
  AddShopProductsResult,
  ApiEnvelope,
  BrandAuthOverviewResult,
  BrandProductListResult,
  MyShopResult,
  SubmitBrandAuthApplicationResult,
} from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  token: string;
  userId: number;
  categoryId: number;
  shopId: number;
  brandIds: number[];
  brandProductIds: number[];
  authApplyId: number;
  authId: number;
  seededProductId: number;
};

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}6`;
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function createUser(db: DbPool, name: string, phone: string, uidCode: string) {
  const [result] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
  const userId = await createUser(db, 'Shop Owner', uniquePhone(`${seedKey}111`), `s${seedKey.slice(-6)}a`);

  const token = `it_shop_${seedKey}`;
  await db.execute(
    'INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())',
    [token, userId],
  );

  const [categoryResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [`/shop-${seedKey}`, `ShopCat-${seedKey}`],
  );

  const [shopResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [userId, `Shop-${seedKey}`, categoryResult.insertId, 'integration shop', 'https://example.com/shop-logo.png'],
  );

  const [brandMineResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
    `
      INSERT INTO brand (
        name,
        logo_url,
        category_id,
        status
      ) VALUES (?, ?, ?, 10)
    `,
    [`BrandMine-${seedKey}`, 'https://example.com/brand-mine.png', categoryResult.insertId],
  );
  const [brandAvailableResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
    `
      INSERT INTO brand (
        name,
        logo_url,
        category_id,
        status
      ) VALUES (?, ?, ?, 10)
    `,
    [`BrandAvailable-${seedKey}`, 'https://example.com/brand-available.png', categoryResult.insertId],
  );

  const [authApplyResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [`BA${seedKey}`.slice(0, 32), shopResult.insertId, brandMineResult.insertId, '已有授权', 'https://example.com/license.png'],
  );

  const [authResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [`AUTH${seedKey}`.slice(0, 64), shopResult.insertId, brandMineResult.insertId],
  );

  const [brandProductMineResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [brandMineResult.insertId, `Mine Product ${seedKey}`, categoryResult.insertId, 19900, 12900, 'https://example.com/mine.png'],
  );
  const [brandProductAvailableResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [brandAvailableResult.insertId, `Available Product ${seedKey}`, categoryResult.insertId, 14900, 9900, 'https://example.com/available.png'],
  );

  const [seededProductResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
        frozen_stock,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), 10, 0, 10)
    `,
    [shopResult.insertId, brandProductMineResult.insertId, `Seeded Shop Product ${seedKey}`, 12900, 15900, 'https://example.com/shop-product.png'],
  );

  return {
    token,
    userId,
    categoryId: categoryResult.insertId,
    shopId: shopResult.insertId,
    brandIds: [brandMineResult.insertId, brandAvailableResult.insertId],
    brandProductIds: [brandProductMineResult.insertId, brandProductAvailableResult.insertId],
    authApplyId: authApplyResult.insertId,
    authId: authResult.insertId,
    seededProductId: seededProductResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }
  await db.execute('DELETE FROM product WHERE shop_id = ?', [state.shopId]);
  await db.execute('DELETE FROM shop_brand_auth WHERE id = ?', [state.authId]);
  await db.execute('DELETE FROM shop_brand_auth_apply WHERE shop_id = ?', [state.shopId]);
  await db.execute('DELETE FROM shop WHERE id = ?', [state.shopId]);
  await db.execute('DELETE FROM brand_product WHERE id IN (?, ?)', state.brandProductIds);
  await db.execute('DELETE FROM brand WHERE id IN (?, ?)', state.brandIds);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM auth_session WHERE token = ?', [state.token]);
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
      const myShopResponse = await getJson(baseUrl, '/api/shops/me', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(myShopResponse.response.status, 200);
      const myShopData = getEnvelopeData<MyShopResult>(myShopResponse.json);
      assert.equal(myShopData.shop?.name, `Shop-${seedKey}`);
      assert.equal(myShopData.shop?.category, `ShopCat-${seedKey}`);
      assert.equal(myShopData.brandAuths.length, 1);
      assert.equal(myShopData.products.length, 1);

      const brandAuthOverviewResponse = await getJson(baseUrl, '/api/shops/brand-auth', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(brandAuthOverviewResponse.response.status, 200);
      const brandAuthOverview = getEnvelopeData<BrandAuthOverviewResult>(brandAuthOverviewResponse.json);
      assert.equal(brandAuthOverview.mine[0]?.brandName, `BrandMine-${seedKey}`);
      assert.ok(
        brandAuthOverview.available.some((item) => item.name === `BrandAvailable-${seedKey}`),
      );

      const submitAuthResponse = await getJson(baseUrl, '/api/shops/brand-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: String(state.brandIds[1]),
          reason: '申请线上销售',
        }),
      });
      assert.equal(submitAuthResponse.response.status, 200);
      const submitAuthData =
        getEnvelopeData<SubmitBrandAuthApplicationResult>(submitAuthResponse.json);
      assert.equal(submitAuthData.status, 'pending');

      const brandProductsResponse = await getJson(
        baseUrl,
        `/api/shops/brand-products?brandId=${state.brandIds[0]}`,
        {
          headers: { Authorization: `Bearer ${state.token}` },
        },
      );
      assert.equal(brandProductsResponse.response.status, 200);
      const brandProductsData = getEnvelopeData<BrandProductListResult>(brandProductsResponse.json);
      assert.equal(brandProductsData.items[0]?.brandName, `BrandMine-${seedKey}`);
      assert.equal(brandProductsData.items[0]?.category, `ShopCat-${seedKey}`);

      const addProductsResponse = await getJson(baseUrl, '/api/shops/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: String(state.brandIds[0]),
          brandProductIds: [String(state.brandProductIds[0])],
        }),
      });
      assert.equal(addProductsResponse.response.status, 200);
      const addProductsData = getEnvelopeData<AddShopProductsResult>(addProductsResponse.json);
      assert.equal(addProductsData.count, 1);

      const afterShopResponse = await getJson(baseUrl, '/api/shops/me', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const afterShopData = getEnvelopeData<MyShopResult>(afterShopResponse.json);
      assert.equal(afterShopData.products.length, 2);
    });

    console.log('api-shop.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-shop.db: failed');
  console.error(error);
  process.exitCode = 1;
});
