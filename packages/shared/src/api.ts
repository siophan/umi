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
  message?: string;
}

export type AuthMethod = 'code' | 'password';
export type SmsBizType = 'register' | 'login' | 'reset_password';

export interface LoginPayload {
  phone: string;
  method: AuthMethod;
  code?: string;
  password?: string;
}

export interface LoginResult {
  token: string;
  user: UserSummary;
}

export interface SendCodePayload {
  phone: string;
  bizType: SmsBizType;
}

export interface SendCodeResult {
  sent: boolean;
  devCode?: string;
}

export interface RegisterPayload {
  phone: string;
  code: string;
  password: string;
  name: string;
}

export interface LogoutResult {
  success: true;
}

export interface UpdateMePayload {
  name?: string;
  avatar?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  shopName?: string | null;
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
