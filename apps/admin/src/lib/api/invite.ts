import type {
  AdminInviteRecordListResult,
  AdminInviteRewardConfigItem,
  UpdateAdminInviteRewardConfigPayload,
  UpdateAdminInviteRewardConfigResult,
} from '@umi/shared';

import { getJson, putJson } from './shared';

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

export function fetchAdminInviteConfig() {
  return getJson<AdminInviteRewardConfigItem | null>('/api/admin/invites/config');
}

export function updateAdminInviteConfig(payload: UpdateAdminInviteRewardConfigPayload) {
  return putJson<UpdateAdminInviteRewardConfigResult, UpdateAdminInviteRewardConfigPayload>(
    '/api/admin/invites/config',
    payload,
  );
}

export function fetchAdminInviteRecords(params: FetchAdminInviteRecordsParams) {
  const query = buildQuery(params);
  return getJson<AdminInviteRecordListResult>(
    `/api/admin/invites/records${query ? `?${query}` : ''}`,
  );
}

export type { AdminInviteRewardConfigItem };
