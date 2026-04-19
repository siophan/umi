import type { AdminCategoryItem } from './catalog';
import { getJson } from './shared';

export interface AdminNotificationItem {
  id: string;
  title: string;
  audience: 'all_users' | 'order_users' | 'guess_users' | 'post_users' | 'chat_users' | 'targeted_users';
  type: 'system' | 'order' | 'guess' | 'social';
  status: 'sent';
  targetType: 'order' | 'guess' | 'post' | 'chat' | 'unknown';
  targetId: string | null;
  actionUrl: string | null;
  recipientCount: number;
  readCount: number;
  unreadCount: number;
  createdAt: string;
  sentAt: string;
}

export interface AdminChatItem {
  id: string;
  userA: { id: string; uid: string | null; name: string };
  userB: { id: string; uid: string | null; name: string };
  messages: number;
  unreadMessages: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'normal' | 'review' | 'escalated';
  updatedAt: string;
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

export interface AdminPermissionMatrixPermission {
  id: string;
  code: string;
  name: string;
  action: 'view' | 'create' | 'edit' | 'manage' | 'unknown';
  parentId: string | null;
  enabledRoleIds: string[];
}

export interface AdminPermissionMatrixCell {
  roleId: string;
  roleCode: string;
  roleName: string;
  level: 'none' | 'view' | 'create' | 'edit' | 'manage';
  permissionCodes: string[];
  permissionNames: string[];
}

export interface AdminPermissionMatrixModule {
  module: string;
  permissions: AdminPermissionMatrixPermission[];
  cells: AdminPermissionMatrixCell[];
}

export interface AdminPermissionMatrixData {
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

type AdminNotificationListResult = {
  items: AdminNotificationItem[];
  summary: {
    total: number;
    sent: number;
    read: number;
    unread: number;
  };
  basis: string;
};

type AdminChatListResult = {
  items: AdminChatItem[];
  summary: {
    total: number;
    review: number;
    escalated: number;
    highRisk: number;
  };
  basis: string;
};

type AdminSystemUserListResult = {
  items: AdminSystemUserItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
  };
};

type AdminRoleListResult = {
  items: AdminRoleListItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    members: number;
  };
};

type AdminCategoryListResult = {
  items: AdminCategoryItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    byBizType: Record<string, number>;
  };
};

export function fetchAdminNotifications() {
  return getJson<AdminNotificationListResult>('/api/admin/notifications');
}

export function fetchAdminChats() {
  return getJson<AdminChatListResult>('/api/admin/chats');
}

export function fetchAdminSystemUsers() {
  return getJson<AdminSystemUserListResult>('/api/admin/system-users');
}

export function fetchAdminRoles() {
  return getJson<AdminRoleListResult>('/api/admin/roles');
}

export function fetchAdminPermissionsMatrix() {
  return getJson<AdminPermissionMatrixData>('/api/admin/permissions/matrix');
}

export function fetchAdminCategories() {
  return getJson<AdminCategoryListResult>('/api/admin/categories');
}
