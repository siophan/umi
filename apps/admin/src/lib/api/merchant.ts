import type {
  AdminShopDetailResult,
  CreateAdminBrandPayload,
  CreateAdminBrandResult,
  ReviewAdminBrandAuthApplyPayload,
  ReviewAdminBrandAuthApplyResult,
  ReviewAdminShopApplyPayload,
  ReviewAdminShopApplyResult,
  UpdateAdminBrandPayload,
  UpdateAdminBrandResult,
  UpdateAdminShopStatusPayload,
  UpdateAdminShopStatusResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';

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
  categoryId: string | null;
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

type SummaryListResult<TItem, TSummary> = {
  items: TItem[];
  summary: TSummary;
};

export function fetchAdminShops() {
  return getJson<
    SummaryListResult<AdminShopItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops');
}

export function fetchAdminShopDetail(id: string) {
  return getJson<AdminShopDetailResult>(`/api/admin/shops/${id}`);
}

export function updateAdminShopStatus(id: string, payload: UpdateAdminShopStatusPayload) {
  return putJson<UpdateAdminShopStatusResult, UpdateAdminShopStatusPayload>(
    `/api/admin/shops/${id}/status`,
    payload,
  );
}

export function fetchAdminShopApplies() {
  return getJson<
    SummaryListResult<AdminShopApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops/applies');
}

export function reviewAdminShopApply(id: string, payload: ReviewAdminShopApplyPayload) {
  return putJson<ReviewAdminShopApplyResult, ReviewAdminShopApplyPayload>(
    `/api/admin/shops/applies/${id}/review`,
    payload,
  );
}

export function fetchAdminBrands() {
  return getJson<
    SummaryListResult<AdminBrandItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands');
}

export function createAdminBrand(payload: CreateAdminBrandPayload) {
  return postJson<CreateAdminBrandResult, CreateAdminBrandPayload>(
    '/api/admin/brands',
    payload,
  );
}

export function updateAdminBrand(id: string, payload: UpdateAdminBrandPayload) {
  return putJson<UpdateAdminBrandResult, UpdateAdminBrandPayload>(
    `/api/admin/brands/${id}`,
    payload,
  );
}

export function fetchAdminBrandAuthApplies() {
  return getJson<
    SummaryListResult<
      AdminBrandAuthApplyItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/brands/auth-applies');
}

export function reviewAdminBrandAuthApply(
  id: string,
  payload: ReviewAdminBrandAuthApplyPayload,
) {
  return putJson<
    ReviewAdminBrandAuthApplyResult,
    ReviewAdminBrandAuthApplyPayload
  >(`/api/admin/brands/auth-applies/${id}/review`, payload);
}

export function fetchAdminBrandAuthRecords() {
  return getJson<
    SummaryListResult<
      AdminBrandAuthRecordItem,
      { total: number; byStatus: Record<string, number>; byScope: Record<string, number> }
    >
  >('/api/admin/brands/auth-records');
}

export function fetchAdminShopProducts() {
  return getJson<
    SummaryListResult<
      AdminShopProductItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/shops/products');
}
