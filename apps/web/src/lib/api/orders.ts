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
