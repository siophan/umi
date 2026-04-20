import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type {
  ApiEnvelope,
  BrandAuthOverviewResult,
  MyShopResult,
} from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  token: string;
  userId: number;
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

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
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
    [userResult.insertId, 'Empty Shop User'],
  );

  const token = `it_shop_empty_${seedKey}`;
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

  return {
    token,
    userId: userResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }
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
      assert.equal(myShopData.shop, null);
      assert.deepEqual(myShopData.brandAuths, []);
      assert.deepEqual(myShopData.products, []);

      const brandAuthResponse = await getJson(baseUrl, '/api/shops/brand-auth', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(brandAuthResponse.response.status, 200);
      const brandAuthData = getEnvelopeData<BrandAuthOverviewResult>(brandAuthResponse.json);
      assert.equal(brandAuthData.shopName, null);
      assert.deepEqual(brandAuthData.mine, []);
      assert.deepEqual(brandAuthData.available, []);

      const applyResponse = await getJson(baseUrl, '/api/shops/brand-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: '123',
          reason: 'need auth',
        }),
      });
      assert.equal(applyResponse.response.status, 400);

      const brandProductsResponse = await getJson(baseUrl, '/api/shops/brand-products?brandId=123', {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(brandProductsResponse.response.status, 400);

      const addProductsResponse = await getJson(baseUrl, '/api/shops/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: '123',
          brandProductIds: ['456'],
        }),
      });
      assert.equal(addProductsResponse.response.status, 400);
    });

    console.log('api-shop-empty.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-shop-empty.db: failed');
  console.error(error);
  process.exitCode = 1;
});
