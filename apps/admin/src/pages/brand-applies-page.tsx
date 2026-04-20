import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminBrandApplyItem } from '../lib/api/merchant';
import { fetchAdminBrandApplies } from '../lib/api/merchant';
import { formatAmount, formatDateTime } from '../lib/format';
import { AdminDataTablePage, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface BrandAppliesPageProps {
  refreshToken?: number;
}

interface BrandAppliesPageData {
  brandApplies: AdminBrandApplyItem[];
  categories: AdminCategoryItem[];
}

const emptyData: BrandAppliesPageData = { brandApplies: [], categories: [] };

export function BrandAppliesPage({ refreshToken = 0 }: BrandAppliesPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '品牌入驻审核加载失败',
    initialData: emptyData,
    load: async () => {
      const [brandApplies, categories] = await Promise.all([
        fetchAdminBrandApplies().then((result) => result.items),
        fetchAdminCategories().then((result) => result.items),
      ]);
      return { brandApplies, categories };
    },
  });

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'brand' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.brandApplies.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.brandApplies, data.categories]);

  const statusOptions = [
    { label: '待审核', value: '待审核' },
    { label: '已通过', value: '已通过' },
    { label: '已拒绝', value: '已拒绝' },
  ];

  const statusItems = useMemo(
    () =>
      buildStatusItems(data.brandApplies, (row) => row.status, {
        approved: '已通过',
        pending: '待审核',
        rejected: '已拒绝',
      }),
    [data.brandApplies],
  );

  const columns: TableColumnsType<AdminBrandApplyItem> = [
    { title: '申请单号', dataIndex: 'applyNo' },
    { title: '品牌名', dataIndex: 'name' },
    { title: '联系人', dataIndex: 'applicant', render: (value) => value || '-' },
    { title: '保证金', dataIndex: 'deposit', render: (value: number) => formatAmount(value) },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'warning'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '提交时间', dataIndex: 'submittedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="入驻审核"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.name.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.category !== filters.second) {
              return false;
            }
            if (filters.third && record.statusLabel !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data.brandApplies}
        searchPlaceholder="申请品牌名称"
        secondField={{ options: categoryOptions, placeholder: '类目' }}
        statusItems={statusItems}
        thirdField={{ options: statusOptions, placeholder: '审核状态' }}
      />
    </>
  );
}
