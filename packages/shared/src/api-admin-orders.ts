import type { EntityId } from './domain';

export type AdminOrderShippingType = 'express' | 'same_city' | 'self_pickup';

export interface ShipAdminOrderPayload {
  shippingType: AdminOrderShippingType;
  trackingNo?: string | null;
}

export interface ShipAdminOrderResult {
  id: EntityId;
  fulfillmentId: EntityId;
  fulfillmentStatus: 'shipped';
  shippingType: AdminOrderShippingType;
  trackingNo: string | null;
  shippedAt: string;
}

export interface ReviewAdminOrderRefundPayload {
  status: 'approved' | 'rejected';
  reviewNote?: string | null;
}

export interface ReviewAdminOrderRefundResult {
  id: EntityId;
  refundId: EntityId;
  status: 'approved' | 'rejected';
  reviewedAt: string;
}

export interface CompleteAdminOrderRefundPayload {}

export interface CompleteAdminOrderRefundResult {
  id: EntityId;
  refundId: EntityId;
  status: 'completed';
  completedAt: string;
}
