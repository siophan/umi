import type { CommunityFeedItem, CommunityPostDetailResult } from '@umi/shared';

import styles from './page.module.css';

export const TAG_CLS_MAP: Record<string, string> = {
  品牌竞猜: styles.tagBrand,
  猜友动态: styles.tagGuess,
  品牌资讯: styles.tagBrand,
  零食测评: styles.tagHot,
  PK战报: styles.tagGuess,
  平台公告: styles.tagBrand,
  店铺动态: styles.tagHot,
  店铺推荐: styles.tagHot,
  转发: styles.tagGuess,
};

export const EMOJIS = ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😢', '😡', '🥳', '🎉', '🔥', '❤️', '👍', '👎', '🙏', '💪', '🎯', '🏆', '✅', '⭐', '💰', '🎁', '🍕'];

export const REPORT_REASON_OPTIONS = [
  { value: 10 as const, label: '垃圾广告' },
  { value: 20 as const, label: '低俗色情' },
  { value: 30 as const, label: '人身攻击' },
  { value: 40 as const, label: '虚假信息' },
  { value: 90 as const, label: '其他原因' },
];

export type ReplyTarget = {
  id: CommunityPostDetailResult['comments'][number]['id'];
  name: string;
};

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

export function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

export function guessLabel(post: CommunityFeedItem) {
  return post.tag?.trim() || '猜友动态';
}

export function mapCommentTree(
  items: CommunityPostDetailResult['comments'],
  targetId: string,
  update: (item: CommunityPostDetailResult['comments'][number]) => CommunityPostDetailResult['comments'][number],
): CommunityPostDetailResult['comments'] {
  return items.map((item) => {
    if (item.id === targetId) {
      return update(item);
    }
    if (item.replies?.length) {
      return {
        ...item,
        replies: mapCommentTree(item.replies, targetId, update),
      };
    }
    return item;
  });
}

export function appendReplyToTree(
  items: CommunityPostDetailResult['comments'],
  targetId: string,
  reply: CommunityPostDetailResult['comments'][number],
): CommunityPostDetailResult['comments'] {
  return items.map((item) => {
    if (item.id === targetId) {
      return {
        ...item,
        replies: [...(item.replies ?? []), reply],
      };
    }
    if (item.replies?.length) {
      return {
        ...item,
        replies: appendReplyToTree(item.replies, targetId, reply),
      };
    }
    return item;
  });
}

export function findTopLevelCommentIdByReplyId(
  items: CommunityPostDetailResult['comments'],
  replyId: string,
): CommunityPostDetailResult['comments'][number]['id'] | null {
  for (const item of items) {
    if (item.id === replyId) {
      return item.id;
    }
    if (item.replies?.some((reply) => reply.id === replyId)) {
      return item.id;
    }
  }
  return null;
}
