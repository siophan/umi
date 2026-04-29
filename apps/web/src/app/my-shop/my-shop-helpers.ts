'use client';

import type { CategoryId, MyShopStatsResult } from '@umi/shared';

import { fetchMyShop, fetchMyShopStats, fetchShopStatus } from '../../lib/api/shops';
import styles from './page.module.css';

export const shopActions = [
  { icon: '📋', label: '品牌授权' },
  { icon: '➕', label: '上架商品' },
  { icon: '📊', label: '数据统计' },
] as const;

export const shopLogo = '/legacy/images/mascot/mouse-main.png';
export const brandLogoFallback = '/legacy/images/products/p001-lays.jpg';

export function getBrandStatusText(status: string) {
  if (status === 'approved') {
    return '已授权';
  }
  if (status === 'rejected') {
    return '已拒绝';
  }
  return '审核中';
}

export function getShopStatusText(status: string) {
  if (status === 'active') {
    return '✅ 认证商家';
  }
  if (status === 'paused') {
    return '⏸ 暂停营业';
  }
  if (status === 'closed') {
    return '🔒 店铺关闭';
  }
  return `⏳ ${status}`;
}

export function formatDateLabel(value: string | null) {
  if (!value) {
    return '待更新';
  }
  return new Date(value).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

export type ShopStatusData = Awaited<ReturnType<typeof fetchShopStatus>>;
export type ShopData = Awaited<ReturnType<typeof fetchMyShop>>;
export type ShopStatsData = Awaited<ReturnType<typeof fetchMyShopStats>>;

export type ShopFormState = {
  shopName: string;
  categoryId: CategoryId | '';
  reason: string;
};

export const initialShopStatus: ShopStatusData = {
  status: 'none',
  shop: null,
  latestApplication: null,
  categories: [],
};

export const initialShopData: ShopData = {
  shop: null,
  brandAuths: [],
  products: [],
};

export const initialShopStats: ShopStatsData = {
  today: { sales: 0, orders: 0 },
  week: { sales: 0, orders: 0 },
  month: { sales: 0, orders: 0 },
};

function formatYuan(value: number) {
  return Number.isFinite(value) ? value.toFixed(0) : '0';
}

export function buildShopOverview(stats: MyShopStatsResult) {
  return [
    {
      label: '今日',
      value: `¥${formatYuan(stats.today.sales)}`,
      meta: `${stats.today.orders} 单`,
      tone: styles.overviewToday,
    },
    {
      label: '本周',
      value: `¥${formatYuan(stats.week.sales)}`,
      meta: `${stats.week.orders} 单`,
      tone: styles.overviewWeek,
    },
    {
      label: '本月',
      value: `¥${formatYuan(stats.month.sales)}`,
      meta: `${stats.month.orders} 单`,
      tone: styles.overviewMonth,
    },
  ];
}

export function buildMonthChange(stats: MyShopStatsResult) {
  return {
    revenue: `↑ 本月 +¥${formatYuan(stats.month.sales)}`,
    orders: `↑ 本月 +${stats.month.orders} 单`,
  };
}
