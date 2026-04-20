import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminLogisticsRow } from '../lib/api/orders';
import { fetchAdminLogistics } from '../lib/api/orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime } from '../lib/format';

interface OrderLogisticsPageProps {
  refreshToken?: number;
}

type LogisticsFilters = {
  orderSn?: string;
  carrier?: string;
  shippingType?: string;
};

const emptyRows: AdminLogisticsRow[] = [];

export function OrderLogisticsPage({ refreshToken = 0 }: OrderLogisticsPageProps) {
  const [searchForm] = Form.useForm<LogisticsFilters>();
  const [rows, setRows] = useState<AdminLogisticsRow[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogisticsFilters>({});
  const [status, setStatus] = useState<'all' | AdminLogisticsRow['status']>('all');
  const [selected, setSelected] = useState<AdminLogisticsRow | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminLogistics().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '物流管理加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const carrierOptions = useMemo(() => buildOptions(rows, 'carrier'), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
        if (status !== 'all' && record.status !== status) return false;
        if (filters.orderSn && !orderRef.includes(filters.orderSn.trim().toLowerCase())) return false;
        if (filters.carrier && record.carrier !== filters.carrier) return false;
        if (filters.shippingType && record.shippingTypeLabel !== filters.shippingType) return false;
        return true;
      }),
    [filters.carrier, filters.orderSn, filters.shippingType, rows, status],
  );

  const columns: ProColumns<AdminLogisticsRow>[] = [
    {
      title: '履约单',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.fulfillmentSn || record.orderSn || record.id}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.productSummary}
          </Typography.Text>
        </div>
      ),
    },
    { title: '收货人', dataIndex: 'receiver', width: 140, render: (_, record) => record.receiver || '-' },
    { title: '物流方式', dataIndex: 'shippingTypeLabel', width: 140 },
    { title: '承运商', dataIndex: 'carrier', width: 140 },
    { title: '单号', dataIndex: 'trackingNo', width: 180, render: (_, record) => record.trackingNo || '-' },
    { title: '状态', dataIndex: 'statusLabel', width: 120 },
    { title: '发货时间', dataIndex: 'shippedAt', width: 180, render: (_, record) => (record.shippedAt ? formatDateTime(record.shippedAt) : '-') },
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
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="orderSn">
          <Input allowClear placeholder="订单号" />
        </Form.Item>
        <Form.Item name="carrier">
          <Select allowClear options={carrierOptions} placeholder="承运商" />
        </Form.Item>
        <Form.Item name="shippingType">
          <Select
            allowClear
            options={[
              { label: '快递', value: '快递' },
              { label: '同城配送', value: '同城配送' },
              { label: '到店自提', value: '到店自提' },
              { label: '未知', value: '未知' },
            ]}
            placeholder="物流方式"
          />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'stored', label: '已建单', count: rows.filter((item) => item.status === 'stored').length },
          { key: 'shipping', label: '配送中', count: rows.filter((item) => item.status === 'shipping').length },
          { key: 'completed', label: '已完成', count: rows.filter((item) => item.status === 'completed').length },
          { key: 'cancelled', label: '已取消', count: rows.filter((item) => item.status === 'cancelled').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminLogisticsRow>
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
      <Drawer open={selected != null} title="物流管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="履约单">{selected.fulfillmentSn || selected.orderSn || selected.id}</Descriptions.Item>
            <Descriptions.Item label="订单号">{selected.orderSn || '-'}</Descriptions.Item>
            <Descriptions.Item label="商品摘要">{selected.productSummary}</Descriptions.Item>
            <Descriptions.Item label="收货人">{selected.receiver || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selected.phoneNumber || '-'}</Descriptions.Item>
            <Descriptions.Item label="物流方式">{selected.shippingTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="承运商">{selected.carrier}</Descriptions.Item>
            <Descriptions.Item label="单号">{selected.trackingNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="发货时间">{selected.shippedAt ? formatDateTime(selected.shippedAt) : '-'}</Descriptions.Item>
            <Descriptions.Item label="完成时间">{selected.completedAt ? formatDateTime(selected.completedAt) : '-'}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
