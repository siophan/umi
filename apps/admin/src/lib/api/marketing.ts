import type {
  AdminBannerDisplayStatus,
  AdminBannerItem,
  AdminCouponGrantBatchListResult,
  AdminCouponListResult,
  CreateAdminBannerPayload,
  CreateAdminBannerResult,
  CreateAdminCouponGrantBatchPayload,
  CreateAdminCouponGrantBatchResult,
  CreateAdminCouponTemplatePayload,
  CreateAdminCouponTemplateResult,
  DeleteAdminBannerResult,
  UpdateAdminBannerPayload,
  UpdateAdminBannerResult,
  UpdateAdminBannerStatusPayload,
  UpdateAdminBannerStatusResult,
  UpdateAdminCouponTemplatePayload,
  UpdateAdminCouponTemplateResult,
  UpdateAdminCouponTemplateStatusPayload,
  UpdateAdminCouponTemplateStatusResult,
} from '@umi/shared';

import { deleteJson, getJson, postJson, putJson } from './shared';

type AdminBannerListResult = {
  items: AdminBannerItem[];
  summary: {
    total: number;
    active: number;
    scheduled: number;
    paused: number;
    ended: number;
  };
};

type FetchAdminBannersParams = {
  title?: string;
  position?: string;
  targetType?: CreateAdminBannerPayload['targetType'];
  status?: AdminBannerDisplayStatus | 'all';
};

function buildQuery(params: FetchAdminBannersParams) {
  const searchParams = new URLSearchParams();
  if (params.title?.trim()) {
    searchParams.set('title', params.title.trim());
  }
  if (params.position?.trim()) {
    searchParams.set('position', params.position.trim());
  }
  if (params.targetType) {
    searchParams.set('targetType', params.targetType);
  }
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  return searchParams.toString();
}

export function fetchAdminBanners(params: FetchAdminBannersParams) {
  const query = buildQuery(params);
  return getJson<AdminBannerListResult>(`/api/admin/banners${query ? `?${query}` : ''}`);
}

export function createAdminBanner(payload: CreateAdminBannerPayload) {
  return postJson<CreateAdminBannerResult, CreateAdminBannerPayload>(
    '/api/admin/banners',
    payload,
  );
}

export function updateAdminBanner(id: string, payload: UpdateAdminBannerPayload) {
  return putJson<UpdateAdminBannerResult, UpdateAdminBannerPayload>(
    `/api/admin/banners/${id}`,
    payload,
  );
}

export function updateAdminBannerStatus(
  id: string,
  payload: UpdateAdminBannerStatusPayload,
) {
  return putJson<UpdateAdminBannerStatusResult, UpdateAdminBannerStatusPayload>(
    `/api/admin/banners/${id}/status`,
    payload,
  );
}

export function deleteAdminBanner(id: string) {
  return deleteJson<DeleteAdminBannerResult>(`/api/admin/banners/${id}`);
}

type FetchAdminCouponsParams = {
  name?: string;
  code?: string;
  type?: CreateAdminCouponTemplatePayload['type'];
  scopeType?: CreateAdminCouponTemplatePayload['scopeType'];
  status?: AdminCouponListResult['items'][number]['status'] | 'all';
};

function buildCouponQuery(params: FetchAdminCouponsParams) {
  const searchParams = new URLSearchParams();
  if (params.name?.trim()) {
    searchParams.set('name', params.name.trim());
  }
  if (params.code?.trim()) {
    searchParams.set('code', params.code.trim());
  }
  if (params.type) {
    searchParams.set('type', params.type);
  }
  if (params.scopeType) {
    searchParams.set('scopeType', params.scopeType);
  }
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  return searchParams.toString();
}

export function fetchAdminCoupons(params: FetchAdminCouponsParams) {
  const query = buildCouponQuery(params);
  return getJson<AdminCouponListResult>(`/api/admin/coupons${query ? `?${query}` : ''}`);
}

export function fetchAdminCouponGrantBatches(id: string) {
  return getJson<AdminCouponGrantBatchListResult>(`/api/admin/coupons/${id}/batches`);
}

export function createAdminCouponTemplate(payload: CreateAdminCouponTemplatePayload) {
  return postJson<CreateAdminCouponTemplateResult, CreateAdminCouponTemplatePayload>(
    '/api/admin/coupons',
    payload,
  );
}

export function updateAdminCouponTemplate(
  id: string,
  payload: UpdateAdminCouponTemplatePayload,
) {
  return putJson<UpdateAdminCouponTemplateResult, UpdateAdminCouponTemplatePayload>(
    `/api/admin/coupons/${id}`,
    payload,
  );
}

export function updateAdminCouponTemplateStatus(
  id: string,
  payload: UpdateAdminCouponTemplateStatusPayload,
) {
  return putJson<
    UpdateAdminCouponTemplateStatusResult,
    UpdateAdminCouponTemplateStatusPayload
  >(`/api/admin/coupons/${id}/status`, payload);
}

export function createAdminCouponGrantBatch(
  id: string,
  payload: CreateAdminCouponGrantBatchPayload,
) {
  return postJson<CreateAdminCouponGrantBatchResult, CreateAdminCouponGrantBatchPayload>(
    `/api/admin/coupons/${id}/grants`,
    payload,
  );
}
