import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';

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

type AdminSystemUserRow = {
  id: number | string;
  username: string;
  display_name: string | null;
  phone_number: string | null;
  email: string | null;
  status: number | string;
  last_login_at: Date | string | null;
  created_at: Date | string;
  role_names: string | null;
  role_codes: string | null;
};

type AdminRoleRow = {
  id: number | string;
  code: string;
  name: string;
  description: string | null;
  status: number | string;
  is_system: number | boolean;
  sort: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  member_count: number | string;
  permission_count: number | string;
  permission_modules: string | null;
};

type AdminPermissionRow = {
  id: number | string;
  code: string;
  name: string;
  module: string | null;
  action: number | string | null;
  parent_id: number | string | null;
  status: number | string;
  sort: number | string;
  role_id: number | string | null;
};

type AdminNotificationRow = {
  notification_key: string;
  title: string | null;
  content: string | null;
  type: number | string | null;
  target_type: number | string | null;
  target_id: number | string | null;
  action_url: string | null;
  recipient_count: number | string;
  read_count: number | string;
  unread_count: number | string;
  first_created_at: Date | string;
  last_created_at: Date | string;
};

type AdminChatRow = {
  conversation_key: string;
  user_a_id: number | string;
  user_b_id: number | string;
  user_a_name: string | null;
  user_b_name: string | null;
  user_a_uid: string | null;
  user_b_uid: string | null;
  user_a_risk_level: number | string | null;
  user_b_risk_level: number | string | null;
  message_count: number | string;
  unread_message_count: number | string;
  updated_at: Date | string;
};

export type AdminNotificationStatus = 'sent';
export type AdminNotificationAudience =
  | 'all_users'
  | 'order_users'
  | 'guess_users'
  | 'post_users'
  | 'chat_users'
  | 'targeted_users';
export type AdminNotificationType = 'system' | 'order' | 'guess' | 'social';

export interface AdminNotificationItem {
  id: string;
  title: string;
  audience: AdminNotificationAudience;
  type: AdminNotificationType;
  status: AdminNotificationStatus;
  targetType: 'order' | 'guess' | 'post' | 'chat' | 'unknown';
  targetId: string | null;
  actionUrl: string | null;
  recipientCount: number;
  readCount: number;
  unreadCount: number;
  createdAt: string;
  sentAt: string;
}

export interface AdminNotificationListResult {
  items: AdminNotificationItem[];
  summary: {
    total: number;
    sent: number;
    read: number;
    unread: number;
  };
  basis: string;
}

export type AdminChatRiskLevel = 'low' | 'medium' | 'high';
export type AdminChatStatus = 'normal' | 'review' | 'escalated';

export interface AdminChatItem {
  id: string;
  userA: {
    id: string;
    uid: string | null;
    name: string;
  };
  userB: {
    id: string;
    uid: string | null;
    name: string;
  };
  messages: number;
  unreadMessages: number;
  riskLevel: AdminChatRiskLevel;
  status: AdminChatStatus;
  updatedAt: string;
}

export interface AdminChatListResult {
  items: AdminChatItem[];
  summary: {
    total: number;
    review: number;
    escalated: number;
    highRisk: number;
  };
  basis: string;
}

export interface AdminSystemUserItem {
  id: string;
  username: string;
  displayName: string;
  phoneNumber: string | null;
  email: string | null;
  role: string;
  roleCodes: string[];
  status: 'active' | 'disabled';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSystemUserListResult {
  items: AdminSystemUserItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
  };
}

export interface AdminRoleListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: string;
  memberCount: number;
  permissionCount: number;
  status: 'active' | 'disabled';
  isSystem: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoleListResult {
  items: AdminRoleListItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    members: number;
  };
}

export type AdminPermissionAction = 'view' | 'create' | 'edit' | 'manage' | 'unknown';
export type AdminPermissionLevel = 'none' | 'view' | 'create' | 'edit' | 'manage';

export interface AdminPermissionMatrixCell {
  roleId: string;
  roleCode: string;
  roleName: string;
  level: AdminPermissionLevel;
  permissionCodes: string[];
  permissionNames: string[];
}

export interface AdminPermissionMatrixPermission {
  id: string;
  code: string;
  name: string;
  action: AdminPermissionAction;
  parentId: string | null;
  enabledRoleIds: string[];
}

