import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import {
  type AdminProductQuery,
  type AdminProductListResult,
  type AdminProductRow,
  BRAND_PRODUCT_STATUS_ACTIVE,
  BRAND_PRODUCT_STATUS_DISABLED,
  BRAND_STATUS_ACTIVE,
  BRAND_STATUS_DISABLED,
  type CountRow,
  buildAdminProductFilters,
  LOW_STOCK_THRESHOLD,
  normalizePage,
  normalizePageSize,
  PRODUCT_STATUS_ACTIVE,
  PRODUCT_STATUS_DISABLED,
  PRODUCT_STATUS_OFF_SHELF,
  sanitizeAdminProduct,
  SHOP_STATUS_ACTIVE,
  SHOP_STATUS_PAUSED,
  toNumber,
} from './products-shared';

export type { AdminProductListItem, AdminProductListResult, AdminProductQuery, AdminProductStatus } from './products-shared';

export async function getAdminProducts(
  query: AdminProductQuery = {},
): Promise<AdminProductListResult> {
  const db = getDbPool();
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);
  const offset = (page - 1) * pageSize;
  const filters = buildAdminProductFilters(query);
  const summaryFilters = buildAdminProductFilters(query, { includeStatus: false });

  const [[countRows], [summaryRows], [rows]] = await Promise.all([
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
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN p.status = ${PRODUCT_STATUS_ACTIVE}
                AND COALESCE(s.status, ${SHOP_STATUS_ACTIVE}) <> ${SHOP_STATUS_PAUSED}
                AND COALESCE(b.status, ${BRAND_STATUS_ACTIVE}) <> ${BRAND_STATUS_DISABLED}
                AND COALESCE(bp.status, ${BRAND_PRODUCT_STATUS_ACTIVE}) <> ${BRAND_PRODUCT_STATUS_DISABLED}
                AND (p.stock - COALESCE(p.frozen_stock, 0)) > ${LOW_STOCK_THRESHOLD}
              THEN 1
              ELSE 0
            END
          ) AS active_count,
          SUM(
            CASE
              WHEN p.status = ${PRODUCT_STATUS_ACTIVE}
                AND COALESCE(s.status, ${SHOP_STATUS_ACTIVE}) <> ${SHOP_STATUS_PAUSED}
                AND COALESCE(b.status, ${BRAND_STATUS_ACTIVE}) <> ${BRAND_STATUS_DISABLED}
                AND COALESCE(bp.status, ${BRAND_PRODUCT_STATUS_ACTIVE}) <> ${BRAND_PRODUCT_STATUS_DISABLED}
                AND (p.stock - COALESCE(p.frozen_stock, 0)) <= ${LOW_STOCK_THRESHOLD}
              THEN 1
              ELSE 0
            END
          ) AS low_stock_count,
          SUM(CASE WHEN COALESCE(s.status, ${SHOP_STATUS_ACTIVE}) = ${SHOP_STATUS_PAUSED} THEN 1 ELSE 0 END) AS paused_count,
          SUM(CASE WHEN p.status = ${PRODUCT_STATUS_OFF_SHELF} THEN 1 ELSE 0 END) AS off_shelf_count,
          SUM(
            CASE
              WHEN p.status = ${PRODUCT_STATUS_DISABLED}
                OR COALESCE(b.status, ${BRAND_STATUS_ACTIVE}) = ${BRAND_STATUS_DISABLED}
                OR COALESCE(bp.status, ${BRAND_PRODUCT_STATUS_ACTIVE}) = ${BRAND_PRODUCT_STATUS_DISABLED}
              THEN 1
              ELSE 0
            END
          ) AS disabled_count
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE ${summaryFilters.whereSql}
      `,
      summaryFilters.params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.brand_product_id,
          p.shop_id,
          bp.name AS name,
          p.price,
          p.stock,
          p.frozen_stock,
          p.status,
          p.updated_at,
          bp.tags AS tags,
          bp.collab AS collab,
          bp.default_img AS image_url,
          s.name AS shop_name,
          s.status AS shop_status,
          b.name AS brand_name,
          b.status AS brand_status,
          c.id AS category_id,
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
    summary: {
      total: toNumber((summaryRows[0] as CountRow | undefined)?.total),
      byStatus: {
        active: toNumber((summaryRows[0] as mysql.RowDataPacket | undefined)?.active_count),
        low_stock: toNumber((summaryRows[0] as mysql.RowDataPacket | undefined)?.low_stock_count),
        paused: toNumber((summaryRows[0] as mysql.RowDataPacket | undefined)?.paused_count),
        off_shelf: toNumber((summaryRows[0] as mysql.RowDataPacket | undefined)?.off_shelf_count),
        disabled: toNumber((summaryRows[0] as mysql.RowDataPacket | undefined)?.disabled_count),
      },
    },
  };
}
