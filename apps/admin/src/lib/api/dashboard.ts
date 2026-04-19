import { getJson } from './shared';

export interface AdminDashboardTrendItem {
  date: string;
  bets: number;
  orders: number;
  users: number;
  gmv: number;
}

export interface AdminDashboardDistributionItem {
  type: string;
  value: number;
}

export interface AdminDashboardHotGuess {
  id: string;
  title: string;
  category: string;
  participants: number;
  poolAmount: number;
  endTime: string;
}

export interface AdminDashboardHotProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  stock: number;
  sales: number;
  status: string;
}

export interface AdminDashboardQueueItem {
  id: string;
  title: string;
  count: number;
  tone: 'processing' | 'warning' | 'error';
  description: string;
}

export interface AdminDashboardStats {
  generatedAt: string;
  users: number;
  products: number;
  activeGuesses: number;
  orders: number;
  todayUsers: number;
  todayBets: number;
  todayOrders: number;
  todayGmv: number;
  trend: AdminDashboardTrendItem[];
  orderDistribution: AdminDashboardDistributionItem[];
  guessCategories: AdminDashboardDistributionItem[];
  hotGuesses: AdminDashboardHotGuess[];
  hotProducts: AdminDashboardHotProduct[];
  pendingQueues: AdminDashboardQueueItem[];
}

export function fetchAdminDashboard() {
  return getJson<AdminDashboardStats>('/api/admin/dashboard/stats');
}
