import type {
  AbandonAdminGuessPayload,
  AbandonAdminGuessResult,
  AdminGuessParticipantsResult,
  CreateAdminGuessPayload,
  CreateAdminGuessResult,
  GuessListResult,
  ReviewAdminGuessPayload,
  ReviewAdminGuessResult,
  SettleAdminGuessPayload,
  SettleAdminGuessResult,
  UpdateAdminGuessPayload,
  UpdateAdminGuessResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';
import type {
  AdminFriendGuessItem,
  AdminGuessDetailResult,
} from './catalog-shared';

export function fetchAdminGuesses() {
  return getJson<GuessListResult>('/api/admin/guesses');
}

export function fetchAdminGuessDetail(id: string) {
  return getJson<AdminGuessDetailResult>(`/api/admin/guesses/${id}`);
}

export function createAdminGuess(payload: CreateAdminGuessPayload) {
  return postJson<CreateAdminGuessResult, CreateAdminGuessPayload>('/api/admin/guesses', payload);
}

export function reviewAdminGuess(id: string, payload: ReviewAdminGuessPayload) {
  return putJson<ReviewAdminGuessResult, ReviewAdminGuessPayload>(
    `/api/admin/guesses/${id}/review`,
    payload,
  );
}

export function updateAdminGuess(id: string, payload: UpdateAdminGuessPayload) {
  return putJson<UpdateAdminGuessResult, UpdateAdminGuessPayload>(
    `/api/admin/guesses/${id}`,
    payload,
  );
}

export function fetchAdminFriendGuesses() {
  return getJson<{ items: AdminFriendGuessItem[] }>('/api/admin/guesses/friends');
}

export function abandonAdminGuess(id: string, payload: AbandonAdminGuessPayload) {
  return postJson<AbandonAdminGuessResult, AbandonAdminGuessPayload>(
    `/api/admin/guesses/${id}/abandon`,
    payload,
  );
}

export function settleAdminGuess(id: string, payload: SettleAdminGuessPayload) {
  return postJson<SettleAdminGuessResult, SettleAdminGuessPayload>(
    `/api/admin/guesses/${id}/settle`,
    payload,
  );
}

export function fetchAdminGuessParticipants(id: string, page: number, pageSize: number) {
  return getJson<AdminGuessParticipantsResult>(
    `/api/admin/guesses/${id}/participants?page=${page}&pageSize=${pageSize}`,
  );
}
