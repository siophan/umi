import type {
  AddShopProductsPayload,
  AddShopProductsResult,
  ApiEnvelope,
  BrandAuthOverviewResult,
  BrandProductListResult,
  ChatConversationListResult,
  ChatDetailResult,
  CommunityCommentItem,
  CommunityDiscoveryResult,
  CommunityPostDetailResult,
  CommunityFeedResult,
  CommunitySearchResult,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
  GuessHistoryResult,
  GuessListResult,
  GuessSummary,
  LoginPayload,
  LoginResult,
  MeActivityResult,
  MeSummaryResult,
  MyShopResult,
  LogoutResult,
  NotificationListResult,
  OrderListResult,
  ProductDetailResult,
  ProductListResult,
  PublicUserActivityResult,
  PublicShopDetailResult,
  RegisterPayload,
  SendCodePayload,
  SendCodeResult,
  SendChatMessagePayload,
  SocialOverviewResult,
  SubmitBrandAuthApplicationPayload,
  SubmitBrandAuthApplicationResult,
  SubmitShopApplicationPayload,
  SubmitShopApplicationResult,
  UpdateMePayload,
  UserSearchResult,
  UserPublicProfile,
  ShopStatusResult,
  WalletLedgerResult,
  WarehouseListResult,
  UserSummary,
} from '@joy/shared';

import { apiBaseUrl } from './env';

const AUTH_TOKEN_KEY = 'joy_token';

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    headers: getAuthToken()
      ? {
          Authorization: `Bearer ${getAuthToken()}`,
        }
      : undefined,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.message || `Request failed: ${path}`);
  }

  return payload.data;
}

async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}

async function putJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}

async function deleteJson<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'DELETE',
    headers: getAuthToken()
      ? {
          Authorization: `Bearer ${getAuthToken()}`,
        }
      : undefined,
  });

  const data = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${path}`);
  }

  return data.data;
}

export function fetchGuessList() {
  return getJson<GuessListResult>('/api/guesses');
}

export function fetchGuess(id: string) {
  return getJson<GuessSummary>(`/api/guesses/${id}`);
}

export function fetchGuessHistory() {
  return getJson<GuessHistoryResult>('/api/guesses/user/history');
}

export function fetchProductDetail(id: string) {
  return getJson<ProductDetailResult>(`/api/products/${id}`);
}

export function fetchProductList(options?: number | { limit?: number; q?: string; categoryId?: string }) {
  const searchParams = new URLSearchParams();
  if (typeof options === 'number') {
    searchParams.set('limit', String(options));
  } else if (options) {
    if (typeof options.limit === 'number') {
      searchParams.set('limit', String(options.limit));
    }
    if (options.q?.trim()) {
      searchParams.set('q', options.q.trim());
    }
    if (options.categoryId?.trim()) {
      searchParams.set('categoryId', options.categoryId.trim());
    }
  }

  const query = searchParams.toString();
  return getJson<ProductListResult>(`/api/products${query ? `?${query}` : ''}`);
}

export function fetchOrders() {
  return getJson<OrderListResult>('/api/orders');
}

export function fetchVirtualWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/virtual');
}

export function fetchPhysicalWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/physical');
}

export function fetchMyShop() {
  return getJson<MyShopResult>('/api/shops/me');
}

export function fetchShopStatus() {
  return getJson<ShopStatusResult>('/api/shops/me/status');
}

export function submitShopApplication(payload: SubmitShopApplicationPayload) {
  return postJson<SubmitShopApplicationResult, SubmitShopApplicationPayload>('/api/shops/apply', payload);
}

export function fetchShopDetail(id: string) {
  return getJson<PublicShopDetailResult>(`/api/shops/${id}`);
}

export function fetchBrandAuthOverview() {
  return getJson<BrandAuthOverviewResult>('/api/shops/brand-auth');
}

export function submitBrandAuthApplication(payload: SubmitBrandAuthApplicationPayload) {
  return postJson<SubmitBrandAuthApplicationResult, SubmitBrandAuthApplicationPayload>('/api/shops/brand-auth', payload);
}

export function fetchBrandProducts(brandId: string) {
  return getJson<BrandProductListResult>(`/api/shops/brand-products?brandId=${encodeURIComponent(brandId)}`);
}

export function addShopProducts(payload: AddShopProductsPayload) {
  return postJson<AddShopProductsResult, AddShopProductsPayload>('/api/shops/products', payload);
}

export function fetchWalletLedger() {
  return getJson<WalletLedgerResult>('/api/wallet/ledger');
}

export async function login(payload: LoginPayload) {
  return postJson<LoginResult, LoginPayload>('/api/auth/login', payload);
}

export async function sendCode(payload: SendCodePayload) {
  return postJson<SendCodeResult, SendCodePayload>('/api/auth/send-code', payload);
}

export async function register(payload: RegisterPayload) {
  return postJson<LoginResult, RegisterPayload>('/api/auth/register', payload);
}

export async function fetchMe() {
  return getJson<UserSummary>('/api/auth/me');
}

export async function logout() {
  return postJson<LogoutResult, Record<string, never>>('/api/auth/logout', {});
}

export async function updateMe(payload: UpdateMePayload) {
  return putJson<UserSummary, UpdateMePayload>('/api/auth/me', payload);
}

export async function fetchUserProfile(userId: string) {
  return getJson<UserPublicProfile>(`/api/auth/users/${userId}`);
}

export async function fetchUserProfileActivity(userId: string) {
  return getJson<PublicUserActivityResult>(`/api/auth/users/${userId}/activity`);
}

export async function fetchMeActivity() {
  return getJson<MeActivityResult>('/api/auth/me/activity');
}

export async function fetchMeSummary() {
  return getJson<MeSummaryResult>('/api/auth/me/summary');
}

export async function searchUsers(q?: string) {
  const searchParams = new URLSearchParams();
  if (q?.trim()) {
    searchParams.set('q', q.trim());
  }
  const query = searchParams.toString();
  return getJson<UserSearchResult>(`/api/auth/users/search${query ? `?${query}` : ''}`);
}

export async function fetchNotifications() {
  return getJson<NotificationListResult>('/api/auth/notifications');
}

export async function markAllNotificationsRead() {
  return postJson<{ success: true }, Record<string, never>>('/api/auth/notifications/read-all', {});
}

export async function markNotificationRead(notificationId: number | string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/auth/notifications/${encodeURIComponent(String(notificationId))}/read`,
    {},
  );
}

