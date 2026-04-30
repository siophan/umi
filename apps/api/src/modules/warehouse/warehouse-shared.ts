import type { WarehouseItem } from '@umi/shared';
import { toEntityId } from '@umi/shared';

export const VIRTUAL_STATUS_STORED = 10;
export const VIRTUAL_STATUS_LOCKED = 20;
export const VIRTUAL_STATUS_CONVERTED = 30;

export const PHYSICAL_STATUS_STORED = 10;
export const PHYSICAL_STATUS_CONSIGNING = 20;
export const PHYSICAL_STATUS_FULFILLED = 30;

export const FULFILLMENT_PENDING = 10;
export const FULFILLMENT_PROCESSING = 20;
export const FULFILLMENT_SHIPPED = 30;

export type VirtualWarehouseRow = {
  id: number | string;
  user_id: number | string;
  user_name: string | null;
  product_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  quantity: number | string;
  price: number | string;
  source_type: number | string | null;
  status: number | string;
  created_at: Date | string;
};

export type PhysicalWarehouseRow = {
  id: number | string;
  user_id: number | string;
  user_name: string | null;
  product_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  quantity: number | string;
  price: number | string;
  status: number | string;
  consign_price: number | string | null;
  estimate_days: number | string | null;
  created_at: Date | string;
  source_type: string;
};

function mapVirtualSourceType(code: number) {
  if (code === 10) {
    return '竞猜奖励';
  }
  if (code === 20) {
    return '订单入仓';
  }
  if (code === 30) {
    return '兑换入仓';
  }
  return '手工入仓';
}

export function virtualStatusLabelToCode(label: string): number | null {
  switch (label) {
    case 'stored':
      return VIRTUAL_STATUS_STORED;
    case 'locked':
      return VIRTUAL_STATUS_LOCKED;
    case 'converted':
      return VIRTUAL_STATUS_CONVERTED;
    default:
      return null;
  }
}

export function physicalStatusLabelToCode(label: string): number | null {
  switch (label) {
    case 'stored':
      return PHYSICAL_STATUS_STORED;
    case 'consigning':
      return PHYSICAL_STATUS_CONSIGNING;
    case 'completed':
      return PHYSICAL_STATUS_FULFILLED;
    default:
      return null;
  }
}

function mapVirtualStatus(code: number): WarehouseItem['status'] {
  if (code === VIRTUAL_STATUS_LOCKED) {
    return 'locked';
  }
  if (code === VIRTUAL_STATUS_CONVERTED) {
    return 'converted';
  }
  return 'stored';
}

export function sanitizeVirtualRow(row: VirtualWarehouseRow): WarehouseItem {
  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.user_id),
    userName: row.user_name || null,
    productId: toEntityId(row.product_id ?? 0),
    productName: row.product_name || '未命名商品',
    productImg: row.product_img || null,
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0) / 100,
    status: mapVirtualStatus(Number(row.status ?? 0)),
    warehouseType: 'virtual',
    sourceType: mapVirtualSourceType(Number(row.source_type ?? 0)),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function sanitizePhysicalRow(row: PhysicalWarehouseRow): WarehouseItem {
  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.user_id),
    userName: row.user_name || null,
    productId: toEntityId(row.product_id ?? 0),
    productName: row.product_name || '未命名商品',
    productImg: row.product_img || null,
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0) / 100,
    status: row.status as WarehouseItem['status'],
    warehouseType: 'physical',
    sourceType: row.source_type,
    consignPrice: row.consign_price === null ? null : Number(row.consign_price ?? 0) / 100,
    estimateDays: row.estimate_days === null ? null : Number(row.estimate_days ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function computeEstimateDays(priceYuan: number, marketPriceYuan: number): number {
  if (marketPriceYuan <= 0) return 5;
  const ratio = priceYuan / marketPriceYuan;
  if (ratio <= 0.85) return 2;
  if (ratio <= 0.95) return 3;
  if (ratio <= 1.05) return 5;
  return 7;
}

export function getRouteIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
