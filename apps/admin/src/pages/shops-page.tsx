import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminShopItem } from '../lib/api/merchant';
import { fetchAdminShops } from '../lib/api/merchant';
import { formatNumber } from '../lib/format';
import {
  AdminDataTablePage,
  buildStatusItems,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface ShopsPageProps {
  refreshToken?: number;
}

interface ShopsPageData {
  categories: AdminCategoryItem[];
  shops: AdminShopItem[];
}

const emptyData: ShopsPageData = { categories: [], shops: [] };

export function ShopsPage({ refreshToken = 0 }: ShopsPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '店铺列表加载失败',
    initialData: emptyData,
    load: async () => {
      const [shops, categories] = await Promise.all([
        fetchAdminShops().then((result) => result.items),
        fetchAdminCategories().then((result) => result.items),
      ]);
      return { categories, shops };
    },
  });

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'shop' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.shops.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.categories, data.shops]);

  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(data.shops.map((item) => item.ownerName).filter(Boolean))).map(
        (value) => ({ label: String(value), value: String(value) }),
      ),
    [data.shops],
  );

  const statusItems = useMemo(
    () =>
      buildStatusItems(data.shops, (row) => row.status, {
        active: '启用中',
        closed: '已关闭',
        paused: '暂停',
      }),
    [data.shops],
  );

  const columns: TableColumnsType<AdminShopItem> = [
    {
      title: '店铺',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.ownerName}</Typography.Text>
        </div>
      ),
    },
    { title: '主营类目', dataIndex: 'category', render: (value) => value || '-' },
    { title: '商品数', dataIndex: 'products', render: formatNumber },
    { title: '履约单量', dataIndex: 'orders', render: formatNumber },
    { title: '生效授权', dataIndex: 'brandAuthCount', render: formatNumber },
    {
      title: '评分',
      dataIndex: 'score',
      render: (value: number) => (value ? value.toFixed(2) : '-'),
    },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : record.status === 'paused' ? 'warning' : 'default'}>
          {record.statusLabel}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="店铺列表"
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
            if (filters.third && record.ownerName !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data.shops}
        searchPlaceholder="店铺名称"
        secondField={{ options: categoryOptions, placeholder: '主营类目' }}
        statusItems={statusItems}
        thirdField={{ options: ownerOptions, placeholder: '店主' }}
      />
    </>
  );
}
