import { randomBytes } from 'node:crypto';
export const STATUS_PENDING = 10;
export const STATUS_APPROVED = 30;
export const STATUS_REJECTED = 40;
export const SHOP_STATUS_ACTIVE = 10;
export const SHOP_STATUS_PAUSED = 20;
export const SHOP_STATUS_CLOSED = 90;
export const BRAND_STATUS_ACTIVE = 10;
export const BRAND_STATUS_DISABLED = 90;
export const CATEGORY_STATUS_ACTIVE = 10;
export const PRODUCT_STATUS_ACTIVE = 10;
export const PRODUCT_STATUS_OFF_SHELF = 20;
export const PRODUCT_STATUS_DISABLED = 90;
export const AUTH_STATUS_ACTIVE = 10;
export const AUTH_STATUS_EXPIRED = 90;
export const AUTH_STATUS_REVOKED = 91;
export const AUTH_TYPE_NORMAL = 10;
export const AUTH_TYPE_EXCLUSIVE = 20;
export const AUTH_TYPE_TRIAL = 30;
export const AUTH_SCOPE_ALL_BRAND = 10;
export const AUTH_SCOPE_CATEGORY_ONLY = 20;
export const AUTH_SCOPE_PRODUCT_ONLY = 30;
export function createNo(prefix) {
    return `${prefix}${randomBytes(6).toString('hex')}`;
}
export function toId(value) {
    return value == null ? null : String(value);
}
export function toNumber(value) {
    return Number(value ?? 0);
}
export function toIso(value) {
    return value ? new Date(value).toISOString() : null;
}
export function parseJsonValue(value) {
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
export function buildUserDisplayName(name, phone) {
    if (name?.trim()) {
        return name.trim();
    }
    if (phone?.trim()) {
        return `用户${phone.trim().slice(-4)}`;
    }
    return '未知用户';
}
export function mapReviewStatus(code) {
    const value = Number(code ?? 0);
    if (value === STATUS_APPROVED) {
        return { code: value, key: 'approved', label: '已通过' };
    }
    if (value === STATUS_REJECTED) {
        return { code: value, key: 'rejected', label: '已拒绝' };
    }
    return { code: value, key: 'pending', label: '待审核' };
}
export function mapShopStatus(code) {
    const value = Number(code ?? 0);
    if (value === SHOP_STATUS_PAUSED) {
        return { code: value, key: 'paused', label: '暂停营业' };
    }
    if (value === SHOP_STATUS_CLOSED) {
        return { code: value, key: 'closed', label: '已关闭' };
    }
    return { code: value, key: 'active', label: '营业中' };
}
export function mapBrandStatus(code) {
    const value = Number(code ?? 0);
    if (value === BRAND_STATUS_DISABLED) {
        return { code: value, key: 'disabled', label: '停用' };
    }
    return { code: value, key: 'active', label: '合作中' };
}
export function mapProductStatus(code) {
    const value = Number(code ?? 0);
    if (value === PRODUCT_STATUS_OFF_SHELF) {
        return { code: value, key: 'off_shelf', label: '已下架' };
    }
    if (value === PRODUCT_STATUS_DISABLED) {
        return { code: value, key: 'disabled', label: '不可售' };
    }
    return { code: value, key: 'active', label: '在售' };
}
export function mapAuthStatus(code) {
    const value = Number(code ?? 0);
    if (value === AUTH_STATUS_EXPIRED) {
        return { code: value, key: 'expired', label: '已过期' };
    }
    if (value === AUTH_STATUS_REVOKED) {
        return { code: value, key: 'revoked', label: '已撤销' };
    }
    return { code: value, key: 'active', label: '生效中' };
}
export function mapAuthType(code) {
    const value = Number(code ?? 0);
    if (value === AUTH_TYPE_EXCLUSIVE) {
        return { code: value, key: 'exclusive', label: '独家授权' };
    }
    if (value === AUTH_TYPE_TRIAL) {
        return { code: value, key: 'trial', label: '试用授权' };
    }
    return { code: value, key: 'normal', label: '普通授权' };
}
export function mapAuthScope(code) {
    const value = Number(code ?? 0);
    if (value === AUTH_SCOPE_CATEGORY_ONLY) {
        return { code: value, key: 'category_only', label: '指定类目授权' };
    }
    if (value === AUTH_SCOPE_PRODUCT_ONLY) {
        return { code: value, key: 'product_only', label: '指定商品授权' };
    }
    return { code: value, key: 'all_brand', label: '全品牌授权' };
}
export function summarizeByKey(items, key) {
    const counts = new Map();
    for (const item of items) {
        const value = String(item[key] ?? '');
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Object.fromEntries(counts);
}
export function normalizeReviewStatus(status) {
    if (status === 'approved' || status === 'rejected') {
        return status;
    }
    throw new Error('审核状态不合法');
}
export function normalizeRejectReason(status, rejectReason) {
    const value = rejectReason?.trim() ?? '';
    if (status === 'rejected' && !value) {
        throw new Error('请填写拒绝原因');
    }
    return value ? value.slice(0, 200) : null;
}
export function ensurePendingReview(status) {
    if (Number(status ?? 0) !== STATUS_PENDING) {
        throw new Error('申请已审核');
    }
}
export function normalizeBrandStatus(status) {
    if (status === 'disabled') {
        return BRAND_STATUS_DISABLED;
    }
    return BRAND_STATUS_ACTIVE;
}
