import type {
  AdminRankingDetailResult,
  AdminRankingListResult,
  RankingPeriodType,
  RankingType,
} from '@umi/shared';

import { getJson } from './shared';

type FetchAdminRankingsParams = {
  boardType?: RankingType;
  periodType?: RankingPeriodType;
  periodValue?: string;
  topUser?: string;
};

function buildQuery(params: FetchAdminRankingsParams) {
  const searchParams = new URLSearchParams();
  if (params.boardType) {
    searchParams.set('boardType', params.boardType);
  }
  if (params.periodType) {
    searchParams.set('periodType', params.periodType);
  }
  if (params.periodValue?.trim()) {
    searchParams.set('periodValue', params.periodValue.trim());
  }
  if (params.topUser?.trim()) {
    searchParams.set('topUser', params.topUser.trim());
  }
  return searchParams.toString();
}

export function fetchAdminRankings(params: FetchAdminRankingsParams) {
  const query = buildQuery(params);
  return getJson<AdminRankingListResult>(`/api/admin/rankings${query ? `?${query}` : ''}`);
}

export function fetchAdminRankingDetail(
  boardType: RankingType,
  periodType: RankingPeriodType,
  periodValue: string,
) {
  return getJson<AdminRankingDetailResult>(
    `/api/admin/rankings/${boardType}/${periodType}/${encodeURIComponent(periodValue)}`,
  );
}
