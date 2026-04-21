import { randomBytes } from 'node:crypto';
import type mysql from 'mysql2/promise';

export const STATUS_PENDING = 10;
export const STATUS_APPROVED = 30;
export const STATUS_REJECTED = 40;

export const SHOP_STATUS_ACTIVE = 10;
export const SHOP_STATUS_PAUSED = 20;
export const SHOP_STATUS_CLOSED = 90;

export const BRAND_STATUS_ACTIVE = 10;
export const BRAND_STATUS_DISABLED = 90;
export const CATEGORY_STATUS_ACTIVE = 10;

export const PRODUCT_STATUS_ACTIVE = 10;
export const PRODUCT_STATUS_OFF_SHELF = 20;
export const PRODUCT_STATUS_DISABLED = 90;

export const AUTH_STATUS_ACTIVE = 10;
export const AUTH_STATUS_EXPIRED = 90;
export const AUTH_STATUS_REVOKED = 91;

export const AUTH_TYPE_NORMAL = 10;
export const AUTH_TYPE_EXCLUSIVE = 20;
export const AUTH_TYPE_TRIAL = 30;

export const AUTH_SCOPE_ALL_BRAND = 10;
export const AUTH_SCOPE_CATEGORY_ONLY = 20;
export const AUTH_SCOPE_PRODUCT_ONLY = 30;

