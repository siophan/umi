import type {
  AdminCommunityReportAction,
  AdminCommunityReportItem,
  AdminCommunityReportListResult,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, Typography } from 'antd';

import { formatDateTime } from './format';

export type CommunityReportFilters = {
  reporter?: string;
  reasonType?: AdminCommunityReportItem['reasonType'];
  targetKeyword?: string;
};

export type CommunityReportStatusFilter = 'all' | AdminCommunityReportItem['status'];

export const EMPTY_COMMUNITY_REPORT_RESULT: AdminCommunityReportListResult = {
  items: [],
  summary: { total: 0, pending: 0, reviewing: 0, resolved: 0, rejected: 0 },
};

export const COMMUNITY_REPORT_REASON_OPTIONS = [
  { label: '垃圾广告', value: 'spam' },
  { label: '低俗色情', value: 'explicit' },
  { label: '人身攻击', value: 'abuse' },
  { label: '虚假信息', value: 'false_info' },
  { label: '其他原因', value: 'other' },
] as const;

export function filterCommunityReports(
  items: AdminCommunityReportItem[],
  status: CommunityReportStatusFilter,
) {
  return items.filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false;
    }
    return true;
  });
}

export function buildCommunityReportStatusItems(
  summary: AdminCommunityReportListResult['summary'],
) {
  return [
    { key: 'all', label: '全部', count: summary.total },
    { key: 'pending', label: '待处理', count: summary.pending },
    { key: 'reviewing', label: '处理中', count: summary.reviewing },
    { key: 'resolved', label: '已处理', count: summary.resolved },
    { key: 'rejected', label: '已驳回', count: summary.rejected },
  ] satisfies Array<{ count: number; key: CommunityReportStatusFilter; label: string }>;
}

export function getCommunityReportActionSuccessMessage(action: AdminCommunityReportAction) {
  if (action === 'review') return '已转处理中';
  if (action === 'approve') return '已采纳并清理内容';
  if (action === 'reject') return '已驳回举报';
  return '已封禁用户并清理内容';
}

function getCommunityReportStatusColor(status: AdminCommunityReportItem['status']) {
  if (status === 'pending') return 'default';
  if (status === 'reviewing') return 'processing';
  if (status === 'resolved') return 'success';
  return 'warning';
}

export function buildCommunityReportColumns(args: {
  onAction: (record: AdminCommunityReportItem, action: AdminCommunityReportAction) => void;
  onView: (record: AdminCommunityReportItem) => void;
  submitting: boolean;
}): ProColumns<AdminCommunityReportItem>[] {
  return [
    {
      title: '被举报内容',
      width: 320,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.targetTitle || '动态内容'}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.targetContent || '内容已删除'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '举报人',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.reporterName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.reporterUid || `用户 ID ${record.reporterUserId}`}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '举报原因',
      width: 160,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.reasonLabel}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.reasonDetail || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Tag color={getCommunityReportStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '举报时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          {record.status === 'pending' ? (
            <Button
              disabled={args.submitting}
              size="small"
              type="link"
              onClick={() => args.onAction(record, 'review')}
            >
              处理中
            </Button>
          ) : null}
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Popconfirm
              title="确认采纳该举报？"
              description="采纳后会删除被举报动态。"
              okText="确认"
              cancelText="取消"
              onConfirm={() => args.onAction(record, 'approve')}
            >
              <Button disabled={args.submitting} size="small" type="link">
                采纳
              </Button>
            </Popconfirm>
          ) : null}
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Popconfirm
              title="确认驳回该举报？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => args.onAction(record, 'reject')}
            >
              <Button disabled={args.submitting} size="small" type="link">
                驳回
              </Button>
            </Popconfirm>
          ) : null}
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Popconfirm
              title="确认封禁被举报用户？"
              description="封禁后会同时删除被举报动态。"
              okText="确认"
              cancelText="取消"
              onConfirm={() => args.onAction(record, 'ban')}
            >
              <Button danger disabled={args.submitting} size="small" type="link">
                封禁
              </Button>
            </Popconfirm>
          ) : null}
        </div>
      ),
    },
  ];
}
