import type {
  CategoryId,
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, Typography } from 'antd';

import type { AdminCategoryItem } from './api/categories';
import { formatDateTime, formatNumber } from './format';

export type CategoryFilters = {
  name?: string;
  bizTypeCode?: number;
  parentId?: CategoryId;
};

export type CategoryFormValues = {
  bizTypeCode: 10 | 20 | 30 | 40;
  parentId?: CategoryId;
  name: string;
  sort?: number;
  iconUrl?: string;
  description?: string;
  status?: 'active' | 'disabled';
};

export const BIZ_TYPE_OPTIONS = [
  { label: '品牌分类', value: 10 },
  { label: '店铺经营分类', value: 20 },
  { label: '商品分类', value: 30 },
  { label: '竞猜分类', value: 40 },
] as const;

export const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

export const CATEGORY_TABLE_THEME = {
  token: {
    borderRadius: 6,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
  },
} as const;

export function getCategoryStatusColor(status: AdminCategoryItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function toCategoryPayload(values: CategoryFormValues): CreateAdminCategoryPayload {
  return {
    bizTypeCode: values.bizTypeCode,
    parentId: values.parentId || null,
    name: values.name.trim(),
    iconUrl: values.iconUrl?.trim() || null,
    description: values.description?.trim() || null,
    sort: Number(values.sort ?? 0),
    status: values.status ?? 'active',
  };
}

export function toCategoryUpdatePayload(values: CategoryFormValues): UpdateAdminCategoryPayload {
  return {
    name: values.name.trim(),
    iconUrl: values.iconUrl?.trim() || null,
    description: values.description?.trim() || null,
    sort: Number(values.sort ?? 0),
  };
}

export function buildCategoryParentOptions(
  categories: AdminCategoryItem[],
  watchedBizTypeCode?: number,
) {
  return categories
    .filter((item) => (watchedBizTypeCode ? item.bizTypeCode === watchedBizTypeCode : true))
    .filter((item) => item.status === 'active')
    .map((item) => ({
      label: `${item.name}${item.parentName ? ` / ${item.parentName}` : ''}`,
      value: item.id,
    }));
}

export function filterCategories(
  categories: AdminCategoryItem[],
  filters: CategoryFilters,
  status: 'all' | AdminCategoryItem['status'],
) {
  return categories.filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false;
    }
    if (filters.name && !item.name.toLowerCase().includes(filters.name.trim().toLowerCase())) {
      return false;
    }
    if (filters.bizTypeCode && item.bizTypeCode !== Number(filters.bizTypeCode)) {
      return false;
    }
    if (filters.parentId && item.parentId !== filters.parentId) {
      return false;
    }
    return true;
  });
}

export function buildCategoryStatusItems(categories: AdminCategoryItem[]) {
  return [
    { key: 'all', label: '全部', count: categories.length },
    {
      key: 'active',
      label: '启用',
      count: categories.filter((item) => item.status === 'active').length,
    },
    {
      key: 'disabled',
      label: '停用',
      count: categories.filter((item) => item.status === 'disabled').length,
    },
  ];
}

export function buildCreateCategoryFormValues(): CategoryFormValues {
  return {
    bizTypeCode: 10,
    parentId: undefined,
    name: '',
    sort: 0,
    iconUrl: undefined,
    description: undefined,
    status: 'active',
  };
}

export function buildEditCategoryFormValues(record: AdminCategoryItem): CategoryFormValues {
  return {
    bizTypeCode: record.bizTypeCode as 10 | 20 | 30 | 40,
    parentId: record.parentId ?? undefined,
    name: record.name,
    sort: record.sort,
    iconUrl: record.iconUrl ?? undefined,
    description: record.description ?? undefined,
  };
}

export function buildCategoryColumns(args: {
  onEdit: (record: AdminCategoryItem) => void;
  onToggleStatus: (record: AdminCategoryItem) => void;
  onView: (record: AdminCategoryItem) => void;
}): ProColumns<AdminCategoryItem>[] {
  return [
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.bizTypeLabel}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '父分类',
      dataIndex: 'parentName',
      width: 180,
      render: (_, record) => record.parentName || '-',
    },
    {
      title: '层级',
      dataIndex: 'level',
      width: 100,
      render: (_, record) => formatNumber(record.level),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
      render: (_, record) => formatNumber(record.sort),
    },
    {
      title: '引用量',
      dataIndex: 'usageCount',
      width: 120,
      render: (_, record) => formatNumber(record.usageCount),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={getCategoryStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.updatedAt),
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 220,
      render: (_, record) => record.path || '-',
    },
    {
      title: '图标地址',
      dataIndex: 'iconUrl',
      width: 220,
      render: (_, record) => record.iconUrl || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
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
          <Popconfirm
            title={record.status === 'active' ? '停用分类' : '启用分类'}
            description={
              record.status === 'active'
                ? '停用后当前分类及其子分类都会变成停用状态。'
                : '确认启用当前分类？'
            }
            okText="确认"
            cancelText="取消"
            onConfirm={() => args.onToggleStatus(record)}
          >
            <Button size="small" type="link">
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
}
