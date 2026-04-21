import type {
  AdminCouponGrantAudience,
  AdminCouponGrantBatchItem,
  AdminCouponTemplateDisplayStatus,
  AdminCouponTemplateItem,
  AdminCouponTemplateRawStatus,
  AdminCouponTemplateScopeType,
  AdminCouponTemplateType,
  CreateAdminCouponTemplatePayload,
} from '@umi/shared';

export type CouponFilters = {
  name?: string;
  code?: string;
  type?: AdminCouponTemplateType;
  scopeType?: AdminCouponTemplateScopeType;
};

export type CouponFormValues = {
  name: string;
  type: AdminCouponTemplateType;
  scopeType: AdminCouponTemplateScopeType;
  shopId?: string;
  description?: string;
  minAmountYuan: number;
  discountAmountYuan?: number;
  discountRate?: number;
  maxDiscountAmountYuan?: number;
  validityType: CreateAdminCouponTemplatePayload['validityType'];
  startAt?: string;
  endAt?: string;
  validDays?: number;
  totalQuantity: number;
  userLimit: number;
  status: AdminCouponTemplateRawStatus;
};

export type GrantFormValues = {
  audience: AdminCouponGrantAudience;
  note?: string;
};

export const TYPE_OPTIONS = [
  { label: '满减券', value: 'cash' },
  { label: '折扣券', value: 'discount' },
  { label: '运费券', value: 'shipping' },
] as const;

export const SCOPE_OPTIONS = [
  { label: '平台通用', value: 'platform' },
  { label: '指定店铺', value: 'shop' },
] as const;

export const VALIDITY_OPTIONS = [
  { label: '固定时间段', value: 'fixed' },
  { label: '领取后 N 天', value: 'relative' },
] as const;

export const RAW_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '暂停', value: 'paused' },
  { label: '停用', value: 'disabled' },
] as const;

export const GRANT_AUDIENCE_OPTIONS = [
  { label: '全部用户', value: 'all_users' },
  { label: '下单用户', value: 'order_users' },
  { label: '竞猜用户', value: 'guess_users' },
  { label: '店主用户', value: 'shop_users' },
] as const;

export function couponStatusColor(status: AdminCouponTemplateDisplayStatus) {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'scheduled') {
    return 'processing';
  }
  if (status === 'paused') {
    return 'warning';
  }
  if (status === 'ended') {
    return 'default';
  }
  return 'error';
}

export function grantStatusColor(status: AdminCouponGrantBatchItem['status']) {
  if (status === 'completed') {
    return 'success';
  }
  if (status === 'processing') {
    return 'processing';
  }
  if (status === 'pending') {
    return 'warning';
  }
  return 'error';
}

export function centsToYuan(value: number) {
  return Number((value / 100).toFixed(2));
}

export function yuanToCents(value?: number | null) {
  if (value == null) {
    return undefined;
  }
  return Math.round(value * 100);
}

export function formatLocalDateTimeInput(value: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function buildCouponFormValues(record: AdminCouponTemplateItem): CouponFormValues {
  return {
    name: record.name,
    type: record.type,
    scopeType: record.scopeType,
    shopId: record.shopId ?? undefined,
    description: record.description || undefined,
    minAmountYuan: centsToYuan(record.minAmount),
    discountAmountYuan: centsToYuan(record.discountAmount),
    discountRate: record.discountRate ?? undefined,
    maxDiscountAmountYuan: centsToYuan(record.maxDiscountAmount),
    validityType: record.validityType,
    startAt: formatLocalDateTimeInput(record.startAt),
    endAt: formatLocalDateTimeInput(record.endAt),
    validDays: record.validDays || undefined,
    totalQuantity: record.totalQuantity,
    userLimit: record.userLimit,
    status: record.rawStatus,
  };
}

export function buildDefaultCouponFormValues(): CouponFormValues {
  return {
    type: 'cash',
    scopeType: 'platform',
    validityType: 'fixed',
    minAmountYuan: 0,
    discountAmountYuan: 0,
    totalQuantity: 100,
    userLimit: 1,
    status: 'active',
    name: '',
  };
}
