'use client';

import { Fragment } from 'react';

import type { CommunityFeedItem, UserSearchItem } from '@umi/shared';

export type SearchFilter = 'all' | 'post' | 'guess' | 'user';

export type HotSearchItem = {
  title: string;
  desc: string;
  tag: string;
  kind: 'hotFire' | 'hotNew' | 'hotBoom';
};

export const HISTORY_KEY = 'cy_search_history';

export const searchFilters = [
  { key: 'all', label: '全部' },
  { key: 'post', label: '动态' },
  { key: 'guess', label: '竞猜' },
  { key: 'user', label: '猜友' },
] as const;

export function formatNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return '刚刚';
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  }
  return `${Math.max(1, Math.floor(diff / day))}天前`;
}

export function highlight(text: string, keyword: string) {
  if (!keyword.trim()) {
    return text;
  }

  const keywordLower = keyword.toLowerCase();
  const pattern = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    part.toLowerCase() === keywordLower ? (
      <em key={`${part}-${index}`}>{part}</em>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    ),
  );
}

export function userDesc(user: UserSearchItem) {
  if (user.shopVerified) {
    return '品牌认证';
  }
  if ((user.winRate ?? 0) > 0) {
    return `胜率${user.winRate}%`;
  }
  if ((user.followers ?? 0) > 0) {
    return `${formatNum(user.followers ?? 0)}粉丝`;
  }
  return '猜友';
}

export function postType(post: CommunityFeedItem): Exclude<SearchFilter, 'all' | 'user'> {
  return post.guessInfo ? 'guess' : 'post';
}

export function postTagClass(post: CommunityFeedItem) {
  if (post.guessInfo || post.author.verified) {
    return 'tagBrand';
  }
  if ((post.tag || '').includes('测评')) {
    return 'tagHot';
  }
  if ((post.tag || '').includes('视频')) {
    return 'tagLive';
  }
  return 'tagCommunity';
}
