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
export const FULFILLMENT_COMPLETED = 40;

export const WAREHOUSE_TYPE_VIRTUAL = 10;
export const WAREHOUSE_TYPE_PHYSICAL = 20;

export const WAREHOUSE_LOG_ACTION_INBOUND = 10;
export const WAREHOUSE_LOG_ACTION_LOCK = 20;
export const WAREHOUSE_LOG_ACTION_UNLOCK = 30;
export const WAREHOUSE_LOG_ACTION_OUTBOUND = 40;
export const WAREHOUSE_LOG_ACTION_CONSIGN = 50;

export const WAREHOUSE_OPERATOR_ROLE_SYSTEM = 10;
export const WAREHOUSE_OPERATOR_ROLE_USER = 20;
export const WAREHOUSE_OPERATOR_ROLE_ADMIN = 30;

export type VirtualWarehouseRow = {
  id: number | string;
  user_id: number | string;
  user_name: string | null;
  product_id: number | string | null;
  brand_product_sku_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  sku_text?: string | null;
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
  brand_product_sku_id: number | string | null;
  product_name: string | null;
  product_img: string | null;
  sku_text?: string | null;
  quantity: number | string;
  price: number | string;
  status: number | string;
  consign_price: number | string | null;
  estimate_days: number | string | null;
  created_at: Date | string;
  source_type: string;
  tracking_no?: string | null;
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

function mapPhysicalStatus(code: number): WarehouseItem['status'] {
  if (code === PHYSICAL_STATUS_CONSIGNING) {
    return 'consigning';
  }
  if (code === PHYSICAL_STATUS_FULFILLED) {
    return 'completed';
  }
  return 'stored';
}

export function sanitizeVirtualRow(row: VirtualWarehouseRow): WarehouseItem {
  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.user_id),
    userName: row.user_name || null,
    productId: toEntityId(row.product_id ?? 0),
    brandProductSkuId: toEntityId(row.brand_product_sku_id ?? 0),
    productName: row.product_name || '未命名商品',
    productImg: row.product_img || null,
    skuText: row.sku_text?.trim() || null,
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0) / 100,
    status: mapVirtualStatus(Number(row.status ?? 0)),
    warehouseType: 'virtual',
    sourceType: mapVirtualSourceType(Number(row.source_type ?? 0)),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function sanitizePhysicalRow(row: PhysicalWarehouseRow): WarehouseItem {
  const trackingNo = row.tracking_no?.trim() || null;
  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.user_id),
    userName: row.user_name || null,
    productId: toEntityId(row.product_id ?? 0),
    brandProductSkuId: toEntityId(row.brand_product_sku_id ?? 0),
    productName: row.product_name || '未命名商品',
    productImg: row.product_img || null,
    skuText: row.sku_text?.trim() || null,
    quantity: Number(row.quantity ?? 0),
    price: Number(row.price ?? 0) / 100,
    status: mapPhysicalRowStatus(row.status),
    warehouseType: 'physical',
    sourceType: row.source_type,
    consignPrice: row.consign_price === null ? null : Number(row.consign_price ?? 0) / 100,
    estimateDays: row.estimate_days === null ? null : Number(row.estimate_days ?? 0),
    tracking: trackingNo ? { carrier: '', trackingNo } : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * `branch 1`（fulfillment_order 驱动）已经把 status 列预先映射成 'shipping' / 'completed' 字符串；
 * `branch 2`（physical_warehouse 驱动）依旧是数字状态码。这里两种来源都兼容。
 */
function mapPhysicalRowStatus(status: number | string): WarehouseItem['status'] {
  if (typeof status === 'string') {
    if (status === 'shipping' || status === 'completed' || status === 'delivered' || status === 'consigning') {
      return status;
    }
    return 'stored';
  }
  return mapPhysicalStatus(Number(status ?? 0));
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
