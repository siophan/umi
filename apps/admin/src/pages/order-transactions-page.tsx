import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminTransactionRow } from '../lib/api/orders';
import { fetchAdminTransactions } from '../lib/api/orders';
import { formatAmount, formatDateTime } from '../lib/format';
import {
  AdminDataTablePage,
  buildOptions,
  buildStatusItems,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface OrderTransactionsPageProps {
  refreshToken?: number;
}

const emptyRows: AdminTransactionRow[] = [];

function directionTag(direction: 'payment' | 'refund') {
  return <Tag color={direction === 'payment' ? 'processing' : 'warning'}>{direction === 'payment' ? '支付' : '退款'}</Tag>;
}

export function OrderTransactionsPage({ refreshToken = 0 }: OrderTransactionsPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '交易流水加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminTransactions().then((result) => result.items),
  });

  const channelOptions = useMemo(
    () => buildOptions(data, 'channel'),
    [data],
  );
  const directionOptions = useMemo(
    () => buildOptions(data, 'direction'),
    [data],
  );
  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.direction, {
        payment: '支付',
        refund: '退款',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminTransactionRow> = [
    {
      title: '流水',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.orderSn || record.orderId}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.userName || record.userId}</Typography.Text>
        </div>
      ),
    },
    { title: '渠道', dataIndex: 'channel' },
    { title: '方向', render: (_, record) => directionTag(record.direction) },
    { title: '金额', dataIndex: 'amount', render: (value: number) => formatAmount(value) },
    { title: '状态', dataIndex: 'statusLabel' },
    { title: '时间', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="交易流水"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
            if (status !== 'all' && record.direction !== status) {
              return false;
            }
            if (filters.keyword && !orderRef.includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.channel !== filters.second) {
              return false;
            }
            if (filters.third && record.direction !== filters.third) {
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
        secondField={{ options: channelOptions, placeholder: '渠道' }}
        statusItems={statusItems}
        thirdField={{ options: directionOptions, placeholder: '方向' }}
      />
    </>
  );
}
