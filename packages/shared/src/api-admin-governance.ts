import type {
  CategoryId,
  EntityId,
  GuessId,
  GuessSummary,
  OrderSummary,
  ProductId,
  UserId,
  UserSummary,
} from './domain';

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

export interface RefreshAdminRankingsPayload {
  boardType?: RankingType | null;
  periodType?: RankingPeriodType | null;
  periodValue?: string | null;
}

export interface RefreshAdminRankingItem {
  boardType: RankingType;
  periodType: RankingPeriodType;
  periodValue: string;
  entryCount: number;
  generatedAt: string;
}

export interface RefreshAdminRankingsResult {
  items: RefreshAdminRankingItem[];
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

export interface StopAdminLiveRoomResult {
  item: AdminLiveRoomItem;
}

export interface CreateAdminGuessPayload {
  title: string;
  categoryId: CategoryId;
  productId: ProductId;
  endTime: string;
  description?: string | null;
  imageUrl?: string | null;
  optionTexts: string[];
}

export interface CreateAdminGuessResult {
  id: GuessId;
  status: 'active';
  reviewStatus: 'approved';
}

export interface ReviewAdminGuessPayload {
  status: 'approved' | 'rejected';
  rejectReason?: string | null;
}

export interface ReviewAdminGuessResult {
  id: GuessId;
  status: 'approved' | 'rejected';
}

export interface AbandonAdminGuessPayload {
  reason: string;
}

export interface AbandonAdminGuessResult {
  id: GuessId;
  status: 'abandoned';
}

export interface UpdateAdminGuessPayload {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  endTime?: string;
}

export interface UpdateAdminGuessResult {
  id: GuessId;
}

export interface SettleAdminGuessPayload {
  winnerOptionIndex: number;
}

export interface SettleAdminGuessResult {
  id: GuessId;
  status: 'settled';
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
