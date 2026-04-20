import type {
  ProductDetailResult,
  ProductListResult,
} from '@umi/shared';

import { deleteJson, getJson, postJson } from './shared';

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

export function favoriteProduct(productId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/products/${productId}/favorite`, {});
}

export function unfavoriteProduct(productId: string) {
  return deleteJson<{ success: true }>(`/api/products/${productId}/favorite`);
}
