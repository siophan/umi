import type {
  ChatConversationListResult,
  ChatDetailResult,
  SendChatMessagePayload,
} from '@umi/shared';

import { getJson, postJson } from './shared';

export async function fetchChats() {
  return getJson<ChatConversationListResult>('/api/chats');
}

export async function fetchChatDetail(userId: string) {
  return getJson<ChatDetailResult>(`/api/chats/${userId}`);
}

export async function sendChatMessage(userId: string, payload: SendChatMessagePayload) {
  return postJson<ChatDetailResult['items'][number], SendChatMessagePayload>(`/api/chats/${userId}`, payload);
}
