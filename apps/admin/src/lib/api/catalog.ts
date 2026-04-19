import type { GuessListResult, WarehouseListResult } from '@joy/shared';

import type {
  AdminBrandLibraryItem,
  AdminCategoryItem,
  AdminFriendGuessItem,
  AdminPkMatchItem,
  AdminProduct,
  AdminWarehouseStats,
} from '../admin-data';
import { getJson } from './shared';

type PaginatedListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
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

export function fetchAdminCategories() {
  return getJson<AdminCategoryListResult>('/api/admin/categories');
}

export function fetchAdminGuesses() {
  return getJson<GuessListResult>('/api/admin/guesses');
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

export function fetchWarehouseStats() {
  return getJson<AdminWarehouseStats>('/api/warehouse/admin/stats');
}

export function fetchAdminWarehouseItems(type: 'virtual' | 'physical') {
  return getJson<WarehouseListResult>(`/api/warehouse/admin/${type}`);
}
