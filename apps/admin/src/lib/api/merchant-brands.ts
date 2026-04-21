import type {
  CreateAdminBrandPayload,
  CreateAdminBrandResult,
  RevokeAdminBrandAuthRecordResult,
  ReviewAdminBrandAuthApplyPayload,
  ReviewAdminBrandAuthApplyResult,
  UpdateAdminBrandPayload,
  UpdateAdminBrandResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';
import type {
  AdminBrandAuthApplyItem,
  AdminBrandAuthRecordItem,
  AdminBrandItem,
  SummaryListResult,
} from './merchant-shared';

export function fetchAdminBrands() {
  return getJson<
    SummaryListResult<AdminBrandItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands');
}

export function createAdminBrand(payload: CreateAdminBrandPayload) {
  return postJson<CreateAdminBrandResult, CreateAdminBrandPayload>('/api/admin/brands', payload);
}

export function updateAdminBrand(id: string, payload: UpdateAdminBrandPayload) {
  return putJson<UpdateAdminBrandResult, UpdateAdminBrandPayload>(
    `/api/admin/brands/${id}`,
    payload,
  );
}

export function fetchAdminBrandAuthApplies() {
  return getJson<
    SummaryListResult<AdminBrandAuthApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands/auth-applies');
}

export function reviewAdminBrandAuthApply(
  id: string,
  payload: ReviewAdminBrandAuthApplyPayload,
) {
  return putJson<ReviewAdminBrandAuthApplyResult, ReviewAdminBrandAuthApplyPayload>(
    `/api/admin/brands/auth-applies/${id}/review`,
    payload,
  );
}

export function fetchAdminBrandAuthRecords() {
  return getJson<
    SummaryListResult<
      AdminBrandAuthRecordItem,
      { total: number; byStatus: Record<string, number>; byScope: Record<string, number> }
    >
  >('/api/admin/brands/auth-records');
}

export function revokeAdminBrandAuthRecord(id: string) {
  return putJson<RevokeAdminBrandAuthRecordResult, Record<string, never>>(
    `/api/admin/brands/auth-records/${id}/revoke`,
    {},
  );
}
