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
  const password = 'pass1234';

  try {
    await cleanup(db, phone);

    await withServer(createApp, async (baseUrl) => {
      const invalidSendCode = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '123', bizType: 'register' }),
      });
      assert.equal(invalidSendCode.response.status, 400);

      const sendCodeResponse = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bizType: 'register' }),
      });
      assert.equal(sendCodeResponse.response.status, 200);
      const sendCodeData = getEnvelopeData<SendCodeResult>(sendCodeResponse.json);
      assert.ok(sendCodeData.devCode);

      const registerResponse = await getJson(baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: sendCodeData.devCode,
          password,
          name: 'Validation User',
        }),
      });
      assert.equal(registerResponse.response.status, 200);
      const registerData = getEnvelopeData<LoginResult>(registerResponse.json);
      assert.ok(registerData.token);

      const duplicateCodeResponse = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bizType: 'register' }),
      });
      assert.equal(duplicateCodeResponse.response.status, 200);
      const duplicateCodeData = getEnvelopeData<SendCodeResult>(duplicateCodeResponse.json);
      assert.ok(duplicateCodeData.devCode);

      const duplicateRegister = await getJson(baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: duplicateCodeData.devCode,
          password,
          name: 'Validation User Again',
        }),
      });
      assert.equal(duplicateRegister.response.status, 400);

      const invalidGender = await getJson(baseUrl, '/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${registerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gender: 'robot' }),
      });
      assert.equal(invalidGender.response.status, 400);

      const invalidBirthday = await getJson(baseUrl, '/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${registerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ birthday: '2999-01-01' }),
      });
      assert.equal(invalidBirthday.response.status, 400);

      const wrongPasswordLogin = await getJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          method: 'password',
          password: 'wrongpass',
        }),
      });
      assert.equal(wrongPasswordLogin.response.status, 400);

      const logoutResponse = await getJson(baseUrl, '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${registerData.token}` },
      });
      assert.equal(logoutResponse.response.status, 200);

      const logoutAgainResponse = await getJson(baseUrl, '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${registerData.token}` },
      });
      assert.equal(logoutAgainResponse.response.status, 200);
    });

    console.log('api-auth-validation.db: ok');
  } finally {
    await cleanup(db, phone);
  }
}

void main().catch((error) => {
  console.error('api-auth-validation.db: failed');
  console.error(error);
  process.exitCode = 1;
});
