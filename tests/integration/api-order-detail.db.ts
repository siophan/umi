import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, OrderSummary } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const ORDER_PAID = 20;
const FULFILLMENT_COMPLETED = 40;

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  token: string;
  userId: number;
  otherUserId: number;
  productId: number;
  orderId: number;
  foreignOrderId: number;
  orderItemId: number;
  fulfillmentOrderId: number;
};

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}7`;
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
  const userId = await createUser(db, 'Order Detail User', uniquePhone(`${seedKey}111`), `d${seedKey.slice(-6)}a`);
  const otherUserId = await createUser(db, 'Foreign Order User', uniquePhone(`${seedKey}222`), `d${seedKey.slice(-6)}b`);

  const token = `it_order_detail_${seedKey}`;
  await db.execute(
    'INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())',
    [token, userId],
  );

  const [productResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO product (
        name,
        price,
        original_price,
        image_url,
        images,
        tags,
        stock,
        status
      ) VALUES (?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), 10, 10)
    `,
    [`Order Detail Product ${seedKey}`, 12900, 15900, 'https://example.com/order-detail.png'],
  );

  const [orderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO \`order\` (
        order_sn,
        user_id,
        type,
        amount,
        original_amount,
        coupon_discount,
        status
      ) VALUES (?, ?, 20, ?, ?, 0, ?)
    `,
    [`itod${seedKey}`.slice(0, 32), userId, 12900, 12900, ORDER_PAID],
  );
  const [foreignOrderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO \`order\` (
        order_sn,
        user_id,
        type,
        amount,
        original_amount,
        coupon_discount,
        status
      ) VALUES (?, ?, 20, ?, ?, 0, ?)
    `,
    [`itodf${seedKey}`.slice(0, 32), otherUserId, 9900, 9900, ORDER_PAID],
  );

  const [orderItemResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO order_item (
        order_id,
        product_id,
        specs,
        quantity,
        unit_price,
        item_amount,
        coupon_discount
      ) VALUES (?, ?, ?, 1, ?, ?, 0)
    `,
    [orderResult.insertId, productResult.insertId, '42', 12900, 12900],
  );

  const [fulfillmentOrderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO fulfillment_order (
        fulfillment_sn,
        type,
        status,
        user_id,
        order_id,
        shipping_fee,
        total_amount
      ) VALUES (?, 10, ?, ?, ?, 0, ?)
    `,
    [`itfod${seedKey}`.slice(0, 32), FULFILLMENT_COMPLETED, userId, orderResult.insertId, 12900],
  );

  return {
    token,
    userId,
    otherUserId,
    productId: productResult.insertId,
    orderId: orderResult.insertId,
    foreignOrderId: foreignOrderResult.insertId,
    orderItemId: orderItemResult.insertId,
    fulfillmentOrderId: fulfillmentOrderResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) return;
  await db.execute('DELETE FROM fulfillment_order WHERE id = ?', [state.fulfillmentOrderId]);
  await db.execute('DELETE FROM order_item WHERE id = ?', [state.orderItemId]);
  await db.execute('DELETE FROM `order` WHERE id IN (?, ?)', [state.orderId, state.foreignOrderId]);
  await db.execute('DELETE FROM product WHERE id = ?', [state.productId]);
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
      const detailResponse = await getJson(baseUrl, `/api/orders/${state.orderId}`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(detailResponse.response.status, 200);
      const detail = getEnvelopeData<OrderSummary>(detailResponse.json);
      assert.equal(detail.id, String(state.orderId));
      assert.equal(detail.userId, String(state.userId));
      assert.equal(detail.status, 'delivered');
      assert.equal(detail.amount, 129);
      assert.equal(detail.items.length, 1);
      assert.equal(detail.items[0]?.productName, `Order Detail Product ${seedKey}`);

      const foreignResponse = await getJson(baseUrl, `/api/orders/${state.foreignOrderId}`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      assert.equal(foreignResponse.response.status, 404);
    });

    console.log('api-order-detail.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-order-detail.db: failed');
  console.error(error);
  process.exitCode = 1;
});
