'use client';

import type { CouponListItem } from '@umi/shared';

export type PaymentProduct = {
  productId: string;
  brandProductSkuId?: string;
  cartItemId?: string;
  name: string;
  price: number;
  qty: number;
  orig: number;
  img: string;
};

export const PAYMENT_SERVICE_TAGS: ReadonlyArray<{ icon: string; label: string }> = [
  { icon: 'fa-shield-halved', label: '正品保证' },
  { icon: 'fa-truck-fast', label: '顺丰包邮' },
  { icon: 'fa-rotate-left', label: '7天退换' },
  { icon: 'fa-lock', label: '安全支付' },
  { icon: 'fa-headset', label: '极速客服' },
  { icon: 'fa-gift', label: '赠运费险' },
];

/**
 * 解析优惠券使用门槛。
 * 当前 condition 仍是文案字段，这里先按数字门槛做轻解析。
 */
export function parseCouponCondition(condition: string) {
  const match = condition.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

/**
 * 计算当前订单可抵扣的优惠金额。
 * 这里只处理前端展示和下单前校验，真实优惠口径仍以后端创建订单为准。
 */
export function getCouponDiscount(coupon: CouponListItem | null, subtotal: number) {
  if (!coupon || coupon.status !== 'unused') {
    return 0;
  }

  const threshold = parseCouponCondition(coupon.condition);
  if (threshold > 0 && subtotal < threshold) {
    return 0;
  }

  if (coupon.type === 'amount' || coupon.type === 'shipping') {
    return Math.min(subtotal, coupon.amount);
  }

  if (coupon.type === 'percent') {
    const rate = Math.max(0, Math.min(100, coupon.amount));
    return Number(((subtotal * (100 - rate)) / 100).toFixed(2));
  }

  return 0;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
