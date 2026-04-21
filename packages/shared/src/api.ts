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

export interface VerifyCodePayload {
  phone: string;
  code: string;
  bizType: SmsBizType;
}

export interface VerifyCodeResult {
  verified: true;
}

export interface RegisterPayload {
  phone: string;
  code: string;
  password: string;
  name: string;
  avatar?: string;
}

export interface LogoutResult {
  success: true;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

export interface ResetPasswordPayload {
  phone: string;
  code: string;
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

export interface ReviewAdminShopApplyPayload {
  status: 'approved' | 'rejected';
  rejectReason?: string | null;
}

export interface ReviewAdminShopApplyResult {
  id: EntityId;
  status: 'approved' | 'rejected';
}

export interface CreateAdminBrandPayload {
  name: string;
  categoryId: EntityId;
  contactName?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  status?: 'active' | 'disabled';
}

export interface CreateAdminBrandResult {
  id: EntityId;
}

export interface UpdateAdminBrandPayload {
  name: string;
  categoryId: EntityId;
  contactName?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  status: 'active' | 'disabled';
}

export interface UpdateAdminBrandResult {
  id: EntityId;
}

export interface CreateAdminBrandProductPayload {
  brandId: EntityId;
  name: string;
  categoryId: EntityId;
  guidePrice: number;
  supplyPrice?: number | null;
  defaultImg?: string | null;
  description?: string | null;
  status?: 'active' | 'disabled';
}

export interface CreateAdminBrandProductResult {
  id: EntityId;
}

export interface UpdateAdminBrandProductPayload {
  brandId: EntityId;
  name: string;
  categoryId: EntityId;
  guidePrice: number;
  supplyPrice?: number | null;
  defaultImg?: string | null;
  description?: string | null;
  status: 'active' | 'disabled';
}

export interface UpdateAdminBrandProductResult {
  id: EntityId;
}

export interface ReviewAdminBrandAuthApplyPayload {
  status: 'approved' | 'rejected';
  rejectReason?: string | null;
}

export interface ReviewAdminBrandAuthApplyResult {
  id: EntityId;
  status: 'approved' | 'rejected';
}

export interface RevokeAdminBrandAuthRecordResult {
  id: EntityId;
  status: 'revoked';
}

export interface UpdateAdminShopStatusPayload {
  status: 'active' | 'paused' | 'closed';
}

export interface UpdateAdminShopStatusResult {
  id: EntityId;
  status: 'active' | 'paused' | 'closed';
}

export interface AdminShopDetailInfo {
  id: EntityId;
  name: string;
  ownerId: EntityId;
  ownerName: string;
  ownerPhone: string | null;
  category: string | null;
  status: 'active' | 'paused' | 'closed';
  statusLabel: '营业中' | '暂停营业' | '已关闭';
  description: string | null;
  products: number;
  orders: number;
  score: number;
  brandAuthCount: number;
  totalSales: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminShopDetailProductItem {
  id: EntityId;
  name: string;
  brandName: string | null;
  price: number;
  originalPrice: number;
  sales: number;
  stock: number;
  frozenStock: number;
  status: 'active' | 'off_shelf' | 'disabled';
  statusLabel: '在售' | '已下架' | '不可售';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminShopDetailOrderItem {
  id: EntityId;
  orderNo: string;
  buyerName: string;
  amount: number;
  statusCode: number;
  createdAt: string | null;
}

export interface AdminShopDetailGuessItem {
  id: EntityId;
  title: string;
  statusCode: number;
  endTime: string | null;
  betCount: number;
  createdAt: string | null;
}

export interface AdminShopDetailBrandAuthItem {
  id: EntityId;
  authNo: string;
  brandId: EntityId;
  brandName: string;
  authTypeLabel: '普通授权' | '独家授权' | '试用授权';
  authScopeLabel: '全品牌授权' | '指定类目授权' | '指定商品授权';
  status: 'active' | 'expired' | 'revoked';
  statusLabel: '生效中' | '已过期' | '已撤销';
  grantedAt: string | null;
  expireAt: string | null;
}

export interface AdminShopDetailResult {
  shop: AdminShopDetailInfo;
  products: AdminShopDetailProductItem[];
  orders: AdminShopDetailOrderItem[];
  guesses: AdminShopDetailGuessItem[];
  brandAuths: AdminShopDetailBrandAuthItem[];
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

export interface CreateAdminRolePayload {
  code: string;
  name: string;
  description?: string;
  sort?: number;
  status?: 'active' | 'disabled';
}

export interface CreateAdminRoleResult {
  id: EntityId;
}

export interface UpdateAdminRolePayload {
  code: string;
  name: string;
  description?: string;
  sort?: number;
}

export interface UpdateAdminRoleResult {
  id: EntityId;
}

export interface CreateAdminNotificationPayload {
  title: string;
  content: string;
  type: 'system' | 'order' | 'guess' | 'social';
  audience: 'all_users' | 'order_users' | 'guess_users' | 'post_users' | 'chat_users';
  actionUrl?: string | null;
}

export interface CreateAdminNotificationResult {
  sentCount: number;
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

export type AdminBannerDisplayStatus = 'active' | 'scheduled' | 'paused' | 'ended';
export type AdminBannerRawStatus = 'active' | 'disabled';
export type AdminBannerTargetType = BannerItem['targetType'];

export interface AdminBannerItem {
  id: EntityId;
  position: string;
  positionLabel: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  targetType: AdminBannerTargetType;
  targetTypeLabel: string;
  targetId: EntityId | null;
  targetName: string | null;
  actionUrl: string | null;
  sort: number;
  rawStatus: AdminBannerRawStatus;
  status: AdminBannerDisplayStatus;
  statusLabel: '投放中' | '待排期' | '已暂停' | '已结束';
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBannerListResult {
  items: AdminBannerItem[];
  summary: {
    total: number;
    active: number;
    scheduled: number;
    paused: number;
    ended: number;
  };
}

export interface CreateAdminBannerPayload {
  position: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  targetType: AdminBannerTargetType;
  targetId?: EntityId | null;
  actionUrl?: string | null;
  sort?: number;
  status?: AdminBannerRawStatus;
  startAt?: string | null;
  endAt?: string | null;
}

export interface CreateAdminBannerResult {
  id: EntityId;
}

export interface UpdateAdminBannerPayload {
  position: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  targetType: AdminBannerTargetType;
  targetId?: EntityId | null;
  actionUrl?: string | null;
  sort?: number;
  status?: AdminBannerRawStatus;
  startAt?: string | null;
  endAt?: string | null;
}

export interface UpdateAdminBannerResult {
  id: EntityId;
}

export interface UpdateAdminBannerStatusPayload {
  status: AdminBannerRawStatus;
}

export interface UpdateAdminBannerStatusResult {
  id: EntityId;
  status: AdminBannerRawStatus;
}

export interface DeleteAdminBannerResult {
  id: EntityId;
}

export type AdminCheckinRewardType = 'coin' | 'coupon' | 'physical';
export type AdminCheckinRewardConfigStatus = 'active' | 'disabled';

export interface AdminCheckinRewardConfigItem {
  id: EntityId;
  dayNo: number;
  rewardType: AdminCheckinRewardType;
  rewardTypeLabel: '零食币' | '优惠券' | '实物';
  rewardValue: number;
  rewardRefId: EntityId | null;
  title: string | null;
  sort: number;
  status: AdminCheckinRewardConfigStatus;
  statusLabel: '启用' | '停用';
  createdAt: string;
  updatedAt: string;
}

export interface AdminCheckinRewardConfigListResult {
  items: AdminCheckinRewardConfigItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
  };
}

export interface CreateAdminCheckinRewardConfigPayload {
  dayNo: number;
  rewardType: AdminCheckinRewardType;
  rewardValue: number;
  rewardRefId?: EntityId | null;
  title?: string | null;
  sort?: number;
  status?: AdminCheckinRewardConfigStatus;
}

export interface CreateAdminCheckinRewardConfigResult {
  id: EntityId;
}

export interface UpdateAdminCheckinRewardConfigPayload {
  dayNo: number;
  rewardType: AdminCheckinRewardType;
  rewardValue: number;
  rewardRefId?: EntityId | null;
  title?: string | null;
  sort?: number;
}

export interface UpdateAdminCheckinRewardConfigResult {
  id: EntityId;
}

export interface UpdateAdminCheckinRewardConfigStatusPayload {
  status: AdminCheckinRewardConfigStatus;
}

export interface UpdateAdminCheckinRewardConfigStatusResult {
  id: EntityId;
  status: AdminCheckinRewardConfigStatus;
}

export type AdminInviteRewardType = 'coin' | 'coupon' | 'physical';
export type AdminInviteRewardConfigStatus = 'active' | 'disabled';

export interface AdminInviteRewardConfigItem {
  id: EntityId;
  inviterRewardType: AdminInviteRewardType;
  inviterRewardTypeLabel: '零食币' | '优惠券' | '实物';
  inviterRewardValue: number;
  inviterRewardRefId: EntityId | null;
  inviteeRewardType: AdminInviteRewardType;
  inviteeRewardTypeLabel: '零食币' | '优惠券' | '实物';
  inviteeRewardValue: number;
  inviteeRewardRefId: EntityId | null;
  status: AdminInviteRewardConfigStatus;
  statusLabel: '启用' | '停用';
  createdAt: string;
  updatedAt: string;
}

export interface AdminInviteRecordItem {
  id: EntityId;
  inviterId: EntityId;
  inviterName: string;
  inviterPhone: string | null;
  inviterUidCode: string | null;
  inviteCode: string | null;
  inviteeId: EntityId;
  inviteeName: string;
  inviteePhone: string | null;
  inviteeUidCode: string | null;
  registeredAt: string;
}

export interface AdminInviteRecordListResult {
  items: AdminInviteRecordItem[];
  summary: {
    total: number;
    distinctInviters: number;
  };
}

export interface UpdateAdminInviteRewardConfigPayload {
  inviterRewardType: AdminInviteRewardType;
  inviterRewardValue: number;
  inviterRewardRefId?: EntityId | null;
  inviteeRewardType: AdminInviteRewardType;
  inviteeRewardValue: number;
  inviteeRewardRefId?: EntityId | null;
  status: AdminInviteRewardConfigStatus;
}

export interface UpdateAdminInviteRewardConfigResult {
  item: AdminInviteRewardConfigItem;
}

export type AdminCouponTemplateType = 'cash' | 'discount' | 'shipping';
export type AdminCouponTemplateScopeType = 'platform' | 'shop';
export type AdminCouponTemplateValidityType = 'fixed' | 'relative';
export type AdminCouponTemplateRawStatus = 'active' | 'paused' | 'disabled';
export type AdminCouponTemplateDisplayStatus =
  | 'active'
  | 'scheduled'
  | 'paused'
  | 'disabled'
  | 'ended';
export type AdminCouponSourceType =
  | 'admin'
  | 'activity'
  | 'compensation'
  | 'system';
export type AdminCouponGrantAudience =
  | 'all_users'
  | 'order_users'
  | 'guess_users'
  | 'shop_users';
export type AdminCouponGrantBatchDisplayStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface AdminCouponTemplateItem {
  id: EntityId;
  code: string;
  name: string;
  type: AdminCouponTemplateType;
  typeLabel: '满减券' | '折扣券' | '运费券';
  rawStatus: AdminCouponTemplateRawStatus;
  status: AdminCouponTemplateDisplayStatus;
  statusLabel: '启用' | '待开始' | '已暂停' | '已停用' | '已结束';
  scopeType: AdminCouponTemplateScopeType;
  scopeTypeLabel: '平台通用' | '指定店铺';
  shopId: EntityId | null;
  shopName: string | null;
  description: string | null;
  sourceType: AdminCouponSourceType;
  sourceTypeLabel: '后台人工' | '活动发放' | '补偿发放' | '系统发放';
  minAmount: number;
  discountAmount: number;
  discountRate: number | null;
  maxDiscountAmount: number;
  validityType: AdminCouponTemplateValidityType;
  validityTypeLabel: '固定时间段' | '领取后 N 天';
  startAt: string | null;
  endAt: string | null;
  validDays: number;
  totalQuantity: number;
  userLimit: number;
  grantedCount: number;
  remainingQuantity: number | null;
  batchCount: number;
  lastBatchAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponListResult {
  items: AdminCouponTemplateItem[];
  summary: {
    total: number;
    active: number;
    scheduled: number;
    paused: number;
    disabled: number;
    ended: number;
  };
}

export interface AdminCouponGrantBatchItem {
  id: EntityId;
  batchNo: string;
  templateId: EntityId | null;
  sourceType: AdminCouponSourceType;
  sourceTypeLabel: '后台人工' | '活动发放' | '补偿发放' | '系统发放';
  operatorId: EntityId | null;
  operatorName: string | null;
  targetUserCount: number;
  grantedCount: number;
  status: AdminCouponGrantBatchDisplayStatus;
  statusLabel: '待执行' | '执行中' | '已完成' | '已失败';
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponGrantBatchListResult {
  items: AdminCouponGrantBatchItem[];
}

export interface CreateAdminCouponTemplatePayload {
  name: string;
  type: AdminCouponTemplateType;
  scopeType: AdminCouponTemplateScopeType;
  shopId?: EntityId | null;
  description?: string | null;
  minAmount: number;
  discountAmount?: number;
  discountRate?: number;
  maxDiscountAmount?: number;
  validityType: AdminCouponTemplateValidityType;
  startAt?: string | null;
  endAt?: string | null;
  validDays?: number;
  totalQuantity: number;
  userLimit: number;
  status?: AdminCouponTemplateRawStatus;
}

export interface CreateAdminCouponTemplateResult {
  id: EntityId;
}

export interface UpdateAdminCouponTemplatePayload {
  name: string;
  type: AdminCouponTemplateType;
  scopeType: AdminCouponTemplateScopeType;
  shopId?: EntityId | null;
  description?: string | null;
  minAmount: number;
  discountAmount?: number;
  discountRate?: number;
  maxDiscountAmount?: number;
  validityType: AdminCouponTemplateValidityType;
  startAt?: string | null;
  endAt?: string | null;
  validDays?: number;
  totalQuantity: number;
  userLimit: number;
  status?: AdminCouponTemplateRawStatus;
}

export interface UpdateAdminCouponTemplateResult {
  id: EntityId;
}

export interface UpdateAdminCouponTemplateStatusPayload {
  status: AdminCouponTemplateRawStatus;
}

export interface UpdateAdminCouponTemplateStatusResult {
  id: EntityId;
  status: AdminCouponTemplateRawStatus;
}

export interface CreateAdminCouponGrantBatchPayload {
  audience: AdminCouponGrantAudience;
  note?: string | null;
}

export interface CreateAdminCouponGrantBatchResult {
  id: EntityId;
  grantedCount: number;
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

export interface AdminRankingSummaryItem {
  id: string;
  boardType: RankingType;
  boardTypeLabel: string;
  periodType: RankingPeriodType;
  periodTypeLabel: string;
  periodValue: string;
  periodLabel: string;
  entryCount: number;
  topUserId: UserId | null;
  topUserName: string | null;
  topUserUid: string | null;
  topScore: number;
  topValue: string;
  generatedAt: string;
}

export interface AdminRankingListResult {
  items: AdminRankingSummaryItem[];
  summary: {
    total: number;
    guessWins: number;
    winRate: number;
    inviteCount: number;
  };
}

export interface AdminRankingEntryItem {
  rank: number;
  userId: UserId;
  userUid: string | null;
  nickname: string;
  avatar: string | null;
  level: number;
  score: number;
  value: string;
  extraSummary: string | null;
}

export interface AdminRankingDetailResult {
  boardType: RankingType;
  boardTypeLabel: string;
  periodType: RankingPeriodType;
  periodTypeLabel: string;
  periodValue: string;
  periodLabel: string;
  generatedAt: string;
  totalEntries: number;
  items: AdminRankingEntryItem[];
}

export type AdminCommunityPostType = 'post' | 'guess' | 'repost';
export type AdminCommunityPostScope = 'public' | 'followers' | 'private' | 'unknown';

export interface AdminCommunityPostItem {
  id: EntityId;
  title: string | null;
  content: string;
  tag: string | null;
  type: AdminCommunityPostType;
  typeLabel: string;
  scope: AdminCommunityPostScope;
  scopeLabel: string;
  authorId: UserId;
  authorUid: string | null;
  authorName: string;
  guessId: GuessId | null;
  guessTitle: string | null;
  images: string[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCommunityPostListResult {
  items: AdminCommunityPostItem[];
}

export interface DeleteAdminCommunityPostResult {
  id: EntityId;
  success: true;
}

export interface AdminCommunityCommentItem {
  id: EntityId;
  targetType: 'post';
  targetPostId: EntityId | null;
  targetPostTitle: string | null;
  parentId: EntityId | null;
  content: string;
  authorId: UserId;
  authorUid: string | null;
  authorName: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
}

export interface AdminCommunityCommentListResult {
  items: AdminCommunityCommentItem[];
}

export interface DeleteAdminCommunityCommentResult {
  id: EntityId;
  success: true;
}

export type AdminCommunityReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';
export type AdminCommunityReportReasonType =
  | 'spam'
  | 'explicit'
  | 'abuse'
  | 'false_info'
  | 'other';
export type AdminCommunityReportAction = 'review' | 'approve' | 'reject' | 'ban';
export type AdminCommunityReportHandleAction = 'approve' | 'reject' | 'ban' | null;

export interface AdminCommunityReportItem {
  id: EntityId;
  reporterUserId: UserId;
  reporterUid: string | null;
  reporterName: string;
  targetType: 'post';
  targetId: EntityId;
  targetTitle: string | null;
  targetContent: string | null;
  targetAuthorId: UserId | null;
  targetAuthorUid: string | null;
  targetAuthorName: string | null;
  reasonType: AdminCommunityReportReasonType;
  reasonLabel: string;
  reasonDetail: string | null;
  status: AdminCommunityReportStatus;
  statusLabel: string;
  handleAction: AdminCommunityReportHandleAction;
  handleActionLabel: string | null;
  handleNote: string | null;
  handledAt: string | null;
  createdAt: string;
}

export interface AdminCommunityReportListResult {
  items: AdminCommunityReportItem[];
  summary: {
    total: number;
    pending: number;
    reviewing: number;
    resolved: number;
    rejected: number;
  };
}

export interface UpdateAdminCommunityReportPayload {
  action: AdminCommunityReportAction;
  note?: string | null;
}

export interface UpdateAdminCommunityReportResult {
  item: AdminCommunityReportItem;
}

export type AdminLiveRoomStatus = 'live' | 'upcoming' | 'ended';

export interface AdminLiveRoomItem {
  id: EntityId;
  title: string;
  imageUrl: string | null;
  hostId: UserId | null;
  hostUid: string | null;
  hostName: string;
  rawStatusCode: number | null;
  status: AdminLiveRoomStatus;
  statusLabel: string;
  startTime: string | null;
  guessCount: number;
  currentGuessTitle: string | null;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLiveRoomListResult {
  items: AdminLiveRoomItem[];
  summary: {
    total: number;
    live: number;
    upcoming: number;
    ended: number;
  };
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

export interface ReviewAdminGuessPayload {
  status: 'approved' | 'rejected';
  rejectReason?: string | null;
}

export interface ReviewAdminGuessResult {
  id: GuessId;
  status: 'approved' | 'rejected';
}

export type AdminUserFilter = 'all' | 'user' | 'shop_owner' | 'banned';

export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  phone?: string;
  shopName?: string;
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

export type AdminEquityAccountSubType = 'category' | 'exchange' | 'general';
export type AdminEquityLogType = 'grant' | 'use' | 'expire' | 'adjust' | 'unknown';

export interface AdminEquityAccountItem {
  id: EntityId;
  userId: EntityId;
  userName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  categoryAmount: number;
  exchangeAmount: number;
  generalAmount: number;
  totalBalance: number;
  totalGranted: number;
  totalUsed: number;
  totalExpired: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEquityLogItem {
  id: EntityId;
  accountId: EntityId;
  userId: EntityId;
  type: AdminEquityLogType;
  subType: AdminEquityAccountSubType | null;
  amount: number;
  balance: number;
  sourceType: number | null;
  refId: EntityId | null;
  note: string | null;
  expireAt: string | null;
  createdAt: string;
}

export interface AdminEquityListResult {
  items: AdminEquityAccountItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    totalAccounts: number;
    totalGranted: number;
    totalUsed: number;
    totalExpired: number;
    activeBalance: number;
  };
}

export interface AdminEquityDetailResult {
  account: AdminEquityAccountItem;
  logs: AdminEquityLogItem[];
}

export interface AdjustAdminEquityPayload {
  userId: EntityId;
  subType: AdminEquityAccountSubType;
  amount: number;
  note?: string | null;
}

export interface AdjustAdminEquityResult {
  account: AdminEquityAccountItem;
  log: AdminEquityLogItem;
}
