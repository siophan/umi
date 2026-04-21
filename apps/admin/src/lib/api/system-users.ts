import type {
  AdminSystemUserMutationResult,
  CreateAdminSystemUserPayload,
  ResetAdminSystemUserPasswordPayload,
  UpdateAdminSystemUserPayload,
  UpdateAdminSystemUserStatusPayload,
  UpdateAdminSystemUserStatusResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';
import type { AdminSystemUserListResult } from './system-shared';

export function fetchAdminSystemUsers() {
  return getJson<AdminSystemUserListResult>('/api/admin/system-users');
}

export function createAdminSystemUser(payload: CreateAdminSystemUserPayload) {
  return postJson<AdminSystemUserMutationResult, CreateAdminSystemUserPayload>(
    '/api/admin/system-users',
    payload,
  );
}

export function updateAdminSystemUser(id: string, payload: UpdateAdminSystemUserPayload) {
  return putJson<AdminSystemUserMutationResult, UpdateAdminSystemUserPayload>(
    `/api/admin/system-users/${id}`,
    payload,
  );
}

export function resetAdminSystemUserPassword(
  id: string,
  payload: ResetAdminSystemUserPasswordPayload,
) {
  return postJson<AdminSystemUserMutationResult, ResetAdminSystemUserPasswordPayload>(
    `/api/admin/system-users/${id}/reset-password`,
    payload,
  );
}

export function updateAdminSystemUserStatus(
  id: string,
  payload: UpdateAdminSystemUserStatusPayload,
) {
  return putJson<UpdateAdminSystemUserStatusResult, UpdateAdminSystemUserStatusPayload>(
    `/api/admin/system-users/${id}/status`,
    payload,
  );
}
