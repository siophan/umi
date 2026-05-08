import type { WarehouseListResult, WarehouseShipPayload, WarehouseShipResult } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getJson, postJson } from './shared';

export function fetchVirtualWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/virtual');
}

export function fetchPhysicalWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/physical');
}

export function consignWarehouseItem(id: string, price: number) {
  return postJson<{ success: true; estimateDays: number }, { price: number }>(
    `/api/warehouse/physical/${encodeURIComponent(id)}/consign`,
    { price },
  );
}

export function cancelConsignWarehouseItem(id: string) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/warehouse/physical/${encodeURIComponent(id)}/cancel-consign`,
    {},
  );
}

export function shipWarehouseItem(id: string, addressId: string) {
  return postJson<WarehouseShipResult, WarehouseShipPayload>(
    `/api/warehouse/${encodeURIComponent(id)}/ship`,
    { addressId: toEntityId(addressId) },
  );
}
