import type {
  AdminLoginPayload,
  AdminLoginResult,
  AdminProfile,
  ChangePasswordPayload,
  ChangePasswordResult,
  LogoutResult,
} from '@umi/shared';

import {
  clearAuthToken,
  getJson,
  hasAuthToken,
  postJson,
  setAuthToken,
} from './shared';

export { clearAuthToken, hasAuthToken, setAuthToken };

export function fetchMe() {
  return getJson<AdminProfile>('/api/admin/auth/me');
}

export function login(payload: AdminLoginPayload) {
  return postJson<AdminLoginResult, AdminLoginPayload>(
    '/api/admin/auth/login',
    payload,
  );
}

export function changePassword(payload: ChangePasswordPayload) {
  return postJson<ChangePasswordResult, ChangePasswordPayload>(
    '/api/admin/auth/change-password',
    payload,
  );
}

export function logout() {
  return postJson<LogoutResult, Record<string, never>>('/api/admin/auth/logout', {});
}
