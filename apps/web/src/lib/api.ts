import type {
  ApiEnvelope,
  GuessListResult,
  GuessSummary,
  LoginPayload,
  LoginResult,
  OrderListResult,
  WalletLedgerResult,
  WarehouseListResult,
} from '@joy/shared';

import { apiBaseUrl } from './env';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function fetchGuessList() {
  return getJson<GuessListResult>('/api/guesses');
}

export function fetchGuess(id: string) {
  return getJson<GuessSummary>(`/api/guesses/${id}`);
}

export function fetchOrders() {
  return getJson<OrderListResult>('/api/orders');
}

export function fetchWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/virtual');
}

export function fetchWalletLedger() {
  return getJson<WalletLedgerResult>('/api/wallet/ledger');
}

export async function login(payload: LoginPayload) {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = (await response.json()) as ApiEnvelope<LoginResult>;
  return data.data;
}
