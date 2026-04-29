import type { ProColumns } from '@ant-design/pro-components';
import type { EntityId } from '@umi/shared';
import { Button, Tag, Typography } from 'antd';

import type { AdminBrandLibraryItem, AdminBrandProductSpecRow } from './api/catalog';
import type { AdminCategoryItem } from './api/categories';
import type { AdminBrandItem } from './api/merchant';
import { formatAmount, formatDate, formatDateTime, formatNumber } from './format';

export interface BrandLibraryPageData {
  brandLibrary: AdminBrandLibraryItem[];
  brands: AdminBrandItem[];
  categories: AdminCategoryItem[];
}

export type BrandLibraryFilters = {
  productName?: string;
  brandId?: EntityId;
  categoryId?: EntityId;
};

export type BrandProductFormValues = {
  brandId: EntityId;
  name: string;
  categoryId: EntityId;
  guidePriceYuan: number;
  supplyPriceYuan?: number;
  defaultImg?: string;
  imageList?: string[];
  description?: string;
  status: AdminBrandLibraryItem['status'];
  videoUrl?: string;
  detailHtml?: string;
  specTable?: AdminBrandProductSpecRow[];
  packageList?: { value: string }[];
  freightYuan?: number;
  shipFrom?: string;
  deliveryDays?: string;
};

export const EMPTY_BRAND_LIBRARY_DATA: BrandLibraryPageData = {
  brandLibrary: [],
  brands: [],
  categories: [],
};

export function centsToYuan(value: number) {
  return value / 100;
}

export function yuanToCents(value?: number | null) {
  if (value == null) {
    return null;
  }

  return Math.round(value * 100);
}

export function formatCategoryLabel(
  item: Pick<AdminCategoryItem, 'name' | 'parentName' | 'id' | 'status'>,
  options?: { currentTag?: string; disabledTag?: string },
) {
  const parts = [item.name];
  if (item.parentName) {
    parts.push(item.parentName);
  }
  parts.push(`ID:${item.id}`);
  const suffix: string[] = [];
  if (item.status === 'disabled' && options?.disabledTag) {
    suffix.push(options.disabledTag);
  }
  if (options?.currentTag) {
    suffix.push(options.currentTag);
  }
  const base = parts.join(' / ');
  return suffix.length > 0 ? `${base}（${suffix.join('，')}）` : base;
}

export function buildBrandFilterOptions(data: BrandLibraryPageData) {
  const allBrands = data.brands.map((item) => ({
    label: item.status === 'disabled' ? `${item.name}（停用）` : item.name,
    value: item.id as EntityId,
  }));
  if (allBrands.length > 0) {
    return allBrands;
  }
  return Array.from(
    new Map(
      data.brandLibrary.map((item) => [
        item.brandId as EntityId,
        { label: item.brandName, value: item.brandId as EntityId },
      ]),
    ).values(),
  ).filter((item) => item.value);
}

export function buildCategoryFilterOptions(data: BrandLibraryPageData) {
  const allCategories = data.categories
    .filter((item) => item.bizType === 'product')
    .map((item) => ({
      label: formatCategoryLabel(item, { disabledTag: '停用' }),
      value: item.id as EntityId,
    }));
  if (allCategories.length > 0) return allCategories;
  return Array.from(
    new Map(
      data.brandLibrary.map((item) => [
        item.categoryId as EntityId,
        { label: item.category, value: item.categoryId as EntityId },
      ]),
    ).values(),
  ).filter((item) => item.value);
}

export function buildBrandIdOptions(
  data: BrandLibraryPageData,
  editingItem: AdminBrandLibraryItem | null,
) {
  const options = new Map<EntityId, { label: string; value: EntityId }>();
  for (const item of data.brands) {
    if (item.status !== 'active') {
      continue;
    }
    options.set(item.id as EntityId, { label: item.name, value: item.id as EntityId });
  }
  if (editingItem?.brandId && editingItem.brandName) {
    const currentBrand = data.brands.find((item) => item.id === editingItem.brandId);
    if (currentBrand) {
      options.set(currentBrand.id as EntityId, {
        label:
          currentBrand.status === 'disabled'
            ? `${currentBrand.name}（当前绑定，已停用）`
            : currentBrand.name,
        value: currentBrand.id as EntityId,
      });
    } else {
      options.set(editingItem.brandId as EntityId, {
        label: `${editingItem.brandName}（当前绑定）`,
        value: editingItem.brandId as EntityId,
      });
    }
  }
  if (options.size > 0) {
    return Array.from(options.values());
  }
  return Array.from(
    new Map(
      data.brandLibrary.map((item) => [
        item.brandId as EntityId,
        {
          label: editingItem?.brandId === item.brandId ? `${item.brandName}（当前绑定）` : item.brandName,
          value: item.brandId as EntityId,
        },
      ]),
    ).values(),
  ).filter((item) => item.value);
}

