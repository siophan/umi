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
  type NormalizedSku,
  BRAND_PRODUCT_STATUS_ACTIVE,
  BRAND_PRODUCT_STATUS_DISABLED,
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

type ExistingSkuRow = mysql.RowDataPacket & {
  id: number | string;
  spec_signature: string;
  frozen_stock: number | string;
};

export type {
  AdminBrandLibraryItem,
  AdminBrandLibraryQuery,
  AdminBrandLibraryResult,
  AdminBrandLibraryStatus,
  AdminBrandLibrarySkuItem,
} from './products-shared';

const SKU_AGGREGATE_SUBQUERIES = `
  (SELECT MIN(bps.guide_price) FROM brand_product_sku bps WHERE bps.brand_product_id = bp.id AND bps.status = 10) AS guide_price_min,
  (SELECT MAX(bps.guide_price) FROM brand_product_sku bps WHERE bps.brand_product_id = bp.id AND bps.status = 10) AS guide_price_max,
  (SELECT COALESCE(SUM(bps.stock), 0) FROM brand_product_sku bps WHERE bps.brand_product_id = bp.id AND bps.status = 10) AS stock_total,
  (SELECT COALESCE(SUM(GREATEST(bps.stock - bps.frozen_stock, 0)), 0) FROM brand_product_sku bps WHERE bps.brand_product_id = bp.id AND bps.status = 10) AS available_total,
  (
    SELECT COALESCE(
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', CAST(bps.id AS CHAR),
          'sku_code', bps.sku_code,
          'spec_json', bps.spec_json,
          'spec_signature', bps.spec_signature,
          'guide_price', bps.guide_price,
          'supply_price', bps.supply_price,
          'guess_price', bps.guess_price,
          'stock', bps.stock,
          'frozen_stock', bps.frozen_stock,
          'image', bps.image,
          'status', bps.status,
          'sort', bps.sort
        )
      ),
      JSON_ARRAY()
    )
    FROM brand_product_sku bps
    WHERE bps.brand_product_id = bp.id
  ) AS skus_json
`;

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
          bp.spec_definitions,
          bp.description,
          bp.status,
          bp.created_at,
          bp.updated_at,
          bp.default_img,
          bp.images,
          bp.video_url,
          bp.detail_html,
          bp.spec_table,
          bp.package_list,
          bp.freight,
          bp.ship_from,
          bp.delivery_days,
          bp.tags,
          bp.collab,
          b.name AS brand_name,
          b.status AS brand_status,
          c.name AS category_name,
          COUNT(p.id) AS product_count,
          COALESCE(SUM(CASE WHEN p.status = ? THEN 1 ELSE 0 END), 0) AS active_product_count,
          ${SKU_AGGREGATE_SUBQUERIES}
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
          bp.spec_definitions,
          bp.description,
          bp.status,
          bp.created_at,
          bp.updated_at,
          bp.default_img,
          bp.images,
          bp.video_url,
          bp.detail_html,
          bp.spec_table,
          bp.package_list,
          bp.freight,
          bp.ship_from,
          bp.delivery_days,
          bp.tags,
          bp.collab,
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
          spec_definitions,
          name,
          category_id,
          default_img,
          images,
          description,
          video_url,
          detail_html,
          spec_table,
          package_list,
          freight,
          ship_from,
          delivery_days,
          tags,
          collab,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        normalized.brandId,
        normalized.specDefinitionsJson,
        normalized.name,
        normalized.categoryId,
        normalized.defaultImg,
        normalized.imageListJson,
        normalized.description,
        normalized.videoUrl,
        normalized.detailHtml,
        normalized.specTableJson,
        normalized.packageListJson,
        normalized.freight,
        normalized.shipFrom,
        normalized.deliveryDays,
        normalized.tagsJson,
        normalized.collab,
        normalizeBrandProductStatus(payload.status),
      ],
    );

    const brandProductId = String(result.insertId);
    await insertSkus(connection, brandProductId, normalized.skus);

    await connection.commit();
    return { id: toEntityId(brandProductId) };
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
          spec_definitions = ?,
          name = ?,
          category_id = ?,
          default_img = ?,
          images = ?,
          description = ?,
          video_url = ?,
          detail_html = ?,
          spec_table = ?,
          package_list = ?,
          freight = ?,
          ship_from = ?,
          delivery_days = ?,
          tags = ?,
          collab = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [
        normalized.brandId,
        normalized.specDefinitionsJson,
        normalized.name,
        normalized.categoryId,
        normalized.defaultImg,
        normalized.imageListJson,
        normalized.description,
        normalized.videoUrl,
        normalized.detailHtml,
        normalized.specTableJson,
        normalized.packageListJson,
        normalized.freight,
        normalized.shipFrom,
        normalized.deliveryDays,
        normalized.tagsJson,
        normalized.collab,
        normalizeBrandProductStatus(payload.status),
        brandProductId,
      ],
    );

    await upsertSkus(connection, brandProductId, normalized.skus);

    await connection.commit();
    return { id: toEntityId(brandProductId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function insertSkus(
  connection: mysql.PoolConnection,
  brandProductId: string,
  skus: NormalizedSku[],
): Promise<void> {
  if (skus.length === 0) {
    throw new Error('至少需要 1 个 SKU');
  }
  for (const sku of skus) {
    await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO brand_product_sku (
          brand_product_id, sku_code, spec_json, spec_signature,
          guide_price, supply_price, guess_price,
          stock, frozen_stock, image, status, sort,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        brandProductId,
        sku.skuCode,
        sku.specJson,
        sku.specSignature,
        sku.guidePrice,
        sku.supplyPrice,
        sku.guessPrice,
        sku.stock,
        sku.image,
        sku.status,
        sku.sort,
      ],
    );
  }
}

async function upsertSkus(
  connection: mysql.PoolConnection,
  brandProductId: string,
  skus: NormalizedSku[],
): Promise<void> {
  const [existingRows] = await connection.execute<ExistingSkuRow[]>(
    `SELECT id, spec_signature, frozen_stock FROM brand_product_sku WHERE brand_product_id = ?`,
    [brandProductId],
  );
  const bySignature = new Map<string, ExistingSkuRow>();
  const byId = new Map<string, ExistingSkuRow>();
  for (const row of existingRows) {
    bySignature.set(row.spec_signature, row);
    byId.set(String(row.id), row);
  }

  const keepIds = new Set<string>();

  for (const sku of skus) {
    let existing: ExistingSkuRow | undefined;
    if (sku.id && byId.has(sku.id)) {
      existing = byId.get(sku.id);
    } else if (bySignature.has(sku.specSignature)) {
      existing = bySignature.get(sku.specSignature);
    }

    if (existing) {
      keepIds.add(String(existing.id));
      await connection.execute(
        `
          UPDATE brand_product_sku
          SET sku_code = ?,
              spec_json = ?,
              spec_signature = ?,
              guide_price = ?,
              supply_price = ?,
              guess_price = ?,
              stock = ?,
              image = ?,
              status = ?,
              sort = ?,
              updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [
          sku.skuCode,
          sku.specJson,
          sku.specSignature,
          sku.guidePrice,
          sku.supplyPrice,
          sku.guessPrice,
          sku.stock,
          sku.image,
          sku.status,
          sku.sort,
          existing.id,
        ],
      );
    } else {
      const [insertResult] = await connection.execute<mysql.ResultSetHeader>(
        `
          INSERT INTO brand_product_sku (
            brand_product_id, sku_code, spec_json, spec_signature,
            guide_price, supply_price, guess_price,
            stock, frozen_stock, image, status, sort,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        [
          brandProductId,
          sku.skuCode,
          sku.specJson,
          sku.specSignature,
          sku.guidePrice,
          sku.supplyPrice,
          sku.guessPrice,
          sku.stock,
          sku.image,
          sku.status,
          sku.sort,
        ],
      );
      keepIds.add(String(insertResult.insertId));
    }
  }

  // 软删未在 payload 中出现的 SKU；frozen_stock>0 的不允许下架（防止破坏 pending 订单）
  for (const row of existingRows) {
    if (keepIds.has(String(row.id))) continue;
    if (Number(row.frozen_stock ?? 0) > 0) {
      throw new Error('SKU 仍有未支付订单占用，无法下架');
    }
    await connection.execute(
      `
        UPDATE brand_product_sku
        SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND status <> ?
      `,
      [BRAND_PRODUCT_STATUS_DISABLED, row.id, BRAND_PRODUCT_STATUS_DISABLED],
    );
  }
  // 静态 import 校验
  void BRAND_PRODUCT_STATUS_ACTIVE;
}
