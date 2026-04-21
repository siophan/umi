import type {
  AdminRankingDetailResult,
  AdminRankingSummaryItem,
  RankingPeriodType,
  RankingType,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formatDateTime, formatNumber } from './format';

export type RankingFilters = {
  periodType?: RankingPeriodType;
  periodValue?: string;
  topUser?: string;
};

export type BoardFilter = 'all' | RankingType;

export const EMPTY_RANKING_SUMMARY = {
  total: 0,
  guessWins: 0,
  winRate: 0,
  inviteCount: 0,
};

export const PERIOD_OPTIONS = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '总榜', value: 'allTime' },
] as const;

export const BOARD_LABELS: Record<RankingType, string> = {
  guessWins: '猜中次数榜',
  winRate: '胜率榜',
  inviteCount: '邀请榜',
};

type BuildRankingColumnsOptions = {
  onView: (record: AdminRankingSummaryItem) => void;
};

export function buildRankingColumns({
  onView,
}: BuildRankingColumnsOptions): ProColumns<AdminRankingSummaryItem>[] {
  return [
    {
      title: '榜单',
      dataIndex: 'boardTypeLabel',
      width: 180,
    },
    {
      title: '周期',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.periodTypeLabel}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.periodLabel}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '榜首用户',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.topUserName || '-'}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.topUserUid || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '榜首分值',
      dataIndex: 'topValue',
      width: 140,
    },
    {
      title: '上榜人数',
      dataIndex: 'entryCount',
      width: 120,
      render: (_, record) => formatNumber(record.entryCount),
    },
    {
      title: '最近生成',
      dataIndex: 'generatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.generatedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => void onView(record)}>
          查看
        </Button>
      ),
    },
  ];
}

export function buildRankingDetailColumns(): ColumnsType<AdminRankingDetailResult['items'][number]> {
  return [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 80,
      render: (value: number) => formatNumber(value),
    },
    {
      title: '用户',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.nickname}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            UID：{record.userUid || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 90,
      render: (value: number) => formatNumber(value),
    },
    {
      title: '榜单值',
      dataIndex: 'value',
      width: 140,
    },
    {
      title: '附加指标',
      dataIndex: 'extraSummary',
      render: (value: string | null) => value || '-',
    },
  ];
}

export function buildRankingStatusItems(summary: typeof EMPTY_RANKING_SUMMARY) {
  return [
    { key: 'all', label: '全部', count: summary.total },
    { key: 'guessWins', label: BOARD_LABELS.guessWins, count: summary.guessWins },
    { key: 'winRate', label: BOARD_LABELS.winRate, count: summary.winRate },
    { key: 'inviteCount', label: BOARD_LABELS.inviteCount, count: summary.inviteCount },
  ];
}

export function filterRankingRows(
  rows: AdminRankingSummaryItem[],
  boardType: BoardFilter,
) {
  if (boardType === 'all') {
    return rows;
  }
  return rows.filter((item) => item.boardType === boardType);
}
