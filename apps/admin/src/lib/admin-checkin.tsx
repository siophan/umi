import type {
  AdminCheckinRewardConfigItem,
  AdminCheckinRewardConfigStatus,
  AdminCheckinRewardType,
  CreateAdminCheckinRewardConfigPayload,
  UpdateAdminCheckinRewardConfigPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Typography } from 'antd';

import { formatDateTime, formatNumber } from './format';

export type CheckinFilters = {
  dayNo?: number;
  rewardType?: AdminCheckinRewardType;
  title?: string;
};

export type CheckinFormValues = {
  dayNo: number;
  rewardType: AdminCheckinRewardType;
  rewardValue: number;
  rewardRefId?: string;
  title?: string;
  sort?: number;
  status: AdminCheckinRewardConfigStatus;
};

export const REWARD_TYPE_OPTIONS = [
  { label: '零食币', value: 'coin' },
  { label: '优惠券', value: 'coupon' },
  { label: '实物', value: 'physical' },
] as const;

export const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

export function getCheckinRewardStatusColor(status: AdminCheckinRewardConfigItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function buildCheckinStatusItems(summary: {
  total: number;
  active: number;
  disabled: number;
}) {
  return [
    { key: 'all', label: '全部', count: summary.total },
    {
      key: 'active',
      label: '启用',
      count: summary.active,
    },
    {
      key: 'disabled',
      label: '停用',
      count: summary.disabled,
    },
  ] satisfies Array<{
    key: 'all' | AdminCheckinRewardConfigStatus;
    label: string;
    count: number;
  }>;
}

export function formatCheckinRewardContent(record: AdminCheckinRewardConfigItem) {
  if (record.rewardType === 'coin') {
    return `${formatNumber(record.rewardValue)} 零食币`;
  }
  if (record.rewardType === 'coupon') {
    return `优惠券 × ${formatNumber(record.rewardValue)}${
      record.rewardRefId ? ` · 模板ID ${record.rewardRefId}` : ''
    }`;
  }
  return `实物 × ${formatNumber(record.rewardValue)}${
    record.rewardRefId ? ` · 奖品ID ${record.rewardRefId}` : ''
  }`;
}

export function normalizeRewardRefIdInput(value: string | undefined) {
  const text = value?.trim() ?? '';
  if (!text) {
    return null;
  }
  return /^\d+$/.test(text) ? (text as `${bigint}`) : null;
}

export function buildCreateCheckinFormValues(
  rows: AdminCheckinRewardConfigItem[],
): CheckinFormValues {
  return {
    dayNo: rows.length + 1,
    rewardType: 'coin',
    rewardValue: 10,
    sort: rows.length + 1,
    status: 'active',
  };
}

export function buildEditCheckinFormValues(
  record: AdminCheckinRewardConfigItem,
): CheckinFormValues {
  return {
    dayNo: record.dayNo,
    rewardType: record.rewardType,
    rewardValue: record.rewardValue,
    rewardRefId: record.rewardRefId ?? undefined,
    title: record.title ?? undefined,
    sort: record.sort,
    status: record.status,
  };
}

export function buildCheckinPayload(
  values: CheckinFormValues,
  editing: boolean,
): CreateAdminCheckinRewardConfigPayload | UpdateAdminCheckinRewardConfigPayload {
  return {
    dayNo: values.dayNo,
    rewardType: values.rewardType,
    rewardValue: values.rewardValue,
    rewardRefId:
      values.rewardType === 'coupon' || values.rewardType === 'physical'
        ? normalizeRewardRefIdInput(values.rewardRefId)
        : null,
    title: values.title?.trim() || null,
    sort: values.sort ?? values.dayNo,
    ...(editing ? {} : { status: values.status }),
  };
}

export function buildCheckinColumns(args: {
  onView: (record: AdminCheckinRewardConfigItem) => void;
  onEdit: (record: AdminCheckinRewardConfigItem) => void;
  onToggleStatus: (record: AdminCheckinRewardConfigItem) => void | Promise<void>;
}): ProColumns<AdminCheckinRewardConfigItem>[] {
  return [
    {
      title: '签到天数',
      dataIndex: 'dayNo',
      width: 120,
      render: (_, record) => (
        <Typography.Text strong>第 {formatNumber(record.dayNo)} 天</Typography.Text>
      ),
    },
    {
      title: '奖励类型',
      dataIndex: 'rewardTypeLabel',
      width: 120,
    },
    {
      title: '奖励内容',
      width: 240,
      render: (_, record) => formatCheckinRewardContent(record),
    },
    {
      title: '奖励标题',
      dataIndex: 'title',
      width: 180,
      render: (_, record) => record.title || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
      render: (_, record) => formatNumber(record.sort),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={getCheckinRewardStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
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
      width: 180,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => args.onEdit(record)}>
            编辑
          </Button>
          <Button size="small" type="link" onClick={() => void args.onToggleStatus(record)}>
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
        </div>
      ),
    },
  ];
}
