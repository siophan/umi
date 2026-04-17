import type {
  ApiEnvelope,
  GuessListResult,
  OrderListResult,
  UserSummary,
} from '@joy/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function fetchAdminDashboard() {
  return getJson<{
    users: number;
    activeGuesses: number;
    orders: number;
  }>('/api/admin/dashboard/stats');
}

export function fetchAdminUsers() {
  return getJson<{ items: UserSummary[] }>('/api/admin/users');
}

export function fetchAdminGuesses() {
  return getJson<GuessListResult>('/api/admin/guesses');
}

export function fetchAdminOrders() {
  return getJson<OrderListResult>('/api/admin/orders');
}
