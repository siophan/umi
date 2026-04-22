import type {
  AdminShopDetailResult,
  ReviewAdminShopApplyPayload,
  ReviewAdminShopApplyResult,
  UpdateAdminShopProductStatusPayload,
  UpdateAdminShopProductStatusResult,
  UpdateAdminShopStatusPayload,
  UpdateAdminShopStatusResult,
} from '@umi/shared';

import { getJson, putJson } from './shared';
import type {
  AdminShopApplyItem,
  AdminShopItem,
  AdminShopProductItem,
  PaginatedSummaryListResult,
  SummaryListResult,
} from './merchant-shared';

export function fetchAdminShops() {
  return getJson<
    SummaryListResult<AdminShopItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops');
}

export function fetchAdminShopDetail(id: string) {
  return getJson<AdminShopDetailResult>(`/api/admin/shops/${id}`);
}

export function updateAdminShopStatus(id: string, payload: UpdateAdminShopStatusPayload) {
  return putJson<UpdateAdminShopStatusResult, UpdateAdminShopStatusPayload>(
    `/api/admin/shops/${id}/status`,
    payload,
  );
}

export function fetchAdminShopApplies() {
  return getJson<
    SummaryListResult<AdminShopApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops/applies');
}

export function reviewAdminShopApply(id: string, payload: ReviewAdminShopApplyPayload) {
  return putJson<ReviewAdminShopApplyResult, ReviewAdminShopApplyPayload>(
    `/api/admin/shops/applies/${id}/review`,
    payload,
  );
}

export function fetchAdminShopProducts(
  query: {
    page?: number;
    pageSize?: number;
    shopName?: string;
    productName?: string;
    brandName?: string;
    status?: 'all' | AdminShopProductItem['status'];
  } = {},
) {
  const searchParams = new URLSearchParams();
  if (query.page != null) searchParams.set('page', String(query.page));
  if (query.pageSize != null) searchParams.set('pageSize', String(query.pageSize));
  if (query.shopName) searchParams.set('shopName', query.shopName.trim());
  if (query.productName) searchParams.set('productName', query.productName.trim());
  if (query.brandName) searchParams.set('brandName', query.brandName.trim());
  if (query.status) searchParams.set('status', query.status);
  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  return getJson<
    PaginatedSummaryListResult<AdminShopProductItem, { total: number; byStatus: Record<string, number> }>
  >(`/api/admin/shops/products${suffix}`);
}

export function updateAdminShopProductStatus(
  id: string,
  payload: UpdateAdminShopProductStatusPayload,
) {
  return putJson<UpdateAdminShopProductStatusResult, UpdateAdminShopProductStatusPayload>(
    `/api/admin/shops/products/${id}/status`,
    payload,
  );
}
