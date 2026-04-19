import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type mysql from 'mysql2/promise';

import type {
  AddShopProductsResult,
  BrandAuthOverviewResult,
  BrandProductListResult,
  MyShopResult,
  PublicShopDetailResult,
  SubmitBrandAuthApplicationResult,
} from '@joy/shared';

import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';
import { getUserByToken } from '../auth/store';

export const shopRouter: ExpressRouter = Router();

const STATUS_ACTIVE = 10;
const STATUS_PENDING = 10;
const STATUS_APPROVED = 30;

function getBearerToken(authorization?: string) {
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function createNo(prefix: string) {
  return `${prefix}${randomBytes(6).toString('hex')}`;
}

type ShopRow = {
  id: number | string;
  name: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  status: number | string;
};

type BrandAuthRow = {
  id: number | string;
  brand_id: number | string;
  brand_name: string;
  status: number | string;
  created_at: Date | string;
};

type ShopProductRow = {
  id: number | string;
  name: string;
  price: number | string;
  original_price?: number | string | null;
  image_url: string | null;
  status: number | string;
  created_at?: Date | string;
  brand_name?: string | null;
};

type PublicShopGuessRow = {
  id: number | string;
  title: string;
  related_product_id: number | string | null;
};

async function requireCurrentUser(request: { headers: { authorization?: string } }) {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

async function getCurrentShop(userId: string) {
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
      LIMIT 1
    `,
    [userId],
  );
  return (rows[0] as ShopRow | undefined) ?? null;
}

async function getMyShopResult(userId: string): Promise<MyShopResult> {
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
      id: String(row.id),
      brandId: String(row.brand_id),
      brandName: row.brand_name,
      status: Number(row.status) === STATUS_APPROVED ? 'approved' : Number(row.status) === STATUS_PENDING ? 'pending' : 'rejected',
      createdAt: new Date(row.created_at).toISOString(),
    }));

    products = (productRows as ShopProductRow[]).map((row) => ({
      id: String(row.id),
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
          id: String(shop.id),
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

shopRouter.get('/me', async (request, response) => {
  try {
    const user = await requireCurrentUser(request);
    ok(response, await getMyShopResult(user.id));
  } catch (error) {
    response.status(error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500).json({
      success: false,
      message: error instanceof Error && error.message === 'UNAUTHORIZED' ? '请先登录' : '读取店铺失败',
    });
  }
});

shopRouter.get('/:id(\\d+)', async (request, response) => {
  try {
    const routeParams = request.params as Record<string, string | undefined>;
    const shopId = String(routeParams['id(\\d+)'] ?? routeParams.id ?? '').trim();
    const db = getDbPool();
    const [shopRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          s.id,
          s.name,
          c.name AS category,
          s.description,
          s.logo_url,
          s.status,
          NULL AS city,
          COALESCE((SELECT COUNT(*) FROM user_follow uf WHERE uf.following_id = s.user_id), 0) AS fans,
          COALESCE((SELECT COUNT(*) FROM product p WHERE p.shop_id = s.id), 0) AS product_count,
          COALESCE((SELECT COUNT(*) FROM fulfillment_order fo WHERE fo.shop_id = s.id), 0) AS total_sales,
          COALESCE((SELECT COUNT(*) FROM shop_brand_auth sba WHERE sba.shop_id = s.id AND sba.status = ?), 0) AS brand_auth_count
        FROM shop s
        LEFT JOIN category c ON c.id = s.category_id
        WHERE s.id = ?
        LIMIT 1
      `,
      [STATUS_ACTIVE, shopId],
    );

    const shop = (shopRows[0] as (ShopRow & {
      city?: string | null;
      fans?: number | string;
      product_count?: number | string;
      total_sales?: number | string;
      brand_auth_count?: number | string;
    }) | undefined) ?? null;

    if (!shop) {
      response.status(404).json({ success: false, message: '店铺不存在' });
      return;
    }

    const [productRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          p.id,
          p.name,
          p.price,
          p.original_price,
          p.image_url,
          p.status,
          p.created_at,
          b.name AS brand_name
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        WHERE p.shop_id = ?
        ORDER BY p.created_at DESC, p.id DESC
      `,
      [shop.id],
    );

    const [guessRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          g.id,
          g.title,
          gp.product_id AS related_product_id
        FROM guess g
        INNER JOIN guess_product gp ON gp.guess_id = g.id
        INNER JOIN product p ON p.id = gp.product_id
        WHERE p.shop_id = ?
          AND g.status = 30
          AND g.review_status = 30
        ORDER BY g.created_at DESC, g.id DESC
        LIMIT 8
      `,
      [shop.id],
    );

    const guessIds = (guessRows as PublicShopGuessRow[]).map((row) => row.id);
    let voteRows: Array<{ guess_id: number | string; choice_idx: number | string; vote_count: number | string }> = [];
    let optionRows: Array<{ guess_id: number | string; option_index: number | string; option_text: string }> = [];
    if (guessIds.length > 0) {
      const [votes] = await db.query<mysql.RowDataPacket[]>(
        `
          SELECT guess_id, choice_idx, COUNT(*) AS vote_count
          FROM guess_bet
          WHERE guess_id IN (?)
          GROUP BY guess_id, choice_idx
        `,
        [guessIds],
      );
      voteRows = votes as Array<{ guess_id: number | string; choice_idx: number | string; vote_count: number | string }>;

      const [options] = await db.query<mysql.RowDataPacket[]>(
        `
          SELECT guess_id, option_index, option_text
          FROM guess_option
          WHERE guess_id IN (?)
          ORDER BY guess_id ASC, option_index ASC
        `,
        [guessIds],
      );
      optionRows = options as Array<{ guess_id: number | string; option_index: number | string; option_text: string }>;
    }

    const result: PublicShopDetailResult = {
      shop: {
        id: String(shop.id),
        name: shop.name,
        category: shop.category,
        description: shop.description,
        logo: shop.logo_url,
        status: Number(shop.status) === STATUS_ACTIVE ? 'active' : String(shop.status),
        city: shop.city ?? null,
        fans: Number(shop.fans ?? 0),
        productCount: Number(shop.product_count ?? 0),
        totalSales: Number(shop.total_sales ?? 0),
        avgRating: 4.8,
        brandAuthCount: Number(shop.brand_auth_count ?? 0),
      },
      products: (productRows as ShopProductRow[]).map((row, index) => ({
        id: String(row.id),
        name: row.name,
        price: Number(row.price ?? 0) / 100,
        originalPrice: Number(row.original_price ?? row.price ?? 0) / 100,
        sales: Math.max(0, 1200 - index * 97),
        rating: 4.7 + ((index % 3) * 0.1),
        brand: row.brand_name ?? null,
        img: row.image_url ?? null,
        badge: index === 0 ? '热销' : index < 3 ? '品牌' : '新品',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      })),
      guesses: (guessRows as PublicShopGuessRow[]).map((row) => {
        const options = optionRows
          .filter((item) => String(item.guess_id) === String(row.id))
          .sort((left, right) => Number(left.option_index) - Number(right.option_index));
        const votes = options.map((option) => {
          const vote = voteRows.find(
            (item) => String(item.guess_id) === String(row.id) && Number(item.choice_idx) === Number(option.option_index),
          );
          return Number(vote?.vote_count ?? 0);
        });
        const totalVotes = votes.reduce((sum, value) => sum + value, 0);
        return {
          id: String(row.id),
          title: row.title,
          votes: votes.map((value) => (totalVotes > 0 ? Math.round((value / totalVotes) * 100) : 0)),
          options: options.map((item) => item.option_text),
          relatedProductId: row.related_product_id ? String(row.related_product_id) : null,
        };
      }),
    };

    ok(response, result);
  } catch {
    response.status(500).json({ success: false, message: '读取店铺详情失败' });
  }
});

