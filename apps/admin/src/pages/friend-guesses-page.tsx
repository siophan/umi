import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminFriendGuessItem } from '../lib/api/catalog';
import { fetchAdminFriendGuesses } from '../lib/api/catalog';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';
import {
  AdminDataTablePage,
  buildOptions,
  buildStatusItems,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface FriendGuessesPageProps {
  refreshToken?: number;
}

const emptyRows: AdminFriendGuessItem[] = [];

function paymentModeLabel(mode: number | null) {
  if (mode === 10) {
    return '发起人支付';
  }
  if (mode === 20) {
    return 'AA 支付';
  }
  return '-';
}

export function FriendGuessesPage({ refreshToken = 0 }: FriendGuessesPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '好友竞猜加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminFriendGuesses().then((result) => result.items),
  });

  const inviterOptions = useMemo(
    () => buildOptions(data, 'inviter'),
    [data],
  );

  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        active: '进行中',
        ended: '已结束',
        pending: '待开赛',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminFriendGuessItem> = [
    {
      title: '房间',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.roomName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">发起人 {record.inviter}</Typography.Text>
        </div>
      ),
    },
    { title: '参与人数', dataIndex: 'participants', render: formatNumber },
    { title: '邀请数', dataIndex: 'invitationCount', render: formatNumber },
    { title: '已支付金额', dataIndex: 'paidAmount', render: (value: number) => formatAmount(value) },
    { title: '支付模式', dataIndex: 'paymentMode', render: (value: number | null) => paymentModeLabel(value) },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'processing' : record.status === 'ended' ? 'default' : 'warning'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '截止时间', dataIndex: 'endTime', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="好友竞猜"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.roomName.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.inviter !== filters.second) {
              return false;
            }
            if (filters.third && record.statusLabel !== filters.third) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data}
        searchPlaceholder="房间名称"
        secondField={{ options: inviterOptions, placeholder: '发起人' }}
        statusItems={statusItems}
        thirdField={{
          options: [
            { label: '待开赛', value: '待开赛' },
            { label: '进行中', value: '进行中' },
            { label: '已结束', value: '已结束' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
