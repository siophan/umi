import type {
  GuessSummary,
  OrderSummary,
  UserSummary,
  WarehouseItem,
} from '@joy/shared';

export interface AdminDashboardStats {
  users: number;
  products: number;
  activeGuesses: number;
  orders: number;
  todayUsers: number;
  todayBets: number;
  todayOrders: number;
  todayGmv: number;
  trend: AdminDashboardTrendItem[];
  orderDistribution: AdminDashboardDistributionItem[];
  guessCategories: AdminDashboardDistributionItem[];
  hotGuesses: AdminDashboardHotGuess[];
  hotProducts: AdminDashboardHotProduct[];
  pendingQueues: AdminDashboardQueueItem[];
}

export interface AdminDashboardTrendItem {
  date: string;
  bets: number;
  orders: number;
  users: number;
  gmv: number;
}

export interface AdminDashboardDistributionItem {
  type: string;
  value: number;
}

export interface AdminDashboardHotGuess {
  id: string;
  title: string;
  category: string;
  participants: number;
  poolAmount: number;
  endTime: string;
}

export interface AdminDashboardHotProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  stock: number;
  sales: number;
  status: string;
}

export interface AdminDashboardQueueItem {
  id: string;
  title: string;
  count: number;
  tone: 'processing' | 'warning' | 'error';
  description: string;
}

export interface AdminWarehouseStats {
  totalVirtual: number;
  totalPhysical: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'paused' | 'low_stock';
  shopName: string;
  updatedAt: string;
  tags: string[];
}

export interface AdminRiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  module: string;
}

export interface AdminActivityItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface AdminTodoItem {
  id: string;
  title: string;
  owner: string;
  deadline: string;
}

export const fallbackDashboardStats: AdminDashboardStats = {
  users: 12840,
  products: 218,
  activeGuesses: 18,
  orders: 326,
  todayUsers: 126,
  todayBets: 284,
  todayOrders: 46,
  todayGmv: 2389000,
  trend: [
    { date: '4/13', bets: 180, orders: 28, users: 62, gmv: 1280000 },
    { date: '4/14', bets: 196, orders: 31, users: 74, gmv: 1426000 },
    { date: '4/15', bets: 224, orders: 35, users: 81, gmv: 1684000 },
    { date: '4/16', bets: 206, orders: 30, users: 69, gmv: 1512000 },
    { date: '4/17', bets: 258, orders: 41, users: 90, gmv: 2198000 },
    { date: '4/18', bets: 240, orders: 38, users: 84, gmv: 1986000 },
    { date: '4/19', bets: 284, orders: 46, users: 126, gmv: 2389000 },
  ],
  orderDistribution: [
    { type: '待支付', value: 18 },
    { type: '已支付', value: 64 },
    { type: '已完成', value: 220 },
    { type: '已退款', value: 24 },
  ],
  guessCategories: [
    { type: '球鞋', value: 8 },
    { type: '服饰', value: 5 },
    { type: '配件', value: 3 },
    { type: '收藏', value: 2 },
  ],
  hotGuesses: [
    {
      id: 'guess-hot-1',
      title: 'Panda 本周会不会继续涨价',
      category: '球鞋',
      participants: 842,
      poolAmount: 2580000,
      endTime: '2026-04-20T12:00:00.000Z',
    },
    {
      id: 'guess-hot-2',
      title: 'Essentials 新色会不会在三天内售罄',
      category: '服饰',
      participants: 612,
      poolAmount: 1942000,
      endTime: '2026-04-21T15:00:00.000Z',
    },
    {
      id: 'guess-hot-3',
      title: 'Oakley 新联名会不会二级破发',
      category: '配件',
      participants: 488,
      poolAmount: 1568000,
      endTime: '2026-04-21T09:30:00.000Z',
    },
  ],
  hotProducts: [
    {
      id: 'product-hot-1',
      name: 'Nike Dunk Low Panda',
      price: 89900,
      stock: 42,
      sales: 1280,
      status: 'active',
    },
    {
      id: 'product-hot-2',
      name: 'Jordan 1 Retro High OG',
      price: 139900,
      stock: 7,
      sales: 920,
      status: 'active',
    },
    {
      id: 'product-hot-3',
      name: 'Fear of God Essentials Hoodie',
      price: 69900,
      stock: 18,
      sales: 801,
      status: 'active',
    },
  ],
  pendingQueues: [
    {
      id: 'queue-1',
      title: '待审核竞猜',
      count: 6,
      tone: 'warning',
      description: '需要运营与风控完成最终审核。',
    },
    {
      id: 'queue-2',
      title: '退款审核',
      count: 3,
      tone: 'error',
      description: '订单退款单等待审核或补充处理。',
    },
    {
      id: 'queue-3',
      title: '举报处理',
      count: 2,
      tone: 'error',
      description: '社区举报单待复核。',
    },
    {
      id: 'queue-4',
      title: '开店申请',
      count: 4,
      tone: 'processing',
      description: '新店入驻申请待处理。',
    },
  ],
};

