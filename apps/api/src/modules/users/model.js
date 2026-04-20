import { toEntityId } from '@umi/shared';
const GENDER_UNKNOWN = 10;
const GENDER_MALE = 20;
const GENDER_FEMALE = 30;
const PROFILE_PRIVACY_PUBLIC = 10;
const PROFILE_PRIVACY_FRIENDS = 20;
const PROFILE_PRIVACY_PRIVATE = 90;
function resolveUserRole(row) {
    if (Number(row.shop_verified ?? 0) > 0) {
        return 'shop_owner';
    }
    return 'user';
}
function genderCodeToValue(code) {
    const value = Number(code ?? 0);
    if (value === GENDER_UNKNOWN) {
        return null;
    }
    if (value === GENDER_MALE) {
        return 'male';
    }
    if (value === GENDER_FEMALE) {
        return 'female';
    }
    return null;
}
function worksPrivacyCodeToValue(code) {
    const value = Number(code ?? PROFILE_PRIVACY_PUBLIC);
    if (value === PROFILE_PRIVACY_FRIENDS) {
        return 'friends';
    }
    if (value === PROFILE_PRIVACY_PRIVATE) {
        return 'me';
    }
    return 'all';
}
function favPrivacyCodeToValue(code) {
    const value = Number(code ?? PROFILE_PRIVACY_PUBLIC);
    if (value === PROFILE_PRIVACY_PRIVATE) {
        return 'me';
    }
    return 'all';
}
function normalizeBirthday(value) {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
export function genderValueToCode(value) {
    if (!value) {
        return null;
    }
    if (value === 'male') {
        return GENDER_MALE;
    }
    if (value === 'female') {
        return GENDER_FEMALE;
    }
    throw new Error('性别参数不合法');
}
export function worksPrivacyValueToCode(value) {
    if (!value || value === 'all') {
        return PROFILE_PRIVACY_PUBLIC;
    }
    if (value === 'friends') {
        return PROFILE_PRIVACY_FRIENDS;
    }
    if (value === 'me') {
        return PROFILE_PRIVACY_PRIVATE;
    }
    throw new Error('作品隐私参数不合法');
}
export function favPrivacyValueToCode(value) {
    if (!value || value === 'all') {
        return PROFILE_PRIVACY_PUBLIC;
    }
    if (value === 'me') {
        return PROFILE_PRIVACY_PRIVATE;
    }
    throw new Error('收藏隐私参数不合法');
}
export function normalizeBirthdayInput(value) {
    const raw = value?.trim() || '';
    if (!raw) {
        return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        throw new Error('生日格式不合法');
    }
    if (raw > new Date().toISOString().slice(0, 10)) {
        throw new Error('生日不能晚于今天');
    }
    return raw;
}
export function sanitizeUser(row) {
    const totalOrders = Number(row.order_count ?? 0);
    const totalGuess = Number(row.total_guess ?? 0);
    const wins = Number(row.wins ?? 0);
    return {
        id: toEntityId(row.id),
        uid: row.uid_code || '',
        phone: row.phone_number,
        name: row.name || `用户${String(row.phone_number).slice(-4)}`,
        role: resolveUserRole(row),
        banned: Boolean(row.banned),
        coins: Number(row.coins ?? 0),
        avatar: row.avatar_url ?? null,
        level: Number(row.level ?? 1),
        title: row.title ?? null,
        signature: row.signature ?? null,
        gender: genderCodeToValue(row.gender),
        birthday: normalizeBirthday(row.birthday),
        region: row.region ?? null,
        shopName: row.shop_name ?? null,
        followers: Number(row.followers ?? 0),
        following: Number(row.following ?? 0),
        totalOrders,
        totalGuess,
        wins,
        winRate: totalGuess > 0 ? Number(((wins / totalGuess) * 100).toFixed(1)) : 0,
        joinDate: new Date(row.created_at).toISOString(),
        shopVerified: Number(row.shop_verified ?? 0) > 0,
        worksPrivacy: worksPrivacyCodeToValue(row.works_privacy),
        favPrivacy: favPrivacyCodeToValue(row.fav_privacy),
    };
}
export function sanitizePublicUser(row, worksVisible = true, likedVisible = true) {
    const user = sanitizeUser(row);
    return {
        id: user.id,
        uid: user.uid,
        name: user.name,
        avatar: user.avatar ?? null,
        level: user.level,
        title: user.title ?? null,
        signature: user.signature ?? null,
        gender: user.gender ?? null,
        birthday: user.birthday ?? null,
        region: user.region ?? null,
        followers: user.followers ?? 0,
        following: user.following ?? 0,
        winRate: user.winRate ?? 0,
        totalGuess: user.totalGuess ?? 0,
        wins: user.wins ?? 0,
        joinDate: user.joinDate ?? null,
        shopVerified: user.shopVerified ?? false,
        worksVisible,
        likedVisible,
        relation: 'none',
    };
}
