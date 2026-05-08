import type { ClaimCouponResult, CouponListItem, CouponTemplateListResult } from '@umi/shared';

import { getJson, postJson } from './shared';

// 读取当前用户优惠券列表。
export function fetchCoupons() {
  return getJson<CouponListItem[]>('/api/coupons');
}

export function fetchCouponTemplates(
  options: { brandId?: string; brandProductId?: string } = {},
) {
  const search = new URLSearchParams();
  if (options.brandId) search.set('brandId', options.brandId);
  if (options.brandProductId) search.set('brandProductId', options.brandProductId);
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
