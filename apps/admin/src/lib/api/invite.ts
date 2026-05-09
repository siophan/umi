import type {
  AdminInviteRecordListResult,
  AdminInviteRewardConfigItem,
  AdminInviteRewardConfigItemResult,
  AdminInviteRewardConfigListResult,
  CreateAdminInviteRewardConfigPayload,
  UpdateAdminInviteRewardConfigPayload,
} from '@umi/shared';

import { deleteJson, getJson, postJson, putJson } from './shared';

type FetchAdminInviteRecordsParams = {
  inviter?: string;
  invitee?: string;
  inviteCode?: string;
};

function buildQuery(params: FetchAdminInviteRecordsParams) {
  const searchParams = new URLSearchParams();
  if (params.inviter?.trim()) {
    searchParams.set('inviter', params.inviter.trim());
  }
  if (params.invitee?.trim()) {
    searchParams.set('invitee', params.invitee.trim());
  }
  if (params.inviteCode?.trim()) {
    searchParams.set('inviteCode', params.inviteCode.trim());
  }
  return searchParams.toString();
}

export function fetchAdminInviteRewardConfigs() {
  return getJson<AdminInviteRewardConfigListResult>('/api/admin/invites/rewards');
}

export function createAdminInviteRewardConfig(payload: CreateAdminInviteRewardConfigPayload) {
  return postJson<AdminInviteRewardConfigItemResult, CreateAdminInviteRewardConfigPayload>(
    '/api/admin/invites/rewards',
    payload,
  );
}

export function updateAdminInviteRewardConfig(
  id: string,
  payload: UpdateAdminInviteRewardConfigPayload,
) {
  return putJson<AdminInviteRewardConfigItemResult, UpdateAdminInviteRewardConfigPayload>(
    `/api/admin/invites/rewards/${id}`,
    payload,
  );
}

export function deleteAdminInviteRewardConfig(id: string) {
  return deleteJson<{ success: boolean }>(`/api/admin/invites/rewards/${id}`);
}

export function fetchAdminInviteRecords(params: FetchAdminInviteRecordsParams) {
  const query = buildQuery(params);
  return getJson<AdminInviteRecordListResult>(
    `/api/admin/invites/records${query ? `?${query}` : ''}`,
  );
}

export type { AdminInviteRewardConfigItem };
