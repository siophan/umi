import { getJson } from './shared';
import type { AdminChatDetailResult, AdminChatListResult } from './system-shared';

export function fetchAdminChats() {
  return getJson<AdminChatListResult>('/api/admin/chats');
}

export function fetchAdminChatDetail(conversationId: string) {
  return getJson<AdminChatDetailResult>(
    `/api/admin/chats/${encodeURIComponent(conversationId)}`,
  );
}
