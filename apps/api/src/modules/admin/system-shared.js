export const ADMIN_STATUS_ACTIVE = 10;
export const ADMIN_STATUS_DISABLED = 90;
export const ROLE_STATUS_ACTIVE = 10;
export const PERMISSION_STATUS_ACTIVE = 10;
export const ADMIN_ACTION_VIEW = 10;
export const ADMIN_ACTION_CREATE = 20;
export const ADMIN_ACTION_EDIT = 30;
export const ADMIN_ACTION_MANAGE = 40;
export const NOTIFICATION_TYPE_SYSTEM = 10;
export const NOTIFICATION_TYPE_ORDER = 20;
export const NOTIFICATION_TYPE_GUESS = 30;
export const NOTIFICATION_TYPE_SOCIAL = 40;
export const NOTIFICATION_TARGET_ORDER = 10;
export const NOTIFICATION_TARGET_GUESS = 20;
export const NOTIFICATION_TARGET_POST = 30;
export const NOTIFICATION_TARGET_CHAT = 40;
export const USER_RISK_NORMAL = 10;
export const USER_RISK_WATCH = 20;
export const USER_RISK_RESTRICTED = 30;
export function toNumber(value) {
    return Number(value ?? 0);
}
export function toIsoString(value) {
    return value ? new Date(value).toISOString() : null;
}
export function splitCsv(value) {
    return (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
export function uniq(items) {
    return Array.from(new Set(items));
}
export function normalizeAdminUsername(value) {
    const username = value?.trim() ?? '';
    if (!username) {
        throw new Error('系统用户名不能为空');
    }
    return username.slice(0, 50);
}
export function normalizeAdminDisplayName(value) {
    const displayName = value?.trim() ?? '';
    if (!displayName) {
        throw new Error('显示名称不能为空');
    }
    return displayName.slice(0, 50);
}
export function normalizeOptionalContact(value, maxLength) {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed.slice(0, maxLength) : null;
}
export function normalizeAdminPassword(value) {
    const password = value ?? '';
    if (password.length < 6) {
        throw new Error('密码长度不能少于 6 位');
    }
    return password;
}
export function normalizeAdminRoleIds(roleIds) {
    const values = uniq(roleIds
        .map((item) => String(item ?? '').trim())
        .filter(Boolean));
    if (values.length === 0) {
        throw new Error('请至少选择一个角色');
    }
    return values;
}
export function normalizeAdminPermissionCode(value) {
    const code = value?.trim() ?? '';
    if (!code) {
        throw new Error('权限编码不能为空');
    }
    return code.slice(0, 100);
}
export function normalizeAdminPermissionName(value) {
    const name = value?.trim() ?? '';
    if (!name) {
        throw new Error('权限名称不能为空');
    }
    return name.slice(0, 50);
}
export function normalizeAdminPermissionModule(value) {
    const module = value?.trim() ?? '';
    if (!module) {
        throw new Error('所属模块不能为空');
    }
    return module.slice(0, 50);
}
export function normalizeAdminPermissionAction(value) {
    if (value === 'view' || value === 'create' || value === 'edit' || value === 'manage') {
        return value;
    }
    throw new Error('权限动作不合法');
}
export function normalizeAdminPermissionParentId(value) {
    const parentId = String(value ?? '').trim();
    return parentId ? parentId : null;
}
export function toPermissionActionCode(action) {
    if (action === 'view')
        return ADMIN_ACTION_VIEW;
    if (action === 'create')
        return ADMIN_ACTION_CREATE;
    if (action === 'edit')
        return ADMIN_ACTION_EDIT;
    return ADMIN_ACTION_MANAGE;
}
export function mapAdminStatus(code) {
    return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
export function mapRoleStatus(code) {
    return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
export function mapPermissionStatus(code) {
    return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
export function toPermissionStatusCode(status) {
    return status === 'disabled' ? ADMIN_STATUS_DISABLED : PERMISSION_STATUS_ACTIVE;
}
export function mapPermissionAction(code) {
    const value = Number(code ?? 0);
    if (value === ADMIN_ACTION_VIEW) {
        return 'view';
    }
    if (value === ADMIN_ACTION_CREATE) {
        return 'create';
    }
    if (value === ADMIN_ACTION_EDIT) {
        return 'edit';
    }
    if (value === ADMIN_ACTION_MANAGE) {
        return 'manage';
    }
    return 'unknown';
}
export function permissionLevelWeight(level) {
    if (level === 'manage') {
        return 4;
    }
    if (level === 'edit') {
        return 3;
    }
    if (level === 'create') {
        return 2;
    }
    if (level === 'view') {
        return 1;
    }
    return 0;
}
export function normalizePermissionLevel(action) {
    if (action === 'view' || action === 'create' || action === 'edit' || action === 'manage') {
        return action;
    }
    return 'none';
}
export function mapNotificationType(code) {
    const value = Number(code ?? NOTIFICATION_TYPE_SYSTEM);
    if (value === NOTIFICATION_TYPE_ORDER) {
        return 'order';
    }
    if (value === NOTIFICATION_TYPE_GUESS) {
        return 'guess';
    }
    if (value === NOTIFICATION_TYPE_SOCIAL) {
        return 'social';
    }
    return 'system';
}
export function mapNotificationTargetType(code) {
    const value = Number(code ?? 0);
    if (value === NOTIFICATION_TARGET_ORDER) {
        return 'order';
    }
    if (value === NOTIFICATION_TARGET_GUESS) {
        return 'guess';
    }
    if (value === NOTIFICATION_TARGET_POST) {
        return 'post';
    }
    if (value === NOTIFICATION_TARGET_CHAT) {
        return 'chat';
    }
    return 'unknown';
}
export function mapNotificationAudience(code) {
    const value = Number(code ?? 0);
    if (value === NOTIFICATION_TARGET_ORDER) {
        return 'order_users';
    }
    if (value === NOTIFICATION_TARGET_GUESS) {
        return 'guess_users';
    }
    if (value === NOTIFICATION_TARGET_POST) {
        return 'post_users';
    }
    if (value === NOTIFICATION_TARGET_CHAT) {
        return 'chat_users';
    }
    return 'all_users';
}
export function mapNotificationAudienceTargetType(audience) {
    if (audience === 'order_users') {
        return NOTIFICATION_TARGET_ORDER;
    }
    if (audience === 'guess_users') {
        return NOTIFICATION_TARGET_GUESS;
    }
    if (audience === 'post_users') {
        return NOTIFICATION_TARGET_POST;
    }
    if (audience === 'chat_users') {
        return NOTIFICATION_TARGET_CHAT;
    }
    return null;
}
export function mapRiskLevel(code) {
    const value = Number(code ?? USER_RISK_NORMAL);
    if (value >= USER_RISK_RESTRICTED) {
        return 'high';
    }
    if (value >= USER_RISK_WATCH) {
        return 'medium';
    }
    return 'low';
}
export function mapChatStatus(riskLevel) {
    if (riskLevel === 'high') {
        return 'escalated';
    }
    if (riskLevel === 'medium') {
        return 'review';
    }
    return 'normal';
}
export function mapRolePermissionRange(modules) {
    if (modules.length === 0) {
        return '未配置权限';
    }
    if (modules.includes('*')) {
        return '全局';
    }
    if (modules.length <= 2) {
        return modules.join(' / ');
    }
    return `${modules[0]} / ${modules[1]} 等 ${modules.length} 个模块`;
}
export function mapRoleModules(rawModules) {
    const modules = uniq(splitCsv(rawModules));
    return modules.length > 0 ? modules : ['未分组'];
}
