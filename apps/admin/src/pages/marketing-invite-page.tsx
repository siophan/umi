import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatNumber } from '../lib/format';

interface MarketingInvitePageProps {
  refreshToken?: number;
}

type InviteRow = {
  campaign: string;
  channel: string;
  convertedUsers: number;
  id: string;
  invitedUsers: number;
  rewardCost: number;
  status: '进行中' | '复盘中' | '待发布';
};

type InviteFilters = {
  campaign?: string;
  channel?: string;
};

function statusColor(status: string) {
  if (status.includes('进行')) {
    return 'success';
  }
  if (status.includes('复盘')) {
    return 'warning';
  }
  return 'default';
}

export function MarketingInvitePage({ refreshToken = 0 }: MarketingInvitePageProps) {
  const [searchForm] = Form.useForm<InviteFilters>();
  const [filters, setFilters] = useState<InviteFilters>({});
  const [status, setStatus] = useState<'all' | InviteRow['status']>('all');
  const [selected, setSelected] = useState<InviteRow | null>(null);

  const rows: InviteRow[] = [
    { id: 'invite-1', campaign: '老带新拉新', channel: '站内 + 微信', invitedUsers: 1240, convertedUsers: 386, rewardCost: 580000, status: '进行中' },
    { id: 'invite-2', campaign: '品牌联名专场', channel: '短信', invitedUsers: 620, convertedUsers: 104, rewardCost: 160000, status: '复盘中' },
  ];

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.campaign && !record.campaign.toLowerCase().includes(filters.campaign.trim().toLowerCase())) {
          return false;
        }
        if (filters.channel && record.channel !== filters.channel) {
          return false;
        }
        return true;
      }),
    [filters.campaign, filters.channel, rows, status],
  );

  const columns: ProColumns<InviteRow>[] = [
    { title: '活动', dataIndex: 'campaign', width: 220 },
    { title: '渠道', dataIndex: 'channel', width: 160 },
    { title: '邀请用户', dataIndex: 'invitedUsers', width: 120, render: (_, record) => formatNumber(record.invitedUsers) },
    { title: '转化用户', dataIndex: 'convertedUsers', width: 120, render: (_, record) => formatNumber(record.convertedUsers) },
    { title: '奖励成本', dataIndex: 'rewardCost', width: 120, render: (_, record) => formatAmount(record.rewardCost) },
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
        <Form.Item name="campaign">
          <Input allowClear placeholder="活动名称" />
        </Form.Item>
        <Form.Item name="channel">
          <Select allowClear options={buildOptions(rows as Array<Record<string, unknown>>, 'channel')} placeholder="渠道" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '进行中', label: '进行中', count: rows.filter((item) => item.status === '进行中').length },
          { key: '复盘中', label: '复盘中', count: rows.filter((item) => item.status === '复盘中').length },
          { key: '待发布', label: '待发布', count: rows.filter((item) => item.status === '待发布').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<InviteRow>
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

      <Drawer open={selected != null} title="邀请管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="活动">{selected.campaign}</Descriptions.Item>
            <Descriptions.Item label="渠道">{selected.channel}</Descriptions.Item>
            <Descriptions.Item label="邀请用户">{formatNumber(selected.invitedUsers)}</Descriptions.Item>
            <Descriptions.Item label="转化用户">{formatNumber(selected.convertedUsers)}</Descriptions.Item>
            <Descriptions.Item label="奖励成本">{formatAmount(selected.rewardCost)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
