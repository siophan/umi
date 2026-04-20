import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime, formatPercent } from '../lib/format';

interface MarketingBannersPageProps {
  refreshToken?: number;
}

type BannerRow = {
  audience: string;
  clickRate: number;
  id: string;
  position: string;
  status: '投放中' | '待排期' | '已暂停';
  title: string;
  updatedAt: string;
};

type BannerFilters = {
  title?: string;
  position?: string;
};

function statusColor(status: string) {
  if (status.includes('投放')) {
    return 'success';
  }
  if (status.includes('暂停')) {
    return 'warning';
  }
  return 'default';
}

export function MarketingBannersPage({ refreshToken = 0 }: MarketingBannersPageProps) {
  const [searchForm] = Form.useForm<BannerFilters>();
  const [filters, setFilters] = useState<BannerFilters>({});
  const [status, setStatus] = useState<'all' | BannerRow['status']>('all');
  const [selected, setSelected] = useState<BannerRow | null>(null);
  const lastUpdatedAt = useMemo(() => new Date().toISOString(), [refreshToken]);
  const rows: BannerRow[] = [
    { id: 'banner-1', title: 'Panda 限时竞猜季', position: '首页头图', audience: '全体用户', status: '投放中', clickRate: 8.4, updatedAt: lastUpdatedAt },
    { id: 'banner-2', title: '新店入驻奖励', position: '商城二屏', audience: '新注册店主', status: '待排期', clickRate: 4.1, updatedAt: lastUpdatedAt },
  ];

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.title && !record.title.toLowerCase().includes(filters.title.trim().toLowerCase())) {
          return false;
        }
        if (filters.position && record.position !== filters.position) {
          return false;
        }
        return true;
      }),
    [filters.position, filters.title, rows, status],
  );

  const columns: ProColumns<BannerRow>[] = [
    { title: 'Banner', dataIndex: 'title', width: 240 },
    { title: '投放位', dataIndex: 'position', width: 160 },
    { title: '目标人群', dataIndex: 'audience', width: 180 },
    { title: '点击率', dataIndex: 'clickRate', width: 120, render: (_, record) => formatPercent(record.clickRate / 100) },
    { title: '状态', dataIndex: 'status', width: 120, render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (_, record) => formatDateTime(record.updatedAt) },
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
        <Form.Item name="title">
          <Input allowClear placeholder="Banner 标题" />
        </Form.Item>
        <Form.Item name="position">
          <Select allowClear options={buildOptions(rows, 'position')} placeholder="投放位" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '投放中', label: '投放中', count: rows.filter((item) => item.status === '投放中').length },
          { key: '待排期', label: '待排期', count: rows.filter((item) => item.status === '待排期').length },
          { key: '已暂停', label: '已暂停', count: rows.filter((item) => item.status === '已暂停').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<BannerRow>
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

      <Drawer open={selected != null} title="轮播管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Banner">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="投放位">{selected.position}</Descriptions.Item>
            <Descriptions.Item label="目标人群">{selected.audience}</Descriptions.Item>
            <Descriptions.Item label="点击率">{formatPercent(selected.clickRate / 100)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
