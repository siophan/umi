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

export function fetchAdminShopProducts() {
  return getJson<
    SummaryListResult<AdminShopProductItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops/products');
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
