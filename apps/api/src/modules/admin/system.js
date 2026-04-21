import bcrypt from 'bcryptjs';
import { findAdminPermissionDefinitionByCode, getAdminPermissionChildren, toEntityId, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { ensureAdminPermissionCatalogSynced } from './permission-catalog';
const ADMIN_STATUS_ACTIVE = 10;
const ADMIN_STATUS_DISABLED = 90;
const ROLE_STATUS_ACTIVE = 10;
const PERMISSION_STATUS_ACTIVE = 10;
const ADMIN_ACTION_VIEW = 10;
const ADMIN_ACTION_CREATE = 20;
const ADMIN_ACTION_EDIT = 30;
const ADMIN_ACTION_MANAGE = 40;
const NOTIFICATION_TYPE_SYSTEM = 10;
const NOTIFICATION_TYPE_ORDER = 20;
const NOTIFICATION_TYPE_GUESS = 30;
const NOTIFICATION_TYPE_SOCIAL = 40;
const NOTIFICATION_TARGET_ORDER = 10;
const NOTIFICATION_TARGET_GUESS = 20;
const NOTIFICATION_TARGET_POST = 30;
const NOTIFICATION_TARGET_CHAT = 40;
const USER_RISK_NORMAL = 10;
const USER_RISK_WATCH = 20;
const USER_RISK_RESTRICTED = 30;
async function fetchNotificationRecipientIds(connection, audience) {
    if (audience === 'order_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT o.user_id AS user_id
        FROM \`order\` o
        INNER JOIN user u ON u.id = o.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'guess_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT gb.user_id AS user_id
        FROM guess_bet gb
        INNER JOIN user u ON u.id = gb.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'post_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT p.user_id AS user_id
        FROM post p
        INNER JOIN user u ON u.id = p.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'chat_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT candidate.user_id AS user_id
        FROM (
          SELECT sender_id AS user_id FROM chat_message
          UNION
          SELECT receiver_id AS user_id FROM chat_message
        ) candidate
        INNER JOIN user u ON u.id = candidate.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    const [rows] = await connection.execute(`
      SELECT id
      FROM user
      WHERE COALESCE(banned, 0) = 0
    `);
    return rows
        .map((row) => row.id)
        .filter((value) => value != null)
        .map((value) => String(value));
}
function mapNotificationAudienceTargetType(audience) {
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
function toNumber(value) {
    return Number(value ?? 0);
}
function toIsoString(value) {
    return value ? new Date(value).toISOString() : null;
}
function splitCsv(value) {
    return (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
function uniq(items) {
    return Array.from(new Set(items));
}
function normalizeAdminUsername(value) {
    const username = value?.trim() ?? '';
    if (!username) {
        throw new Error('系统用户名不能为空');
    }
    return username.slice(0, 50);
}
function normalizeAdminDisplayName(value) {
    const displayName = value?.trim() ?? '';
    if (!displayName) {
        throw new Error('显示名称不能为空');
    }
    return displayName.slice(0, 50);
}
function normalizeOptionalContact(value, maxLength) {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed.slice(0, maxLength) : null;
}
function normalizeAdminPassword(value) {
    const password = value ?? '';
    if (password.length < 6) {
        throw new Error('密码长度不能少于 6 位');
    }
    return password;
}
function normalizeAdminRoleIds(roleIds) {
    const values = uniq(roleIds
        .map((item) => String(item ?? '').trim())
        .filter(Boolean));
    if (values.length === 0) {
        throw new Error('请至少选择一个角色');
    }
    return values;
}
function normalizeAdminPermissionCode(value) {
    const code = value?.trim() ?? '';
    if (!code) {
        throw new Error('权限编码不能为空');
    }
    return code.slice(0, 100);
}
function normalizeAdminPermissionName(value) {
    const name = value?.trim() ?? '';
    if (!name) {
        throw new Error('权限名称不能为空');
    }
    return name.slice(0, 50);
}
function normalizeAdminPermissionModule(value) {
    const module = value?.trim() ?? '';
    if (!module) {
        throw new Error('所属模块不能为空');
    }
    return module.slice(0, 50);
}
function normalizeAdminPermissionAction(value) {
    if (value === 'view' || value === 'create' || value === 'edit' || value === 'manage') {
        return value;
    }
    throw new Error('权限动作不合法');
}
function normalizeAdminPermissionParentId(value) {
    const parentId = String(value ?? '').trim();
    return parentId ? parentId : null;
}
function toPermissionActionCode(action) {
    if (action === 'view')
        return ADMIN_ACTION_VIEW;
    if (action === 'create')
        return ADMIN_ACTION_CREATE;
    if (action === 'edit')
        return ADMIN_ACTION_EDIT;
    return ADMIN_ACTION_MANAGE;
}
function mapAdminStatus(code) {
    return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
function mapRoleStatus(code) {
    return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
function mapPermissionStatus(code) {
    return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}
function toPermissionStatusCode(status) {
    return status === 'disabled' ? ADMIN_STATUS_DISABLED : PERMISSION_STATUS_ACTIVE;
}
function mapPermissionAction(code) {
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
function permissionLevelWeight(level) {
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
function normalizePermissionLevel(action) {
    if (action === 'view' || action === 'create' || action === 'edit' || action === 'manage') {
        return action;
    }
    return 'none';
}
function mapNotificationType(code) {
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
function mapNotificationTargetType(code) {
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
function mapNotificationAudience(code) {
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
function mapRiskLevel(code) {
    const value = Number(code ?? USER_RISK_NORMAL);
    if (value >= USER_RISK_RESTRICTED) {
        return 'high';
    }
    if (value >= USER_RISK_WATCH) {
        return 'medium';
    }
    return 'low';
}
function mapChatStatus(riskLevel) {
    if (riskLevel === 'high') {
        return 'escalated';
    }
    if (riskLevel === 'medium') {
        return 'review';
    }
    return 'normal';
}
function mapRolePermissionRange(modules) {
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
function mapRoleModules(rawModules) {
    const modules = uniq(splitCsv(rawModules));
    return modules.length > 0 ? modules : ['未分组'];
}
async function fetchAdminSystemUsers() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        au.id,
        au.username,
        au.display_name,
        au.phone_number,
        au.email,
        au.status,
        au.last_login_at,
        au.created_at,
        GROUP_CONCAT(DISTINCT ar.name ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_names,
        GROUP_CONCAT(DISTINCT ar.code ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_codes,
        GROUP_CONCAT(DISTINCT CAST(ar.id AS CHAR) ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_ids
      FROM admin_user au
      LEFT JOIN admin_user_role aur ON aur.admin_user_id = au.id
      LEFT JOIN admin_role ar ON ar.id = aur.role_id
      GROUP BY
        au.id,
        au.username,
        au.display_name,
        au.phone_number,
        au.email,
        au.status,
        au.last_login_at,
        au.created_at
      ORDER BY au.last_login_at DESC, au.id DESC
    `);
    return rows;
}
async function findAdminSystemUserById(db, adminUserId) {
    const [rows] = await db.execute(`
      SELECT
        id,
        username,
        display_name,
        phone_number,
        email,
        status,
        last_login_at,
        created_at,
        NULL AS role_names,
        NULL AS role_codes,
        NULL AS role_ids
      FROM admin_user
      WHERE id = ?
      LIMIT 1
    `, [adminUserId]);
    return rows[0] ?? null;
}
async function fetchAdminRolesWithStats() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        ar.id,
        ar.code,
        ar.name,
        ar.description,
        ar.status,
        ar.is_system,
        ar.sort,
        ar.created_at,
        ar.updated_at,
        COUNT(DISTINCT aur.admin_user_id) AS member_count,
        COUNT(DISTINCT CASE
          WHEN ap.status = ${PERMISSION_STATUS_ACTIVE} THEN arp.permission_id
          ELSE NULL
        END) AS permission_count,
        GROUP_CONCAT(DISTINCT CASE
          WHEN ap.status = ${PERMISSION_STATUS_ACTIVE} THEN COALESCE(ap.module, '未分组')
          ELSE NULL
        END ORDER BY ap.sort ASC, ap.id ASC SEPARATOR ',') AS permission_modules
      FROM admin_role ar
      LEFT JOIN admin_user_role aur ON aur.role_id = ar.id
      LEFT JOIN admin_role_permission arp ON arp.role_id = ar.id
      LEFT JOIN admin_permission ap ON ap.id = arp.permission_id
      GROUP BY
        ar.id,
        ar.code,
        ar.name,
        ar.description,
        ar.status,
        ar.is_system,
        ar.sort,
        ar.created_at,
        ar.updated_at
      ORDER BY ar.sort ASC, ar.id ASC
    `);
    return rows;
}
async function findAdminRoleById(db, roleId) {
    const [rows] = await db.execute(`
      SELECT
        id,
        code,
        name,
        description,
        status,
        is_system,
        sort,
        created_at,
        updated_at,
        0 AS member_count,
        0 AS permission_count,
        NULL AS permission_modules
      FROM admin_role
      WHERE id = ?
      LIMIT 1
    `, [roleId]);
    return rows[0] ?? null;
}
async function findAdminUserByUsername(db, username, excludeId) {
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_user
      WHERE username = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `, excludeId ? [username, excludeId] : [username]);
    return rows.length > 0;
}
async function findAdminUserByPhoneNumber(db, phoneNumber, excludeId) {
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_user
      WHERE phone_number = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `, excludeId ? [phoneNumber, excludeId] : [phoneNumber]);
    return rows.length > 0;
}
async function fetchActiveRolesByIds(db, roleIds) {
    const placeholders = roleIds.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_role
      WHERE id IN (${placeholders})
        AND status = ?
    `, [...roleIds, ROLE_STATUS_ACTIVE]);
    return rows.map((row) => String(row.id));
}
async function fetchActivePermissionsByIds(db, permissionIds) {
    if (permissionIds.length === 0) {
        return [];
    }
    const placeholders = permissionIds.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_permission
      WHERE id IN (${placeholders})
        AND status = ?
    `, [...permissionIds, PERMISSION_STATUS_ACTIVE]);
    return rows.map((row) => String(row.id));
}
async function fetchPermissionsByIds(db, permissionIds) {
    if (permissionIds.length === 0) {
        return [];
    }
    const placeholders = permissionIds.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id, code
      FROM admin_permission
      WHERE id IN (${placeholders})
    `, permissionIds);
    return rows.map((row) => ({
        id: String(row.id),
        code: row.code,
    }));
}
async function fetchActivePermissionIdsByCodes(db, codes) {
    if (codes.length === 0) {
        return [];
    }
    const placeholders = codes.map(() => '?').join(', ');
    const [rows] = await db.execute(`
      SELECT id, code
      FROM admin_permission
      WHERE code IN (${placeholders})
        AND status = ?
    `, [...codes, PERMISSION_STATUS_ACTIVE]);
    return rows.map((row) => String(row.id));
}
async function expandRolePermissionIds(db, permissionIds) {
    const selectedPermissions = await fetchPermissionsByIds(db, permissionIds);
    const expandedCodes = uniq(selectedPermissions.flatMap((permission) => {
        const definition = findAdminPermissionDefinitionByCode(permission.code);
        if (!definition) {
            return [permission.code];
        }
        const childCodes = getAdminPermissionChildren(definition.code).map((item) => item.code);
        return [permission.code, ...childCodes];
    }));
    return fetchActivePermissionIdsByCodes(db, expandedCodes);
}
async function replaceAdminUserRoles(db, adminUserId, roleIds) {
    await db.execute(`
      DELETE FROM admin_user_role
      WHERE admin_user_id = ?
    `, [adminUserId]);
    for (const roleId of roleIds) {
        await db.execute(`
        INSERT INTO admin_user_role (admin_user_id, role_id, created_at)
        VALUES (?, ?, NOW())
      `, [adminUserId, roleId]);
    }
}
async function fetchAdminPermissionsByRole() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        ap.id,
        ap.code,
        ap.name,
        ap.module,
        ap.action,
        ap.parent_id,
        ap.status,
        ap.sort,
        arp.role_id
      FROM admin_permission ap
      LEFT JOIN admin_role_permission arp ON arp.permission_id = ap.id
      WHERE ap.status = ?
      ORDER BY COALESCE(ap.module, '未分组') ASC, ap.sort ASC, ap.id ASC, arp.role_id ASC
    `, [PERMISSION_STATUS_ACTIVE]);
    return rows;
}
async function fetchAdminPermissionRows() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        ap.id,
        ap.code,
        ap.name,
        ap.module,
        ap.action,
        ap.parent_id,
        parent.name AS parent_name,
        ap.status,
        ap.sort,
        COUNT(DISTINCT arp.role_id) AS assigned_role_count
      FROM admin_permission ap
      LEFT JOIN admin_permission parent ON parent.id = ap.parent_id
      LEFT JOIN admin_role_permission arp ON arp.permission_id = ap.id
      GROUP BY
        ap.id,
        ap.code,
        ap.name,
        ap.module,
        ap.action,
        ap.parent_id,
        parent.name,
        ap.status,
        ap.sort
      ORDER BY COALESCE(ap.module, '未分组') ASC, ap.sort ASC, ap.id ASC
    `);
    return rows;
}
async function fetchAdminPermissionById(permissionId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id, code, name, module, action, parent_id, status, sort
      FROM admin_permission
      WHERE id = ?
      LIMIT 1
    `, [permissionId]);
    return rows[0] ?? null;
}
async function findAdminPermissionByCode(db, code, excludeId) {
    const [rows] = await db.execute(`
      SELECT id
      FROM admin_permission
      WHERE code = ?
      ${excludeId ? 'AND id <> ?' : ''}
      LIMIT 1
    `, excludeId ? [code, excludeId] : [code]);
    return rows.length > 0;
}
async function wouldCreatePermissionCycle(permissionId, parentId) {
    let currentId = parentId;
    const visited = new Set();
    while (currentId) {
        if (currentId === permissionId) {
            return true;
        }
        if (visited.has(currentId)) {
            return true;
        }
        visited.add(currentId);
        const node = await fetchAdminPermissionById(currentId);
        currentId = node?.parent_id == null ? null : String(node.parent_id);
    }
    return false;
}
async function fetchAdminPermissionTreeRows(db) {
    const [rows] = await db.execute(`
      SELECT id, parent_id
      FROM admin_permission
    `);
    return rows;
}
async function collectAdminPermissionDescendantIds(db, permissionId) {
    const rows = await fetchAdminPermissionTreeRows(db);
    const childrenByParent = new Map();
    for (const row of rows) {
        if (row.parent_id == null) {
            continue;
        }
        const parentId = String(row.parent_id);
        const currentChildren = childrenByParent.get(parentId) ?? [];
        currentChildren.push(String(row.id));
        childrenByParent.set(parentId, currentChildren);
    }
    const descendants = [];
    const queue = [...(childrenByParent.get(permissionId) ?? [])];
    const seen = new Set(queue);
    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId) {
            continue;
        }
        descendants.push(currentId);
        for (const childId of childrenByParent.get(currentId) ?? []) {
            if (seen.has(childId)) {
                continue;
            }
            seen.add(childId);
            queue.push(childId);
        }
    }
    return descendants;
}
async function fetchAdminNotificationBatches() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        SHA2(
          CONCAT_WS(
            '#',
            COALESCE(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s.%f'), ''),
            COALESCE(CAST(type AS CHAR), ''),
            COALESCE(title, ''),
            COALESCE(content, ''),
            COALESCE(CAST(target_type AS CHAR), ''),
            COALESCE(CAST(target_id AS CHAR), ''),
            COALESCE(action_url, '')
          ),
          256
        ) AS notification_key,
        title,
        content,
        type,
        target_type,
        target_id,
        action_url,
        MIN(created_at) AS batch_created_at,
        COUNT(*) AS recipient_count,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS read_count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
        MAX(created_at) AS last_created_at
      FROM notification
      GROUP BY
        notification_key,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s.%f'),
        title,
        content,
        type,
        target_type,
        target_id,
        action_url
      ORDER BY last_created_at DESC, notification_key DESC
      LIMIT 100
    `);
    return rows;
}
async function fetchAdminChatRows() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        CONCAT(LEAST(cm.sender_id, cm.receiver_id), ':', GREATEST(cm.sender_id, cm.receiver_id)) AS conversation_key,
        LEAST(cm.sender_id, cm.receiver_id) AS user_a_id,
        GREATEST(cm.sender_id, cm.receiver_id) AS user_b_id,
        upa.name AS user_a_name,
        upb.name AS user_b_name,
        ua.uid_code AS user_a_uid,
        ub.uid_code AS user_b_uid,
        ua.risk_level AS user_a_risk_level,
        ub.risk_level AS user_b_risk_level,
        COUNT(*) AS message_count,
        SUM(CASE WHEN cm.is_read = 0 THEN 1 ELSE 0 END) AS unread_message_count,
        MAX(cm.created_at) AS updated_at
      FROM chat_message cm
      INNER JOIN user ua ON ua.id = LEAST(cm.sender_id, cm.receiver_id)
      INNER JOIN user ub ON ub.id = GREATEST(cm.sender_id, cm.receiver_id)
      LEFT JOIN user_profile upa ON upa.user_id = ua.id
      LEFT JOIN user_profile upb ON upb.user_id = ub.id
      GROUP BY
        conversation_key,
        user_a_id,
        user_b_id,
        upa.name,
        upb.name,
        ua.uid_code,
        ub.uid_code,
        ua.risk_level,
        ub.risk_level
      ORDER BY updated_at DESC, conversation_key DESC
      LIMIT 100
    `);
    return rows;
}
export async function getAdminNotifications() {
    const rows = await fetchAdminNotificationBatches();
    const items = rows.map((row) => ({
        id: row.notification_key,
        title: row.title || '系统通知',
        content: row.content ?? null,
        audience: mapNotificationAudience(row.target_type),
        type: mapNotificationType(row.type),
        status: 'sent',
        targetType: mapNotificationTargetType(row.target_type),
        targetId: row.target_id == null ? null : String(row.target_id),
        actionUrl: row.action_url ?? null,
        recipientCount: toNumber(row.recipient_count),
        readCount: toNumber(row.read_count),
        unreadCount: toNumber(row.unread_count),
        createdAt: toIsoString(row.batch_created_at) ?? new Date(0).toISOString(),
        sentAt: toIsoString(row.last_created_at) ?? new Date(0).toISOString(),
    }));
    return {
        items,
        summary: {
            total: items.length,
            sent: items.length,
            read: items.reduce((sum, item) => sum + item.readCount, 0),
            unread: items.reduce((sum, item) => sum + item.unreadCount, 0),
        },
        basis: '基于 notification 真表按消息载荷聚合为发送批次视图；当前没有 admin 通知草稿/调度专表，因此这里只覆盖已发送记录。',
    };
}
export async function createAdminNotification(payload) {
    const title = payload.title.trim();
    const content = payload.content.trim();
    if (!title) {
        throw new Error('通知标题不能为空');
    }
    if (!content) {
        throw new Error('通知内容不能为空');
    }
    const type = payload.type === 'order'
        ? NOTIFICATION_TYPE_ORDER
        : payload.type === 'guess'
            ? NOTIFICATION_TYPE_GUESS
            : payload.type === 'social'
                ? NOTIFICATION_TYPE_SOCIAL
                : NOTIFICATION_TYPE_SYSTEM;
    const targetType = mapNotificationAudienceTargetType(payload.audience);
    const db = getDbPool();
    const connection = await db.getConnection();
    const batchCreatedAt = new Date();
    try {
        await connection.beginTransaction();
        const recipientIds = uniq(await fetchNotificationRecipientIds(connection, payload.audience));
        if (recipientIds.length === 0) {
            throw new Error('当前筛选人群没有可发送用户');
        }
        for (const userId of recipientIds) {
            await connection.execute(`
          INSERT INTO notification (
            user_id,
            type,
            title,
            content,
            target_type,
            target_id,
            action_url,
            is_read,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, NULL, ?, 0, ?, ?)
        `, [userId, type, title, content, targetType, payload.actionUrl?.trim() || null, batchCreatedAt, batchCreatedAt]);
        }
        await connection.commit();
        return { sentCount: recipientIds.length };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getAdminChats() {
    const rows = await fetchAdminChatRows();
    const items = rows.map((row) => {
        const riskLevel = mapRiskLevel(Math.max(toNumber(row.user_a_risk_level ?? USER_RISK_NORMAL), toNumber(row.user_b_risk_level ?? USER_RISK_NORMAL)));
        return {
            id: row.conversation_key,
            userA: {
                id: String(row.user_a_id),
                uid: row.user_a_uid ?? null,
                name: row.user_a_name || `用户 ${String(row.user_a_id)}`,
            },
            userB: {
                id: String(row.user_b_id),
                uid: row.user_b_uid ?? null,
                name: row.user_b_name || `用户 ${String(row.user_b_id)}`,
            },
            messages: toNumber(row.message_count),
            unreadMessages: toNumber(row.unread_message_count),
            riskLevel,
            status: mapChatStatus(riskLevel),
            updatedAt: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
        };
    });
    return {
        items,
        summary: {
            total: items.length,
            review: items.filter((item) => item.status === 'review').length,
            escalated: items.filter((item) => item.status === 'escalated').length,
            highRisk: items.filter((item) => item.riskLevel === 'high').length,
        },
        basis: '基于 chat_message 真表按用户对聚合唯一会话，风险等级取双方 user.risk_level 的较高值；当前没有 admin 聊天抽检专表。',
    };
}
export async function getAdminSystemUsers() {
    const rows = await fetchAdminSystemUsers();
    const items = rows.map((row) => ({
        id: String(row.id),
        username: row.username,
        displayName: row.display_name || row.username,
        phoneNumber: row.phone_number ?? null,
        email: row.email ?? null,
        role: splitCsv(row.role_names).join(' / ') || '未分配角色',
        roleCodes: splitCsv(row.role_codes),
        roleIds: splitCsv(row.role_ids),
        status: mapAdminStatus(row.status),
        lastLoginAt: toIsoString(row.last_login_at),
        createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
    }));
    return {
        items,
        summary: {
            total: items.length,
            active: items.filter((item) => item.status === 'active').length,
            disabled: items.filter((item) => item.status === 'disabled').length,
        },
    };
}
export async function createAdminSystemUser(payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const username = normalizeAdminUsername(payload.username);
        const displayName = normalizeAdminDisplayName(payload.displayName);
        const password = normalizeAdminPassword(payload.password);
        const phoneNumber = normalizeOptionalContact(payload.phoneNumber, 20);
        const email = normalizeOptionalContact(payload.email, 100);
        const roleIds = normalizeAdminRoleIds(payload.roleIds);
        const status = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
        if (await findAdminUserByUsername(connection, username)) {
            throw new Error('系统用户名已存在');
        }
        if (phoneNumber && (await findAdminUserByPhoneNumber(connection, phoneNumber))) {
            throw new Error('手机号已被其他系统用户占用');
        }
        const activeRoleIds = await fetchActiveRolesByIds(connection, roleIds);
        if (activeRoleIds.length !== roleIds.length) {
            throw new Error('存在无效角色或停用角色');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await connection.execute(`
        INSERT INTO admin_user (
          username,
          password_hash,
          display_name,
          phone_number,
          email,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [username, passwordHash, displayName, phoneNumber, email, status]);
        const adminUserId = String(result.insertId);
        await replaceAdminUserRoles(connection, adminUserId, activeRoleIds);
        await connection.commit();
        return { id: toEntityId(adminUserId) };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function updateAdminSystemUser(adminUserId, payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const user = await findAdminSystemUserById(connection, adminUserId);
        if (!user) {
            throw new Error('系统用户不存在');
        }
        const username = normalizeAdminUsername(payload.username);
        const displayName = normalizeAdminDisplayName(payload.displayName);
        const phoneNumber = normalizeOptionalContact(payload.phoneNumber, 20);
        const email = normalizeOptionalContact(payload.email, 100);
        const roleIds = normalizeAdminRoleIds(payload.roleIds);
        if (await findAdminUserByUsername(connection, username, adminUserId)) {
            throw new Error('系统用户名已存在');
        }
        if (phoneNumber &&
            (await findAdminUserByPhoneNumber(connection, phoneNumber, adminUserId))) {
            throw new Error('手机号已被其他系统用户占用');
        }
        const activeRoleIds = await fetchActiveRolesByIds(connection, roleIds);
        if (activeRoleIds.length !== roleIds.length) {
            throw new Error('存在无效角色或停用角色');
        }
        await connection.execute(`
        UPDATE admin_user
        SET username = ?,
            display_name = ?,
            phone_number = ?,
            email = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [username, displayName, phoneNumber, email, adminUserId]);
        await replaceAdminUserRoles(connection, adminUserId, activeRoleIds);
        await connection.commit();
        return { id: toEntityId(adminUserId) };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function resetAdminSystemUserPassword(adminUserId, payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const user = await findAdminSystemUserById(connection, adminUserId);
        if (!user) {
            throw new Error('系统用户不存在');
        }
        const passwordHash = await bcrypt.hash(normalizeAdminPassword(payload.newPassword), 10);
        await connection.execute(`
        UPDATE admin_user
        SET password_hash = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [passwordHash, adminUserId]);
        await connection.commit();
        return { id: toEntityId(adminUserId) };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function updateAdminSystemUserStatus(adminUserId, payload, operatorAdminUserId) {
    const db = getDbPool();
    const targetStatus = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const user = await findAdminSystemUserById(connection, adminUserId);
        if (!user) {
            throw new Error('系统用户不存在');
        }
        if (adminUserId === operatorAdminUserId && targetStatus === ADMIN_STATUS_DISABLED) {
            throw new Error('不能停用当前登录账号');
        }
        await connection.execute(`
        UPDATE admin_user
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `, [targetStatus, adminUserId]);
        await connection.commit();
        return {
            id: toEntityId(user.id),
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
export async function updateAdminRoleStatus(roleId, payload) {
    const db = getDbPool();
    const targetStatus = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const role = await findAdminRoleById(connection, roleId);
        if (!role) {
            throw new Error('角色不存在');
        }
        if (Boolean(role.is_system) && targetStatus === ADMIN_STATUS_DISABLED) {
            throw new Error('系统内置角色不允许停用');
        }
        await connection.execute(`
        UPDATE admin_role
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `, [targetStatus, roleId]);
        await connection.commit();
        return {
            id: toEntityId(role.id),
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
export async function updateAdminRolePermissions(roleId, payload) {
    await ensureAdminPermissionCatalogSynced();
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const role = await findAdminRoleById(connection, roleId);
        if (!role) {
            throw new Error('角色不存在');
        }
        if (Number(role.status ?? 0) !== ROLE_STATUS_ACTIVE) {
            throw new Error('停用角色不允许分配权限');
        }
        const permissionIds = uniq((payload.permissionIds ?? [])
            .map((item) => String(item ?? '').trim())
            .filter(Boolean));
        const activeSelectedPermissionIds = await fetchActivePermissionsByIds(connection, permissionIds);
        if (activeSelectedPermissionIds.length !== permissionIds.length) {
            throw new Error('存在无效权限或停用权限');
        }
        const activePermissionIds = await expandRolePermissionIds(connection, activeSelectedPermissionIds);
        await connection.execute(`
        DELETE FROM admin_role_permission
        WHERE role_id = ?
      `, [roleId]);
        for (const permissionId of activePermissionIds) {
            await connection.execute(`
          INSERT INTO admin_role_permission (role_id, permission_id, created_at)
          VALUES (?, ?, NOW())
        `, [roleId, permissionId]);
        }
        await connection.commit();
        return {
            id: toEntityId(role.id),
            permissionIds: activePermissionIds.map((item) => toEntityId(item)),
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
export async function createAdminRole(payload) {
    const code = payload.code.trim();
    const name = payload.name.trim();
    if (!code)
        throw new Error('角色编码不能为空');
    if (!name)
        throw new Error('角色名称不能为空');
    const db = getDbPool();
    const [existing] = await db.execute(`SELECT id FROM admin_role WHERE code = ? LIMIT 1`, [code]);
    if (existing.length > 0) {
        throw new Error('角色编码已存在');
    }
    const status = payload.status === 'disabled' ? ADMIN_STATUS_DISABLED : ADMIN_STATUS_ACTIVE;
    const sort = Math.max(0, Math.trunc(Number(payload.sort ?? 0) || 0));
    const [result] = await db.execute(`INSERT INTO admin_role (code, name, description, status, is_system, sort, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, NOW(), NOW())`, [code, name, payload.description?.trim() || null, status, sort]);
    return { id: toEntityId(result.insertId) };
}
export async function updateAdminRole(roleId, payload) {
    const code = payload.code.trim();
    const name = payload.name.trim();
    if (!code)
        throw new Error('角色编码不能为空');
    if (!name)
        throw new Error('角色名称不能为空');
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const role = await findAdminRoleById(connection, roleId);
        if (!role) {
            throw new Error('角色不存在');
        }
        if (Boolean(role.is_system)) {
            throw new Error('系统内置角色不允许编辑');
        }
        const [existing] = await connection.execute(`SELECT id FROM admin_role WHERE code = ? AND id <> ? LIMIT 1`, [code, roleId]);
        if (existing.length > 0) {
            throw new Error('角色编码已存在');
        }
        const sort = Math.max(0, Math.trunc(Number(payload.sort ?? 0) || 0));
        await connection.execute(`
        UPDATE admin_role
        SET code = ?, name = ?, description = ?, sort = ?, updated_at = NOW()
        WHERE id = ?
      `, [code, name, payload.description?.trim() || null, sort, roleId]);
        await connection.commit();
        return { id: toEntityId(role.id) };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getAdminRoles() {
    await ensureAdminPermissionCatalogSynced();
    const rows = await fetchAdminRolesWithStats();
    const items = rows.map((row) => {
        const modules = mapRoleModules(row.permission_modules);
        return {
            id: String(row.id),
            code: row.code,
            name: row.name,
            description: row.description ?? null,
            permissionRange: mapRolePermissionRange(modules),
            permissionModules: modules,
            memberCount: toNumber(row.member_count),
            permissionCount: toNumber(row.permission_count),
            status: mapRoleStatus(row.status),
            isSystem: Boolean(row.is_system),
            sort: toNumber(row.sort),
            createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
            updatedAt: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
        };
    });
    return {
        items,
        summary: {
            total: items.length,
            active: items.filter((item) => item.status === 'active').length,
            disabled: items.filter((item) => item.status === 'disabled').length,
            members: items.reduce((sum, item) => sum + item.memberCount, 0),
        },
    };
}
export async function getAdminPermissionsMatrix() {
    await ensureAdminPermissionCatalogSynced();
    const [roleRows, permissionRows] = await Promise.all([
        fetchAdminRolesWithStats(),
        fetchAdminPermissionsByRole(),
    ]);
    const activeRoles = roleRows.filter((row) => Number(row.status ?? 0) === ROLE_STATUS_ACTIVE);
    const roleItems = activeRoles.map((row) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        status: mapRoleStatus(row.status),
        isSystem: Boolean(row.is_system),
    }));
    const permissionsByModule = new Map();
    const permissionRoleMap = new Map();
    for (const row of permissionRows) {
        const moduleName = row.module?.trim() || '未分组';
        const permissionId = String(row.id);
        let moduleEntry = permissionsByModule.get(moduleName);
        if (!moduleEntry) {
            moduleEntry = {
                module: moduleName,
                permissions: [],
                cells: [],
            };
            permissionsByModule.set(moduleName, moduleEntry);
        }
        if (!moduleEntry.permissions.some((permission) => permission.id === permissionId)) {
            moduleEntry.permissions.push({
                id: permissionId,
                code: row.code,
                name: row.name,
                action: mapPermissionAction(row.action),
                parentId: row.parent_id == null ? null : String(row.parent_id),
                enabledRoleIds: [],
            });
        }
        if (row.role_id == null) {
            continue;
        }
        const roleId = String(row.role_id);
        let rolePermissionMap = permissionRoleMap.get(moduleName);
        if (!rolePermissionMap) {
            rolePermissionMap = new Map();
            permissionRoleMap.set(moduleName, rolePermissionMap);
        }
        const currentRows = rolePermissionMap.get(roleId) ?? [];
        currentRows.push(row);
        rolePermissionMap.set(roleId, currentRows);
    }
    for (const moduleEntry of permissionsByModule.values()) {
        for (const permission of moduleEntry.permissions) {
            const enabledRoleIds = permissionRows
                .filter((row) => String(row.id) === permission.id &&
                row.role_id != null &&
                activeRoles.some((role) => String(role.id) === String(row.role_id)))
                .map((row) => String(row.role_id));
            permission.enabledRoleIds = uniq(enabledRoleIds);
        }
        const modulePermissionMap = permissionRoleMap.get(moduleEntry.module) ?? new Map();
        moduleEntry.cells = roleItems.map((role) => {
            const rowsForRole = modulePermissionMap.get(role.id) ?? [];
            const permissionCodes = uniq(rowsForRole.map((row) => row.code));
            const permissionNames = uniq(rowsForRole.map((row) => row.name));
            const level = rowsForRole.reduce((currentLevel, row) => {
                const nextLevel = normalizePermissionLevel(mapPermissionAction(row.action));
                return permissionLevelWeight(nextLevel) > permissionLevelWeight(currentLevel)
                    ? nextLevel
                    : currentLevel;
            }, 'none');
            return {
                roleId: role.id,
                roleCode: role.code,
                roleName: role.name,
                level,
                permissionCodes,
                permissionNames,
            };
        });
    }
    const modules = Array.from(permissionsByModule.values()).sort((left, right) => left.module.localeCompare(right.module, 'zh-CN'));
    return {
        roles: roleItems,
        modules,
        summary: {
            roles: roleItems.length,
            modules: modules.length,
            permissions: permissionRows
                .filter((row) => Number(row.status ?? 0) === PERMISSION_STATUS_ACTIVE)
                .map((row) => String(row.id))
                .filter((value, index, array) => array.indexOf(value) === index).length,
        },
    };
}
export async function getAdminPermissions() {
    await ensureAdminPermissionCatalogSynced();
    const rows = await fetchAdminPermissionRows();
    const items = rows.map((row) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        module: row.module?.trim() || '未分组',
        action: mapPermissionAction(row.action),
        parentId: row.parent_id == null ? null : String(row.parent_id),
        parentName: row.parent_name ?? null,
        status: mapPermissionStatus(row.status),
        sort: toNumber(row.sort),
        assignedRoleCount: toNumber(row.assigned_role_count),
        isBuiltIn: findAdminPermissionDefinitionByCode(row.code) != null,
    }));
    return {
        items,
        summary: {
            total: items.length,
            active: items.filter((item) => item.status === 'active').length,
            disabled: items.filter((item) => item.status === 'disabled').length,
            modules: uniq(items.map((item) => item.module)).length,
        },
    };
}
export async function createAdminPermission(payload) {
    const code = normalizeAdminPermissionCode(payload.code);
    const name = normalizeAdminPermissionName(payload.name);
    const module = normalizeAdminPermissionModule(payload.module);
    const action = normalizeAdminPermissionAction(payload.action);
    const parentId = normalizeAdminPermissionParentId(payload.parentId ? String(payload.parentId) : null);
    const sort = toNumber(payload.sort ?? 0);
    const status = toPermissionStatusCode(payload.status ?? 'active');
    const db = getDbPool();
    if (await findAdminPermissionByCode(db, code)) {
        throw new Error('权限编码已存在');
    }
    if (parentId) {
        const parent = await fetchAdminPermissionById(parentId);
        if (!parent) {
            throw new Error('父权限不存在');
        }
    }
    const [result] = await db.execute(`
      INSERT INTO admin_permission (
        code,
        name,
        module,
        action,
        parent_id,
        status,
        sort,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [code, name, module, toPermissionActionCode(action), parentId, status, sort]);
    return {
        id: toEntityId(result.insertId),
    };
}
export async function updateAdminPermission(permissionId, payload) {
    const permission = await fetchAdminPermissionById(permissionId);
    if (!permission) {
        throw new Error('权限不存在');
    }
    if (findAdminPermissionDefinitionByCode(permission.code)) {
        throw new Error('系统内置权限不允许编辑');
    }
    const code = normalizeAdminPermissionCode(payload.code);
    const name = normalizeAdminPermissionName(payload.name);
    const module = normalizeAdminPermissionModule(payload.module);
    const action = normalizeAdminPermissionAction(payload.action);
    const parentId = normalizeAdminPermissionParentId(payload.parentId ? String(payload.parentId) : null);
    const sort = toNumber(payload.sort ?? 0);
    const db = getDbPool();
    if (await findAdminPermissionByCode(db, code, permissionId)) {
        throw new Error('权限编码已存在');
    }
    if (parentId) {
        if (parentId === permissionId) {
            throw new Error('父权限不能是自己');
        }
        const parent = await fetchAdminPermissionById(parentId);
        if (!parent) {
            throw new Error('父权限不存在');
        }
        if (await wouldCreatePermissionCycle(permissionId, parentId)) {
            throw new Error('父权限不能是自己的子权限');
        }
    }
    await db.execute(`
      UPDATE admin_permission
      SET
        code = ?,
        name = ?,
        module = ?,
        action = ?,
        parent_id = ?,
        sort = ?
      WHERE id = ?
    `, [code, name, module, toPermissionActionCode(action), parentId, sort, permissionId]);
    return {
        id: toEntityId(permission.id),
    };
}
export async function updateAdminPermissionStatus(permissionId, payload) {
    const permission = await fetchAdminPermissionById(permissionId);
    if (!permission) {
        throw new Error('权限不存在');
    }
    const db = getDbPool();
    const targetStatus = toPermissionStatusCode(payload.status);
    if (payload.status === 'disabled') {
        const descendantIds = await collectAdminPermissionDescendantIds(db, permissionId);
        const affectedIds = [permissionId, ...descendantIds];
        const placeholders = affectedIds.map(() => '?').join(', ');
        await db.execute(`
        UPDATE admin_permission
        SET status = ?
        WHERE id IN (${placeholders})
      `, [targetStatus, ...affectedIds]);
    }
    else {
        await db.execute(`
        UPDATE admin_permission
        SET status = ?
        WHERE id = ?
      `, [targetStatus, permissionId]);
    }
    return {
        id: toEntityId(permission.id),
        status: payload.status,
    };
}
