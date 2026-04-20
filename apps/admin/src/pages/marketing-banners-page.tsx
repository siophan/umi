import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import { formatDateTime, formatPercent } from '../lib/format';
import { AdminDataTablePage, buildOptions } from './shared/admin-page-tools';

interface MarketingBannersPageProps {
  refreshToken?: number;
}

type BannerRow = {
  audience: string;
  clickRate: number;
  id: string;
  position: string;
  status: '投放中' | '待排期' | '已暂停';
  title: string;
  updatedAt: string;
};

function statusColor(status: string) {
  if (status.includes('投放')) {
    return 'success';
  }
  if (status.includes('暂停')) {
    return 'warning';
  }
  return 'default';
}

export function MarketingBannersPage({ refreshToken = 0 }: MarketingBannersPageProps) {
  const lastUpdatedAt = useMemo(() => new Date().toISOString(), [refreshToken]);
  const rows: BannerRow[] = [
    { id: 'banner-1', title: 'Panda 限时竞猜季', position: '首页头图', audience: '全体用户', status: '投放中', clickRate: 8.4, updatedAt: lastUpdatedAt },
    { id: 'banner-2', title: '新店入驻奖励', position: '商城二屏', audience: '新注册店主', status: '待排期', clickRate: 4.1, updatedAt: lastUpdatedAt },
  ];

  const columns: TableColumnsType<BannerRow> = [
    { title: 'Banner', dataIndex: 'title' },
    { title: '投放位', dataIndex: 'position' },
    { title: '目标人群', dataIndex: 'audience' },
    { title: '点击率', dataIndex: 'clickRate', render: (value: number) => formatPercent(value / 100) },
    { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="轮播管理"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.title.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.position !== filters.second) {
              return false;
            }
            if (filters.third && record.status !== filters.third) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="Banner 标题"
        secondField={{ options: buildOptions(rows as Array<Record<string, unknown>>, 'position'), placeholder: '投放位' }}
        statusItems={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '投放中', label: '投放中', count: rows.filter((item) => item.status === '投放中').length },
          { key: '待排期', label: '待排期', count: rows.filter((item) => item.status === '待排期').length },
          { key: '已暂停', label: '已暂停', count: rows.filter((item) => item.status === '已暂停').length },
        ]}
        thirdField={{
          options: [
            { label: '投放中', value: '投放中' },
            { label: '待排期', value: '待排期' },
            { label: '已暂停', value: '已暂停' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
