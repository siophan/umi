import type { ApiEnvelope } from '@umi/shared';

import { apiBaseUrl } from '../env';

const AUTH_TOKEN_KEY = 'umi_token';
export const AUTH_CHANGE_EVENT = 'umi-auth-change';

function dispatchAuthChange() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

function getAuthHeaders(headers?: Record<string, string>) {
  const token = getAuthToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  dispatchAuthChange();
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  dispatchAuthChange();
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.message || `Request failed: ${path}`);
  }

  return payload.data;
}

export async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}

export async function putJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}

export async function deleteJson<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}
