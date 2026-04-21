import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminConsignRow } from '../lib/api/orders';
import { fetchAdminConsignRows } from '../lib/api/orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface WarehouseConsignPageProps {
  refreshToken?: number;
}

type ConsignFilters = {
  tradeNo?: string;
  productName?: string;
  sellerUserId?: string;
  orderSn?: string;
  sourceType?: string;
};

const emptyRows: AdminConsignRow[] = [];
const sourceTypeOptions = [
  { label: '仓库商品', value: '仓库商品' },
  { label: '仓库调入', value: '仓库调入' },
];

function getSettlementLabel(record: AdminConsignRow) {
  if (record.statusLabel === '已取消') {
    return '-';
  }
  if (record.settledAt) {
    return '已结算';
  }
  if (record.statusLabel === '已成交' || record.statusLabel === '待结算') {
    return '待结算';
  }
  return '-';
}

export function WarehouseConsignPage({ refreshToken = 0 }: WarehouseConsignPageProps) {
  const [searchForm] = Form.useForm<ConsignFilters>();
  const [rows, setRows] = useState<AdminConsignRow[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConsignFilters>({});
  const [status, setStatus] = useState<string>('all');

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminConsignRows().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '寄售市场加载失败');
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
        if (status !== 'all' && record.statusLabel !== status) return false;
        if (
          filters.tradeNo &&
          !`${record.tradeNo || record.id}`.toLowerCase().includes(filters.tradeNo.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.productName && !record.productName.toLowerCase().includes(filters.productName.trim().toLowerCase())) return false;
        if (
          filters.sellerUserId &&
          !record.userId.toLowerCase().includes(filters.sellerUserId.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          filters.orderSn &&
          !`${record.orderSn || ''}`.toLowerCase().includes(filters.orderSn.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.sourceType && record.sourceType !== filters.sourceType) return false;
        return true;
      }),
    [filters.orderSn, filters.productName, filters.sellerUserId, filters.sourceType, filters.tradeNo, rows, status],
  );

  const columns: ProColumns<AdminConsignRow>[] = [
    {
      title: '交易单号',
      width: 180,
      render: (_, record) => <Typography.Text strong>{record.tradeNo || record.id}</Typography.Text>,
    },
    {
      title: '商品',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.productImg ? (
            <img
              src={record.productImg}
              alt={record.productName}
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
            />
          ) : null}
          <Typography.Text strong>{record.productName}</Typography.Text>
        </div>
      ),
    },
    {
      title: '卖家',
      width: 160,
      render: (_, record) => <Typography.Text>{record.userId}</Typography.Text>,
    },
    {
      title: '买家',
      width: 160,
      render: (_, record) => <Typography.Text>{record.buyerUserId || '-'}</Typography.Text>,
    },
    { title: '挂单价', dataIndex: 'listingPrice', width: 120, render: (_, record) => (record.listingPrice ? formatYuanAmount(record.listingPrice) : '-') },
    { title: '成交价', dataIndex: 'price', width: 120, render: (_, record) => formatYuanAmount(record.price) },
    { title: '佣金', dataIndex: 'commissionAmount', width: 120, render: (_, record) => formatYuanAmount(record.commissionAmount) },
    { title: '卖家到账', dataIndex: 'sellerAmount', width: 120, render: (_, record) => formatYuanAmount(record.sellerAmount) },
    { title: '状态', dataIndex: 'statusLabel', width: 120 },
    { title: '结算状态', width: 120, render: (_, record) => getSettlementLabel(record) },
    { title: '上架时间', dataIndex: 'listedAt', width: 180, render: (_, record) => formatDateTime(record.listedAt || record.createdAt) },
    { title: '成交时间', dataIndex: 'tradedAt', width: 180, render: (_, record) => formatDateTime(record.tradedAt) },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            window.location.hash = `#/warehouse/consign/detail/${record.id}`;
          }}
        >
          查看
        </Button>
      ),
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
        <Form.Item name="tradeNo">
          <Input allowClear placeholder="交易单号" />
        </Form.Item>
        <Form.Item name="productName">
          <Input allowClear placeholder="商品名称" />
        </Form.Item>
        <Form.Item name="sellerUserId">
          <Input allowClear placeholder="卖家" />
        </Form.Item>
        <Form.Item name="orderSn">
          <Input allowClear placeholder="订单号" />
        </Form.Item>
        <Form.Item name="sourceType">
          <Select allowClear options={sourceTypeOptions} placeholder="来源类型" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '寄售中', label: '寄售中', count: rows.filter((item) => item.statusLabel === '寄售中').length },
          { key: '待结算', label: '待结算', count: rows.filter((item) => item.statusLabel === '待结算').length },
          { key: '已成交', label: '已成交', count: rows.filter((item) => item.statusLabel === '已成交').length },
          { key: '已取消', label: '已取消', count: rows.filter((item) => item.statusLabel === '已取消').length },
        ]}
        onChange={setStatus}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminConsignRow>
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
    </div>
  );
}
