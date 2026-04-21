import type { WarehouseItem, WarehouseListResult } from '@umi/shared';

import { getJson } from './shared';
import type { AdminWarehouseStats } from './catalog-shared';

export function fetchWarehouseStats() {
  return getJson<AdminWarehouseStats>('/api/warehouse/admin/stats');
}

export function fetchAdminWarehouseItems(type: 'virtual' | 'physical') {
  return getJson<WarehouseListResult>(`/api/warehouse/admin/${type}`);
}

export function fetchAdminWarehouseItemDetail(
  type: 'virtual' | 'physical',
  id: string,
) {
  return getJson<WarehouseItem>(`/api/warehouse/admin/${type}/${id}`);
}
