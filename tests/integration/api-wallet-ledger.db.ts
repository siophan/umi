import assert from 'node:assert/strict';

import type mysql from 'mysql2/promise';

import type { ApiEnvelope } from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getDbPool } from '../../apps/api/src/lib/db';
import { getJson, withServer } from '../smoke/helpers';

type WalletLedgerResult = {
  balance: number;
  items: Array<{
    id: string;
    userId: string;
    type: string;
    amount: number;
    balanceAfter: number;
    sourceType: string;
    sourceId: string;
    note: string;
    createdAt: string;
  }>;
};

type SeedState = {
  token: string;
  userId: number;
  otherUserId: number;
  ledgerIds: number[];
};

type DbPool = ReturnType<typeof getDbPool>;

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

function uniquePhone(seed: string) {
  const digits = seed.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `1${digits}2`;
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
    'Wallet User',
    uniquePhone(`${seedKey}111`),
    `l${seedKey.slice(-6)}a`,
  );
  const otherUserId = await createUser(
    db,
    'Other Wallet User',
    uniquePhone(`${seedKey}222`),
    `l${seedKey.slice(-6)}b`,
  );

  const token = `it_wallet_${seedKey}`;
  await db.execute(
    `
      INSERT INTO auth_session (token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW(), NOW())
    `,
    [token, userId],
  );

  const [creditResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO coin_ledger (
        user_id,
        type,
        amount,
        balance_after,
        source_type,
        source_id,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, 10, 300, 300, 10, 9001, '充值入账'],
  );
  const [rewardResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO coin_ledger (
        user_id,
        type,
        amount,
        balance_after,
        source_type,
        source_id,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, 40, 50, 350, 20, 9002, '竞猜奖励'],
  );
  const [fallbackResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO coin_ledger (
        user_id,
        type,
        amount,
        balance_after,
        source_type,
        source_id,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, 99, -10, 340, null, null, null],
  );
  const [otherResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO coin_ledger (
        user_id,
        type,
        amount,
        balance_after,
        source_type,
        source_id,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [otherUserId, 20, -88, 12, 30, 9003, '其他用户流水'],
  );

  return {
    token,
    userId,
    otherUserId,
    ledgerIds: [
      creditResult.insertId,
      rewardResult.insertId,
      fallbackResult.insertId,
      otherResult.insertId,
    ],
  };
}

async function cleanup(db: DbPool, state: SeedState | null) {
  if (!state) {
    return;
  }

  await db.execute('DELETE FROM coin_ledger WHERE id IN (?, ?, ?, ?)', state.ledgerIds);
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
      const { response, json } = await getJson(baseUrl, '/api/wallet/ledger', {
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });

      assert.equal(response.status, 200);
      const data = getEnvelopeData<WalletLedgerResult>(json);

      assert.equal(data.balance, 340, 'balance should use latest ledger balance_after');
      assert.equal(data.items.length, 3, 'should only return current user ledger rows');
      assert.ok(
        data.items.every((item) => item.userId === String(state.userId)),
        'foreign ledger rows must not leak into current user result',
      );

      assert.deepEqual(
        data.items.map((item) => item.type),
        ['adjust', 'reward', 'credit'],
      );
      assert.deepEqual(
        data.items.map((item) => item.amount),
        [-10, 50, 300],
      );
      assert.deepEqual(
        data.items.map((item) => item.balanceAfter),
        [340, 350, 300],
      );

      const latest = data.items[0];
      assert.ok(latest, 'latest item should exist');
      assert.equal(latest.type, 'adjust', 'unknown ledger code should fallback to adjust');
      assert.equal(latest.sourceType, '');
      assert.equal(latest.sourceId, '');
      assert.equal(latest.note, '');

      const reward = data.items.find((item) => item.type === 'reward');
      assert.ok(reward, 'reward item should exist');
      assert.equal(reward.sourceType, '20');
      assert.equal(reward.sourceId, '9002');
      assert.equal(reward.note, '竞猜奖励');
    });

    console.log('api-wallet-ledger.db: ok');
  } finally {
    await cleanup(db, state);
  }
}

void main().catch((error) => {
  console.error('api-wallet-ledger.db: failed');
  console.error(error);
  process.exitCode = 1;
});
