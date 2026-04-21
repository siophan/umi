import type {
  AdminInviteRecordListResult,
  AdminInviteRewardConfigItem,
  AdminInviteRewardConfigStatus,
  AdminInviteRewardType,
  UpdateAdminInviteRewardConfigPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';

import { formatDateTime, formatNumber } from './format';

export type InviteFilters = {
  inviter?: string;
  invitee?: string;
  inviteCode?: string;
};

export type InviteFormValues = {
  inviterRewardType: AdminInviteRewardType;
  inviterRewardValue: number;
  inviterRewardRefId?: string;
  inviteeRewardType: AdminInviteRewardType;
  inviteeRewardValue: number;
  inviteeRewardRefId?: string;
  status: AdminInviteRewardConfigStatus;
};

export type InviteRecord = AdminInviteRecordListResult['items'][number];

export const REWARD_TYPE_OPTIONS = [
  { label: '零食币', value: 'coin' },
  { label: '优惠券', value: 'coupon' },
  { label: '实物', value: 'physical' },
] as const;

export const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

export function getInviteRewardStatusColor(status: AdminInviteRewardConfigStatus) {
  return status === 'active' ? 'success' : 'default';
}

export function formatInviteRewardContent(
  rewardTypeLabel: string,
  rewardValue: number,
  rewardRefId: string | null,
) {
  return `${rewardTypeLabel} × ${formatNumber(rewardValue)}${rewardRefId ? ` · 关联ID ${rewardRefId}` : ''}`;
}

export function normalizeInviteRewardRefIdInput(value: string | undefined) {
  const text = value?.trim() ?? '';
  if (!text) {
    return null;
  }
  return /^\d+$/.test(text) ? (text as `${bigint}`) : null;
}

export function buildInviteConfigFormValues(
  config: AdminInviteRewardConfigItem | null,
): InviteFormValues {
  return {
    inviterRewardType: config?.inviterRewardType ?? 'coin',
    inviterRewardValue: config?.inviterRewardValue ?? 50,
    inviterRewardRefId: config?.inviterRewardRefId ?? undefined,
    inviteeRewardType: config?.inviteeRewardType ?? 'coin',
    inviteeRewardValue: config?.inviteeRewardValue ?? 30,
    inviteeRewardRefId: config?.inviteeRewardRefId ?? undefined,
    status: config?.status ?? 'active',
  };
}

export function buildInviteConfigPayload(
  values: InviteFormValues,
): UpdateAdminInviteRewardConfigPayload {
  return {
    inviterRewardType: values.inviterRewardType,
    inviterRewardValue: values.inviterRewardValue,
    inviterRewardRefId:
      values.inviterRewardType === 'coupon' || values.inviterRewardType === 'physical'
        ? normalizeInviteRewardRefIdInput(values.inviterRewardRefId)
        : null,
    inviteeRewardType: values.inviteeRewardType,
    inviteeRewardValue: values.inviteeRewardValue,
    inviteeRewardRefId:
      values.inviteeRewardType === 'coupon' || values.inviteeRewardType === 'physical'
        ? normalizeInviteRewardRefIdInput(values.inviteeRewardRefId)
        : null,
    status: values.status,
  };
}

export function buildInviteColumns(args: {
  onView: (record: InviteRecord) => void;
}): ProColumns<InviteRecord>[] {
  return [
    {
      title: '邀请人',
      dataIndex: 'inviterName',
      width: 160,
    },
    {
      title: '邀请人 ID',
      dataIndex: 'inviterId',
      width: 140,
    },
    {
      title: '邀请码',
      dataIndex: 'inviteCode',
      width: 140,
      render: (_, record) => record.inviteCode || '-',
    },
    {
      title: '被邀请人',
      dataIndex: 'inviteeName',
      width: 160,
    },
    {
      title: '被邀请人 ID',
      dataIndex: 'inviteeId',
      width: 140,
    },
    {
      title: '注册时间',
      dataIndex: 'registeredAt',
      width: 180,
      render: (_, record) => formatDateTime(record.registeredAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => args.onView(record)}>
          查看
        </Button>
      ),
    },
  ];
}
