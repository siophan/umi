import type {
  GuessReviewStatus,
  GuessStatus,
  OrderStatus,
  WarehouseStatus,
} from './status';

/**
 * Database BIGINT identifiers travel through JSON as decimal strings.
 * Use these aliases instead of plain string so the API contract stays explicit.
 */
export type BigIntString = `${bigint}`;
export type EntityId = BigIntString;
export type UserId = EntityId;
export type ProductId = EntityId;
export type GuessId = EntityId;
export type OrderId = EntityId;
export type CategoryId = EntityId;
export type ShopId = EntityId;
export type BrandId = EntityId;
export type NotificationId = EntityId;
export type ChatMessageId = EntityId;

export function toEntityId<T extends EntityId = EntityId>(value: string | number | bigint): T {
  return String(value) as T;
}

export function toOptionalEntityId<T extends EntityId = EntityId>(
  value: string | number | bigint | null | undefined,
): T | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return toEntityId<T>(value);
}

export type UserRole = 'user' | 'admin' | 'shop_owner';

export interface UserSummary {
  id: UserId;
  uid: string;
  phone: string;
  name: string;
  role: UserRole;
  banned?: boolean;
  avatar?: string | null;
  level?: number;
  title?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  shopName?: string | null;
  followers?: number;
  following?: number;
  winRate?: number;
  totalGuess?: number;
  totalOrders?: number;
  wins?: number;
  joinDate?: string | null;
  shopVerified?: boolean;
  worksPrivacy?: 'all' | 'friends' | 'me';
  favPrivacy?: 'all' | 'me';
  inviteCount?: number;
}

export interface UserPublicProfile {
  id: UserId;
  uid: string;
  name: string;
  avatar?: string | null;
  level?: number;
  title?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  followers?: number;
  following?: number;
  winRate?: number;
  totalGuess?: number;
  wins?: number;
  joinDate?: string | null;
  shopVerified?: boolean;
  worksVisible?: boolean;
  likedVisible?: boolean;
  relation?: 'self' | 'friend' | 'following' | 'fan' | 'none';
}

export interface ProductSummary {
  id: ProductId;
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
  id: GuessId;
  title: string;
  status: GuessStatus;
  reviewStatus: GuessReviewStatus;
  categoryId?: CategoryId | null;
  category: string;
  tags?: string[];
  description?: string | null;
  topicDetail?: string | null;
  imageUrl?: string | null;
  endTime: string;
  creatorId: UserId;
  product: ProductSummary;
  options: GuessOption[];
  participantCount?: number;
  totalOrders?: number;
  commentCount?: number;
  isFavorited?: boolean;
  userBet?: { choiceIdx: number; betId: EntityId } | null;
}

export interface OrderItem {
  id: EntityId;
  productId: ProductId;
  productName: string;
  productImg: string;
  skuText?: string | null;
  quantity: number;
  unitPrice: number;
  itemAmount: number;
}

export interface OrderSummary {
  id: OrderId;
  userId: UserId;
  orderType?: string | null;
  guessId: GuessId | null;
  guessTitle?: string | null;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export interface WarehouseItem {
  id: EntityId;
  userId: UserId;
  userName?: string | null;
  productId: ProductId;
  productName: string;
  productImg?: string | null;
  quantity: number;
  price?: number;
  status: WarehouseStatus;
  warehouseType: 'virtual' | 'physical';
  sourceType: string;
  consignPrice?: number | null;
  estimateDays?: number | null;
  createdAt: string;
}
