import type { InviteRecordListResult } from '@umi/shared';

import { getJson } from './shared';

export function fetchMyInviteRecords() {
  return getJson<InviteRecordListResult>('/api/invite/records');
}
