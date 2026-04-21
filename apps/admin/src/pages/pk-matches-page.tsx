import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, Card, ConfigProvider, Descriptions, Drawer, Form, Input, Statistic, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminPkMatchItem, AdminPkMatchStats } from '../lib/api/catalog';
import { fetchAdminPkMatches, fetchAdminPkStats } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatAmount, formatDateTime } from '../lib/format';

interface PkMatchesPageProps {
  refreshToken?: number;
}

type PkFilters = {
  title?: string;
  leftUser?: string;
  rightUser?: string;
};

const emptyRows: AdminPkMatchItem[] = [];
const emptyStats: AdminPkMatchStats = {
  total: 0,
  pending: 0,
  active: 0,
  completed: 0,
  cancelled: 0,
  totalStakeAmount: 0,
};

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

function resultLabel(record: AdminPkMatchItem) {
  return record.result || '-';
}

export function PkMatchesPage({ refreshToken = 0 }: PkMatchesPageProps) {
  const [searchForm] = Form.useForm<PkFilters>();
  const [rows, setRows] = useState<AdminPkMatchItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [statsIssue, setStatsIssue] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminPkMatchStats>(emptyStats);
  const [filters, setFilters] = useState<PkFilters>({});
  const [status, setStatus] = useState<'all' | AdminPkMatchItem['status']>('all');
  const [selected, setSelected] = useState<AdminPkMatchItem | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      setStatsIssue(null);
      try {
        const [listResult, statsResult] = await Promise.allSettled([
          fetchAdminPkMatches(),
          fetchAdminPkStats(),
        ]);
        if (!alive) return;

        if (listResult.status === 'fulfilled') {
          setRows(listResult.value.items);
        } else {
          setRows(emptyRows);
          setIssue(listResult.reason instanceof Error ? listResult.reason.message : 'PK 对战加载失败');
        }

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        } else {
          setStats(emptyStats);
          setStatsIssue(
            statsResult.reason instanceof Error ? statsResult.reason.message : 'PK 统计加载失败',
          );
        }
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
        if (status !== 'all' && record.status !== status) return false;
        if (filters.title && !record.title.toLowerCase().includes(filters.title.trim().toLowerCase())) return false;
        if (
          filters.leftUser &&
          !record.leftUser.toLowerCase().includes(filters.leftUser.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          filters.rightUser &&
          !record.rightUser.toLowerCase().includes(filters.rightUser.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [filters.leftUser, filters.rightUser, filters.title, rows, status],
  );

  const columns: ProColumns<AdminPkMatchItem>[] = [
    {
      title: '对战标题',
      dataIndex: 'title',
      width: 240,
    },
    { title: '发起人', dataIndex: 'leftUser', width: 140 },
    { title: '对手', dataIndex: 'rightUser', width: 140 },
    { title: '发起方选择', width: 160, render: (_, record) => record.leftChoice || '-' },
    { title: '对手选择', width: 160, render: (_, record) => record.rightChoice || '-' },
    { title: '对战金额', dataIndex: 'stake', width: 120, render: (_, record) => formatAmount(record.stake) },
    { title: '结果', dataIndex: 'result', width: 140, render: (_, record) => resultLabel(record) },
    { title: '状态', width: 120, render: (_, record) => pkStatusTag(record) },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (_, record) => formatDateTime(record.createdAt) },
    { title: '结算时间', dataIndex: 'settledAt', width: 180, render: (_, record) => formatDateTime(record.settledAt) },
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
      {statsIssue ? (
        <Alert
          showIcon
          type="warning"
          message="PK 统计加载失败"
          description="PK 主表已按真实列表结果保留，顶部概览暂不可用。"
        />
      ) : null}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <Card>
          <Statistic title="总 PK 数" value={stats.total} />
        </Card>
        <Card>
          <Statistic title="进行中" value={stats.active} />
        </Card>
        <Card>
          <Statistic title="已结算" value={stats.completed} />
        </Card>
        <Card>
          <Statistic title="总对战金额" value={formatAmount(stats.totalStakeAmount)} />
        </Card>
      </div>
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
        <Form.Item name="title">
          <Input allowClear placeholder="对战标题" />
        </Form.Item>
        <Form.Item name="leftUser">
          <Input allowClear placeholder="发起人" />
        </Form.Item>
        <Form.Item name="rightUser">
          <Input allowClear placeholder="对手" />
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
            <Descriptions.Item label="竞猜 ID">{selected.guessId}</Descriptions.Item>
            <Descriptions.Item label="对战标题">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="发起人">{selected.leftUser}</Descriptions.Item>
            <Descriptions.Item label="发起人 ID">{selected.leftUserId}</Descriptions.Item>
            <Descriptions.Item label="对手">{selected.rightUser}</Descriptions.Item>
            <Descriptions.Item label="对手 ID">{selected.rightUserId}</Descriptions.Item>
            <Descriptions.Item label="发起方选择">{selected.leftChoice || '-'}</Descriptions.Item>
            <Descriptions.Item label="对手选择">{selected.rightChoice || '-'}</Descriptions.Item>
            <Descriptions.Item label="对战金额">{formatAmount(selected.stake)}</Descriptions.Item>
            <Descriptions.Item label="结果">{resultLabel(selected)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="奖励类型">
              {selected.rewardType == null ? '-' : String(selected.rewardType)}
            </Descriptions.Item>
            <Descriptions.Item label="奖励值">
              {selected.rewardValue == null ? '-' : String(selected.rewardValue)}
            </Descriptions.Item>
            <Descriptions.Item label="奖励引用">
              {selected.rewardRefId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="结算时间">{formatDateTime(selected.settledAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
