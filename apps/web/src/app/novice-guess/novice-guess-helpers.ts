'use client';

export type ProductReward = {
  name: string;
  img: string;
  price: number;
  guessPrice: number;
  badge: string;
};

export type QuestionItem = {
  category: string;
  categoryIcon: string;
  img: string;
  question: string;
  options: string[];
  correct: number;
  hint: string;
  pcts: number[];
  product: ProductReward;
};

export const QUESTIONS: QuestionItem[] = [
  {
    category: '萌宠百科',
    categoryIcon: '🐾',
    img: '/legacy/images/products/p001-lays.jpg',
    question: '猫咪平均每天要睡多少个小时？',
    options: ['6-8小时', '8-10小时', '12-16小时', '18-22小时'],
    correct: 2,
    hint: '猫咪是出了名的“睡神”，一天大部分时间都在补眠。',
    pcts: [8, 18, 52, 22],
    product: {
      name: '乐事原味薯片 70g',
      img: '/legacy/images/products/p001-lays.jpg',
      price: 9.9,
      guessPrice: 0,
      badge: '首题奖励',
    },
  },
  {
    category: '生活趣知',
    categoryIcon: '☕',
    img: '/legacy/images/products/p002-oreo.jpg',
    question: '冰淇淋在什么温度下最好吃？',
    options: ['-18°C 以下', '-14°C 左右', '-8°C 左右', '0°C 刚好'],
    correct: 2,
    hint: '太冷会让舌头麻木，反而吃不出香味。',
    pcts: [22, 18, 45, 15],
    product: {
      name: '奥利奥原味夹心饼干',
      img: '/legacy/images/products/p002-oreo.jpg',
      price: 16.8,
      guessPrice: 0,
      badge: '二连奖励',
    },
  },
  {
    category: '美食百科',
    categoryIcon: '🍜',
    img: '/legacy/images/products/p003-squirrels.jpg',
    question: '花生其实属于什么类植物？',
    options: ['坚果类', '豆科植物', '根茎类', '谷物类'],
    correct: 1,
    hint: '花生虽然常被当作坚果，但它其实和大豆是亲戚。',
    pcts: [35, 42, 13, 10],
    product: {
      name: '三只松鼠坚果礼盒',
      img: '/legacy/images/products/p003-squirrels.jpg',
      price: 59.9,
      guessPrice: 0,
      badge: '终极大奖',
    },
  },
];

export const TICKER_ITEMS = [
  { name: '鼠鼠补给站', avatar: '/legacy/images/mascot/mouse-main.png', prize: '智慧达人礼包' },
  { name: '零食侦探社', avatar: '/legacy/images/mascot/mouse-happy.png', prize: '星巴克兑换券' },
  { name: '甜品公主', avatar: '/legacy/images/mascot/mouse-casual.png', prize: '零食大礼包' },
  { name: '品牌观察员', avatar: '/legacy/images/products/p007-dove.jpg', prize: '神秘大奖' },
  { name: '乐事官方', avatar: '/legacy/images/products/p001-lays.jpg', prize: '价值¥99礼盒' },
];

export const STREAK_REWARDS = [
  { emoji: '🌟', name: '智慧达人奖', desc: '第1题奖品' },
  { emoji: '🎁', name: '小神秘奖品', desc: '连续猜对2题解锁' },
  { emoji: '🎊', name: '大神秘奖品', desc: '3连全胜解锁' },
];

export const CONFETTI = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
  delay: `${(index % 6) * 0.12}s`,
  duration: `${4 + (index % 4) * 0.45}s`,
}));

export function formatPrice(value: number) {
  return `¥${value.toFixed(1)}`;
}
