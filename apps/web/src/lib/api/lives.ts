import type { LiveDetailResult, LiveListResult } from '@umi/shared';

import { getJson } from './shared';

export function fetchLiveList(limit?: number) {
  const searchParams = new URLSearchParams();

  if (typeof limit === 'number' && Number.isFinite(limit)) {
    searchParams.set('limit', String(limit));
  }

  const query = searchParams.toString();
  return getJson<LiveListResult>(`/api/lives${query ? `?${query}` : ''}`);
}

export function fetchLiveDetail(id: string) {
  return getJson<LiveDetailResult>(`/api/lives/${id}`);
}
