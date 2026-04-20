import assert from 'node:assert/strict';

import type { ApiEnvelope } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type OrderOverview = {
  totalOrders: number;
  paidOrders: number;
};

const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_CLOSED = 40;
const ORDER_REFUNDED = 90;

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function fetchOverview(baseUrl: string) {
  const { response, json } = await getJson(
    baseUrl,
    '/api/orders/admin/stats/overview',
  );
  assert.equal(response.status, 200);
  return getEnvelopeData<OrderOverview>(json);
}

type DbPool = ReturnType<typeof getDbPool>;

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

async function cleanup(db: DbPool, prefix: string) {
  await db.execute('DELETE FROM `order` WHERE order_sn LIKE ?', [`${prefix}%`]);
}

async function seedOrders(db: DbPool, prefix: string) {
  const rows = [
    [`${prefix}pending`, 910001, ORDER_PENDING, 4900, 4900, 0],
    [`${prefix}paid`, 910002, ORDER_PAID, 4900, 4900, 0],
    [`${prefix}fulfilled`, 910003, ORDER_FULFILLED, 4900, 4900, 0],
    [`${prefix}closed`, 910004, ORDER_CLOSED, 4900, 4900, 0],
    [`${prefix}refunded`, 910005, ORDER_REFUNDED, 4900, 4900, 0],
  ] as const;

  await db.query(
    `
      INSERT INTO \`order\` (
        order_sn,
        user_id,
        status,
        amount,
        original_amount,
        coupon_discount
      ) VALUES ?
    `,
    [rows],
  );
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const prefix = `itov${Date.now().toString(36)}_`;

  try {
    await cleanup(db, prefix);

    await withServer(createApp, async (baseUrl) => {
      const before = await fetchOverview(baseUrl);

      await seedOrders(db, prefix);

      const afterInsert = await fetchOverview(baseUrl);
      assert.equal(afterInsert.totalOrders, before.totalOrders + 5);
      assert.equal(afterInsert.paidOrders, before.paidOrders + 3);

      await cleanup(db, prefix);

      const afterCleanup = await fetchOverview(baseUrl);
      assert.deepEqual(afterCleanup, before);
    });

    console.log('api-order-admin-overview.db: ok');
  } finally {
    await cleanup(db, prefix);
    await db.end();
  }
}

void main().catch((error) => {
  console.error('api-order-admin-overview.db: failed');
  console.error(error);
  process.exitCode = 1;
});
