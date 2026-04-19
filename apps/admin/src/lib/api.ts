import type {
  AdminLoginPayload,
  AdminLoginResult,
  AdminProfile,
  ApiEnvelope,
  ChangePasswordPayload,
  ChangePasswordResult,
  GuessListResult,
  LogoutResult,
  OrderListResult,
  WarehouseListResult,
} from '@joy/shared';

import type { AdminDashboardStats } from './admin-data';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'joy_admin_token';

export class ApiRequestError extends Error {
  status: number;
  path: string;

  constructor(path: string, status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.path = path;
  }
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function hasAuthToken() {
  return getAuthToken() !== '';
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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      signal: controller.signal,
      headers: getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : undefined,
    });

    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) {
      throw new ApiRequestError(
        path,
        response.status,
        payload.message || `请求失败: ${path}`,
      );
    }

    return payload.data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function fetchAdminDashboard() {
  return getJson<AdminDashboardStats>('/api/admin/dashboard/stats');
}

export function fetchAdminGuesses() {
  return getJson<GuessListResult>('/api/admin/guesses');
}

export function fetchAdminOrders() {
  return getJson<OrderListResult>('/api/admin/orders');
}

export function fetchWarehouseStats() {
  return getJson<{
    totalVirtual: number;
    totalPhysical: number;
  }>('/api/warehouse/admin/stats');
}

export function fetchAdminWarehouseItems(type: 'virtual' | 'physical') {
  return getJson<WarehouseListResult>(`/api/warehouse/admin/${type}`);
}

async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      signal: controller.signal,
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
      throw new ApiRequestError(
        path,
        response.status,
        data.message || `请求失败: ${path}`,
      );
    }

    return data.data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function fetchAdminUsers() {
  return getJson<{ items: import('@joy/shared').UserSummary[] }>('/api/admin/users');
}

export function fetchMe() {
  return getJson<AdminProfile>('/api/admin/auth/me');
}

export function login(payload: AdminLoginPayload) {
  return postJson<AdminLoginResult, AdminLoginPayload>(
    '/api/admin/auth/login',
    payload,
  );
}

export function changePassword(payload: ChangePasswordPayload) {
  return postJson<ChangePasswordResult, ChangePasswordPayload>(
    '/api/admin/auth/change-password',
    payload,
  );
}

export function logout() {
  return postJson<LogoutResult, Record<string, never>>('/api/admin/auth/logout', {});
}
