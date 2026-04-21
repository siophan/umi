import type {
  AdminPermissionMutationResult,
  CreateAdminNotificationPayload,
  CreateAdminNotificationResult,
  EntityId,
  CreateAdminPermissionPayload,
  CreateAdminRolePayload,
  CreateAdminRoleResult,
  AdminSystemUserMutationResult,
  CreateAdminSystemUserPayload,
  ResetAdminSystemUserPasswordPayload,
  UpdateAdminPermissionPayload,
  UpdateAdminPermissionStatusPayload,
  UpdateAdminPermissionStatusResult,
  UpdateAdminRolePayload,
  UpdateAdminRoleResult,
  UpdateAdminRolePermissionsPayload,
  UpdateAdminRolePermissionsResult,
  UpdateAdminRoleStatusPayload,
  UpdateAdminRoleStatusResult,
  UpdateAdminSystemUserPayload,
  UpdateAdminSystemUserStatusPayload,
  UpdateAdminSystemUserStatusResult,
} from '@umi/shared';

import { getJson, postJson, putJson } from './shared';

export interface AdminNotificationItem {
  id: string;
  title: string;
  content: string | null;
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
  roleIds: EntityId[];
  status: 'active' | 'disabled';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminRoleListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissionRange: string;
  permissionModules: string[];
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

export interface AdminPermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  action: 'view' | 'create' | 'edit' | 'manage' | 'unknown';
  parentId: string | null;
  parentName: string | null;
  status: 'active' | 'disabled';
  sort: number;
  assignedRoleCount: number;
  isBuiltIn: boolean;
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

type AdminPermissionListResult = {
  items: AdminPermissionItem[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    modules: number;
  };
};

export function fetchAdminNotifications() {
  return getJson<AdminNotificationListResult>('/api/admin/notifications');
}

export function createAdminNotification(payload: CreateAdminNotificationPayload) {
  return postJson<CreateAdminNotificationResult, CreateAdminNotificationPayload>(
    '/api/admin/notifications',
    payload,
  );
}

export function fetchAdminChats() {
  return getJson<AdminChatListResult>('/api/admin/chats');
}

export function fetchAdminSystemUsers() {
  return getJson<AdminSystemUserListResult>('/api/admin/system-users');
}

export function createAdminSystemUser(payload: CreateAdminSystemUserPayload) {
  return postJson<AdminSystemUserMutationResult, CreateAdminSystemUserPayload>(
    '/api/admin/system-users',
    payload,
  );
}

export function updateAdminSystemUser(
  id: string,
  payload: UpdateAdminSystemUserPayload,
) {
  return putJson<AdminSystemUserMutationResult, UpdateAdminSystemUserPayload>(
    `/api/admin/system-users/${id}`,
    payload,
  );
}

export function resetAdminSystemUserPassword(
  id: string,
  payload: ResetAdminSystemUserPasswordPayload,
) {
  return postJson<AdminSystemUserMutationResult, ResetAdminSystemUserPasswordPayload>(
    `/api/admin/system-users/${id}/reset-password`,
    payload,
  );
}

export function updateAdminSystemUserStatus(
  id: string,
  payload: UpdateAdminSystemUserStatusPayload,
) {
  return putJson<UpdateAdminSystemUserStatusResult, UpdateAdminSystemUserStatusPayload>(
    `/api/admin/system-users/${id}/status`,
    payload,
  );
}

export function fetchAdminRoles() {
  return getJson<AdminRoleListResult>('/api/admin/roles');
}

export function createAdminRole(payload: CreateAdminRolePayload) {
  return postJson<CreateAdminRoleResult, CreateAdminRolePayload>('/api/admin/roles', payload);
}

export function updateAdminRole(id: string, payload: UpdateAdminRolePayload) {
  return putJson<UpdateAdminRoleResult, UpdateAdminRolePayload>(
    `/api/admin/roles/${id}`,
    payload,
  );
}

export function updateAdminRoleStatus(
  id: string,
  payload: UpdateAdminRoleStatusPayload,
) {
  return putJson<UpdateAdminRoleStatusResult, UpdateAdminRoleStatusPayload>(
    `/api/admin/roles/${id}/status`,
    payload,
  );
}

export function updateAdminRolePermissions(
  id: string,
  payload: UpdateAdminRolePermissionsPayload,
) {
  return putJson<UpdateAdminRolePermissionsResult, UpdateAdminRolePermissionsPayload>(
    `/api/admin/roles/${id}/permissions`,
    payload,
  );
}

export function fetchAdminPermissions() {
  return getJson<AdminPermissionListResult>('/api/admin/permissions');
}

export function createAdminPermission(payload: CreateAdminPermissionPayload) {
  return postJson<AdminPermissionMutationResult, CreateAdminPermissionPayload>(
    '/api/admin/permissions',
    payload,
  );
}

export function updateAdminPermission(
  id: string,
  payload: UpdateAdminPermissionPayload,
) {
  return putJson<AdminPermissionMutationResult, UpdateAdminPermissionPayload>(
    `/api/admin/permissions/${id}`,
    payload,
  );
}

export function updateAdminPermissionStatus(
  id: string,
  payload: UpdateAdminPermissionStatusPayload,
) {
  return putJson<UpdateAdminPermissionStatusResult, UpdateAdminPermissionStatusPayload>(
    `/api/admin/permissions/${id}/status`,
    payload,
  );
}

export function fetchAdminPermissionsMatrix() {
  return getJson<AdminPermissionMatrixData>('/api/admin/permissions/matrix');
}
