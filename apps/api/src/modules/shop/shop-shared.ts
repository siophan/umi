import { randomBytes } from 'node:crypto';

import { toEntityId, toOptionalEntityId, type ShopStatusResult } from '@umi/shared';
import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';

export const STATUS_ACTIVE = 10;
export const STATUS_PENDING = 10;
export const STATUS_APPROVED = 30;
export const STATUS_REJECTED = 40;
// shop_brand_auth.status：实际授权关系的真实状态
export const AUTH_STATUS_ACTIVE = 10;
export const AUTH_STATUS_EXPIRED = 90;
export const AUTH_STATUS_REVOKED = 91;

/**
 * 把申请单状态 + 实际授权关系状态合并成前端单一语义字符串。
 * 申请已通过(30) 时优先看 shop_brand_auth.status：active=已授权 / revoked=已撤销 / expired=已过期。
 * sba 行不存在(LEFT JOIN null) 时退回 'approved'，保留向后兼容。
 */
export function mapBrandAuthStatus(applyStatus: number, authStatus: number | null): string {
  if (applyStatus === STATUS_PENDING) {
    return 'pending';
  }
  if (applyStatus === STATUS_REJECTED) {
    return 'rejected';
  }
  if (applyStatus === STATUS_APPROVED) {
    if (authStatus === AUTH_STATUS_ACTIVE) {
      return 'approved';
    }
    if (authStatus === AUTH_STATUS_REVOKED) {
      return 'revoked';
    }
    if (authStatus === AUTH_STATUS_EXPIRED) {
      return 'expired';
    }
    return 'approved';
  }
  return 'rejected';
}

export function createNo(prefix: string) {
  return `${prefix}${randomBytes(6).toString('hex')}`;
}

export type ShopRow = {
  id: number | string;
  name: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  status: number | string;
};

export type BrandAuthRow = {
  id: number | string;
  brand_id: number | string;
  brand_name: string;
  brand_logo: string | null;
  product_count: number | string | null;
  apply_status: number | string;
  auth_status: number | string | null;
  created_at: Date | string;
};

export type ShopProductRow = {
  id: number | string;
  name: string;
  price: number | string;
  original_price?: number | string | null;
  image_url: string | null;
  sales?: number | string | null;
  rating?: number | string | null;
  status: number | string;
  created_at?: Date | string;
  brand_name?: string | null;
};

export type PublicShopGuessRow = {
  id: number | string;
  title: string;
  related_product_id: number | string | null;
};

export type ShopApplyRow = {
  id: number | string;
  apply_no: string;
  shop_name: string;
  category_id: number | string | null;
  category_name: string | null;
  reason: string | null;
  status: number | string;
  reject_reason: string | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
};

/**
 * 读取用户当前有效店铺。
 * 一个用户可能有历史申请或历史店铺记录，这里只取当前最应被用户端消费的那一条。
 */
export async function getCurrentShop(userId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        s.id,
        s.name,
        c.name AS category,
        s.description,
        s.logo_url,
        s.status
      FROM shop s
      LEFT JOIN category c ON c.id = s.category_id
      WHERE s.user_id = ?
      ORDER BY CASE WHEN s.status = ${STATUS_ACTIVE} THEN 0 ELSE 1 END, s.id DESC
      LIMIT 1
    `,
    [userId],
  );
  return (rows[0] as ShopRow | undefined) ?? null;
}

/**
 * 开店状态页只关心最近一次申请，用它来驱动“审核中/已拒绝/待重新申请”等分支。
 */
export async function getLatestShopApplication(userId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sa.id,
        sa.apply_no,
        sa.shop_name,
        sa.category_id,
        c.name AS category_name,
        sa.reason,
        sa.status,
        sa.reject_reason,
        sa.reviewed_at,
        sa.created_at
      FROM shop_apply sa
      LEFT JOIN category c ON c.id = sa.category_id
      WHERE sa.user_id = ?
      ORDER BY sa.created_at DESC, sa.id DESC
      LIMIT 1
    `,
    [userId],
  );
  return (rows[0] as ShopApplyRow | undefined) ?? null;
}

/**
 * 开店分类固定来自店铺业务域 category，不允许前端再从当前店铺数据里自行推分类。
 */
export async function listShopCategories() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, name
      FROM category
      WHERE biz_type = 20
        AND status = 10
      ORDER BY sort ASC, id ASC
    `,
  );
  return (rows as Array<{ id: number | string; name: string }>).map((row) => ({
    id: toEntityId(row.id),
    name: row.name,
  }));
}

export function mapApplicationStatus(status: number) {
  if (status === STATUS_APPROVED) {
    return 'approved';
  }
  if (status === STATUS_PENDING) {
    return 'pending';
  }
  return 'rejected';
}

/**
 * 把店铺主记录、最近申请和分类池整合成开店状态页需要的最小结果集。
 */
export function toShopStatusResult(
  shop: ShopRow | null,
  latestApplication: ShopApplyRow | null,
  categories: Awaited<ReturnType<typeof listShopCategories>>,
): ShopStatusResult {
  if (shop && Number(shop.status) === STATUS_ACTIVE) {
    return {
      status: 'active',
      shop: {
        id: toEntityId(shop.id),
        name: shop.name,
        status: 'active',
      },
      latestApplication: latestApplication
        ? {
            id: toEntityId(latestApplication.id),
            applyNo: latestApplication.apply_no,
            shopName: latestApplication.shop_name,
            categoryId: toOptionalEntityId(latestApplication.category_id),
            categoryName: latestApplication.category_name ?? null,
            reason: latestApplication.reason ?? null,
            status: mapApplicationStatus(Number(latestApplication.status)),
            rejectReason: latestApplication.reject_reason ?? null,
            reviewedAt: latestApplication.reviewed_at ? new Date(latestApplication.reviewed_at).toISOString() : null,
            createdAt: new Date(latestApplication.created_at).toISOString(),
          }
        : null,
      categories,
    };
  }

  if (latestApplication) {
    const applicationStatus = mapApplicationStatus(Number(latestApplication.status));
    return {
      status: applicationStatus === 'pending' ? 'pending' : applicationStatus === 'rejected' ? 'rejected' : 'none',
      shop: null,
      latestApplication: {
        id: toEntityId(latestApplication.id),
        applyNo: latestApplication.apply_no,
        shopName: latestApplication.shop_name,
        categoryId: toOptionalEntityId(latestApplication.category_id),
        categoryName: latestApplication.category_name ?? null,
        reason: latestApplication.reason ?? null,
        status: applicationStatus,
        rejectReason: latestApplication.reject_reason ?? null,
        reviewedAt: latestApplication.reviewed_at ? new Date(latestApplication.reviewed_at).toISOString() : null,
        createdAt: new Date(latestApplication.created_at).toISOString(),
      },
      categories,
    };
  }

  return {
    status: 'none',
    shop: null,
    latestApplication: null,
    categories,
  };
}

