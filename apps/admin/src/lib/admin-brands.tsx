import type { ProColumns } from '@ant-design/pro-components';
import type { EntityId } from '@umi/shared';
import { Avatar, Button, Tag } from 'antd';

import type { AdminCategoryItem } from './api/categories';
import type { AdminBrandItem } from './api/merchant';
import { formatDate, formatNumber } from './format';

export interface BrandsPageData {
  brands: AdminBrandItem[];
  categories: AdminCategoryItem[];
}

export type BrandFilters = {
  name?: string;
  categoryId?: EntityId;
};

export type BrandFormValues = {
  name: string;
  categoryId: EntityId;
  logoUrl: string;
  contactName?: string;
  contactPhone?: string;
  description?: string;
  status: AdminBrandItem['status'];
};

export const EMPTY_BRANDS_PAGE_DATA: BrandsPageData = {
  brands: [],
  categories: [],
};

export const BRAND_STATUS_OPTIONS = [
  { label: '合作中', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

export function buildBrandFilterCategoryOptions(data: BrandsPageData) {
  const brandCategories = data.categories
    .filter((item) => item.bizType === 'brand')
    .map((item) => ({
      label: `${item.name}${item.parentName ? ` / ${item.parentName}` : ''}${
        item.status === 'disabled' ? '（停用）' : ''
      }`,
      value: item.id as EntityId,
    }));

  if (brandCategories.length > 0) {
    return brandCategories;
  }

  const fallback = new Map<EntityId, { label: string; value: EntityId }>();
  for (const item of data.brands) {
    if (!item.categoryId || !item.category) {
      continue;
    }
    fallback.set(item.categoryId as EntityId, {
      label: item.category,
      value: item.categoryId as EntityId,
    });
  }

  return Array.from(fallback.values());
}

export function buildBrandFormCategoryOptions(
  data: BrandsPageData,
  editingBrand: AdminBrandItem | null,
) {
  const activeCategories = new Map<EntityId, { label: string; value: EntityId }>();

  for (const item of data.categories) {
    if (item.bizType !== 'brand' || item.status !== 'active') {
      continue;
    }
    activeCategories.set(item.id as EntityId, {
      label: item.name,
      value: item.id as EntityId,
    });
  }

  if (editingBrand?.categoryId && editingBrand.category) {
    const currentCategory = data.categories.find(
      (item) => item.bizType === 'brand' && item.id === editingBrand.categoryId,
    );
    if (currentCategory) {
      activeCategories.set(currentCategory.id as EntityId, {
        label:
          currentCategory.status === 'disabled'
            ? `${currentCategory.name}（当前绑定，已停用）`
            : currentCategory.name,
        value: currentCategory.id as EntityId,
      });
    } else {
      activeCategories.set(editingBrand.categoryId as EntityId, {
        label: `${editingBrand.category}（当前绑定）`,
        value: editingBrand.categoryId as EntityId,
      });
    }
  }

  if (activeCategories.size > 0) {
    return Array.from(activeCategories.values());
  }

  const fallback = new Map<EntityId, { label: string; value: EntityId }>();
  for (const item of data.brands) {
    if (!item.categoryId || !item.category) {
      continue;
    }
    const isCurrent = editingBrand?.categoryId === item.categoryId;
    fallback.set(item.categoryId as EntityId, {
      label: isCurrent ? `${item.category}（当前绑定）` : item.category,
      value: item.categoryId as EntityId,
    });
  }

  return Array.from(fallback.values());
}

export function buildBrandStatusItems(brands: AdminBrandItem[]) {
  return [
    { key: 'all', label: '全部', count: brands.length },
    {
      key: 'active',
      label: '合作中',
      count: brands.filter((item) => item.status === 'active').length,
    },
    {
      key: 'disabled',
      label: '停用',
      count: brands.filter((item) => item.status === 'disabled').length,
    },
  ];
}

export function filterBrands(
  brands: AdminBrandItem[],
  filters: BrandFilters,
  status: 'all' | AdminBrandItem['status'],
) {
  return brands.filter((record) => {
    if (status !== 'all' && record.status !== status) {
      return false;
    }
    if (filters.name) {
      const keyword = filters.name.trim().toLowerCase();
      const matchesKeyword = [record.name, record.contactName, record.contactPhone].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(keyword),
      );
      if (!matchesKeyword) {
        return false;
      }
    }
    if (filters.categoryId && String(record.categoryId ?? '') !== String(filters.categoryId)) {
      return false;
    }
    return true;
  });
}

export function buildCreateBrandFormValues(): Partial<BrandFormValues> {
  return { status: 'active' };
}

export function buildEditBrandFormValues(record: AdminBrandItem): BrandFormValues {
  return {
    name: record.name,
    categoryId: record.categoryId as EntityId,
    logoUrl: record.logoUrl || '',
    contactName: record.contactName || undefined,
    contactPhone: record.contactPhone || undefined,
    description: record.description || undefined,
    status: record.status,
  };
}

export function buildBrandColumns(args: {
  onEdit: (record: AdminBrandItem) => void;
  onView: (record: AdminBrandItem) => void;
}): ProColumns<AdminBrandItem>[] {
  return [
    {
      title: '品牌',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            src={record.logoUrl || undefined}
            shape="square"
            size={36}
            style={{ flexShrink: 0, background: '#f0f0f0', color: '#999', fontSize: 14 }}
          >
            {record.name.charAt(0)}
          </Avatar>
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      title: '类目',
      dataIndex: 'category',
      width: 180,
      render: (_, record) => record.category || '-',
    },
    {
      title: '合作店铺',
      dataIndex: 'shopCount',
      width: 120,
      render: (_, record) => formatNumber(record.shopCount),
    },
    {
      title: '标准商品',
      dataIndex: 'goodsCount',
      width: 120,
      render: (_, record) => formatNumber(record.goodsCount),
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      width: 140,
      render: (_, record) => record.contactName || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'default'}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatDate(record.createdAt),
    },
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
