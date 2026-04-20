import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { fetchAdminChats, type AdminChatItem } from '../lib/api/system';
import { formatDateTime } from '../lib/format';
import { AdminDataTablePage, useAsyncPageData } from './shared/admin-page-tools';

interface SystemChatsPageProps {
  refreshToken?: number;
}

function riskTag(record: AdminChatItem) {
  return (
    <Tag
      color={
        record.riskLevel === 'high'
          ? 'error'
          : record.riskLevel === 'medium'
            ? 'warning'
            : 'success'
      }
    >
      {record.riskLevel === 'high' ? '高风险' : record.riskLevel === 'medium' ? '中风险' : '低风险'}
    </Tag>
  );
}

export function SystemChatsPage({ refreshToken = 0 }: SystemChatsPageProps) {
  const { data: rows, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '聊天会话加载失败',
    initialData: [] as AdminChatItem[],
    load: async () => {
      const result = await fetchAdminChats();
      return result.items;
    },
  });

  const columns: TableColumnsType<AdminChatItem> = [
    {
      title: '会话双方',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.userA.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.userB.name}</Typography.Text>
        </div>
      ),
    },
    { title: '消息数', dataIndex: 'messages' },
    { title: '未读', dataIndex: 'unreadMessages' },
    { title: '风险等级', render: (_, record) => riskTag(record) },
    { title: '状态', dataIndex: 'status' },
    { title: '更新时间', dataIndex: 'updatedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="聊天详情"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            const pair = `${record.userA.name} ${record.userB.name}`.toLowerCase();
            if (filters.keyword && !pair.includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.riskLevel !== filters.second) {
              return false;
            }
            if (filters.third && record.status !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="会话用户"
        secondField={{
          options: [
            { label: 'low', value: 'low' },
            { label: 'medium', value: 'medium' },
            { label: 'high', value: 'high' },
          ],
          placeholder: '风险等级',
        }}
        statusItems={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'normal', label: 'normal', count: rows.filter((item) => item.status === 'normal').length },
          { key: 'review', label: 'review', count: rows.filter((item) => item.status === 'review').length },
          { key: 'escalated', label: 'escalated', count: rows.filter((item) => item.status === 'escalated').length },
        ]}
        thirdField={{
          options: [
            { label: 'normal', value: 'normal' },
            { label: 'review', value: 'review' },
            { label: 'escalated', value: 'escalated' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
