export interface AdminDashboardStats {
  generatedAt: string;
  users: number;
  products: number;
  activeGuesses: number;
  orders: number;
  todayUsers: number;
  todayBets: number;
  todayOrders: number;
  todayGmv: number;
  trend: AdminDashboardTrendItem[];
  orderDistribution: AdminDashboardDistributionItem[];
  guessCategories: AdminDashboardDistributionItem[];
  hotGuesses: AdminDashboardHotGuess[];
  hotProducts: AdminDashboardHotProduct[];
  pendingQueues: AdminDashboardQueueItem[];
}

export interface AdminDashboardTrendItem {
  date: string;
  bets: number;
  orders: number;
  users: number;
  gmv: number;
}

export interface AdminDashboardDistributionItem {
  type: string;
  value: number;
}

export interface AdminDashboardHotGuess {
  id: string;
  title: string;
  category: string;
  participants: number;
  poolAmount: number;
  endTime: string;
}

export interface AdminDashboardHotProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  stock: number;
  sales: number;
  status: string;
}

export interface AdminDashboardQueueItem {
  id: string;
  title: string;
  count: number;
  tone: 'processing' | 'warning' | 'error';
  description: string;
}

export interface AdminWarehouseStats {
  totalVirtual: number;
  totalPhysical: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  shopId: string | null;
  price: number;
  stock: number;
  availableStock: number;
  frozenStock: number;
  status: 'active' | 'paused' | 'low_stock' | 'off_shelf' | 'disabled';
  shopName: string;
  updatedAt: string;
  tags: string[];
  imageUrl?: string | null;
  brandProductId?: string | null;
}

export interface AdminBrandLibraryItem {
  id: string;
  brandId: string | null;
  brandName: string;
  productName: string;
  category: string;
  guidePrice: number;
  status: 'active' | 'disabled';
  updatedAt: string;
  imageUrl: string | null;
  productCount: number;
  activeProductCount: number;
}

export interface AdminFriendGuessItem {
  id: string;
  guessId: string;
  roomName: string;
  inviterId: string;
  inviter: string;
  participants: number;
  reward: string;
  status: 'pending' | 'active' | 'ended';
  statusLabel: '待开赛' | '进行中' | '已结束';
  endTime: string;
  invitationCount: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  rejectedInvitations: number;
  expiredInvitations: number;
  confirmedResults: number;
  rejectedResults: number;
  betParticipantCount: number;
  paidAmount: number;
  paymentMode: number | null;
  paidBy: string | null;
}

