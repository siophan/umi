import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type {
  AdminCommunityReportItem,
  AdminCommunityReportListResult,
  UpdateAdminCommunityReportPayload,
} from '@umi/shared';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  fetchAdminCommunityReports,
  updateAdminCommunityReport,
} from '../lib/api/content';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime } from '../lib/format';

interface CommunityReportsPageProps {
  refreshToken?: number;
}

type CommunityReportFilters = {
  reporter?: string;
  reasonType?: AdminCommunityReportItem['reasonType'];
  targetKeyword?: string;
};

type CommunityReportStatusFilter = 'all' | AdminCommunityReportItem['status'];

const REASON_OPTIONS = [
  { label: '垃圾广告', value: 'spam' },
  { label: '低俗色情', value: 'explicit' },
  { label: '人身攻击', value: 'abuse' },
  { label: '虚假信息', value: 'false_info' },
  { label: '其他原因', value: 'other' },
] as const;

function getStatusColor(status: AdminCommunityReportItem['status']) {
  if (status === 'pending') return 'default';
  if (status === 'reviewing') return 'processing';
  if (status === 'resolved') return 'success';
  return 'warning';
}

export function CommunityReportsPage({ refreshToken = 0 }: CommunityReportsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CommunityReportFilters>();
  const [result, setResult] = useState<AdminCommunityReportListResult>({
    items: [],
    summary: { total: 0, pending: 0, reviewing: 0, resolved: 0, rejected: 0 },
  });
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
        setResult({
          items: [],
          summary: { total: 0, pending: 0, reviewing: 0, resolved: 0, rejected: 0 },
        });
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

  const rows = useMemo(
    () =>
      result.items.filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }
        return true;
      }),
    [result.items, status],
  );

  async function handleAction(
    record: AdminCommunityReportItem,
    action: UpdateAdminCommunityReportPayload['action'],
  ) {
    try {
      setSubmitting(true);
      await updateAdminCommunityReport(record.id, { action });
      messageApi.success(
        action === 'review'
          ? '已转处理中'
          : action === 'approve'
            ? '已采纳并清理内容'
            : action === 'reject'
              ? '已驳回举报'
              : '已封禁用户并清理内容',
      );
      setSelected((current) => (current?.id === record.id ? null : current));
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '举报处理失败');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ProColumns<AdminCommunityReportItem>[] = [
    {
      title: '被举报内容',
      width: 320,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.targetTitle || '动态内容'}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.targetContent || '内容已删除'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '举报人',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.reporterName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.reporterUid || `用户 ID ${record.reporterUserId}`}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '举报原因',
      width: 160,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.reasonLabel}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.reasonDetail || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '举报时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          {record.status === 'pending' ? (
            <Button
              disabled={submitting}
              size="small"
              type="link"
              onClick={() => void handleAction(record, 'review')}
            >
              处理中
            </Button>
          ) : null}
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Popconfirm
              title="确认采纳该举报？"
              description="采纳后会删除被举报动态。"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleAction(record, 'approve')}
            >
              <Button disabled={submitting} size="small" type="link">
                采纳
              </Button>
            </Popconfirm>
          ) : null}
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Popconfirm
              title="确认驳回该举报？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleAction(record, 'reject')}
            >
              <Button disabled={submitting} size="small" type="link">
                驳回
              </Button>
            </Popconfirm>
          ) : null}
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Popconfirm
              title="确认封禁被举报用户？"
              description="封禁后会同时删除被举报动态。"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleAction(record, 'ban')}
            >
              <Button danger disabled={submitting} size="small" type="link">
                封禁
              </Button>
            </Popconfirm>
          ) : null}
        </div>
      ),
    },
  ];

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
          <Select allowClear options={REASON_OPTIONS as never} placeholder="举报原因" />
        </Form.Item>
        <Form.Item name="targetKeyword">
          <Input allowClear placeholder="被举报内容" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: result.summary.total },
          { key: 'pending', label: '待处理', count: result.summary.pending },
          { key: 'reviewing', label: '处理中', count: result.summary.reviewing },
          { key: 'resolved', label: '已处理', count: result.summary.resolved },
          { key: 'rejected', label: '已驳回', count: result.summary.rejected },
        ]}
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

      <Drawer
        open={selected != null}
        title="举报详情"
        width={560}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="举报人">
              {selected.reporterName}
            </Descriptions.Item>
            <Descriptions.Item label="举报人 UID">
              {selected.reporterUid || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="被举报内容">
              {selected.targetContent || '内容已删除'}
            </Descriptions.Item>
            <Descriptions.Item label="被举报标题">
              {selected.targetTitle || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标作者">
              {selected.targetAuthorName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标作者 UID">
              {selected.targetAuthorUid || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="举报原因">
              {selected.reasonLabel}
            </Descriptions.Item>
            <Descriptions.Item label="补充说明">
              {selected.reasonDetail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {selected.statusLabel}
            </Descriptions.Item>
            <Descriptions.Item label="处理动作">
              {selected.handleActionLabel || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="处理说明">
              {selected.handleNote || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="举报时间">
              {formatDateTime(selected.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="处理时间">
              {selected.handledAt ? formatDateTime(selected.handledAt) : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
