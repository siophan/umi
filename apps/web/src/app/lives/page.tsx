import type { ApiEnvelope, LiveListResult } from '@umi/shared';

import { serverApiBaseUrl } from '../../lib/env';
import LivesPageClient from './page-client';

async function fetchServerLiveList() {
  const response = await fetch(`${serverApiBaseUrl}/api/lives?limit=20`, {
    cache: 'no-store',
  });
  const payload = (await response.json()) as ApiEnvelope<LiveListResult>;
  if (!response.ok) {
    throw new Error(payload.message || 'failed to fetch lives');
  }
  return payload.data.items;
}

export default async function LivesPage() {
  try {
    return <LivesPageClient initialItems={await fetchServerLiveList()} initialError={null} />;
  } catch (error) {
    return (
      <LivesPageClient
        initialItems={[]}
        initialError={error instanceof Error ? error.message : '直播列表加载失败，请稍后重试'}
      />
    );
  }
}
