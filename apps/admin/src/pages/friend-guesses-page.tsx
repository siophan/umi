import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminFriendGuessItem } from '../lib/api/catalog';
import { fetchAdminFriendGuesses } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

interface FriendGuessesPageProps {
  refreshToken?: number;
}

type FriendGuessFilters = {
  roomName?: string;
  inviter?: string;
};

const emptyRows: AdminFriendGuessItem[] = [];

function paymentModeLabel(mode: number | null) {
  if (mode === 10) return '发起人支付';
  if (mode === 20) return 'AA 支付';
  return '-';
}

export function FriendGuessesPage({ refreshToken = 0 }: FriendGuessesPageProps) {
  const [searchForm] = Form.useForm<FriendGuessFilters>();
  const [rows, setRows] = useState<AdminFriendGuessItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<FriendGuessFilters>({});
  const [status, setStatus] = useState<'all' | AdminFriendGuessItem['status']>('all');
  const [selected, setSelected] = useState<AdminFriendGuessItem | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminFriendGuesses().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '好友竞猜加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const inviterOptions = useMemo(() => buildOptions(rows, 'inviter'), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) return false;
        if (filters.roomName && !record.roomName.toLowerCase().includes(filters.roomName.trim().toLowerCase())) return false;
        if (filters.inviter && record.inviter !== filters.inviter) return false;
        return true;
      }),
    [filters.inviter, filters.roomName, rows, status],
  );

  const columns: ProColumns<AdminFriendGuessItem>[] = [
    {
      title: '房间',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.roomName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">发起人 {record.inviter}</Typography.Text>
        </div>
      ),
    },
    { title: '参与人数', dataIndex: 'participants', width: 100, render: (_, record) => formatNumber(record.participants) },
    { title: '邀请数', dataIndex: 'invitationCount', width: 100, render: (_, record) => formatNumber(record.invitationCount) },
    { title: '已支付金额', dataIndex: 'paidAmount', width: 120, render: (_, record) => formatAmount(record.paidAmount) },
    { title: '支付模式', dataIndex: 'paymentMode', width: 120, render: (_, record) => paymentModeLabel(record.paymentMode) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'processing' : record.status === 'ended' ? 'default' : 'warning'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '截止时间', dataIndex: 'endTime', width: 180, render: (_, record) => formatDateTime(record.endTime) },
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
        <Form.Item name="roomName">
          <Input allowClear placeholder="房间名称" />
        </Form.Item>
        <Form.Item name="inviter">
          <Select allowClear options={inviterOptions} placeholder="发起人" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'pending', label: '待开赛', count: rows.filter((item) => item.status === 'pending').length },
          { key: 'active', label: '进行中', count: rows.filter((item) => item.status === 'active').length },
          { key: 'ended', label: '已结束', count: rows.filter((item) => item.status === 'ended').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminFriendGuessItem>
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
      <Drawer open={selected != null} title="好友竞猜" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="房间名称">{selected.roomName}</Descriptions.Item>
            <Descriptions.Item label="发起人">{selected.inviter}</Descriptions.Item>
            <Descriptions.Item label="参与人数">{formatNumber(selected.participants)}</Descriptions.Item>
            <Descriptions.Item label="邀请数">{formatNumber(selected.invitationCount)}</Descriptions.Item>
            <Descriptions.Item label="已支付金额">{formatAmount(selected.paidAmount)}</Descriptions.Item>
            <Descriptions.Item label="支付模式">{paymentModeLabel(selected.paymentMode)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="截止时间">{formatDateTime(selected.endTime)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
