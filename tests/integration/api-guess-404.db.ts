import assert from 'node:assert/strict';

import { createApp } from '../../apps/api/src/app';
import { env } from '../../apps/api/src/env';
import { getJson, withServer } from '../smoke/helpers';

function assertDbConfigured() {
  assert.ok(env.dbHost, 'DB_HOST is required');
  assert.ok(env.dbUser, 'DB_USER is required');
  assert.ok(env.dbName, 'DB_NAME is required');
}

async function main() {
  assertDbConfigured();

  await withServer(createApp, async (baseUrl) => {
    const [detailResponse, statsResponse] = await Promise.all([
      getJson(baseUrl, '/api/guesses/999999999'),
      getJson(baseUrl, '/api/guesses/999999999/stats'),
    ]);

    assert.equal(detailResponse.response.status, 404);
    assert.equal(statsResponse.response.status, 404);
  });

  console.log('api-guess-404.db: ok');
}

void main().catch((error) => {
  console.error('api-guess-404.db: failed');
  console.error(error);
  process.exitCode = 1;
});
