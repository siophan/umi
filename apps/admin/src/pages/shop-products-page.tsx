import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminShopProductItem } from '../lib/api/merchant';
import { fetchAdminShopProducts } from '../lib/api/merchant';
import { formatAmount, formatNumber, productStatusMeta } from '../lib/format';
import { AdminDataTablePage, buildOptions, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface ShopProductsPageProps {
  refreshToken?: number;
}

const emptyRows: AdminShopProductItem[] = [];

export function ShopProductsPage({ refreshToken = 0 }: ShopProductsPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '店铺授权商品加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminShopProducts().then((result) => result.items),
  });

  const brandOptions = useMemo(() => buildOptions(data, 'brandName'), [data]);
  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        active: '在售',
        disabled: '不可售',
        low_stock: '低库存',
        off_shelf: '已下架',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminShopProductItem> = [
    { title: '店铺', dataIndex: 'shopName' },
    { title: '商品', dataIndex: 'productName' },
    { title: '品牌', dataIndex: 'brandName', render: (value) => value || '-' },
    { title: '售价', dataIndex: 'price', render: (value: number) => formatAmount(value) },
    { title: '可用库存', dataIndex: 'availableStock', render: formatNumber },
    { title: '销量', dataIndex: 'sales', render: formatNumber },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={productStatusMeta[record.status].color}>{record.statusLabel}</Tag>
      ),
    },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="店铺授权商品"
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
            if (filters.third && record.statusLabel !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data}
        searchPlaceholder="商品名称"
        secondField={{ options: brandOptions, placeholder: '品牌' }}
        statusItems={statusItems}
        thirdField={{
          options: [
            { label: '在售', value: '在售' },
            { label: '低库存', value: '低库存' },
            { label: '已下架', value: '已下架' },
            { label: '不可售', value: '不可售' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
