import type {
  AdminUserGuessListResult,
  AdminUserListQuery,
  AdminUserOrderListResult,
  UpdateUserBanPayload,
  UpdateUserBanResult,
  UserListResult,
  UserSummary,
} from '@umi/shared';

import { getJson, putJson } from './shared';

export function fetchAdminUsers() {
  return fetchAdminUsersPage();
}

export function fetchAdminUsersPage(query: AdminUserListQuery = {}) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  if (query.keyword?.trim()) {
    search.set('keyword', query.keyword.trim());
  }
  if (query.phone?.trim()) {
    search.set('phone', query.phone.trim());
  }
  if (query.shopName?.trim()) {
    search.set('shopName', query.shopName.trim());
  }
  if (query.role && query.role !== 'all') {
    search.set('role', query.role);
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<UserListResult>(`/api/admin/users${suffix}`);
}

export function fetchAdminUserDetail(userId: string) {
  return getJson<UserSummary>(`/api/admin/users/${userId}`);
}

export function fetchAdminUserOrders(
  userId: string,
  query: { page?: number; pageSize?: number } = {},
) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<AdminUserOrderListResult>(`/api/admin/users/${userId}/orders${suffix}`);
}

export function fetchAdminUserGuesses(
  userId: string,
  query: { page?: number; pageSize?: number } = {},
) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<AdminUserGuessListResult>(`/api/admin/users/${userId}/guesses${suffix}`);
}

export function updateAdminUserBan(userId: string, payload: UpdateUserBanPayload) {
  return putJson<UpdateUserBanResult, UpdateUserBanPayload>(
    `/api/admin/users/${userId}/ban`,
    payload,
  );
}
