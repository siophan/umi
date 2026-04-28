import type {
  CancelBetResult,
  CreateGuessPayload,
  CreateGuessResult,
  FetchBetPayStatusResult,
  FriendPkResult,
  GuessCategoryListResult,
  GuessCommentListResult,
  GuessCommentSummary,
  GuessHistoryResult,
  GuessListResult,
  GuessSummary,
  ParticipateGuessPayload,
  ParticipateGuessResult,
  PostGuessCommentPayload,
  ToggleGuessFavoriteResult,
} from '@umi/shared';

import { deleteJson, getJson, postJson } from './shared';

export function fetchGuessList(
  options?: number | { limit?: number; q?: string; cursor?: string; categoryId?: string },
) {
  const searchParams = new URLSearchParams();
  if (typeof options === 'number') {
    searchParams.set('limit', String(options));
  } else if (options) {
    if (typeof options.limit === 'number') {
      searchParams.set('limit', String(options.limit));
    }
    if (options.q?.trim()) {
      searchParams.set('q', options.q.trim());
    }
    if (options.cursor?.trim()) {
      searchParams.set('cursor', options.cursor.trim());
    }
    if (options.categoryId?.trim()) {
      searchParams.set('categoryId', options.categoryId.trim());
    }
  }

  const query = searchParams.toString();
  return getJson<GuessListResult>(`/api/guesses${query ? `?${query}` : ''}`);
}

export function fetchGuess(id: string) {
  return getJson<GuessSummary>(`/api/guesses/${id}`);
}

export function fetchGuessHistory() {
  return getJson<GuessHistoryResult>('/api/guesses/user/history');
}

export function createGuess(payload: CreateGuessPayload) {
  return postJson<CreateGuessResult, CreateGuessPayload>('/api/guesses', payload);
}

export function fetchGuessCategories() {
  return getJson<GuessCategoryListResult>('/api/guesses/categories');
}

export function fetchFriendPkSummary() {
  return getJson<FriendPkResult>('/api/guesses/friend-pk');
}

export function participateInGuess(id: string, payload: ParticipateGuessPayload) {
  return postJson<ParticipateGuessResult, ParticipateGuessPayload>(
    `/api/guesses/${encodeURIComponent(id)}/participate`,
    payload,
  );
}

export function favoriteGuess(id: string) {
  return postJson<ToggleGuessFavoriteResult, Record<string, never>>(
    `/api/guesses/${encodeURIComponent(id)}/favorite`,
    {},
  );
}

export function unfavoriteGuess(id: string) {
  return deleteJson<ToggleGuessFavoriteResult>(`/api/guesses/${encodeURIComponent(id)}/favorite`);
}

export function fetchGuessComments(id: string, limit = 50) {
  return getJson<GuessCommentListResult>(
    `/api/guesses/${encodeURIComponent(id)}/comments?limit=${limit}`,
  );
}

export function postGuessComment(id: string, payload: PostGuessCommentPayload) {
  return postJson<GuessCommentSummary, PostGuessCommentPayload>(
    `/api/guesses/${encodeURIComponent(id)}/comments`,
    payload,
  );
}

export function likeGuessComment(commentId: string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/guesses/comments/${encodeURIComponent(commentId)}/like`,
    {},
  );
}

export function unlikeGuessComment(commentId: string) {
  return deleteJson<{ success: true }>(`/api/guesses/comments/${encodeURIComponent(commentId)}/like`);
}

export function fetchBetPayStatus(betId: string) {
  return getJson<FetchBetPayStatusResult>(
    `/api/guesses/bets/${encodeURIComponent(betId)}/pay-status`,
  );
}

export function cancelBetPayment(betId: string) {
  return postJson<CancelBetResult, Record<string, never>>(
    `/api/guesses/bets/${encodeURIComponent(betId)}/cancel`,
    {},
  );
}
