import type { AdminUserFilter, GuessSummary, OrderSummary, UserSummary } from '@umi/shared';
import type { TableColumnsType } from 'antd';
import { Avatar, Button, Tag, Typography } from 'antd';

import {
  formatAmount,
  formatDateTime,
  formatNumber,
  formatPercent,
  guessStatusMeta,
  orderStatusMeta,
  roleMeta,
} from './format';

export type UsersSearchFormValues = {
  keyword?: string;
  phone?: string;
  shopName?: string;
};

export type UserSummaryCounts = {
  totalUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
};

export type UserSummaryTabItem = {
  key: AdminUserFilter | 'all';
  label: string;
  count?: number;
};

export function buildUserSummaryItems(summary: UserSummaryCounts) {
  return [
    { key: 'all', label: '全部', count: summary.totalUsers },
    { key: 'user', label: '普通用户' },
    { key: 'shop_owner', label: '认证店主', count: summary.verifiedUsers },
    { key: 'banned', label: '已封禁', count: summary.bannedUsers },
  ] satisfies UserSummaryTabItem[];
}

export function buildUserColumns(onOpen: (userId: string) => void): TableColumnsType<UserSummary> {
  return [
    {
      title: '用户',
      dataIndex: 'name',
      render: (_, record) => (
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <Avatar src={record.avatar}>{record.name.slice(0, 1)}</Avatar>
          <div>
            <Typography.Text strong>{record.name}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              UID {record.uid}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (value: UserSummary['role']) => (
        <Tag color={roleMeta[value].color}>{roleMeta[value].label}</Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      render: (_, record) =>
        record.level ? (
          <div>
            <Typography.Text>Lv.{record.level}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              {record.title ?? '未设置头衔'}
            </Typography.Text>
          </div>
        ) : (
          '-'
        ),
    },
    {
      title: '竞猜',
      dataIndex: 'totalGuess',
      render: (_, record) => (
        <div>
          <Typography.Text>{formatNumber(record.totalGuess ?? 0)} 场</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            胜率 {formatPercent(record.winRate)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '店铺',
      dataIndex: 'shopName',
      render: (_, record) =>
        record.shopName ? (
          <div>
            <Typography.Text>{record.shopName}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              {record.shopVerified ? '已认证店铺' : '店铺资料待完善'}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: '状态',
      dataIndex: 'banned',
      render: (value: UserSummary['banned']) =>
        value ? <Tag color="error">已封禁</Tag> : <Tag color="success">正常</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'joinDate',
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => onOpen(record.id)}>
          查看
        </Button>
      ),
    },
  ];
}

export const orderColumns: TableColumnsType<OrderSummary> = [
  {
    title: '订单',
    dataIndex: 'id',
    render: (_, record) => (
      <div>
        <Typography.Text strong>#{record.id}</Typography.Text>
        <Typography.Text style={{ display: 'block' }} type="secondary">
          {record.guessTitle ?? record.items[0]?.productName ?? '普通订单'}
        </Typography.Text>
      </div>
    ),
  },
  {
    title: '金额',
    dataIndex: 'amount',
    render: (value: number) => formatAmount(Math.round(value * 100)),
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (value: OrderSummary['status']) => (
      <Tag color={orderStatusMeta[value].color}>{orderStatusMeta[value].label}</Tag>
    ),
  },
  {
    title: '时间',
    dataIndex: 'createdAt',
    render: (value) => formatDateTime(value),
  },
];

export const guessColumns: TableColumnsType<GuessSummary> = [
  {
    title: '竞猜',
    dataIndex: 'title',
    render: (_, record) => (
      <div>
        <Typography.Text strong>{record.title}</Typography.Text>
        <Typography.Text style={{ display: 'block' }} type="secondary">
          {record.product.name}
        </Typography.Text>
      </div>
    ),
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (value: GuessSummary['status']) => (
      <Tag color={guessStatusMeta[value].color}>{guessStatusMeta[value].label}</Tag>
    ),
  },
  {
    title: '分类',
    dataIndex: 'category',
  },
  {
    title: '截止',
    dataIndex: 'endTime',
    render: (value) => formatDateTime(value),
  },
];
