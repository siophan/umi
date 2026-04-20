import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import type { AdminBrandAuthApplyItem } from '../lib/api/merchant';
import { fetchAdminBrandAuthApplies } from '../lib/api/merchant';
import { formatDateTime } from '../lib/format';
import { AdminDataTablePage, buildOptions, buildStatusItems, useAsyncPageData } from './shared/admin-page-tools';

interface ShopBrandAuthAppliesPageProps {
  refreshToken?: number;
}

const emptyRows: AdminBrandAuthApplyItem[] = [];

export function ShopBrandAuthAppliesPage({ refreshToken = 0 }: ShopBrandAuthAppliesPageProps) {
  const { data, issue, loading } = useAsyncPageData({
    deps: [refreshToken],
    errorMessage: '品牌授权审核加载失败',
    initialData: emptyRows,
    load: async () => fetchAdminBrandAuthApplies().then((result) => result.items),
  });

  const brandOptions = useMemo(() => buildOptions(data, 'brandName'), [data]);
  const statusItems = useMemo(
    () =>
      buildStatusItems(data, (row) => row.status, {
        approved: '已通过',
        pending: '待审核',
        rejected: '已拒绝',
      }),
    [data],
  );

  const columns: TableColumnsType<AdminBrandAuthApplyItem> = [
    { title: '申请单号', dataIndex: 'applyNo' },
    { title: '店铺', dataIndex: 'shopName' },
    { title: '品牌', dataIndex: 'brandName' },
    { title: '店主', dataIndex: 'ownerName', render: (value) => value || '-' },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'warning'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '提交时间', dataIndex: 'submittedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="品牌授权审核"
        filterRows={(rows, filters, status) =>
          rows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.shopName.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
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
        searchPlaceholder="店铺名称"
        secondField={{ options: brandOptions, placeholder: '品牌' }}
        statusItems={statusItems}
        thirdField={{
          options: [
            { label: '待审核', value: '待审核' },
            { label: '已通过', value: '已通过' },
            { label: '已拒绝', value: '已拒绝' },
          ],
          placeholder: '审核状态',
        }}
      />
    </>
  );
}
