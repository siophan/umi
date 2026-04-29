import type {
  AppendProductReviewPayload,
  AppendProductReviewResult,
  ProductCategoryListResult,
  ProductDetailResult,
  ProductListResult,
  ProductReviewListResult,
  ToggleProductReviewHelpfulResult,
} from '@umi/shared';

import { deleteJson, getJson, postJson } from './shared';

export type ProductListSort = 'default' | 'sales' | 'price_asc' | 'rating';

export type ProductListOptions = {
  limit?: number;
  offset?: number;
  q?: string;
  categoryId?: string;
  shopId?: string;
  sort?: ProductListSort;
};

export function fetchProductDetail(id: string) {
  return getJson<ProductDetailResult>(`/api/products/${id}`);
}

export function fetchProductList(options?: number | ProductListOptions) {
  const searchParams = new URLSearchParams();
  if (typeof options === 'number') {
    searchParams.set('limit', String(options));
  } else if (options) {
    if (typeof options.limit === 'number') {
      searchParams.set('limit', String(options.limit));
    }
    if (typeof options.offset === 'number') {
      searchParams.set('offset', String(options.offset));
    }
    if (options.q?.trim()) {
      searchParams.set('q', options.q.trim());
    }
    if (options.categoryId?.trim()) {
      searchParams.set('categoryId', options.categoryId.trim());
    }
    if (options.shopId?.trim()) {
      searchParams.set('shopId', options.shopId.trim());
    }
    if (options.sort) {
      searchParams.set('sort', options.sort);
    }
  }

  const query = searchParams.toString();
  return getJson<ProductListResult>(`/api/products${query ? `?${query}` : ''}`);
}

export function fetchProductCategories() {
  return getJson<ProductCategoryListResult>('/api/products/categories');
}

export function favoriteProduct(productId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/products/${productId}/favorite`, {});
}

export function unfavoriteProduct(productId: string) {
  return deleteJson<{ success: true }>(`/api/products/${productId}/favorite`);
}

export function fetchProductReviews(
  productId: string,
  options: { page?: number; pageSize?: number } = {},
) {
  const searchParams = new URLSearchParams();
  if (options.page != null) searchParams.set('page', String(options.page));
  if (options.pageSize != null) searchParams.set('pageSize', String(options.pageSize));
  const query = searchParams.toString();
  return getJson<ProductReviewListResult>(
    `/api/products/${productId}/reviews${query ? `?${query}` : ''}`,
  );
}

export function toggleProductReviewHelpful(reviewId: string) {
  return postJson<ToggleProductReviewHelpfulResult, Record<string, never>>(
    `/api/products/reviews/${reviewId}/helpful`,
    {},
  );
}

export function appendProductReview(reviewId: string, payload: AppendProductReviewPayload) {
  return postJson<AppendProductReviewResult, AppendProductReviewPayload>(
    `/api/products/reviews/${reviewId}/append`,
    payload,
  );
}
