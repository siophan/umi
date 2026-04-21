import type { GuessOption, ProductDetailResult, WarehouseItem } from '@umi/shared';

export type ProductMode = 'direct' | 'guess' | 'inv';

export type ActiveGuessDetail = {
  id: string;
  title: string;
  endTime: string;
  options: GuessOption[];
};

export type ProductDetailData = ProductDetailResult['product'];

export function formatPriceNumber(value: number) {
  return value.toFixed(2).replace(/\.00$/, '');
}

export function buildGuessCountdown(endTime: string, now: number) {
  const diff = Math.max(0, new Date(endTime).getTime() - now);
  return {
    hours: String(Math.floor(diff / 3600000)).padStart(2, '0'),
    minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
    seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
  };
}

export function sumWarehouseValue(items: WarehouseItem[]) {
  return items.reduce((sum, item) => sum + Number(item.price ?? 0), 0);
}
