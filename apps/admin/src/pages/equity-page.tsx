import type {
  AdminEquityAccountItem,
  AdminEquityLogItem,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';

import { AdminEquityAdjustModal } from '../components/admin-equity-adjust-modal';
import { AdminEquityDetailDrawer } from '../components/admin-equity-detail-drawer';
import { AdminSearchPanel } from '../components/admin-list-controls';
import {
  type AdjustFormValues,
  buildEquityColumns,
  type EquityFilters,
} from '../lib/admin-equity';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  adjustAdminEquity,
  fetchAdminEquityAccounts,
  fetchAdminEquityDetail,
} from '../lib/api/equity';

interface EquityPageProps {
  refreshToken?: number;
}

export function EquityPage({ refreshToken = 0 }: EquityPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<EquityFilters>();
  const [adjustForm] = Form.useForm<AdjustFormValues>();

  const [filters, setFilters] = useState<EquityFilters>({});
  const [rows, setRows] = useState<AdminEquityAccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailIssue, setDetailIssue] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AdminEquityAccountItem | null>(null);
  const [detailLogs, setDetailLogs] = useState<AdminEquityLogItem[]>([]);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<AdminEquityAccountItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminEquityAccounts({
          page,
          pageSize,
          userId: filters.userId,
          userName: filters.userName,
          phone: filters.phone,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
        setTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setTotal(0);
        setIssue(error instanceof Error ? error.message : '权益金账户加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      alive = false;
    };
  }, [filters.phone, filters.userId, filters.userName, page, pageSize, refreshToken]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedAccount(null);
      setDetailLogs([]);
      setDetailIssue(null);
      return;
    }

    const targetUserId = selectedUserId;
    let alive = true;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailIssue(null);
      try {
        const result = await fetchAdminEquityDetail(targetUserId);
        if (!alive) {
          return;
        }
        setSelectedAccount(result.account);
        setDetailLogs(result.logs);
      } catch (error) {
        if (!alive) {
          return;
        }
        setSelectedAccount(null);
        setDetailLogs([]);
        setDetailIssue(error instanceof Error ? error.message : '权益金详情加载失败');
      } finally {
        if (alive) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      alive = false;
    };
  }, [selectedUserId]);

  function openDetail(record: AdminEquityAccountItem) {
    setSelectedUserId(record.userId);
    setDetailOpen(true);
  }

  function openAdjust(record: AdminEquityAccountItem) {
    setAdjustTarget(record);
    adjustForm.resetFields();
    setAdjustOpen(true);
  }

  async function refreshCurrentPage() {
    const result = await fetchAdminEquityAccounts({
      page,
      pageSize,
      userId: filters.userId,
      userName: filters.userName,
      phone: filters.phone,
    });
    setRows(result.items);
    setTotal(result.total);
  }

  async function handleAdjustSubmit() {
    if (!adjustTarget) {
      return;
    }

    try {
      const values = await adjustForm.validateFields();
      setAdjustLoading(true);
      const result = await adjustAdminEquity({
        userId: adjustTarget.userId,
        subType: values.subType,
        amount: Math.round(values.amount * 100),
        note: values.note?.trim() || null,
      });

      messageApi.success('调账成功');
      setAdjustOpen(false);
      setAdjustTarget(null);
      await refreshCurrentPage();

      if (detailOpen && selectedUserId === result.account.userId) {
        setSelectedAccount(result.account);
        setDetailLogs((current) => [result.log, ...current].slice(0, 100));
      }
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setAdjustLoading(false);
    }
  }

  const columns: ProColumns<AdminEquityAccountItem>[] = buildEquityColumns({
    onAdjust: (record) => openAdjust(record),
    onView: (record) => openDetail(record),
  });

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={searchForm}
        onSearch={() => {
          setPage(1);
          setFilters(searchForm.getFieldsValue());
        }}
        onReset={() => {
          searchForm.resetFields();
          setPage(1);
          setFilters({});
        }}
      >
        <Form.Item name="userId">
          <Input allowClear placeholder="用户 ID" />
        </Form.Item>
        <Form.Item name="userName">
          <Input allowClear placeholder="用户名称" />
        </Form.Item>
        <Form.Item name="phone">
          <Input allowClear placeholder="手机号" />
        </Form.Item>
      </AdminSearchPanel>
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminEquityAccountItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }
              setPage(nextPage);
            },
          }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <AdminEquityDetailDrawer
        detailIssue={detailIssue}
        loading={detailLoading}
        logs={detailLogs}
        open={detailOpen}
        selectedAccount={selectedAccount}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUserId(null);
          setSelectedAccount(null);
          setDetailLogs([]);
          setDetailIssue(null);
        }}
      />

      <AdminEquityAdjustModal
        form={adjustForm}
        open={adjustOpen}
        submitting={adjustLoading}
        title={`调账 - ${adjustTarget?.userName || adjustTarget?.userId || ''}`}
        onCancel={() => {
          setAdjustOpen(false);
          setAdjustTarget(null);
          adjustForm.resetFields();
        }}
        onSubmit={() => void handleAdjustSubmit()}
      />
    </div>
  );
}
