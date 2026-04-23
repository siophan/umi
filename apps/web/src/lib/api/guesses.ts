import type {
  CreateGuessPayload,
  CreateGuessResult,
  GuessHistoryResult,
  GuessListResult,
  GuessSummary,
} from '@umi/shared';

import { getJson, postJson } from './shared';

export function fetchGuessList(options?: number | { limit?: number; q?: string }) {
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
