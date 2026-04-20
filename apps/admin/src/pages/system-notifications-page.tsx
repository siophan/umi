import type { TableColumnsType } from 'antd';

import { fetchAdminNotifications, type AdminNotificationItem } from '../lib/api/system';
import { formatDateTime, formatPercent } from '../lib/format';
import { AdminDataTablePage, buildOptions, useAsyncPageData } from './shared/admin-page-tools';

interface SystemNotificationsPageProps {
  refreshToken?: number;
}

export function SystemNotificationsPage({ refreshToken = 0 }: SystemNotificationsPageProps) {
  const { data: rows, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '通知批次加载失败',
    initialData: [] as AdminNotificationItem[],
    load: async () => {
      const result = await fetchAdminNotifications();
      return result.items;
    },
  });

  const columns: TableColumnsType<AdminNotificationItem> = [
    { title: '通知标题', dataIndex: 'title' },
    { title: '消息类型', dataIndex: 'type' },
    { title: '目标人群', dataIndex: 'audience' },
    { title: '接收人数', dataIndex: 'recipientCount' },
    {
      title: '已读率',
      render: (_, record) => formatPercent(record.recipientCount === 0 ? 0 : record.readCount / record.recipientCount),
    },
    { title: '发送时间', dataIndex: 'sentAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="通知详情"
        filterRows={(sourceRows, filters) =>
          sourceRows.filter((record) => {
            if (filters.keyword && !record.title.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.type !== filters.second) {
              return false;
            }
            if (filters.third && record.audience !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="通知标题"
        secondField={{ options: buildOptions(rows, 'type'), placeholder: '消息类型' }}
        thirdField={{ options: buildOptions(rows, 'audience'), placeholder: '目标人群' }}
      />
    </>
  );
}
