import assert from 'node:assert/strict';

import type { ApiEnvelope, LoginResult, SendCodeResult } from '@umi/shared';

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

  try {
    await cleanup(db, phone);

    await withServer(createApp, async (baseUrl) => {
      const sendCodeResponse = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bizType: 'login' }),
      });
      assert.equal(sendCodeResponse.response.status, 200);
      const sendCodeData = getEnvelopeData<SendCodeResult>(sendCodeResponse.json);
      assert.ok(sendCodeData.devCode);

      const loginResponse = await getJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          method: 'code',
          code: sendCodeData.devCode,
        }),
      });
      assert.equal(loginResponse.response.status, 200);
      const loginData = getEnvelopeData<LoginResult>(loginResponse.json);
      assert.ok(loginData.token);
      assert.equal(loginData.user.phone, phone);
      assert.equal(loginData.user.name, `用户${phone.slice(-4)}`);
      assert.equal(loginData.user.role, 'user');

      const meResponse = await getJson(baseUrl, '/api/auth/me', {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      assert.equal(meResponse.response.status, 200);
      const meData = getEnvelopeData<LoginResult['user']>(meResponse.json);
      assert.equal(meData.phone, phone);
    });

    console.log('api-auth-code-login.db: ok');
  } finally {
    await cleanup(db, phone);
  }
}

void main().catch((error) => {
  console.error('api-auth-code-login.db: failed');
  console.error(error);
  process.exitCode = 1;
});
