import type { CheckinResult, CheckinStatus } from '@umi/shared';

import { getJson, postJson } from './shared';

export function fetchCheckinStatus() {
  return getJson<CheckinStatus>('/api/checkin/status');
}

export function submitCheckin() {
  return postJson<CheckinResult, Record<string, never>>('/api/checkin', {});
}
