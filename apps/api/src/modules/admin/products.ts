import type mysql from 'mysql2/promise';
import { toEntityId } from '@umi/shared';
import type {
  CreateAdminBrandProductPayload,
  CreateAdminBrandProductResult,
  UpdateAdminBrandProductPayload,
  UpdateAdminBrandProductResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const PRODUCT_STATUS_ACTIVE = 10;
const PRODUCT_STATUS_OFF_SHELF = 20;
const PRODUCT_STATUS_DISABLED = 90;

const SHOP_STATUS_ACTIVE = 10;
const SHOP_STATUS_PAUSED = 20;

const BRAND_STATUS_ACTIVE = 10;
const BRAND_STATUS_DISABLED = 90;
const BRAND_PRODUCT_STATUS_ACTIVE = 10;
const BRAND_PRODUCT_STATUS_DISABLED = 90;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const LOW_STOCK_THRESHOLD = 10;

type AdminProductRow = {
  id: number | string;
  brand_product_id: number | string | null;
  shop_id: number | string | null;
  name: string;
  price: number | string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  status: number | string;
  updated_at: Date | string;
  tags: string | null;
  collab: string | null;
  image_url: string | null;
  shop_name: string | null;
  shop_status: number | string | null;
  brand_name: string | null;
  brand_status: number | string | null;
  category_name: string | null;
  brand_product_status: number | string | null;
};

type AdminBrandLibraryRow = {
  id: number | string;
  brand_id: number | string | null;
  name: string;
  category_id: number | string | null;
  guide_price: number | string | null;
  supply_price: number | string | null;
  description: string | null;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  default_img: string | null;
  brand_name: string | null;
  brand_status: number | string | null;
  category_name: string | null;
  product_count: number | string | null;
  active_product_count: number | string | null;
};

type CountRow = {
  total?: number | string | null;
};

export type AdminProductStatus =
  | 'active'
  | 'low_stock'
  | 'paused'
  | 'off_shelf'
  | 'disabled';

export type AdminBrandLibraryStatus = 'active' | 'disabled';

export interface AdminProductListItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  shopId: string | null;
  shopName: string;
  price: number;
  stock: number;
  availableStock: number;
  frozenStock: number;
  status: AdminProductStatus;
  updatedAt: string;
  tags: string[];
  imageUrl: string | null;
  brandProductId: string | null;
  rawStatusCode: number;
  shopStatusCode: number | null;
  brandStatusCode: number | null;
  brandProductStatusCode: number | null;
}

export interface AdminBrandLibraryItem {
  id: string;
  brandId: string | null;
  brandName: string;
  productName: string;
  categoryId: string | null;
  category: string;
  guidePrice: number;
  supplyPrice: number;
  status: AdminBrandLibraryStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  productCount: number;
  activeProductCount: number;
  rawStatusCode: number;
  brandStatusCode: number | null;
}

export interface AdminProductListResult {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminBrandLibraryResult {
  items: AdminBrandLibraryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProductQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'all' | AdminProductStatus;
}

export interface AdminBrandLibraryQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'all' | AdminBrandLibraryStatus;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value == null) {
    return null;
  }
  return Number(value);
}

function normalizePage(page?: number) {
  return Math.max(DEFAULT_PAGE, Number(page ?? DEFAULT_PAGE) || DEFAULT_PAGE);
}

function normalizePageSize(pageSize?: number) {
  const value = Number(pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, value));
}

function safeJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function uniqueStrings(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function formatDateTime(value: Date | string) {
  return new Date(value).toISOString();
}

function resolveProductStatus(row: AdminProductRow, availableStock: number): AdminProductStatus {
  const productStatus = toNumber(row.status);
  const shopStatus = toNullableNumber(row.shop_status);
  const brandStatus = toNullableNumber(row.brand_status);
  const brandProductStatus = toNullableNumber(row.brand_product_status);

  if (
    productStatus === PRODUCT_STATUS_DISABLED ||
    brandStatus === BRAND_STATUS_DISABLED ||
    brandProductStatus === BRAND_PRODUCT_STATUS_DISABLED
  ) {
    return 'disabled';
  }

  if (shopStatus === SHOP_STATUS_PAUSED) {
    return 'paused';
  }

  if (productStatus === PRODUCT_STATUS_OFF_SHELF) {
    return 'off_shelf';
  }

  if (availableStock <= LOW_STOCK_THRESHOLD) {
    return 'low_stock';
  }

  return 'active';
}

function resolveBrandLibraryStatus(row: AdminBrandLibraryRow): AdminBrandLibraryStatus {
  const status = toNumber(row.status);
  const brandStatus = toNullableNumber(row.brand_status);

  if (status === BRAND_PRODUCT_STATUS_DISABLED || brandStatus === BRAND_STATUS_DISABLED) {
    return 'disabled';
  }

  return 'active';
}

function buildProductTags(row: AdminProductRow, status: AdminProductStatus, availableStock: number) {
  const sourceTags = safeJsonArray(row.tags);
  const tags = [...sourceTags];

  if (row.collab?.trim()) {
    tags.push(row.collab.trim());
  }
  if (availableStock <= LOW_STOCK_THRESHOLD) {
    tags.push('低库存');
  }
  if (status === 'off_shelf') {
    tags.push('已下架');
  }
  if (status === 'paused') {
    tags.push('店铺暂停');
  }
  if (status === 'disabled') {
    tags.push('不可售');
  }

  return uniqueStrings(tags);
}

function sanitizeAdminProduct(row: AdminProductRow): AdminProductListItem {
  const stock = Math.max(0, toNumber(row.stock));
  const frozenStock = Math.max(0, toNumber(row.frozen_stock));
  const availableStock = Math.max(0, stock - frozenStock);
  const status = resolveProductStatus(row, availableStock);

  return {
    id: String(row.id),
    name: row.name,
    brand: row.brand_name || '未知品牌',
    category: row.category_name || '未分类',
    shopId: row.shop_id == null ? null : String(row.shop_id),
    shopName: row.shop_name || '未归属店铺',
    price: toNumber(row.price),
    stock,
    availableStock,
    frozenStock,
    status,
    updatedAt: formatDateTime(row.updated_at),
    tags: buildProductTags(row, status, availableStock),
    imageUrl: row.image_url,
    brandProductId: row.brand_product_id == null ? null : String(row.brand_product_id),
    rawStatusCode: toNumber(row.status),
    shopStatusCode: toNullableNumber(row.shop_status),
    brandStatusCode: toNullableNumber(row.brand_status),
    brandProductStatusCode: toNullableNumber(row.brand_product_status),
  };
}

function sanitizeAdminBrandLibrary(row: AdminBrandLibraryRow): AdminBrandLibraryItem {
  return {
    id: String(row.id),
    brandId: row.brand_id == null ? null : String(row.brand_id),
    brandName: row.brand_name || '未知品牌',
    productName: row.name,
    categoryId: row.category_id == null ? null : String(row.category_id),
    category: row.category_name || '未分类',
    guidePrice: toNumber(row.guide_price),
    supplyPrice: toNumber(row.supply_price),
    status: resolveBrandLibraryStatus(row),
    description: row.description ?? null,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    imageUrl: row.default_img,
    productCount: Math.max(0, toNumber(row.product_count)),
    activeProductCount: Math.max(0, toNumber(row.active_product_count)),
    rawStatusCode: toNumber(row.status),
    brandStatusCode: toNullableNumber(row.brand_status),
  };
}

function buildAdminProductFilters(query: AdminProductQuery) {
  const whereClauses = ['1 = 1'];
  const params: Array<string | number> = [];
  const keyword = query.keyword?.trim();
  const status = query.status ?? 'all';

  if (keyword) {
    const like = `%${keyword}%`;
    whereClauses.push(
      '(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR s.name LIKE ?)',
    );
    params.push(like, like, like, like);
  }

  if (status === 'active') {
    whereClauses.push(
      'p.status = ? AND COALESCE(s.status, ?) <> ? AND COALESCE(b.status, ?) <> ? AND COALESCE(bp.status, ?) <> ? AND (p.stock - COALESCE(p.frozen_stock, 0)) > ?',
    );
    params.push(
      PRODUCT_STATUS_ACTIVE,
      SHOP_STATUS_ACTIVE,
      SHOP_STATUS_PAUSED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_PRODUCT_STATUS_DISABLED,
      LOW_STOCK_THRESHOLD,
    );
  } else if (status === 'low_stock') {
    whereClauses.push(
      'p.status = ? AND COALESCE(s.status, ?) <> ? AND COALESCE(b.status, ?) <> ? AND COALESCE(bp.status, ?) <> ? AND (p.stock - COALESCE(p.frozen_stock, 0)) <= ?',
    );
    params.push(
      PRODUCT_STATUS_ACTIVE,
      SHOP_STATUS_ACTIVE,
      SHOP_STATUS_PAUSED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_PRODUCT_STATUS_DISABLED,
      LOW_STOCK_THRESHOLD,
    );
  } else if (status === 'paused') {
    whereClauses.push('COALESCE(s.status, ?) = ?');
    params.push(SHOP_STATUS_ACTIVE, SHOP_STATUS_PAUSED);
  } else if (status === 'off_shelf') {
    whereClauses.push('p.status = ?');
    params.push(PRODUCT_STATUS_OFF_SHELF);
  } else if (status === 'disabled') {
    whereClauses.push(
      '(p.status = ? OR COALESCE(b.status, ?) = ? OR COALESCE(bp.status, ?) = ?)',
    );
    params.push(
      PRODUCT_STATUS_DISABLED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_PRODUCT_STATUS_DISABLED,
    );
  }

  return { whereSql: whereClauses.join(' AND '), params };
}

function buildAdminBrandLibraryFilters(query: AdminBrandLibraryQuery) {
  const whereClauses = ['1 = 1'];
  const params: Array<string | number> = [];
  const keyword = query.keyword?.trim();
  const status = query.status ?? 'all';

  if (keyword) {
    const like = `%${keyword}%`;
    whereClauses.push('(bp.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
    params.push(like, like, like);
  }

  if (status === 'active') {
    whereClauses.push('bp.status = ? AND COALESCE(b.status, ?) <> ?');
    params.push(
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
    );
  } else if (status === 'disabled') {
    whereClauses.push('(bp.status = ? OR COALESCE(b.status, ?) = ?)');
    params.push(
      BRAND_PRODUCT_STATUS_DISABLED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
    );
  }

  return { whereSql: whereClauses.join(' AND '), params };
}

export async function getAdminProducts(
  query: AdminProductQuery = {},
): Promise<AdminProductListResult> {
  const db = getDbPool();
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);
  const offset = (page - 1) * pageSize;
  const filters = buildAdminProductFilters(query);

  const [[countRows], [rows]] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE ${filters.whereSql}
      `,
      filters.params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.brand_product_id,
          p.shop_id,
          p.name,
          p.price,
          p.stock,
          p.frozen_stock,
          p.status,
          p.updated_at,
          p.tags,
          p.collab,
          p.image_url,
          s.name AS shop_name,
          s.status AS shop_status,
          b.name AS brand_name,
          b.status AS brand_status,
          c.name AS category_name,
          bp.status AS brand_product_status
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE ${filters.whereSql}
        ORDER BY p.updated_at DESC, p.id DESC
        LIMIT ?
        OFFSET ?
      `,
      [...filters.params, pageSize, offset],
    ),
  ]);

  return {
    items: (rows as AdminProductRow[]).map((row) => sanitizeAdminProduct(row)),
    total: toNumber((countRows[0] as CountRow | undefined)?.total),
    page,
    pageSize,
  };
}

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
    items: (rows as AdminBrandLibraryRow[]).map((row) =>
      sanitizeAdminBrandLibrary(row),
    ),
    total: toNumber((countRows[0] as CountRow | undefined)?.total),
    page,
    pageSize,
  };
}

