import assert from 'node:assert/strict';

import type { AdminLoginResult, ApiEnvelope } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DashboardStats = {
  users: number;
  products: number;
  activeGuesses: number;
  orders: number;
  trend: unknown[];
  hotGuesses: unknown[];
  hotProducts: unknown[];
  pendingQueues: unknown[];
};

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  adminUserId: number;
  roleId: number;
  permissionId: number;
};

const ADMIN123_BCRYPT_HASH =
  '$2a$10$2tToNzRk0vxjPciCvKsmt.gSrq9krUYYw3DbEa9SK75IU/TVAqBJy';

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }
  await db.execute('DELETE FROM admin_role_permission WHERE role_id = ?', [state.roleId]);
  await db.execute('DELETE FROM admin_user_role WHERE admin_user_id = ?', [state.adminUserId]);
  await db.execute('DELETE FROM admin_permission WHERE id = ?', [state.permissionId]);
  await db.execute('DELETE FROM admin_role WHERE id = ?', [state.roleId]);
  await db.execute('DELETE FROM admin_user WHERE id = ?', [state.adminUserId]);
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const [adminResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [`admin_${seedKey}`, ADMIN123_BCRYPT_HASH, `Admin ${seedKey}`, `1${seedKey.slice(-9).padStart(9, '0')}5`, `${seedKey}@example.com`],
  );
  const [roleResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [`role_${seedKey}`, `Role ${seedKey}`, 'integration role'],
  );
  const [permissionResult] = await db.execute<import('mysql2/promise').ResultSetHeader>(
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
    [`dashboard:view:${seedKey}`, 'Dashboard View', 'dashboard', 10],
  );

  await db.execute(
    'INSERT INTO admin_user_role (admin_user_id, role_id) VALUES (?, ?)',
    [adminResult.insertId, roleResult.insertId],
  );
  await db.execute(
    'INSERT INTO admin_role_permission (role_id, permission_id) VALUES (?, ?)',
    [roleResult.insertId, permissionResult.insertId],
  );

  return {
    adminUserId: adminResult.insertId,
    roleId: roleResult.insertId,
    permissionId: permissionResult.insertId,
  };
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;
  const username = `admin_${seedKey}`;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const loginResponse = await getJson(baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: 'admin123' }),
      });
      assert.equal(loginResponse.response.status, 200);
      const loginData = getEnvelopeData<AdminLoginResult>(loginResponse.json);
      assert.ok(loginData.token);
      assert.equal(loginData.user.username, username);
      assert.equal(loginData.user.roles.length, 1);
      assert.equal(loginData.user.permissions[0], `dashboard:view:${seedKey}`);

      const meResponse = await getJson(baseUrl, '/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      assert.equal(meResponse.response.status, 200);

      const dashboardResponse = await getJson(baseUrl, '/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      assert.equal(dashboardResponse.response.status, 200);
      const dashboardData = getEnvelopeData<DashboardStats>(dashboardResponse.json);
      assert.equal(typeof dashboardData.users, 'number');
      assert.equal(typeof dashboardData.products, 'number');
      assert.equal(typeof dashboardData.activeGuesses, 'number');
      assert.equal(typeof dashboardData.orders, 'number');
      assert.ok(Array.isArray(dashboardData.trend));
      assert.ok(Array.isArray(dashboardData.hotGuesses));
      assert.ok(Array.isArray(dashboardData.hotProducts));
      assert.ok(Array.isArray(dashboardData.pendingQueues));

      const changePasswordResponse = await getJson(baseUrl, '/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'admin123',
          newPassword: 'admin456',
        }),
      });
      assert.equal(changePasswordResponse.response.status, 200);

      const oldLoginResponse = await getJson(baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: 'admin123' }),
      });
      assert.equal(oldLoginResponse.response.status, 400);

      const newLoginResponse = await getJson(baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: 'admin456' }),
      });
      assert.equal(newLoginResponse.response.status, 200);
    });

    console.log('api-admin-auth.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-admin-auth.db: failed');
  console.error(error);
  process.exitCode = 1;
});
