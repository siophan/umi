import type { ProductFeedItem, SocialUserItem } from '@umi/shared';

export type TemplateId = 'pk' | 'duel' | 'multi' | 'number';
export type CouponType = 'full_reduce' | 'discount' | 'no_threshold';

export const templates: Array<{
  id: TemplateId;
  icon: string;
  name: string;
  desc: string;
  merchantOnly?: boolean;
}> = [
  { id: 'duel', icon: '⚖️', name: '二选一', desc: 'A vs B 经典对决', merchantOnly: true },
  { id: 'multi', icon: '🎯', name: '多选竞猜', desc: '多个选项自由选', merchantOnly: true },
  { id: 'number', icon: '🔢', name: '数值预测', desc: '猜数字范围', merchantOnly: true },
  { id: 'pk', icon: '🤝', name: '好友PK', desc: '邀请好友对战' },
];

export const hotTopicsPool = [
  { text: '乐事新口味谁更能打？', icon: '🔥', hot: true },
  { text: '哪款礼盒更适合送人', icon: '🎁' },
  { text: '猜猜本周爆单商品', icon: '📈' },
  { text: '今年最强春季限定零食', icon: '🌸' },
  { text: '哪款新品会最先卖空', icon: '⏱️' },
  { text: '猜猜下一个爆款联名零食', icon: '🎁', hot: true },
  { text: '辣条哪个品牌最好吃？', icon: '🌶️' },
  { text: '猜猜本周销量冠军是谁？', icon: '🏆' },
  { text: '甜味VS咸味，永恒的对决', icon: '🧂' },
  { text: '这个月谁能吃零食吃得最少？', icon: '😂' },
  { text: '新出的限定口味好不好吃？', icon: '✨', hot: true },
  { text: '猜猜双11零食销量排行', icon: '📊' },
  { text: '健康零食VS快乐零食，你站哪队？', icon: '💪' },
  { text: '谁能猜中下一个网红零食？', icon: '📱' },
  { text: '猜猜今年最佳零食包装设计', icon: '🎨' },
  { text: '进口零食VS国产零食，你更爱哪个？', icon: '🌍' },
  { text: '猜猜春节零食礼盒谁最受欢迎', icon: '🎊', hot: true },
];

export const topicsPerPage = 6;
export const initialOptions = ['番茄味最畅销', '黄瓜味逆袭'];

export const friends = [
  { id: 'f1', name: '小米', avatar: '/legacy/images/mascot/mouse-main.png', online: true, status: 'online', winRate: 68 },
  { id: 'f2', name: '阿星', avatar: '/legacy/images/mascot/mouse-happy.png', online: true, status: 'online', winRate: 68 },
  { id: 'f3', name: '雨桐', avatar: '/legacy/images/mascot/mouse-casual.png', online: false, status: 'offline', winRate: 52 },
  { id: 'f4', name: '零食猎人', avatar: '/legacy/images/products/p007-dove.jpg', online: true, status: 'online', winRate: 68 },
];

export const products = [
  {
    id: 'p001',
    name: '乐事原味薯片大礼包',
    brand: '乐事官方旗舰店',
    category: '薯片',
    price: 49.9,
    originalPrice: 69.9,
    sales: '1.2万',
    rating: '4.9',
    stock: 128,
    img: '/legacy/images/products/p001-lays.jpg',
  },
  {
    id: 'p002',
    name: '奥利奥夹心零食礼盒',
    brand: '奥利奥品牌馆',
    category: '饼干',
    price: 39.9,
    originalPrice: 52.9,
    sales: '8.6k',
    rating: '4.8',
    stock: 86,
    img: '/legacy/images/products/p002-oreo.jpg',
  },
  {
    id: 'p003',
    name: '每日坚果混合礼袋',
    brand: '三只松鼠旗舰店',
    category: '坚果',
    price: 59.9,
    originalPrice: 79.9,
    sales: '6.3k',
    rating: '4.7',
    stock: 54,
    img: '/legacy/images/products/p005-nuts.jpg',
  },
  {
    id: 'p004',
    name: '费列罗节日分享装',
    brand: '费列罗官方旗舰店',
    category: '巧克力',
    price: 89.9,
    originalPrice: 109.9,
    sales: '4.2k',
    rating: '4.9',
    stock: 36,
    img: '/legacy/images/products/p006-ferrero.jpg',
  },
];

export type ProductItem = (typeof products)[number];
export type FriendItem = (typeof friends)[number];

export function mapProductFeedToCreateProduct(item: ProductFeedItem): ProductItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    price: item.price,
    originalPrice: item.originalPrice,
    sales: item.sales >= 10000 ? `${(item.sales / 10000).toFixed(1)}万` : item.sales >= 1000 ? `${(item.sales / 1000).toFixed(1)}k` : String(item.sales),
    rating: item.rating.toFixed(1),
    stock: item.stock,
    img: item.img,
  };
}

export function mapSocialUserToCreateFriend(item: SocialUserItem, index: number): FriendItem {
  const fallbackAvatars = [
    '/legacy/images/mascot/mouse-main.png',
    '/legacy/images/mascot/mouse-happy.png',
    '/legacy/images/mascot/mouse-casual.png',
    '/legacy/images/products/p007-dove.jpg',
  ];

  const online = item.status === 'online';

  return {
    id: item.id,
    name: item.name,
    avatar: item.avatar || fallbackAvatars[index % fallbackAvatars.length],
    online,
    status: online ? 'online' : 'offline',
    winRate: Math.round(item.winRate ?? 50),
  };
}

export function parseSalesCount(value: string) {
  if (value.endsWith('万')) {
    return Number.parseFloat(value) * 10000;
  }
  if (value.endsWith('k')) {
    return Number.parseFloat(value) * 1000;
  }
  return Number.parseFloat(value) || 0;
}

export function formatSalesLabel(value: string) {
  const count = parseSalesCount(value);
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(Math.round(count));
}

export function getDiscountPercent(item: ProductItem) {
  if (!item.originalPrice || item.originalPrice <= item.price) {
    return 0;
  }
  return Math.round((1 - item.price / item.originalPrice) * 100);
}
