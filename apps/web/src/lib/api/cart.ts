import type {
  AddCartItemPayload,
  CartListResult,
  CartMutationResult,
  UpdateCartItemPayload,
} from '@umi/shared';

import { deleteJson, getJson, postJson, putJson } from './shared';

export function fetchCart() {
  return getJson<CartListResult>('/api/cart');
}

export function addCartItem(payload: AddCartItemPayload) {
  return postJson<CartMutationResult, AddCartItemPayload>('/api/cart/items', payload);
}

export function updateCartItem(cartItemId: string, payload: UpdateCartItemPayload) {
  return putJson<CartMutationResult, UpdateCartItemPayload>(`/api/cart/items/${cartItemId}`, payload);
}

export function removeCartItem(cartItemId: string) {
  return deleteJson<CartMutationResult>(`/api/cart/items/${cartItemId}`);
}
