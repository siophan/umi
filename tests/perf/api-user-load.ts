import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import type { Express } from 'express';

type Endpoint = {
  name: string;
  path: string;
  headers?: Record<string, string>;
};

type EndpointStats = {
  requests: number;
  failures: number;
  statuses: Map<number, number>;
  latencies: number[];
};

type RunStats = {
  requests: number;
  failures: number;
  networkErrors: number;
  latencies: number[];
  byEndpoint: Map<string, EndpointStats>;
};

function readNumberEnv(name: string, fallback: number) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function percentile(values: number[], target: number) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((target / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pickEndpoint(endpoints: Endpoint[], index: number) {
  return endpoints[index % endpoints.length]!;
}

function createScenarioEndpoints() {
  const authToken = process.env.LOAD_AUTH_TOKEN?.trim();
  const scenario = process.env.LOAD_SCENARIO?.trim() || 'public';

  const publicEndpoints: Endpoint[] = [
    { name: 'health', path: '/health' },
    { name: 'openapi', path: '/openapi.json' },
    { name: 'guesses', path: '/api/guesses' },
    { name: 'products', path: '/api/products?limit=20' },
  ];

  if (scenario === 'public') {
    return { scenario, endpoints: publicEndpoints };
  }

  assert.ok(authToken, 'LOAD_AUTH_TOKEN is required for non-public scenarios');

  const authHeaders = { Authorization: `Bearer ${authToken}` };
  if (scenario === 'user') {
    return {
      scenario,
      endpoints: [
        ...publicEndpoints,
        { name: 'me', path: '/api/auth/me', headers: authHeaders },
        { name: 'orders', path: '/api/orders', headers: authHeaders },
        { name: 'wallet', path: '/api/wallet/ledger', headers: authHeaders },
        { name: 'virtual-warehouse', path: '/api/warehouse/virtual', headers: authHeaders },
        { name: 'physical-warehouse', path: '/api/warehouse/physical', headers: authHeaders },
      ],
    };
  }

  throw new Error(`Unsupported LOAD_SCENARIO: ${scenario}`);
}

async function startServer(appFactory: () => Express) {
  const app = appFactory();
  const server = await new Promise<import('node:http').Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const address = server.address();
  assert(address && typeof address !== 'string', 'server failed to bind');

  return {
    server,
    baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`,
  };
}

async function stopServer(server: import('node:http').Server) {
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

function getEndpointStats(stats: RunStats, endpointName: string) {
  const existing = stats.byEndpoint.get(endpointName);
  if (existing) {
    return existing;
  }

  const created: EndpointStats = {
    requests: 0,
    failures: 0,
    statuses: new Map<number, number>(),
    latencies: [],
  };
  stats.byEndpoint.set(endpointName, created);
  return created;
}

async function requestOnce(
  baseUrl: string,
  endpoint: Endpoint,
  timeoutMs: number,
  stats: RunStats,
) {
  const endpointStats = getEndpointStats(stats, endpoint.name);
  const startedAt = performance.now();
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: 'GET',
      headers: endpoint.headers,
      signal: abortController.signal,
    });
    await response.arrayBuffer();

    const latency = performance.now() - startedAt;
    stats.requests += 1;
    stats.latencies.push(latency);
    endpointStats.requests += 1;
    endpointStats.latencies.push(latency);
    endpointStats.statuses.set(
      response.status,
      (endpointStats.statuses.get(response.status) ?? 0) + 1,
    );

    if (!response.ok) {
      stats.failures += 1;
      endpointStats.failures += 1;
    }
  } catch {
    const latency = performance.now() - startedAt;
    stats.requests += 1;
    stats.failures += 1;
    stats.networkErrors += 1;
    stats.latencies.push(latency);
    endpointStats.requests += 1;
    endpointStats.failures += 1;
    endpointStats.latencies.push(latency);
    endpointStats.statuses.set(0, (endpointStats.statuses.get(0) ?? 0) + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function runLoad(
  baseUrl: string,
  endpoints: Endpoint[],
  durationMs: number,
  concurrency: number,
  timeoutMs: number,
) {
  const stats: RunStats = {
    requests: 0,
    failures: 0,
    networkErrors: 0,
    latencies: [],
    byEndpoint: new Map<string, EndpointStats>(),
  };

  const startedAt = Date.now();
  const stopAt = startedAt + durationMs;
  let requestIndex = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() < stopAt) {
      const endpoint = pickEndpoint(endpoints, requestIndex);
      requestIndex += 1;
      await requestOnce(baseUrl, endpoint, timeoutMs, stats);
    }
  });

  await Promise.all(workers);
  return stats;
}

function printReport(
  baseUrl: string,
  scenario: string,
  durationMs: number,
  concurrency: number,
  timeoutMs: number,
  stats: RunStats,
) {
  const durationSeconds = durationMs / 1000;
  const rps = durationSeconds > 0 ? stats.requests / durationSeconds : 0;

  console.log('');
  console.log('=== User API Load Report ===');
  console.log(`Scenario: ${scenario}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Duration: ${durationMs} ms`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Timeout: ${timeoutMs} ms`);
  console.log(`Requests: ${stats.requests}`);
  console.log(`Failures: ${stats.failures}`);
  console.log(`Network Errors: ${stats.networkErrors}`);
  console.log(`RPS: ${rps.toFixed(2)}`);
  console.log(`Avg: ${average(stats.latencies).toFixed(2)} ms`);
  console.log(`P50: ${percentile(stats.latencies, 50).toFixed(2)} ms`);
  console.log(`P95: ${percentile(stats.latencies, 95).toFixed(2)} ms`);
  console.log(`P99: ${percentile(stats.latencies, 99).toFixed(2)} ms`);
  console.log('');
  console.log('Per Endpoint');
  console.log('name\trequests\tfailures\tavg_ms\tp95_ms\tstatuses');

  for (const [name, endpointStats] of stats.byEndpoint.entries()) {
    const statusText = Array.from(endpointStats.statuses.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([status, count]) => `${status}:${count}`)
      .join(',');

    console.log(
      [
        name,
        endpointStats.requests,
        endpointStats.failures,
        average(endpointStats.latencies).toFixed(2),
        percentile(endpointStats.latencies, 95).toFixed(2),
        statusText || '-',
      ].join('\t'),
    );
  }
}

async function main() {
  const durationMs = readNumberEnv('LOAD_DURATION_MS', 15000);
  const concurrency = readNumberEnv('LOAD_CONCURRENCY', 20);
  const timeoutMs = readNumberEnv('LOAD_TIMEOUT_MS', 10000);
  const externalBaseUrl = process.env.LOAD_BASE_URL?.trim();
  const { scenario, endpoints } = createScenarioEndpoints();

  let baseUrl = externalBaseUrl || '';
  let server: import('node:http').Server | null = null;

  try {
    if (!baseUrl) {
      process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
      const { createApp } = await import('../../apps/api/src/app');
      const local = await startServer(createApp);
      server = local.server;
      baseUrl = local.baseUrl;
    }

    const stats = await runLoad(
      baseUrl,
      endpoints,
      durationMs,
      concurrency,
      timeoutMs,
    );

    printReport(
      baseUrl,
      scenario,
      durationMs,
      concurrency,
      timeoutMs,
      stats,
    );

    if (stats.failures > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      await stopServer(server);
    }
  }
}

void main().catch((error) => {
  console.error('api-user-load: failed');
  console.error(error);
  process.exitCode = 1;
});
