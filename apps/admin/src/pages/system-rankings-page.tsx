import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime } from '../lib/format';

interface SystemRankingsPageProps {
  refreshToken?: number;
}

type RankingRow = {
  dimension: string;
  id: string;
  lastGeneratedAt: string;
  name: string;
  publishScope: string;
  refreshRule: string;
  status: '启用中' | '待灰度';
};

type RankingFilters = {
  name?: string;
  publishScope?: string;
};

function statusColor(status: string) {
  return status.includes('启用') ? 'success' : 'default';
}

export function SystemRankingsPage({ refreshToken = 0 }: SystemRankingsPageProps) {
  const [searchForm] = Form.useForm<RankingFilters>();
  const [filters, setFilters] = useState<RankingFilters>({});
  const [status, setStatus] = useState<'all' | RankingRow['status']>('all');
  const [selected, setSelected] = useState<RankingRow | null>(null);
  const lastGeneratedAt = useMemo(() => new Date().toISOString(), [refreshToken]);
  const rows: RankingRow[] = [
    { id: 'ranking-1', name: '竞猜热度榜', dimension: '参与人数 + 金额', refreshRule: '每小时刷新', publishScope: '首页 / 竞猜频道', status: '启用中', lastGeneratedAt },
    { id: 'ranking-2', name: '商品热销榜', dimension: '销量 + GMV', refreshRule: '每日 00:10', publishScope: '商城首页', status: '待灰度', lastGeneratedAt },
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
        if (filters.publishScope && record.publishScope !== filters.publishScope) {
          return false;
        }
        return true;
      }),
    [filters.name, filters.publishScope, rows, status],
  );

  const columns: ProColumns<RankingRow>[] = [
    { title: '榜单', dataIndex: 'name', width: 220 },
    { title: '维度', dataIndex: 'dimension', width: 200 },
    { title: '刷新规则', dataIndex: 'refreshRule', width: 160 },
    { title: '发布范围', dataIndex: 'publishScope', width: 180 },
    { title: '状态', dataIndex: 'status', width: 120, render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
    { title: '最近生成', dataIndex: 'lastGeneratedAt', width: 180, render: (_, record) => formatDateTime(record.lastGeneratedAt) },
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
          <Input allowClear placeholder="榜单名称" />
        </Form.Item>
        <Form.Item name="publishScope">
          <Select allowClear options={buildOptions(rows as Array<Record<string, unknown>>, 'publishScope')} placeholder="发布范围" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '启用中', label: '启用中', count: rows.filter((item) => item.status === '启用中').length },
          { key: '待灰度', label: '待灰度', count: rows.filter((item) => item.status === '待灰度').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<RankingRow>
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

      <Drawer open={selected != null} title="排行榜配置" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="榜单">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="维度">{selected.dimension}</Descriptions.Item>
            <Descriptions.Item label="刷新规则">{selected.refreshRule}</Descriptions.Item>
            <Descriptions.Item label="发布范围">{selected.publishScope}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
            <Descriptions.Item label="最近生成">{formatDateTime(selected.lastGeneratedAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
