import type {
  ChatMessageId,
  EntityId,
  GuessId,
  NotificationId,
  UserId,
} from './domain';

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

export interface SocialFriendsResult {
  items: SocialUserItem[];
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
