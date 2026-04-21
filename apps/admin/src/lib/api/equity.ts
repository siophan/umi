import type {
  AdjustAdminEquityPayload,
  AdjustAdminEquityResult,
  AdminEquityDetailResult,
  AdminEquityListResult,
} from '@umi/shared';

import { getJson, postJson } from './shared';

type FetchAdminEquityAccountsParams = {
  page: number;
  pageSize: number;
  userId?: string;
  userName?: string;
  phone?: string;
};

function buildQuery(params: FetchAdminEquityAccountsParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', String(params.pageSize));
  if (params.userId?.trim()) {
    searchParams.set('userId', params.userId.trim());
  }
  if (params.userName?.trim()) {
    searchParams.set('userName', params.userName.trim());
  }
  if (params.phone?.trim()) {
    searchParams.set('phone', params.phone.trim());
  }
  return searchParams.toString();
}

export function fetchAdminEquityAccounts(params: FetchAdminEquityAccountsParams) {
  return getJson<AdminEquityListResult>(`/api/admin/equity?${buildQuery(params)}`);
}

export function fetchAdminEquityDetail(userId: string) {
  return getJson<AdminEquityDetailResult>(`/api/admin/equity/${userId}`);
}

export function adjustAdminEquity(payload: AdjustAdminEquityPayload) {
  return postJson<AdjustAdminEquityResult, AdjustAdminEquityPayload>(
    '/api/admin/equity/adjust',
    payload,
  );
}