export type ShopListRow = {
  id: number | string;
  user_id: number | string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  category_name: string | null;
  status: number | string;
  product_count: number | string | null;
  order_count: number | string | null;
  avg_rating: number | string | null;
  brand_auth_count: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ShopApplyListRow = {
  id: number | string;
  apply_no: string;
  user_id: number | string;
  shop_name: string;
  applicant_name: string | null;
  contact_phone: string | null;
  category_name: string | null;
  reason: string | null;
  status: number | string;
  reject_reason: string | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
};

export type BrandAuthApplyListRow = {
  id: number | string;
  apply_no: string;
  shop_id: number | string;
  shop_name: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  brand_id: number | string;
  brand_name: string | null;
  reason: string | null;
  license: string | null;
  status: number | string;
  reject_reason: string | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
};

export type BrandAuthListRow = {
  id: number | string;
  auth_no: string;
  shop_id: number | string;
  shop_name: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  brand_id: number | string;
  brand_name: string | null;
  auth_type: number | string;
  auth_scope: number | string;
  scope_value: unknown;
  status: number | string;
  granted_at: Date | string;
  expire_at: Date | string | null;
  expired_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ShopProductListRow = {
  id: number | string;
  shop_id: number | string | null;
  shop_name: string | null;
  brand_product_id: number | string | null;
  brand_id: number | string | null;
  brand_name: string | null;
  product_name: string;
  price: number | string;
  original_price: number | string | null;
  guess_price: number | string | null;
  image_url: string | null;
  sales: number | string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type BrandCategoryRow = mysql.RowDataPacket & {
  id: number | string;
  status: number | string;
};

export type ShopDetailBaseRow = {
  id: number | string;
  user_id: number | string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  category_name: string | null;
  status: number | string;
  description: string | null;
  product_count: number | string | null;
  order_count: number | string | null;
  avg_rating: number | string | null;
  brand_auth_count: number | string | null;
  total_sales: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ShopDetailProductRow = {
  id: number | string;
  name: string;
  brand_name: string | null;
  price: number | string | null;
  original_price: number | string | null;
  sales: number | string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ShopDetailOrderRow = {
  id: number | string;
  order_sn: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  amount: number | string | null;
  status: number | string;
  created_at: Date | string;
};

export type ShopDetailGuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  end_time: Date | string | null;
  bet_count: number | string | null;
  created_at: Date | string;
};

export type BrandListRow = {
  id: number | string;
  name: string;
  logo_url: string | null;
  category_id: number | string | null;
  category_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  description: string | null;
  status: number | string;
  shop_count: number | string | null;
  goods_count: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export function createNo(prefix: string) {
  return `${prefix}${randomBytes(6).toString('hex')}`;
}

export function toId(value: number | string | null | undefined) {
  return value == null ? null : String(value);
}

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function parseJsonValue(value: unknown) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export function buildUserDisplayName(name: string | null, phone: string | null) {
  if (name?.trim()) {
    return name.trim();
  }
  if (phone?.trim()) {
    return `用户${phone.trim().slice(-4)}`;
  }
  return '未知用户';
}

export function mapReviewStatus(code: number | string) {
  const value = Number(code ?? 0);
  if (value === STATUS_APPROVED) {
    return { code: value, key: 'approved', label: '已通过' as const };
  }
  if (value === STATUS_REJECTED) {
    return { code: value, key: 'rejected', label: '已拒绝' as const };
  }
  return { code: value, key: 'pending', label: '待审核' as const };
}

export function mapShopStatus(
  code: number | string,
): { code: number; key: 'active' | 'paused' | 'closed'; label: '营业中' | '暂停营业' | '已关闭' } {
  const value = Number(code ?? 0);
  if (value === SHOP_STATUS_PAUSED) {
    return { code: value, key: 'paused', label: '暂停营业' as const };
  }
  if (value === SHOP_STATUS_CLOSED) {
    return { code: value, key: 'closed', label: '已关闭' as const };
  }
  return { code: value, key: 'active', label: '营业中' as const };
}

export function mapBrandStatus(code: number | string) {
  const value = Number(code ?? 0);
  if (value === BRAND_STATUS_DISABLED) {
    return { code: value, key: 'disabled', label: '停用' as const };
  }
  return { code: value, key: 'active', label: '合作中' as const };
}

export function mapProductStatus(
  code: number | string,
): { code: number; key: 'active' | 'off_shelf' | 'disabled'; label: '在售' | '已下架' | '不可售' } {
  const value = Number(code ?? 0);
  if (value === PRODUCT_STATUS_OFF_SHELF) {
    return { code: value, key: 'off_shelf', label: '已下架' as const };
  }
  if (value === PRODUCT_STATUS_DISABLED) {
    return { code: value, key: 'disabled', label: '不可售' as const };
  }
  return { code: value, key: 'active', label: '在售' as const };
}

export function mapAuthStatus(
  code: number | string,
): { code: number; key: 'active' | 'expired' | 'revoked'; label: '生效中' | '已过期' | '已撤销' } {
  const value = Number(code ?? 0);
  if (value === AUTH_STATUS_EXPIRED) {
    return { code: value, key: 'expired', label: '已过期' as const };
  }
  if (value === AUTH_STATUS_REVOKED) {
    return { code: value, key: 'revoked', label: '已撤销' as const };
  }
  return { code: value, key: 'active', label: '生效中' as const };
}

export function mapAuthType(code: number | string) {
  const value = Number(code ?? 0);
  if (value === AUTH_TYPE_EXCLUSIVE) {
    return { code: value, key: 'exclusive', label: '独家授权' as const };
  }
  if (value === AUTH_TYPE_TRIAL) {
    return { code: value, key: 'trial', label: '试用授权' as const };
  }
  return { code: value, key: 'normal', label: '普通授权' as const };
}

export function mapAuthScope(code: number | string) {
  const value = Number(code ?? 0);
  if (value === AUTH_SCOPE_CATEGORY_ONLY) {
    return { code: value, key: 'category_only', label: '指定类目授权' as const };
  }
  if (value === AUTH_SCOPE_PRODUCT_ONLY) {
    return { code: value, key: 'product_only', label: '指定商品授权' as const };
  }
  return { code: value, key: 'all_brand', label: '全品牌授权' as const };
}

export function summarizeByKey<TItem extends Record<string, unknown>>(
  items: TItem[],
  key: keyof TItem,
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = String(item[key] ?? '');
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}

export function normalizeReviewStatus(status: string | null | undefined) {
  if (status === 'approved' || status === 'rejected') {
    return status;
  }
  throw new Error('审核状态不合法');
}

export function normalizeRejectReason(
  status: 'approved' | 'rejected',
  rejectReason: string | null | undefined,
) {
  const value = rejectReason?.trim() ?? '';
  if (status === 'rejected' && !value) {
    throw new Error('请填写拒绝原因');
  }
  return value ? value.slice(0, 200) : null;
}

export function ensurePendingReview(status: number | string) {
  if (Number(status ?? 0) !== STATUS_PENDING) {
    throw new Error('申请已审核');
  }
}

export function normalizeBrandStatus(status: 'active' | 'disabled' | null | undefined) {
  if (status === 'disabled') {
    return BRAND_STATUS_DISABLED;
  }
  return BRAND_STATUS_ACTIVE;
}
