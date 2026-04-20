import { randomBytes } from 'node:crypto';
import { toEntityId } from '@umi/shared';
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
function createNo(prefix) {
    return `${prefix}${randomBytes(6).toString('hex')}`;
}
function toId(value) {
    return value == null ? null : String(value);
}
function toNumber(value) {
    return Number(value ?? 0);
}
function toIso(value) {
    return value ? new Date(value).toISOString() : null;
}
function parseJsonValue(value) {
    if (value == null) {
        return null;
    }
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
}
function collectScopeEntityIds(scopeValue) {
    const ids = new Set();
    function visit(value) {
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
            const record = value;
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
function buildUserDisplayName(name, phone) {
    if (name?.trim()) {
        return name.trim();
    }
    if (phone?.trim()) {
        return `用户${phone.trim().slice(-4)}`;
    }
    return '未知用户';
}
function mapReviewStatus(code) {
    const value = Number(code ?? 0);
    if (value === STATUS_APPROVED) {
        return { code: value, key: 'approved', label: '已通过' };
    }
    if (value === STATUS_REJECTED) {
        return { code: value, key: 'rejected', label: '已拒绝' };
    }
    return { code: value, key: 'pending', label: '待审核' };
}
function mapShopStatus(code) {
    const value = Number(code ?? 0);
    if (value === SHOP_STATUS_PAUSED) {
        return { code: value, key: 'paused', label: '暂停营业' };
    }
    if (value === SHOP_STATUS_CLOSED) {
        return { code: value, key: 'closed', label: '已关闭' };
    }
    return { code: value, key: 'active', label: '营业中' };
}
function mapBrandStatus(code) {
    const value = Number(code ?? 0);
    if (value === BRAND_STATUS_DISABLED) {
        return { code: value, key: 'disabled', label: '停用' };
    }
    return { code: value, key: 'active', label: '合作中' };
}
function mapProductStatus(code) {
    const value = Number(code ?? 0);
    if (value === PRODUCT_STATUS_OFF_SHELF) {
        return { code: value, key: 'off_shelf', label: '已下架' };
    }
    if (value === PRODUCT_STATUS_DISABLED) {
        return { code: value, key: 'disabled', label: '不可售' };
    }
    return { code: value, key: 'active', label: '在售' };
}
function mapAuthStatus(code) {
    const value = Number(code ?? 0);
    if (value === AUTH_STATUS_EXPIRED) {
        return { code: value, key: 'expired', label: '已过期' };
    }
    if (value === AUTH_STATUS_REVOKED) {
        return { code: value, key: 'revoked', label: '已撤销' };
    }
    return { code: value, key: 'active', label: '生效中' };
}
function mapAuthType(code) {
    const value = Number(code ?? 0);
    if (value === AUTH_TYPE_EXCLUSIVE) {
        return { code: value, key: 'exclusive', label: '独家授权' };
    }
    if (value === AUTH_TYPE_TRIAL) {
        return { code: value, key: 'trial', label: '试用授权' };
    }
    return { code: value, key: 'normal', label: '普通授权' };
}
function mapAuthScope(code) {
    const value = Number(code ?? 0);
    if (value === AUTH_SCOPE_CATEGORY_ONLY) {
        return { code: value, key: 'category_only', label: '指定类目授权' };
    }
    if (value === AUTH_SCOPE_PRODUCT_ONLY) {
        return { code: value, key: 'product_only', label: '指定商品授权' };
    }
    return { code: value, key: 'all_brand', label: '全品牌授权' };
}
function summarizeByKey(items, key) {
    const counts = new Map();
    for (const item of items) {
        const value = String(item[key] ?? '');
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Object.fromEntries(counts);
}
function normalizeReviewStatus(status) {
    if (status === 'approved' || status === 'rejected') {
        return status;
    }
    throw new Error('审核状态不合法');
}
function normalizeRejectReason(status, rejectReason) {
    const value = rejectReason?.trim() ?? '';
    if (status === 'rejected' && !value) {
        throw new Error('请填写拒绝原因');
    }
    return value ? value.slice(0, 200) : null;
}
function ensurePendingReview(status) {
    if (Number(status ?? 0) !== STATUS_PENDING) {
        throw new Error('申请已审核');
    }
}
function normalizeBrandStatus(status) {
    if (status === 'disabled') {
        return BRAND_STATUS_DISABLED;
    }
    return BRAND_STATUS_ACTIVE;
}
async function listBrandAuthRecordsInternal() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `);
    return rows.map((row) => {
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
            operatorName: null,
        };
    });
}
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
export async function getAdminBrandAuthApplies() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `);
    const items = rows.map((row) => {
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
            scope: null,
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
export async function createAdminBrand(payload) {
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
        const [categoryRows] = await connection.execute(`
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 10
        LIMIT 1
      `, [categoryId]);
        if (categoryRows.length === 0) {
            throw new Error('品牌类目不存在');
        }
        const [duplicateRows] = await connection.execute(`
        SELECT id
        FROM brand
        WHERE name = ?
        LIMIT 1
      `, [name]);
        if (duplicateRows.length > 0) {
            throw new Error('品牌名称已存在');
        }
        const [result] = await connection.execute(`
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
      `, [
            name,
            categoryId,
            contactName,
            contactPhone,
            description,
            normalizeBrandStatus(payload.status),
        ]);
        await connection.commit();
        return { id: toEntityId(result.insertId) };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function updateAdminBrand(brandId, payload) {
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
        const [brandRows] = await connection.execute(`
        SELECT id
        FROM brand
        WHERE id = ?
        LIMIT 1
      `, [brandId]);
        if (brandRows.length === 0) {
            throw new Error('品牌不存在');
        }
        const [categoryRows] = await connection.execute(`
        SELECT id
        FROM category
        WHERE id = ?
          AND biz_type = 10
        LIMIT 1
      `, [categoryId]);
        if (categoryRows.length === 0) {
            throw new Error('品牌类目不存在');
        }
        const [duplicateRows] = await connection.execute(`
        SELECT id
        FROM brand
        WHERE name = ?
          AND id <> ?
        LIMIT 1
      `, [name, brandId]);
        if (duplicateRows.length > 0) {
            throw new Error('品牌名称已存在');
        }
        await connection.execute(`
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
      `, [
            name,
            categoryId,
            contactName,
            contactPhone,
            description,
            normalizeBrandStatus(payload.status),
            brandId,
        ]);
        await connection.commit();
        return { id: toEntityId(brandId) };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function reviewAdminBrandAuthApply(applyId, payload) {
    const status = normalizeReviewStatus(payload.status);
    const rejectReason = normalizeRejectReason(status, payload.rejectReason);
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [applyRows] = await connection.execute(`
        SELECT id, shop_id, brand_id, status
        FROM shop_brand_auth_apply
        WHERE id = ?
        LIMIT 1
      `, [applyId]);
        const apply = applyRows[0];
        if (!apply) {
            throw new Error('品牌授权申请不存在');
        }
        ensurePendingReview(apply.status);
        if (status === 'approved') {
            const [authRows] = await connection.execute(`
          SELECT id
          FROM shop_brand_auth
          WHERE shop_id = ?
            AND brand_id = ?
          ORDER BY CASE WHEN status = ${AUTH_STATUS_ACTIVE} THEN 0 ELSE 1 END, id DESC
          LIMIT 1
        `, [apply.shop_id, apply.brand_id]);
            const auth = authRows[0];
            if (auth?.id) {
                await connection.execute(`
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
          `, [
                    AUTH_TYPE_NORMAL,
                    AUTH_SCOPE_ALL_BRAND,
                    AUTH_STATUS_ACTIVE,
                    auth.id,
                ]);
            }
            else {
                await connection.execute(`
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
          `, [
                    createNo('SBA'),
                    apply.shop_id,
                    apply.brand_id,
                    AUTH_TYPE_NORMAL,
                    AUTH_SCOPE_ALL_BRAND,
                    AUTH_STATUS_ACTIVE,
                ]);
            }
        }
        await connection.execute(`
        UPDATE shop_brand_auth_apply
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
export async function getAdminBrands() {
    const db = getDbPool();
    const [rows] = await db.execute(`
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
    `, [AUTH_STATUS_ACTIVE]);
    const items = rows.map((row) => {
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
