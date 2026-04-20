import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminBrandItem } from '../lib/api/merchant';
import { fetchAdminBrands } from '../lib/api/merchant';
import { formatNumber } from '../lib/format';
import { AdminDataTablePage, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface BrandsPageProps {
  refreshToken?: number;
}

interface BrandsPageData {
  brands: AdminBrandItem[];
  categories: AdminCategoryItem[];
}

const emptyData: BrandsPageData = { brands: [], categories: [] };

export function BrandsPage({ refreshToken = 0 }: BrandsPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '品牌列表加载失败',
    initialData: emptyData,
    load: async () => {
      const [brands, categories] = await Promise.all([
        fetchAdminBrands().then((result) => result.items),
        fetchAdminCategories().then((result) => result.items),
      ]);
      return { brands, categories };
    },
  });

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'brand' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.brands.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.brands, data.categories]);

  const statusOptions = [
    { label: '合作中', value: '合作中' },
    { label: '停用', value: '停用' },
  ];

  const statusItems = useMemo(
    () =>
      buildStatusItems(data.brands, (row) => row.status, {
        active: '合作中',
        disabled: '停用',
      }),
    [data.brands],
  );

  const columns: TableColumnsType<AdminBrandItem> = [
    { title: '品牌', dataIndex: 'name' },
    { title: '类目', dataIndex: 'category', render: (value) => value || '-' },
    { title: '合作店铺', dataIndex: 'shopCount', render: formatNumber },
    { title: '标准商品', dataIndex: 'goodsCount', render: formatNumber },
    { title: '联系人', dataIndex: 'contactName', render: (value) => value || '-' },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'default'}>
          {record.statusLabel}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="品牌方列表"
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
        rows={data.brands}
        searchPlaceholder="品牌名称"
        secondField={{ options: categoryOptions, placeholder: '类目' }}
        statusItems={statusItems}
        thirdField={{ options: statusOptions, placeholder: '状态' }}
      />
    </>
  );
}
