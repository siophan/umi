import type {
  AdminRankingDetailResult,
  AdminRankingSummaryItem,
} from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  Select,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminRankingDetailDrawer } from '../components/admin-ranking-detail-drawer';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  buildRankingColumns,
  buildRankingStatusItems,
  EMPTY_RANKING_SUMMARY,
  filterRankingRows,
  PERIOD_OPTIONS,
  type BoardFilter,
  type RankingFilters,
} from '../lib/admin-rankings';
import {
  fetchAdminRankingDetail,
  fetchAdminRankings,
  refreshAdminRankings,
} from '../lib/api/rankings';

interface SystemRankingsPageProps {
  refreshToken?: number;
}

export function SystemRankingsPage({
  refreshToken = 0,
}: SystemRankingsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
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
  const [summary, setSummary] = useState(EMPTY_RANKING_SUMMARY);
  const [refreshing, setRefreshing] = useState(false);

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
      setSummary(EMPTY_RANKING_SUMMARY);
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

  const columns = useMemo(() => buildRankingColumns({ onView: handleView }), []);
  const visibleRows = useMemo(() => filterRankingRows(rows, boardType), [boardType, rows]);
  const tabItems = useMemo(() => buildRankingStatusItems(summary), [summary]);

  async function handleRefreshRankings() {
    try {
      setRefreshing(true);
      const result = await refreshAdminRankings({
        boardType: boardType === 'all' ? null : boardType,
        periodType: filters.periodType ?? 'allTime',
        periodValue: filters.periodValue ?? null,
      });
      messageApi.success(`排行榜已刷新，共重算 ${result.items.length} 个榜单`);
      await loadRankings();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '刷新排行榜失败');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
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
          toolBarRender={() => [
            <Button
              key="refresh-rankings"
              loading={refreshing}
              type="primary"
              onClick={() => void handleRefreshRankings()}
            >
              刷新排行榜
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminRankingDetailDrawer
        open={selected != null}
        selected={selected}
        detail={detail}
        detailIssue={detailIssue}
        detailLoading={detailLoading}
        onClose={() => {
          setSelected(null);
          setDetail(null);
          setDetailIssue(null);
        }}
      />
    </div>
  );
}
