import type {
  CommunityCommentItem,
  CommunityCommentSort,
  CommunityDiscoveryResult,
  CommunityFeedResult,
  CommunityPostDetailResult,
  CommunitySearchResult,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
  CreateCommunityReportPayload,
} from '@umi/shared';

import { deleteJson, getJson, postJson } from './shared';

export async function fetchCommunityFeed(tab: 'recommend' | 'follow') {
  return getJson<CommunityFeedResult>(`/api/community/feed?tab=${encodeURIComponent(tab)}`);
}

export async function fetchCommunityDiscovery() {
  return getJson<CommunityDiscoveryResult>('/api/community/discovery');
}

export async function fetchCommunityPost(postId: string, sort: CommunityCommentSort = 'hot') {
  return getJson<CommunityPostDetailResult>(
    `/api/community/posts/${postId}?sort=${encodeURIComponent(sort)}`,
  );
}

export async function createCommunityPost(payload: CreateCommunityPostPayload) {
  return postJson<CommunityFeedResult['items'][number], CreateCommunityPostPayload>(
    '/api/community/posts',
    payload,
  );
}

export async function createCommunityComment(postId: string, payload: CreateCommunityCommentPayload) {
  return postJson<CommunityCommentItem, CreateCommunityCommentPayload>(
    `/api/community/posts/${postId}/comments`,
    payload,
  );
}

export async function likeCommunityComment(commentId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/community/comments/${commentId}/like`, {});
}

export async function unlikeCommunityComment(commentId: string) {
  return deleteJson<{ success: true }>(`/api/community/comments/${commentId}/like`);
}

export async function reportCommunityPost(postId: string, payload: CreateCommunityReportPayload) {
  return postJson<{ success: true }, CreateCommunityReportPayload>(
    `/api/community/posts/${postId}/report`,
    payload,
  );
}

export async function repostCommunityPost(postId: string, payload: CreateCommunityPostPayload) {
  return postJson<CommunityFeedResult['items'][number], CreateCommunityPostPayload>(
    `/api/community/posts/${postId}/repost`,
    payload,
  );
}

export async function searchCommunity(q: string) {
  return getJson<CommunitySearchResult>(`/api/community/search?q=${encodeURIComponent(q.trim())}`);
}

export async function likeCommunityPost(postId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/community/posts/${postId}/like`, {});
}

export async function unlikeCommunityPost(postId: string) {
  return deleteJson<{ success: true }>(`/api/community/posts/${postId}/like`);
}

export async function bookmarkCommunityPost(postId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/community/posts/${postId}/bookmark`, {});
}

export async function unbookmarkCommunityPost(postId: string) {
  return deleteJson<{ success: true }>(`/api/community/posts/${postId}/bookmark`);
}
