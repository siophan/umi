import type {
  AdminPermissionMutationResult,
  CreateAdminPermissionPayload,
  CreateAdminRolePayload,
  CreateAdminRoleResult,
  UpdateAdminPermissionPayload,
  UpdateAdminPermissionStatusPayload,
  UpdateAdminPermissionStatusResult,
  UpdateAdminRolePayload,
  UpdateAdminRolePermissionsPayload,
  UpdateAdminRolePermissionsResult,
  UpdateAdminRoleResult,
  UpdateAdminRoleStatusPayload,
  UpdateAdminRoleStatusResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';
import type {
  AdminPermissionListResult,
  AdminPermissionMatrixData,
  AdminRoleListResult,
} from './system-shared';

export function fetchAdminRoles() {
  return getJson<AdminRoleListResult>('/api/admin/roles');
}

export function createAdminRole(payload: CreateAdminRolePayload) {
  return postJson<CreateAdminRoleResult, CreateAdminRolePayload>('/api/admin/roles', payload);
}

export function updateAdminRole(id: string, payload: UpdateAdminRolePayload) {
  return putJson<UpdateAdminRoleResult, UpdateAdminRolePayload>(`/api/admin/roles/${id}`, payload);
}

export function updateAdminRoleStatus(id: string, payload: UpdateAdminRoleStatusPayload) {
  return putJson<UpdateAdminRoleStatusResult, UpdateAdminRoleStatusPayload>(
    `/api/admin/roles/${id}/status`,
    payload,
  );
}

export function updateAdminRolePermissions(
  id: string,
  payload: UpdateAdminRolePermissionsPayload,
) {
  return putJson<UpdateAdminRolePermissionsResult, UpdateAdminRolePermissionsPayload>(
    `/api/admin/roles/${id}/permissions`,
    payload,
  );
}

export function fetchAdminPermissions() {
  return getJson<AdminPermissionListResult>('/api/admin/permissions');
}

export function createAdminPermission(payload: CreateAdminPermissionPayload) {
  return postJson<AdminPermissionMutationResult, CreateAdminPermissionPayload>(
    '/api/admin/permissions',
    payload,
  );
}

export function updateAdminPermission(id: string, payload: UpdateAdminPermissionPayload) {
  return putJson<AdminPermissionMutationResult, UpdateAdminPermissionPayload>(
    `/api/admin/permissions/${id}`,
    payload,
  );
}

export function updateAdminPermissionStatus(
  id: string,
  payload: UpdateAdminPermissionStatusPayload,
) {
  return putJson<UpdateAdminPermissionStatusResult, UpdateAdminPermissionStatusPayload>(
    `/api/admin/permissions/${id}/status`,
    payload,
  );
}

export function fetchAdminPermissionsMatrix() {
  return getJson<AdminPermissionMatrixData>('/api/admin/permissions/matrix');
}