shopRouter.get('/brand-auth', async (request, response) => {
  try {
    const user = await requireCurrentUser(request);
    const db = getDbPool();
    const shop = await getCurrentShop(user.id);

    let mine: BrandAuthOverviewResult['mine'] = [];
    let available: BrandAuthOverviewResult['available'] = [];

    if (shop) {
      const [mineRows] = await db.execute<mysql.RowDataPacket[]>(
        `
          SELECT sbaa.id, sbaa.brand_id, b.name AS brand_name, sbaa.status, sbaa.created_at
          FROM shop_brand_auth_apply sbaa
          INNER JOIN brand b ON b.id = sbaa.brand_id
          WHERE sbaa.shop_id = ?
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
            ) AS current_status
          FROM brand b
          LEFT JOIN category c ON c.id = b.category_id
          WHERE b.status = 10
          ORDER BY b.name ASC
        `,
        [shop.id],
      );

      mine = (mineRows as BrandAuthRow[]).map((row) => ({
        id: String(row.id),
        brandId: String(row.brand_id),
        brandName: row.brand_name,
        status: Number(row.status) === STATUS_APPROVED ? 'approved' : Number(row.status) === STATUS_PENDING ? 'pending' : 'rejected',
        createdAt: new Date(row.created_at).toISOString(),
      }));

      available = (brandRows as Array<{ id: number; name: string; logo_url: string | null; category: string | null; product_count: number | string; current_status: number | string | null }>).map((row) => ({
        id: String(row.id),
        name: row.name,
        logo: row.logo_url ?? null,
        category: row.category ?? null,
        productCount: Number(row.product_count ?? 0),
        status:
          row.current_status === null
            ? 'idle'
            : Number(row.current_status) === STATUS_APPROVED
              ? 'approved'
              : Number(row.current_status) === STATUS_PENDING
                ? 'pending'
                : 'rejected',
      }));
    }

    ok(response, {
      shopName: shop?.name ?? null,
      mine,
      available,
    });
  } catch (error) {
    response.status(error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500).json({
      success: false,
      message: error instanceof Error && error.message === 'UNAUTHORIZED' ? '请先登录' : '读取品牌授权失败',
    });
  }
});

