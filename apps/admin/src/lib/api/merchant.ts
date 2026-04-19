import type {
  AdminBrandApplyItem,
  AdminBrandAuthApplyItem,
  AdminBrandAuthRecordItem,
  AdminBrandItem,
  AdminProductAuthItem,
  AdminProductAuthRecordItem,
  AdminShopApplyItem,
  AdminShopItem,
  AdminShopProductItem,
} from '../admin-data';
import { getJson } from './shared';

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
