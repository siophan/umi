import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminProductAuthItem } from '../lib/api/merchant';
import { fetchAdminProductAuthRows } from '../lib/api/merchant';
import { formatDateTime } from '../lib/format';
import { AdminDataTablePage, buildOptions, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface ProductAuthPageProps {
  refreshToken?: number;
}

const emptyRows: AdminProductAuthItem[] = [];

export function ProductAuthPage({ refreshToken = 0 }: ProductAuthPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '商品授权加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminProductAuthRows().then((result) => result.items),
  });

  const brandOptions = useMemo(() => buildOptions(data, 'brandName'), [data]);
  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        active: '生效中',
        expired: '已过期',
        revoked: '已撤销',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminProductAuthItem> = [
    { title: '授权单号', dataIndex: 'authNo', render: (value) => value || '-' },
    { title: '品牌', dataIndex: 'brandName' },
    { title: '店铺', dataIndex: 'shopName' },
    { title: '主体', dataIndex: 'subject' },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : record.status === 'revoked' ? 'error' : 'default'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '生效时间', dataIndex: 'grantedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="商品授权"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !String(record.authNo || '').toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.brandName !== filters.second) {
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
        searchPlaceholder="授权单号"
        secondField={{ options: brandOptions, placeholder: '品牌' }}
        statusItems={statusItems}
        thirdField={{
          options: [
            { label: '生效中', value: '生效中' },
            { label: '已过期', value: '已过期' },
            { label: '已撤销', value: '已撤销' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
