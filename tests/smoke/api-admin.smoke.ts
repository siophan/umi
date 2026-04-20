import assert from 'node:assert/strict';

import type {
  ApiEnvelope,
  GuessListResult,
  OrderListResult,
  UserSummary,
} from '@umi/shared';

import { createApp } from '../../apps/api/src/app';
import { getJson, withServer } from './helpers';

type DashboardStats = {
  users: number;
  activeGuesses: number;
  orders: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getEnvelopeData<T>(json: unknown): T {
  assert(isRecord(json), 'response must be an object');
  assert.equal(json.success, true, 'response.success must be true');
  assert.ok('data' in json, 'response.data must exist');
  return json.data as T;
}

async function main() {
  await withServer(createApp, async (baseUrl) => {
    const adminOrigin = 'http://localhost:3000';

    const [statsResult, usersResult, guessesResult, ordersResult] =
      await Promise.all([
        getJson(baseUrl, '/api/admin/dashboard/stats', {
          headers: { Origin: adminOrigin },
        }),
        getJson(baseUrl, '/api/admin/users'),
        getJson(baseUrl, '/api/admin/guesses'),
        getJson(baseUrl, '/api/admin/orders'),
      ]);

    assert.equal(statsResult.response.status, 200);
    assert.equal(
      statsResult.response.headers.get('access-control-allow-origin'),
      adminOrigin,
    );
    assert.equal(usersResult.response.status, 200);
    assert.equal(guessesResult.response.status, 200);
    assert.equal(ordersResult.response.status, 200);

    const stats = getEnvelopeData<DashboardStats>(statsResult.json);
    const users = getEnvelopeData<{ items: UserSummary[] }>(usersResult.json);
    const guesses = getEnvelopeData<GuessListResult>(guessesResult.json);
    const orders = getEnvelopeData<OrderListResult>(ordersResult.json);

    assert.equal(stats.users, 1);
    assert.equal(stats.activeGuesses, guesses.items.length);
    assert.equal(stats.orders, orders.items.length);

    assert.ok(users.items.length >= 2, 'admin user list should include demo users');
    assert.ok(
      users.items.some((user) => user.role === 'admin'),
      'admin user list should include an admin role',
    );
    assert.ok(
      users.items.some((user) => user.role === 'user'),
      'admin user list should include a normal user role',
    );

    assert.ok(guesses.items.length > 0, 'admin guesses should not be empty');
    for (const guess of guesses.items) {
      assert.ok(guess.id, 'guess.id is required');
      assert.ok(guess.title, 'guess.title is required');
      assert.ok(guess.options.length >= 2, 'guess should expose at least 2 options');
      assert.ok(guess.product.id, 'guess.product.id is required');
      assert.ok(typeof guess.product.price === 'number', 'guess.product.price must be a number');
      for (const option of guess.options) {
        assert.ok(typeof option.voteCount === 'number', 'guess option voteCount must be a number');
      }
    }

    const userIds = new Set(users.items.map((user) => user.id));
    const guessIds = new Set(guesses.items.map((guess) => guess.id));

    assert.ok(orders.items.length > 0, 'admin orders should not be empty');
    for (const order of orders.items) {
      assert.ok(order.id, 'order.id is required');
      assert.ok(userIds.has(order.userId), 'order.userId should resolve to admin user list');
      if (order.guessId) {
        assert.ok(
          guessIds.has(order.guessId),
          'order.guessId should resolve to admin guess list',
        );
      }
      assert.ok(typeof order.amount === 'number', 'order.amount must be a number');
      assert.ok(Array.isArray(order.items), 'order.items must be an array');
      assert.ok(order.items.length > 0, 'order.items should not be empty');
      for (const item of order.items) {
        assert.ok(item.productId, 'order item productId is required');
        assert.ok(item.productName, 'order item productName is required');
        assert.ok(typeof item.unitPrice === 'number', 'order item unitPrice must be a number');
      }
    }
  });

  console.log('api-admin.smoke: ok');
}

void main().catch((error) => {
  console.error('api-admin.smoke: failed');
  console.error(error);
  process.exitCode = 1;
});
