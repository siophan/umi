import { randomBytes } from 'node:crypto';
import type mysql from 'mysql2/promise';
import { toEntityId } from '@umi/shared';
import type {
  AdminShopDetailResult,
  CreateAdminBrandPayload,
  CreateAdminBrandResult,
  ReviewAdminBrandAuthApplyPayload,
  ReviewAdminBrandAuthApplyResult,
  ReviewAdminShopApplyPayload,
  ReviewAdminShopApplyResult,
  UpdateAdminBrandPayload,
  UpdateAdminBrandResult,
  UpdateAdminShopStatusPayload,
  UpdateAdminShopStatusResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const STATUS_PENDING = 10;
const STATUS_APPROVED = 30;
const STATUS_REJECTED = 40;

const SHOP_STATUS_ACTIVE = 10;
const SHOP_STATUS_PAUSED = 20;
const SHOP_STATUS_CLOSED = 90;

const BRAND_STATUS_ACTIVE = 10;
const BRAND_STATUS_DISABLED = 90;

const PRODUCT_STATUS_ACTIVE = 10;
const PRODUCT_STATUS_OFF_SHELF = 20;
const PRODUCT_STATUS_DISABLED = 90;

const AUTH_STATUS_ACTIVE = 10;
const AUTH_STATUS_EXPIRED = 90;
const AUTH_STATUS_REVOKED = 91;

const AUTH_TYPE_NORMAL = 10;
const AUTH_TYPE_EXCLUSIVE = 20;
const AUTH_TYPE_TRIAL = 30;

const AUTH_SCOPE_ALL_BRAND = 10;
const AUTH_SCOPE_CATEGORY_ONLY = 20;
const AUTH_SCOPE_PRODUCT_ONLY = 30;

function createNo(prefix: string) {
  return `${prefix}${randomBytes(6).toString('hex')}`;
}

type ShopListRow = {
  id: number | string;
  user_id: number | string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  category_name: string | null;
  status: number | string;
  product_count: number | string | null;
  order_count: number | string | null;
  avg_rating: number | string | null;
  brand_auth_count: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type ShopApplyListRow = {
  id: number | string;
  apply_no: string;
  user_id: number | string;
  shop_name: string;
  applicant_name: string | null;
  contact_phone: string | null;
  category_name: string | null;
  reason: string | null;
  status: number | string;
  reject_reason: string | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
};

type BrandAuthApplyListRow = {
  id: number | string;
  apply_no: string;
  shop_id: number | string;
  shop_name: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  brand_id: number | string;
  brand_name: string | null;
  reason: string | null;
  license: string | null;
  status: number | string;
  reject_reason: string | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
};

type BrandAuthListRow = {
  id: number | string;
  auth_no: string;
  shop_id: number | string;
  shop_name: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  brand_id: number | string;
  brand_name: string | null;
  auth_type: number | string;
  auth_scope: number | string;
  scope_value: unknown;
  status: number | string;
  granted_at: Date | string;
  expire_at: Date | string | null;
  expired_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type ShopProductListRow = {
  id: number | string;
  shop_id: number | string | null;
  shop_name: string | null;
  brand_product_id: number | string | null;
  brand_id: number | string | null;
  brand_name: string | null;
  product_name: string;
  price: number | string;
  original_price: number | string | null;
  guess_price: number | string | null;
  image_url: string | null;
  sales: number | string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type ShopDetailBaseRow = {
  id: number | string;
  user_id: number | string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  category_name: string | null;
  status: number | string;
  description: string | null;
  product_count: number | string | null;
  order_count: number | string | null;
  avg_rating: number | string | null;
  brand_auth_count: number | string | null;
  total_sales: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type ShopDetailProductRow = {
  id: number | string;
  name: string;
  brand_name: string | null;
  price: number | string | null;
  original_price: number | string | null;
  sales: number | string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type ShopDetailOrderRow = {
  id: number | string;
  order_sn: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  amount: number | string | null;
  status: number | string;
  created_at: Date | string;
};

type ShopDetailGuessRow = {
  id: number | string;
  title: string;
  status: number | string;
  end_time: Date | string | null;
  bet_count: number | string | null;
  created_at: Date | string;
};

type BrandListRow = {
  id: number | string;
  name: string;
  logo_url: string | null;
  category_id: number | string | null;
  category_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  description: string | null;
  status: number | string;
  shop_count: number | string | null;
  goods_count: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toId(value: number | string | null | undefined) {
  return value == null ? null : String(value);
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function parseJsonValue(value: unknown) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function collectScopeEntityIds(scopeValue: unknown) {
  const ids = new Set<number>();

  function visit(value: unknown) {
    if (value == null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === 'number' || typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed > 0) {
        ids.add(parsed);
      }
      return;
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      for (const key of ['id', 'value', 'productId', 'brandProductId', 'categoryId']) {
        if (key in record) {
          visit(record[key]);
        }
      }
    }
  }

  visit(scopeValue);
  return Array.from(ids);
}

function buildUserDisplayName(name: string | null, phone: string | null) {
  if (name?.trim()) {
    return name.trim();
  }
  if (phone?.trim()) {
    return `用户${phone.trim().slice(-4)}`;
  }
  return '未知用户';
}

function mapReviewStatus(code: number | string) {
  const value = Number(code ?? 0);
  if (value === STATUS_APPROVED) {
    return { code: value, key: 'approved', label: '已通过' as const };
  }
  if (value === STATUS_REJECTED) {
    return { code: value, key: 'rejected', label: '已拒绝' as const };
  }
  return { code: value, key: 'pending', label: '待审核' as const };
}

function mapShopStatus(
  code: number | string,
): { code: number; key: 'active' | 'paused' | 'closed'; label: '营业中' | '暂停营业' | '已关闭' } {
  const value = Number(code ?? 0);
  if (value === SHOP_STATUS_PAUSED) {
    return { code: value, key: 'paused', label: '暂停营业' as const };
  }
  if (value === SHOP_STATUS_CLOSED) {
    return { code: value, key: 'closed', label: '已关闭' as const };
  }
  return { code: value, key: 'active', label: '营业中' as const };
}

function mapBrandStatus(code: number | string) {
  const value = Number(code ?? 0);
  if (value === BRAND_STATUS_DISABLED) {
    return { code: value, key: 'disabled', label: '停用' as const };
  }
  return { code: value, key: 'active', label: '合作中' as const };
}

function mapProductStatus(
  code: number | string,
): { code: number; key: 'active' | 'off_shelf' | 'disabled'; label: '在售' | '已下架' | '不可售' } {
  const value = Number(code ?? 0);
  if (value === PRODUCT_STATUS_OFF_SHELF) {
    return { code: value, key: 'off_shelf', label: '已下架' as const };
  }
  if (value === PRODUCT_STATUS_DISABLED) {
    return { code: value, key: 'disabled', label: '不可售' as const };
  }
  return { code: value, key: 'active', label: '在售' as const };
}

function mapAuthStatus(
  code: number | string,
): { code: number; key: 'active' | 'expired' | 'revoked'; label: '生效中' | '已过期' | '已撤销' } {
  const value = Number(code ?? 0);
  if (value === AUTH_STATUS_EXPIRED) {
    return { code: value, key: 'expired', label: '已过期' as const };
  }
  if (value === AUTH_STATUS_REVOKED) {
    return { code: value, key: 'revoked', label: '已撤销' as const };
  }
  return { code: value, key: 'active', label: '生效中' as const };
}

function mapAuthType(code: number | string) {
  const value = Number(code ?? 0);
  if (value === AUTH_TYPE_EXCLUSIVE) {
    return { code: value, key: 'exclusive', label: '独家授权' as const };
  }
  if (value === AUTH_TYPE_TRIAL) {
    return { code: value, key: 'trial', label: '试用授权' as const };
  }
  return { code: value, key: 'normal', label: '普通授权' as const };
}

function mapAuthScope(code: number | string) {
  const value = Number(code ?? 0);
  if (value === AUTH_SCOPE_CATEGORY_ONLY) {
    return { code: value, key: 'category_only', label: '指定类目授权' as const };
  }
  if (value === AUTH_SCOPE_PRODUCT_ONLY) {
    return { code: value, key: 'product_only', label: '指定商品授权' as const };
  }
  return { code: value, key: 'all_brand', label: '全品牌授权' as const };
}

function summarizeByKey<TItem extends Record<string, unknown>>(
  items: TItem[],
  key: keyof TItem,
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = String(item[key] ?? '');
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}

function normalizeReviewStatus(status: string | null | undefined) {
  if (status === 'approved' || status === 'rejected') {
    return status;
  }
  throw new Error('审核状态不合法');
}

function normalizeRejectReason(
  status: 'approved' | 'rejected',
  rejectReason: string | null | undefined,
) {
  const value = rejectReason?.trim() ?? '';
  if (status === 'rejected' && !value) {
    throw new Error('请填写拒绝原因');
  }
  return value ? value.slice(0, 200) : null;
}

function ensurePendingReview(status: number | string) {
  if (Number(status ?? 0) !== STATUS_PENDING) {
    throw new Error('申请已审核');
  }
}

function normalizeBrandStatus(status: 'active' | 'disabled' | null | undefined) {
  if (status === 'disabled') {
    return BRAND_STATUS_DISABLED;
  }
  return BRAND_STATUS_ACTIVE;
}

async function listBrandAuthRecordsInternal() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sba.id,
        sba.auth_no,
        sba.shop_id,
        s.name AS shop_name,
        up.name AS owner_name,
        u.phone_number AS owner_phone,
        sba.brand_id,
        b.name AS brand_name,
        sba.auth_type,
        sba.auth_scope,
        sba.scope_value,
        sba.status,
        sba.granted_at,
        sba.expire_at,
        sba.expired_at,
        sba.created_at,
        sba.updated_at
      FROM shop_brand_auth sba
      LEFT JOIN shop s ON s.id = sba.shop_id
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN brand b ON b.id = sba.brand_id
      ORDER BY sba.created_at DESC, sba.id DESC
    `,
  );

  return (rows as BrandAuthListRow[]).map((row) => {
    const authType = mapAuthType(row.auth_type);
    const authScope = mapAuthScope(row.auth_scope);
    const status = mapAuthStatus(row.status);
    const shopName = row.shop_name ?? '未知店铺';
    const brandName = row.brand_name ?? '未知品牌';

    return {
      id: String(row.id),
      authNo: row.auth_no,
      shopId: String(row.shop_id),
      shopName,
      ownerName: buildUserDisplayName(row.owner_name, row.owner_phone),
      ownerPhone: row.owner_phone ?? null,
      brandId: String(row.brand_id),
      brandName,
      subject: `${brandName} -> ${shopName}`,
      authType: authType.key,
      authTypeLabel: authType.label,
      authScope: authScope.key,
      authScopeLabel: authScope.label,
      scopeValue: parseJsonValue(row.scope_value),
      status: status.key,
      statusLabel: status.label,
      grantedAt: toIso(row.granted_at),
      expireAt: toIso(row.expire_at),
      expiredAt: toIso(row.expired_at),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      operatorName: null as string | null,
    };
  });
}

export async function getAdminShops() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        s.id,
        s.user_id,
        s.name,
        up.name AS owner_name,
        u.phone_number AS owner_phone,
        c.name AS category_name,
        s.status,
        COALESCE(pc.product_count, 0) AS product_count,
        COALESCE(oc.order_count, 0) AS order_count,
        ROUND(COALESCE(rc.avg_rating, 0), 2) AS avg_rating,
        COALESCE(ac.brand_auth_count, 0) AS brand_auth_count,
        s.created_at,
        s.updated_at
      FROM shop s
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN category c ON c.id = s.category_id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS product_count
        FROM product
        GROUP BY shop_id
      ) pc ON pc.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS order_count
        FROM fulfillment_order
        GROUP BY shop_id
      ) oc ON oc.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, AVG(rating) AS avg_rating
        FROM product
        GROUP BY shop_id
      ) rc ON rc.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS brand_auth_count
        FROM shop_brand_auth
        WHERE status = ?
        GROUP BY shop_id
      ) ac ON ac.shop_id = s.id
      ORDER BY s.created_at DESC, s.id DESC
    `,
    [AUTH_STATUS_ACTIVE],
  );

  const items = (rows as ShopListRow[]).map((row) => {
    const status = mapShopStatus(row.status);
    return {
      id: String(row.id),
      name: row.name,
      ownerId: String(row.user_id),
      ownerName: buildUserDisplayName(row.owner_name, row.owner_phone),
      ownerPhone: row.owner_phone ?? null,
      category: row.category_name ?? null,
      status: status.key,
      statusLabel: status.label,
      products: toNumber(row.product_count),
      orders: toNumber(row.order_count),
      score: Number(toNumber(row.avg_rating).toFixed(2)),
      brandAuthCount: toNumber(row.brand_auth_count),
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

export async function getAdminShopDetail(shopId: string): Promise<AdminShopDetailResult | null> {
  const db = getDbPool();
  const [shopRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        s.id,
        s.user_id,
        s.name,
        up.name AS owner_name,
        u.phone_number AS owner_phone,
        c.name AS category_name,
        s.status,
        s.description,
        COALESCE(pc.product_count, 0) AS product_count,
        COALESCE(oc.order_count, 0) AS order_count,
        ROUND(COALESCE(rc.avg_rating, 0), 2) AS avg_rating,
        COALESCE(ac.brand_auth_count, 0) AS brand_auth_count,
        COALESCE(pc.total_sales, 0) AS total_sales,
        s.created_at,
        s.updated_at
      FROM shop s
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN category c ON c.id = s.category_id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS product_count, COALESCE(SUM(sales), 0) AS total_sales
        FROM product
        GROUP BY shop_id
      ) pc ON pc.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS order_count
        FROM fulfillment_order
        GROUP BY shop_id
      ) oc ON oc.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, AVG(rating) AS avg_rating
        FROM product
        GROUP BY shop_id
      ) rc ON rc.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS brand_auth_count
        FROM shop_brand_auth
        WHERE status = ?
        GROUP BY shop_id
      ) ac ON ac.shop_id = s.id
      WHERE s.id = ?
      LIMIT 1
    `,
    [AUTH_STATUS_ACTIVE, shopId],
  );

  const shop = (shopRows as ShopDetailBaseRow[])[0];
  if (!shop) {
    return null;
  }

  const [productRows, orderRows, guessRows, brandAuthRows] = await Promise.all([
    db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.name,
          b.name AS brand_name,
          p.price,
          p.original_price,
          p.sales,
          p.stock,
          p.frozen_stock,
          p.status,
          p.created_at,
          p.updated_at
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        WHERE p.shop_id = ?
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 50
      `,
      [shopId],
    ),
    db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          o.id,
          o.order_sn,
          up.name AS buyer_name,
          u.phone_number AS buyer_phone,
          o.amount,
          o.status,
          o.created_at
        FROM \`order\` o
        LEFT JOIN user u ON u.id = o.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE o.shop_id = ?
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 50
      `,
      [shopId],
    ),
    db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          g.id,
          g.title,
          g.status,
          g.end_time,
          g.created_at,
          COALESCE(bc.bet_count, 0) AS bet_count
        FROM guess_product gp
        INNER JOIN \`guess\` g ON g.id = gp.guess_id
        LEFT JOIN (
          SELECT guess_id, COUNT(*) AS bet_count
          FROM guess_bet
          GROUP BY guess_id
        ) bc ON bc.guess_id = g.id
        WHERE gp.shop_id = ?
        GROUP BY g.id, g.title, g.status, g.end_time, g.created_at, bc.bet_count
        ORDER BY g.created_at DESC, g.id DESC
        LIMIT 50
      `,
      [shopId],
    ),
    db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          sba.id,
          sba.auth_no,
          sba.brand_id,
          b.name AS brand_name,
          sba.auth_type,
          sba.auth_scope,
          sba.status,
          sba.granted_at,
          sba.expire_at
        FROM shop_brand_auth sba
        LEFT JOIN brand b ON b.id = sba.brand_id
        WHERE sba.shop_id = ?
        ORDER BY sba.created_at DESC, sba.id DESC
        LIMIT 50
      `,
      [shopId],
    ),
  ]);

  const shopStatus = mapShopStatus(shop.status);

  return {
    shop: {
      id: toEntityId(shop.id),
      name: shop.name,
      ownerId: toEntityId(shop.user_id),
      ownerName: buildUserDisplayName(shop.owner_name, shop.owner_phone),
      ownerPhone: shop.owner_phone ?? null,
      category: shop.category_name ?? null,
      status: shopStatus.key,
      statusLabel: shopStatus.label,
      description: shop.description ?? null,
      products: toNumber(shop.product_count),
      orders: toNumber(shop.order_count),
      score: Number(toNumber(shop.avg_rating).toFixed(2)),
      brandAuthCount: toNumber(shop.brand_auth_count),
      totalSales: toNumber(shop.total_sales),
      createdAt: toIso(shop.created_at),
      updatedAt: toIso(shop.updated_at),
    },
    products: (productRows[0] as ShopDetailProductRow[]).map((row) => {
      const status = mapProductStatus(row.status);
      return {
        id: toEntityId(row.id),
        name: row.name,
        brandName: row.brand_name ?? null,
        price: toNumber(row.price) / 100,
        originalPrice: toNumber(row.original_price ?? row.price) / 100,
        sales: toNumber(row.sales),
        stock: toNumber(row.stock),
        frozenStock: toNumber(row.frozen_stock),
        status: status.key,
        statusLabel: status.label,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      };
    }),
    orders: (orderRows[0] as ShopDetailOrderRow[]).map((row) => ({
      id: toEntityId(row.id),
      orderNo: row.order_sn,
      buyerName: buildUserDisplayName(row.buyer_name, row.buyer_phone),
      amount: toNumber(row.amount) / 100,
      statusCode: toNumber(row.status),
      createdAt: toIso(row.created_at),
    })),
    guesses: (guessRows[0] as ShopDetailGuessRow[]).map((row) => ({
      id: toEntityId(row.id),
      title: row.title,
      statusCode: toNumber(row.status),
      endTime: toIso(row.end_time),
      betCount: toNumber(row.bet_count),
      createdAt: toIso(row.created_at),
    })),
    brandAuths: (brandAuthRows[0] as Array<{
      id: number | string;
      auth_no: string;
      brand_id: number | string;
      brand_name: string | null;
      auth_type: number | string;
      auth_scope: number | string;
      status: number | string;
      granted_at: Date | string | null;
      expire_at: Date | string | null;
    }>).map((row) => {
      const authType = mapAuthType(row.auth_type);
      const authScope = mapAuthScope(row.auth_scope);
      const status = mapAuthStatus(row.status);
      return {
        id: toEntityId(row.id),
        authNo: row.auth_no,
        brandId: toEntityId(row.brand_id),
        brandName: row.brand_name ?? '未知品牌',
        authTypeLabel: authType.label,
        authScopeLabel: authScope.label,
        status: status.key,
        statusLabel: status.label,
        grantedAt: toIso(row.granted_at),
        expireAt: toIso(row.expire_at),
      };
    }),
  };
}

export async function updateAdminShopStatus(
  shopId: string,
  payload: UpdateAdminShopStatusPayload,
): Promise<UpdateAdminShopStatusResult> {
  const targetStatus =
    payload.status === 'paused'
      ? SHOP_STATUS_PAUSED
      : payload.status === 'closed'
        ? SHOP_STATUS_CLOSED
        : SHOP_STATUS_ACTIVE;
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, status
        FROM shop
        WHERE id = ?
        LIMIT 1
      `,
      [shopId],
    );
    const shop = (rows as Array<{ id: number | string; status: number | string }>)[0];
    if (!shop) {
      throw new Error('店铺不存在');
    }

    await connection.execute(
      `
        UPDATE shop
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [targetStatus, shopId],
    );

    if (targetStatus === SHOP_STATUS_CLOSED) {
      await connection.execute(
        `
          UPDATE product
          SET status = ?, updated_at = NOW()
          WHERE shop_id = ? AND status = ?
        `,
        [PRODUCT_STATUS_OFF_SHELF, shopId, PRODUCT_STATUS_ACTIVE],
      );
    }

    await connection.commit();

    return {
      id: toEntityId(shop.id),
      status: payload.status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getAdminShopApplies() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sa.id,
        sa.apply_no,
        sa.user_id,
        sa.shop_name,
        up.name AS applicant_name,
        u.phone_number AS contact_phone,
        c.name AS category_name,
        sa.reason,
        sa.status,
        sa.reject_reason,
        sa.reviewed_at,
        sa.created_at
      FROM shop_apply sa
      LEFT JOIN user u ON u.id = sa.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN category c ON c.id = sa.category_id
      ORDER BY sa.created_at DESC, sa.id DESC
    `,
  );

  const items = (rows as ShopApplyListRow[]).map((row) => {
    const status = mapReviewStatus(row.status);
    return {
      id: String(row.id),
      applyNo: row.apply_no,
      userId: String(row.user_id),
      shopName: row.shop_name,
      applicant: buildUserDisplayName(row.applicant_name, row.contact_phone),
      contact: row.contact_phone ?? null,
      category: row.category_name ?? null,
      reason: row.reason ?? null,
      status: status.key,
      statusLabel: status.label,
      rejectReason: row.reject_reason ?? null,
      reviewedAt: toIso(row.reviewed_at),
      submittedAt: toIso(row.created_at),
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

export async function getAdminBrandAuthApplies() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sbaa.id,
        sbaa.apply_no,
        sbaa.shop_id,
        s.name AS shop_name,
        up.name AS owner_name,
        u.phone_number AS owner_phone,
        sbaa.brand_id,
        b.name AS brand_name,
        sbaa.reason,
        sbaa.license,
        sbaa.status,
        sbaa.reject_reason,
        sbaa.reviewed_at,
        sbaa.created_at
      FROM shop_brand_auth_apply sbaa
      LEFT JOIN shop s ON s.id = sbaa.shop_id
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN brand b ON b.id = sbaa.brand_id
      ORDER BY sbaa.created_at DESC, sbaa.id DESC
    `,
  );

  const items = (rows as BrandAuthApplyListRow[]).map((row) => {
    const status = mapReviewStatus(row.status);
    return {
      id: String(row.id),
      applyNo: row.apply_no,
      shopId: String(row.shop_id),
      shopName: row.shop_name ?? '未知店铺',
      ownerName: buildUserDisplayName(row.owner_name, row.owner_phone),
      ownerPhone: row.owner_phone ?? null,
      brandId: String(row.brand_id),
      brandName: row.brand_name ?? '未知品牌',
      reason: row.reason ?? null,
      license: row.license ?? null,
      status: status.key,
      statusLabel: status.label,
      rejectReason: row.reject_reason ?? null,
      reviewedAt: toIso(row.reviewed_at),
      submittedAt: toIso(row.created_at),
      scope: null as string | null,
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

export async function getAdminBrandAuthRecords() {
  const items = await listBrandAuthRecordsInternal();
  return {
    items,
    summary: {
      total: items.length,
      byStatus: summarizeByKey(items, 'status'),
    },
  };
}

export async function reviewAdminShopApply(
  applyId: string,
  payload: ReviewAdminShopApplyPayload,
): Promise<ReviewAdminShopApplyResult> {
  const status = normalizeReviewStatus(payload.status);
  const rejectReason = normalizeRejectReason(status, payload.rejectReason);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [applyRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, user_id, shop_name, category_id, status
        FROM shop_apply
        WHERE id = ?
        LIMIT 1
      `,
      [applyId],
    );
    const apply = applyRows[0] as {
      id: number | string;
      user_id: number | string;
      shop_name: string;
      category_id: number | string | null;
      status: number | string;
    } | undefined;

    if (!apply) {
      throw new Error('开店申请不存在');
    }
    ensurePendingReview(apply.status);

    if (status === 'approved') {
      const [shopRows] = await connection.execute<mysql.RowDataPacket[]>(
        `
          SELECT id
          FROM shop
          WHERE user_id = ?
          ORDER BY CASE WHEN status = ${SHOP_STATUS_ACTIVE} THEN 0 ELSE 1 END, id DESC
          LIMIT 1
        `,
        [apply.user_id],
      );
      const shop = shopRows[0] as { id?: number | string } | undefined;

      if (shop?.id) {
        await connection.execute(
          `
            UPDATE shop
            SET
              name = ?,
              category_id = ?,
              status = ?,
              updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = ?
          `,
          [apply.shop_name, apply.category_id, SHOP_STATUS_ACTIVE, shop.id],
        );
      } else {
        await connection.execute(
          `
            INSERT INTO shop (
              user_id,
              name,
              category_id,
              status,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
          `,
          [apply.user_id, apply.shop_name, apply.category_id, SHOP_STATUS_ACTIVE],
        );
      }
    }

    await connection.execute(
      `
        UPDATE shop_apply
        SET
          status = ?,
          reject_reason = ?,
          reviewed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [status === 'approved' ? STATUS_APPROVED : STATUS_REJECTED, rejectReason, applyId],
    );

    await connection.commit();
    return { id: toEntityId(apply.id), status };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createAdminBrand(
  payload: CreateAdminBrandPayload,
): Promise<CreateAdminBrandResult> {
  const name = payload.name.trim();
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

    const [categoryRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 10
        LIMIT 1
      `,
      [categoryId],
    );

    if ((categoryRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌类目不存在');
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
          category_id,
          contact_name,
          contact_phone,
          description,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        name,
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
        SELECT id
        FROM brand
        WHERE id = ?
        LIMIT 1
      `,
      [brandId],
    );

    if ((brandRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌不存在');
    }

    const [categoryRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 10
        LIMIT 1
      `,
      [categoryId],
    );

    if ((categoryRows as mysql.RowDataPacket[]).length === 0) {
      throw new Error('品牌类目不存在');
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

export async function reviewAdminBrandAuthApply(
  applyId: string,
  payload: ReviewAdminBrandAuthApplyPayload,
): Promise<ReviewAdminBrandAuthApplyResult> {
  const status = normalizeReviewStatus(payload.status);
  const rejectReason = normalizeRejectReason(status, payload.rejectReason);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [applyRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, shop_id, brand_id, status
        FROM shop_brand_auth_apply
        WHERE id = ?
        LIMIT 1
      `,
      [applyId],
    );
    const apply = applyRows[0] as {
      id: number | string;
      shop_id: number | string;
      brand_id: number | string;
      status: number | string;
    } | undefined;

    if (!apply) {
      throw new Error('品牌授权申请不存在');
    }
    ensurePendingReview(apply.status);

    if (status === 'approved') {
      const [authRows] = await connection.execute<mysql.RowDataPacket[]>(
        `
          SELECT id
          FROM shop_brand_auth
          WHERE shop_id = ?
            AND brand_id = ?
          ORDER BY CASE WHEN status = ${AUTH_STATUS_ACTIVE} THEN 0 ELSE 1 END, id DESC
          LIMIT 1
        `,
        [apply.shop_id, apply.brand_id],
      );
      const auth = authRows[0] as { id?: number | string } | undefined;

      if (auth?.id) {
        await connection.execute(
          `
            UPDATE shop_brand_auth
            SET
              auth_type = ?,
              auth_scope = ?,
              scope_value = NULL,
              status = ?,
              granted_at = CURRENT_TIMESTAMP(3),
              expire_at = NULL,
              expired_at = NULL,
              updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = ?
          `,
          [
            AUTH_TYPE_NORMAL,
            AUTH_SCOPE_ALL_BRAND,
            AUTH_STATUS_ACTIVE,
            auth.id,
          ],
        );
      } else {
        await connection.execute(
          `
            INSERT INTO shop_brand_auth (
              auth_no,
              shop_id,
              brand_id,
              auth_type,
              auth_scope,
              scope_value,
              status,
              granted_at,
              expire_at,
              expired_at,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP(3), NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
          `,
          [
            createNo('SBA'),
            apply.shop_id,
            apply.brand_id,
            AUTH_TYPE_NORMAL,
            AUTH_SCOPE_ALL_BRAND,
            AUTH_STATUS_ACTIVE,
          ],
        );
      }
    }

    await connection.execute(
      `
        UPDATE shop_brand_auth_apply
        SET
          status = ?,
          reject_reason = ?,
          reviewed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [status === 'approved' ? STATUS_APPROVED : STATUS_REJECTED, rejectReason, applyId],
    );

    await connection.commit();
    return { id: toEntityId(apply.id), status };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getAdminShopProducts() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.shop_id,
        s.name AS shop_name,
        p.brand_product_id,
        bp.brand_id,
        b.name AS brand_name,
        p.name AS product_name,
        p.price,
        p.original_price,
        p.guess_price,
        p.image_url,
        p.sales,
        p.stock,
        p.frozen_stock,
        p.status,
        p.created_at,
        p.updated_at
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      ORDER BY p.created_at DESC, p.id DESC
    `,
  );

  const items = (rows as ShopProductListRow[]).map((row) => {
    const status = mapProductStatus(row.status);
    const stock = toNumber(row.stock);
    const frozenStock = toNumber(row.frozen_stock);
    return {
      id: String(row.id),
      shopId: toId(row.shop_id),
      shopName: row.shop_name ?? '未知店铺',
      brandProductId: toId(row.brand_product_id),
      brandId: toId(row.brand_id),
      brandName: row.brand_name ?? null,
      productName: row.product_name,
      status: status.key,
      statusLabel: status.label,
      stock,
      availableStock: Math.max(0, stock - frozenStock),
      frozenStock,
      sales: toNumber(row.sales),
      price: toNumber(row.price),
      originalPrice: toNumber(row.original_price),
      guessPrice: toNumber(row.guess_price),
      imageUrl: row.image_url ?? null,
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
