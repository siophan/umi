import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminBrandLibraryItem } from '../lib/api/catalog';
import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import { fetchAdminBrandLibrary } from '../lib/api/catalog';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';
import {
  AdminDataTablePage,
  buildOptions,
  buildStatusItems,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface BrandLibraryPageProps {
  refreshToken?: number;
}

interface BrandLibraryPageData {
  brandLibrary: AdminBrandLibraryItem[];
  categories: AdminCategoryItem[];
}

const emptyData: BrandLibraryPageData = { brandLibrary: [], categories: [] };

export function BrandLibraryPage({ refreshToken = 0 }: BrandLibraryPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '品牌商品库加载失败',
    initialData: emptyData,
    load: async () => {
      const [brandLibrary, categories] = await Promise.all([
        fetchAdminBrandLibrary({ page: 1, pageSize: 100 }).then((result) => result.items),
        fetchAdminCategories().then((result) => result.items),
      ]);
      return { brandLibrary, categories };
    },
  });

  const brandOptions = useMemo(
    () => buildOptions(data.brandLibrary, 'brandName'),
    [data.brandLibrary],
  );

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'product' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return buildOptions(data.brandLibrary, 'category');
  }, [data.brandLibrary, data.categories]);

  const statusItems = useMemo(
    () =>
      buildStatusItems(data.brandLibrary, (row) => row.status, {
        active: '启用中',
        disabled: '停用',
      }),
    [data.brandLibrary],
  );

  const columns: TableColumnsType<AdminBrandLibraryItem> = [
    {
      title: '品牌商品',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.productName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.brandName}</Typography.Text>
        </div>
      ),
    },
    { title: '分类', dataIndex: 'category', render: (value) => value || '-' },
    { title: '指导价', dataIndex: 'guidePrice', render: (value: number) => formatAmount(value) },
    { title: '挂载商品', dataIndex: 'productCount', render: formatNumber },
    { title: '在售商品', dataIndex: 'activeProductCount', render: formatNumber },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'default'}>
          {record.status === 'active' ? '启用中' : '停用'}
        </Tag>
      ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="品牌商品库"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.productName.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.brandName !== filters.second) {
              return false;
            }
            if (filters.third && record.category !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data.brandLibrary}
        searchPlaceholder="商品名称"
        secondField={{ options: brandOptions, placeholder: '品牌' }}
        statusItems={statusItems}
        thirdField={{ options: categoryOptions, placeholder: '分类' }}
      />
    </>
  );
}
