import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminFriendGuessItem } from '../lib/api/catalog';
import { fetchAdminFriendGuesses } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

interface FriendGuessesPageProps {
  refreshToken?: number;
}

type FriendGuessFilters = {
  roomName?: string;
  inviter?: string;
  reward?: string;
  paymentMode?: string;
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

  const paymentModeOptions = useMemo(
    () => [
      { label: '发起人支付', value: '10' },
      { label: 'AA 支付', value: '20' },
    ],
    [],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) return false;
        if (filters.roomName && !record.roomName.toLowerCase().includes(filters.roomName.trim().toLowerCase())) return false;
        if (
          filters.inviter &&
          !record.inviter.toLowerCase().includes(filters.inviter.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          filters.reward &&
          !record.reward.toLowerCase().includes(filters.reward.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.paymentMode && String(record.paymentMode ?? '') !== filters.paymentMode) {
          return false;
        }
        return true;
      }),
    [filters.inviter, filters.paymentMode, filters.reward, filters.roomName, rows, status],
  );

  const columns: ProColumns<AdminFriendGuessItem>[] = [
    {
      title: '房间名称',
      dataIndex: 'roomName',
      width: 240,
    },
    {
      title: '发起人',
      dataIndex: 'inviter',
      width: 140,
    },
    {
      title: '奖励',
      dataIndex: 'reward',
      width: 200,
      ellipsis: true,
    },
    { title: '参与人数', dataIndex: 'participants', width: 100, render: (_, record) => formatNumber(record.participants) },
    {
      title: '邀请进度',
      width: 140,
      render: (_, record) =>
        `${formatNumber(record.acceptedInvitations)}/${formatNumber(record.invitationCount)}`,
    },
    {
      title: '结果确认',
      width: 140,
      render: (_, record) =>
        `${formatNumber(record.confirmedResults)}/${formatNumber(record.betParticipantCount)}`,
    },
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
        defaultCount={3}
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
          <Input allowClear placeholder="发起人" />
        </Form.Item>
        <Form.Item name="reward">
          <Input allowClear placeholder="奖励" />
        </Form.Item>
        <Form.Item name="paymentMode">
          <Select allowClear options={paymentModeOptions} placeholder="支付模式" />
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
            <Descriptions.Item label="竞猜 ID">{selected.guessId}</Descriptions.Item>
            <Descriptions.Item label="房间名称">{selected.roomName}</Descriptions.Item>
            <Descriptions.Item label="发起人">{selected.inviter}</Descriptions.Item>
            <Descriptions.Item label="奖励">{selected.reward}</Descriptions.Item>
            <Descriptions.Item label="参与人数">{formatNumber(selected.participants)}</Descriptions.Item>
            <Descriptions.Item label="邀请数">{formatNumber(selected.invitationCount)}</Descriptions.Item>
            <Descriptions.Item label="待响应">{formatNumber(selected.pendingInvitations)}</Descriptions.Item>
            <Descriptions.Item label="已接受">{formatNumber(selected.acceptedInvitations)}</Descriptions.Item>
            <Descriptions.Item label="已拒绝">{formatNumber(selected.rejectedInvitations)}</Descriptions.Item>
            <Descriptions.Item label="已过期">{formatNumber(selected.expiredInvitations)}</Descriptions.Item>
            <Descriptions.Item label="已下注人数">{formatNumber(selected.betParticipantCount)}</Descriptions.Item>
            <Descriptions.Item label="已确认结果">{formatNumber(selected.confirmedResults)}</Descriptions.Item>
            <Descriptions.Item label="拒绝确认">{formatNumber(selected.rejectedResults)}</Descriptions.Item>
            <Descriptions.Item label="已支付金额">{formatAmount(selected.paidAmount)}</Descriptions.Item>
            <Descriptions.Item label="支付模式">{paymentModeLabel(selected.paymentMode)}</Descriptions.Item>
            <Descriptions.Item label="支付人">{selected.paidBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="截止时间">{formatDateTime(selected.endTime)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
