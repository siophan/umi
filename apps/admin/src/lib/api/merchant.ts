import { getJson } from './shared';

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

type SummaryListResult<TItem, TSummary> = {
  items: TItem[];
  summary: TSummary;
};

export function fetchAdminShops() {
  return getJson<
    SummaryListResult<AdminShopItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops');
}

export function fetchAdminShopApplies() {
  return getJson<
    SummaryListResult<AdminShopApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/shops/applies');
}

export function fetchAdminBrands() {
  return getJson<
    SummaryListResult<AdminBrandItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands');
}

export function fetchAdminBrandApplies() {
  return getJson<
    SummaryListResult<AdminBrandApplyItem, { total: number; byStatus: Record<string, number> }>
  >('/api/admin/brands/applies');
}

export function fetchAdminBrandAuthApplies() {
  return getJson<
    SummaryListResult<
      AdminBrandAuthApplyItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/brands/auth-applies');
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

export function fetchAdminProductAuthRows() {
  return getJson<
    SummaryListResult<
      AdminProductAuthItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/product-auth');
}

export function fetchAdminProductAuthRecords() {
  return getJson<
    SummaryListResult<
      AdminProductAuthRecordItem,
      { total: number; byStatus: Record<string, number> }
    >
  >('/api/admin/product-auth/records');
}
