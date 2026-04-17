import type {
  CoinLedgerEntry,
  GuessSummary,
  OrderSummary,
  UserSummary,
  WarehouseItem,
} from './domain';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface LoginPayload {
  phone: string;
  code: string;
}

export interface LoginResult {
  token: string;
  user: UserSummary;
}

export interface GuessListResult {
  items: GuessSummary[];
}

export interface OrderListResult {
  items: OrderSummary[];
}

export interface WarehouseListResult {
  items: WarehouseItem[];
}

export interface WalletLedgerResult {
  balance: number;
  items: CoinLedgerEntry[];
}
