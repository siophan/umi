import type {
  AdminUserGuessListResult,
  AdminUserListQuery,
  AdminLoginPayload,
  AdminLoginResult,
  AdminProfile,
  AdminUserOrderListResult,
  ApiEnvelope,
  ChangePasswordPayload,
  ChangePasswordResult,
  GuessListResult,
  LogoutResult,
  OrderListResult,
  UpdateUserBanPayload,
  UpdateUserBanResult,
  UserListResult,
  UserSummary,
  WarehouseListResult,
} from '@joy/shared';

import type {
  AdminBrandApplyItem,
  AdminBrandAuthApplyItem,
  AdminBrandAuthRecordItem,
  AdminBrandItem,
  AdminBrandLibraryItem,
  AdminCategoryItem,
  AdminChatItem,
  AdminConsignRow,
  AdminDashboardStats,
  AdminFriendGuessItem,
  AdminLogisticsRow,
  AdminNotificationItem,
  AdminPermissionMatrixData,
  AdminPkMatchItem,
  AdminProduct,
  AdminProductAuthItem,
  AdminProductAuthRecordItem,
  AdminRoleListItem,
  AdminShopApplyItem,
  AdminShopItem,
  AdminShopProductItem,
  AdminSystemUserItem,
  AdminTransactionRow,
} from './admin-data';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'joy_admin_token';
const REQUEST_TIMEOUT_MS = 8000;

type PaginatedListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type SummaryListResult<TItem, TSummary> = {
  items: TItem[];
  summary: TSummary;
};

type AdminNotificationListResult = {
  items: AdminNotificationItem[];
  summary: {
    total: number;
    sent: number;
    read: number;
    unread: number;
  };
  basis: string;
};

type AdminChatListResult = {
  items: AdminChatItem[];
  summary: {
    total: number;
    review: number;
    escalated: number;
    highRisk: number;
  };
  basis: string;
};

type AdminSystemUserListResult = {
  items: AdminSystemUserItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
  };
};

type AdminRoleListResult = {
  items: AdminRoleListItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    members: number;
  };
};

type AdminCategoryListResult = {
  items: AdminCategoryItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    byBizType: Record<string, number>;
  };
};

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

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
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
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiRequestError(path, 408, '请求超时，请稍后重试');
    }
    throw error;
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

export function fetchAdminProducts(query: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<PaginatedListResult<AdminProduct>>(`/api/admin/products${suffix}`);
}

export function fetchAdminBrandLibrary(query: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<PaginatedListResult<AdminBrandLibraryItem>>(
    `/api/admin/products/brand-library${suffix}`,
  );
}

export function fetchAdminFriendGuesses() {
  return getJson<{ items: AdminFriendGuessItem[] }>('/api/admin/guesses/friends');
}

export function fetchAdminPkMatches() {
  return getJson<{ items: AdminPkMatchItem[] }>('/api/admin/pk');
}

export function fetchAdminTransactions() {
  return getJson<{ items: AdminTransactionRow[] }>('/api/admin/orders/transactions');
}

export function fetchAdminLogistics() {
  return getJson<{ items: AdminLogisticsRow[] }>('/api/admin/orders/logistics');
}

export function fetchAdminConsignRows() {
  return getJson<{ items: AdminConsignRow[] }>('/api/admin/orders/consign');
}

export function fetchAdminShops() {
  return getJson<
    SummaryListResult<AdminShopItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops');
}

export function fetchAdminShopApplies() {
  return getJson<
    SummaryListResult<AdminShopApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops/applies');
}

export function fetchAdminBrands() {
  return getJson<
    SummaryListResult<AdminBrandItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands');
}

export function fetchAdminBrandApplies() {
  return getJson<
    SummaryListResult<AdminBrandApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands/applies');
}

export function fetchAdminBrandAuthApplies() {
  return getJson<
    SummaryListResult<
      AdminBrandAuthApplyItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/brands/auth-applies');
}

export function fetchAdminBrandAuthRecords() {
  return getJson<
    SummaryListResult<
      AdminBrandAuthRecordItem,
      { total: number; byStatus: Record<string, number>; byScope: Record<string, number> }
    >
  >('/api/admin/brands/auth-records');
}

export function fetchAdminShopProducts() {
  return getJson<
    SummaryListResult<
      AdminShopProductItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/shops/products');
}

export function fetchAdminProductAuthRows() {
  return getJson<
    SummaryListResult<
      AdminProductAuthItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/product-auth');
}

export function fetchAdminProductAuthRecords() {
  return getJson<
    SummaryListResult<
      AdminProductAuthRecordItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/product-auth/records');
}

export function fetchAdminNotifications() {
  return getJson<AdminNotificationListResult>('/api/admin/notifications');
}

export function fetchAdminChats() {
  return getJson<AdminChatListResult>('/api/admin/chats');
}

export function fetchAdminSystemUsers() {
  return getJson<AdminSystemUserListResult>('/api/admin/system-users');
}

export function fetchAdminRoles() {
  return getJson<AdminRoleListResult>('/api/admin/roles');
}

export function fetchAdminPermissionsMatrix() {
  return getJson<AdminPermissionMatrixData>('/api/admin/permissions/matrix');
}

export function fetchAdminCategories() {
  return getJson<AdminCategoryListResult>('/api/admin/categories');
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
  return sendJson('POST', path, payload);
}

async function putJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  return sendJson('PUT', path, payload);
}

async function sendJson<TResponse, TPayload>(
  method: 'POST' | 'PUT',
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
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
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiRequestError(path, 408, '请求超时，请稍后重试');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

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