export async function fetchSocialOverview() {
  return getJson<SocialOverviewResult>('/api/auth/social');
}

export async function fetchCommunityFeed(tab: 'recommend' | 'follow') {
  return getJson<CommunityFeedResult>(`/api/auth/community/feed?tab=${encodeURIComponent(tab)}`);
}

export async function fetchCommunityDiscovery() {
  return getJson<CommunityDiscoveryResult>('/api/auth/community/discovery');
}

export async function fetchCommunityPost(postId: string) {
  return getJson<CommunityPostDetailResult>(`/api/auth/community/posts/${postId}`);
}

export async function createCommunityPost(payload: CreateCommunityPostPayload) {
  return postJson<CommunityFeedResult['items'][number], CreateCommunityPostPayload>('/api/auth/community/posts', payload);
}

export async function createCommunityComment(postId: string, payload: CreateCommunityCommentPayload) {
  return postJson<CommunityCommentItem, CreateCommunityCommentPayload>(`/api/auth/community/posts/${postId}/comments`, payload);
}

export async function likeCommunityComment(commentId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/auth/community/comments/${commentId}/like`, {});
}

export async function unlikeCommunityComment(commentId: string) {
  return deleteJson<{ success: true }>(`/api/auth/community/comments/${commentId}/like`);
}

export async function repostCommunityPost(postId: string, payload: CreateCommunityPostPayload) {
  return postJson<CommunityFeedResult['items'][number], CreateCommunityPostPayload>(`/api/auth/community/posts/${postId}/repost`, payload);
}

export async function searchCommunity(q: string) {
  return getJson<CommunitySearchResult>(`/api/auth/community/search?q=${encodeURIComponent(q.trim())}`);
}

export async function fetchChats() {
  return getJson<ChatConversationListResult>('/api/auth/chats');
}

export async function fetchChatDetail(userId: string) {
  return getJson<ChatDetailResult>(`/api/auth/chats/${userId}`);
}

export async function sendChatMessage(userId: string, payload: SendChatMessagePayload) {
  return postJson<ChatDetailResult['items'][number], SendChatMessagePayload>(`/api/auth/chats/${userId}`, payload);
}

export async function followUser(userId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/auth/users/${userId}/follow`, {});
}

export async function unfollowUser(userId: string) {
  return deleteJson<{ success: true }>(`/api/auth/users/${userId}/follow`);
}

export async function acceptFriendRequest(userId: string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/auth/friends/requests/${encodeURIComponent(userId)}/accept`,
    {},
  );
}

export async function rejectFriendRequest(userId: string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/auth/friends/requests/${encodeURIComponent(userId)}/reject`,
    {},
  );
}

export async function likeCommunityPost(postId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/auth/community/posts/${postId}/like`, {});
}

export async function unlikeCommunityPost(postId: string) {
  return deleteJson<{ success: true }>(`/api/auth/community/posts/${postId}/like`);
}

export async function bookmarkCommunityPost(postId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/auth/community/posts/${postId}/bookmark`, {});
}

export async function unbookmarkCommunityPost(postId: string) {
  return deleteJson<{ success: true }>(`/api/auth/community/posts/${postId}/bookmark`);
}
