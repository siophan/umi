import type { SocialOverviewResult } from '@umi/shared';

import { getJson, postJson } from './shared';

export async function fetchSocialOverview() {
  return getJson<SocialOverviewResult>('/api/social');
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
