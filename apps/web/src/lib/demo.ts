import type { GuessSummary, OrderSummary, ProductSummary, WarehouseItem } from '@joy/shared';

const now = new Date().toISOString();

export const demoUser = {
  id: 'user-1',
  name: '优米鼠鼠',
  phone: '13800000000',
  coins: 1260,
  followers: 182,
  following: 89,
  guesses: 46,
  bio: '专注零食、球鞋和娱乐热点，喜欢蹲限量发售和竞猜收货。',
};

export const demoProduct: ProductSummary = {
  id: 'prod-1',
  name: 'Nike Dunk Low Panda',
  brand: 'Nike',
  img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  price: 899,
  guessPrice: 49,
  category: 'sneakers',
  status: 'active',
};

export const demoProduct2: ProductSummary = {
  id: 'prod-2',
  name: '草莓冻干酸奶块礼盒',
  brand: 'UMe Select',
  img: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80',
  price: 59,
  guessPrice: 9.9,
  category: 'snacks',
  status: 'active',
};

export const demoGuess: GuessSummary = {
  id: 'guess-1',
  title: '今晚 Panda 会不会在 60 秒内被抢完',
  status: 'active',
  reviewStatus: 'approved',
  category: 'drop',
  endTime: now,
  creatorId: 'admin-1',
  product: demoProduct,
  options: [
    {
      id: 'option-1',
      optionIndex: 0,
      optionText: '会',
      odds: 1.72,
      voteCount: 128,
      isResult: false,
    },
    {
      id: 'option-2',
      optionIndex: 1,
      optionText: '不会',
      odds: 2.18,
      voteCount: 86,
      isResult: false,
    },
  ],
};

export const demoGuesses: GuessSummary[] = [
  demoGuess,
  {
    id: 'guess-2',
    title: '这盒草莓冻干会不会在今晚直播间卖爆',
    status: 'active',
    reviewStatus: 'approved',
    category: 'snacks',
    endTime: now,
    creatorId: 'admin-1',
    product: demoProduct2,
    options: [
      {
        id: 'option-3',
        optionIndex: 0,
        optionText: '会',
        odds: 1.54,
        voteCount: 233,
        isResult: false,
      },
      {
        id: 'option-4',
        optionIndex: 1,
        optionText: '不会',
        odds: 2.62,
        voteCount: 91,
        isResult: false,
      },
    ],
  },
];

export const demoOrders: OrderSummary[] = [
  {
    id: 'order-1',
    userId: 'user-1',
    guessId: 'guess-1',
    amount: 49,
    status: 'paid',
    createdAt: now,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Nike Dunk Low Panda',
        productImg: demoProduct.img,
        quantity: 1,
        unitPrice: 49,
        itemAmount: 49,
      },
    ],
  },
  {
    id: 'order-2',
    userId: 'user-1',
    guessId: null,
    amount: 59,
    status: 'shipping',
    createdAt: now,
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: demoProduct2.name,
        productImg: demoProduct2.img,
        quantity: 1,
        unitPrice: 59,
        itemAmount: 59,
      },
    ],
  },
];

export const demoWarehouse: WarehouseItem[] = [
  {
    id: 'vw-1',
    userId: 'user-1',
    productId: 'prod-1',
    productName: demoProduct.name,
    quantity: 1,
    status: 'stored',
    warehouseType: 'virtual',
    sourceType: 'guess_reward',
    createdAt: now,
  },
  {
    id: 'pw-1',
    userId: 'user-1',
    productId: 'prod-2',
    productName: demoProduct2.name,
    quantity: 1,
    status: 'shipping',
    warehouseType: 'physical',
    sourceType: 'buy',
    createdAt: now,
  },
];
