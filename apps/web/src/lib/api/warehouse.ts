import type { WarehouseListResult } from '@umi/shared';

import { getJson } from './shared';

export function fetchVirtualWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/virtual');
}

export function fetchPhysicalWarehouse() {
  return getJson<WarehouseListResult>('/api/warehouse/physical');
}