export const fallbackUsers: UserSummary[] = [
  {
    id: 'user-1001',
    uid: 'aZkLmNqP',
    phone: '13800000000',
    name: 'Joy User',
    role: 'user',
    coins: 126000,
    level: 18,
    title: 'Panda 研究员',
    region: '上海',
    followers: 248,
    following: 56,
    winRate: 62.4,
    wins: 38,
    totalGuess: 61,
    joinDate: '2026-01-06T10:30:00.000Z',
    shopVerified: false,
  },
  {
    id: 'user-1002',
    uid: 'LmNoPqRs',
    phone: '13700000001',
    name: 'Kiki Shop',
    role: 'shop_owner',
    coins: 452000,
    level: 24,
    title: '潮流店主',
    region: '杭州',
    followers: 922,
    following: 120,
    winRate: 57.2,
    wins: 64,
    totalGuess: 112,
    joinDate: '2025-11-18T08:10:00.000Z',
    shopName: 'Kiki Sneaker Lab',
    shopVerified: true,
  },
  {
    id: 'user-1003',
    uid: 'QwErTyUi',
    phone: '13900000000',
    name: 'Ops Admin',
    role: 'admin',
    coins: 0,
    level: 30,
    title: '系统管理员',
    region: '深圳',
    followers: 0,
    following: 0,
    winRate: 0,
    wins: 0,
    totalGuess: 0,
    joinDate: '2025-10-03T02:00:00.000Z',
    shopVerified: false,
  },
  {
    id: 'user-1004',
    uid: 'UiOpAsDf',
    phone: '13600000002',
    name: 'Mia Collector',
    role: 'user',
    coins: 98600,
    level: 15,
    title: '寄售玩家',
    region: '成都',
    followers: 174,
    following: 88,
    winRate: 49.6,
    wins: 22,
    totalGuess: 45,
    joinDate: '2026-02-10T09:00:00.000Z',
    shopVerified: false,
  },
  {
    id: 'user-1005',
    uid: 'GhJkLmNp',
    phone: '13500000003',
    name: 'Rex Brand',
    role: 'shop_owner',
    coins: 321500,
    level: 21,
    title: '品牌主理人',
    region: '广州',
    followers: 1500,
    following: 77,
    winRate: 68.1,
    wins: 81,
    totalGuess: 119,
    joinDate: '2025-12-28T05:30:00.000Z',
    shopName: 'Rex Lab',
    shopVerified: true,
  },
];

