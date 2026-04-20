import type { BannerListResult } from '@umi/shared';

import { getJson } from './shared';

export function fetchBanners(position?: string, limit?: number) {
  const searchParams = new URLSearchParams();

  if (position?.trim()) {
    searchParams.set('position', position.trim());
  }

  if (typeof limit === 'number' && Number.isFinite(limit)) {
    searchParams.set('limit', String(limit));
  }

  const query = searchParams.toString();
  return getJson<BannerListResult>(`/api/banners${query ? `?${query}` : ''}`);
}
