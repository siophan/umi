import type { NotificationId, NotificationListResult } from '@umi/shared';

import { getJson, postJson } from './shared';

export async function fetchNotifications() {
  return getJson<NotificationListResult>('/api/notifications');
}

export async function markAllNotificationsRead() {
  return postJson<{ success: true }, Record<string, never>>('/api/notifications/read-all', {});
}

export async function markNotificationRead(notificationId: NotificationId) {
  return postJson<{ success: true }, Record<string, never>>(
    `/api/notifications/${encodeURIComponent(String(notificationId))}/read`,
    {},
  );
}
