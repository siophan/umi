import type { ClaimCouponResult, CouponListItem, CouponTemplateListResult } from '@umi/shared';

import { getJson, postJson } from './shared';

// 读取当前用户优惠券列表。
export function fetchCoupons() {
  return getJson<CouponListItem[]>('/api/coupons');
}

export function fetchCouponTemplates(options: { shopId?: string } = {}) {
  const search = new URLSearchParams();
  if (options.shopId) search.set('shopId', options.shopId);
  const suffix = search.toString();
  return getJson<CouponTemplateListResult>(
    `/api/coupons/templates${suffix ? `?${suffix}` : ''}`,
  );
}

export function claimCouponTemplate(templateId: string) {
  return postJson<ClaimCouponResult, Record<string, never>>(
    `/api/coupons/claim/${templateId}`,
    {},
  );
}
