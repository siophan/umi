import type { WarehouseItem } from '@umi/shared';

import { getJson } from './shared';
import type { AdminWarehouseStats } from './catalog-shared';

export interface AdminWarehouseListParams {
  page?: number;
  pageSize?: number;
  productName?: string;
  sourceType?: string;
  userId?: string;
  status?: string;
}

export interface AdminWarehouseListResult {
  items: WarehouseItem[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<string, number>;
}

export function fetchWarehouseStats() {
  return getJson<AdminWarehouseStats>('/api/warehouse/admin/stats');
}

export function fetchAdminWarehouseItems(
  type: 'virtual' | 'physical',
  params: AdminWarehouseListParams = {},
) {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize));
  if (params.productName) search.set('productName', params.productName);
  if (params.sourceType) search.set('sourceType', params.sourceType);
  if (params.userId) search.set('userId', params.userId);
  if (params.status) search.set('status', params.status);
  const qs = search.toString();
  const url = qs ? `/api/warehouse/admin/${type}?${qs}` : `/api/warehouse/admin/${type}`;
  return getJson<AdminWarehouseListResult>(url);
}

export function fetchAdminWarehouseItemDetail(
  type: 'virtual' | 'physical',
  id: string,
) {
  return getJson<WarehouseItem>(`/api/warehouse/admin/${type}/${id}`);
}