function normalizeBrandProductStatus(status: string | null | undefined) {
  if (status === 'disabled') {
    return BRAND_PRODUCT_STATUS_DISABLED;
  }

  return BRAND_PRODUCT_STATUS_ACTIVE;
}

function normalizeAdminBrandProductPayload(
  payload: CreateAdminBrandProductPayload | UpdateAdminBrandProductPayload,
) {
  const name = payload.name.trim();
  const brandId = payload.brandId;
  const categoryId = payload.categoryId;
  const guidePrice = Math.round(Number(payload.guidePrice ?? 0));
  const supplyPrice =
    payload.supplyPrice == null ? null : Math.round(Number(payload.supplyPrice));
  const defaultImg = payload.defaultImg?.trim() || null;
  const description = payload.description?.trim() || null;

  if (!name) {
    throw new Error('品牌商品名称不能为空');
  }
  if (!brandId) {
    throw new Error('请选择品牌');
  }
  if (!categoryId) {
    throw new Error('请选择类目');
  }
  if (!Number.isInteger(guidePrice) || guidePrice < 0) {
    throw new Error('指导价不合法');
  }
  if (supplyPrice != null && (!Number.isInteger(supplyPrice) || supplyPrice < 0)) {
    throw new Error('供货价不合法');
  }

  return {
    name,
    brandId,
    categoryId,
    guidePrice,
    supplyPrice,
    defaultImg,
    description,
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

    const [brandRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand
        WHERE id = ?
        LIMIT 1
      `,
      [normalized.brandId],
    );

    if ((brandRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌不存在');
    }

    const [categoryRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 30
        LIMIT 1
      `,
      [normalized.categoryId],
    );

    if ((categoryRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌商品类目不存在');
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

    const [productRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand_product
        WHERE id = ?
        LIMIT 1
      `,
      [brandProductId],
    );

    if ((productRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌商品不存在');
    }

    const [brandRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM brand
        WHERE id = ?
        LIMIT 1
      `,
      [normalized.brandId],
    );

    if ((brandRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌不存在');
    }

    const [categoryRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 30
        LIMIT 1
      `,
      [normalized.categoryId],
    );

    if ((categoryRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌商品类目不存在');
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
