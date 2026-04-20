import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope, SendCodeResult } from '@umi/shared';

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
  await db.execute('DELETE FROM sms_verification_code WHERE phone_number = ?', [phone]);
}

async function markLatestCodeExpired(db: DbPool, phone: string, bizType: number) {
  await db.execute(
    `
      UPDATE sms_verification_code
      SET expires_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE),
          status = 10,
          updated_at = CURRENT_TIMESTAMP
      WHERE phone_number = ?
        AND biz_type = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [phone, bizType],
  );
}

async function main() {
  assertDbConfigured();
  const db = getDbPool();
  const phone = uniquePhone(Date.now().toString(36));

  try {
    await cleanup(db, phone);

    await withServer(createApp, async (baseUrl) => {
      const loginWithoutCode = await getJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          method: 'code',
        }),
      });
      assert.equal(loginWithoutCode.response.status, 400);

      const sendLoginCode = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bizType: 'login' }),
      });
      assert.equal(sendLoginCode.response.status, 200);
      const sendLoginData = getEnvelopeData<SendCodeResult>(sendLoginCode.json);
      assert.ok(sendLoginData.devCode);

      const wrongCodeLogin = await getJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          method: 'code',
          code: '000000',
        }),
      });
      assert.equal(wrongCodeLogin.response.status, 400);

      await markLatestCodeExpired(db, phone, 10);

      const expiredCodeLogin = await getJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          method: 'code',
          code: sendLoginData.devCode,
        }),
      });
      assert.equal(expiredCodeLogin.response.status, 400);

      const registerWithoutCode = await getJson(baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password: 'pass1234',
          name: 'No Code User',
        }),
      });
      assert.equal(registerWithoutCode.response.status, 400);

      const sendRegisterCode = await getJson(baseUrl, '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bizType: 'register' }),
      });
      assert.equal(sendRegisterCode.response.status, 200);
      const sendRegisterData = getEnvelopeData<SendCodeResult>(sendRegisterCode.json);
      assert.ok(sendRegisterData.devCode);

      const wrongCodeRegister = await getJson(baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: '999999',
          password: 'pass1234',
          name: 'Wrong Code User',
        }),
      });
      assert.equal(wrongCodeRegister.response.status, 400);
    });

    console.log('api-auth-code-errors.db: ok');
  } finally {
    await cleanup(db, phone);
  }
}

void main().catch((error) => {
  console.error('api-auth-code-errors.db: failed');
  console.error(error);
  process.exitCode = 1;
});
