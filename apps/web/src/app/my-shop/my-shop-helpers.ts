'use client';

import type { CategoryId } from '@umi/shared';

import { fetchMyShop, fetchShopStatus } from '../../lib/api/shops';
import styles from './page.module.css';

export const shopActions = [
  { icon: '📋', label: '品牌授权' },
  { icon: '➕', label: '上架商品' },
  { icon: '📊', label: '数据统计' },
] as const;

export const shopLogo = '/legacy/images/mascot/mouse-main.png';

export const brandLogoMap: Record<string, string> = {
  乐事: '/legacy/images/products/p001-lays.jpg',
  德芙: '/legacy/images/products/p007-dove.jpg',
  旺旺: '/legacy/images/products/p006-wangwang.jpg',
  良品铺子: '/legacy/images/products/p005-liangpin.jpg',
  三只松鼠: '/legacy/images/products/p003-squirrels.jpg',
};

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

export function buildShopOverview(
  revenue: string,
  orderCount: number,
  approvedBrandCount: number,
) {
  return [
    { label: '累计收入', value: revenue, meta: '当前店铺累计成交金额', tone: styles.overviewToday },
    { label: '累计订单', value: `${orderCount}`, meta: '当前店铺累计履约单量', tone: styles.overviewWeek },
    { label: '品牌授权', value: `${approvedBrandCount}`, meta: '已通过授权品牌数', tone: styles.overviewMonth },
  ];
}
