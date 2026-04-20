import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import type { Express } from 'express';

export async function withServer<T>(
  createApp: () => Express,
  run: (baseUrl: string) => Promise<T>,
) {
  const app = createApp();
  const server = await new Promise<import('node:http').Server>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  assert(address && typeof address !== 'string', 'server failed to bind');

  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

export async function getJson(
  baseUrl: string,
  pathname: string,
  init?: RequestInit,
) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  return { response, json };
}
