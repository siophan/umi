import type { GuessSummary } from '@umi/shared';

import styles from './page.module.css';

export type FriendsTab = 'friends' | 'following' | 'fans' | 'requests';
export type FriendSort = 'online' | 'winRate' | 'name';

export type FriendItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  winRate: number;
  level: number;
  streak: number;
  bio: string;
};

export type FollowingItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  verified: boolean;
  desc: string;
  fans: number;
  posts: number;
  tag: string;
  mutual: boolean;
  followed: boolean;
};

export type FanItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  winRate: number;
  bio: string;
  time: string;
  followedBack: boolean;
  isNew: boolean;
};

export type RequestItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  mutualFriends: number;
  winRate: number;
  status: 'pending' | 'accepted' | 'rejected';
};

export type HotGuessItem = {
  id: string;
  title: string;
  hot: number;
  icon: string;
  participants: number;
  options: [string, string];
};

export const myAvatar = '/legacy/images/mascot/mouse-main.png';

export const quickActions = [
  { label: '邀请好友', icon: '📨', tone: 'blue' as const },
  { label: '排行榜', icon: '🏆', tone: 'orange' as const },
  { label: 'PK记录', icon: '⚔️', tone: 'purple' as const },
  { label: '社区', icon: '💬', tone: 'green' as const },
];

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatFans(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return String(value);
}

export function winRateClass(value: number) {
  if (value >= 65) {
    return styles.winHigh;
  }
  if (value >= 50) {
    return styles.winMid;
  }
  return styles.winLow;
}

export function normalizeFriend(item: any, index: number): FriendItem {
  return {
    id: String(item.id || item.friendId || `friend-${index}`),
    uid: String(item.uid || item.uidCode || item.id || item.friendId || `friend-${index}`),
    name: item.name || item.friendName || '未知用户',
    avatar: item.avatar || item.friendAvatar || myAvatar,
    status: item.status === 'online' || item.online ? 'online' : 'offline',
    winRate: Number(item.winRate ?? 0),
    level: Number(item.level ?? 1),
    streak: Number(item.streak ?? 0),
    bio: item.bio || item.signature || '这个人很懒，还没有留下签名。',
  };
}

export function normalizeFollowing(item: any, index: number, mutual = false): FollowingItem {
  return {
    id: String(item.id || `following-${index}`),
    uid: String(item.uid || item.uidCode || item.id || `following-${index}`),
    name: item.name || '未知用户',
    avatar: item.avatar || myAvatar,
    verified: Boolean(item.shopVerified ?? item.verified),
    desc: item.desc || item.signature || '暂无简介',
    fans: Number(item.followers ?? item.fans ?? 0),
    posts: Number(item.posts ?? 0),
    tag: item.tag || (item.shopVerified ? '品牌' : '猜友'),
    mutual: Boolean(item.mutual ?? mutual),
    followed: true,
  };
}

export function normalizeFan(item: any, index: number, followedBack = false): FanItem {
  return {
    id: String(item.id || `fan-${index}`),
    uid: String(item.uid || item.uidCode || item.id || `fan-${index}`),
    name: item.name || '未知用户',
    avatar: item.avatar || myAvatar,
    winRate: Number(item.winRate ?? 0),
    bio: item.bio || item.signature || '这个人很懒，还没有留下签名。',
    time: item.time || item.createdAt || '',
    followedBack: Boolean(item.followedBack ?? followedBack),
    isNew: Boolean(item.isNew ?? false),
  };
}

export function normalizeRequest(item: any, index: number): RequestItem {
  return {
    id: String(item.id || `request-${index}`),
    uid: String(item.uid || item.uidCode || item.id || `request-${index}`),
    name: item.name || '未知用户',
    avatar: item.avatar || myAvatar,
    message: item.message || item.msg || '请求添加你为好友',
    time: item.time || item.createdAt || '',
    mutualFriends: Number(item.mutualFriends ?? 0),
    winRate: Number(item.winRate ?? 0),
    status: 'pending',
  };
}

function guessIcon(category: string) {
  if (category.includes('体育') || category.includes('足球') || category.includes('篮球')) {
    return '⚽';
  }
  if (category.includes('科技') || category.includes('数码')) {
    return '📱';
  }
  if (category.includes('影视') || category.includes('娱乐')) {
    return '🎬';
  }
  if (category.includes('财经') || category.includes('金融')) {
    return '₿';
  }
  if (category.includes('零食') || category.includes('美食')) {
    return '🍿';
  }
  return '🎯';
}

export function normalizeHotGuess(item: GuessSummary): HotGuessItem {
  const participants = item.options.reduce((sum, option) => sum + Number(option.voteCount ?? 0), 0);
  return {
    id: item.id,
    title: item.title,
    hot: participants,
    icon: guessIcon(item.category),
    participants,
    options: [item.options[0]?.optionText || '选项A', item.options[1]?.optionText || '选项B'],
  };
}
