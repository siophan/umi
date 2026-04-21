import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminTransactionRow } from '../lib/api/orders';
import { fetchAdminTransactions } from '../lib/api/orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatAmount, formatDateTime } from '../lib/format';

interface OrderTransactionsPageProps {
  refreshToken?: number;
}

type TransactionFilters = {
  flowId?: string;
  orderSn?: string;
  user?: string;
  channel?: string;
};

const emptyRows: AdminTransactionRow[] = [];

function directionTag(direction: 'payment' | 'refund') {
  return <Tag color={direction === 'payment' ? 'processing' : 'warning'}>{direction === 'payment' ? '支付' : '退款'}</Tag>;
}

const channelOptions = [
  { label: '竞猜奖励', value: '竞猜奖励' },
  { label: '订单支付（渠道未建模）', value: '订单支付（渠道未建模）' },
  { label: '竞猜奖励退款', value: '竞猜奖励退款' },
  { label: '订单退款', value: '订单退款' },
];

export function OrderTransactionsPage({ refreshToken = 0 }: OrderTransactionsPageProps) {
  const [searchForm] = Form.useForm<TransactionFilters>();
  const [rows, setRows] = useState<AdminTransactionRow[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [status, setStatus] = useState<'all' | AdminTransactionRow['direction']>('all');
  const [selected, setSelected] = useState<AdminTransactionRow | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminTransactions().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '交易流水加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        const flowRef = String(record.id || '').toLowerCase();
        const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
        if (status !== 'all' && record.direction !== status) return false;
        if (filters.flowId && !flowRef.includes(filters.flowId.trim().toLowerCase())) return false;
        if (filters.orderSn && !orderRef.includes(filters.orderSn.trim().toLowerCase())) return false;
        if (
          filters.user &&
          !`${record.userName || ''} ${record.userId}`.toLowerCase().includes(filters.user.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.channel && record.channel !== filters.channel) return false;
        return true;
      }),
    [filters.channel, filters.flowId, filters.orderSn, filters.user, rows, status],
  );

  const columns: ProColumns<AdminTransactionRow>[] = [
    {
      title: '流水号',
      dataIndex: 'id',
      width: 200,
      render: (value) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: '订单号',
      dataIndex: 'orderSn',
      width: 180,
      render: (_, record) => record.orderSn || record.orderId,
    },
    {
      title: '用户',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.userName || record.userId}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.userId}</Typography.Text>
        </div>
      ),
    },
    { title: '渠道', dataIndex: 'channel', width: 140 },
    { title: '方向', width: 120, render: (_, record) => directionTag(record.direction) },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 140,
      render: (_, record) => (
        <Typography.Text type={record.direction === 'refund' ? 'danger' : undefined}>
          {formatAmount(record.amount)}
        </Typography.Text>
      ),
    },
    { title: '状态', dataIndex: 'statusLabel', width: 120 },
    { title: '时间', dataIndex: 'createdAt', width: 180, render: (_, record) => formatDateTime(record.createdAt) },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => <Button size="small" type="link" onClick={() => setSelected(record)}>查看</Button>,
    },
  ];

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={searchForm}
        defaultCount={3}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="flowId">
          <Input allowClear placeholder="流水号" />
        </Form.Item>
        <Form.Item name="orderSn">
          <Input allowClear placeholder="订单号" />
        </Form.Item>
        <Form.Item name="user">
          <Input allowClear placeholder="用户" />
        </Form.Item>
        <Form.Item name="channel">
          <Select allowClear options={channelOptions} placeholder="渠道" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'payment', label: '支付', count: rows.filter((item) => item.direction === 'payment').length },
          { key: 'refund', label: '退款', count: rows.filter((item) => item.direction === 'refund').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminTransactionRow>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>
      <Drawer open={selected != null} title="交易流水" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="流水号">{selected.id}</Descriptions.Item>
            <Descriptions.Item label="订单号">{selected.orderSn || selected.orderId}</Descriptions.Item>
            <Descriptions.Item label="用户">{selected.userName || selected.userId}</Descriptions.Item>
            <Descriptions.Item label="用户 ID">{selected.userId}</Descriptions.Item>
            <Descriptions.Item label="渠道">{selected.channel}</Descriptions.Item>
            <Descriptions.Item label="方向">{selected.direction === 'payment' ? '支付' : '退款'}</Descriptions.Item>
            <Descriptions.Item label="金额">{formatAmount(selected.amount)}</Descriptions.Item>
            <Descriptions.Item label="来源表">
              {selected.sourceTable === 'order' ? '订单支付' : '退款单'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="状态编码">
              {selected.statusCode == null ? '-' : String(selected.statusCode)}
            </Descriptions.Item>
            <Descriptions.Item label="时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
