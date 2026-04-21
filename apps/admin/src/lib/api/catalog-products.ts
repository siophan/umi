import type {
  CreateAdminBrandProductPayload,
  CreateAdminBrandProductResult,
  UpdateAdminBrandProductPayload,
  UpdateAdminBrandProductResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';
import type {
  AdminBrandLibraryItem,
  AdminProduct,
  PaginatedListResult,
} from './catalog-shared';

export function fetchAdminProducts(
  query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: 'all' | 'active' | 'low_stock' | 'paused' | 'off_shelf' | 'disabled';
  } = {},
) {
  const search = new URLSearchParams();
  if (query.page != null) search.set('page', String(query.page));
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize));
  if (query.keyword) search.set('keyword', query.keyword.trim());
  if (query.status) search.set('status', query.status);
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<PaginatedListResult<AdminProduct>>(`/api/admin/products${suffix}`);
}

export function fetchAdminBrandLibrary(
  query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: 'all' | 'active' | 'disabled';
    brandId?: string;
    categoryId?: string;
  } = {},
) {
  const search = new URLSearchParams();
  if (query.page != null) search.set('page', String(query.page));
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize));
  if (query.keyword) search.set('keyword', query.keyword.trim());
  if (query.status) search.set('status', query.status);
  if (query.brandId) search.set('brandId', query.brandId);
  if (query.categoryId) search.set('categoryId', query.categoryId);
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<PaginatedListResult<AdminBrandLibraryItem>>(
    `/api/admin/products/brand-library${suffix}`,
  );
}

export function createAdminBrandProduct(payload: CreateAdminBrandProductPayload) {
  return postJson<CreateAdminBrandProductResult, CreateAdminBrandProductPayload>(
    '/api/admin/products/brand-library',
    payload,
  );
}

export function updateAdminBrandProduct(id: string, payload: UpdateAdminBrandProductPayload) {
  return putJson<UpdateAdminBrandProductResult, UpdateAdminBrandProductPayload>(
    `/api/admin/products/brand-library/${id}`,
    payload,
  );
}
