import type mysql from 'mysql2/promise';
import { toEntityId } from '@umi/shared';
import type {
  CreateAdminBrandPayload,
  CreateAdminBrandResult,
  UpdateAdminBrandPayload,
  UpdateAdminBrandResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  AUTH_STATUS_ACTIVE,
  BrandCategoryRow,
  BrandListRow,
  CATEGORY_STATUS_ACTIVE,
  mapBrandStatus,
  normalizeBrandStatus,
  summarizeByKey,
  toId,
  toIso,
  toNumber,
} from './merchant-shared';

export async function createAdminBrand(
  payload: CreateAdminBrandPayload,
): Promise<CreateAdminBrandResult> {
  const name = payload.name.trim();
  const logoUrl = payload.logoUrl?.trim() || null;
  const contactName = payload.contactName?.trim() || null;
  const contactPhone = payload.contactPhone?.trim() || null;
  const description = payload.description?.trim() || null;
  const categoryId = payload.categoryId;

  if (!name) {
    throw new Error('品牌名称不能为空');
  }
  if (!categoryId) {
    throw new Error('请选择类目');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [categoryRows] = await connection.execute<BrandCategoryRow[]>(
      `
        SELECT id, status
        FROM category
        WHERE id = ?
          AND biz_type = 10
        LIMIT 1
      `,
      [categoryId],
    );

    if (categoryRows.length === 0) {
      throw new Error('品牌类目不存在');
    }
    if (Number(categoryRows[0].status ?? 0) !== CATEGORY_STATUS_ACTIVE) {
      throw new Error('品牌类目已停用');
    }

    const [duplicateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand
        WHERE name = ?
        LIMIT 1
      `,
      [name],
    );

    if ((duplicateRows as mysql.RowDataPacket[]).length > 0) {
      throw new Error('品牌名称已存在');
    }

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO brand (
          name,
          logo_url,
          category_id,
          contact_name,
          contact_phone,
          description,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        name,
        logoUrl,
        categoryId,
        contactName,
        contactPhone,
        description,
        normalizeBrandStatus(payload.status),
      ],
    );

    await connection.commit();
    return { id: toEntityId(result.insertId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminBrand(
  brandId: string,
  payload: UpdateAdminBrandPayload,
): Promise<UpdateAdminBrandResult> {
  const name = payload.name.trim();
  const logoUrl = payload.logoUrl?.trim() || null;
  const contactName = payload.contactName?.trim() || null;
  const contactPhone = payload.contactPhone?.trim() || null;
  const description = payload.description?.trim() || null;
  const categoryId = payload.categoryId;

  if (!name) {
    throw new Error('品牌名称不能为空');
  }
  if (!categoryId) {
    throw new Error('请选择类目');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [brandRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, category_id
        FROM brand
        WHERE id = ?
        LIMIT 1
      `,
      [brandId],
    );

    if ((brandRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌不存在');
    }

    const [categoryRows] = await connection.execute<BrandCategoryRow[]>(
      `
        SELECT id, status
        FROM category
        WHERE id = ?
          AND biz_type = 10
        LIMIT 1
      `,
      [categoryId],
    );

    if (categoryRows.length === 0) {
      throw new Error('品牌类目不存在');
    }
    const isCurrentCategory = String(brandRows[0].category_id ?? '') === String(categoryId);
    if (Number(categoryRows[0].status ?? 0) !== CATEGORY_STATUS_ACTIVE && !isCurrentCategory) {
      throw new Error('品牌类目已停用');
    }

    const [duplicateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand
        WHERE name = ?
          AND id <> ?
        LIMIT 1
      `,
      [name, brandId],
    );

    if ((duplicateRows as mysql.RowDataPacket[]).length > 0) {
      throw new Error('品牌名称已存在');
    }

    await connection.execute(
      `
        UPDATE brand
        SET
          name = ?,
          logo_url = ?,
          category_id = ?,
          contact_name = ?,
          contact_phone = ?,
          description = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [
        name,
        logoUrl,
        categoryId,
        contactName,
        contactPhone,
        description,
        normalizeBrandStatus(payload.status),
        brandId,
      ],
    );

    await connection.commit();
    return { id: toEntityId(brandId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getAdminBrands() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        b.id,
        b.name,
        b.logo_url,
        b.category_id,
        c.name AS category_name,
        b.contact_name,
        b.contact_phone,
        b.description,
        b.status,
        COALESCE(sc.shop_count, 0) AS shop_count,
        COALESCE(gc.goods_count, 0) AS goods_count,
        b.created_at,
        b.updated_at
      FROM brand b
      LEFT JOIN category c ON c.id = b.category_id
      LEFT JOIN (
        SELECT brand_id, COUNT(*) AS shop_count
        FROM shop_brand_auth
        WHERE status = ?
        GROUP BY brand_id
      ) sc ON sc.brand_id = b.id
      LEFT JOIN (
        SELECT brand_id, COUNT(*) AS goods_count
        FROM brand_product
        GROUP BY brand_id
      ) gc ON gc.brand_id = b.id
      ORDER BY b.created_at DESC, b.id DESC
    `,
    [AUTH_STATUS_ACTIVE],
  );

  const items = (rows as BrandListRow[]).map((row) => {
    const status = mapBrandStatus(row.status);
    return {
      id: String(row.id),
      name: row.name,
      logoUrl: row.logo_url ?? null,
      categoryId: toId(row.category_id),
      category: row.category_name ?? null,
      contactName: row.contact_name ?? null,
      contactPhone: row.contact_phone ?? null,
      description: row.description ?? null,
      status: status.key,
      statusLabel: status.label,
      shopCount: toNumber(row.shop_count),
      goodsCount: toNumber(row.goods_count),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    };
  });

  return {
    items,
    summary: {
      total: items.length,
      byStatus: summarizeByKey(items, 'status'),
    },
  };
}
