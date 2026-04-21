import type {
  EntityId,
  GuessSummary,
} from './domain';

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
