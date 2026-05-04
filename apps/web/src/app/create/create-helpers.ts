import type { ProductFeedItem, SearchHotKeywordItem, SocialUserItem } from '@umi/shared';

export type TemplateId = 'pk_friend' | 'duel' | 'multi' | 'number';

export type TopicItem = {
  text: string;
  icon: string;
  hot?: boolean;
};

export type ProductItem = {
  id: string;
  name: string;
  brand: string;
  shopName: string | null;
  category: string;
  price: number;
  guessPrice: number;
  originalPrice: number;
  sales: number;
  rating: number;
  stock: number;
  img: string;
};

export type FriendItem = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  status: string | null;
  winRate: number | null;
};

export const templates: Array<{
  id: TemplateId;
  icon: string;
  name: string;
  desc: string;
  merchantOnly?: boolean;
  comingSoon?: boolean;
}> = [
  { id: 'duel', icon: '⚖️', name: '二选一', desc: 'A vs B 经典对决', merchantOnly: true },
  { id: 'multi', icon: '🎯', name: '多选竞猜', desc: '多个选项自由选', merchantOnly: true },
  { id: 'number', icon: '🔢', name: '数值预测', desc: '猜数字范围', merchantOnly: true, comingSoon: true },
  { id: 'pk_friend', icon: '⚔️', name: '好友PK', desc: '邀请好友 1V1 或多人混战' },
];

export function mapProductFeedToCreateProduct(item: ProductFeedItem): ProductItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    shopName: item.shopName,
    category: item.category,
    price: item.price,
    guessPrice: item.guessPrice,
    originalPrice: item.originalPrice,
    sales: item.sales,
    rating: item.rating,
    stock: item.stock,
    img: item.img,
  };
}

export function mapSocialUserToCreateFriend(item: SocialUserItem): FriendItem {
  const online = item.status === 'online';

  return {
    id: item.id,
    name: item.name,
    avatar: item.avatar ?? '',
    online,
    status: item.status ?? null,
    winRate: typeof item.winRate === 'number' ? Math.round(item.winRate) : null,
  };
}

export function mapSearchHotKeywordToCreateTopic(item: SearchHotKeywordItem): TopicItem {
  return {
    text: item.keyword,
    icon: item.source === 'guess' ? '🎯' : '🔥',
    hot: item.badge === '热',
  };
}

export function formatSalesLabel(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export function getDiscountPercent(item: ProductItem) {
  if (!item.originalPrice || item.originalPrice <= item.guessPrice) {
    return 0;
  }
  return Math.round((1 - item.guessPrice / item.originalPrice) * 100);
}
