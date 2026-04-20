import type mysql from 'mysql2/promise';
import {
  toEntityId,
  type
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
  UpdateAdminCategoryResult,
  UpdateAdminCategoryStatusPayload,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const CATEGORY_STATUS_ACTIVE = 10;
const CATEGORY_STATUS_DISABLED = 90;
const CATEGORY_BIZ_TYPE_CODES = new Set([10, 20, 30, 40]);

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
  brand_product_count: number | string | null;
  shop_count: number | string | null;
  shop_apply_count: number | string | null;
  guess_count: number | string | null;
};

type CategoryBaseRow = {
  id: number | string;
  biz_type: number | string;
  parent_id: number | string | null;
  level: number | string;
  path: string | null;
  name: string;
  sort: number | string;
  status: number | string;
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
    ? { status: 'active', statusLabel: '启用' }
    : { status: 'disabled', statusLabel: '停用' };
}

function normalizeCategoryStatus(status?: string) {
  return status === 'disabled' ? CATEGORY_STATUS_DISABLED : CATEGORY_STATUS_ACTIVE;
}

function normalizeName(name: string | null | undefined) {
  const value = name?.trim() ?? '';
  if (!value) {
    throw new Error('分类名称不能为空');
  }
  return value.slice(0, 50);
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeSort(value: number | string | null | undefined) {
  if (value === '' || value == null) {
    return 0;
  }

  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) {
    throw new Error('排序值不合法');
  }

  return Math.floor(result);
}

function normalizeBizTypeCode(code: number | string | null | undefined) {
  const value = Number(code ?? 0);
  if (!CATEGORY_BIZ_TYPE_CODES.has(value)) {
    throw new Error('分类业务域不合法');
  }
  return value as 10 | 20 | 30 | 40;
}

function buildCategoryPath(parentPath: string | null, categoryId: number) {
  return parentPath ? `${parentPath}/${categoryId}` : String(categoryId);
}

async function findCategoryBaseById(
  db: mysql.Pool | mysql.PoolConnection,
  categoryId: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, biz_type, parent_id, level, path, name, sort, status
      FROM category
      WHERE id = ?
      LIMIT 1
    `,
    [categoryId],
  );

  return (rows[0] as CategoryBaseRow | undefined) ?? null;
}

async function requireCategory(
  db: mysql.Pool | mysql.PoolConnection,
  categoryId: string,
) {
  const category = await findCategoryBaseById(db, categoryId);
  if (!category) {
    throw new Error('分类不存在');
  }
  return category;
}

async function resolveParentCategory(
  db: mysql.Pool | mysql.PoolConnection,
  parentId: string | null | undefined,
  bizTypeCode: number,
) {
  if (!parentId) {
    return null;
  }

  const parent = await requireCategory(db, parentId);
  if (Number(parent.biz_type ?? 0) !== bizTypeCode) {
    throw new Error('父分类业务域不匹配');
  }

  return parent;
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

export async function createAdminCategory(
  payload: CreateAdminCategoryPayload,
): Promise<AdminCategoryItem> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const bizTypeCode = normalizeBizTypeCode(payload.bizTypeCode);
    const parent = await resolveParentCategory(connection, payload.parentId, bizTypeCode);
    const name = normalizeName(payload.name);
    const iconUrl = normalizeOptionalText(payload.iconUrl, 255);
    const description = normalizeOptionalText(payload.description, 255);
    const sort = normalizeSort(payload.sort);
    const statusCode = normalizeCategoryStatus(payload.status);
    const level = parent ? Number(parent.level ?? 0) + 1 : 1;

    if (parent && Number(parent.status ?? 0) !== CATEGORY_STATUS_ACTIVE) {
      throw new Error('请先启用父分类');
    }

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO category (
          biz_type,
          parent_id,
          level,
          path,
          name,
          icon_url,
          description,
          sort,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        bizTypeCode,
        parent ? Number(parent.id) : null,
        level,
        name,
        iconUrl,
        description,
        sort,
        statusCode,
      ],
    );

    const insertedId = Number(result.insertId);
    const path = buildCategoryPath(parent?.path ?? null, insertedId);

    await connection.execute(
      `
        UPDATE category
        SET path = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [path, insertedId],
    );

    await connection.commit();

    const resultList = await getAdminCategories();
    const item = resultList.items.find((entry) => entry.id === String(insertedId));
    if (!item) {
      throw new Error('分类创建成功，但读取结果失败');
    }

    return item;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminCategory(
  categoryId: string,
  payload: UpdateAdminCategoryPayload,
): Promise<AdminCategoryItem> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await requireCategory(connection, categoryId);

    const name = normalizeName(payload.name);
    const iconUrl = normalizeOptionalText(payload.iconUrl, 255);
    const description = normalizeOptionalText(payload.description, 255);
    const sort = normalizeSort(payload.sort);

    await connection.execute(
      `
        UPDATE category
        SET
          name = ?,
          icon_url = ?,
          description = ?,
          sort = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [name, iconUrl, description, sort, categoryId],
    );

    await connection.commit();

    const resultList = await getAdminCategories();
    const item = resultList.items.find((entry) => entry.id === categoryId);
    if (!item) {
      throw new Error('分类更新成功，但读取结果失败');
    }

    return item;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminCategoryStatus(
  categoryId: string,
  payload: UpdateAdminCategoryStatusPayload,
): Promise<UpdateAdminCategoryResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const category = await requireCategory(connection, categoryId);
    const statusCode = normalizeCategoryStatus(payload.status);

    if (statusCode === CATEGORY_STATUS_ACTIVE && category.parent_id) {
      const parent = await requireCategory(connection, String(category.parent_id));
      if (Number(parent.status ?? 0) !== CATEGORY_STATUS_ACTIVE) {
        throw new Error('请先启用父分类');
      }
    }

    const currentPath = category.path ?? String(category.id);
    if (statusCode === CATEGORY_STATUS_DISABLED) {
      await connection.execute(
        `
          UPDATE category
          SET
            status = ?,
            updated_at = NOW()
          WHERE path = ?
             OR path LIKE ?
        `,
        [statusCode, currentPath, `${currentPath}/%`],
      );
    } else {
      await connection.execute(
        `
          UPDATE category
          SET
            status = ?,
            updated_at = NOW()
          WHERE id = ?
        `,
        [statusCode, categoryId],
      );
    }

    await connection.commit();

    return {
      id: toEntityId(category.id),
      status: payload.status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
