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

export interface AdminBrandProductSpecDefinition {
  name: string;
  values: string[];
}

export interface AdminBrandLibrarySkuItem {
  id: string;
  skuCode: string | null;
  spec: Record<string, string>;
  specSummary: string;
  specSignature: string;
  guidePrice: number;
  supplyPrice: number | null;
  guessPrice: number | null;
  stock: number;
  frozenStock: number;
  availableStock: number;
  image: string | null;
  status: 'active' | 'disabled';
  sort: number;
}

export interface AdminBrandLibraryItem {
  id: string;
  brandId: string | null;
  brandName: string;
  productName: string;
  categoryId: string | null;
  category: string;
  guidePriceMin: number;
  guidePriceMax: number;
  stockTotal: number;
  availableTotal: number;
  status: 'active' | 'disabled';
  description: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  imageList: string[];
  videoUrl: string | null;
  detailHtml: string | null;
  specTable: AdminBrandProductSpecRow[];
  packageList: string[];
  freight: number | null;
  shipFrom: string | null;
  deliveryDays: string | null;
  tags: string[];
  collab: string | null;
  specDefinitions: AdminBrandProductSpecDefinition[] | null;
  skus: AdminBrandLibrarySkuItem[];
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
  status: 'pending' | 'active' | 'pending_confirm' | 'settled' | 'abandoned';
  statusLabel: '待开赛' | '进行中' | '待确认' | '已结算' | '已作废';
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
  action: 'submit' | 'approve' | 'reject' | 'abandon' | 'settle' | 'edit';
  actionLabel: '提交审核' | '审核通过' | '审核拒绝' | '运营作废' | '手动开奖' | '运营编辑';
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
    status: 'draft' | 'pending_review' | 'active' | 'pending_settle' | 'settled' | 'abandoned' | 'cancelled';
    reviewStatus: 'pending' | 'approved' | 'rejected';
    category: string;
    creatorId: string;
    creatorName: string;
    description: string | null;
    topicDetail: string | null;
    imageUrl: string | null;
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
