import type { SocialFriendsResult, SocialOverviewResult } from '@umi/shared';

import { getJson, postJson } from './shared';

export async function fetchSocialOverview() {
  return getJson<SocialOverviewResult>('/api/social');
}

export async function fetchSocialFriends(params: { q?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) {
    search.set('q', params.q.trim());
  }
  if (params.limit) {
    search.set('limit', String(params.limit));
  }

  const query = search.toString();
  return getJson<SocialFriendsResult>(`/api/social/friends${query ? `?${query}` : ''}`);
}

export async function acceptFriendRequest(userId: string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/social/requests/${encodeURIComponent(userId)}/accept`,
    {},
  );
}

export async function rejectFriendRequest(userId: string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/social/requests/${encodeURIComponent(userId)}/reject`,
    {},
  );
}
