import type {
  ApiEnvelope,
  BannerListResult,
  GuessListResult,
  LiveListResult,
  RankingListResult,
} from '@umi/shared';

import { serverApiBaseUrl } from '../lib/env';
import type { HomeSectionErrors } from './home-page-types';
import HomePageClient from './page-client';

const SSR_FETCH_TIMEOUT_MS = 3000;

async function fetchServerData<T>(path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SSR_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${serverApiBaseUrl}${path}`, {
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) {
      throw new Error(payload.message || `failed to fetch ${path}`);
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
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
        guessItems: guessResult.status === 'fulfilled' ? guessResult.value.items : [],
        guessNextCursor:
          guessResult.status === 'fulfilled' ? guessResult.value.nextCursor : null,
        guessHasMore:
          guessResult.status === 'fulfilled' ? guessResult.value.hasMore : false,
        liveItems: liveResult.status === 'fulfilled' ? liveResult.value.items : [],
        rankingItems: rankingResult.status === 'fulfilled' ? rankingResult.value.items : [],
        historyItems: [],
        hotTopics: [],
        sectionErrors,
      }}
    />
  );
}
