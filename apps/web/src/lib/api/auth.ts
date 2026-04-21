import type {
  LoginPayload,
  LoginResult,
  LogoutResult,
  RegisterPayload,
  ResetPasswordPayload,
  SendCodePayload,
  SendCodeResult,
  UpdateMePayload,
  UserSummary,
  VerifyCodePayload,
  VerifyCodeResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';

export async function login(payload: LoginPayload) {
  return postJson<LoginResult, LoginPayload>('/api/auth/login', payload);
}

export async function sendCode(payload: SendCodePayload) {
  return postJson<SendCodeResult, SendCodePayload>('/api/auth/send-code', payload);
}

export async function verifyCode(payload: VerifyCodePayload) {
  return postJson<VerifyCodeResult, VerifyCodePayload>('/api/auth/verify-code', payload);
}

export async function register(payload: RegisterPayload) {
  return postJson<LoginResult, RegisterPayload>('/api/auth/register', payload);
}

export async function fetchMe() {
  return getJson<UserSummary>('/api/users/me');
}

export async function logout() {
  return postJson<LogoutResult, Record<string, never>>('/api/auth/logout', {});
}

export async function updateMe(payload: UpdateMePayload) {
  return putJson<UserSummary, UpdateMePayload>('/api/users/me', payload);
}

export async function resetPassword(payload: ResetPasswordPayload) {
  return postJson<{ success: true }, ResetPasswordPayload>('/api/auth/reset-password', payload);
}
