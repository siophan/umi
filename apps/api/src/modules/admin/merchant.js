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
export async function getAdminBrandApplies() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        ba.id,
        ba.apply_no,
        ba.brand_name,
        c.name AS category_name,
        ba.contact_name,
        ba.contact_phone,
        ba.license,
        ba.deposit,
        ba.reason,
        ba.status,
        ba.reject_reason,
        ba.reviewed_at,
        ba.brand_id,
        ba.created_at
      FROM brand_apply ba
      LEFT JOIN category c ON c.id = ba.category_id
      ORDER BY ba.created_at DESC, ba.id DESC
    `);
    const items = rows.map((row) => {
        const status = mapReviewStatus(row.status);
        return {
            id: String(row.id),
            applyNo: row.apply_no,
            name: row.brand_name,
            category: row.category_name ?? null,
            applicant: row.contact_name ?? null,
            contactPhone: row.contact_phone ?? null,
            license: row.license ?? null,
            deposit: toNumber(row.deposit),
            reason: row.reason ?? null,
            status: status.key,
            statusLabel: status.label,
            rejectReason: row.reject_reason ?? null,
            reviewedAt: toIso(row.reviewed_at),
            submittedAt: toIso(row.created_at),
            brandId: toId(row.brand_id),
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
            stock: toNumber(row.stock),
            frozenStock: toNumber(row.frozen_stock),
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
export async function getAdminProductAuthRows() {
    const items = (await listBrandAuthRecordsInternal())
        .filter((item) => item.authScope === 'product_only')
        .map((item) => ({
        id: item.id,
        authNo: item.authNo,
        brandId: item.brandId,
        brandName: item.brandName,
        shopId: item.shopId,
        shopName: item.shopName,
        mode: item.authType,
        modeLabel: item.authTypeLabel,
        status: item.status,
        statusLabel: item.statusLabel,
        grantedAt: item.grantedAt,
        expireAt: item.expireAt,
        productName: null,
        scopeValue: item.scopeValue,
    }));
    return {
        items,
        summary: {
            total: items.length,
            byStatus: summarizeByKey(items, 'status'),
        },
    };
}
export async function getAdminProductAuthRecords() {
    const items = (await listBrandAuthRecordsInternal())
        .filter((item) => item.authScope === 'product_only')
        .map((item) => ({
        id: item.id,
        authNo: item.authNo,
        subject: item.subject,
        mode: item.authType,
        modeLabel: item.authTypeLabel,
        status: item.status,
        statusLabel: item.statusLabel,
        operatorName: item.operatorName,
        createdAt: item.createdAt,
        grantedAt: item.grantedAt,
        expireAt: item.expireAt,
        scopeValue: item.scopeValue,
    }));
    return {
        items,
        summary: {
            total: items.length,
            byStatus: summarizeByKey(items, 'status'),
        },
    };
}
