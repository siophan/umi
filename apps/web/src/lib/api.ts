import type {
  ApiEnvelope,
  GuessListResult,
  GuessSummary,
  LoginPayload,
  LoginResult,
  LogoutResult,
  OrderListResult,
  RegisterPayload,
  SendCodePayload,
  SendCodeResult,
  UpdateMePayload,
  UserPublicProfile,
  WalletLedgerResult,
  WarehouseListResult,
  UserSummary,
} from '@joy/shared';

import { apiBaseUrl } from './env';

const AUTH_TOKEN_KEY = 'joy_token';

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    headers: getAuthToken()
      ? {
          Authorization: `Bearer ${getAuthToken()}`,
        }
      : undefined,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.message || `Request failed: ${path}`);
  }

  return payload.data;
}

async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}

async function putJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
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
  return postJson<LoginResult, LoginPayload>('/api/auth/login', payload);
}

export async function sendCode(payload: SendCodePayload) {
  return postJson<SendCodeResult, SendCodePayload>('/api/auth/send-code', payload);
}

export async function register(payload: RegisterPayload) {
  return postJson<LoginResult, RegisterPayload>('/api/auth/register', payload);
}

export async function fetchMe() {
  return getJson<UserSummary>('/api/auth/me');
}

export async function logout() {
  return postJson<LogoutResult, Record<string, never>>('/api/auth/logout', {});
}

export async function updateMe(payload: UpdateMePayload) {
  return putJson<UserSummary, UpdateMePayload>('/api/auth/me', payload);
}

export async function fetchUserProfile(userId: string) {
  return getJson<UserPublicProfile>(`/api/auth/users/${userId}`);
}
