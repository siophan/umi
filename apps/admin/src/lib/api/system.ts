import type {
  AdminCategoryItem,
  AdminChatItem,
  AdminNotificationItem,
  AdminPermissionMatrixData,
  AdminRoleListItem,
  AdminSystemUserItem,
} from '../admin-data';
import { getJson } from './shared';

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
