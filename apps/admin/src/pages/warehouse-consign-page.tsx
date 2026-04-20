import { Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminConsignRow } from '../lib/api/orders';
import { fetchAdminConsignRows } from '../lib/api/orders';
import { formatAmount, formatDateTime } from '../lib/format';
import {
  AdminDataTablePage,
  buildOptions,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface WarehouseConsignPageProps {
  refreshToken?: number;
}

const emptyRows: AdminConsignRow[] = [];

export function WarehouseConsignPage({ refreshToken = 0 }: WarehouseConsignPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '寄售市场加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminConsignRows().then((result) => result.items),
  });

  const sourceTypeOptions = useMemo(
    () => buildOptions(data, 'sourceType'),
    [data],
  );

  const columns: TableColumnsType<AdminConsignRow> = [
    {
      title: '寄售商品',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.productName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">卖家 {record.userId}</Typography.Text>
        </div>
      ),
    },
    { title: '成交价', dataIndex: 'price', render: (value: number) => formatAmount(value) },
    { title: '挂单价', dataIndex: 'listingPrice', render: (value: number | null) => (value ? formatAmount(value) : '-') },
    { title: '佣金', dataIndex: 'commissionAmount', render: (value: number) => formatAmount(value) },
    { title: '状态', dataIndex: 'statusLabel' },
    { title: '时间', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="寄售市场"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.statusLabel !== status) {
              return false;
            }
            if (filters.keyword && !record.productName.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.sourceType !== filters.second) {
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
        secondField={{ options: sourceTypeOptions, placeholder: '来源类型' }}
        statusItems={[
          { key: 'all', label: '全部', count: data.length },
          { key: '待上架', label: '待上架', count: data.filter((item) => item.statusLabel === '待上架').length },
          { key: '寄售中', label: '寄售中', count: data.filter((item) => item.statusLabel === '寄售中').length },
          { key: '已成交', label: '已成交', count: data.filter((item) => item.statusLabel === '已成交').length },
          { key: '已结算', label: '已结算', count: data.filter((item) => item.statusLabel === '已结算').length },
          { key: '已取消', label: '已取消', count: data.filter((item) => item.statusLabel === '已取消').length },
        ]}
        thirdField={{
          options: [
            { label: '待上架', value: '待上架' },
            { label: '寄售中', value: '寄售中' },
            { label: '已成交', value: '已成交' },
            { label: '已结算', value: '已结算' },
            { label: '已取消', value: '已取消' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
