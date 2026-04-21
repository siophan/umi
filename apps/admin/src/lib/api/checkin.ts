import type {
  AdminCheckinRewardConfigItem,
  AdminCheckinRewardConfigListResult,
  AdminCheckinRewardConfigStatus,
  AdminCheckinRewardType,
  CreateAdminCheckinRewardConfigPayload,
  CreateAdminCheckinRewardConfigResult,
  UpdateAdminCheckinRewardConfigPayload,
  UpdateAdminCheckinRewardConfigResult,
  UpdateAdminCheckinRewardConfigStatusPayload,
  UpdateAdminCheckinRewardConfigStatusResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';

type FetchAdminCheckinRewardConfigsParams = {
  dayNo?: number;
  rewardType?: AdminCheckinRewardType;
  title?: string;
  status?: AdminCheckinRewardConfigStatus | 'all';
};

function buildQuery(params: FetchAdminCheckinRewardConfigsParams) {
  const searchParams = new URLSearchParams();
  if (params.dayNo != null && Number.isFinite(params.dayNo)) {
    searchParams.set('dayNo', String(params.dayNo));
  }
  if (params.rewardType) {
    searchParams.set('rewardType', params.rewardType);
  }
  if (params.title?.trim()) {
    searchParams.set('title', params.title.trim());
  }
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  return searchParams.toString();
}

export function fetchAdminCheckinRewardConfigs(
  params: FetchAdminCheckinRewardConfigsParams,
) {
  const query = buildQuery(params);
  return getJson<AdminCheckinRewardConfigListResult>(
    `/api/admin/checkin/rewards${query ? `?${query}` : ''}`,
  );
}

export function createAdminCheckinRewardConfig(
  payload: CreateAdminCheckinRewardConfigPayload,
) {
  return postJson<
    CreateAdminCheckinRewardConfigResult,
    CreateAdminCheckinRewardConfigPayload
  >('/api/admin/checkin/rewards', payload);
}

export function updateAdminCheckinRewardConfig(
  id: string,
  payload: UpdateAdminCheckinRewardConfigPayload,
) {
  return putJson<
    UpdateAdminCheckinRewardConfigResult,
    UpdateAdminCheckinRewardConfigPayload
  >(`/api/admin/checkin/rewards/${id}`, payload);
}

export function updateAdminCheckinRewardConfigStatus(
  id: string,
  payload: UpdateAdminCheckinRewardConfigStatusPayload,
) {
  return putJson<
    UpdateAdminCheckinRewardConfigStatusResult,
    UpdateAdminCheckinRewardConfigStatusPayload
  >(`/api/admin/checkin/rewards/${id}/status`, payload);
}

export type { AdminCheckinRewardConfigItem };
