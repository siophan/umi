import type {
  AddShopProductsPayload,
  AddShopProductsResult,
  ApiEnvelope,
  BrandAuthOverviewResult,
  BrandProductListResult,
  ChatConversationListResult,
  ChatDetailResult,
  GuessHistoryResult,
  GuessListResult,
  GuessSummary,
  LoginPayload,
  LoginResult,
  MeActivityResult,
  MyShopResult,
  LogoutResult,
  NotificationListResult,
  OrderListResult,
  ProductDetailResult,
  ProductListResult,
  PublicShopDetailResult,
  RegisterPayload,
  SendCodePayload,
  SendCodeResult,
  SendChatMessagePayload,
  SocialOverviewResult,
  SubmitBrandAuthApplicationPayload,
  SubmitBrandAuthApplicationResult,
  UpdateMePayload,
  UserPublicProfile,
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

export function fetchProductList(limit?: number) {
  const query = typeof limit === 'number' ? `?limit=${encodeURIComponent(String(limit))}` : '';
  return getJson<ProductListResult>(`/api/products${query}`);
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

export async function fetchMeActivity() {
  return getJson<MeActivityResult>('/api/auth/me/activity');
}

export async function fetchNotifications() {
  return getJson<NotificationListResult>('/api/auth/notifications');
}

export async function markAllNotificationsRead() {
  return postJson<{ success: true }, Record<string, never>>('/api/auth/notifications/read-all', {});
}

export async function fetchSocialOverview() {
  return getJson<SocialOverviewResult>('/api/auth/social');
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
