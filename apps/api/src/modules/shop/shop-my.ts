import type mysql from 'mysql2/promise';
import type { MyShopResult, SubmitShopApplicationResult } from '@umi/shared';
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
  ShopProductRow,
  STATUS_ACTIVE,
  STATUS_APPROVED,
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

  if (shop) {
    const [brandRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT sbaa.id,
               sbaa.brand_id,
               b.name AS brand_name,
               sbaa.status,
               sbaa.created_at
        FROM shop_brand_auth_apply sbaa
        INNER JOIN brand b ON b.id = sbaa.brand_id
        WHERE sbaa.shop_id = ?
        ORDER BY sbaa.created_at DESC
      `,
      [shop.id],
    );

    const [productRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, name, price, image_url, status
        FROM product
        WHERE shop_id = ?
        ORDER BY created_at DESC
      `,
      [shop.id],
    );

    const [statsRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          (SELECT COUNT(*) FROM product p WHERE p.shop_id = ?) AS product_count,
          (SELECT COUNT(*) FROM fulfillment_order fo WHERE fo.shop_id = ?) AS order_count,
          (SELECT COALESCE(SUM(fo.total_amount), 0) FROM fulfillment_order fo WHERE fo.shop_id = ?) AS revenue
      `,
      [shop.id, shop.id, shop.id],
    );

    const stats = statsRows[0] as { product_count?: number | string; order_count?: number | string; revenue?: number | string } | undefined;
    productCount = Number(stats?.product_count ?? 0);
    orderCount = Number(stats?.order_count ?? 0);
    revenue = Number(stats?.revenue ?? 0);

    brandAuths = (brandRows as BrandAuthRow[]).map((row) => ({
      id: toEntityId(row.id),
      brandId: toEntityId(row.brand_id),
      brandName: row.brand_name,
      status: Number(row.status) === STATUS_APPROVED ? 'approved' : Number(row.status) === STATUS_PENDING ? 'pending' : 'rejected',
      createdAt: new Date(row.created_at).toISOString(),
    }));

    products = (productRows as ShopProductRow[]).map((row) => ({
      id: toEntityId(row.id),
      name: row.name,
      brand: null,
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
          rating: 0,
        }
      : null,
    brandAuths,
    products,
  };
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

