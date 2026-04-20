import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminPkMatchItem } from '../lib/api/catalog';
import { fetchAdminPkMatches } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatDateTime } from '../lib/format';

interface PkMatchesPageProps {
  refreshToken?: number;
}

type PkFilters = {
  title?: string;
  leftUser?: string;
};

const emptyRows: AdminPkMatchItem[] = [];

function pkStatusTag(record: AdminPkMatchItem) {
  const color =
    record.status === 'completed'
      ? 'success'
      : record.status === 'cancelled'
        ? 'default'
        : record.status === 'active'
          ? 'processing'
          : 'warning';
  return <Tag color={color}>{record.statusLabel}</Tag>;
}

export function PkMatchesPage({ refreshToken = 0 }: PkMatchesPageProps) {
  const [searchForm] = Form.useForm<PkFilters>();
  const [rows, setRows] = useState<AdminPkMatchItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<PkFilters>({});
  const [status, setStatus] = useState<'all' | AdminPkMatchItem['status']>('all');
  const [selected, setSelected] = useState<AdminPkMatchItem | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminPkMatches().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : 'PK 对战加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const leftUserOptions = useMemo(() => buildOptions(rows, 'leftUser'), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) return false;
        if (filters.title && !record.title.toLowerCase().includes(filters.title.trim().toLowerCase())) return false;
        if (filters.leftUser && record.leftUser !== filters.leftUser) return false;
        return true;
      }),
    [filters.leftUser, filters.title, rows, status],
  );

  const columns: ProColumns<AdminPkMatchItem>[] = [
    {
      title: '对战',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.leftUser} vs {record.rightUser}</Typography.Text>
        </div>
      ),
    },
    { title: '双方选择', width: 180, render: (_, record) => `${record.leftChoice || '-'} / ${record.rightChoice || '-'}` },
    { title: '对战金额', dataIndex: 'stake', width: 120, render: (_, record) => formatAmount(record.stake) },
    { title: '结果', dataIndex: 'result', width: 120, render: (_, record) => record.result || '-' },
    { title: '状态', width: 120, render: (_, record) => pkStatusTag(record) },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (_, record) => formatDateTime(record.createdAt) },
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
        <Form.Item name="title">
          <Input allowClear placeholder="对战标题" />
        </Form.Item>
        <Form.Item name="leftUser">
          <Select allowClear options={leftUserOptions} placeholder="对战发起方" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'pending', label: '待开赛', count: rows.filter((item) => item.status === 'pending').length },
          { key: 'active', label: '进行中', count: rows.filter((item) => item.status === 'active').length },
          { key: 'completed', label: '完成', count: rows.filter((item) => item.status === 'completed').length },
          { key: 'cancelled', label: '已取消', count: rows.filter((item) => item.status === 'cancelled').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminPkMatchItem>
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
      <Drawer open={selected != null} title="PK 对战" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="对战标题">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="双方">{selected.leftUser} vs {selected.rightUser}</Descriptions.Item>
            <Descriptions.Item label="双方选择">{`${selected.leftChoice || '-'} / ${selected.rightChoice || '-'}`}</Descriptions.Item>
            <Descriptions.Item label="对战金额">{formatAmount(selected.stake)}</Descriptions.Item>
            <Descriptions.Item label="结果">{selected.result || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
