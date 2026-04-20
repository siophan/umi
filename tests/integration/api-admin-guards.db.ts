import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { AdminLoginResult, ApiEnvelope } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

type SeedState = {
  activeAdminId: number;
  disabledAdminId: number;
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

function uniquePhone(seed: string) {
  const digits = `${Date.now()}${seed.replace(/\D/g, '')}${Math.floor(Math.random() * 1000)}`
    .slice(-10)
    .padStart(10, '0');
  return `1${digits}`;
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function seed(db: DbPool, seedKey: string): Promise<SeedState> {
  const [activeAdmin] = await db.execute<mysql.ResultSetHeader>(
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
    [`guard_admin_${seedKey}`, ADMIN123_BCRYPT_HASH, `Guard Admin ${seedKey}`, uniquePhone(`${seedKey}1`), `${seedKey}@guard.example.com`],
  );
  const [disabledAdmin] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO admin_user (
        username,
        password_hash,
        display_name,
        phone_number,
        email,
        status
      ) VALUES (?, ?, ?, ?, ?, 90)
    `,
    [`disabled_admin_${seedKey}`, ADMIN123_BCRYPT_HASH, `Disabled Admin ${seedKey}`, uniquePhone(`${seedKey}2`), `${seedKey}@disabled.example.com`],
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
    [`guard-role-${seedKey}`, `Guard Role ${seedKey}`, 'guard integration role'],
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
    [`guard:view:${seedKey}`, 'Guard View', 'guard', 10],
  );

  await db.execute(
    'INSERT INTO admin_user_role (admin_user_id, role_id) VALUES (?, ?)',
    [activeAdmin.insertId, roleResult.insertId],
  );
  await db.execute(
    'INSERT INTO admin_role_permission (role_id, permission_id) VALUES (?, ?)',
    [roleResult.insertId, permissionResult.insertId],
  );

  return {
    activeAdminId: activeAdmin.insertId,
    disabledAdminId: disabledAdmin.insertId,
    roleId: roleResult.insertId,
    permissionId: permissionResult.insertId,
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }
  await db.execute('DELETE FROM admin_role_permission WHERE role_id = ?', [state.roleId]);
  await db.execute('DELETE FROM admin_user_role WHERE admin_user_id = ?', [state.activeAdminId]);
  await db.execute('DELETE FROM admin_permission WHERE id = ?', [state.permissionId]);
  await db.execute('DELETE FROM admin_role WHERE id = ?', [state.roleId]);
  await db.execute('DELETE FROM admin_user WHERE id IN (?, ?)', [state.activeAdminId, state.disabledAdminId]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const seedKey = Date.now().toString(36);
  let state: SeedState | null = null;
  const activeUsername = `guard_admin_${seedKey}`;
  const disabledUsername = `disabled_admin_${seedKey}`;

  try {
    state = await seed(db, seedKey);

    await withServer(createApp, async (baseUrl) => {
      const unauthorizedRoutes = [
        '/api/admin/auth/me',
        '/api/admin/dashboard/stats',
        '/api/admin/orders',
        '/api/orders/admin/stats/overview',
        '/api/warehouse/admin/stats',
      ];

      for (const route of unauthorizedRoutes) {
        const response = await getJson(baseUrl, route);
        assert.equal(response.response.status, 401, `${route} should require admin auth`);
      }

      const invalidTokenResponse = await getJson(baseUrl, '/api/admin/dashboard/stats', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      assert.equal(invalidTokenResponse.response.status, 401);

      const disabledLogin = await getJson(baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: disabledUsername, password: 'admin123' }),
      });
      assert.equal(disabledLogin.response.status, 400);

      const loginResponse = await getJson(baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: activeUsername, password: 'admin123' }),
      });
      assert.equal(loginResponse.response.status, 200);
      const loginData = getEnvelopeData<AdminLoginResult>(loginResponse.json);
      assert.ok(loginData.token);

      const headers = { Authorization: `Bearer ${loginData.token}` };
      const [meResponse, dashboardResponse, ordersOverviewResponse, warehouseStatsResponse] = await Promise.all([
        getJson(baseUrl, '/api/admin/auth/me', { headers }),
        getJson(baseUrl, '/api/admin/dashboard/stats', { headers }),
        getJson(baseUrl, '/api/orders/admin/stats/overview', { headers }),
        getJson(baseUrl, '/api/warehouse/admin/stats', { headers }),
      ]);

      assert.equal(meResponse.response.status, 200);
      assert.equal(dashboardResponse.response.status, 200);
      assert.equal(ordersOverviewResponse.response.status, 200);
      assert.equal(warehouseStatsResponse.response.status, 200);
    });

    console.log('api-admin-guards.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-admin-guards.db: failed');
  console.error(error);
  process.exitCode = 1;
});
