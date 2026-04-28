import type {
  BrandId,
  CategoryId,
  CoinLedgerEntry,
  EntityId,
  GuessId,
  GuessSummary,
  OrderSummary,
  ProductId,
  ProductSummary,
  ShopId,
  UserId,
  WarehouseItem,
} from './domain';
import type { LiveStatus } from './status';

export interface GuessListResult {
  items: GuessSummary[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateGuessPayload {
  title: string;
  endTime: string;
  optionTexts: string[];
  scope?: 'public' | 'friends';
  categoryId?: CategoryId | null;
  description?: string | null;
  imageUrl: string;
  productId?: ProductId | null;
  invitedFriendIds?: UserId[];
  /** 揭晓时间，仅店铺竞猜传；不传时与 endTime 同义。 */
  revealAt?: string | null;
  /** 最低参与人数，仅店铺竞猜传；未达标时投注截止后自动流标退款。 */
  minParticipants?: number | null;
}

export interface CreateGuessResult {
  id: GuessId;
  status: 'active';
  reviewStatus: 'approved';
  scope: 'public' | 'friends';
}

export interface GuessCategoryItem {
  id: CategoryId;
  name: string;
  sort: number;
  iconClass: string | null;
  themeClass: string | null;
}

export interface GuessCategoryListResult {
  items: GuessCategoryItem[];
}

export interface FriendPkOption {
  text: string;
  voteCount: number;
  pct: number;
}

export interface FriendPkCreator {
  id: UserId;
  name: string;
  avatar: string | null;
}

export interface FriendPkSummary {
  id: GuessId;
  title: string;
  endTime: string;
  creator: FriendPkCreator;
  options: FriendPkOption[];
}

export interface FriendPkResult {
  item: FriendPkSummary | null;
}

export interface GuessCommentSummary {
  id: EntityId;
  authorId: UserId;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  parentId: EntityId | null;
  likes: number;
  liked: boolean;
  createdAt: string;
}

export interface GuessCommentListResult {
  items: GuessCommentSummary[];
  total: number;
}

export interface PostGuessCommentPayload {
  content: string;
  parentId?: EntityId | null;
}

export type GuessPayChannel = 'wechat' | 'alipay';

export interface ParticipateGuessPayload {
  choiceIdx: number;
  quantity?: number;
  /** 必填; Task 11 后所有调用方都需要传。 */
  payChannel?: GuessPayChannel;
}

export interface ParticipateGuessResult {
  betId: EntityId;
  guessId: GuessId;
  choiceIdx: number;
  /** Task 11 后改为必填。 */
  payNo?: string;
  /** Task 11 后改为必填。 */
  payChannel?: GuessPayChannel;
  /** Task 11 后改为必填。 */
  payUrl?: string;
  /** Task 11 后改为必填。 */
  expiresAt?: string;
}

export type GuessBetPayStatus = 'waiting' | 'paid' | 'failed' | 'closed';

export interface FetchBetPayStatusResult {
  betId: EntityId;
  payStatus: GuessBetPayStatus;
  paidAt: string | null;
}

export interface CancelBetResult {
  success: true;
  betId: EntityId;
}

export interface ToggleGuessFavoriteResult {
  guessId: GuessId;
  favorited: boolean;
}

export interface ProductFeedItem {
  id: ProductId;
  name: string;
  categoryId: CategoryId | null;
  category: string;
  price: number;
  originalPrice: number;
  discountAmount: number;
  sales: number;
  rating: number;
  stock: number;
  img: string;
  tag: string;
  miniTag: string;
  height: number;
  brand: string;
  guessPrice: number;
  status: string;
  shopName: string | null;
  tags: string[];
  collab: string | null;
  isNew: boolean;
  favorited: boolean;
}

export interface ProductCategoryItem {
  id: CategoryId;
  name: string;
  iconUrl: string | null;
  parentId: CategoryId | null;
  level: number;
  sort: number;
  count: number;
}

export interface ProductListResult {
  items: ProductFeedItem[];
  total: number;
}

export interface ProductCategoryListResult {
  items: ProductCategoryItem[];
}

export type SearchTab = 'all' | 'product' | 'guess';
export type SearchSort = 'default' | 'sales' | 'price-asc' | 'price-desc' | 'rating';

export interface SearchHotKeywordItem {
  keyword: string;
  rank: number;
  badge: '' | '热' | '新' | '↑';
  source: 'product' | 'guess';
}

export interface SearchHotResult {
  items: SearchHotKeywordItem[];
}

export interface SearchSuggestItem {
  text: string;
  type: 'product' | 'guess' | 'brand';
}

export interface SearchSuggestResult {
  query: string;
  items: SearchSuggestItem[];
}

export interface SearchResult {
  query: string;
  tab: SearchTab;
  sort: SearchSort;
  products: {
    items: ProductFeedItem[];
    total: number;
  };
  guesses: {
    items: GuessSummary[];
    total: number;
  };
}

export interface CartItem {
  id: EntityId;
  productId: ProductId;
  shopId: ShopId | null;
  brand: string;
  shop: string;
  shopLogo: string;
  name: string;
  specs: string;
  img: string;
  price: number;
  originalPrice: number;
  quantity: number;
  checked: boolean;
  stock: number;
  status: 'active' | 'unavailable';
}

export interface CartListResult {
  items: CartItem[];
  promoThreshold: number;
}

export interface AddCartItemPayload {
  productId: ProductId;
  quantity?: number;
  specs?: string | null;
  checked?: boolean;
}

export interface UpdateCartItemPayload {
  quantity?: number;
  checked?: boolean;
}

export interface CartMutationResult {
  success: true;
  id: EntityId;
}

export interface UserAddressItem {
  id: EntityId;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag: string | null;
  isDefault: boolean;
}

export interface AddressListResult {
  items: UserAddressItem[];
}

export interface AddressPayload {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag?: string | null;
  isDefault?: boolean;
}

export interface CouponListItem {
  id: EntityId;
  couponNo: string;
  name: string;
  amount: number;
  type: 'amount' | 'percent' | 'shipping';
  condition: string;
  expireAt: string | null;
  status: 'unused' | 'locked' | 'used' | 'expired';
  sourceType: number;
  source: string;
}

export interface CouponListResult {
  items: CouponListItem[];
}

export interface GuessHistoryStats {
  total: number;
  active: number;
  won: number;
  lost: number;
  pk: number;
  winRate: number;
}

export interface GuessHistoryActiveItem {
  betId: EntityId;
  guessId: GuessId;
  title: string;
  participants: number;
  endTime: string;
  choiceText: string;
  optionProgress: number[];
  options: string[];
}

export interface GuessHistoryRecordItem {
  betId: EntityId;
  guessId: GuessId;
  title: string;
  date: string;
  choiceText: string;
  resultText: string;
  outcome: 'won' | 'lost';
  rewardText: string;
}

export interface GuessHistoryPkItem {
  betId: EntityId;
  guessId: GuessId;
  title: string;
  outcome: 'won' | 'lost';
  leftName: string;
  leftChoice: string;
  rightName: string;
  rightChoice: string;
  footer: string;
}

export interface GuessHistoryResult {
  stats: GuessHistoryStats;
  active: GuessHistoryActiveItem[];
  history: GuessHistoryRecordItem[];
  pk: GuessHistoryPkItem[];
}

export interface LiveGuessSummary {
  id: GuessId;
  title: string;
  categoryId: CategoryId | null;
  category: string | null;
  options: string[];
  odds: number[];
  pcts: number[];
  endTime: string | null;
}

export interface LiveListItem {
  id: EntityId;
  title: string;
  imageUrl: string | null;
  status: LiveStatus;
  startTime: string | null;
  hostId: UserId | null;
  hostName: string;
  hostAvatar: string | null;
  guessCount: number;
  participants: number;
  currentGuess: LiveGuessSummary | null;
}

export interface LiveListResult {
  items: LiveListItem[];
}

export type LiveDetailResult = LiveListItem;

export interface OrderListResult {
  items: OrderSummary[];
}

export interface CreateOrderPayload {
  source: 'product' | 'cart';
  addressId: EntityId;
  couponId?: EntityId | null;
  paymentMethod?: 'wechat' | 'alipay';
  note?: string | null;
  productId?: ProductId;
  quantity?: number;
  cartItemIds?: EntityId[];
}

export interface CreateOrderResult {
  id: EntityId;
}

export interface ConfirmOrderResult {
  success: true;
  id: EntityId;
  status: 'completed';
}

export interface OrderDetailResult extends OrderSummary {
  orderSn: string;
  originalAmount: number;
  couponDiscount: number;
  address: UserAddressItem | null;
  coupon: CouponListItem | null;
  fulfillment: {
    id: EntityId;
    status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';
    receiverName: string;
    phoneNumber: string;
    province: string;
    city: string;
    district: string;
    detailAddress: string;
    shippingType: number | null;
    shippingFee: number;
    trackingNo: string | null;
    shippedAt: string | null;
    completedAt: string | null;
  } | null;
  logs: Array<{
    id: EntityId;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
}

export interface WarehouseListResult {
  items: WarehouseItem[];
}

export interface ProductDetailResult {
  product: ProductSummary & {
    shopId: ShopId | null;
    shopName: string | null;
    images: string[];
    originalPrice: number;
    stock: number;
    sales: number;
    rating: number;
    tags: string[];
    description: string;
    favorited: boolean;
  };
  activeGuess: GuessSummary | null;
  warehouseItems: WarehouseItem[];
  recommendations: ProductSummary[];
  reviews: Array<{
    id: EntityId;
    userName: string;
    userAvatar: string | null;
    rating: number;
    content: string | null;
    createdAt: string;
  }>;
}

export interface MyShopBrandAuthItem {
  id: EntityId;
  brandId?: BrandId;
  brandName: string;
  status: string;
  createdAt: string;
}

export interface MyShopProductItem {
  id: ProductId;
  name: string;
  brand: string | null;
  price: number;
  img: string | null;
  status: string;
}

export interface ShopCategoryOption {
  id: CategoryId;
  name: string;
}

export interface ShopApplicationItem {
  id: EntityId;
  applyNo: string;
  shopName: string;
  categoryId: CategoryId | null;
  categoryName: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ShopStatusResult {
  status: 'none' | 'pending' | 'rejected' | 'active';
  shop: {
    id: ShopId;
    name: string;
    status: string;
  } | null;
  latestApplication: ShopApplicationItem | null;
  categories: ShopCategoryOption[];
}

export interface SubmitShopApplicationPayload {
  shopName: string;
  categoryId: CategoryId;
  reason: string;
}

export interface SubmitShopApplicationResult {
  id: EntityId;
  applyNo: string;
  status: 'pending';
}

export interface MyShopResult {
  shop: {
    id: ShopId;
    name: string;
    category: string | null;
    description: string | null;
    logo: string | null;
    status: string;
    revenue: number;
    productCount: number;
    orderCount: number;
    rating: number;
  } | null;
  brandAuths: MyShopBrandAuthItem[];
  products: MyShopProductItem[];
}

export interface PublicShopGuessItem {
  id: GuessId;
  title: string;
  votes: number[];
  options: string[];
  relatedProductId: ProductId | null;
}

export interface PublicShopDetailResult {
  shop: {
    id: ShopId;
    name: string;
    category: string | null;
    description: string | null;
    logo: string | null;
    status: string;
    city: string | null;
    fans: number;
    productCount: number;
    totalSales: number;
    avgRating: number;
    brandAuthCount: number;
  } | null;
  products: Array<{
    id: ProductId;
    name: string;
    price: number;
    originalPrice: number;
    sales: number;
    rating: number;
    brand: string | null;
    img: string | null;
    badge: string;
    createdAt: string;
  }>;
  guesses: PublicShopGuessItem[];
}

export interface AvailableBrandItem {
  id: BrandId;
  name: string;
  logo: string | null;
  category: string | null;
  productCount: number;
  status: string;
}

export interface BrandAuthOverviewResult {
  shopName: string | null;
  mine: MyShopBrandAuthItem[];
  available: AvailableBrandItem[];
}

export interface SubmitBrandAuthApplicationPayload {
  brandId: BrandId;
  reason: string;
  license?: string | null;
}

export interface SubmitBrandAuthApplicationResult {
  id: EntityId;
  status: string;
}

export interface BrandProductItem {
  id: ProductId;
  brandId: BrandId;
  brandName: string;
  name: string;
  category: string | null;
  guidePrice: number;
  supplyPrice: number;
  defaultImg: string | null;
  status: string;
}

export interface BrandProductListResult {
  items: BrandProductItem[];
}

export interface AddShopProductsPayload {
  brandId: BrandId;
  brandProductIds: ProductId[];
}

export interface AddShopProductsResult {
  count: number;
}

export interface WalletLedgerResult {
  balance: number;
  items: CoinLedgerEntry[];
}