export const fallbackProducts: AdminProduct[] = [
  {
    id: 'product-1',
    name: 'Nike Dunk Low Panda',
    brand: 'Nike',
    category: '球鞋',
    price: 89900,
    stock: 42,
    status: 'active',
    shopName: 'Kiki Sneaker Lab',
    updatedAt: '2026-04-18T08:00:00.000Z',
    tags: ['热门', '竞猜奖品'],
  },
  {
    id: 'product-2',
    name: 'Jordan 1 Retro High OG',
    brand: 'Jordan',
    category: '球鞋',
    price: 139900,
    stock: 7,
    status: 'low_stock',
    shopName: 'Kiki Sneaker Lab',
    updatedAt: '2026-04-18T09:20:00.000Z',
    tags: ['高客单'],
  },
  {
    id: 'product-3',
    name: 'Fear of God Essentials Hoodie',
    brand: 'FOG',
    category: '服饰',
    price: 69900,
    stock: 18,
    status: 'active',
    shopName: 'Rex Lab',
    updatedAt: '2026-04-17T13:40:00.000Z',
    tags: ['连帽衫'],
  },
  {
    id: 'product-4',
    name: 'BAPE Camo Tee',
    brand: 'BAPE',
    category: '服饰',
    price: 49900,
    stock: 0,
    status: 'paused',
    shopName: 'Rex Lab',
    updatedAt: '2026-04-15T06:20:00.000Z',
    tags: ['售罄待补货'],
  },
  {
    id: 'product-5',
    name: 'Oakley Eye Jacket Redux',
    brand: 'Oakley',
    category: '配件',
    price: 119900,
    stock: 12,
    status: 'draft',
    shopName: 'Ops Sample Store',
    updatedAt: '2026-04-14T04:50:00.000Z',
    tags: ['待审核'],
  },
];

export const fallbackGuesses: GuessSummary[] = [
  {
    id: 'guess-1',
    title: '今晚 Panda 会不会在 60 秒内被抢完',
    status: 'active',
    reviewStatus: 'approved',
    category: '球鞋',
    endTime: '2026-04-19T16:00:00.000Z',
    creatorId: 'admin-1',
    product: {
      id: 'prod-1',
      name: 'Nike Dunk Low Panda',
      brand: 'Nike',
      img: 'https://example.com/product/panda.jpg',
      price: 89900,
      guessPrice: 4900,
      category: '球鞋',
      status: 'active',
    },
    options: [
      {
        id: 'opt-1',
        optionIndex: 0,
        optionText: '会',
        odds: 1.72,
        voteCount: 128,
        isResult: false,
      },
      {
        id: 'opt-2',
        optionIndex: 1,
        optionText: '不会',
        odds: 2.18,
        voteCount: 86,
        isResult: false,
      },
    ],
  },
  {
    id: 'guess-2',
    title: 'Jordan 1 这周成交价能否站上 1600',
    status: 'pending_review',
    reviewStatus: 'pending',
    category: '行情',
    endTime: '2026-04-20T12:00:00.000Z',
    creatorId: 'admin-1',
    product: {
      id: 'prod-2',
      name: 'Jordan 1 Retro High OG',
      brand: 'Jordan',
      img: 'https://example.com/product/jordan.jpg',
      price: 139900,
      guessPrice: 9900,
      category: '球鞋',
      status: 'active',
    },
    options: [
      {
        id: 'opt-3',
        optionIndex: 0,
        optionText: '能',
        odds: 1.94,
        voteCount: 42,
        isResult: false,
      },
      {
        id: 'opt-4',
        optionIndex: 1,
        optionText: '不能',
        odds: 1.86,
        voteCount: 39,
        isResult: false,
      },
    ],
  },
  {
    id: 'guess-3',
    title: 'Essentials Hoodie 新色首发会不会在 3 小时内售罄',
    status: 'settled',
    reviewStatus: 'approved',
    category: '服饰',
    endTime: '2026-04-16T20:00:00.000Z',
    creatorId: 'admin-1',
    product: {
      id: 'prod-3',
      name: 'Fear of God Essentials Hoodie',
      brand: 'FOG',
      img: 'https://example.com/product/fog.jpg',
      price: 69900,
      guessPrice: 3900,
      category: '服饰',
      status: 'active',
    },
    options: [
      {
        id: 'opt-5',
        optionIndex: 0,
        optionText: '会',
        odds: 1.48,
        voteCount: 188,
        isResult: true,
      },
      {
        id: 'opt-6',
        optionIndex: 1,
        optionText: '不会',
        odds: 2.72,
        voteCount: 61,
        isResult: false,
      },
    ],
  },
  {
    id: 'guess-4',
    title: 'Oakley 新镜架联名款能否在本周过审上架',
    status: 'cancelled',
    reviewStatus: 'rejected',
    category: '配件',
    endTime: '2026-04-15T10:00:00.000Z',
    creatorId: 'admin-1',
    product: {
      id: 'prod-4',
      name: 'Oakley Eye Jacket Redux',
      brand: 'Oakley',
      img: 'https://example.com/product/oakley.jpg',
      price: 119900,
      guessPrice: 2900,
      category: '配件',
      status: 'draft',
    },
    options: [
      {
        id: 'opt-7',
        optionIndex: 0,
        optionText: '能',
        odds: 1.67,
        voteCount: 28,
        isResult: false,
      },
      {
        id: 'opt-8',
        optionIndex: 1,
        optionText: '不能',
        odds: 2.10,
        voteCount: 33,
        isResult: false,
      },
    ],
  },
];

