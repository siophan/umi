import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { toEntityId, toOptionalEntityId, } from '@umi/shared';
import { getRequestUser, requireUser } from '../../lib/auth';
import { getDbPool } from '../../lib/db';
import { HttpError, sendError, toHttpError } from '../../lib/errors';
import { ok } from '../../lib/http';
export const shopRouter = Router();
const STATUS_ACTIVE = 10;
const STATUS_PENDING = 10;
const STATUS_APPROVED = 30;
function createNo(prefix) {
    return `${prefix}${randomBytes(6).toString('hex')}`;
}
async function getCurrentShop(userId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [userId]);
    return rows[0] ?? null;
}
async function getLatestShopApplication(userId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [userId]);
    return rows[0] ?? null;
}
async function listShopCategories() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id, name
      FROM category
      WHERE biz_type = 20
        AND status = 10
      ORDER BY sort ASC, id ASC
    `);
    return rows.map((row) => ({
        id: toEntityId(row.id),
        name: row.name,
    }));
}
function mapApplicationStatus(status) {
    if (status === STATUS_APPROVED) {
        return 'approved';
    }
    if (status === STATUS_PENDING) {
        return 'pending';
    }
    return 'rejected';
}
function toShopStatusResult(shop, latestApplication, categories) {
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
async function getMyShopResult(userId) {
    const db = getDbPool();
    const shop = await getCurrentShop(userId);
    let brandAuths = [];
    let products = [];
    let productCount = 0;
    let orderCount = 0;
    let revenue = 0;
    if (shop) {
        const [brandRows] = await db.execute(`
        SELECT sbaa.id,
               sbaa.brand_id,
               b.name AS brand_name,
               sbaa.status,
               sbaa.created_at
        FROM shop_brand_auth_apply sbaa
        INNER JOIN brand b ON b.id = sbaa.brand_id
        WHERE sbaa.shop_id = ?
        ORDER BY sbaa.created_at DESC
      `, [shop.id]);
        const [productRows] = await db.execute(`
        SELECT id, name, price, image_url, status
        FROM product
        WHERE shop_id = ?
        ORDER BY created_at DESC
      `, [shop.id]);
        const [statsRows] = await db.execute(`
        SELECT
          (SELECT COUNT(*) FROM product p WHERE p.shop_id = ?) AS product_count,
          (SELECT COUNT(*) FROM fulfillment_order fo WHERE fo.shop_id = ?) AS order_count,
          (SELECT COALESCE(SUM(fo.total_amount), 0) FROM fulfillment_order fo WHERE fo.shop_id = ?) AS revenue
      `, [shop.id, shop.id, shop.id]);
        const stats = statsRows[0];
        productCount = Number(stats?.product_count ?? 0);
        orderCount = Number(stats?.order_count ?? 0);
        revenue = Number(stats?.revenue ?? 0);
        brandAuths = brandRows.map((row) => ({
            id: toEntityId(row.id),
            brandId: toEntityId(row.brand_id),
            brandName: row.brand_name,
            status: Number(row.status) === STATUS_APPROVED ? 'approved' : Number(row.status) === STATUS_PENDING ? 'pending' : 'rejected',
            createdAt: new Date(row.created_at).toISOString(),
        }));
        products = productRows.map((row) => ({
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
shopRouter.get('/me', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await getMyShopResult(user.id));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_READ_FAILED',
            message: '读取店铺失败',
        }));
    }
});
shopRouter.get('/me/status', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const [shop, latestApplication, categories] = await Promise.all([
            getCurrentShop(user.id),
            getLatestShopApplication(user.id),
            listShopCategories(),
        ]);
        ok(response, toShopStatusResult(shop, latestApplication, categories));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_STATUS_READ_FAILED',
            message: '读取开店状态失败',
        }));
    }
});
shopRouter.post('/apply', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const shopName = typeof request.body?.shopName === 'string' ? request.body.shopName.trim() : '';
        const categoryId = typeof request.body?.categoryId === 'string' ? request.body.categoryId.trim() : '';
        const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim() : '';
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
            getCurrentShop(user.id),
            getLatestShopApplication(user.id),
            db.execute(`
          SELECT id
          FROM category
          WHERE id = ?
            AND biz_type = 20
            AND status = 10
          LIMIT 1
        `, [categoryId]),
        ]);
        if (shop && Number(shop.status) === STATUS_ACTIVE) {
            throw new HttpError(400, 'SHOP_ALREADY_ACTIVE', '你已开通店铺');
        }
        if (latestApplication && Number(latestApplication.status) === STATUS_PENDING) {
            throw new HttpError(400, 'SHOP_APPLICATION_PENDING', '当前已有开店申请在审核中');
        }
        const category = categoryRows[0][0];
        if (!category?.id) {
            throw new HttpError(400, 'SHOP_CATEGORY_NOT_FOUND', '经营分类不存在');
        }
        const applyNo = createNo('SA');
        const [result] = await db.execute(`
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
      `, [applyNo, user.id, shopName, categoryId, reason, STATUS_PENDING]);
        const payload = {
            id: toEntityId(result.insertId),
            applyNo,
            status: 'pending',
        };
        ok(response, payload);
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_APPLY_FAILED',
            message: '提交开店申请失败',
        }));
    }
});
shopRouter.get('/:id(\\d+)', async (request, response) => {
    try {
        const routeParams = request.params;
        const shopId = String(routeParams['id(\\d+)'] ?? routeParams.id ?? '').trim();
        const db = getDbPool();
        const [shopRows] = await db.execute(`
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
      `, [STATUS_ACTIVE, shopId]);
        const shop = shopRows[0] ?? null;
        if (!shop) {
            throw new HttpError(404, 'SHOP_NOT_FOUND', '店铺不存在');
        }
        const [productRows] = await db.execute(`
        SELECT
          p.id,
          p.name,
          p.price,
          p.original_price,
          p.image_url,
          p.sales,
          p.rating,
          p.status,
          p.created_at,
          b.name AS brand_name
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        WHERE p.shop_id = ?
        ORDER BY p.created_at DESC, p.id DESC
      `, [shop.id]);
        const [guessRows] = await db.execute(`
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
      `, [shop.id]);
        const guessIds = guessRows.map((row) => row.id);
        let voteRows = [];
        let optionRows = [];
        if (guessIds.length > 0) {
            const [votes] = await db.query(`
          SELECT guess_id, choice_idx, COUNT(*) AS vote_count
          FROM guess_bet
          WHERE guess_id IN (?)
          GROUP BY guess_id, choice_idx
        `, [guessIds]);
            voteRows = votes;
            const [options] = await db.query(`
          SELECT guess_id, option_index, option_text
          FROM guess_option
          WHERE guess_id IN (?)
          ORDER BY guess_id ASC, option_index ASC
        `, [guessIds]);
            optionRows = options;
        }
        const productItems = productRows.map((row) => ({
            id: toEntityId(row.id),
            name: row.name,
            price: Number(row.price ?? 0) / 100,
            originalPrice: Number(row.original_price ?? row.price ?? 0) / 100,
            sales: Number(row.sales ?? 0),
            rating: Number(row.rating ?? 0),
            brand: row.brand_name ?? null,
            img: row.image_url ?? null,
            badge: '',
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        }));
        const ratedProducts = productItems.filter((item) => item.rating > 0);
        const avgRating = ratedProducts.length > 0
            ? Number((ratedProducts.reduce((sum, item) => sum + item.rating, 0) /
                ratedProducts.length).toFixed(1))
            : 0;
        const result = {
            shop: {
                id: toEntityId(shop.id),
                name: shop.name,
                category: shop.category,
                description: shop.description,
                logo: shop.logo_url,
                status: Number(shop.status) === STATUS_ACTIVE ? 'active' : String(shop.status),
                city: shop.city ?? null,
                fans: Number(shop.fans ?? 0),
                productCount: Number(shop.product_count ?? 0),
                totalSales: Number(shop.total_sales ?? 0),
                avgRating,
                brandAuthCount: Number(shop.brand_auth_count ?? 0),
            },
            products: productItems,
            guesses: guessRows.map((row) => {
                const options = optionRows
                    .filter((item) => String(item.guess_id) === String(row.id))
                    .sort((left, right) => Number(left.option_index) - Number(right.option_index));
                const votes = options.map((option) => {
                    const vote = voteRows.find((item) => String(item.guess_id) === String(row.id) && Number(item.choice_idx) === Number(option.option_index));
                    return Number(vote?.vote_count ?? 0);
                });
                const totalVotes = votes.reduce((sum, value) => sum + value, 0);
                return {
                    id: toEntityId(row.id),
                    title: row.title,
                    votes: votes.map((value) => (totalVotes > 0 ? Math.round((value / totalVotes) * 100) : 0)),
                    options: options.map((item) => item.option_text),
                    relatedProductId: toOptionalEntityId(row.related_product_id),
                };
            }),
        };
        ok(response, result);
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_DETAIL_READ_FAILED',
            message: '读取店铺详情失败',
        }));
    }
});
shopRouter.get('/brand-auth', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const db = getDbPool();
        const shop = await getCurrentShop(user.id);
        let mine = [];
        let available = [];
        if (shop) {
            const [mineRows] = await db.execute(`
          SELECT sbaa.id, sbaa.brand_id, b.name AS brand_name, sbaa.status, sbaa.created_at
          FROM shop_brand_auth_apply sbaa
          INNER JOIN brand b ON b.id = sbaa.brand_id
          WHERE sbaa.shop_id = ?
          ORDER BY sbaa.created_at DESC
        `, [shop.id]);
            const [brandRows] = await db.execute(`
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
        `, [shop.id]);
            mine = mineRows.map((row) => ({
                id: toEntityId(row.id),
                brandId: toEntityId(row.brand_id),
                brandName: row.brand_name,
                status: Number(row.status) === STATUS_APPROVED ? 'approved' : Number(row.status) === STATUS_PENDING ? 'pending' : 'rejected',
                createdAt: new Date(row.created_at).toISOString(),
            }));
            available = brandRows.map((row) => ({
                id: toEntityId(row.id),
                name: row.name,
                logo: row.logo_url ?? null,
                category: row.category ?? null,
                productCount: Number(row.product_count ?? 0),
                status: row.current_status === null
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
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_BRAND_AUTH_READ_FAILED',
            message: '读取品牌授权失败',
        }));
    }
});
shopRouter.post('/brand-auth', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const shop = await getCurrentShop(user.id);
        if (!shop) {
            throw new HttpError(400, 'SHOP_REQUIRED', '请先创建店铺');
        }
        const brandId = typeof request.body?.brandId === 'string' ? request.body.brandId.trim() : '';
        const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim() : '';
        const license = typeof request.body?.license === 'string' ? request.body.license.trim() : '';
        if (!brandId) {
            throw new HttpError(400, 'SHOP_BRAND_REQUIRED', '请选择品牌');
        }
        if (!reason) {
            throw new HttpError(400, 'SHOP_BRAND_AUTH_REASON_REQUIRED', '请填写申请说明');
        }
        const db = getDbPool();
        const [existingRows] = await db.execute(`
        SELECT status
        FROM shop_brand_auth_apply
        WHERE shop_id = ?
          AND brand_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [shop.id, brandId]);
        const existing = existingRows[0];
        if (existing && [STATUS_PENDING, STATUS_APPROVED].includes(Number(existing.status))) {
            throw new HttpError(400, Number(existing.status) === STATUS_APPROVED
                ? 'SHOP_BRAND_AUTH_ALREADY_APPROVED'
                : 'SHOP_BRAND_AUTH_PENDING', Number(existing.status) === STATUS_APPROVED
                ? '该品牌已授权'
                : '该品牌已在审核中');
        }
        const [result] = await db.execute(`
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
      `, [createNo('BA'), shop.id, brandId, reason, license || null, STATUS_PENDING]);
        const payload = { id: toEntityId(result.insertId), status: 'pending' };
        ok(response, payload);
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_BRAND_AUTH_SUBMIT_FAILED',
            message: '提交品牌授权失败',
        }));
    }
});
shopRouter.get('/brand-products', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const brandId = typeof request.query.brandId === 'string' ? request.query.brandId.trim() : '';
        if (!brandId) {
            throw new HttpError(400, 'SHOP_BRAND_ID_REQUIRED', '缺少 brandId');
        }
        const shop = await getCurrentShop(user.id);
        if (!shop) {
            throw new HttpError(400, 'SHOP_REQUIRED', '请先创建店铺');
        }
        const db = getDbPool();
        const [authRows] = await db.execute(`
        SELECT id
        FROM shop_brand_auth
        WHERE shop_id = ?
          AND brand_id = ?
          AND status = ?
        LIMIT 1
      `, [shop.id, brandId, STATUS_ACTIVE]);
        if (!authRows[0]) {
            throw new HttpError(403, 'SHOP_BRAND_AUTH_REQUIRED', '该品牌尚未授权');
        }
        const [rows] = await db.execute(`
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
      `, [brandId, STATUS_ACTIVE]);
        const items = rows.map((row) => ({
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
        ok(response, { items });
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_BRAND_PRODUCTS_READ_FAILED',
            message: '读取品牌商品失败',
        }));
    }
});
shopRouter.post('/products', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const brandId = typeof request.body?.brandId === 'string' ? request.body.brandId.trim() : '';
        const brandProductIds = Array.isArray(request.body?.brandProductIds)
            ? request.body.brandProductIds.filter((item) => typeof item === 'string' && item.trim().length > 0)
            : [];
        if (!brandId || brandProductIds.length === 0) {
            throw new HttpError(400, 'SHOP_PRODUCTS_SELECTION_REQUIRED', '请选择品牌和商品');
        }
        const shop = await getCurrentShop(user.id);
        if (!shop) {
            throw new HttpError(400, 'SHOP_REQUIRED', '请先创建店铺');
        }
        const db = getDbPool();
        const [authRows] = await db.execute(`
        SELECT id
        FROM shop_brand_auth
        WHERE shop_id = ?
          AND brand_id = ?
          AND status = ?
        LIMIT 1
      `, [shop.id, brandId, STATUS_ACTIVE]);
        if (!authRows[0]) {
            throw new HttpError(403, 'SHOP_BRAND_AUTH_REQUIRED', '该品牌尚未授权');
        }
        const [rows] = await db.query(`
        SELECT id, name, default_img, guide_price
        FROM brand_product
        WHERE brand_id = ?
          AND id IN (?)
          AND status = ?
      `, [brandId, brandProductIds, STATUS_ACTIVE]);
        const products = rows;
        for (const product of products) {
            await db.execute(`
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
        `, [shop.id, product.id, product.name, product.guide_price, product.guide_price, product.default_img, STATUS_ACTIVE]);
        }
        const result = { count: products.length };
        ok(response, result);
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_PRODUCTS_ADD_FAILED',
            message: '上架商品失败',
        }));
    }
});
