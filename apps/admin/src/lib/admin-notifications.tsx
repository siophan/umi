import type { CreateAdminNotificationPayload } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Typography } from 'antd';

import type { AdminNotificationItem } from './api/system';
import { formatDateTime, formatPercent } from './format';

export type NotificationFilters = {
  keyword?: string;
  type?: AdminNotificationItem['type'];
  audience?: Exclude<AdminNotificationItem['audience'], 'targeted_users'>;
};

export type NotificationFormValues = {
  title: string;
  content: string;
  type: CreateAdminNotificationPayload['type'];
  audience: CreateAdminNotificationPayload['audience'];
  actionUrl?: string;
};

export const NOTIFICATION_TYPE_OPTIONS = [
  { label: '系统通知', value: 'system' },
  { label: '订单通知', value: 'order' },
  { label: '竞猜通知', value: 'guess' },
  { label: '社交通知', value: 'social' },
] as const;

export const NOTIFICATION_AUDIENCE_OPTIONS = [
  { label: '全部用户', value: 'all_users' },
  { label: '订单用户', value: 'order_users' },
  { label: '竞猜用户', value: 'guess_users' },
  { label: '动态用户', value: 'post_users' },
  { label: '聊天用户', value: 'chat_users' },
] as const;

export const NOTIFICATION_TYPE_LABELS: Record<AdminNotificationItem['type'], string> = {
  system: '系统通知',
  order: '订单通知',
  guess: '竞猜通知',
  social: '社交通知',
};

export const NOTIFICATION_AUDIENCE_LABELS: Record<AdminNotificationItem['audience'], string> = {
  all_users: '全部用户',
  order_users: '订单用户',
  guess_users: '竞猜用户',
  post_users: '动态用户',
  chat_users: '聊天用户',
  targeted_users: '指定用户',
};

export function buildNotificationColumns(args: {
  onView: (record: AdminNotificationItem) => void;
}): ProColumns<AdminNotificationItem>[] {
  return [
    {
      title: '通知标题',
      dataIndex: 'title',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {NOTIFICATION_TYPE_LABELS[record.type]}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '目标人群',
      dataIndex: 'audience',
      width: 140,
      render: (_, record) => NOTIFICATION_AUDIENCE_LABELS[record.audience] ?? record.audience,
    },
    {
      title: '接收人数',
      dataIndex: 'recipientCount',
      width: 120,
    },
    {
      title: '已读率',
      width: 120,
      render: (_, record) =>
        formatPercent(record.recipientCount === 0 ? 0 : record.readCount / record.recipientCount),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: () => <Tag color="success">已发送</Tag>,
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      width: 180,
      render: (_, record) => formatDateTime(record.sentAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
        </div>
      ),
    },
  ];
}
