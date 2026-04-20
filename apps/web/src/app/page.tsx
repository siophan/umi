import type {
  ApiEnvelope,
  BannerListResult,
  GuessListResult,
  LiveListResult,
  RankingListResult,
} from '@umi/shared';

import { serverApiBaseUrl } from '../lib/env';
import HomePageClient from './page-client';

type HomeSectionErrors = {
  banners: string | null;
  guesses: string | null;
  lives: string | null;
  rankings: string | null;
};

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

function getResultError(result: PromiseSettledResult<unknown>, fallback: string) {
  if (result.status === 'fulfilled') {
    return null;
  }
  return result.reason instanceof Error ? result.reason.message : fallback;
}

export default async function HomePage() {
  const [bannersResult, guessResult, liveResult, rankingResult] = await Promise.allSettled([
    fetchServerData<BannerListResult>('/api/banners?position=home_hero&limit=5'),
    fetchServerData<GuessListResult>('/api/guesses'),
    fetchServerData<LiveListResult>('/api/lives?limit=12'),
    fetchServerData<RankingListResult>('/api/rankings?type=winRate&periodType=allTime&limit=10'),
  ]);

  const sectionErrors: HomeSectionErrors = {
    banners: getResultError(bannersResult, '首页头图加载失败'),
    guesses: getResultError(guessResult, '竞猜列表加载失败'),
    lives: getResultError(liveResult, '直播列表加载失败'),
    rankings: getResultError(rankingResult, '榜单加载失败'),
  };

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
        sectionErrors,
      }}
    />
  );
}
