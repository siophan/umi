import type {
  AdminCouponListResult,
  AdminCouponTemplateDisplayStatus,
  AdminCouponTemplateItem,
  AdminCouponTemplateRawStatus,
  CreateAdminCouponGrantBatchPayload,
  CreateAdminCouponTemplatePayload,
  EntityId,
  UpdateAdminCouponTemplatePayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Typography } from 'antd';

import {
  type CouponFormValues,
  type GrantFormValues,
  couponStatusColor,
  yuanToCents,
} from './admin-coupon';
import { formatAmount, formatDateTime, formatNumber } from './format';

export type CouponStatusKey = 'all' | AdminCouponTemplateDisplayStatus;
export type CouponSummary = AdminCouponListResult['summary'];

export const EMPTY_COUPON_SUMMARY: CouponSummary = {
  total: 0,
  active: 0,
  scheduled: 0,
  paused: 0,
  disabled: 0,
  ended: 0,
};

export function buildCouponStatusItems(summary: CouponSummary) {
  return [
    { key: 'all', label: '全部', count: summary.total },
    { key: 'active', label: '启用', count: summary.active },
    { key: 'scheduled', label: '待开始', count: summary.scheduled },
    { key: 'paused', label: '已暂停', count: summary.paused },
    { key: 'disabled', label: '已停用', count: summary.disabled },
    { key: 'ended', label: '已结束', count: summary.ended },
  ] satisfies Array<{ key: CouponStatusKey; label: string; count: number }>;
}

export function buildCouponColumns(args: {
  onView: (record: AdminCouponTemplateItem) => void;
  onEdit: (record: AdminCouponTemplateItem) => void;
  onGrant: (record: AdminCouponTemplateItem) => void;
  onToggleStatus: (
    record: AdminCouponTemplateItem,
    nextStatus: AdminCouponTemplateRawStatus,
  ) => void | Promise<void>;
}): ProColumns<AdminCouponTemplateItem>[] {
  return [
    {
      title: '优惠券名称',
      dataIndex: 'name',
      width: 240,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '券类型',
      dataIndex: 'typeLabel',
      width: 120,
    },
    {
      title: '适用范围',
      width: 180,
      render: (_, record) => {
        if (record.scopeType === 'shop') {
          return record.shopName
            ? `${record.scopeTypeLabel} · ${record.shopName}`
            : `${record.scopeTypeLabel} · 店铺ID ${record.shopId ?? '-'}`;
        }
        return record.scopeTypeLabel;
      },
    },
    {
      title: '优惠内容',
      width: 220,
      render: (_, record) => {
        if (record.type === 'cash') {
          return `满 ${formatAmount(record.minAmount)} 减 ${formatAmount(record.discountAmount)}`;
        }
        if (record.type === 'discount') {
          return `${record.discountRate ?? 0} 折 / 封顶 ${formatAmount(record.maxDiscountAmount)}`;
        }
        return `满 ${formatAmount(record.minAmount)} 免运费`;
      },
    },
    {
      title: '已发放 / 剩余',
      width: 140,
      render: (_, record) =>
        `${formatNumber(record.grantedCount)} / ${
          record.remainingQuantity == null ? '不限' : formatNumber(record.remainingQuantity)
        }`,
    },
    {
      title: '每人限领',
      dataIndex: 'userLimit',
      width: 100,
      render: (_, record) => formatNumber(record.userLimit),
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      width: 120,
      render: (_, record) => (
        <Tag color={couponStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '有效期',
      width: 220,
      render: (_, record) =>
        record.validityType === 'fixed'
          ? `${formatDateTime(record.startAt)} ~ ${formatDateTime(record.endAt)}`
          : `领取后 ${formatNumber(record.validDays)} 天`,
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
      width: 280,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => {
        const actions = [
          <Button key="view" size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>,
          <Button key="edit" size="small" type="link" onClick={() => args.onEdit(record)}>
            编辑
          </Button>,
        ];

        if (record.rawStatus === 'active' && record.status !== 'ended') {
          actions.push(
            <Button key="grant" size="small" type="link" onClick={() => args.onGrant(record)}>
              发券
            </Button>,
          );
        }

        if (record.status === 'active' || record.status === 'scheduled') {
          actions.push(
            <Button
              key="pause"
              size="small"
              type="link"
              onClick={() => void args.onToggleStatus(record, 'paused')}
            >
              暂停
            </Button>,
          );
          actions.push(
            <Button
              key="disable"
              size="small"
              type="link"
              onClick={() => void args.onToggleStatus(record, 'disabled')}
            >
              停用
            </Button>,
          );
        } else if (record.status === 'paused') {
          actions.push(
            <Button
              key="enable"
              size="small"
              type="link"
              onClick={() => void args.onToggleStatus(record, 'active')}
            >
              启用
            </Button>,
          );
          actions.push(
            <Button
              key="disable"
              size="small"
              type="link"
              onClick={() => void args.onToggleStatus(record, 'disabled')}
            >
              停用
            </Button>,
          );
        } else if (record.status === 'disabled') {
          actions.push(
            <Button
              key="enable"
              size="small"
              type="link"
              onClick={() => void args.onToggleStatus(record, 'active')}
            >
              启用
            </Button>,
          );
        }

        return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>;
      },
    },
  ];
}

export function buildCouponSubmitPayload(
  values: CouponFormValues,
): CreateAdminCouponTemplatePayload | UpdateAdminCouponTemplatePayload {
  return {
    name: values.name.trim(),
    type: values.type,
    scopeType: values.scopeType,
    shopId:
      values.scopeType === 'shop' ? ((values.shopId?.trim() || null) as EntityId | null) : null,
    description: values.description?.trim() || null,
    minAmount: yuanToCents(values.minAmountYuan) ?? 0,
    discountAmount:
      values.type === 'discount' ? undefined : yuanToCents(values.discountAmountYuan) ?? 0,
    discountRate: values.type === 'discount' ? values.discountRate ?? undefined : undefined,
    maxDiscountAmount:
      values.type === 'discount' ? yuanToCents(values.maxDiscountAmountYuan) ?? 0 : undefined,
    validityType: values.validityType,
    startAt: values.validityType === 'fixed' ? (values.timeRange?.[0]?.toISOString() ?? null) : null,
    endAt: values.validityType === 'fixed' ? (values.timeRange?.[1]?.toISOString() ?? null) : null,
    validDays: values.validityType === 'relative' ? values.validDays ?? 0 : undefined,
    totalQuantity: values.totalQuantity,
    userLimit: values.userLimit,
    status: values.status,
  };
}

export function buildCouponGrantPayload(
  values: GrantFormValues,
): CreateAdminCouponGrantBatchPayload {
  return {
    audience: values.audience,
    note: values.note?.trim() || null,
  };
}

export function buildCreateGrantFormValues(): GrantFormValues {
  return {
    audience: 'all_users',
  };
}

export function buildCouponStatusUpdateMessage(nextStatus: AdminCouponTemplateRawStatus) {
  return nextStatus === 'active'
    ? '优惠券已启用'
    : nextStatus === 'paused'
      ? '优惠券已暂停'
      : '优惠券已停用';
}
