import type {
  CancelAdminConsignResult,
  CompleteAdminOrderRefundPayload,
  CompleteAdminOrderRefundResult,
  DeliverAdminLogisticsPayload,
  DeliverAdminLogisticsResult,
  OrderItem,
  ReviewAdminOrderRefundPayload,
  ReviewAdminOrderRefundResult,
  ShipAdminOrderPayload,
  ShipAdminOrderResult,
} from '@umi/shared';

import { getJson, putJson } from './shared';

export interface AdminOrderRecord {
  id: string;
  orderSn: string | null;
  userId: string;
  user: {
    id: string;
    uidCode: string | null;
    phoneNumber: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  orderType: 'guess_reward' | 'shop_order' | null;
  orderTypeCode: number | null;
  guessId: string | null;
  guessTitle: string | null;
  amount: number;
  originalAmount: number;
  couponDiscount: number;
  status:
    | 'pending'
    | 'paid'
    | 'shipping'
    | 'delivered'
    | 'completed'
    | 'refund_pending'
    | 'refunded'
    | 'cancelled';
  createdAt: string;
  address: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    detail: string | null;
  } | null;
  fulfillment: {
    id: string;
    fulfillmentSn: string | null;
    typeCode: number | null;
    statusCode: number | null;
    receiverName: string | null;
    phoneNumber: string | null;
    detailAddress: string | null;
    shippingType: 'express' | 'same_city' | 'self_pickup' | 'unknown';
    shippingFee: number;
    totalAmount: number;
    trackingNo: string | null;
    shippedAt: string | null;
    completedAt: string | null;
    createdAt: string | null;
  } | null;
  refund: {
    id: string;
    refundNo: string | null;
    statusCode: number | null;
    refundAmount: number;
    reason: string | null;
    reviewNote: string | null;
    requestedAt: string | null;
    reviewedAt: string | null;
    completedAt: string | null;
  } | null;
  items: Array<
    OrderItem & {
      specs: string | null;
      originalUnitPrice: number;
      couponDiscount: number;
    }
  >;
}

export interface AdminTransactionRow {
  id: string;
  orderId: string;
  orderSn: string | null;
  userId: string;
  userName: string | null;
  channel: string;
  channelDerived: boolean;
  amount: number;
  direction: 'payment' | 'refund';
  statusLabel: string;
  statusCode: number | null;
  sourceTable: 'order' | 'order_refund';
  createdAt: string;
}

export interface AdminLogisticsRow {
  id: string;
  fulfillmentSn: string | null;
  orderId: string | null;
  orderSn: string | null;
  userId: string;
  receiver: string | null;
  phoneNumber: string | null;
  carrier: string;
  carrierDerived: boolean;
  trackingNo: string | null;
  shippingType: 'express' | 'same_city' | 'self_pickup' | 'unknown';
  shippingTypeLabel: string;
  shippingFee: number;
  totalAmount: number;
  status: 'stored' | 'shipping' | 'completed' | 'cancelled';
  statusLabel: string;
  productSummary: string;
  createdAt: string;
  shippedAt: string | null;
  completedAt: string | null;
}

export interface AdminConsignRow {
  id: string;
  tradeNo: string | null;
  physicalItemId: string | null;
  productName: string;
  productImg: string | null;
  userId: string;
  userName: string | null;
  buyerUserId: string | null;
  buyerUserName: string | null;
  orderId: string | null;
  orderSn: string | null;
  price: number;
  listingPrice: number | null;
  commissionAmount: number;
  commissionRate: number | null;
  sellerAmount: number;
  statusCode: number;
  settlementStatusCode: number | null;
  statusLabel: string;
  sourceType: string;
  sourceTypeDerived: boolean;
  createdAt: string;
  listedAt: string | null;
  tradedAt: string | null;
  settledAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
}

export interface AdminConsignListParams {
  page?: number;
  pageSize?: number;
  tradeNo?: string;
  productName?: string;
  sellerUserId?: string;
  orderSn?: string;
  sourceType?: string;
  statusKey?: string;
}

export interface AdminConsignListResult {
  items: AdminConsignRow[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<string, number>;
}

export function fetchAdminOrders() {
  return getJson<{ items: AdminOrderRecord[] }>('/api/admin/orders');
}

export function fetchAdminOrderDetail(id: string) {
  return getJson<AdminOrderRecord>(`/api/admin/orders/${id}`);
}

export function shipAdminOrder(id: string, payload: ShipAdminOrderPayload) {
  return putJson<ShipAdminOrderResult, ShipAdminOrderPayload>(
    `/api/admin/orders/${id}/ship`,
    payload,
  );
}

export function reviewAdminOrderRefund(id: string, payload: ReviewAdminOrderRefundPayload) {
  return putJson<ReviewAdminOrderRefundResult, ReviewAdminOrderRefundPayload>(
    `/api/admin/orders/${id}/refund/review`,
    payload,
  );
}

export function completeAdminOrderRefund(
  id: string,
  payload: CompleteAdminOrderRefundPayload = {},
) {
  return putJson<CompleteAdminOrderRefundResult, CompleteAdminOrderRefundPayload>(
    `/api/admin/orders/${id}/refund/complete`,
    payload,
  );
}

export function fetchAdminTransactions() {
  return getJson<{ items: AdminTransactionRow[] }>('/api/admin/orders/transactions');
}

export function fetchAdminLogistics() {
  return getJson<{ items: AdminLogisticsRow[] }>('/api/admin/orders/logistics');
}

export function fetchAdminLogisticsDetail(id: string) {
  return getJson<AdminLogisticsRow>(`/api/admin/orders/logistics/${id}`);
}

export function deliverAdminLogistics(
  id: string,
  payload: DeliverAdminLogisticsPayload = {},
) {
  return putJson<DeliverAdminLogisticsResult, DeliverAdminLogisticsPayload>(
    `/api/admin/orders/logistics/${id}/deliver`,
    payload,
  );
}

export function fetchAdminConsignRows(params: AdminConsignListParams = {}) {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize));
  if (params.tradeNo) search.set('tradeNo', params.tradeNo);
  if (params.productName) search.set('productName', params.productName);
  if (params.sellerUserId) search.set('sellerUserId', params.sellerUserId);
  if (params.orderSn) search.set('orderSn', params.orderSn);
  if (params.sourceType) search.set('sourceType', params.sourceType);
  if (params.statusKey) search.set('statusKey', params.statusKey);
  const qs = search.toString();
  const url = qs ? `/api/admin/orders/consign?${qs}` : '/api/admin/orders/consign';
  return getJson<AdminConsignListResult>(url);
}

export function fetchAdminConsignDetail(id: string) {
  return getJson<AdminConsignRow>(`/api/admin/orders/consign/${id}`);
}

export function cancelAdminConsign(id: string, reason: string) {
  return putJson<CancelAdminConsignResult, { reason: string }>(
    `/api/admin/orders/consign/${id}/cancel`,
    { reason },
  );
}
