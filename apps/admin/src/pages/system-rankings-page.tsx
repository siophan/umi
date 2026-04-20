import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import { formatDateTime } from '../lib/format';
import { AdminDataTablePage, buildOptions } from './shared/admin-page-tools';

interface SystemRankingsPageProps {
  refreshToken?: number;
}

type RankingRow = {
  dimension: string;
  id: string;
  lastGeneratedAt: string;
  name: string;
  publishScope: string;
  refreshRule: string;
  status: '启用中' | '待灰度';
};

function statusColor(status: string) {
  return status.includes('启用') ? 'success' : 'default';
}

export function SystemRankingsPage({ refreshToken = 0 }: SystemRankingsPageProps) {
  const lastGeneratedAt = useMemo(() => new Date().toISOString(), [refreshToken]);
  const rows: RankingRow[] = [
    { id: 'ranking-1', name: '竞猜热度榜', dimension: '参与人数 + 金额', refreshRule: '每小时刷新', publishScope: '首页 / 竞猜频道', status: '启用中', lastGeneratedAt },
    { id: 'ranking-2', name: '商品热销榜', dimension: '销量 + GMV', refreshRule: '每日 00:10', publishScope: '商城首页', status: '待灰度', lastGeneratedAt },
  ];

  const columns: TableColumnsType<RankingRow> = [
    { title: '榜单', dataIndex: 'name' },
    { title: '维度', dataIndex: 'dimension' },
    { title: '刷新规则', dataIndex: 'refreshRule' },
    { title: '发布范围', dataIndex: 'publishScope' },
    { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
    { title: '最近生成', dataIndex: 'lastGeneratedAt', render: (value) => formatDateTime(value) },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="排行榜配置"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.name.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.publishScope !== filters.second) {
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
        searchPlaceholder="榜单名称"
        secondField={{ options: buildOptions(rows as Array<Record<string, unknown>>, 'publishScope'), placeholder: '发布范围' }}
        statusItems={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '启用中', label: '启用中', count: rows.filter((item) => item.status === '启用中').length },
          { key: '待灰度', label: '待灰度', count: rows.filter((item) => item.status === '待灰度').length },
        ]}
        thirdField={{
          options: [
            { label: '启用中', value: '启用中' },
            { label: '待灰度', value: '待灰度' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
