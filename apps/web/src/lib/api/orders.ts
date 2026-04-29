import type {
  ConfirmOrderResult,
  CreateOrderPayload,
  CreateOrderResult,
  FetchOrderPayStatusResult,
  OrderDetailResult,
  OrderListResult,
} from '@umi/shared';

import { getJson, postJson } from './shared';

// 读取当前用户订单列表。
export function fetchOrders() {
  return getJson<OrderListResult>('/api/orders');
}

// 读取单个订单详情。
export function fetchOrderDetail(orderId: string) {
  return getJson<OrderDetailResult>(`/api/orders/${orderId}`);
}

// 创建真实订单（PENDING）+ 取得对应支付链接。
export function createOrder(payload: CreateOrderPayload) {
  return postJson<CreateOrderResult, CreateOrderPayload>('/api/orders', payload);
}

// 主动查询订单支付状态，用于支付回跳页轮询。
export function fetchOrderPayStatus(orderId: string) {
  return getJson<FetchOrderPayStatusResult>(`/api/orders/${orderId}/pay-status`);
}

// 确认收货。
export function confirmOrder(orderId: string) {
  return postJson<ConfirmOrderResult, Record<string, never>>(`/api/orders/${orderId}/confirm`, {});
}

// 催发货。
export function urgeOrder(orderId: string) {
  return postJson<{ success: true }, Record<string, never>>(`/api/orders/${orderId}/urge`, {});
}

// 提交订单评价。
export function reviewOrder(orderId: string, payload: { productId: string; rating: number; content?: string }) {
  return postJson<{ success: true }, typeof payload>(`/api/orders/${orderId}/review`, payload);
}
