import type {
  GuessReviewStatus,
  GuessStatus,
  LedgerType,
  OrderStatus,
  WarehouseStatus,
} from './status';

export type UserRole = 'user' | 'admin' | 'shop_owner';

export interface UserSummary {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  coins: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  img: string;
  price: number;
  guessPrice: number;
  category: string;
  status: string;
}

export interface GuessOption {
  id: string;
  optionIndex: number;
  optionText: string;
  odds: number;
  voteCount: number;
  isResult: boolean;
}

export interface GuessSummary {
  id: string;
  title: string;
  status: GuessStatus;
  reviewStatus: GuessReviewStatus;
  category: string;
  endTime: string;
  creatorId: string;
  product: ProductSummary;
  options: GuessOption[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImg: string;
  quantity: number;
  unitPrice: number;
  itemAmount: number;
}

export interface OrderSummary {
  id: string;
  userId: string;
  guessId: string | null;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export interface CoinLedgerEntry {
  id: string;
  userId: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  note: string;
  createdAt: string;
}

export interface WarehouseItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  status: WarehouseStatus;
  warehouseType: 'virtual' | 'physical';
  sourceType: string;
  createdAt: string;
}
