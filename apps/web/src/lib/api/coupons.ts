import type { CouponListItem } from '@umi/shared';

import { getJson } from './shared';

// 读取当前用户优惠券列表。
export function fetchCoupons() {
  return getJson<CouponListItem[]>('/api/coupons');
}
