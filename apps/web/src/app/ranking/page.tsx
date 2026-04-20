import type { ApiEnvelope, RankingListResult, RankingType } from '@umi/shared';

import { serverApiBaseUrl } from '../../lib/env';
import RankingPageClient from './page-client';

type RankTab = 'winRate' | 'earnings' | 'active';

const rankingTypes: Record<RankTab, RankingType> = {
  winRate: 'winRate',
  earnings: 'guessWins',
  active: 'inviteCount',
};

async function fetchServerRankingList(type: RankingType) {
  const response = await fetch(`${serverApiBaseUrl}/api/rankings?type=${type}&periodType=allTime&limit=20`, {
    cache: 'no-store',
  });
  const payload = (await response.json()) as ApiEnvelope<RankingListResult>;
  if (!response.ok) {
    throw new Error(payload.message || 'failed to fetch rankings');
  }
  return payload.data.items;
}

type RankTabState = {
  items: RankingListResult['items'];
  error: string | null;
};

export default async function RankingPage() {
  const initialStateMap: Record<RankTab, RankTabState> = {
    winRate: { items: [], error: null },
    earnings: { items: [], error: null },
    active: { items: [], error: null },
  };

  await Promise.all(
    (Object.keys(rankingTypes) as RankTab[]).map(async (key) => {
      try {
        initialStateMap[key] = {
          items: await fetchServerRankingList(rankingTypes[key]),
          error: null,
        };
      } catch (error) {
        initialStateMap[key] = {
          items: [],
          error: error instanceof Error ? error.message : '榜单加载失败，请稍后重试',
        };
      }
    }),
  );

  return <RankingPageClient initialStateMap={initialStateMap} />;
}
