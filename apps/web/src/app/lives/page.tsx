import type { ApiEnvelope, LiveListResult } from '@umi/shared';

import LivesPageClient from './page-client';

const apiBaseUrl = 'http://127.0.0.1:4000';

async function fetchServerLiveList() {
  const response = await fetch(`${apiBaseUrl}/api/lives?limit=20`, {
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
    return <LivesPageClient initialItems={await fetchServerLiveList()} />;
  } catch {
    return <LivesPageClient initialItems={[]} />;
  }
}
