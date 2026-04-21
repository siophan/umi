import type { AdminDashboardStats } from './api/dashboard';

export interface DashboardStatItem {
  key: string;
  title: string;
  value: string;
}

export const emptyDashboardStats: AdminDashboardStats = {
  generatedAt: '',
  users: 0,
  products: 0,
  activeGuesses: 0,
  orders: 0,
  todayUsers: 0,
  todayBets: 0,
  todayOrders: 0,
  todayGmv: 0,
  trend: [],
  orderDistribution: [],
  guessCategories: [],
  hotGuesses: [],
  hotProducts: [],
  pendingQueues: [],
};

export function ratio(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function displayDashboardValue(
  dashboardUnavailable: boolean,
  value: string,
) {
  return dashboardUnavailable ? '--' : value;
}

