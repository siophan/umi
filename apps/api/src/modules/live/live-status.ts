import type { LiveStatus } from '@umi/shared';

export const LIVE_STATUS_UPCOMING = 10;
export const LIVE_STATUS_LIVE = 20;
export const LIVE_STATUS_ENDED = 30;
export const LIVE_STATUS_BANNED = 90;
export const PUBLIC_LIVE_STATUSES = [LIVE_STATUS_UPCOMING, LIVE_STATUS_LIVE] as const;

export type LiveStatusKey = 'upcoming' | 'live' | 'ended' | 'banned';

export function deriveLiveStatusKey(
  rawStatus: number | string | null | undefined,
  startTime: Date | string | null | undefined,
): LiveStatusKey {
  const code = rawStatus == null ? null : Number(rawStatus);
  if (code === LIVE_STATUS_ENDED) {
    return 'ended';
  }
  if (code === LIVE_STATUS_BANNED) {
    return 'banned';
  }
  const startValue = startTime ? new Date(startTime).getTime() : null;
  if (code === LIVE_STATUS_UPCOMING || (startValue != null && startValue > Date.now())) {
    return 'upcoming';
  }
  return 'live';
}

export function toPublicLiveStatus(key: LiveStatusKey): LiveStatus {
  if (key === 'ended' || key === 'banned') {
    throw new Error(`unexpected live status "${key}" in public surface`);
  }
  return key;
}