shopRouter.post('/brand-auth', async (request, response) => {
  try {
    const user = await requireCurrentUser(request);
    const shop = await getCurrentShop(user.id);
    if (!shop) {
      response.status(400).json({ success: false, message: '请先创建店铺' });
      return;
    }

    const brandId = typeof request.body?.brandId === 'string' ? request.body.brandId.trim() : '';
    const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim() : '';
    const license = typeof request.body?.license === 'string' ? request.body.license.trim() : '';

    if (!brandId) {
      response.status(400).json({ success: false, message: '请选择品牌' });
      return;
    }
    if (!reason) {
      response.status(400).json({ success: false, message: '请填写申请说明' });
      return;
    }

    const db = getDbPool();
    const [existingRows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT status
        FROM shop_brand_auth_apply
        WHERE shop_id = ?
          AND brand_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [shop.id, brandId],
    );
    const existing = existingRows[0] as { status?: number | string } | undefined;
    if (existing && [STATUS_PENDING, STATUS_APPROVED].includes(Number(existing.status))) {
      response.status(400).json({ success: false, message: Number(existing.status) === STATUS_APPROVED ? '该品牌已授权' : '该品牌已在审核中' });
      return;
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
      [createNo('BA'), shop.id, brandId, reason, license || null, STATUS_PENDING],
    );

    const payload: SubmitBrandAuthApplicationResult = { id: String(result.insertId), status: 'pending' };
    ok(response, payload);
  } catch (error) {
    response.status(error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500).json({
      success: false,
      message: error instanceof Error && error.message === 'UNAUTHORIZED' ? '请先登录' : '提交品牌授权失败',
    });
  }
});

shopRouter.get('/brand-products', async (request, response) => {
  try {
    const user = await requireCurrentUser(request);
    const brandId = typeof request.query.brandId === 'string' ? request.query.brandId.trim() : '';
    if (!brandId) {
      response.status(400).json({ success: false, message: '缺少 brandId' });
      return;
    }
    const shop = await getCurrentShop(user.id);
    if (!shop) {
      response.status(400).json({ success: false, message: '请先创建店铺' });
      return;
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
      response.status(403).json({ success: false, message: '该品牌尚未授权' });
      return;
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
      id: String(row.id),
      brandId: String(row.brand_id),
      brandName: row.brand_name,
      name: row.name,
      category: row.category,
      guidePrice: Number(row.guide_price ?? 0) / 100,
      supplyPrice: Number(row.supply_price ?? 0) / 100,
      defaultImg: row.default_img ?? null,
      status: Number(row.status) === STATUS_ACTIVE ? 'active' : String(row.status),
    }));

    ok(response, { items });
  } catch (error) {
    response.status(error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500).json({
      success: false,
      message: error instanceof Error && error.message === 'UNAUTHORIZED' ? '请先登录' : '读取品牌商品失败',
    });
  }
});

shopRouter.post('/products', async (request, response) => {
  try {
    const user = await requireCurrentUser(request);
    const brandId = typeof request.body?.brandId === 'string' ? request.body.brandId.trim() : '';
    const brandProductIds = Array.isArray(request.body?.brandProductIds)
      ? request.body.brandProductIds.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    if (!brandId || brandProductIds.length === 0) {
      response.status(400).json({ success: false, message: '请选择品牌和商品' });
      return;
    }

    const shop = await getCurrentShop(user.id);
    if (!shop) {
      response.status(400).json({ success: false, message: '请先创建店铺' });
      return;
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
      response.status(403).json({ success: false, message: '该品牌尚未授权' });
      return;
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

    const result: AddShopProductsResult = { count: products.length };
    ok(response, result);
  } catch (error) {
    response.status(error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500).json({
      success: false,
      message: error instanceof Error && error.message === 'UNAUTHORIZED' ? '请先登录' : '上架商品失败',
    });
  }
});
