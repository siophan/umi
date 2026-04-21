import type { ProColumns } from '@ant-design/pro-components';
import type {
  AdminEquityAccountItem,
  AdminEquityLogItem,
  AdjustAdminEquityPayload,
} from '@umi/shared';
import { Avatar, Button, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { formatAmount, formatDateTime } from './format';

export type EquityFilters = {
  userId?: string;
  userName?: string;
  phone?: string;
};

export type AdjustFormValues = {
  subType: AdjustAdminEquityPayload['subType'];
  amount: number;
  note?: string;
};

export const EQUITY_SUB_TYPE_OPTIONS = [
  { label: '类目权益金', value: 'category' },
  { label: '换购权益金', value: 'exchange' },
  { label: '通兑资产', value: 'general' },
] as const;

const EQUITY_LOG_TYPE_META: Record<
  AdminEquityLogItem['type'],
  { color: string; label: string }
> = {
  grant: { color: 'success', label: '发放' },
  use: { color: 'warning', label: '使用' },
  expire: { color: 'error', label: '过期' },
  adjust: { color: 'processing', label: '调整' },
  unknown: { color: 'default', label: '未知' },
};

const EQUITY_SUB_TYPE_LABEL: Record<NonNullable<AdminEquityLogItem['subType']>, string> = {
  category: '类目权益金',
  exchange: '换购权益金',
  general: '通兑资产',
};

export function formatEquitySource(sourceType: number | null) {
  if (sourceType === 40) {
    return '后台调账';
  }
  if (sourceType == null) {
    return '-';
  }
  return `来源类型 ${sourceType}`;
}

export function buildEquityColumns(args: {
  onAdjust: (record: AdminEquityAccountItem) => void;
  onView: (record: AdminEquityAccountItem) => void;
}): ProColumns<AdminEquityAccountItem>[] {
  return [
    {
      title: '用户',
      width: 220,
      render: (_, record) => (
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <Avatar src={record.avatarUrl}>{record.userName?.slice(0, 1) || 'U'}</Avatar>
          <div>
            <Typography.Text strong>{record.userName || record.userId}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              {record.userId}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      width: 140,
      render: (_, record) => record.phoneNumber || '-',
    },
    {
      title: '类目权益金',
      dataIndex: 'categoryAmount',
      width: 120,
      render: (_, record) => formatAmount(record.categoryAmount),
    },
    {
      title: '换购权益金',
      dataIndex: 'exchangeAmount',
      width: 120,
      render: (_, record) => formatAmount(record.exchangeAmount),
    },
    {
      title: '通兑资产',
      dataIndex: 'generalAmount',
      width: 120,
      render: (_, record) => formatAmount(record.generalAmount),
    },
    {
      title: '总余额',
      dataIndex: 'totalBalance',
      width: 120,
      render: (_, record) => (
        <Typography.Text strong>{formatAmount(record.totalBalance)}</Typography.Text>
      ),
    },
    {
      title: '累计发放',
      dataIndex: 'totalGranted',
      width: 120,
      render: (_, record) => formatAmount(record.totalGranted),
    },
    {
      title: '累计使用',
      dataIndex: 'totalUsed',
      width: 120,
      render: (_, record) => formatAmount(record.totalUsed),
    },
    {
      title: '累计过期',
      dataIndex: 'totalExpired',
      width: 120,
      render: (_, record) => formatAmount(record.totalExpired),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.updatedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => [
        <Button key="view" size="small" type="link" onClick={() => args.onView(record)}>
          查看
        </Button>,
        <Button key="adjust" size="small" type="link" onClick={() => args.onAdjust(record)}>
          调账
        </Button>,
      ],
    },
  ];
}

export function buildEquityLogColumns(): TableColumnsType<AdminEquityLogItem> {
  return [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (_, record) => (
        <Tag color={EQUITY_LOG_TYPE_META[record.type].color}>
          {EQUITY_LOG_TYPE_META[record.type].label}
        </Tag>
      ),
    },
    {
      title: '子账户',
      dataIndex: 'subType',
      width: 120,
      render: (_, record) => (record.subType ? EQUITY_SUB_TYPE_LABEL[record.subType] : '-'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (_, record) => (
        <Typography.Text type={record.amount < 0 ? 'danger' : undefined}>
          {formatAmount(record.amount)}
        </Typography.Text>
      ),
    },
    {
      title: '变动后余额',
      dataIndex: 'balance',
      width: 130,
      render: (_, record) => formatAmount(record.balance),
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 120,
      render: (_, record) => formatEquitySource(record.sourceType),
    },
    {
      title: '备注',
      dataIndex: 'note',
      render: (_, record) => record.note || '-',
    },
  ];
}
