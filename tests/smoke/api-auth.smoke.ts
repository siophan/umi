import assert from 'node:assert/strict';

import { createApp } from '../../apps/api/src/app';
import { withServer, getJson } from './helpers';

async function main() {
  await withServer(createApp, async (baseUrl) => {
    {
      const { response, json } = await getJson(baseUrl, '/health');
      assert.equal(response.status, 200);
      assert.equal((json as { ok?: boolean }).ok, true);
      assert.equal((json as { service?: string }).service, 'api');
      assert.equal(
        typeof (json as { timestamp?: string }).timestamp,
        'string',
      );
    }

    {
      const { response, json } = await getJson(baseUrl, '/openapi.json');
      assert.equal(response.status, 200);
      assert.equal((json as { openapi?: string }).openapi, '3.0.3');
    }

    {
      const { response, json } = await getJson(baseUrl, '/api/auth/me');
      assert.equal(response.status, 401);
      assert.deepEqual(json, {
        success: false,
        message: '请先登录',
      });
    }

    {
      const { response, json } = await getJson(baseUrl, '/__missing__');
      assert.equal(response.status, 404);
      assert.deepEqual(json, {
        success: false,
        message: 'Route not found',
      });
    }
  });

  console.log('api-auth.smoke: ok');
}

void main().catch((error) => {
  console.error('api-auth.smoke: failed');
  console.error(error);
  process.exitCode = 1;
});
