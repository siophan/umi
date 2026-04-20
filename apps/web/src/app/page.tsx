import type {
  ApiEnvelope,
  BannerListResult,
  GuessListResult,
  LiveListResult,
  RankingListResult,
} from '@umi/shared';

import { serverApiBaseUrl } from '../lib/env';
import HomePageClient from './page-client';

async function fetchServerData<T>(path: string) {
  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    cache: 'no-store',
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.message || `failed to fetch ${path}`);
  }
  return payload.data;
}

export default async function HomePage() {
  const [bannersResult, guessResult, liveResult, rankingResult] = await Promise.allSettled([
    fetchServerData<BannerListResult>('/api/banners?position=home_hero&limit=5'),
    fetchServerData<GuessListResult>('/api/guesses'),
    fetchServerData<LiveListResult>('/api/lives?limit=12'),
    fetchServerData<RankingListResult>('/api/rankings?type=winRate&periodType=allTime&limit=10'),
  ]);

  return (
    <HomePageClient
      initialData={{
        guessBanners: bannersResult.status === 'fulfilled' ? bannersResult.value.items : [],
        guessItems:
          guessResult.status === 'fulfilled'
            ? guessResult.value.items.filter((item) => item.status === 'active')
            : [],
        liveItems: liveResult.status === 'fulfilled' ? liveResult.value.items : [],
        rankingItems: rankingResult.status === 'fulfilled' ? rankingResult.value.items : [],
        historyItems: [],
        hotTopics: [],
      }}
    />
  );
}
