import type {
  LoginPayload,
  LoginResult,
  LogoutResult,
  RegisterPayload,
  SendCodePayload,
  SendCodeResult,
  UpdateMePayload,
  UserSummary,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';

export async function login(payload: LoginPayload) {
  return postJson<LoginResult, LoginPayload>('/api/auth/login', payload);
}

export async function sendCode(payload: SendCodePayload) {
  return postJson<SendCodeResult, SendCodePayload>('/api/auth/send-code', payload);
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
