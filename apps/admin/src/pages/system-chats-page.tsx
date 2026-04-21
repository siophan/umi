import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { fetchAdminChats, type AdminChatItem } from '../lib/api/system';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime } from '../lib/format';

interface SystemChatsPageProps {
  refreshToken?: number;
}

type ChatFilters = {
  pair?: string;
  riskLevel?: string;
};

function riskTag(record: AdminChatItem) {
  return (
    <Tag color={record.riskLevel === 'high' ? 'error' : record.riskLevel === 'medium' ? 'warning' : 'success'}>
      {record.riskLevel === 'high' ? '高风险' : record.riskLevel === 'medium' ? '中风险' : '低风险'}
    </Tag>
  );
}

export function SystemChatsPage({ refreshToken = 0 }: SystemChatsPageProps) {
  const [searchForm] = Form.useForm<ChatFilters>();
  const [rows, setRows] = useState<AdminChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChatFilters>({});
  const [status, setStatus] = useState<'all' | AdminChatItem['status']>('all');

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminChats();
        if (!alive) return;
        setRows(result.items);
      } catch (error) {
        if (!alive) return;
        setRows([]);
        setIssue(error instanceof Error ? error.message : '聊天会话加载失败');
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
        const pair = `${record.userA.name} ${record.userB.name}`.toLowerCase();
        if (filters.pair && !pair.includes(filters.pair.trim().toLowerCase())) return false;
        if (filters.riskLevel && record.riskLevel !== filters.riskLevel) return false;
        return true;
      }),
    [filters.pair, filters.riskLevel, rows, status],
  );

  const columns: ProColumns<AdminChatItem>[] = [
    {
      title: '会话双方',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.userA.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.userB.name}</Typography.Text>
        </div>
      ),
    },
    { title: '消息数', dataIndex: 'messages', width: 100 },
    { title: '未读', dataIndex: 'unreadMessages', width: 100 },
    { title: '风险等级', width: 120, render: (_, record) => riskTag(record) },
    { title: '状态', dataIndex: 'status', width: 120 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (_, record) => formatDateTime(record.updatedAt) },
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
            window.location.hash = `#/system/chats/detail/${record.id}`;
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
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="pair">
          <Input allowClear placeholder="会话用户" />
        </Form.Item>
        <Form.Item name="riskLevel">
          <Select
            allowClear
            options={[
              { label: '低风险', value: 'low' },
              { label: '中风险', value: 'medium' },
              { label: '高风险', value: 'high' },
            ]}
            placeholder="风险等级"
          />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'normal', label: '正常', count: rows.filter((item) => item.status === 'normal').length },
          { key: 'review', label: '复核中', count: rows.filter((item) => item.status === 'review').length },
          { key: 'escalated', label: '升级处理', count: rows.filter((item) => item.status === 'escalated').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminChatItem>
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
