import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, OrderListResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const FULFILLMENT_SHIPPED = 30;

type SeedState = {
  token: string;
  userId: number;
  otherUserId: number;
  productIds: number[];
  orderIds: number[];
};

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}0`;
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

type DbPool = ReturnType<typeof getDbPool>;

async function createUser(
  db: DbPool,
  name: string,
  phone: string,
  uidCode: string,
) {
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
    'Integration Buyer',
    uniquePhone(`${seedKey}101`),
    `i${seedKey.slice(-6)}a`,
  );
  const otherUserId = await createUser(
    db,
    'Other Buyer',
    uniquePhone(`${seedKey}202`),
    `i${seedKey.slice(-6)}b`,
  );

  const token = `it_order_list_${seedKey}`;
  await db.execute(
    `
      INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())
    `,
    [token, userId],
  );

  const [productAResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO product (
        name,
        price,
        image_url,
        images,
        tags,
        stock,
        status
      ) VALUES (?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), ?, ?)
    `,
    ['Integration Product A', 12900, 'https://example.com/a.png', 10, 10],
  );
  const [productBResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO product (
        name,
        price,
        image_url,
        images,
        tags,
        stock,
        status
      ) VALUES (?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), ?, ?)
    `,
    ['Integration Product B', 9900, 'https://example.com/b.png', 10, 10],
  );

  const [shippingOrderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO \`order\` (
        order_sn,
        user_id,
        type,
        amount,
        original_amount,
        coupon_discount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [`itol${seedKey}1`, userId, 20, 22800, 22800, 0, ORDER_PAID],
  );
  const [pendingOrderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO \`order\` (
        order_sn,
        user_id,
        type,
        amount,
        original_amount,
        coupon_discount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [`itol${seedKey}2`, userId, 20, 5000, 5000, 0, ORDER_PENDING],
  );
  const [otherOrderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO \`order\` (
        order_sn,
        user_id,
        type,
        amount,
        original_amount,
        coupon_discount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [`itol${seedKey}3`, otherUserId, 20, 8800, 8800, 0, ORDER_FULFILLED],
  );

  await db.execute(
    `
      INSERT INTO order_item (
        order_id,
        product_id,
        specs,
        quantity,
        unit_price,
        item_amount,
        coupon_discount
      ) VALUES
        (?, ?, ?, ?, ?, ?, 0),
        (?, ?, ?, ?, ?, ?, 0),
        (?, ?, ?, ?, ?, ?, 0)
    `,
    [
      shippingOrderResult.insertId,
      productAResult.insertId,
      '42',
      1,
      12900,
      12900,
      shippingOrderResult.insertId,
      productBResult.insertId,
      '43',
      1,
      9900,
      9900,
      pendingOrderResult.insertId,
      productBResult.insertId,
      '44',
      1,
      5000,
      5000,
    ],
  );

  await db.execute(
    `
      INSERT INTO fulfillment_order (
        fulfillment_sn,
        type,
        status,
        user_id,
        order_id,
        shipping_fee,
        total_amount
      ) VALUES (?, ?, ?, ?, ?, 0, ?)
    `,
    [`itfo${seedKey}1`, 10, FULFILLMENT_SHIPPED, userId, shippingOrderResult.insertId, 22800],
  );

  return {
    token,
    userId,
    otherUserId,
    productIds: [productAResult.insertId, productBResult.insertId],
    orderIds: [
      shippingOrderResult.insertId,
      pendingOrderResult.insertId,
      otherOrderResult.insertId,
    ],
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM fulfillment_order WHERE order_id IN (?, ?, ?)', state.orderIds);
  await db.execute('DELETE FROM order_item WHERE order_id IN (?, ?, ?)', state.orderIds);
  await db.execute('DELETE FROM `order` WHERE id IN (?, ?, ?)', state.orderIds);
  await db.execute('DELETE FROM auth_session WHERE token = ?', [state.token]);
  await db.execute('DELETE FROM user_profile WHERE user_id IN (?, ?)', [state.userId, state.otherUserId]);
  await db.execute('DELETE FROM user WHERE id IN (?, ?)', [state.userId, state.otherUserId]);
  await db.execute('DELETE FROM product WHERE id IN (?, ?)', state.productIds);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const { response, json } = await getJson(baseUrl, '/api/orders', {
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });

      assert.equal(response.status, 200);
      const data = getEnvelopeData<OrderListResult>(json);

      assert.equal(data.items.length, 2, 'should only return current user orders');

      const shippingOrder = data.items.find((item) => item.status === 'shipping');
      assert.ok(shippingOrder, 'expected one shipping order');
      assert.equal(shippingOrder.userId, String(state.userId));
      assert.equal(shippingOrder.orderType, 'shop');
      assert.equal(shippingOrder.amount, 228);
      assert.equal(shippingOrder.items.length, 2, 'multiple order items should be aggregated');
      assert.deepEqual(
        shippingOrder.items.map((item) => item.productName).sort(),
        ['Integration Product A', 'Integration Product B'],
      );
      assert.deepEqual(
        shippingOrder.items.map((item) => item.unitPrice).sort((a, b) => a - b),
        [99, 129],
      );

      const pendingOrder = data.items.find((item) => item.status === 'pending');
      assert.ok(pendingOrder, 'expected one pending order');
      assert.equal(pendingOrder.userId, String(state.userId));
      assert.equal(pendingOrder.amount, 50);
      assert.equal(pendingOrder.items.length, 1);
      assert.equal(pendingOrder.items[0]?.productName, 'Integration Product B');

      assert.ok(
        data.items.every((item) => item.userId === String(state.userId)),
        'foreign user orders must not leak into current user list',
      );
    });

    console.log('api-order-list.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-order-list.db: failed');
  console.error(error);
  process.exitCode = 1;
});
