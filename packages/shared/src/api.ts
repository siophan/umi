import type {
  BrandId,
  CategoryId,
  ChatMessageId,
  CoinLedgerEntry,
  EntityId,
  GuessId,
  GuessSummary,
  NotificationId,
  OrderSummary,
  ProductId,
  ProductSummary,
  ShopId,
  UserId,
  UserSummary,
  WarehouseItem,
} from './domain';

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  code: string;
  message: string;
  status: number;
  fields?: Record<string, string>;
}

export type ApiResponse<T> = ApiEnvelope<T> | ApiErrorEnvelope;

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

export interface AdminRoleItem {
  id: EntityId;
  code: string;
  name: string;
}

export interface AdminProfile {
  id: EntityId;
  username: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  status: 'active' | 'disabled';
  roles: AdminRoleItem[];
  permissions: string[];
  permissionModules: string[];
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminLoginResult {
  token: string;
  user: AdminProfile;
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

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  success: true;
}

export type AdminCategoryBizTypeCode = 10 | 20 | 30 | 40;
export type AdminCategoryStatusValue = 'active' | 'disabled';

export interface CreateAdminCategoryPayload {
  bizTypeCode: AdminCategoryBizTypeCode;
  parentId?: CategoryId | null;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  sort?: number;
  status?: AdminCategoryStatusValue;
}

export interface UpdateAdminCategoryPayload {
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  sort?: number;
}

export interface UpdateAdminCategoryStatusPayload {
  status: AdminCategoryStatusValue;
}

export interface UpdateAdminCategoryResult {
  id: CategoryId;
  status: AdminCategoryStatusValue;
}

export interface UpdateAdminSystemUserStatusPayload {
  status: 'active' | 'disabled';
}

export interface UpdateAdminSystemUserStatusResult {
  id: EntityId;
  status: 'active' | 'disabled';
}

export interface CreateAdminSystemUserPayload {
  username: string;
  password: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  roleIds: EntityId[];
  status?: 'active' | 'disabled';
}

export interface UpdateAdminSystemUserPayload {
  username: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  roleIds: EntityId[];
}

export interface ResetAdminSystemUserPasswordPayload {
  newPassword: string;
}

export interface AdminSystemUserMutationResult {
  id: EntityId;
}

export interface UpdateAdminRoleStatusPayload {
  status: 'active' | 'disabled';
}

export interface UpdateAdminRoleStatusResult {
  id: EntityId;
  status: 'active' | 'disabled';
}

export interface UpdateAdminRolePermissionsPayload {
  permissionIds: EntityId[];
}

export interface UpdateAdminRolePermissionsResult {
  id: EntityId;
  permissionIds: EntityId[];
}

export interface UpdateAdminPermissionStatusPayload {
  status: 'active' | 'disabled';
}

export interface UpdateAdminPermissionStatusResult {
  id: EntityId;
  status: 'active' | 'disabled';
}

export interface CreateAdminPermissionPayload {
  code: string;
  name: string;
  module: string;
  action: 'view' | 'create' | 'edit' | 'manage';
  parentId?: EntityId | null;
  sort?: number;
  status?: 'active' | 'disabled';
}

export interface UpdateAdminPermissionPayload {
  code: string;
  name: string;
  module: string;
  action: 'view' | 'create' | 'edit' | 'manage';
  parentId?: EntityId | null;
  sort?: number;
}

export interface AdminPermissionMutationResult {
  id: EntityId;
}

export interface UpdateMePayload {
  name?: string;
  avatar?: string | null;
  signature?: string | null;
  gender?: string | null;
  birthday?: string | null;
  region?: string | null;
  worksPrivacy?: 'all' | 'friends' | 'me';
  favPrivacy?: 'all' | 'me';
}

export interface MePostItem {
  id: EntityId;
  title: string;
  desc: string;
  tag: string | null;
  images: string[];
  likes: number;
  comments: number;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
}

export interface MeActivityResult {
  unreadMessageCount: number;
  works: MePostItem[];
  bookmarks: MePostItem[];
  likes: MePostItem[];
}

export interface PublicUserActivityResult {
  worksVisible: boolean;
  likedVisible: boolean;
  works: MePostItem[];
  likes: MePostItem[];
}

export interface CommunityFeedGuessInfo {
  id: GuessId;
  options: [string, string];
  participants: number;
  pcts: [number, number];
}

export interface CommunityFeedItem {
  id: EntityId;
  title: string;
  desc: string;
  tag: string | null;
  location?: string | null;
  images: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  scope: 'public' | 'followers' | 'private';
  liked: boolean;
  bookmarked: boolean;
  author: {
    id: UserId;
    uid: string;
    name: string;
    avatar?: string | null;
    verified: boolean;
  };
  guessInfo?: CommunityFeedGuessInfo | null;
}

export interface CommunityFeedResult {
  items: CommunityFeedItem[];
}

export type CommunityCommentSort = 'hot' | 'newest';

export interface CommunityCommentItem {
  id: EntityId;
  authorName: string;
  authorUid: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  replies?: CommunityCommentItem[];
}

export interface CommunityPostDetailResult {
  post: CommunityFeedItem;
  comments: CommunityCommentItem[];
  related: CommunityFeedItem[];
}

export interface CreateCommunityReportPayload {
  reasonType: 10 | 20 | 30 | 40 | 90;
  reasonDetail?: string | null;
}

export interface CreateCommunityPostPayload {
  content: string;
  tag?: string | null;
  scope?: 'public' | 'followers' | 'private';
  guessId?: GuessId | null;
  location?: string | null;
  images?: string[];
}

export interface CreateCommunityCommentPayload {
  content: string;
  parentId?: EntityId | null;
}

export interface CommunitySearchResult {
  posts: CommunityFeedItem[];
  users: UserSearchItem[];
}

export interface CommunityDiscoveryTopic {
  text: string;
  desc: string;
  href: string;
}

export interface CommunityDiscoveryResult {
  hero: CommunityFeedItem | null;
  hotTopics: CommunityDiscoveryTopic[];
}

export interface BannerItem {
  id: EntityId;
  position: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  targetType: 'guess' | 'post' | 'product' | 'shop' | 'external';
  targetId: EntityId | null;
  actionUrl: string | null;
  sort: number;
  targetPath: string | null;
  guess: GuessSummary | null;
}

export interface BannerListResult {
  items: BannerItem[];
}

export type RankingType = 'winRate' | 'guessWins' | 'inviteCount';
export type RankingPeriodType = 'daily' | 'weekly' | 'monthly' | 'allTime';

export interface RankingItem {
  rank: number;
  userId: UserId;
  nickname: string;
  avatar: string | null;
  level: number;
  value: string;
  score: number;
  type: RankingType;
  periodType: RankingPeriodType;
  periodValue: string;
}

export interface RankingListResult {
  items: RankingItem[];
  total: number;
  type: RankingType;
  periodType: RankingPeriodType;
  periodValue: string;
}

export interface MeSummaryResult {
  activeOrderCount: number;
  warehouseItemCount: number;
  availableCouponCount: number;
}

export interface NotificationItem {
  id: NotificationId;
  type: 'guess' | 'social' | 'system' | 'order';
  read: boolean;
  title: string;
  content: string;
  createdAt: string;
}

export interface NotificationListResult {
  items: NotificationItem[];
}

export interface SocialUserItem {
  id: UserId;
  uid: string;
  name: string;
  avatar?: string | null;
  level?: number;
  title?: string | null;
  signature?: string | null;
  followers?: number;
  following?: number;
  winRate?: number;
  shopVerified?: boolean;
  createdAt?: string;
  message?: string | null;
  status?: string | null;
}

export interface SocialOverviewResult {
  friends: SocialUserItem[];
  following: SocialUserItem[];
  fans: SocialUserItem[];
  requests: SocialUserItem[];
}

export interface UserSearchItem {
  id: UserId;
  uid: string;
  name: string;
  avatar?: string | null;
  signature?: string | null;
  level?: number;
  followers?: number;
  totalGuess?: number;
  wins?: number;
  winRate?: number;
  shopVerified?: boolean;
  shopName?: string | null;
  relation: 'self' | 'friend' | 'following' | 'fan' | 'none';
}

export interface UserSearchResult {
  items: UserSearchItem[];
}

export interface ChatConversationItem {
  userId: UserId;
  name: string;
  avatar?: string | null;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
}

export interface ChatConversationListResult {
  items: ChatConversationItem[];
}

export interface ChatMessageItem {
  id: ChatMessageId;
  from: 'me' | 'other';
  senderId: UserId;
  receiverId: UserId;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ChatDetailResult {
  peer: SocialUserItem;
  items: ChatMessageItem[];
}

export interface SendChatMessagePayload {
  content: string;
}

export interface GuessListResult {
  items: GuessSummary[];
}

export type AdminUserFilter = 'all' | 'user' | 'shop_owner' | 'banned';

export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: AdminUserFilter;
}

export interface UserListResult {
  items: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    totalUsers: number;
    verifiedUsers: number;
    bannedUsers: number;
  };
}

export interface PaginatedListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUserGuessListResult extends PaginatedListResult<GuessSummary> {}

export interface AdminUserOrderListResult extends PaginatedListResult<OrderSummary> {}

export interface UpdateUserBanPayload {
  banned: boolean;
}

export interface UpdateUserBanResult {
  id: UserId;
  banned: boolean;
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
  categories: ProductCategoryItem[];
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
  status: string | null;
  startTime: string | null;
  hostId: UserId | null;
  hostName: string;
  hostAvatar: string | null;
  viewers: number;
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
    tags: string[];
    description: string;
    favorited: boolean;
  };
  activeGuess: GuessSummary | null;
  warehouseItems: WarehouseItem[];
  recommendations: ProductSummary[];
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