export function buildCategoryIdOptions(
  data: BrandLibraryPageData,
  editingItem: AdminBrandLibraryItem | null,
) {
  const options = new Map<EntityId, { label: string; value: EntityId }>();
  for (const item of data.categories) {
    if (item.bizType !== 'product' || item.status !== 'active') {
      continue;
    }
    options.set(item.id as EntityId, { label: item.name, value: item.id as EntityId });
  }
  if (editingItem?.categoryId && editingItem.category) {
    const currentCategory = data.categories.find(
      (item) => item.bizType === 'product' && item.id === editingItem.categoryId,
    );
    if (currentCategory) {
      options.set(currentCategory.id as EntityId, {
        label: formatCategoryLabel(currentCategory, {
          disabledTag: currentCategory.status === 'disabled' ? '已停用' : undefined,
          currentTag: '当前绑定',
        }),
        value: currentCategory.id as EntityId,
      });
    } else {
      options.set(editingItem.categoryId as EntityId, {
        label: `${editingItem.category} / ID:${editingItem.categoryId}（当前绑定）`,
        value: editingItem.categoryId as EntityId,
      });
    }
  }
  if (options.size > 0) {
    return Array.from(options.values());
  }
  return Array.from(
    new Map(
      data.brandLibrary.map((item) => [
        item.categoryId as EntityId,
        {
          label:
            editingItem?.categoryId === item.categoryId
              ? `${item.category} / ID:${item.categoryId}（当前绑定）`
              : `${item.category} / ID:${item.categoryId}`,
          value: item.categoryId as EntityId,
        },
      ]),
    ).values(),
  ).filter((item) => item.value);
}

export function buildCreateBrandProductFormValues(): Partial<BrandProductFormValues> {
  return { status: 'active' };
}

export function buildEditBrandProductFormValues(
  record: AdminBrandLibraryItem,
): BrandProductFormValues {
  return {
    brandId: record.brandId as EntityId,
    name: record.productName,
    categoryId: record.categoryId as EntityId,
    guidePriceYuan: centsToYuan(record.guidePrice),
    supplyPriceYuan: centsToYuan(record.supplyPrice),
    defaultImg: record.imageUrl || undefined,
    imageList: record.imageList.length ? record.imageList : undefined,
    description: record.description || undefined,
    status: record.status,
    videoUrl: record.videoUrl || undefined,
    detailHtml: record.detailHtml || undefined,
    specTable: record.specTable.length ? record.specTable : undefined,
    packageList: record.packageList.length
      ? record.packageList.map((value) => ({ value }))
      : undefined,
    freightYuan: record.freight == null ? undefined : centsToYuan(record.freight),
    shipFrom: record.shipFrom || undefined,
    deliveryDays: record.deliveryDays || undefined,
  };
}

export function buildBrandLibraryColumns(args: {
  onEdit: (record: AdminBrandLibraryItem) => void;
  onView: (record: AdminBrandLibraryItem) => void;
}): ProColumns<AdminBrandLibraryItem>[] {
  return [
    {
      title: '品牌商品',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.productName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.brandName}
          </Typography.Text>
        </div>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 160, render: (_, record) => record.category || '-' },
    { title: '指导价', dataIndex: 'guidePrice', width: 120, render: (_, record) => formatAmount(record.guidePrice) },
    { title: '供货价', dataIndex: 'supplyPrice', width: 120, render: (_, record) => formatAmount(record.supplyPrice) },
    {
      title: '挂载商品',
      tooltip: '已经挂在某个店铺铺货过的店铺商品总数（含暂停/下架）',
      dataIndex: 'productCount',
      width: 120,
      render: (_, record) => formatNumber(record.productCount),
    },
    {
      title: '在售商品',
      tooltip: '当前 status=在售 的店铺商品数；店铺铺货后下架/暂停就会从这里减掉',
      dataIndex: 'activeProductCount',
      width: 120,
      render: (_, record) => formatNumber(record.activeProductCount),
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'default'}>
          {record.status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 120, render: (_, record) => formatDate(record.createdAt) },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (_, record) => formatDateTime(record.updatedAt) },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => args.onEdit(record)}>
            编辑
          </Button>
        </div>
      ),
    },
  ];
}
