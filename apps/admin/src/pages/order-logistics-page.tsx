import { Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminLogisticsRow } from '../lib/api/orders';
import { fetchAdminLogistics } from '../lib/api/orders';
import { formatAmount, formatDateTime } from '../lib/format';
import {
  AdminDataTablePage,
  buildOptions,
  buildStatusItems,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface OrderLogisticsPageProps {
  refreshToken?: number;
}

const emptyRows: AdminLogisticsRow[] = [];

export function OrderLogisticsPage({ refreshToken = 0 }: OrderLogisticsPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '物流管理加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminLogistics().then((result) => result.items),
  });

  const carrierOptions = useMemo(
    () => buildOptions(data, 'carrier'),
    [data],
  );
  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        cancelled: '已取消',
        completed: '已完成',
        shipping: '配送中',
        stored: '已建单',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminLogisticsRow> = [
    {
      title: '履约单',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.fulfillmentSn || record.orderSn || record.id}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.productSummary}</Typography.Text>
        </div>
      ),
    },
    { title: '收货人', dataIndex: 'receiver', render: (value) => value || '-' },
    { title: '物流方式', dataIndex: 'shippingTypeLabel' },
    { title: '承运商', dataIndex: 'carrier' },
    { title: '单号', dataIndex: 'trackingNo', render: (value) => value || '-' },
    { title: '状态', dataIndex: 'statusLabel' },
    { title: '发货时间', dataIndex: 'shippedAt', render: (value) => (value ? formatDateTime(value) : '-') },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="物流管理"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !orderRef.includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.carrier !== filters.second) {
              return false;
            }
            if (filters.third && record.shippingTypeLabel !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data}
        searchPlaceholder="订单号"
        secondField={{ options: carrierOptions, placeholder: '承运商' }}
        statusItems={statusItems}
        thirdField={{
          options: [
            { label: '快递', value: '快递' },
            { label: '同城配送', value: '同城配送' },
            { label: '到店自提', value: '到店自提' },
            { label: '未知', value: '未知' },
          ],
          placeholder: '物流方式',
        }}
      />
    </>
  );
}
