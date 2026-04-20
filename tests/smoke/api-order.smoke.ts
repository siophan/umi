import assert from 'node:assert/strict';

import { createApp } from '../../apps/api/src/app';
import { withServer, getJson } from './helpers';

async function main() {
  await withServer(createApp, async (baseUrl) => {
    {
      const { response, json } = await getJson(baseUrl, '/api/orders');
      assert.equal(response.status, 401);
      assert.deepEqual(json, {
        success: false,
        message: '请先登录',
      });
    }

    {
      const { response, json } = await getJson(baseUrl, '/api/orders/123');
      assert.equal(response.status, 401);
      assert.deepEqual(json, {
        success: false,
        message: '请先登录',
      });
    }

    {
      const { response } = await getJson(baseUrl, '/api/orders', {
        method: 'OPTIONS',
      });
      assert.equal(response.status, 204);
      assert.equal(
        response.headers.get('access-control-allow-methods'),
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
    }
  });

  console.log('api-order.smoke: ok');
}

void main().catch((error) => {
  console.error('api-order.smoke: failed');
  console.error(error);
  process.exitCode = 1;
});
