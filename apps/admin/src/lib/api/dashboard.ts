import type { AdminDashboardStats } from '../admin-data';
import { getJson } from './shared';

export function fetchAdminDashboard() {
  return getJson<AdminDashboardStats>('/api/admin/dashboard/stats');
}
