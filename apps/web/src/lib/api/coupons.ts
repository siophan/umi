import type { CouponListItem } from '@umi/shared';

import { getJson } from './shared';

export function fetchCoupons() {
  return getJson<CouponListItem[]>('/api/coupons');
}
