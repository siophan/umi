import type {
  AddShopProductsPayload,
  AddShopProductsResult,
  BrandAuthOverviewResult,
  BrandProductListResult,
  MyShopResult,
  MyShopStatsResult,
  PublicShopDetailResult,
  ShopStatusResult,
  SubmitBrandAuthApplicationPayload,
  SubmitBrandAuthApplicationResult,
  SubmitShopApplicationPayload,
  SubmitShopApplicationResult,
} from '@umi/shared';

import { getJson, postJson } from './shared';

export function fetchMyShop() {
  return getJson<MyShopResult>('/api/shops/me');
}

export function fetchShopStatus() {
  return getJson<ShopStatusResult>('/api/shops/me/status');
}

export function fetchMyShopStats() {
  return getJson<MyShopStatsResult>('/api/shops/me/stats');
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
  return postJson<SubmitBrandAuthApplicationResult, SubmitBrandAuthApplicationPayload>(
    '/api/shops/brand-auth',
    payload,
  );
}

export function fetchBrandProducts(brandId: string) {
  return getJson<BrandProductListResult>(`/api/shops/brand-products?brandId=${encodeURIComponent(brandId)}`);
}

export function addShopProducts(payload: AddShopProductsPayload) {
  return postJson<AddShopProductsResult, AddShopProductsPayload>('/api/shops/products', payload);
}
