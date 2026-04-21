import type {
  AdminRankingDetailResult,
  AdminRankingSummaryItem,
  RankingPeriodType,
  RankingType,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  fetchAdminRankingDetail,
  fetchAdminRankings,
} from '../lib/api/rankings';
import { formatDateTime, formatNumber } from '../lib/format';

interface SystemRankingsPageProps {
  refreshToken?: number;
}

type RankingFilters = {
  periodType?: RankingPeriodType;
  periodValue?: string;
  topUser?: string;
};

const PERIOD_OPTIONS = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '总榜', value: 'allTime' },
] as const;

const BOARD_LABELS: Record<RankingType, string> = {
  guessWins: '猜中次数榜',
  winRate: '胜率榜',
  inviteCount: '邀请榜',
};

type BoardFilter = 'all' | RankingType;

export function SystemRankingsPage({
  refreshToken = 0,
}: SystemRankingsPageProps) {
  const [searchForm] = Form.useForm<RankingFilters>();
  const [filters, setFilters] = useState<RankingFilters>({});
  const [boardType, setBoardType] = useState<BoardFilter>('all');
  const [rows, setRows] = useState<AdminRankingSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminRankingSummaryItem | null>(null);
  const [detail, setDetail] = useState<AdminRankingDetailResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailIssue, setDetailIssue] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    guessWins: 0,
    winRate: 0,
    inviteCount: 0,
  });

  async function loadRankings() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminRankings({
        periodType: filters.periodType,
        periodValue: filters.periodValue,
        topUser: filters.topUser,
      });
      setRows(result.items);
      setSummary(result.summary);
    } catch (error) {
      setRows([]);
      setSummary({
        total: 0,
        guessWins: 0,
        winRate: 0,
        inviteCount: 0,
      });
      setIssue(error instanceof Error ? error.message : '排行榜结果加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRankings();
  }, [boardType, filters.periodType, filters.periodValue, filters.topUser, refreshToken]);

  async function handleView(record: AdminRankingSummaryItem) {
    setSelected(record);
    setDetail(null);
    setDetailIssue(null);
    setDetailLoading(true);
    try {
      const result = await fetchAdminRankingDetail(
        record.boardType,
        record.periodType,
        record.periodValue,
      );
      setDetail(result);
    } catch (error) {
      setDetailIssue(error instanceof Error ? error.message : '榜单明细加载失败');
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: ProColumns<AdminRankingSummaryItem>[] = [
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
        <Button size="small" type="link" onClick={() => void handleView(record)}>
          查看
        </Button>
      ),
    },
  ];

  const visibleRows = useMemo(() => {
    if (boardType === 'all') {
      return rows;
    }
    return rows.filter((item) => item.boardType === boardType);
  }, [boardType, rows]);

  const detailColumns: ColumnsType<AdminRankingDetailResult['items'][number]> = [
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

  const tabItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: summary.total },
      { key: 'guessWins', label: BOARD_LABELS.guessWins, count: summary.guessWins },
      { key: 'winRate', label: BOARD_LABELS.winRate, count: summary.winRate },
      { key: 'inviteCount', label: BOARD_LABELS.inviteCount, count: summary.inviteCount },
    ],
    [summary.guessWins, summary.inviteCount, summary.total, summary.winRate],
  );

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setBoardType('all');
        }}
      >
        <Form.Item name="periodType">
          <Select allowClear options={PERIOD_OPTIONS as never} placeholder="周期类型" />
        </Form.Item>
        <Form.Item name="periodValue">
          <Input allowClear placeholder="期次值（如 20260421）" />
        </Form.Item>
        <Form.Item name="topUser">
          <Input allowClear placeholder="榜首用户 / UID" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={boardType}
        items={tabItems}
        onChange={(key) => setBoardType(key as BoardFilter)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminRankingSummaryItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={visibleRows}
          loading={loading}
          options={{
            reload: () => {
              void loadRankings();
            },
            density: true,
            fullScreen: false,
            setting: true,
          }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        title="榜单详情"
        width={780}
        onClose={() => {
          setSelected(null);
          setDetail(null);
          setDetailIssue(null);
        }}
      >
        {selected ? (
          <>
            {detailIssue ? <Alert showIcon type="error" message={detailIssue} style={{ marginBottom: 16 }} /> : null}
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="榜单">
                {selected.boardTypeLabel}
              </Descriptions.Item>
              <Descriptions.Item label="周期">
                {selected.periodTypeLabel}
              </Descriptions.Item>
              <Descriptions.Item label="期次">
                {selected.periodLabel}
              </Descriptions.Item>
              <Descriptions.Item label="上榜人数">
                {formatNumber(detail?.totalEntries ?? selected.entryCount)}
              </Descriptions.Item>
              <Descriptions.Item label="榜首用户">
                {selected.topUserName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="榜首分值">
                {selected.topValue}
              </Descriptions.Item>
              <Descriptions.Item label="最近生成">
                {formatDateTime(detail?.generatedAt ?? selected.generatedAt)}
              </Descriptions.Item>
            </Descriptions>
            <Table
              rowKey={(record) => `${record.userId}-${record.rank}`}
              columns={detailColumns}
              dataSource={detail?.items ?? []}
              loading={detailLoading}
              pagination={false}
              scroll={{ y: 420 }}
            />
          </>
        ) : null}
      </Drawer>
    </div>
  );
}
