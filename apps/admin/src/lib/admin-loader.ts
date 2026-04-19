import type {
  GuessSummary,
  OrderSummary,
  UserSummary,
  WarehouseItem,
} from '@joy/shared';

import {
  fallbackDashboardStats,
  fallbackGuesses,
  fallbackOrders,
  fallbackProducts,
  fallbackUsers,
  fallbackWarehouseItems,
  fallbackWarehouseStats,
  type AdminDashboardStats,
  type AdminProduct,
  type AdminWarehouseStats,
} from './admin-data';
import {
  ApiRequestError,
  fetchAdminDashboard,
  fetchAdminGuesses,
  fetchAdminOrders,
  fetchAdminUsers,
  fetchAdminWarehouseItems,
  fetchWarehouseStats,
} from './api';

export interface AdminRuntimeData {
  dashboard: AdminDashboardStats;
  users: UserSummary[];
  products: AdminProduct[];
  guesses: GuessSummary[];
  orders: OrderSummary[];
  warehouseStats: AdminWarehouseStats;
  warehouseItems: WarehouseItem[];
  usingFallback: boolean;
  issues: string[];
  lastUpdatedAt: string;
}

function normalizeIssue(scope: string, reason: unknown) {
  if (reason instanceof ApiRequestError) {
    return `${scope}: ${reason.message}（HTTP ${reason.status}）`;
  }

  if (reason instanceof Error) {
    return `${scope}: ${reason.message}`;
  }

  return `${scope}: 请求失败`;
}

function fromSettled<T>(
  scope: string,
  result: PromiseSettledResult<T>,
  fallback: T,
) {
  if (result.status === 'fulfilled') {
    return { value: result.value, fallback: false, issue: null };
  }

  return {
    value: fallback,
    fallback: true,
    issue: normalizeIssue(scope, result.reason),
  };
}

export async function loadAdminRuntimeData(): Promise<AdminRuntimeData> {
  const [
    dashboardResult,
    usersResult,
    guessesResult,
    ordersResult,
    warehouseStatsResult,
    virtualWarehouseResult,
    physicalWarehouseResult,
  ] = await Promise.allSettled([
    fetchAdminDashboard(),
    fetchAdminUsers().then((result) => result.items),
    fetchAdminGuesses().then((result) => result.items),
    fetchAdminOrders().then((result) => result.items),
    fetchWarehouseStats(),
    fetchAdminWarehouseItems('virtual').then((result) => result.items),
    fetchAdminWarehouseItems('physical').then((result) => result.items),
  ]);

  const dashboard = fromSettled('仪表盘', dashboardResult, fallbackDashboardStats);
  const users = fromSettled('用户列表', usersResult, fallbackUsers);
  const guesses = fromSettled('竞猜列表', guessesResult, fallbackGuesses);
  const orders = fromSettled('订单列表', ordersResult, fallbackOrders);
  const warehouseStats = fromSettled(
    '仓库统计',
    warehouseStatsResult,
    fallbackWarehouseStats,
  );
  const virtualWarehouse = fromSettled(
    '虚拟仓列表',
    virtualWarehouseResult,
    fallbackWarehouseItems.filter((item) => item.warehouseType === 'virtual'),
  );
  const physicalWarehouse = fromSettled(
    '实体仓列表',
    physicalWarehouseResult,
    fallbackWarehouseItems.filter((item) => item.warehouseType === 'physical'),
  );

  const issues = [
    dashboard.issue,
    users.issue,
    guesses.issue,
    orders.issue,
    warehouseStats.issue,
    virtualWarehouse.issue,
    physicalWarehouse.issue,
  ].filter((issue): issue is string => Boolean(issue));

  return {
    dashboard: dashboard.value,
    users: users.value,
    products: fallbackProducts,
    guesses: guesses.value,
    orders: orders.value,
    warehouseStats: warehouseStats.value,
    warehouseItems: [...virtualWarehouse.value, ...physicalWarehouse.value],
    usingFallback:
      dashboard.fallback ||
      users.fallback ||
      guesses.fallback ||
      orders.fallback ||
      warehouseStats.fallback ||
      virtualWarehouse.fallback ||
      physicalWarehouse.fallback,
    issues,
    lastUpdatedAt: new Date().toISOString(),
  };
}
