import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminShopApplyItem } from '../lib/api/merchant';
import { fetchAdminShopApplies } from '../lib/api/merchant';
import { formatDateTime } from '../lib/format';
import { AdminDataTablePage, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface ShopAppliesPageProps {
  refreshToken?: number;
}

interface ShopAppliesPageData {
  categories: AdminCategoryItem[];
  shopApplies: AdminShopApplyItem[];
}

const emptyData: ShopAppliesPageData = { categories: [], shopApplies: [] };

export function ShopAppliesPage({ refreshToken = 0 }: ShopAppliesPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '开店审核列表加载失败',
    initialData: emptyData,
    load: async () => {
      const [shopApplies, categories] = await Promise.all([
        fetchAdminShopApplies().then((result) => result.items),
        fetchAdminCategories().then((result) => result.items),
      ]);
      return { categories, shopApplies };
    },
  });

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'shop' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.shopApplies.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.categories, data.shopApplies]);

  const statusOptions = [
    { label: '待审核', value: '待审核' },
    { label: '已通过', value: '已通过' },
    { label: '已拒绝', value: '已拒绝' },
  ];

  const statusItems = useMemo(
    () =>
      buildStatusItems(data.shopApplies, (row) => row.status, {
        approved: '已通过',
        pending: '待审核',
        rejected: '已拒绝',
      }),
    [data.shopApplies],
  );

  const columns: TableColumnsType<AdminShopApplyItem> = [
    { title: '申请单号', dataIndex: 'applyNo' },
    { title: '店铺名', dataIndex: 'shopName' },
    { title: '申请人', dataIndex: 'applicant', render: (value) => value || '-' },
    { title: '联系电话', dataIndex: 'contact', render: (value) => value || '-' },
    { title: '主营类目', dataIndex: 'category', render: (value) => value || '-' },
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
        drawerTitle="开店审核"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.shopName.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
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
        rows={data.shopApplies}
        searchPlaceholder="申请店铺名称"
        secondField={{ options: categoryOptions, placeholder: '主营类目' }}
        statusItems={statusItems}
        thirdField={{ options: statusOptions, placeholder: '审核状态' }}
      />
    </>
  );
}
