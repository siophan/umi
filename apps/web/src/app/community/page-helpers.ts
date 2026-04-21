import type { CommunityFeedItem as CommunityFeedApiItem } from '@umi/shared';

import styles from './page.module.css';

export type Scope = 'public' | 'friends' | 'fans' | 'followers' | 'private';
export type PublishScope = 'public' | 'followers' | 'private';

export type FeedItem = {
  id: string;
  author: {
    uid?: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  tag: { text: string; cls: string };
  title: string;
  desc: string;
  images: string[];
  guessInfo?: {
    id: string;
    options: [string, string];
    participants: number;
    pcts: [number, number];
  };
  likes: number;
  comments: number;
  shares: number;
  time: string;
  liked?: boolean;
  bookmarked?: boolean;
  scope?: Scope;
};

export type FollowUser = {
  id: string;
  uid?: string;
  name: string;
  avatar: string;
  hasNew: boolean;
};

export type HotTopic = {
  text: string;
  desc: string;
  href: string;
};

export const TAG_CLS_MAP: Record<string, string> = {
  品牌竞猜: styles.tagBrand,
  猜友动态: styles.tagCommunity,
  品牌资讯: styles.tagBrand,
  零食测评: styles.tagHot,
  PK战报: styles.tagPk,
  平台公告: styles.tagBrand,
  店铺动态: styles.tagHot,
  店铺推荐: styles.tagHot,
  转发: styles.tagCommunity,
};

export const SCOPE_META: Record<
  Scope,
  { label: string; desc: string; icon: string; iconClass: string; feedLabel?: string }
> = {
  public: {
    label: '所有人',
    desc: '所有猜友都可以看到',
    icon: 'fa-earth-americas',
    iconClass: styles.scopeIconPublic,
  },
  friends: {
    label: '好友',
    desc: '仅互相关注的好友可见',
    icon: 'fa-user-group',
    iconClass: styles.scopeIconFriends,
    feedLabel: '好友可见',
  },
  fans: {
    label: '粉丝',
    desc: '仅关注你的粉丝可见',
    icon: 'fa-heart',
    iconClass: styles.scopeIconFans,
    feedLabel: '粉丝可见',
  },
  followers: {
    label: '粉丝',
    desc: '仅关注你的粉丝可见',
    icon: 'fa-heart',
    iconClass: styles.scopeIconFans,
    feedLabel: '粉丝可见',
  },
  private: {
    label: '仅自己',
    desc: '仅自己可见，用于保存草稿',
    icon: 'fa-lock',
    iconClass: styles.scopeIconPrivate,
    feedLabel: '仅自己',
  },
};

export const defaultFollowedUsers: FollowUser[] = [
  { id: 'brand-1', uid: 'brand-1', name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', hasNew: true },
  { id: 'friend-1', uid: 'friend-1', name: '零食达人小王', avatar: '/legacy/images/mascot/mouse-main.png', hasNew: false },
  { id: 'brand-2', uid: 'brand-2', name: '三只松鼠', avatar: '/legacy/images/products/p003-squirrels.jpg', hasNew: false },
  { id: 'friend-2', uid: 'friend-2', name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', hasNew: true },
];

export const topicOptions = ['🎯 竞猜心得', '🍿 零食测评', '🤝 PK战报', '🔥 热门话题', '📊 数据分析', '💡 攻略分享'];

export const emojiCategories = {
  '😀 表情': ['😀', '😃', '😄', '😁', '😆', '😂', '🙂', '😊', '🥰', '😍', '😎', '🤔', '😮', '😢', '😭', '🥳'],
  '👍 手势': ['👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '👌', '✌️', '🤞', '❤️', '🔥'],
  '🎉 活动': ['🎉', '🎊', '🎈', '🎁', '🎯', '🏆', '🥇', '💰', '⭐', '🌟', '✨', '💥'],
  '🍕 美食': ['🍿', '🥤', '🍫', '🍬', '🍪', '🥜', '🍓', '🍍', '🍋', '🌶️', '🍕', '🍔'],
} as const;

export type EmojiCategory = keyof typeof emojiCategories;

export const myProfile = {
  name: '我',
  avatar: '/legacy/images/mascot/mouse-main.png',
};

export function fmtNum(value: number) {
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
  if (diff < 7 * day) {
    return `${Math.max(1, Math.floor(diff / day))}天前`;
  }
  return new Date(value).toISOString().slice(0, 10);
}

export function mapCommunityFeedItem(item: CommunityFeedApiItem): FeedItem {
  const tagText = item.tag?.trim() || '猜友动态';
  return {
    id: item.id,
    author: {
      uid: item.author.uid,
      name: item.author.name,
      avatar: item.author.avatar || '/legacy/images/mascot/mouse-main.png',
      verified: item.author.verified,
    },
    tag: {
      text: tagText,
      cls: TAG_CLS_MAP[tagText] ?? styles.tagCommunity,
    },
    title: item.title,
    desc: item.desc,
    images: item.images,
    guessInfo: item.guessInfo
      ? {
          id: item.guessInfo.id,
          options: item.guessInfo.options,
          participants: item.guessInfo.participants,
          pcts: item.guessInfo.pcts,
        }
      : undefined,
    likes: item.likes,
    comments: item.comments,
    shares: item.shares,
    time: formatRelativeTime(item.createdAt),
    liked: item.liked,
    bookmarked: item.bookmarked,
    scope: item.scope,
  };
}

function normalizePostPreviewText(value: string | null | undefined) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function shouldRenderStandaloneTitle(title: string | null | undefined, desc: string | null | undefined) {
  const normalizedTitle = normalizePostPreviewText(title);
  if (!normalizedTitle) {
    return false;
  }

  const normalizedDesc = normalizePostPreviewText(desc);
  if (!normalizedDesc) {
    return true;
  }

  return normalizedTitle !== normalizedDesc;
}

export function getScopeLabel(scope: PublishScope) {
  return SCOPE_META[scope].label;
}
