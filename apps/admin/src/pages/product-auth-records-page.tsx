import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminProductAuthRecordItem } from '../lib/api/merchant';
import { fetchAdminProductAuthRecords } from '../lib/api/merchant';
import { formatDateTime } from '../lib/format';
import { AdminDataTablePage, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface ProductAuthRecordsPageProps {
  refreshToken?: number;
}

const emptyRows: AdminProductAuthRecordItem[] = [];

export function ProductAuthRecordsPage({ refreshToken = 0 }: ProductAuthRecordsPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '授权记录加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminProductAuthRecords().then((result) => result.items),
  });

  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        active: '生效中',
        expired: '已过期',
        revoked: '已撤销',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminProductAuthRecordItem> = [
    { title: '主体', dataIndex: 'subject' },
    { title: '授权模式', dataIndex: 'mode' },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : record.status === 'revoked' ? 'error' : 'default'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '记录时间', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="授权记录"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.subject.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={data}
        searchPlaceholder="主体名称"
        statusItems={statusItems}
      />
    </>
  );
}
