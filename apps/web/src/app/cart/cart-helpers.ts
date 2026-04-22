import type { CartItem as CartLineItem } from "@umi/shared";

/**
 * 把未知错误收成页面可直接展示的文案。
 */
export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * 购物车分组 key。
 * 这里按品牌优先分组，和老购物车页的店铺头展示口径保持一致。
 */
export function getGroupKey(item: CartLineItem) {
  return item.brand?.trim() || item.shop?.trim() || "其他";
}

/**
 * 生成购物车店头文案。
 * 优先展示真实店铺名，缺失时再退回“品牌旗舰店”口径。
 */
export function getDisplayShopName(item: CartLineItem) {
  if (item.shop?.trim() && item.shop !== "未知店铺") {
    return item.shop;
  }
  const groupKey = getGroupKey(item);
  return `${groupKey}旗舰店`;
}

