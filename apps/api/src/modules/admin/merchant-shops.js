import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { AUTH_STATUS_ACTIVE, BRAND_STATUS_DISABLED, buildUserDisplayName, ensurePendingReview, mapAuthScope, mapAuthStatus, mapAuthType, mapProductStatus, mapReviewStatus, mapShopStatus, normalizeRejectReason, normalizeReviewStatus, PRODUCT_STATUS_ACTIVE, PRODUCT_STATUS_DISABLED, PRODUCT_STATUS_OFF_SHELF, SHOP_STATUS_ACTIVE, SHOP_STATUS_CLOSED, SHOP_STATUS_PAUSED, STATUS_APPROVED, STATUS_REJECTED, summarizeByKey, toId, toIso, toNumber, } from './merchant-shared';
export async function getAdminShops() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [AUTH_STATUS_ACTIVE]);
    const items = rows.map((row) => {
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
export async function getAdminShopDetail(shopId) {
    const db = getDbPool();
    const [shopRows] = await db.execute(`
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
    `, [AUTH_STATUS_ACTIVE, shopId]);
    const shop = shopRows[0];
    if (!shop) {
        return null;
    }
    const [productRows, orderRows, guessRows, brandAuthRows] = await Promise.all([
        db.execute(`
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
      `, [shopId]),
        db.execute(`
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
      `, [shopId]),
        db.execute(`
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
      `, [shopId]),
        db.execute(`
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
      `, [shopId]),
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
        products: productRows[0].map((row) => {
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
        orders: orderRows[0].map((row) => ({
            id: toEntityId(row.id),
            orderNo: row.order_sn,
            buyerName: buildUserDisplayName(row.buyer_name, row.buyer_phone),
            amount: toNumber(row.amount) / 100,
            statusCode: toNumber(row.status),
            createdAt: toIso(row.created_at),
        })),
        guesses: guessRows[0].map((row) => ({
            id: toEntityId(row.id),
            title: row.title,
            statusCode: toNumber(row.status),
            endTime: toIso(row.end_time),
            betCount: toNumber(row.bet_count),
            createdAt: toIso(row.created_at),
        })),
        brandAuths: brandAuthRows[0].map((row) => {
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
export async function updateAdminShopStatus(shopId, payload) {
    const targetStatus = payload.status === 'paused'
        ? SHOP_STATUS_PAUSED
        : payload.status === 'closed'
            ? SHOP_STATUS_CLOSED
            : SHOP_STATUS_ACTIVE;
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`
        SELECT id, status
        FROM shop
        WHERE id = ?
        LIMIT 1
      `, [shopId]);
        const shop = rows[0];
        if (!shop) {
            throw new Error('店铺不存在');
        }
        await connection.execute(`
        UPDATE shop
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `, [targetStatus, shopId]);
        if (targetStatus === SHOP_STATUS_CLOSED) {
            await connection.execute(`
          UPDATE product
          SET status = ?, updated_at = NOW()
          WHERE shop_id = ? AND status = ?
        `, [PRODUCT_STATUS_OFF_SHELF, shopId, PRODUCT_STATUS_ACTIVE]);
        }
        await connection.commit();
        return {
            id: toEntityId(shop.id),
            status: payload.status,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getAdminShopApplies() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `);
    const items = rows.map((row) => {
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
export async function reviewAdminShopApply(applyId, payload) {
    const status = normalizeReviewStatus(payload.status);
    const rejectReason = normalizeRejectReason(status, payload.rejectReason);
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [applyRows] = await connection.execute(`
        SELECT id, user_id, shop_name, category_id, status
        FROM shop_apply
        WHERE id = ?
        LIMIT 1
      `, [applyId]);
        const apply = applyRows[0];
        if (!apply) {
            throw new Error('开店申请不存在');
        }
        ensurePendingReview(apply.status);
        if (status === 'approved') {
            const [shopRows] = await connection.execute(`
          SELECT id
          FROM shop
          WHERE user_id = ?
          ORDER BY CASE WHEN status = ${SHOP_STATUS_ACTIVE} THEN 0 ELSE 1 END, id DESC
          LIMIT 1
        `, [apply.user_id]);
            const shop = shopRows[0];
            if (shop?.id) {
                await connection.execute(`
            UPDATE shop
            SET
              name = ?,
              category_id = ?,
              status = ?,
              updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = ?
          `, [apply.shop_name, apply.category_id, SHOP_STATUS_ACTIVE, shop.id]);
            }
            else {
                await connection.execute(`
            INSERT INTO shop (
              user_id,
              name,
              category_id,
              status,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
          `, [apply.user_id, apply.shop_name, apply.category_id, SHOP_STATUS_ACTIVE]);
            }
        }
        await connection.execute(`
        UPDATE shop_apply
        SET
          status = ?,
          reject_reason = ?,
          reviewed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [status === 'approved' ? STATUS_APPROVED : STATUS_REJECTED, rejectReason, applyId]);
        await connection.commit();
        return { id: toEntityId(apply.id), status };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getAdminShopProducts() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `);
    const items = rows.map((row) => {
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
function normalizeAdminShopProductStatus(status) {
    return status === 'off_shelf' ? PRODUCT_STATUS_OFF_SHELF : PRODUCT_STATUS_ACTIVE;
}
export async function updateAdminShopProductStatus(productId, payload) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        p.id,
        p.status,
        s.status AS shop_status,
        b.status AS brand_status,
        bp.status AS brand_product_status
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE p.id = ?
      LIMIT 1
    `, [productId]);
    const product = rows[0];
    if (!product) {
        throw new Error('店铺商品不存在');
    }
    const currentStatus = toNumber(product.status);
    const nextStatus = normalizeAdminShopProductStatus(payload.status);
    if (currentStatus === PRODUCT_STATUS_DISABLED) {
        throw new Error('不可售商品不支持直接上下架');
    }
    if (nextStatus === PRODUCT_STATUS_ACTIVE) {
        if (toNumber(product.shop_status) !== SHOP_STATUS_ACTIVE) {
            throw new Error('店铺未处于营业中，不能上架商品');
        }
        if (toNumber(product.brand_status) === BRAND_STATUS_DISABLED) {
            throw new Error('品牌不可用，不能上架商品');
        }
        if (toNumber(product.brand_product_status) === PRODUCT_STATUS_DISABLED) {
            throw new Error('品牌商品不可用，不能上架商品');
        }
    }
    if (currentStatus !== nextStatus) {
        await db.execute(`
        UPDATE product
        SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [nextStatus, productId]);
    }
    return {
        id: toEntityId(product.id),
        status: payload.status,
    };
}
