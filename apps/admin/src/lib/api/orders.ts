import type { OrderListResult } from '@joy/shared';

import type {
  AdminConsignRow,
  AdminLogisticsRow,
  AdminTransactionRow,
} from '../admin-data';
import { getJson } from './shared';

export function fetchAdminOrders() {
  return getJson<OrderListResult>('/api/admin/orders');
}

export function fetchAdminTransactions() {
  return getJson<{ items: AdminTransactionRow[] }>('/api/admin/orders/transactions');
}

export function fetchAdminLogistics() {
  return getJson<{ items: AdminLogisticsRow[] }>('/api/admin/orders/logistics');
}

export function fetchAdminConsignRows() {
  return getJson<{ items: AdminConsignRow[] }>('/api/admin/orders/consign');
}
