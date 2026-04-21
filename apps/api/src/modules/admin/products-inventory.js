import { getDbPool } from '../../lib/db';
import { buildAdminProductFilters, normalizePage, normalizePageSize, sanitizeAdminProduct, toNumber, } from './products-shared';
export async function getAdminProducts(query = {}) {
    const db = getDbPool();
    const page = normalizePage(query.page);
    const pageSize = normalizePageSize(query.pageSize);
    const offset = (page - 1) * pageSize;
    const filters = buildAdminProductFilters(query);
    const [[countRows], [rows]] = await Promise.all([
        db.query(`
        SELECT COUNT(*) AS total
        FROM product p
        LEFT JOIN shop s ON s.id = p.shop_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE ${filters.whereSql}
      `, filters.params),
        db.query(`
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
      `, [...filters.params, pageSize, offset]),
    ]);
    return {
        items: rows.map((row) => sanitizeAdminProduct(row)),
        total: toNumber(countRows[0]?.total),
        page,
        pageSize,
    };
}
