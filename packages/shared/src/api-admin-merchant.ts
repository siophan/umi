import type { EntityId } from './domain';

export interface ReviewAdminShopApplyPayload {
  status: 'approved' | 'rejected';
  rejectReason?: string | null;
}

export interface ReviewAdminShopApplyResult {
  id: EntityId;
  status: 'approved' | 'rejected';
}

export interface CreateAdminBrandPayload {
  name: string;
  categoryId: EntityId;
  contactName?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  status?: 'active' | 'disabled';
}

export interface CreateAdminBrandResult {
  id: EntityId;
}

export interface UpdateAdminBrandPayload {
  name: string;
  categoryId: EntityId;
  contactName?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  status: 'active' | 'disabled';
}

export interface UpdateAdminBrandResult {
  id: EntityId;
}

export interface AdminBrandProductSpecRow {
  key: string;
  value: string;
}

export interface CreateAdminBrandProductPayload {
  brandId: EntityId;
  name: string;
  categoryId: EntityId;
  guidePrice: number;
  supplyPrice?: number | null;
  defaultImg?: string | null;
  description?: string | null;
  status?: 'active' | 'disabled';
  videoUrl?: string | null;
  detailHtml?: string | null;
  specTable?: AdminBrandProductSpecRow[] | null;
  packageList?: string[] | null;
  freight?: number | null;
  shipFrom?: string | null;
  deliveryDays?: string | null;
}

export interface CreateAdminBrandProductResult {
  id: EntityId;
}

export interface UpdateAdminBrandProductPayload {
  brandId: EntityId;
  name: string;
  categoryId: EntityId;
  guidePrice: number;
  supplyPrice?: number | null;
  defaultImg?: string | null;
  description?: string | null;
  status: 'active' | 'disabled';
  videoUrl?: string | null;
  detailHtml?: string | null;
  specTable?: AdminBrandProductSpecRow[] | null;
  packageList?: string[] | null;
  freight?: number | null;
  shipFrom?: string | null;
  deliveryDays?: string | null;
}

export interface UpdateAdminBrandProductResult {
  id: EntityId;
}

export interface ReviewAdminBrandAuthApplyPayload {
  status: 'approved' | 'rejected';
  rejectReason?: string | null;
}

export interface ReviewAdminBrandAuthApplyResult {
  id: EntityId;
  status: 'approved' | 'rejected';
}

export interface RevokeAdminBrandAuthRecordResult {
  id: EntityId;
  status: 'revoked';
}

export interface UpdateAdminShopStatusPayload {
  status: 'active' | 'paused' | 'closed';
}

export interface UpdateAdminShopStatusResult {
  id: EntityId;
  status: 'active' | 'paused' | 'closed';
}

export interface UpdateAdminShopProductStatusPayload {
  status: 'active' | 'off_shelf';
}

export interface UpdateAdminShopProductStatusResult {
  id: EntityId;
  status: 'active' | 'off_shelf';
}

export interface AdminShopDetailInfo {
  id: EntityId;
  name: string;
  ownerId: EntityId;
  ownerName: string;
  ownerPhone: string | null;
  category: string | null;
  status: 'active' | 'paused' | 'closed';
  statusLabel: '营业中' | '暂停营业' | '已关闭';
  description: string | null;
  products: number;
  orders: number;
  score: number;
  brandAuthCount: number;
  totalSales: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminShopDetailProductItem {
  id: EntityId;
  name: string;
  brandName: string | null;
  price: number;
  originalPrice: number;
  sales: number;
  stock: number;
  frozenStock: number;
  status: 'active' | 'off_shelf' | 'disabled';
  statusLabel: '在售' | '已下架' | '不可售';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminShopDetailOrderItem {
  id: EntityId;
  orderNo: string;
  buyerName: string;
  amount: number;
  statusCode: number;
  createdAt: string | null;
}

export interface AdminShopDetailGuessItem {
  id: EntityId;
  title: string;
  statusCode: number;
  endTime: string | null;
  betCount: number;
  createdAt: string | null;
}

export interface AdminShopDetailBrandAuthItem {
  id: EntityId;
  authNo: string;
  brandId: EntityId;
  brandName: string;
  authTypeLabel: '普通授权' | '独家授权' | '试用授权';
  authScopeLabel: '全品牌授权' | '指定类目授权' | '指定商品授权';
  status: 'active' | 'expired' | 'revoked';
  statusLabel: '生效中' | '已过期' | '已撤销';
  grantedAt: string | null;
  expireAt: string | null;
}

export interface AdminShopDetailResult {
  shop: AdminShopDetailInfo;
  products: AdminShopDetailProductItem[];
  orders: AdminShopDetailOrderItem[];
  guesses: AdminShopDetailGuessItem[];
  brandAuths: AdminShopDetailBrandAuthItem[];
}