export interface AdminPermissionMatrixModule {
  module: string;
  permissions: AdminPermissionMatrixPermission[];
  cells: AdminPermissionMatrixCell[];
}

export interface AdminPermissionMatrixResult {
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: 'active' | 'disabled';
    isSystem: boolean;
  }>;
  modules: AdminPermissionMatrixModule[];
  summary: {
    roles: number;
    modules: number;
    permissions: number;
  };
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toIsoString(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function splitCsv(value: string | null | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

function mapAdminStatus(code: number | string): 'active' | 'disabled' {
  return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}

function mapRoleStatus(code: number | string): 'active' | 'disabled' {
  return Number(code ?? 0) === ADMIN_STATUS_DISABLED ? 'disabled' : 'active';
}

function mapPermissionAction(code: number | string | null | undefined): AdminPermissionAction {
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

function permissionLevelWeight(level: AdminPermissionLevel) {
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

function normalizePermissionLevel(action: AdminPermissionAction): AdminPermissionLevel {
  if (action === 'view' || action === 'create' || action === 'edit' || action === 'manage') {
    return action;
  }
  return 'none';
}

function mapNotificationType(code: number | string | null | undefined): AdminNotificationType {
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

function mapNotificationTargetType(code: number | string | null | undefined) {
  const value = Number(code ?? 0);
  if (value === NOTIFICATION_TARGET_ORDER) {
    return 'order' as const;
  }
  if (value === NOTIFICATION_TARGET_GUESS) {
    return 'guess' as const;
  }
  if (value === NOTIFICATION_TARGET_POST) {
    return 'post' as const;
  }
  if (value === NOTIFICATION_TARGET_CHAT) {
    return 'chat' as const;
  }
  return 'unknown' as const;
}

function mapNotificationAudience(code: number | string | null | undefined): AdminNotificationAudience {
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

function mapRiskLevel(code: number | string | null | undefined): AdminChatRiskLevel {
  const value = Number(code ?? USER_RISK_NORMAL);
  if (value >= USER_RISK_RESTRICTED) {
    return 'high';
  }
  if (value >= USER_RISK_WATCH) {
    return 'medium';
  }
  return 'low';
}

function mapChatStatus(riskLevel: AdminChatRiskLevel): AdminChatStatus {
  if (riskLevel === 'high') {
    return 'escalated';
  }
  if (riskLevel === 'medium') {
    return 'review';
  }
  return 'normal';
}

function mapRoleScope(modules: string[]) {
  if (modules.length === 0) {
    return '未配置权限';
  }
  if (modules.includes('*')) {
    return '全局';
  }
  return modules.join(' / ');
}

function mapRoleModules(rawModules: string | null | undefined) {
  const modules = uniq(splitCsv(rawModules));
  return modules.length > 0 ? modules : ['未分组'];
}

async function fetchAdminSystemUsers() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
        GROUP_CONCAT(DISTINCT ar.code ORDER BY ar.sort ASC, ar.id ASC SEPARATOR ',') AS role_codes
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
    `,
  );

  return rows as AdminSystemUserRow[];
}

async function fetchAdminRolesWithStats() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
        COUNT(DISTINCT arp.permission_id) AS permission_count,
        GROUP_CONCAT(DISTINCT COALESCE(ap.module, '未分组') ORDER BY ap.sort ASC, ap.id ASC SEPARATOR ',') AS permission_modules
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
    `,
  );

  return rows as AdminRoleRow[];
}

async function fetchAdminPermissionsByRole() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [PERMISSION_STATUS_ACTIVE],
  );

  return rows as AdminPermissionRow[];
}

async function fetchAdminNotificationBatches() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        SHA2(
          CONCAT_WS(
            '#',
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
        COUNT(*) AS recipient_count,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS read_count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread_count,
        MIN(created_at) AS first_created_at,
        MAX(created_at) AS last_created_at
      FROM notification
      GROUP BY
        notification_key,
        title,
        content,
        type,
        target_type,
        target_id,
        action_url
      ORDER BY last_created_at DESC, notification_key DESC
      LIMIT 100
    `,
  );

  return rows as AdminNotificationRow[];
}

async function fetchAdminChatRows() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
  );

  return rows as AdminChatRow[];
}

export async function getAdminNotifications(): Promise<AdminNotificationListResult> {
  const rows = await fetchAdminNotificationBatches();
  const items = rows.map<AdminNotificationItem>((row) => ({
    id: row.notification_key,
    title: row.title || '系统通知',
    audience: mapNotificationAudience(row.target_type),
    type: mapNotificationType(row.type),
    status: 'sent',
    targetType: mapNotificationTargetType(row.target_type),
    targetId: row.target_id == null ? null : String(row.target_id),
    actionUrl: row.action_url ?? null,
    recipientCount: toNumber(row.recipient_count),
    readCount: toNumber(row.read_count),
    unreadCount: toNumber(row.unread_count),
    createdAt: toIsoString(row.first_created_at) ?? new Date(0).toISOString(),
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
    basis:
      '基于 notification 真表按消息载荷聚合为发送批次视图；当前没有 admin 通知草稿/调度专表，因此这里只覆盖已发送记录。',
  };
}

export async function getAdminChats(): Promise<AdminChatListResult> {
  const rows = await fetchAdminChatRows();
  const items = rows.map<AdminChatItem>((row) => {
    const riskLevel = mapRiskLevel(
      Math.max(
        toNumber(row.user_a_risk_level ?? USER_RISK_NORMAL),
        toNumber(row.user_b_risk_level ?? USER_RISK_NORMAL),
      ),
    );

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
    basis:
      '基于 chat_message 真表按用户对聚合唯一会话，风险等级取双方 user.risk_level 的较高值；当前没有 admin 聊天抽检专表。',
  };
}

export async function getAdminSystemUsers(): Promise<AdminSystemUserListResult> {
  const rows = await fetchAdminSystemUsers();
  const items = rows.map<AdminSystemUserItem>((row) => ({
    id: String(row.id),
    username: row.username,
    displayName: row.display_name || row.username,
    phoneNumber: row.phone_number ?? null,
    email: row.email ?? null,
    role: splitCsv(row.role_names).join(' / ') || '未分配角色',
    roleCodes: splitCsv(row.role_codes),
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

export async function getAdminRoles(): Promise<AdminRoleListResult> {
  const rows = await fetchAdminRolesWithStats();
  const items = rows.map<AdminRoleListItem>((row) => {
    const modules = mapRoleModules(row.permission_modules);

    return {
      id: String(row.id),
      code: row.code,
      name: row.name,
      description: row.description ?? null,
      scope: mapRoleScope(modules),
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

export async function getAdminPermissionsMatrix(): Promise<AdminPermissionMatrixResult> {
  const [roleRows, permissionRows] = await Promise.all([
    fetchAdminRolesWithStats(),
    fetchAdminPermissionsByRole(),
  ]);

  const activeRoles = roleRows.filter(
    (row) => Number(row.status ?? 0) === ROLE_STATUS_ACTIVE,
  );

  const roleItems = activeRoles.map((row) => ({
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    status: mapRoleStatus(row.status),
    isSystem: Boolean(row.is_system),
  }));

  const permissionsByModule = new Map<string, AdminPermissionMatrixModule>();
  const permissionRoleMap = new Map<string, Map<string, AdminPermissionRow[]>>();

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
      rolePermissionMap = new Map<string, AdminPermissionRow[]>();
      permissionRoleMap.set(moduleName, rolePermissionMap);
    }

    const currentRows = rolePermissionMap.get(roleId) ?? [];
    currentRows.push(row);
    rolePermissionMap.set(roleId, currentRows);
  }

  for (const moduleEntry of permissionsByModule.values()) {
    for (const permission of moduleEntry.permissions) {
      const enabledRoleIds = permissionRows
        .filter(
          (row) =>
            String(row.id) === permission.id &&
            row.role_id != null &&
            activeRoles.some((role) => String(role.id) === String(row.role_id)),
        )
        .map((row) => String(row.role_id));
      permission.enabledRoleIds = uniq(enabledRoleIds);
    }

    const modulePermissionMap =
      permissionRoleMap.get(moduleEntry.module) ?? new Map<string, AdminPermissionRow[]>();
    moduleEntry.cells = roleItems.map((role) => {
      const rowsForRole: AdminPermissionRow[] = modulePermissionMap.get(role.id) ?? [];
      const permissionCodes = uniq(rowsForRole.map((row) => row.code));
      const permissionNames = uniq(rowsForRole.map((row) => row.name));
      const level = rowsForRole.reduce<AdminPermissionLevel>((currentLevel, row) => {
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

  const modules = Array.from(permissionsByModule.values()).sort((left, right) =>
    left.module.localeCompare(right.module, 'zh-CN'),
  );

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
