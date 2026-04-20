import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatNumber } from '../lib/format';

interface MarketingCouponsPageProps {
  refreshToken?: number;
}

type CouponRow = {
  claimed: number;
  faceValue: number;
  id: string;
  name: string;
  scope: string;
  status: '发放中' | '待开始' | '已暂停';
  stock: number;
  type: string;
};

type CouponFilters = {
  name?: string;
  type?: string;
};

function statusColor(status: string) {
  if (status.includes('发放')) {
    return 'success';
  }
  if (status.includes('暂停')) {
    return 'warning';
  }
  return 'default';
}

export function MarketingCouponsPage({ refreshToken = 0 }: MarketingCouponsPageProps) {
  const [searchForm] = Form.useForm<CouponFilters>();
  const [filters, setFilters] = useState<CouponFilters>({});
  const [status, setStatus] = useState<'all' | CouponRow['status']>('all');
  const [selected, setSelected] = useState<CouponRow | null>(null);

  const rows: CouponRow[] = [
    { id: 'coupon-1', name: '满 199 减 20', type: '满减券', scope: '平台通用', stock: 1200, claimed: 840, faceValue: 2000, status: '发放中' },
    { id: 'coupon-2', name: '新客免邮券', type: '运费券', scope: '首单用户', stock: 5000, claimed: 2240, faceValue: 1200, status: '发放中' },
  ];

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.name && !record.name.toLowerCase().includes(filters.name.trim().toLowerCase())) {
          return false;
        }
        if (filters.type && record.type !== filters.type) {
          return false;
        }
        return true;
      }),
    [filters.name, filters.type, rows, status],
  );

  const columns: ProColumns<CouponRow>[] = [
    { title: '券名称', dataIndex: 'name', width: 220 },
    { title: '类型', dataIndex: 'type', width: 140 },
    { title: '适用范围', dataIndex: 'scope', width: 160 },
    { title: '库存', dataIndex: 'stock', width: 100, render: (_, record) => formatNumber(record.stock) },
    { title: '已领取', dataIndex: 'claimed', width: 100, render: (_, record) => formatNumber(record.claimed) },
    { title: '面额', dataIndex: 'faceValue', width: 120, render: (_, record) => formatAmount(record.faceValue) },
    { title: '状态', dataIndex: 'status', width: 120, render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => setSelected(record)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="name">
          <Input allowClear placeholder="优惠券名称" />
        </Form.Item>
        <Form.Item name="type">
          <Select allowClear options={buildOptions(rows as Array<Record<string, unknown>>, 'type')} placeholder="券类型" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '发放中', label: '发放中', count: rows.filter((item) => item.status === '发放中').length },
          { key: '待开始', label: '待开始', count: rows.filter((item) => item.status === '待开始').length },
          { key: '已暂停', label: '已暂停', count: rows.filter((item) => item.status === '已暂停').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<CouponRow>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="优惠券管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="券名称">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{selected.type}</Descriptions.Item>
            <Descriptions.Item label="适用范围">{selected.scope}</Descriptions.Item>
            <Descriptions.Item label="库存">{formatNumber(selected.stock)}</Descriptions.Item>
            <Descriptions.Item label="已领取">{formatNumber(selected.claimed)}</Descriptions.Item>
            <Descriptions.Item label="面额">{formatAmount(selected.faceValue)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
