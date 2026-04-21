import type mysql from 'mysql2/promise';
import { toEntityId } from '@umi/shared';
import type {
  CreateAdminBrandProductPayload,
  CreateAdminBrandProductResult,
  UpdateAdminBrandProductPayload,
  UpdateAdminBrandProductResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  type AdminBrandLibraryQuery,
  type AdminBrandLibraryResult,
  type AdminBrandLibraryRow,
  type CountRow,
  BRAND_STATUS_ACTIVE,
  buildAdminBrandLibraryFilters,
  normalizeAdminBrandProductPayload,
  normalizeBrandProductStatus,
  normalizePage,
  normalizePageSize,
  PRODUCT_STATUS_ACTIVE,
  sanitizeAdminBrandLibrary,
  toNumber,
} from './products-shared';

const CATEGORY_STATUS_ACTIVE = 10;

type BrandStatusRow = mysql.RowDataPacket & {
  id: number | string;
  status: number | string;
};

type CategoryStatusRow = mysql.RowDataPacket & {
  id: number | string;
  status: number | string;
};

type BrandProductBindingRow = mysql.RowDataPacket & {
  id: number | string;
  brand_id: number | string | null;
  category_id: number | string | null;
};

export type {
  AdminBrandLibraryItem,
  AdminBrandLibraryQuery,
  AdminBrandLibraryResult,
  AdminBrandLibraryStatus,
} from './products-shared';

export async function getAdminBrandLibrary(
  query: AdminBrandLibraryQuery = {},
): Promise<AdminBrandLibraryResult> {
  const db = getDbPool();
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);
  const offset = (page - 1) * pageSize;
  const filters = buildAdminBrandLibraryFilters(query);

  const [[countRows], [rows]] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM brand_product bp
        INNER JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE ${filters.whereSql}
      `,
      filters.params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          bp.id,
          bp.brand_id,
          bp.name,
          bp.category_id,
          bp.guide_price,
          bp.supply_price,
          bp.description,
          bp.status,
          bp.created_at,
          bp.updated_at,
          bp.default_img,
          b.name AS brand_name,
          b.status AS brand_status,
          c.name AS category_name,
          COUNT(p.id) AS product_count,
          COALESCE(SUM(CASE WHEN p.status = ? THEN 1 ELSE 0 END), 0) AS active_product_count
        FROM brand_product bp
        INNER JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        LEFT JOIN product p ON p.brand_product_id = bp.id
        WHERE ${filters.whereSql}
        GROUP BY
          bp.id,
          bp.brand_id,
          bp.name,
          bp.category_id,
          bp.guide_price,
          bp.supply_price,
          bp.description,
          bp.status,
          bp.created_at,
          bp.updated_at,
          bp.default_img,
          b.name,
          b.status,
          c.name
        ORDER BY bp.updated_at DESC, bp.id DESC
        LIMIT ?
        OFFSET ?
      `,
      [PRODUCT_STATUS_ACTIVE, ...filters.params, pageSize, offset],
    ),
  ]);

  return {
    items: (rows as AdminBrandLibraryRow[]).map((row) => sanitizeAdminBrandLibrary(row)),
    total: toNumber((countRows[0] as CountRow | undefined)?.total),
    page,
    pageSize,
  };
}

export async function createAdminBrandProduct(
  payload: CreateAdminBrandProductPayload,
): Promise<CreateAdminBrandProductResult> {
  const normalized = normalizeAdminBrandProductPayload(payload);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [brandRows] = await connection.execute<BrandStatusRow[]>(
      `
        SELECT id, status
        FROM brand
        WHERE id = ?
        LIMIT 1
      `,
      [normalized.brandId],
    );

    if (brandRows.length === 0) {
      throw new Error('品牌不存在');
    }
    if (Number(brandRows[0].status ?? 0) !== BRAND_STATUS_ACTIVE) {
      throw new Error('品牌已停用');
    }

    const [categoryRows] = await connection.execute<CategoryStatusRow[]>(
      `
        SELECT id, status
        FROM category
        WHERE id = ?
          AND biz_type = 30
        LIMIT 1
      `,
      [normalized.categoryId],
    );

    if (categoryRows.length === 0) {
      throw new Error('品牌商品类目不存在');
    }
    if (Number(categoryRows[0].status ?? 0) !== CATEGORY_STATUS_ACTIVE) {
      throw new Error('品牌商品类目已停用');
    }

    const [duplicateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand_product
        WHERE brand_id = ?
          AND name = ?
        LIMIT 1
      `,
      [normalized.brandId, normalized.name],
    );

    if ((duplicateRows as mysql.RowDataPacket[]).length > 0) {
      throw new Error('品牌商品名称已存在');
    }

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO brand_product (
          brand_id,
          name,
          category_id,
          guide_price,
          supply_price,
          default_img,
          description,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        normalized.brandId,
        normalized.name,
        normalized.categoryId,
        normalized.guidePrice,
        normalized.supplyPrice,
        normalized.defaultImg,
        normalized.description,
        normalizeBrandProductStatus(payload.status),
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

export async function updateAdminBrandProduct(
  brandProductId: string,
  payload: UpdateAdminBrandProductPayload,
): Promise<UpdateAdminBrandProductResult> {
  const normalized = normalizeAdminBrandProductPayload(payload);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.execute<BrandProductBindingRow[]>(
      `
        SELECT id, brand_id, category_id
        FROM brand_product
        WHERE id = ?
        LIMIT 1
      `,
      [brandProductId],
    );

    if (productRows.length === 0) {
      throw new Error('品牌商品不存在');
    }

    const [brandRows] = await connection.execute<BrandStatusRow[]>(
      `
        SELECT id, status
        FROM brand
        WHERE id = ?
        LIMIT 1
      `,
      [normalized.brandId],
    );

    if (brandRows.length === 0) {
      throw new Error('品牌不存在');
    }
    const isCurrentBrand = String(productRows[0].brand_id ?? '') === String(normalized.brandId);
    if (Number(brandRows[0].status ?? 0) !== BRAND_STATUS_ACTIVE && !isCurrentBrand) {
      throw new Error('品牌已停用');
    }

    const [categoryRows] = await connection.execute<CategoryStatusRow[]>(
      `
        SELECT id, status
        FROM category
        WHERE id = ?
          AND biz_type = 30
        LIMIT 1
      `,
      [normalized.categoryId],
    );

    if (categoryRows.length === 0) {
      throw new Error('品牌商品类目不存在');
    }
    const isCurrentCategory =
      String(productRows[0].category_id ?? '') === String(normalized.categoryId);
    if (Number(categoryRows[0].status ?? 0) !== CATEGORY_STATUS_ACTIVE && !isCurrentCategory) {
      throw new Error('品牌商品类目已停用');
    }

    const [duplicateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand_product
        WHERE brand_id = ?
          AND name = ?
          AND id <> ?
        LIMIT 1
      `,
      [normalized.brandId, normalized.name, brandProductId],
    );

    if ((duplicateRows as mysql.RowDataPacket[]).length > 0) {
      throw new Error('品牌商品名称已存在');
    }

    await connection.execute(
      `
        UPDATE brand_product
        SET
          brand_id = ?,
          name = ?,
          category_id = ?,
          guide_price = ?,
          supply_price = ?,
          default_img = ?,
          description = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [
        normalized.brandId,
        normalized.name,
        normalized.categoryId,
        normalized.guidePrice,
        normalized.supplyPrice,
        normalized.defaultImg,
        normalized.description,
        normalizeBrandProductStatus(payload.status),
        brandProductId,
      ],
    );

    await connection.commit();
    return { id: toEntityId(brandProductId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
