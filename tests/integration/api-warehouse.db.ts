import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, WarehouseListResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

const FULFILLMENT_SHIPPED = 30;
const ORDER_PAID = 20;

type SeedState = {
  token: string;
  userId: number;
  otherUserId: number;
  productIds: number[];
  orderId: number;
  orderItemId: number;
  fulfillmentOrderId: number;
  virtualIds: number[];
  physicalIds: number[];
};

type DbPool = ReturnType<typeof getDbPool>;

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}1`;
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

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
    'Warehouse User',
    uniquePhone(`${seedKey}111`),
    `w${seedKey.slice(-6)}a`,
  );
  const otherUserId = await createUser(
    db,
    'Other Warehouse User',
    uniquePhone(`${seedKey}222`),
    `w${seedKey.slice(-6)}b`,
  );

  const token = `it_warehouse_${seedKey}`;
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
    ['Warehouse Product A', 12900, 'https://example.com/wa.png', 10, 10],
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
    ['Warehouse Product B', 8800, 'https://example.com/wb.png', 10, 10],
  );

  const [virtualStoredResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, 10, 0)
    `,
    [userId, productAResult.insertId, 2, 12900, 20, 7001, 10],
  );
  const [virtualLockedResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, 10, 0)
    `,
    [userId, productBResult.insertId, 1, 8800, 10, 7002, 20],
  );
  const [virtualOtherResult] = await db.execute<mysql.ResultSetHeader>(
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
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, 10, 0)
    `,
    [otherUserId, productAResult.insertId, 9, 99900, 30, 7999, 30],
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [`itwh${seedKey}1`, userId, 20, 12900, 12900, 0, ORDER_PAID],
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
      ) VALUES (?, ?, ?, ?, ?, ?, 0)
    `,
    [orderResult.insertId, productAResult.insertId, '40', 1, 12900, 12900],
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
      ) VALUES (?, ?, ?, ?, ?, 0, ?)
    `,
    [`itfow${seedKey}1`, 10, FULFILLMENT_SHIPPED, userId, orderResult.insertId, 12900],
  );

  const [physicalConsigningResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO physical_warehouse (
        user_id,
        product_id,
        quantity,
        frozen_quantity,
        price,
        source_type,
        source_id,
        source_virtual_id,
        status,
        consign_price,
        consign_date,
        estimate_days
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `,
    [
      userId,
      productBResult.insertId,
      1,
      8800,
      20,
      8001,
      virtualLockedResult.insertId,
      20,
      10800,
      5,
    ],
  );
  const [physicalOtherResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO physical_warehouse (
        user_id,
        product_id,
        quantity,
        frozen_quantity,
        price,
        source_type,
        source_id,
        source_virtual_id,
        status,
        consign_price,
        consign_date,
        estimate_days
      ) VALUES (?, ?, ?, 0, ?, ?, ?, NULL, ?, ?, NOW(), ?)
    `,
    [otherUserId, productAResult.insertId, 3, 38800, 10, 8002, 30, 49900, 7],
  );

  return {
    token,
    userId,
    otherUserId,
    productIds: [productAResult.insertId, productBResult.insertId],
    orderId: orderResult.insertId,
    orderItemId: orderItemResult.insertId,
    fulfillmentOrderId: fulfillmentOrderResult.insertId,
    virtualIds: [
      virtualStoredResult.insertId,
      virtualLockedResult.insertId,
      virtualOtherResult.insertId,
    ],
    physicalIds: [physicalConsigningResult.insertId, physicalOtherResult.insertId],
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM physical_warehouse WHERE id IN (?, ?)', state.physicalIds);
  await db.execute('DELETE FROM fulfillment_order WHERE id = ?', [state.fulfillmentOrderId]);
  await db.execute('DELETE FROM order_item WHERE id = ?', [state.orderItemId]);
  await db.execute('DELETE FROM `order` WHERE id = ?', [state.orderId]);
  await db.execute('DELETE FROM virtual_warehouse WHERE id IN (?, ?, ?)', state.virtualIds);
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
      const [virtualResult, physicalResult] = await Promise.all([
        getJson(baseUrl, '/api/warehouse/virtual', {
          headers: { Authorization: `Bearer ${state.token}` },
        }),
        getJson(baseUrl, '/api/warehouse/physical', {
          headers: { Authorization: `Bearer ${state.token}` },
        }),
      ]);

      assert.equal(virtualResult.response.status, 200);
      assert.equal(physicalResult.response.status, 200);

      const virtualData = getEnvelopeData<WarehouseListResult>(virtualResult.json);
      const physicalData = getEnvelopeData<WarehouseListResult>(physicalResult.json);

      assert.equal(virtualData.items.length, 2, 'virtual warehouse should only include current user rows');
      assert.ok(
        virtualData.items.every((item) => item.userId === String(state.userId)),
        'virtual warehouse must not leak foreign rows',
      );

      const storedItem = virtualData.items.find((item) => item.status === 'stored');
      assert.ok(storedItem, 'expected one stored virtual item');
      assert.equal(storedItem.productName, 'Warehouse Product A');
      assert.equal(storedItem.quantity, 2);
      assert.equal(storedItem.price, 129);
      assert.equal(storedItem.sourceType, '订单入仓');
      assert.equal(storedItem.warehouseType, 'virtual');

      const lockedItem = virtualData.items.find((item) => item.status === 'locked');
      assert.ok(lockedItem, 'expected one locked virtual item');
      assert.equal(lockedItem.productName, 'Warehouse Product B');
      assert.equal(lockedItem.price, 88);
      assert.equal(lockedItem.sourceType, '竞猜奖励');

      assert.equal(physicalData.items.length, 2, 'physical warehouse should include fulfillment and physical rows for current user');
      assert.ok(
        physicalData.items.every((item) => item.userId === String(state.userId)),
        'physical warehouse must not leak foreign rows',
      );

      const shippingItem = physicalData.items.find((item) => item.id.startsWith('fo-'));
      assert.ok(shippingItem, 'expected fulfillment-backed physical item');
      assert.equal(shippingItem.status, 'shipping');
      assert.equal(shippingItem.sourceType, '商家发货');
      assert.equal(shippingItem.productName, 'Warehouse Product A');
      assert.equal(shippingItem.price, 129);

      const consigningItem = physicalData.items.find((item) => item.id.startsWith('pw-'));
      assert.ok(consigningItem, 'expected physical warehouse row');
      assert.equal(consigningItem.status, 'consigning');
      assert.equal(consigningItem.sourceType, '仓库调入');
      assert.equal(consigningItem.productName, 'Warehouse Product B');
      assert.equal(consigningItem.price, 88);
      assert.equal(consigningItem.consignPrice, 108);
      assert.equal(consigningItem.estimateDays, 5);
    });

    console.log('api-warehouse.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-warehouse.db: failed');
  console.error(error);
  process.exitCode = 1;
});
