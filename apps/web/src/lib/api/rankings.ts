import type { RankingListResult, RankingPeriodType, RankingType } from '@umi/shared';

import { getJson } from './shared';

export function fetchRankings(options?: {
  type?: RankingType;
  periodType?: RankingPeriodType;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (options?.type) {
    searchParams.set('type', options.type);
  }

  if (options?.periodType) {
    searchParams.set('periodType', options.periodType);
  }

  if (typeof options?.limit === 'number' && Number.isFinite(options.limit)) {
    searchParams.set('limit', String(options.limit));
  }

  const query = searchParams.toString();
  return getJson<RankingListResult>(`/api/rankings${query ? `?${query}` : ''}`);
}
