import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';

import { formatAmount, formatNumber } from '../lib/format';
import { AdminDataTablePage, buildOptions } from './shared/admin-page-tools';

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
  const rows: InviteRow[] = [
    { id: 'invite-1', campaign: '老带新拉新', channel: '站内 + 微信', invitedUsers: 1240, convertedUsers: 386, rewardCost: 580000, status: '进行中' },
    { id: 'invite-2', campaign: '品牌联名专场', channel: '短信', invitedUsers: 620, convertedUsers: 104, rewardCost: 160000, status: '复盘中' },
  ];

  const columns: TableColumnsType<InviteRow> = [
    { title: '活动', dataIndex: 'campaign' },
    { title: '渠道', dataIndex: 'channel' },
    { title: '邀请用户', dataIndex: 'invitedUsers', render: formatNumber },
    { title: '转化用户', dataIndex: 'convertedUsers', render: formatNumber },
    { title: '奖励成本', dataIndex: 'rewardCost', render: (value: number) => formatAmount(value) },
    { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="邀请管理"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.campaign.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.channel !== filters.second) {
              return false;
            }
            if (filters.third && record.status !== filters.third) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="活动名称"
        secondField={{ options: buildOptions(rows as Array<Record<string, unknown>>, 'channel'), placeholder: '渠道' }}
        statusItems={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '进行中', label: '进行中', count: rows.filter((item) => item.status === '进行中').length },
          { key: '复盘中', label: '复盘中', count: rows.filter((item) => item.status === '复盘中').length },
          { key: '待发布', label: '待发布', count: rows.filter((item) => item.status === '待发布').length },
        ]}
        thirdField={{
          options: [
            { label: '进行中', value: '进行中' },
            { label: '复盘中', value: '复盘中' },
            { label: '待发布', value: '待发布' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
