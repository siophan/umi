import type {
  CreateAdminGuessPayload,
  CreateAdminGuessResult,
  GuessListResult,
  ReviewAdminGuessPayload,
  ReviewAdminGuessResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';
import type {
  AdminFriendGuessItem,
  AdminGuessDetailResult,
  AdminPkMatchItem,
  AdminPkMatchStats,
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

export function fetchAdminFriendGuesses() {
  return getJson<{ items: AdminFriendGuessItem[] }>('/api/admin/guesses/friends');
}

export function fetchAdminPkMatches() {
  return getJson<{ items: AdminPkMatchItem[] }>('/api/admin/pk');
}

export function fetchAdminPkStats() {
  return getJson<AdminPkMatchStats>('/api/admin/pk/stats');
}
