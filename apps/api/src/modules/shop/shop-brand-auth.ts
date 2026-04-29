import type mysql from 'mysql2/promise';
import type {
  AddShopProductsResult,
  BrandAuthOverviewResult,
  BrandProductListResult,
  SubmitBrandAuthApplicationResult,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import {
  AUTH_STATUS_ACTIVE,
  BrandAuthRow,
  createNo,
  getCurrentShop,
  mapBrandAuthStatus,
  STATUS_ACTIVE,
  STATUS_PENDING,
} from './shop-shared';

export async function getBrandAuthOverview(userId: string): Promise<BrandAuthOverviewResult> {
  const db = getDbPool();
  const shop = await getCurrentShop(userId);

  let mine: BrandAuthOverviewResult['mine'] = [];
  let available: BrandAuthOverviewResult['available'] = [];

  if (shop) {
    const [mineRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT sbaa.id,
               sbaa.brand_id,
               b.name AS brand_name,
               b.logo_url AS brand_logo,
               (
                 SELECT COUNT(*)
                 FROM product p2
                 INNER JOIN brand_product bp2 ON bp2.id = p2.brand_product_id
                 WHERE bp2.brand_id = sbaa.brand_id
                   AND p2.shop_id = sbaa.shop_id
               ) AS product_count,
               sbaa.status AS apply_status,
               sba.status AS auth_status,
               sbaa.reject_reason,
               sbaa.created_at
        FROM shop_brand_auth_apply sbaa
        INNER JOIN (
          SELECT brand_id, MAX(id) AS latest_id
          FROM shop_brand_auth_apply
          WHERE shop_id = ?
          GROUP BY brand_id
        ) latest ON latest.latest_id = sbaa.id
        INNER JOIN brand b ON b.id = sbaa.brand_id
        LEFT JOIN shop_brand_auth sba
               ON sba.shop_id = sbaa.shop_id
              AND sba.brand_id = sbaa.brand_id
        ORDER BY sbaa.created_at DESC
      `,
      [shop.id],
    );

    const [brandRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          b.id,
          b.name,
          b.logo_url,
          c.name AS category,
          (SELECT COUNT(*) FROM brand_product bp WHERE bp.brand_id = b.id AND bp.status = 10) AS product_count,
          (
            SELECT sbaa.status
            FROM shop_brand_auth_apply sbaa
            WHERE sbaa.shop_id = ?
              AND sbaa.brand_id = b.id
            ORDER BY sbaa.created_at DESC
            LIMIT 1
          ) AS apply_status,
          (
            SELECT sba.status
            FROM shop_brand_auth sba
            WHERE sba.shop_id = ?
              AND sba.brand_id = b.id
            LIMIT 1
          ) AS auth_status
        FROM brand b
        LEFT JOIN category c ON c.id = b.category_id
        WHERE b.status = 10
          AND NOT EXISTS (
            SELECT 1
            FROM shop_brand_auth sba_x
            WHERE sba_x.shop_id = ?
              AND sba_x.brand_id = b.id
              AND sba_x.status = ?
          )
        ORDER BY b.name ASC
      `,
      [shop.id, shop.id, shop.id, AUTH_STATUS_ACTIVE],
    );

    mine = (mineRows as BrandAuthRow[]).map((row) => ({
      id: toEntityId(row.id),
      brandId: toEntityId(row.brand_id),
      brandName: row.brand_name,
      brandLogo: row.brand_logo ?? null,
      productCount: Number(row.product_count ?? 0),
      status: mapBrandAuthStatus(
        Number(row.apply_status),
        row.auth_status == null ? null : Number(row.auth_status),
      ),
      rejectReason: row.reject_reason ?? null,
      createdAt: new Date(row.created_at).toISOString(),
    }));

    available = (brandRows as Array<{ id: number; name: string; logo_url: string | null; category: string | null; product_count: number | string; apply_status: number | string | null; auth_status: number | string | null }>).map((row) => ({
      id: toEntityId(row.id),
      name: row.name,
      logo: row.logo_url ?? null,
      category: row.category ?? null,
      productCount: Number(row.product_count ?? 0),
      status:
        row.apply_status === null
          ? 'idle'
          : mapBrandAuthStatus(
              Number(row.apply_status),
              row.auth_status == null ? null : Number(row.auth_status),
            ),
    }));
  }

  return {
    shopName: shop?.name ?? null,
    mine,
    available,
  };
}

export async function submitBrandAuthApplication(
  userId: string,
  input: { brandId?: unknown; reason?: unknown; license?: unknown },
): Promise<SubmitBrandAuthApplicationResult> {
  const shop = await getCurrentShop(userId);
  if (!shop) {
    throw new HttpError(400, 'SHOP_REQUIRED', '请先创建店铺');
  }

  const brandId = typeof input.brandId === 'string' ? input.brandId.trim() : '';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  const license = typeof input.license === 'string' ? input.license.trim() : '';

  if (!brandId) {
    throw new HttpError(400, 'SHOP_BRAND_REQUIRED', '请选择品牌');
  }

  const db = getDbPool();
  const [existingRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sbaa.status AS apply_status,
        (
          SELECT sba.status
          FROM shop_brand_auth sba
          WHERE sba.shop_id = sbaa.shop_id
            AND sba.brand_id = sbaa.brand_id
          LIMIT 1
        ) AS auth_status
      FROM shop_brand_auth_apply sbaa
      WHERE sbaa.shop_id = ?
        AND sbaa.brand_id = ?
      ORDER BY sbaa.created_at DESC
      LIMIT 1
    `,
    [shop.id, brandId],
  );

  const existing = existingRows[0] as { apply_status?: number | string; auth_status?: number | string | null } | undefined;
  if (existing) {
    const effectiveStatus = mapBrandAuthStatus(
      Number(existing.apply_status),
      existing.auth_status == null ? null : Number(existing.auth_status),
    );
    if (effectiveStatus === 'pending') {
      throw new HttpError(400, 'SHOP_BRAND_AUTH_PENDING', '该品牌已在审核中');
    }
    if (effectiveStatus === 'approved') {
      throw new HttpError(400, 'SHOP_BRAND_AUTH_ALREADY_APPROVED', '该品牌已授权');
    }
  }

  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO shop_brand_auth_apply (
        apply_no,
        shop_id,
        brand_id,
        reason,
        license,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [createNo('BA'), shop.id, brandId, reason || null, license || null, STATUS_PENDING],
  );

  return { id: toEntityId(result.insertId), status: 'pending' };
}

export async function getBrandProducts(userId: string, brandId: string): Promise<BrandProductListResult> {
  if (!brandId) {
    throw new HttpError(400, 'SHOP_BRAND_ID_REQUIRED', '缺少 brandId');
  }

  const shop = await getCurrentShop(userId);
  if (!shop) {
    throw new HttpError(400, 'SHOP_REQUIRED', '请先创建店铺');
  }

  const db = getDbPool();
  const [authRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM shop_brand_auth
      WHERE shop_id = ?
        AND brand_id = ?
        AND status = ?
      LIMIT 1
    `,
    [shop.id, brandId, STATUS_ACTIVE],
  );
  if (!authRows[0]) {
    throw new HttpError(403, 'SHOP_BRAND_AUTH_REQUIRED', '该品牌尚未授权');
  }

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        bp.id,
        bp.brand_id,
        b.name AS brand_name,
        bp.name,
        c.name AS category,
        bp.guide_price,
        bp.supply_price,
        bp.default_img,
        bp.status
      FROM brand_product bp
      INNER JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = bp.category_id
      WHERE bp.brand_id = ?
        AND bp.status = ?
      ORDER BY bp.created_at DESC
    `,
    [brandId, STATUS_ACTIVE],
  );

  const items: BrandProductListResult['items'] = (rows as Array<{ id: number | string; brand_id: number | string; brand_name: string; name: string; category: string | null; guide_price: number | string; supply_price: number | string; default_img: string | null; status: number | string }>).map((row) => ({
    id: toEntityId(row.id),
    brandId: toEntityId(row.brand_id),
    brandName: row.brand_name,
    name: row.name,
    category: row.category,
    guidePrice: Number(row.guide_price ?? 0) / 100,
    supplyPrice: Number(row.supply_price ?? 0) / 100,
    defaultImg: row.default_img ?? null,
    status: Number(row.status) === STATUS_ACTIVE ? 'active' : String(row.status),
  }));

  return { items };
}

export async function addShopProducts(
  userId: string,
  input: { brandId?: unknown; brandProductIds?: unknown },
): Promise<AddShopProductsResult> {
  const brandId = typeof input.brandId === 'string' ? input.brandId.trim() : '';
  const brandProductIds = Array.isArray(input.brandProductIds)
    ? input.brandProductIds.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (!brandId || brandProductIds.length === 0) {
    throw new HttpError(400, 'SHOP_PRODUCTS_SELECTION_REQUIRED', '请选择品牌和商品');
  }

  const shop = await getCurrentShop(userId);
  if (!shop) {
    throw new HttpError(400, 'SHOP_REQUIRED', '请先创建店铺');
  }

  const db = getDbPool();
  const [authRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM shop_brand_auth
      WHERE shop_id = ?
        AND brand_id = ?
        AND status = ?
      LIMIT 1
    `,
    [shop.id, brandId, STATUS_ACTIVE],
  );
  if (!authRows[0]) {
    throw new HttpError(403, 'SHOP_BRAND_AUTH_REQUIRED', '该品牌尚未授权');
  }

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT id, name, default_img, guide_price
      FROM brand_product
      WHERE brand_id = ?
        AND id IN (?)
        AND status = ?
    `,
    [brandId, brandProductIds, STATUS_ACTIVE],
  );

  const products = rows as Array<{ id: number | string; name: string; default_img: string | null; guide_price: number | string }>;
  for (const product of products) {
    await db.execute(
      `
        INSERT INTO product (
          shop_id,
          brand_product_id,
          name,
          price,
          original_price,
          image_url,
          images,
          stock,
          frozen_stock,
          tags,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, JSON_ARRAY(), 0, 0, JSON_ARRAY(), ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [shop.id, product.id, product.name, product.guide_price, product.guide_price, product.default_img, STATUS_ACTIVE],
    );
  }

  return { count: products.length };
}

