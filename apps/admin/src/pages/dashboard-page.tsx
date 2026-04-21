import { Alert } from 'antd';
import { useEffect, useState } from 'react';

import { fetchAdminDashboard, type AdminDashboardStats } from '../lib/api/dashboard';
import { AdminDashboardContentPanels } from '../components/admin-dashboard-content-panels';
import { AdminDashboardStatGrid } from '../components/admin-dashboard-stat-grid';
import {
  displayDashboardValue,
  emptyDashboardStats,
  type DashboardStatItem,
} from '../lib/admin-dashboard';
import { formatAmount, formatNumber } from '../lib/format';

interface DashboardPageProps {
  refreshToken?: number;
}

export function DashboardPage({ refreshToken = 0 }: DashboardPageProps) {
  const [loading, setLoading] = useState(false);
  const [dashboardIssue, setDashboardIssue] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats>(emptyDashboardStats);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setDashboardIssue(null);
      try {
        const result = await fetchAdminDashboard();
        if (!alive) {
          return;
        }
        setStats(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setStats(emptyDashboardStats);
        setDashboardIssue(
          error instanceof Error ? error.message : '仪表盘数据加载失败',
        );
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const dashboardUnavailable = Boolean(dashboardIssue);
  const summaryStats: DashboardStatItem[] = [
    {
      key: 'users',
      title: '总用户数',
      value: displayDashboardValue(dashboardUnavailable, formatNumber(stats.users)),
    },
    {
      key: 'products',
      title: '在售商品数',
      value: displayDashboardValue(dashboardUnavailable, formatNumber(stats.products)),
    },
    {
      key: 'activeGuesses',
      title: '进行中竞猜',
      value: displayDashboardValue(
        dashboardUnavailable,
        formatNumber(stats.activeGuesses),
      ),
    },
    {
      key: 'orders',
      title: '订单总量',
      value: displayDashboardValue(dashboardUnavailable, formatNumber(stats.orders)),
    },
  ];
  const todayStats: DashboardStatItem[] = [
    {
      key: 'todayUsers',
      title: '今日新增用户',
      value: displayDashboardValue(
        dashboardUnavailable,
        formatNumber(stats.todayUsers),
      ),
    },
    {
      key: 'todayBets',
      title: '今日下注笔数',
      value: displayDashboardValue(dashboardUnavailable, formatNumber(stats.todayBets)),
    },
    {
      key: 'todayOrders',
      title: '今日订单数',
      value: displayDashboardValue(
        dashboardUnavailable,
        formatNumber(stats.todayOrders),
      ),
    },
    {
      key: 'todayGmv',
      title: '今日 GMV',
      value: displayDashboardValue(dashboardUnavailable, formatAmount(stats.todayGmv)),
    },
  ];

  return (
    <div className="page-stack">
      {dashboardUnavailable ? (
        <Alert
          showIcon
          type="error"
          message="仪表盘数据暂不可用"
          description={dashboardIssue}
        />
      ) : null}

      <AdminDashboardStatGrid items={summaryStats} loading={loading} />
      <AdminDashboardStatGrid items={todayStats} loading={loading} />
      <AdminDashboardContentPanels
        dashboardUnavailable={dashboardUnavailable}
        stats={stats}
      />
    </div>
  );
}