export const fallbackOrders: OrderSummary[] = [
  {
    id: 'order-1',
    userId: 'user-1001',
    orderType: 'guess_reward',
    guessId: 'guess-1',
    guessTitle: '今晚 Panda 会不会在 60 秒内被抢完',
    amount: 4900,
    status: 'paid',
    createdAt: '2026-04-19T07:30:00.000Z',
    items: [
      {
        id: 'order-item-1',
        productId: 'product-1',
        productName: 'Nike Dunk Low Panda',
        productImg: 'https://example.com/product/panda.jpg',
        quantity: 1,
        unitPrice: 4900,
        itemAmount: 4900,
      },
    ],
  },
  {
    id: 'order-2',
    userId: 'user-1002',
    orderType: 'shop_order',
    guessId: null,
    amount: 139900,
    status: 'shipping',
    createdAt: '2026-04-18T12:40:00.000Z',
    items: [
      {
        id: 'order-item-2',
        productId: 'product-2',
        productName: 'Jordan 1 Retro High OG',
        productImg: 'https://example.com/product/jordan.jpg',
        quantity: 1,
        unitPrice: 139900,
        itemAmount: 139900,
      },
    ],
  },
  {
    id: 'order-3',
    userId: 'user-1004',
    orderType: 'shop_order',
    guessId: null,
    amount: 69900,
    status: 'refund_pending',
    createdAt: '2026-04-17T15:10:00.000Z',
    items: [
      {
        id: 'order-item-3',
        productId: 'product-3',
        productName: 'Fear of God Essentials Hoodie',
        productImg: 'https://example.com/product/fog.jpg',
        quantity: 1,
        unitPrice: 69900,
        itemAmount: 69900,
      },
    ],
  },
  {
    id: 'order-4',
    userId: 'user-1005',
    orderType: 'shop_order',
    guessId: null,
    amount: 249500,
    status: 'completed',
    createdAt: '2026-04-15T08:20:00.000Z',
    items: [
      {
        id: 'order-item-4',
        productId: 'product-1',
        productName: 'Nike Dunk Low Panda',
        productImg: 'https://example.com/product/panda.jpg',
        quantity: 1,
        unitPrice: 89900,
        itemAmount: 89900,
      },
      {
        id: 'order-item-5',
        productId: 'product-3',
        productName: 'Fear of God Essentials Hoodie',
        productImg: 'https://example.com/product/fog.jpg',
        quantity: 2,
        unitPrice: 79800,
        itemAmount: 159600,
      },
    ],
  },
];

export const fallbackWarehouseStats: AdminWarehouseStats = {
  totalVirtual: 148,
  totalPhysical: 64,
};

