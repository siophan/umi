import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag } from 'antd';

import type { AdminCategoryItem } from './api/categories';
import type { AdminShopApplyItem } from './api/merchant';
import { formatDateTime } from './format';

export interface ShopAppliesPageData {
  categories: AdminCategoryItem[];
  shopApplies: AdminShopApplyItem[];
}

export type ShopApplyFilters = {
  applyNo?: string;
  category?: string;
  shopName?: string;
  applicant?: string;
};

export const EMPTY_SHOP_APPLIES_DATA: ShopAppliesPageData = {
  categories: [],
  shopApplies: [],
};

export function buildShopApplyCategoryOptions(data: ShopAppliesPageData) {
  const referencedCategories = new Set(
    data.shopApplies
      .map((item) => item.category)
      .filter((value): value is string => Boolean(value)),
  );
  const knownOptions = data.categories
    .filter((item) => item.bizType === 'shop')
    .filter((item) => item.status === 'active' || referencedCategories.has(item.name))
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'active' ? -1 : 1;
      }
      return left.name.localeCompare(right.name, 'zh-CN');
    })
    .map((item) => ({
      label: item.status === 'active' ? item.name : `${item.name}（已停用）`,
      value: item.name,
    }));

  const missingOptions = Array.from(referencedCategories)
    .filter((value) => !data.categories.some((item) => item.bizType === 'shop' && item.name === value))
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
    .map((value) => ({ label: `${value}（历史类目）`, value }));

  return [...knownOptions, ...missingOptions];
}

export function buildShopApplyStatusItems(shopApplies: AdminShopApplyItem[]) {
  return [
    { key: 'all', label: '全部', count: shopApplies.length },
    {
      key: 'pending',
      label: '待审核',
      count: shopApplies.filter((item) => item.status === 'pending').length,
    },
    {
      key: 'approved',
      label: '已通过',
      count: shopApplies.filter((item) => item.status === 'approved').length,
    },
    {
      key: 'rejected',
      label: '已拒绝',
      count: shopApplies.filter((item) => item.status === 'rejected').length,
    },
  ];
}

export function filterShopApplies(
  shopApplies: AdminShopApplyItem[],
  filters: ShopApplyFilters,
  status: 'all' | AdminShopApplyItem['status'],
) {
  return shopApplies.filter((record) => {
    if (status !== 'all' && record.status !== status) {
      return false;
    }
    if (
      filters.applyNo &&
      !record.applyNo.toLowerCase().includes(filters.applyNo.trim().toLowerCase())
    ) {
      return false;
    }
    if (filters.category && record.category !== filters.category) {
      return false;
    }
    if (
      filters.shopName &&
      !record.shopName.toLowerCase().includes(filters.shopName.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      filters.applicant &&
      !record.applicant.toLowerCase().includes(filters.applicant.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export function buildShopApplyColumns(args: {
  onApprove: (id: string) => void;
  onReject: (record: AdminShopApplyItem) => void;
  onView: (record: AdminShopApplyItem) => void;
  reviewingId: string | null;
}): ProColumns<AdminShopApplyItem>[] {
  return [
    { title: '申请单号', dataIndex: 'applyNo', width: 180 },
    { title: '店铺名', dataIndex: 'shopName', width: 220 },
    {
      title: '申请人',
      dataIndex: 'applicant',
      width: 140,
      render: (_, record) => record.applicant || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contact',
      width: 160,
      render: (_, record) => record.contact || '-',
    },
    {
      title: '主营类目',
      dataIndex: 'category',
      width: 180,
      render: (_, record) => record.category || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag
          color={
            record.status === 'approved'
              ? 'success'
              : record.status === 'rejected'
                ? 'error'
                : 'warning'
          }
        >
          {record.statusLabel}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.submittedAt),
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
          {record.status === 'pending' ? (
            <>
              <Popconfirm
                okButtonProps={{ loading: args.reviewingId === record.id }}
                title="确认通过该申请？"
                onConfirm={() => args.onApprove(record.id)}
              >
                <Button size="small" type="link">
                  通过
                </Button>
              </Popconfirm>
              <Button size="small" type="link" danger onClick={() => args.onReject(record)}>
                拒绝
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];
}
