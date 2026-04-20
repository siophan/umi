import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { AdminLoginResult, ApiEnvelope, WarehouseListResult } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

type StatsResult = {
  totalVirtual: number;
  totalPhysical: number;
};

type SeedState = {
  adminUserId: number;
  roleId: number;
  permissionId: number;
  userId: number;
  categoryId: number;
  brandId: number;
  brandProductId: number;
  productId: number;
  orderId: number;
  orderItemId: number;
  fulfillmentOrderId: number;
  virtualIds: number[];
  physicalId: number;
};

const ADMIN123_BCRYPT_HASH =
  '$2a$10$2tToNzRk0vxjPciCvKsmt.gSrq9krUYYw3DbEa9SK75IU/TVAqBJy';

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
    [uniqueUid(`w${seedKey}`), uniquePhone(seedKey), ''],
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
  const userId = await createUser(db, 'Warehouse Admin User', seedKey);

  const [adminResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO admin_user (
        username,
        password_hash,
        display_name,
        phone_number,
        email,
        status
      ) VALUES (?, ?, ?, ?, ?, 10)
    `,
    [`warehouse_admin_${seedKey}`, ADMIN123_BCRYPT_HASH, `Warehouse Admin ${seedKey}`, uniquePhone(`${seedKey}9`), `${seedKey}@warehouse.example.com`],
  );
  const [roleResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO admin_role (
        code,
        name,
        description,
        status,
        is_system,
        sort
      ) VALUES (?, ?, ?, 10, 0, 0)
    `,
    [`warehouse-role-${seedKey}`, `Warehouse Role ${seedKey}`, 'warehouse integration role'],
  );
  const [permissionResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO admin_permission (
        code,
        name,
        module,
        action,
        parent_id,
        status,
        sort
      ) VALUES (?, ?, ?, ?, NULL, 10, 0)
    `,
    [`warehouse:view:${seedKey}`, 'Warehouse View', 'warehouse', 10],
  );
  await db.execute(
    'INSERT INTO admin_user_role (admin_user_id, role_id) VALUES (?, ?)',
    [adminResult.insertId, roleResult.insertId],
  );
  await db.execute(
    'INSERT INTO admin_role_permission (role_id, permission_id) VALUES (?, ?)',
    [roleResult.insertId, permissionResult.insertId],
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
    [`/warehouse-admin-${seedKey}`, `WarehouseAdminCat-${seedKey}`],
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
    [`WarehouseAdminBrand-${seedKey}`, 'https://example.com/warehouse-admin-brand.png', categoryResult.insertId],
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
    [brandResult.insertId, `Warehouse Admin Product ${seedKey}`, categoryResult.insertId, 16900, 12900, 'https://example.com/warehouse-admin-product.png'],
  );
  const [productResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO product (
        brand_product_id,
        name,
        price,
        original_price,
        image_url,
        images,
        tags,
        stock,
        status
      ) VALUES (?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), 10, 10)
    `,
    [brandProductResult.insertId, `Warehouse Admin SKU ${seedKey}`, 12900, 15900, 'https://example.com/warehouse-admin-sku.png'],
  );

  const [orderResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO \`order\` (
        user_id,
        order_sn,
        amount,
        status,
        guess_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 20, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [userId, `WA${seedKey}`.slice(-24), 12900, 999001],
  );
  const [orderItemResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO order_item (
        order_id,
        product_id,
        quantity,
        unit_price,
        item_amount,
        specs,
        created_at,
        updated_at
      ) VALUES (?, ?, 1, 12900, 12900, JSON_OBJECT(), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [orderResult.insertId, productResult.insertId],
  );
  const [fulfillmentResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO fulfillment_order (
        fulfillment_sn,
        order_id,
        user_id,
        type,
        status,
        shipped_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 10, 30, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [`FUL${seedKey}`.slice(-32), orderResult.insertId, userId],
  );

  const [virtualStored] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO virtual_warehouse (
        user_id,
        product_id,
        quantity,
        price,
        source_type,
        status
      ) VALUES (?, ?, 1, 9900, 10, 10)
    `,
    [userId, productResult.insertId],
  );
  const [virtualConverted] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO virtual_warehouse (
        user_id,
        product_id,
        quantity,
        price,
        source_type,
        status
      ) VALUES (?, ?, 2, 11900, 30, 30)
    `,
    [userId, productResult.insertId],
  );
  const [physicalResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO physical_warehouse (
        user_id,
        product_id,
        quantity,
        price,
        status,
        consign_price,
        estimate_days,
        source_type,
        source_id,
        source_virtual_id
      ) VALUES (?, ?, 1, 12900, 20, 14900, 7, 20, ?, ?)
    `,
    [userId, productResult.insertId, orderResult.insertId, virtualStored.insertId],
  );

  return {
    adminUserId: adminResult.insertId,
    roleId: roleResult.insertId,
    permissionId: permissionResult.insertId,
    userId,
    categoryId: categoryResult.insertId,
    brandId: brandResult.insertId,
    brandProductId: brandProductResult.insertId,
    productId: productResult.insertId,
    orderId: orderResult.insertId,
    orderItemId: orderItemResult.insertId,
    fulfillmentOrderId: fulfillmentResult.insertId,
    virtualIds: [virtualStored.insertId, virtualConverted.insertId],
    physicalId: physicalResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM physical_warehouse WHERE id = ?', [state.physicalId]);
  await db.execute('DELETE FROM virtual_warehouse WHERE id IN (?, ?)', state.virtualIds);
  await db.execute('DELETE FROM fulfillment_order WHERE id = ?', [state.fulfillmentOrderId]);
  await db.execute('DELETE FROM order_item WHERE id = ?', [state.orderItemId]);
  await db.execute('DELETE FROM `order` WHERE id = ?', [state.orderId]);
  await db.execute('DELETE FROM product WHERE id = ?', [state.productId]);
  await db.execute('DELETE FROM brand_product WHERE id = ?', [state.brandProductId]);
  await db.execute('DELETE FROM brand WHERE id = ?', [state.brandId]);
  await db.execute('DELETE FROM category WHERE id = ?', [state.categoryId]);
  await db.execute('DELETE FROM admin_role_permission WHERE role_id = ?', [state.roleId]);
  await db.execute('DELETE FROM admin_user_role WHERE admin_user_id = ?', [state.adminUserId]);
  await db.execute('DELETE FROM admin_permission WHERE id = ?', [state.permissionId]);
  await db.execute('DELETE FROM admin_role WHERE id = ?', [state.roleId]);
  await db.execute('DELETE FROM admin_user WHERE id = ?', [state.adminUserId]);
  await db.execute('DELETE FROM user_profile WHERE user_id = ?', [state.userId]);
  await db.execute('DELETE FROM user WHERE id = ?', [state.userId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;
  const username = `warehouse_admin_${seedKey}`;

  try {
    const [beforeVirtualRows] = await db.execute<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total_virtual FROM virtual_warehouse',
    );
    const [beforePhysicalRows] = await db.execute<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total_physical FROM physical_warehouse',
    );
    const baselineVirtual = Number((beforeVirtualRows[0] as { total_virtual?: number | string } | undefined)?.total_virtual ?? 0);
    const baselinePhysical = Number((beforePhysicalRows[0] as { total_physical?: number | string } | undefined)?.total_physical ?? 0);

    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const unauthorizedResponse = await getJson(baseUrl, '/api/warehouse/admin/stats');
      assert.equal(unauthorizedResponse.response.status, 401);

      const loginResponse = await getJson(baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: 'admin123' }),
      });
      assert.equal(loginResponse.response.status, 200);
      const loginData = getEnvelopeData<AdminLoginResult>(loginResponse.json);
      assert.ok(loginData.token);

      const headers = { Authorization: `Bearer ${loginData.token}` };
      const [statsResponse, virtualResponse, physicalResponse] = await Promise.all([
        getJson(baseUrl, '/api/warehouse/admin/stats', { headers }),
        getJson(baseUrl, '/api/warehouse/admin/virtual', { headers }),
        getJson(baseUrl, '/api/warehouse/admin/physical', { headers }),
      ]);

      assert.equal(statsResponse.response.status, 200);
      assert.equal(virtualResponse.response.status, 200);
      assert.equal(physicalResponse.response.status, 200);

      const statsData = getEnvelopeData<StatsResult>(statsResponse.json);
      const virtualData = getEnvelopeData<WarehouseListResult>(virtualResponse.json);
      const physicalData = getEnvelopeData<WarehouseListResult>(physicalResponse.json);

      assert.equal(statsData.totalVirtual, baselineVirtual + 2);
      assert.equal(statsData.totalPhysical, baselinePhysical + 1);

      const storedVirtual = virtualData.items.find((item) => item.id === String(state?.virtualIds[0]));
      const convertedVirtual = virtualData.items.find((item) => item.id === String(state?.virtualIds[1]));
      assert.ok(storedVirtual, 'stored virtual item should be present');
      assert.ok(convertedVirtual, 'converted virtual item should be present');
      assert.equal(storedVirtual?.productName, `Warehouse Admin SKU ${seedKey}`);
      assert.equal(storedVirtual?.sourceType, '竞猜奖励');
      assert.equal(storedVirtual?.status, 'stored');
      assert.equal(convertedVirtual?.sourceType, '兑换入仓');
      assert.equal(convertedVirtual?.status, 'converted');

      const fulfillmentItem = physicalData.items.find((item) => item.id === `fo-${state?.fulfillmentOrderId}-${state?.orderItemId}`);
      const warehouseItem = physicalData.items.find((item) => item.id === `pw-${state?.physicalId}`);
      assert.ok(fulfillmentItem, 'fulfillment-backed physical item should be present');
      assert.ok(warehouseItem, 'physical warehouse item should be present');
      assert.equal(fulfillmentItem?.sourceType, '竞猜奖励');
      assert.equal(fulfillmentItem?.status, 'shipping');
      assert.equal(warehouseItem?.sourceType, '仓库调入');
      assert.equal(warehouseItem?.status, 'consigning');
      assert.equal(warehouseItem?.consignPrice, 149);
      assert.equal(warehouseItem?.estimateDays, 7);
    });

    console.log('api-warehouse-admin.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-warehouse-admin.db: failed');
  console.error(error);
  process.exitCode = 1;
});
