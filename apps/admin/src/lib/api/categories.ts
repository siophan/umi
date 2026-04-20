import type {
  CategoryId,
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
  UpdateAdminCategoryResult,
  UpdateAdminCategoryStatusPayload,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';

export interface AdminCategoryItem {
  id: CategoryId;
  bizType: 'brand' | 'shop' | 'product' | 'guess' | 'unknown';
  bizTypeCode: number;
  bizTypeLabel: '品牌分类' | '店铺经营分类' | '商品分类' | '竞猜分类' | '未知业务';
  parentId: CategoryId | null;
  parentName: string | null;
  level: number;
  path: string | null;
  name: string;
  iconUrl: string | null;
  description: string | null;
  sort: number;
  status: 'active' | 'disabled';
  statusLabel: '启用' | '停用';
  usageCount: number;
  usageBreakdown: {
    brands: number;
    brandProducts: number;
    shops: number;
    shopApplies: number;
    guesses: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryListResult {
  items: AdminCategoryItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    byBizType: Record<string, number>;
  };
}

export function fetchAdminCategories() {
  return getJson<AdminCategoryListResult>('/api/admin/categories');
}

export function createAdminCategory(payload: CreateAdminCategoryPayload) {
  return postJson<AdminCategoryItem, CreateAdminCategoryPayload>(
    '/api/admin/categories',
    payload,
  );
}

export function updateAdminCategory(
  id: string,
  payload: UpdateAdminCategoryPayload,
) {
  return putJson<AdminCategoryItem, UpdateAdminCategoryPayload>(
    `/api/admin/categories/${id}`,
    payload,
  );
}

export function updateAdminCategoryStatus(
  id: string,
  payload: UpdateAdminCategoryStatusPayload,
) {
  return putJson<UpdateAdminCategoryResult, UpdateAdminCategoryStatusPayload>(
    `/api/admin/categories/${id}/status`,
    payload,
  );
}
