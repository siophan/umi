import type {
  ConfirmOrderResult,
  CreateOrderPayload,
  CreateOrderResult,
  OrderDetailResult,
  OrderListResult,
} from '@umi/shared';

import { getJson, postJson } from './shared';

export function fetchOrders() {
  return getJson<OrderListResult>('/api/orders');
}

export function fetchOrderDetail(orderId: string) {
  return getJson<OrderDetailResult>(`/api/orders/${orderId}`);
}

export function createOrder(payload: CreateOrderPayload) {
  return postJson<CreateOrderResult, CreateOrderPayload>('/api/orders', payload);
}

export function confirmOrder(orderId: string) {
  return postJson<ConfirmOrderResult, Record<string, never>>(`/api/orders/${orderId}/confirm`, {});
}

export function urgeOrder(orderId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/orders/${orderId}/urge`, {});
}

export function reviewOrder(orderId: string, payload: { productId: string; rating: number; content?: string }) {
  return postJson<{ success: true }, typeof payload>(`/api/orders/${orderId}/review`, payload);
}