export interface AdminPkMatchItem {
  id: string;
  guessId: string;
  title: string;
  leftUserId: string;
  leftUser: string;
  rightUserId: string;
  rightUser: string;
  leftChoice: string | null;
  rightChoice: string | null;
  stake: number;
  result: string;
  resultCode: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  statusLabel: '待开赛' | '进行中' | '完成' | '已取消';
  rewardType: number | null;
  rewardValue: number | null;
  rewardRefId: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface AdminShopItem {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string | null;
  category: string | null;
  status: 'active' | 'paused' | 'closed';
  statusLabel: '营业中' | '暂停营业' | '已关闭';
  products: number;
  orders: number;
  score: number;
  brandAuthCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminShopApplyItem {
  id: string;
  applyNo: string;
  userId: string;
  shopName: string;
  applicant: string;
  contact: string | null;
  category: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: '待审核' | '已通过' | '已拒绝';
  rejectReason: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
}

export interface AdminBrandItem {
  id: string;
  name: string;
  logoUrl: string | null;
  category: string | null;
  contactName: string | null;
  contactPhone: string | null;
  description: string | null;
  status: 'active' | 'disabled';
  statusLabel: '合作中' | '停用';
  shopCount: number;
  goodsCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminBrandApplyItem {
  id: string;
  applyNo: string;
  name: string;
  category: string | null;
  applicant: string | null;
  contactPhone: string | null;
  license: string | null;
  deposit: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: '待审核' | '已通过' | '已拒绝';
  rejectReason: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  brandId: string | null;
}

export interface AdminBrandAuthApplyItem {
  id: string;
  applyNo: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  ownerPhone: string | null;
  brandId: string;
  brandName: string;
  reason: string | null;
  license: string | null;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: '待审核' | '已通过' | '已拒绝';
  rejectReason: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  scope: null;
}

export interface AdminBrandAuthRecordItem {
  id: string;
  authNo: string | null;
  shopId: string;
  shopName: string;
  ownerName: string;
  ownerPhone: string | null;
  brandId: string;
  brandName: string;
  subject: string;
  authType: 'normal' | 'exclusive' | 'trial';
  authTypeLabel: '普通授权' | '独家授权' | '试用授权';
  authScope: 'all_brand' | 'category_only' | 'product_only';
  authScopeLabel: '全品牌授权' | '指定类目授权' | '指定商品授权';
  scopeValue: unknown;
  status: 'active' | 'expired' | 'revoked';
  statusLabel: '生效中' | '已过期' | '已撤销';
  grantedAt: string | null;
  expireAt: string | null;
  expiredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  operatorName: string | null;
}

export interface AdminShopProductItem {
  id: string;
  shopId: string | null;
  shopName: string;
  brandProductId: string | null;
  brandId: string | null;
  brandName: string;
  productName: string;
  price: number;
  originalPrice: number;
  guessPrice: number;
  imageUrl: string | null;
  sales: number;
  stock: number;
  availableStock: number;
  frozenStock: number;
  status: 'active' | 'off_shelf' | 'disabled';
  statusLabel: '在售' | '已下架' | '不可售';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminProductAuthItem {
  id: string;
  authId: string;
  authNo: string | null;
  brandId: string;
  brandName: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  ownerPhone: string | null;
  subject: string;
  scopeValue: unknown;
  status: 'active' | 'expired' | 'revoked';
  statusLabel: '生效中' | '已过期' | '已撤销';
  grantedAt: string | null;
  expireAt: string | null;
  createdAt: string | null;
}

export interface AdminProductAuthRecordItem {
  id: string;
  subject: string;
  mode: string;
  operatorName: string | null;
  status: 'active' | 'expired' | 'revoked';
  statusLabel: '生效中' | '已过期' | '已撤销';
  createdAt: string | null;
}

export interface AdminTransactionRow {
  id: string;
  orderId: string;
  orderSn: string | null;
  userId: string;
  userName: string | null;
  channel: string;
  channelDerived: boolean;
  amount: number;
  direction: 'payment' | 'refund';
  statusLabel: string;
  statusCode: number | null;
  sourceTable: 'order' | 'order_refund';
  createdAt: string;
}

export interface AdminLogisticsRow {
  id: string;
  fulfillmentSn: string | null;
  orderId: string | null;
  orderSn: string | null;
  userId: string;
  receiver: string | null;
  phoneNumber: string | null;
  carrier: string;
  carrierDerived: boolean;
  trackingNo: string | null;
  shippingType: 'express' | 'same_city' | 'self_pickup' | 'unknown';
  shippingTypeLabel: string;
  shippingFee: number;
  totalAmount: number;
  status: 'stored' | 'shipping' | 'completed' | 'cancelled';
  statusLabel: string;
  productSummary: string;
  createdAt: string;
  shippedAt: string | null;
  completedAt: string | null;
}

export interface AdminConsignRow {
  id: string;
  tradeNo: string | null;
  physicalItemId: string | null;
  productName: string;
  productImg: string | null;
  userId: string;
  buyerUserId: string | null;
  orderId: string | null;
  orderSn: string | null;
  price: number;
  listingPrice: number | null;
  commissionAmount: number;
  sellerAmount: number;
  statusCode: number;
  settlementStatusCode: number | null;
  statusLabel: string;
  sourceType: string;
  sourceTypeDerived: boolean;
  createdAt: string;
  listedAt: string | null;
  tradedAt: string | null;
  settledAt: string | null;
  canceledAt: string | null;
}

export interface AdminNotificationItem {
  id: string;
  title: string;
  audience: 'all_users' | 'order_users' | 'guess_users' | 'post_users' | 'chat_users' | 'targeted_users';
  type: 'system' | 'order' | 'guess' | 'social';
  status: 'sent';
  targetType: 'order' | 'guess' | 'post' | 'chat' | 'unknown';
  targetId: string | null;
  actionUrl: string | null;
  recipientCount: number;
  readCount: number;
  unreadCount: number;
  createdAt: string;
  sentAt: string;
}

export interface AdminChatItem {
  id: string;
  userA: { id: string; uid: string | null; name: string };
  userB: { id: string; uid: string | null; name: string };
  messages: number;
  unreadMessages: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'normal' | 'review' | 'escalated';
  updatedAt: string;
}

export interface AdminSystemUserItem {
  id: string;
  username: string;
  displayName: string;
  phoneNumber: string | null;
  email: string | null;
  role: string;
  roleCodes: string[];
  status: 'active' | 'disabled';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminRoleListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: string;
  memberCount: number;
  permissionCount: number;
  status: 'active' | 'disabled';
  isSystem: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPermissionMatrixPermission {
  id: string;
  code: string;
  name: string;
  action: 'view' | 'create' | 'edit' | 'manage' | 'unknown';
  parentId: string | null;
  enabledRoleIds: string[];
}

export interface AdminPermissionMatrixCell {
  roleId: string;
  roleCode: string;
  roleName: string;
  level: 'none' | 'view' | 'create' | 'edit' | 'manage';
  permissionCodes: string[];
  permissionNames: string[];
}

export interface AdminPermissionMatrixModule {
  module: string;
  permissions: AdminPermissionMatrixPermission[];
  cells: AdminPermissionMatrixCell[];
}

export interface AdminPermissionMatrixData {
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: 'active' | 'disabled';
    isSystem: boolean;
  }>;
  modules: AdminPermissionMatrixModule[];
  summary: {
    roles: number;
    modules: number;
    permissions: number;
  };
}

export interface AdminCategoryItem {
  id: string;
  bizType: 'brand' | 'shop' | 'product' | 'guess' | 'unknown';
  bizTypeCode: number;
  bizTypeLabel: '品牌分类' | '店铺经营分类' | '商品分类' | '竞猜分类' | '未知业务';
  parentId: string | null;
  parentName: string | null;
  level: number;
  path: string | null;
  name: string;
  iconUrl: string | null;
  description: string | null;
  sort: number;
  status: 'active' | 'disabled';
  statusLabel: '启用中' | '停用';
  usageCount: number;
  usageBreakdown: {
    brands: number;
    brandApplies: number;
    brandProducts: number;
    shops: number;
    shopApplies: number;
    guesses: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminRiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  module: string;
}

export interface AdminActivityItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface AdminTodoItem {
  id: string;
  title: string;
  owner: string;
  deadline: string;
}
