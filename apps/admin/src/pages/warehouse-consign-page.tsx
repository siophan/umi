import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminConsignRow } from '../lib/api/orders';
import { fetchAdminConsignRows } from '../lib/api/orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatDateTime } from '../lib/format';

interface WarehouseConsignPageProps {
  refreshToken?: number;
}

type ConsignFilters = {
  productName?: string;
  sourceType?: string;
};

const emptyRows: AdminConsignRow[] = [];

export function WarehouseConsignPage({ refreshToken = 0 }: WarehouseConsignPageProps) {
  const [searchForm] = Form.useForm<ConsignFilters>();
  const [rows, setRows] = useState<AdminConsignRow[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConsignFilters>({});
  const [status, setStatus] = useState<string>('all');
  const [selected, setSelected] = useState<AdminConsignRow | null>(null);

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

  const sourceTypeOptions = useMemo(() => buildOptions(rows, 'sourceType'), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.statusLabel !== status) return false;
        if (filters.productName && !record.productName.toLowerCase().includes(filters.productName.trim().toLowerCase())) return false;
        if (filters.sourceType && record.sourceType !== filters.sourceType) return false;
        return true;
      }),
    [filters.productName, filters.sourceType, rows, status],
  );

  const columns: ProColumns<AdminConsignRow>[] = [
    {
      title: '寄售商品',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.productName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">卖家 {record.userId}</Typography.Text>
        </div>
      ),
    },
    { title: '成交价', dataIndex: 'price', width: 120, render: (_, record) => formatAmount(record.price) },
    { title: '挂单价', dataIndex: 'listingPrice', width: 120, render: (_, record) => (record.listingPrice ? formatAmount(record.listingPrice) : '-') },
    { title: '佣金', dataIndex: 'commissionAmount', width: 120, render: (_, record) => formatAmount(record.commissionAmount) },
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
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="productName">
          <Input allowClear placeholder="商品名称" />
        </Form.Item>
        <Form.Item name="sourceType">
          <Select allowClear options={sourceTypeOptions} placeholder="来源类型" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '待上架', label: '待上架', count: rows.filter((item) => item.statusLabel === '待上架').length },
          { key: '寄售中', label: '寄售中', count: rows.filter((item) => item.statusLabel === '寄售中').length },
          { key: '已成交', label: '已成交', count: rows.filter((item) => item.statusLabel === '已成交').length },
          { key: '已结算', label: '已结算', count: rows.filter((item) => item.statusLabel === '已结算').length },
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
      <Drawer open={selected != null} title="寄售市场" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="商品名称">{selected.productName}</Descriptions.Item>
            <Descriptions.Item label="卖家">{selected.userId}</Descriptions.Item>
            <Descriptions.Item label="成交价">{formatAmount(selected.price)}</Descriptions.Item>
            <Descriptions.Item label="挂单价">{selected.listingPrice ? formatAmount(selected.listingPrice) : '-'}</Descriptions.Item>
            <Descriptions.Item label="佣金">{formatAmount(selected.commissionAmount)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="来源类型">{selected.sourceType}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
