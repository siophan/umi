export const PRODUCT_STATUS_ACTIVE = 10;
export const PRODUCT_STATUS_OFF_SHELF = 20;
export const PRODUCT_STATUS_DISABLED = 90;
export const SHOP_STATUS_ACTIVE = 10;
export const SHOP_STATUS_PAUSED = 20;
export const BRAND_STATUS_ACTIVE = 10;
export const BRAND_STATUS_DISABLED = 90;
export const BRAND_PRODUCT_STATUS_ACTIVE = 10;
export const BRAND_PRODUCT_STATUS_DISABLED = 90;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const LOW_STOCK_THRESHOLD = 10;
export function toNumber(value) {
    return Number(value ?? 0);
}
export function toNullableNumber(value) {
    if (value == null) {
        return null;
    }
    return Number(value);
}
export function normalizePage(page) {
    return Math.max(DEFAULT_PAGE, Number(page ?? DEFAULT_PAGE) || DEFAULT_PAGE);
}
export function normalizePageSize(pageSize) {
    const value = Number(pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
    return Math.min(MAX_PAGE_SIZE, Math.max(1, value));
}
export function safeJsonArray(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    catch {
        return [];
    }
}
export function uniqueStrings(items) {
    return items.filter((item, index) => items.indexOf(item) === index);
}
export function formatDateTime(value) {
    return new Date(value).toISOString();
}
export function resolveProductStatus(row, availableStock) {
    const productStatus = toNumber(row.status);
    const shopStatus = toNullableNumber(row.shop_status);
    const brandStatus = toNullableNumber(row.brand_status);
    const brandProductStatus = toNullableNumber(row.brand_product_status);
    if (productStatus === PRODUCT_STATUS_DISABLED ||
        brandStatus === BRAND_STATUS_DISABLED ||
        brandProductStatus === BRAND_PRODUCT_STATUS_DISABLED) {
        return 'disabled';
    }
    if (shopStatus === SHOP_STATUS_PAUSED) {
        return 'paused';
    }
    if (productStatus === PRODUCT_STATUS_OFF_SHELF) {
        return 'off_shelf';
    }
    if (availableStock <= LOW_STOCK_THRESHOLD) {
        return 'low_stock';
    }
    return 'active';
}
export function resolveBrandLibraryStatus(row) {
    const status = toNumber(row.status);
    const brandStatus = toNullableNumber(row.brand_status);
    if (status === BRAND_PRODUCT_STATUS_DISABLED || brandStatus === BRAND_STATUS_DISABLED) {
        return 'disabled';
    }
    return 'active';
}
export function buildProductTags(row, status, availableStock) {
    const sourceTags = safeJsonArray(row.tags);
    const tags = [...sourceTags];
    if (row.collab?.trim()) {
        tags.push(row.collab.trim());
    }
    if (availableStock <= LOW_STOCK_THRESHOLD) {
        tags.push('低库存');
    }
    if (status === 'off_shelf') {
        tags.push('已下架');
    }
    if (status === 'paused') {
        tags.push('店铺暂停');
    }
    if (status === 'disabled') {
        tags.push('不可售');
    }
    return uniqueStrings(tags);
}
export function sanitizeAdminProduct(row) {
    const stock = Math.max(0, toNumber(row.stock));
    const frozenStock = Math.max(0, toNumber(row.frozen_stock));
    const availableStock = Math.max(0, stock - frozenStock);
    const status = resolveProductStatus(row, availableStock);
    return {
        id: String(row.id),
        name: row.name,
        brand: row.brand_name || '未知品牌',
        category: row.category_name || '未分类',
        shopId: row.shop_id == null ? null : String(row.shop_id),
        shopName: row.shop_name || '未归属店铺',
        price: toNumber(row.price),
        stock,
        availableStock,
        frozenStock,
        status,
        updatedAt: formatDateTime(row.updated_at),
        tags: buildProductTags(row, status, availableStock),
        imageUrl: row.image_url,
        brandProductId: row.brand_product_id == null ? null : String(row.brand_product_id),
        rawStatusCode: toNumber(row.status),
        shopStatusCode: toNullableNumber(row.shop_status),
        brandStatusCode: toNullableNumber(row.brand_status),
        brandProductStatusCode: toNullableNumber(row.brand_product_status),
    };
}
export function sanitizeAdminBrandLibrary(row) {
    return {
        id: String(row.id),
        brandId: row.brand_id == null ? null : String(row.brand_id),
        brandName: row.brand_name || '未知品牌',
        productName: row.name,
        categoryId: row.category_id == null ? null : String(row.category_id),
        category: row.category_name || '未分类',
        guidePrice: toNumber(row.guide_price),
        supplyPrice: toNumber(row.supply_price),
        status: resolveBrandLibraryStatus(row),
        description: row.description ?? null,
        createdAt: formatDateTime(row.created_at),
        updatedAt: formatDateTime(row.updated_at),
        imageUrl: row.default_img,
        productCount: Math.max(0, toNumber(row.product_count)),
        activeProductCount: Math.max(0, toNumber(row.active_product_count)),
        rawStatusCode: toNumber(row.status),
        brandStatusCode: toNullableNumber(row.brand_status),
    };
}
export function buildAdminProductFilters(query) {
    const whereClauses = ['1 = 1'];
    const params = [];
    const keyword = query.keyword?.trim();
    const status = query.status ?? 'all';
    if (keyword) {
        const like = `%${keyword}%`;
        whereClauses.push('(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR s.name LIKE ?)');
        params.push(like, like, like, like);
    }
    if (status === 'active') {
        whereClauses.push('p.status = ? AND COALESCE(s.status, ?) <> ? AND COALESCE(b.status, ?) <> ? AND COALESCE(bp.status, ?) <> ? AND (p.stock - COALESCE(p.frozen_stock, 0)) > ?');
        params.push(PRODUCT_STATUS_ACTIVE, SHOP_STATUS_ACTIVE, SHOP_STATUS_PAUSED, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED, BRAND_PRODUCT_STATUS_ACTIVE, BRAND_PRODUCT_STATUS_DISABLED, LOW_STOCK_THRESHOLD);
    }
    else if (status === 'low_stock') {
        whereClauses.push('p.status = ? AND COALESCE(s.status, ?) <> ? AND COALESCE(b.status, ?) <> ? AND COALESCE(bp.status, ?) <> ? AND (p.stock - COALESCE(p.frozen_stock, 0)) <= ?');
        params.push(PRODUCT_STATUS_ACTIVE, SHOP_STATUS_ACTIVE, SHOP_STATUS_PAUSED, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED, BRAND_PRODUCT_STATUS_ACTIVE, BRAND_PRODUCT_STATUS_DISABLED, LOW_STOCK_THRESHOLD);
    }
    else if (status === 'paused') {
        whereClauses.push('COALESCE(s.status, ?) = ?');
        params.push(SHOP_STATUS_ACTIVE, SHOP_STATUS_PAUSED);
    }
    else if (status === 'off_shelf') {
        whereClauses.push('p.status = ?');
        params.push(PRODUCT_STATUS_OFF_SHELF);
    }
    else if (status === 'disabled') {
        whereClauses.push('(p.status = ? OR COALESCE(b.status, ?) = ? OR COALESCE(bp.status, ?) = ?)');
        params.push(PRODUCT_STATUS_DISABLED, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED, BRAND_PRODUCT_STATUS_ACTIVE, BRAND_PRODUCT_STATUS_DISABLED);
    }
    return { whereSql: whereClauses.join(' AND '), params };
}
export function buildAdminBrandLibraryFilters(query) {
    const whereClauses = ['1 = 1'];
    const params = [];
    const keyword = query.keyword?.trim();
    const status = query.status ?? 'all';
    const brandId = query.brandId?.trim();
    const categoryId = query.categoryId?.trim();
    if (keyword) {
        const like = `%${keyword}%`;
        whereClauses.push('(bp.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
        params.push(like, like, like);
    }
    if (status === 'active') {
        whereClauses.push('bp.status = ? AND COALESCE(b.status, ?) <> ?');
        params.push(BRAND_PRODUCT_STATUS_ACTIVE, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED);
    }
    else if (status === 'disabled') {
        whereClauses.push('(bp.status = ? OR COALESCE(b.status, ?) = ?)');
        params.push(BRAND_PRODUCT_STATUS_DISABLED, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED);
    }
    if (brandId) {
        whereClauses.push('bp.brand_id = ?');
        params.push(brandId);
    }
    if (categoryId) {
        whereClauses.push('bp.category_id = ?');
        params.push(categoryId);
    }
    return { whereSql: whereClauses.join(' AND '), params };
}
export function normalizeBrandProductStatus(status) {
    if (status === 'disabled') {
        return BRAND_PRODUCT_STATUS_DISABLED;
    }
    return BRAND_PRODUCT_STATUS_ACTIVE;
}
export function normalizeAdminBrandProductPayload(payload) {
    const name = payload.name.trim();
    const brandId = payload.brandId;
    const categoryId = payload.categoryId;
    const guidePrice = Math.round(Number(payload.guidePrice ?? 0));
    const supplyPrice = payload.supplyPrice == null ? null : Math.round(Number(payload.supplyPrice));
    const defaultImg = payload.defaultImg?.trim() || null;
    const description = payload.description?.trim() || null;
    if (!name) {
        throw new Error('品牌商品名称不能为空');
    }
    if (!brandId) {
        throw new Error('请选择品牌');
    }
    if (!categoryId) {
        throw new Error('请选择类目');
    }
    if (!Number.isInteger(guidePrice) || guidePrice < 0) {
        throw new Error('指导价不合法');
    }
    if (supplyPrice != null && (!Number.isInteger(supplyPrice) || supplyPrice < 0)) {
        throw new Error('供货价不合法');
    }
    return {
        name,
        brandId,
        categoryId,
        guidePrice,
        supplyPrice,
        defaultImg,
        description,
    };
}
