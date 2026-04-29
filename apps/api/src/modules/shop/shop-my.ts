import type mysql from 'mysql2/promise';
import type { MyShopResult, MyShopStatsResult, SubmitShopApplicationResult } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import {
  createNo,
  getCurrentShop,
  getLatestShopApplication,
  BrandAuthRow,
  listShopCategories,
  mapApplicationStatus,
  mapBrandAuthStatus,
  ShopProductRow,
  STATUS_ACTIVE,
  STATUS_PENDING,
  toShopStatusResult,
} from './shop-shared';

/**
 * 我的店铺页需要店铺概览、品牌授权和在售商品三块数据，这里集中做一次聚合查询。
 */
export async function getMyShopResult(userId: string): Promise<MyShopResult> {
  const db = getDbPool();
  const shop = await getCurrentShop(userId);

  let brandAuths: MyShopResult['brandAuths'] = [];
  let products: MyShopResult['products'] = [];
  let productCount = 0;
  let orderCount = 0;
  let revenue = 0;

  let rating = 0;

  if (shop) {
    const [brandRows] = await db.execute<mysql.RowDataPacket[]>(
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

    const [productRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT p.id,
               p.name,
               p.price,
               p.image_url,
               p.status,
               b.name AS brand_name
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        WHERE p.shop_id = ?
        ORDER BY p.created_at DESC
      `,
      [shop.id],
    );

    const [statsRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          (SELECT COUNT(*) FROM product p WHERE p.shop_id = ?) AS product_count,
          (SELECT COUNT(*) FROM fulfillment_order fo WHERE fo.shop_id = ?) AS order_count,
          (SELECT COALESCE(SUM(fo.total_amount), 0) FROM fulfillment_order fo WHERE fo.shop_id = ?) AS revenue,
          (
            SELECT AVG(pr.rating)
            FROM product_review pr
            INNER JOIN product p2 ON p2.id = pr.product_id
            WHERE p2.shop_id = ? AND pr.status = 10
          ) AS avg_rating
      `,
      [shop.id, shop.id, shop.id, shop.id],
    );

    const stats = statsRows[0] as {
      product_count?: number | string;
      order_count?: number | string;
      revenue?: number | string;
      avg_rating?: number | string | null;
    } | undefined;
    productCount = Number(stats?.product_count ?? 0);
    orderCount = Number(stats?.order_count ?? 0);
    revenue = Number(stats?.revenue ?? 0);
    rating = stats?.avg_rating != null ? Number(stats.avg_rating) : 0;

    brandAuths = (brandRows as BrandAuthRow[]).map((row) => ({
      id: toEntityId(row.id),
      brandId: toEntityId(row.brand_id),
      brandName: row.brand_name,
      brandLogo: row.brand_logo ?? null,
      productCount: Number(row.product_count ?? 0),
      status: mapBrandAuthStatus(
        Number(row.apply_status),
        row.auth_status == null ? null : Number(row.auth_status),
      ),
      createdAt: new Date(row.created_at).toISOString(),
    }));

    products = (productRows as ShopProductRow[]).map((row) => ({
      id: toEntityId(row.id),
      name: row.name,
      brand: row.brand_name ?? null,
      price: Number(row.price ?? 0) / 100,
      img: row.image_url ?? null,
      status: Number(row.status) === STATUS_ACTIVE ? 'active' : String(row.status),
    }));
  }

  return {
    shop: shop
      ? {
          id: toEntityId(shop.id),
          name: shop.name,
          category: shop.category,
          description: shop.description,
          logo: shop.logo_url,
          status: Number(shop.status) === STATUS_ACTIVE ? 'active' : String(shop.status),
          revenue: revenue / 100,
          productCount,
          orderCount,
          rating,
        }
      : null,
    brandAuths,
    products,
  };
}

/**
 * 我的店铺数据统计：今日 / 近 7 天 / 本月 三段聚合，
 * 与老系统 Api.shop.stats() 的 today/week/month 三段对应。
 * 时间窗以服务器本地时间的 0 点为界。
 */
export async function getMyShopStats(userId: string): Promise<MyShopStatsResult> {
  const empty = { sales: 0, orders: 0 };
  const shop = await getCurrentShop(userId);
  if (!shop) {
    return { today: empty, week: empty, month: empty };
  }
  const shopId = shop.id;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const db = getDbPool();
  async function periodStats(since: Date) {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT COALESCE(SUM(total_amount), 0) AS sales,
               COUNT(*) AS orders
        FROM fulfillment_order
        WHERE shop_id = ?
          AND created_at >= ?
      `,
      [shopId, since],
    );
    const row = rows[0] as { sales?: number | string; orders?: number | string } | undefined;
    return {
      sales: Number(row?.sales ?? 0) / 100,
      orders: Number(row?.orders ?? 0),
    };
  }

  const [today, week, month] = await Promise.all([
    periodStats(todayStart),
    periodStats(weekStart),
    periodStats(monthStart),
  ]);

  return { today, week, month };
}

export async function getMyShopStatus(userId: string) {
  const [shop, latestApplication, categories] = await Promise.all([
    getCurrentShop(userId),
    getLatestShopApplication(userId),
    listShopCategories(),
  ]);

  return toShopStatusResult(shop, latestApplication, categories);
}

export async function submitShopApplication(
  userId: string,
  input: { shopName?: unknown; categoryId?: unknown; reason?: unknown },
): Promise<SubmitShopApplicationResult> {
  const shopName = typeof input.shopName === 'string' ? input.shopName.trim() : '';
  const categoryId = typeof input.categoryId === 'string' ? input.categoryId.trim() : '';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';

  if (!shopName) {
    throw new HttpError(400, 'SHOP_NAME_REQUIRED', '请填写店铺名称');
  }
  if (shopName.length > 24) {
    throw new HttpError(400, 'SHOP_NAME_TOO_LONG', '店铺名称请控制在 24 字以内');
  }
  if (!categoryId) {
    throw new HttpError(400, 'SHOP_CATEGORY_REQUIRED', '请选择经营分类');
  }
  if (!reason) {
    throw new HttpError(400, 'SHOP_APPLICATION_REASON_REQUIRED', '请填写开店说明');
  }

  const db = getDbPool();
  const [shop, latestApplication, categoryRows] = await Promise.all([
    getCurrentShop(userId),
    getLatestShopApplication(userId),
    db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 20
          AND status = 10
        LIMIT 1
      `,
      [categoryId],
    ),
  ]);

  if (shop && Number(shop.status) === STATUS_ACTIVE) {
    throw new HttpError(400, 'SHOP_ALREADY_ACTIVE', '你已开通店铺');
  }

  if (latestApplication && Number(latestApplication.status) === STATUS_PENDING) {
    throw new HttpError(400, 'SHOP_APPLICATION_PENDING', '当前已有开店申请在审核中');
  }

  const category = categoryRows[0][0] as { id?: number | string } | undefined;
  if (!category?.id) {
    throw new HttpError(400, 'SHOP_CATEGORY_NOT_FOUND', '经营分类不存在');
  }

  const applyNo = createNo('SA');
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO shop_apply (
        apply_no,
        user_id,
        shop_name,
        category_id,
        reason,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [applyNo, userId, shopName, categoryId, reason, STATUS_PENDING],
  );

  return {
    id: toEntityId(result.insertId),
    applyNo,
    status: 'pending',
  };
}

