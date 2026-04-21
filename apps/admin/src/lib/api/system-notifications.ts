import type {
  CreateAdminNotificationPayload,
  CreateAdminNotificationResult,
} from '@umi/shared';

import { getJson, postJson } from './shared';
import type { AdminNotificationListResult } from './system-shared';

type FetchAdminNotificationsParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  type?: 'system' | 'order' | 'guess' | 'social';
  audience?: 'all_users' | 'order_users' | 'guess_users' | 'post_users' | 'chat_users';
};

function buildNotificationQuery(params: FetchAdminNotificationsParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', String(params.pageSize));
  if (params.keyword?.trim()) {
    searchParams.set('keyword', params.keyword.trim());
  }
  if (params.type) {
    searchParams.set('type', params.type);
  }
  if (params.audience) {
    searchParams.set('audience', params.audience);
  }
  return searchParams.toString();
}

export function fetchAdminNotifications(params: FetchAdminNotificationsParams) {
  return getJson<AdminNotificationListResult>(
    `/api/admin/notifications?${buildNotificationQuery(params)}`,
  );
}

export function createAdminNotification(payload: CreateAdminNotificationPayload) {
  return postJson<CreateAdminNotificationResult, CreateAdminNotificationPayload>(
    '/api/admin/notifications',
    payload,
  );
}
