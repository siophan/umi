import type {
  MeActivityResult,
  MeSummaryResult,
  PublicUserActivityResult,
  UserPublicProfile,
  UserSearchResult,
} from '@umi/shared';

import { deleteJson, getJson, postJson } from './shared';

export async function fetchUserProfile(userId: string) {
  return getJson<UserPublicProfile>(`/api/users/${userId}`);
}

export async function fetchUserProfileActivity(userId: string) {
  return getJson<PublicUserActivityResult>(`/api/users/${userId}/activity`);
}

export async function fetchMeActivity() {
  return getJson<MeActivityResult>('/api/users/me/activity');
}

export async function fetchMeSummary() {
  return getJson<MeSummaryResult>('/api/users/me/summary');
}

export async function searchUsers(q?: string) {
  const searchParams = new URLSearchParams();
  if (q?.trim()) {
    searchParams.set('q', q.trim());
  }

  const query = searchParams.toString();
  return getJson<UserSearchResult>(`/api/users/search${query ? `?${query}` : ''}`);
}

export async function followUser(userId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/users/${userId}/follow`, {});
}

export async function unfollowUser(userId: string) {
  return deleteJson<{ success: true }>(`/api/users/${userId}/follow`);
}
