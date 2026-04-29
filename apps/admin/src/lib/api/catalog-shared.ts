export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  categoryId: string | null;
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

export interface AdminBrandProductSpecRow {
  key: string;
  value: string;
}

export interface AdminBrandLibraryItem {
  id: string;
  brandId: string | null;
  brandName: string;
  productName: string;
  categoryId: string | null;
  category: string;
  guidePrice: number;
  supplyPrice: number;
  status: 'active' | 'disabled';
  description: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  detailHtml: string | null;
  specTable: AdminBrandProductSpecRow[];
  packageList: string[];
  freight: number | null;
  shipFrom: string | null;
  deliveryDays: string | null;
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
  status: 'pending' | 'active' | 'pending_confirm' | 'ended';
  statusLabel: '待开赛' | '进行中' | '待确认' | '已结束';
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

export interface AdminPkMatchStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  cancelled: number;
  totalStakeAmount: number;
}

export interface AdminGuessDetailOption {
  id: string;
  optionIndex: number;
  optionText: string;
  odds: number;
  voteCount: number;
  voteAmount: number;
  isResult: boolean;
}

export interface AdminGuessDetailReviewLog {
  id: string;
  action: 'submit' | 'approve' | 'reject';
  actionLabel: '提交审核' | '审核通过' | '审核拒绝';
  fromStatus: number;
  toStatus: number;
  note: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  createdAt: string | null;
}

export interface AdminGuessDetailEvidence {
  id: string;
  sourceType: string;
  matchedIndex: number | null;
  confidence: number | null;
  reason: string | null;
  verifiedAt: string | null;
  createdAt: string | null;
  queryPayload: unknown;
  responsePayload: unknown;
}

export interface AdminGuessDetailComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string | null;
  replyCount: number;
}

export interface AdminGuessDetailResult {
  guess: {
    id: string;
    title: string;
    status: 'draft' | 'pending_review' | 'active' | 'settled' | 'cancelled';
    reviewStatus: 'pending' | 'approved' | 'rejected';
    category: string;
    creatorId: string;
    creatorName: string;
    description: string | null;
    topicDetail: string | null;
    scope: 'public' | 'friends';
    settlementMode: 'oracle' | 'manual';
    endTime: string | null;
    settledAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    product: {
      id: string | null;
      name: string;
      brand: string;
      price: number;
      guessPrice: number;
      imageUrl: string | null;
    };
    options: AdminGuessDetailOption[];
  };
  stats: {
    totalBets: number;
    totalParticipants: number;
    totalAmount: number;
  };
  reviewLogs: AdminGuessDetailReviewLog[];
  comments: AdminGuessDetailComment[];
  oracleEvidence: AdminGuessDetailEvidence[];
}

export interface AdminWarehouseStats {
  totalVirtual: number;
  totalPhysical: number;
}

export type PaginatedListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminProductListResult = PaginatedListResult<AdminProduct> & {
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
};
