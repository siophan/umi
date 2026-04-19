import type {
  CoinLedgerEntry,
  GuessSummary,
  OrderSummary,
  ProductSummary,
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

export interface AdminRoleItem {
  id: string;
  code: string;
  name: string;
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  status: 'active' | 'disabled';
  roles: AdminRoleItem[];
  permissions: string[];
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
  id: string;
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
  id: string;
  options: [string, string];
  participants: number;
  pcts: [number, number];
}

export interface CommunityFeedItem {
  id: string;
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
    id: string;
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

export interface CommunityCommentItem {
  id: string;
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

export interface CreateCommunityPostPayload {
  content: string;
  tag?: string | null;
  scope?: 'public' | 'followers' | 'private';
  guessId?: string | null;
  location?: string | null;
  images?: string[];
}

export interface CreateCommunityCommentPayload {
  content: string;
  parentId?: string | null;
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

export interface MeSummaryResult {
  activeOrderCount: number;
  warehouseItemCount: number;
  availableCouponCount: number;
}

export interface NotificationItem {
  id: number;
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
  id: string;
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
  id: string;
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
  userId: string;
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
  id: number;
  from: 'me' | 'other';
  senderId: string;
  receiverId: string;
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
  id: string;
  banned: boolean;
}

export interface ProductFeedItem {
  id: string;
  name: string;
  categoryId: string | null;
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
}

export interface ProductCategoryItem {
  id: string;
  name: string;
  iconUrl: string | null;
  parentId: string | null;
  level: number;
  sort: number;
  count: number;
}

export interface ProductListResult {
  items: ProductFeedItem[];
  categories: ProductCategoryItem[];
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
  betId: string;
  guessId: string;
  title: string;
  participants: number;
  endTime: string;
  choiceText: string;
  optionProgress: number[];
  options: string[];
}

export interface GuessHistoryRecordItem {
  betId: string;
  guessId: string;
  title: string;
  date: string;
  choiceText: string;
  resultText: string;
  outcome: 'won' | 'lost';
  rewardText: string;
}

export interface GuessHistoryPkItem {
  betId: string;
  guessId: string;
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

export interface OrderListResult {
  items: OrderSummary[];
}

export interface WarehouseListResult {
  items: WarehouseItem[];
}

export interface ProductDetailResult {
  product: ProductSummary & {
    shopId: string | null;
    shopName: string | null;
    images: string[];
    originalPrice: number;
    stock: number;
    tags: string[];
    description: string;
  };
  activeGuess: GuessSummary | null;
  warehouseItems: WarehouseItem[];
  recommendations: ProductSummary[];
}

export interface MyShopBrandAuthItem {
  id: string;
  brandId?: string;
  brandName: string;
  status: string;
  createdAt: string;
}

export interface MyShopProductItem {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  img: string | null;
  status: string;
}

export interface ShopCategoryOption {
  id: string;
  name: string;
}

export interface ShopApplicationItem {
  id: string;
  applyNo: string;
  shopName: string;
  categoryId: string | null;
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
    id: string;
    name: string;
    status: string;
  } | null;
  latestApplication: ShopApplicationItem | null;
  categories: ShopCategoryOption[];
}

export interface SubmitShopApplicationPayload {
  shopName: string;
  categoryId: string;
  reason: string;
}

export interface SubmitShopApplicationResult {
  id: string;
  applyNo: string;
  status: 'pending';
}

export interface MyShopResult {
  shop: {
    id: string;
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
  id: string;
  title: string;
  votes: number[];
  options: string[];
  relatedProductId: string | null;
}

export interface PublicShopDetailResult {
  shop: {
    id: string;
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
    id: string;
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
  id: string;
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
  brandId: string;
  reason: string;
  license?: string | null;
}

export interface SubmitBrandAuthApplicationResult {
  id: string;
  status: string;
}

export interface BrandProductItem {
  id: string;
  brandId: string;
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
  brandId: string;
  brandProductIds: string[];
}

export interface AddShopProductsResult {
  count: number;
}

export interface WalletLedgerResult {
  balance: number;
  items: CoinLedgerEntry[];
}
