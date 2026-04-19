import type {
  CoinLedgerEntry,
  GuessSummary,
  OrderSummary,
  ProductSummary,
  UserSummary,
  WarehouseItem,
} from '@joy/shared';

import { nowIso } from './time';

const demoProduct: ProductSummary = {
  id: 'prod-1',
  name: 'Nike Dunk Low Panda',
  brand: 'Nike',
  img: 'https://example.com/product/panda.jpg',
  price: 899,
  guessPrice: 49,
  category: 'sneakers',
  status: 'active',
};

export const demoUser: UserSummary = {
  id: 'user-1',
  uid: 'aZkLmNqP',
  phone: '13800000000',
  name: 'Joy User',
  role: 'user',
  coins: 1260,
};

export const demoAdmin: UserSummary = {
  id: 'admin-1',
  uid: 'QwErTyUi',
  phone: '13900000000',
  name: 'Ops Admin',
  role: 'admin',
  coins: 0,
};

export const demoGuesses: GuessSummary[] = [
  {
    id: 'guess-1',
    title: '今晚 Panda 会不会在 60 秒内被抢完',
    status: 'active',
    reviewStatus: 'approved',
    category: 'drop',
    endTime: nowIso(),
    creatorId: demoAdmin.id,
    product: demoProduct,
    options: [
      {
        id: 'guess-option-1',
        optionIndex: 0,
        optionText: '会',
        odds: 1.72,
        voteCount: 128,
        isResult: false,
      },
      {
        id: 'guess-option-2',
        optionIndex: 1,
        optionText: '不会',
        odds: 2.18,
        voteCount: 86,
        isResult: false,
      },
    ],
  },
];

export const demoOrders: OrderSummary[] = [
  {
    id: 'order-1',
    userId: demoUser.id,
    guessId: demoGuesses[0].id,
    amount: 49,
    status: 'paid',
    createdAt: nowIso(),
    items: [
      {
        id: 'order-item-1',
        productId: demoProduct.id,
        productName: demoProduct.name,
        productImg: demoProduct.img,
        quantity: 1,
        unitPrice: 49,
        itemAmount: 49,
      },
    ],
  },
];

export const demoLedger: CoinLedgerEntry[] = [
  {
    id: 'ledger-1',
    userId: demoUser.id,
    type: 'reward',
    amount: 240,
    balanceAfter: 1260,
    sourceType: 'guess',
    sourceId: demoGuesses[0].id,
    note: '竞猜奖励入账',
    createdAt: nowIso(),
  },
  {
    id: 'ledger-2',
    userId: demoUser.id,
    type: 'debit',
    amount: -49,
    balanceAfter: 1020,
    sourceType: 'bet',
    sourceId: demoGuesses[0].id,
    note: '下注扣币',
    createdAt: nowIso(),
  },
];

export const demoWarehouse: WarehouseItem[] = [
  {
    id: 'vw-1',
    userId: demoUser.id,
    productId: demoProduct.id,
    productName: demoProduct.name,
    quantity: 1,
    status: 'stored',
    warehouseType: 'virtual',
    sourceType: 'guess_reward',
    createdAt: nowIso(),
  },
  {
    id: 'pw-1',
    userId: demoUser.id,
    productId: demoProduct.id,
    productName: demoProduct.name,
    quantity: 1,
    status: 'shipping',
    warehouseType: 'physical',
    sourceType: 'convert',
    createdAt: nowIso(),
  },
];
