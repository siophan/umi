import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';

const CATEGORY_STATUS_ACTIVE = 10;

type CategoryRow = {
  id: number | string;
  biz_type: number | string;
  parent_id: number | string | null;
  level: number | string;
  path: string | null;
  name: string;
  icon_url: string | null;
  description: string | null;
  sort: number | string;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  parent_name: string | null;
  brand_count: number | string | null;
  brand_apply_count: number | string | null;
  brand_product_count: number | string | null;
  shop_count: number | string | null;
  shop_apply_count: number | string | null;
  guess_count: number | string | null;
};

export type AdminCategoryBizType = 'brand' | 'shop' | 'product' | 'guess' | 'unknown';
export type AdminCategoryStatus = 'active' | 'disabled';

export interface AdminCategoryItem {
  id: string;
  bizType: AdminCategoryBizType;
  bizTypeCode: number;
  bizTypeLabel: '品牌分类' | '店铺经营分类' | '商品分类' | '竞猜分类' | '未知业务';
  parentId: string | null;
  parentName: string | null;
  level: number;
  path: string | null;
  name: string;
  iconUrl: string | null;
  description: string | null;
  sort: number;
  status: AdminCategoryStatus;
  statusLabel: '启用中' | '停用';
  usageCount: number;
  usageBreakdown: {
    brands: number;
    brandApplies: number;
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

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toNullableId(value: number | string | null | undefined) {
  return value == null ? null : String(value);
}

function toIso(value: Date | string) {
  return new Date(value).toISOString();
}

function mapBizType(code: number | string): Pick<AdminCategoryItem, 'bizType' | 'bizTypeCode' | 'bizTypeLabel'> {
  const value = Number(code ?? 0);
  if (value === 10) {
    return { bizType: 'brand', bizTypeCode: value, bizTypeLabel: '品牌分类' };
  }
  if (value === 20) {
    return { bizType: 'shop', bizTypeCode: value, bizTypeLabel: '店铺经营分类' };
  }
  if (value === 30) {
    return { bizType: 'product', bizTypeCode: value, bizTypeLabel: '商品分类' };
  }
  if (value === 40) {
    return { bizType: 'guess', bizTypeCode: value, bizTypeLabel: '竞猜分类' };
  }
  return { bizType: 'unknown', bizTypeCode: value, bizTypeLabel: '未知业务' };
}

function mapStatus(code: number | string): Pick<AdminCategoryItem, 'status' | 'statusLabel'> {
  return Number(code ?? 0) === CATEGORY_STATUS_ACTIVE
    ? { status: 'active', statusLabel: '启用中' }
    : { status: 'disabled', statusLabel: '停用' };
}

export async function getAdminCategories(): Promise<AdminCategoryListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        c.id,
        c.biz_type,
        c.parent_id,
        c.level,
        c.path,
        c.name,
        c.icon_url,
        c.description,
        c.sort,
        c.status,
        c.created_at,
        c.updated_at,
        p.name AS parent_name,
        COALESCE(bc.brand_count, 0) AS brand_count,
        COALESCE(bac.brand_apply_count, 0) AS brand_apply_count,
        COALESCE(bpc.brand_product_count, 0) AS brand_product_count,
        COALESCE(sc.shop_count, 0) AS shop_count,
        COALESCE(sac.shop_apply_count, 0) AS shop_apply_count,
        COALESCE(gc.guess_count, 0) AS guess_count
      FROM category c
      LEFT JOIN category p ON p.id = c.parent_id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS brand_count
        FROM brand
        GROUP BY category_id
      ) bc ON bc.category_id = c.id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS brand_apply_count
        FROM brand_apply
        GROUP BY category_id
      ) bac ON bac.category_id = c.id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS brand_product_count
        FROM brand_product
        GROUP BY category_id
      ) bpc ON bpc.category_id = c.id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS shop_count
        FROM shop
        GROUP BY category_id
      ) sc ON sc.category_id = c.id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS shop_apply_count
        FROM shop_apply
        GROUP BY category_id
      ) sac ON sac.category_id = c.id
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS guess_count
        FROM guess
        GROUP BY category_id
      ) gc ON gc.category_id = c.id
      ORDER BY c.biz_type ASC, c.level ASC, c.sort ASC, c.id ASC
    `,
  );

  const items = (rows as CategoryRow[]).map((row) => {
    const bizType = mapBizType(row.biz_type);
    const status = mapStatus(row.status);
    const usageBreakdown = {
      brands: toNumber(row.brand_count),
      brandApplies: toNumber(row.brand_apply_count),
      brandProducts: toNumber(row.brand_product_count),
      shops: toNumber(row.shop_count),
      shopApplies: toNumber(row.shop_apply_count),
      guesses: toNumber(row.guess_count),
    };

    return {
      id: String(row.id),
      ...bizType,
      parentId: toNullableId(row.parent_id),
      parentName: row.parent_name,
      level: toNumber(row.level),
      path: row.path,
      name: row.name,
      iconUrl: row.icon_url,
      description: row.description,
      sort: toNumber(row.sort),
      ...status,
      usageCount: Object.values(usageBreakdown).reduce((sum, value) => sum + value, 0),
      usageBreakdown,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    } satisfies AdminCategoryItem;
  });

  const byBizType = items.reduce<Record<string, number>>((summary, item) => {
    summary[item.bizType] = (summary[item.bizType] ?? 0) + 1;
    return summary;
  }, {});

  return {
    items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      disabled: items.filter((item) => item.status === 'disabled').length,
      byBizType,
    },
  };
}
