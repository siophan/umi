import type { UserSearchItem } from '@umi/shared';

import styles from './page.module.css';

export const shortcuts: ReadonlyArray<{
  label: string;
  href: string;
  icon: string;
  badge?: boolean;
}> = [
  { label: '我的店铺', href: '/my-shop', icon: 'fa-solid fa-store' },
  { label: '我的仓库', href: '/warehouse', icon: 'fa-solid fa-box-archive', badge: true },
  { label: '我的订单', href: '/orders', icon: 'fa-solid fa-bag-shopping', badge: true },
  { label: '我的竞猜', href: '/guess-history', icon: 'fa-solid fa-clock-rotate-left' },
  { label: '全部功能', href: '/features', icon: 'fa-solid fa-ellipsis' },
];

export type ActivityPost = {
  id: string;
  title: string;
  desc: string;
  tag: string | null;
  images: string[];
  likes: number;
  comments: number;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
};

export const tagClassMap: Record<string, string> = {
  品牌竞猜: styles.tagBrand,
  品牌资讯: styles.tagBrand,
  新品预告: styles.tagBrand,
  平台公告: styles.tagBrand,
  猜友动态: styles.tagCommunity,
  转发: styles.tagCommunity,
  竞猜分享: styles.tagGuess,
  竞猜预测: styles.tagGuess,
  PK战报: styles.tagPk,
  零食测评: styles.tagHot,
  零食分享: styles.tagHot,
  零食开箱: styles.tagHot,
  店铺动态: styles.tagHot,
  店铺推荐: styles.tagHot,
};

export function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

export function formatTimeLabel(value: string) {
  if (!value) {
    return '';
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}天前`;
  }
  return new Date(value).toLocaleDateString('zh-CN');
}

export function buildSearchItemDesc(item: UserSearchItem) {
  if (item.shopVerified && item.shopName) {
    return `认证店铺 · ${item.shopName}`;
  }
  if ((item.followers || 0) > 0) {
    return `${formatCount(item.followers || 0)}粉丝 · 胜率${item.winRate || 0}%`;
  }
  if ((item.totalGuess || 0) > 0) {
    return `竞猜 ${item.totalGuess} 次 · 胜场 ${item.wins || 0}`;
  }
  if (item.signature?.trim()) {
    return item.signature.trim();
  }
  return `Lv.${item.level || 1}`;
}

export function getSearchRelationLabel(relation: UserSearchItem['relation']) {
  if (relation === 'friend') {
    return '好友';
  }
  if (relation === 'following') {
    return '已关注';
  }
  if (relation === 'fan') {
    return '粉丝';
  }
  if (relation === 'self') {
    return '我';
  }
  return '查看';
}
