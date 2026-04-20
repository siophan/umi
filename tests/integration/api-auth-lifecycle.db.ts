import assert from 'node:assert/strict';

import type { ApiEnvelope, LoginResult, SendCodeResult, UserSummary } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type DbPool = ReturnType<typeof getDbPool>;

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}4`;
}

function getEnvelopeData<T>(json: unknown): T {
  assert.equal(typeof json, 'object');
  assert.ok(json);
  assert.equal((json as { success?: boolean }).success, true);
  return (json as ApiEnvelope<T>).data;
}

async function cleanup(db: DbPool, phone: string) {
  const [userRows] = await db.execute<Array<{ id: number } & Record<string, unknown>>>(
    'SELECT id FROM user WHERE phone_number = ?',
    [phone],
  );
  const userIds = userRows.map((row) => row.id);
  if (userIds.length > 0) {
    await db.query('DELETE FROM auth_session WHERE user_id IN (?)', [userIds]);
    await db.query('DELETE FROM user_profile WHERE user_id IN (?)', [userIds]);
    await db.query('DELETE FROM user WHERE id IN (?)', [userIds]);
  }
  await db.execute('DELETE FROM sms_verification_code WHERE phone_number = ?', [phone]);
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const phone = uniquePhone(Date.now().toString(36));
  const password = 'pass1234';

  try {
    await cleanup(db, phone);

    await withServer(createApp, async (baseUrl) => {
      const sendCodeResponse = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bizType: 'register' }),
      });
      assert.equal(sendCodeResponse.response.status, 200);
      const sendCodeData = getEnvelopeData<SendCodeResult>(sendCodeResponse.json);
      assert.equal(sendCodeData.sent, true);
      assert.ok(sendCodeData.devCode, 'devCode should be returned in development');

      const registerResponse = await getJson(baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: sendCodeData.devCode,
          password,
          name: 'Integration Auth User',
        }),
      });
      assert.equal(registerResponse.response.status, 200);
      const registerData = getEnvelopeData<LoginResult>(registerResponse.json);
      assert.ok(registerData.token);
      assert.equal(registerData.user.name, 'Integration Auth User');
      assert.equal(registerData.user.phone, phone);
      assert.equal(registerData.user.role, 'user');
      assert.equal(registerData.user.uid.length, 8);

      const meResponse = await getJson(baseUrl, '/api/auth/me', {
        headers: { Authorization: `Bearer ${registerData.token}` },
      });
      assert.equal(meResponse.response.status, 200);
      const meData = getEnvelopeData<UserSummary>(meResponse.json);
      assert.equal(meData.name, 'Integration Auth User');

      const updateResponse = await getJson(baseUrl, '/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${registerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Auth User',
          gender: 'male',
          birthday: '2000-01-02',
          region: 'Shanghai',
        }),
      });
      assert.equal(updateResponse.response.status, 200);
      const updatedData = getEnvelopeData<UserSummary>(updateResponse.json);
      assert.equal(updatedData.name, 'Updated Auth User');
      assert.equal(updatedData.gender, 'male');
      assert.equal(updatedData.birthday, '2000-01-02');
      assert.equal(updatedData.region, 'Shanghai');

      const logoutResponse = await getJson(baseUrl, '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${registerData.token}` },
      });
      assert.equal(logoutResponse.response.status, 200);

      const meAfterLogout = await getJson(baseUrl, '/api/auth/me', {
        headers: { Authorization: `Bearer ${registerData.token}` },
      });
      assert.equal(meAfterLogout.response.status, 401);

      const loginResponse = await getJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          method: 'password',
          password,
        }),
      });
      assert.equal(loginResponse.response.status, 200);
      const loginData = getEnvelopeData<LoginResult>(loginResponse.json);
      assert.ok(loginData.token);
      assert.equal(loginData.user.name, 'Updated Auth User');
    });

    console.log('api-auth-lifecycle.db: ok');
  } finally {
    await cleanup(db, phone);
  }
}

void main().catch((error) => {
  console.error('api-auth-lifecycle.db: failed');
  console.error(error);
  process.exitCode = 1;
});
