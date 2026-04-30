import type {
  AdminBannerItem,
  CreateAdminBannerPayload,
  EntityId,
  UpdateAdminBannerPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Image, Modal, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { formatDateTime } from './format';

export type BannerFilters = {
  title?: string;
  position?: string;
  targetType?: CreateAdminBannerPayload['targetType'];
};

export type BannerFormValues = {
  position: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetType: CreateAdminBannerPayload['targetType'];
  targetId?: string;
  actionUrl?: string;
  sort?: number;
  status: 'active' | 'disabled';
  timeRange?: [Dayjs | null, Dayjs | null] | null;
};

export const POSITION_OPTIONS = [
  { label: '首页轮播', value: 'home_hero' },
  { label: '商城推荐', value: 'mall_hero' },
  { label: '商城活动', value: 'mall_banner' },
] as const;

export const TARGET_TYPE_OPTIONS = [
  { label: '竞猜', value: 'guess' },
  { label: '动态', value: 'post' },
  { label: '商品', value: 'product' },
  { label: '店铺', value: 'shop' },
  { label: '站内页面', value: 'page' },
  { label: '外部链接', value: 'external' },
] as const;

export const RAW_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

export function getBannerStatusColor(status: AdminBannerItem['status']) {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'scheduled') {
    return 'processing';
  }
  if (status === 'ended') {
    return 'warning';
  }
  return 'default';
}


export function buildBannerStatusItems(summary: {
  total: number;
  active: number;
  scheduled: number;
  paused: number;
  ended: number;
}) {
  return [
    { key: 'all', label: '全部', count: summary.total },
    { key: 'active', label: '投放中', count: summary.active },
    { key: 'scheduled', label: '待排期', count: summary.scheduled },
    { key: 'paused', label: '已暂停', count: summary.paused },
    { key: 'ended', label: '已结束', count: summary.ended },
  ];
}

export function buildCreateBannerFormValues(): BannerFormValues {
  return {
    position: 'home_hero',
    targetType: 'guess',
    sort: 0,
    status: 'active',
    title: '',
    imageUrl: '',
  };
}

export function buildEditBannerFormValues(record: AdminBannerItem): BannerFormValues {
  const startDayjs = record.startAt ? dayjs(record.startAt) : null;
  const endDayjs = record.endAt ? dayjs(record.endAt) : null;
  return {
    position: record.position,
    title: record.title,
    subtitle: record.subtitle || undefined,
    imageUrl: record.imageUrl,
    targetType: record.targetType,
    targetId: record.targetId || undefined,
    actionUrl: record.actionUrl || undefined,
    sort: record.sort,
    status: record.rawStatus,
    timeRange: startDayjs || endDayjs ? [startDayjs, endDayjs] : null,
  };
}

export function buildBannerPayload(
  values: BannerFormValues,
): CreateAdminBannerPayload | UpdateAdminBannerPayload {
  const usesActionUrl = values.targetType === 'external' || values.targetType === 'page';
  const startDayjs = values.timeRange?.[0];
  const endDayjs = values.timeRange?.[1];
  return {
    position: values.position,
    title: values.title.trim(),
    subtitle: values.subtitle?.trim() || null,
    imageUrl: values.imageUrl,
    targetType: values.targetType,
    targetId: usesActionUrl ? null : ((values.targetId?.trim() || null) as EntityId | null),
    actionUrl: usesActionUrl ? values.actionUrl?.trim() || null : null,
    sort: values.sort ?? 0,
    status: values.status,
    startAt: startDayjs ? startDayjs.toISOString() : null,
    endAt: endDayjs ? endDayjs.toISOString() : null,
  };
}

export function buildBannerColumns(args: {
  onDelete: (record: AdminBannerItem) => void;
  onEdit: (record: AdminBannerItem) => void;
  onToggleStatus: (record: AdminBannerItem, nextStatus: 'active' | 'disabled') => void;
  onView: (record: AdminBannerItem) => void;
}): ProColumns<AdminBannerItem>[] {
  return [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      width: 132,
      render: (_, record) =>
        record.imageUrl ? (
          <Image
            src={record.imageUrl}
            width={108}
            height={60}
            style={{ borderRadius: 8, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              alignItems: 'center',
              background: '#f3f5f8',
              borderRadius: 8,
              color: '#94a3b8',
              display: 'flex',
              height: 60,
              justifyContent: 'center',
              width: 108,
            }}
          >
            暂无图片
          </div>
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 240,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.subtitle || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '投放位',
      dataIndex: 'positionLabel',
      width: 120,
    },
    {
      title: '跳转类型',
      dataIndex: 'targetTypeLabel',
      width: 110,
    },
    {
      title: '跳转目标',
      width: 220,
      render: (_, record) => {
        if (record.targetType === 'external' || record.targetType === 'page') {
          return record.actionUrl || '-';
        }
        return record.targetName || record.targetId || '-';
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      width: 110,
      render: (_, record) => (
        <Tag color={getBannerStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '有效期',
      width: 220,
      render: (_, record) => {
        if (!record.startAt && !record.endAt) {
          return '长期有效';
        }
        return `${record.startAt ? formatDateTime(record.startAt) : '不限'} ~ ${
          record.endAt ? formatDateTime(record.endAt) : '不限'
        }`;
      },
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
      width: 220,
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

        if (record.rawStatus === 'disabled') {
          actions.push(
            <Button
              key="enable"
              size="small"
              type="link"
              onClick={() => args.onToggleStatus(record, 'active')}
            >
              启用
            </Button>,
          );
        } else if (record.status !== 'ended') {
          actions.push(
            <Button
              key="pause"
              size="small"
              type="link"
              onClick={() => args.onToggleStatus(record, 'disabled')}
            >
              暂停
            </Button>,
          );
        }

        actions.push(
          <Button
            key="delete"
            danger
            size="small"
            type="link"
            onClick={() => {
              Modal.confirm({
                title: '确认删除轮播？',
                content: `删除后将无法恢复「${record.title}」`,
                okText: '删除',
                okButtonProps: { danger: true },
                cancelText: '取消',
                onOk: () => args.onDelete(record),
              });
            }}
          >
            删除
          </Button>,
        );

        return <div style={{ display: 'flex', gap: 8 }}>{actions}</div>;
      },
    },
  ];
}
