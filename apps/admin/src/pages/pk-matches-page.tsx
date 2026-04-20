import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminPkMatchItem } from '../lib/api/catalog';
import { fetchAdminPkMatches } from '../lib/api/catalog';
import { formatAmount, formatDateTime } from '../lib/format';
import {
  AdminDataTablePage,
  buildOptions,
  buildStatusItems,
  useAsyncPageData,
} from './shared/admin-page-tools';

interface PkMatchesPageProps {
  refreshToken?: number;
}

const emptyRows: AdminPkMatchItem[] = [];

function pkStatusTag(record: AdminPkMatchItem) {
  const color =
    record.status === 'completed'
      ? 'success'
      : record.status === 'cancelled'
        ? 'default'
        : record.status === 'active'
          ? 'processing'
          : 'warning';

  return <Tag color={color}>{record.statusLabel}</Tag>;
}

export function PkMatchesPage({ refreshToken = 0 }: PkMatchesPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: 'PK 对战加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminPkMatches().then((result) => result.items),
  });

  const leftUserOptions = useMemo(
    () => buildOptions(data, 'leftUser'),
    [data],
  );

  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        active: '进行中',
        cancelled: '已取消',
        completed: '完成',
        pending: '待开赛',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminPkMatchItem> = [
    {
      title: '对战',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.leftUser} vs {record.rightUser}</Typography.Text>
        </div>
      ),
    },
    { title: '双方选择', render: (_, record) => `${record.leftChoice || '-'} / ${record.rightChoice || '-'}` },
    { title: '对战金额', dataIndex: 'stake', render: (value: number) => formatAmount(value) },
    { title: '结果', dataIndex: 'result', render: (value) => value || '-' },
    { title: '状态', render: (_, record) => pkStatusTag(record) },
    { title: '创建时间', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="PK 对战"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.title.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.leftUser !== filters.second) {
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
        searchPlaceholder="对战标题"
        secondField={{ options: leftUserOptions, placeholder: '对战发起方' }}
        statusItems={statusItems}
        thirdField={{
          options: [
            { label: '待开赛', value: '待开赛' },
            { label: '进行中', value: '进行中' },
            { label: '完成', value: '完成' },
            { label: '已取消', value: '已取消' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
