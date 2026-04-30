import type { CreateAdminGuessPayload } from '@umi/shared';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { AdminCategoryItem } from './api/categories';
import type { AdminProduct } from './api/catalog';

export interface GuessCreateFormValues {
  title: string;
  categoryId: CreateAdminGuessPayload['categoryId'];
  productId: CreateAdminGuessPayload['productId'];
  endTime: Dayjs | null;
  description?: string;
  optionTexts: Array<{ text: string }>;
}

export const GUESS_CREATE_INITIAL_VALUES: Pick<
  GuessCreateFormValues,
  'endTime' | 'optionTexts'
> = {
  endTime: dayjs().add(1, 'day').startOf('hour'),
  optionTexts: [{ text: '会' }, { text: '不会' }],
};

export function buildGuessCategoryOptions(categories: AdminCategoryItem[]) {
  return categories.map((item) => ({
    label: item.name,
    value: item.id,
  }));
}

export function buildProductOptionLabel(product: AdminProduct) {
  return `${product.name}｜${product.brand}｜${product.shopName || '平台商品'}`;
}

export function buildGuessPreviewOptions(optionValues?: Array<{ text?: string }>) {
  return (optionValues ?? [])
    .map((item) => item?.text?.trim())
    .filter((item): item is string => Boolean(item));
}

export function toCreateGuessPayload(values: GuessCreateFormValues): CreateAdminGuessPayload {
  return {
    title: values.title,
    categoryId: values.categoryId,
    productId: values.productId,
    endTime: values.endTime?.toISOString() ?? '',
    description: values.description?.trim() || null,
    optionTexts: values.optionTexts.map((item) => item.text),
  };
}
