import type { ApiEnvelope, RankingListResult, RankingType } from '@umi/shared';
import RankingPageClient from './page-client';

type RankTab = 'winRate' | 'earnings' | 'active';

const rankingTypes: Record<RankTab, RankingType> = {
  winRate: 'winRate',
  earnings: 'guessWins',
  active: 'inviteCount',
};

const apiBaseUrl = 'http://127.0.0.1:4000';

async function fetchServerRankingList(type: RankingType) {
  const response = await fetch(`${apiBaseUrl}/api/rankings?type=${type}&periodType=allTime&limit=20`, {
    cache: 'no-store',
  });
  const payload = (await response.json()) as ApiEnvelope<RankingListResult>;
  if (!response.ok) {
    throw new Error(payload.message || 'failed to fetch rankings');
  }
  return payload.data.items;
}

export default async function RankingPage() {
  const initialDataMap: Record<RankTab, RankingListResult['items']> = {
    winRate: [],
    earnings: [],
    active: [],
  };

  await Promise.all(
    (Object.keys(rankingTypes) as RankTab[]).map(async (key) => {
      try {
        initialDataMap[key] = await fetchServerRankingList(rankingTypes[key]);
      } catch {
        initialDataMap[key] = [];
      }
    }),
  );

  return <RankingPageClient initialDataMap={initialDataMap} />;
}
