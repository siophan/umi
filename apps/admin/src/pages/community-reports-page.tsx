import { ProTable } from '@ant-design/pro-components';
import type {
  AdminCommunityReportItem,
  UpdateAdminCommunityReportPayload,
} from '@umi/shared';
import { Alert, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminCommunityReportDetailDrawer } from '../components/admin-community-report-detail-drawer';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  fetchAdminCommunityReports,
  updateAdminCommunityReport,
} from '../lib/api/content';
import {
  buildCommunityReportColumns,
  buildCommunityReportStatusItems,
  COMMUNITY_REPORT_REASON_OPTIONS,
  EMPTY_COMMUNITY_REPORT_RESULT,
  filterCommunityReports,
  getCommunityReportActionSuccessMessage,
  type CommunityReportFilters,
  type CommunityReportStatusFilter,
} from '../lib/admin-community-reports';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface CommunityReportsPageProps {
  refreshToken?: number;
}

export function CommunityReportsPage({ refreshToken = 0 }: CommunityReportsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CommunityReportFilters>();
  const [result, setResult] = useState(EMPTY_COMMUNITY_REPORT_RESULT);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommunityReportFilters>({});
  const [status, setStatus] = useState<CommunityReportStatusFilter>('all');
  const [selected, setSelected] = useState<AdminCommunityReportItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadReports() {
      setLoading(true);
      setIssue(null);
      try {
        const next = await fetchAdminCommunityReports(filters);
        if (!alive) {
          return;
        }
        setResult(next);
      } catch (error) {
        if (!alive) {
          return;
        }
        setResult(EMPTY_COMMUNITY_REPORT_RESULT);
        setIssue(error instanceof Error ? error.message : '举报记录加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters, refreshToken]);

  const rows = useMemo(() => filterCommunityReports(result.items, status), [result.items, status]);
  const columns = useMemo(
    () =>
      buildCommunityReportColumns({
        onAction: (record, action) => void handleAction(record, action),
        onView: (record) => setSelected(record),
        submitting,
      }),
    [submitting],
  );

  async function handleAction(
    record: AdminCommunityReportItem,
    action: UpdateAdminCommunityReportPayload['action'],
  ) {
    try {
      setSubmitting(true);
      await updateAdminCommunityReport(record.id, { action });
      messageApi.success(getCommunityReportActionSuccessMessage(action));
      setSelected((current) => (current?.id === record.id ? null : current));
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '举报处理失败');
    } finally {
      setSubmitting(false);
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
          setStatus('all');
        }}
      >
        <Form.Item name="reporter">
          <Input allowClear placeholder="举报人" />
        </Form.Item>
        <Form.Item name="reasonType">
          <Select
            allowClear
            options={COMMUNITY_REPORT_REASON_OPTIONS as never}
            placeholder="举报原因"
          />
        </Form.Item>
        <Form.Item name="targetKeyword">
          <Input allowClear placeholder="被举报内容" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={buildCommunityReportStatusItems(result.summary)}
        onChange={(key) => setStatus(key as CommunityReportStatusFilter)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminCommunityReportItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading || submitting}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <AdminCommunityReportDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