export const fallbackWarehouseItems: WarehouseItem[] = [
  {
    id: 'vw-1',
    userId: 'user-1001',
    productId: 'product-1',
    productName: 'Nike Dunk Low Panda',
    quantity: 1,
    status: 'stored',
    warehouseType: 'virtual',
    sourceType: 'guess_reward',
    consignPrice: 96800,
    createdAt: '2026-04-19T08:00:00.000Z',
  },
  {
    id: 'vw-2',
    userId: 'user-1002',
    productId: 'product-2',
    productName: 'Jordan 1 Retro High OG',
    quantity: 2,
    status: 'consigning',
    warehouseType: 'virtual',
    sourceType: 'shop_order',
    consignPrice: 158000,
    createdAt: '2026-04-18T11:10:00.000Z',
  },
  {
    id: 'vw-3',
    userId: 'user-1004',
    productId: 'product-3',
    productName: 'Fear of God Essentials Hoodie',
    quantity: 1,
    status: 'locked',
    warehouseType: 'virtual',
    sourceType: 'refund',
    createdAt: '2026-04-17T09:20:00.000Z',
  },
  {
    id: 'pw-1',
    userId: 'user-1002',
    productId: 'product-2',
    productName: 'Jordan 1 Retro High OG',
    quantity: 1,
    status: 'shipping',
    warehouseType: 'physical',
    sourceType: 'convert',
    estimateDays: 3,
    createdAt: '2026-04-18T13:00:00.000Z',
  },
  {
    id: 'pw-2',
    userId: 'user-1005',
    productId: 'product-1',
    productName: 'Nike Dunk Low Panda',
    quantity: 1,
    status: 'delivered',
    warehouseType: 'physical',
    sourceType: 'convert',
    estimateDays: 0,
    createdAt: '2026-04-15T14:00:00.000Z',
  },
  {
    id: 'pw-3',
    userId: 'user-1001',
    productId: 'product-3',
    productName: 'Fear of God Essentials Hoodie',
    quantity: 1,
    status: 'completed',
    warehouseType: 'physical',
    sourceType: 'convert',
    estimateDays: 0,
    createdAt: '2026-04-14T07:20:00.000Z',
  },
];

export const fallbackRisks: AdminRiskItem[] = [
  {
    id: 'risk-1',
    level: 'high',
    title: '竞猜待审核积压',
    description: '还有 6 条竞猜在待审核队列，其中 2 条预计今天晚高峰前需要处理。',
    module: '竞猜',
  },
  {
    id: 'risk-2',
    level: 'medium',
    title: '退款审核超时预警',
    description: '3 笔订单退款等待人工审核超过 12 小时，可能影响用户满意度。',
    module: '订单',
  },
  {
    id: 'risk-3',
    level: 'low',
    title: '商品低库存',
    description: 'Jordan 1 与 BAPE Tee 已接近售罄，需要确认是否补货或暂停投放。',
    module: '商品',
  },
];

export const fallbackActivities: AdminActivityItem[] = [
  {
    id: 'activity-1',
    title: '运营通过了 1 条 Panda 竞猜',
    description: '赔率与商品映射已经同步到前台展示。',
    createdAt: '2026-04-19T07:50:00.000Z',
  },
  {
    id: 'activity-2',
    title: '履约团队更新了 2 笔物流单',
    description: 'Jordan 订单已进入配送中，预计 3 天内签收。',
    createdAt: '2026-04-18T15:20:00.000Z',
  },
  {
    id: 'activity-3',
    title: '仓库锁定了 1 件退款待处理商品',
    description: '对应用户申请退回虚拟仓，待客服确认。',
    createdAt: '2026-04-17T10:10:00.000Z',
  },
];

export const fallbackTodos: AdminTodoItem[] = [
  {
    id: 'todo-1',
    title: '补完竞猜详情页审核记录与证据抽屉',
    owner: '风控 / 运营',
    deadline: '今天',
  },
  {
    id: 'todo-2',
    title: '接订单履约发货与退款审核操作',
    owner: '履约',
    deadline: '明天',
  },
  {
    id: 'todo-3',
    title: '补商品导入与低库存提醒',
    owner: '商品运营',
    deadline: '本周',
  },
];
