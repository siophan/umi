import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';

import { AdminBrandAuthDetailDrawer } from '../components/admin-brand-auth-detail-drawer';
import { AdminBrandAuthRejectModal } from '../components/admin-brand-auth-reject-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type {
  AdminBrandAuthApplyItem,
  AdminBrandAuthRecordItem,
} from '../lib/api/merchant';
import {
  fetchAdminBrandAuthApplies,
  fetchAdminBrandAuthRecords,
  reviewAdminBrandAuthApply,
  revokeAdminBrandAuthRecord,
} from '../lib/api/merchant';
import {
  buildBrandAuthColumns,
  buildBrandAuthStatusItems,
  type BrandAuthFilters,
  type BrandAuthRow,
  type BrandAuthStatus,
  filterBrandAuthRows,
  mergeBrandAuthRows,
} from '../lib/admin-brand-auth';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface ShopBrandAuthAppliesPageProps {
  refreshToken?: number;
}

const emptyRows: BrandAuthRow[] = [];

export function ShopBrandAuthAppliesPage({
  refreshToken = 0,
}: ShopBrandAuthAppliesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandAuthFilters>();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [rows, setRows] = useState<BrandAuthRow[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [applyIssue, setApplyIssue] = useState<string | null>(null);
  const [recordIssue, setRecordIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandAuthFilters>({});
  const [status, setStatus] = useState<BrandAuthStatus>('all');
  const [selected, setSelected] = useState<BrandAuthRow | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Extract<BrandAuthRow, { sourceType: 'apply' }> | null>(
    null,
  );
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      setApplyIssue(null);
      setRecordIssue(null);
      try {
        const [applyResult, recordResult] = await Promise.allSettled([
          fetchAdminBrandAuthApplies(),
          fetchAdminBrandAuthRecords(),
        ]);
        if (!alive) {
          return;
        }

        const mergedRows = mergeBrandAuthRows(
          applyResult.status === 'fulfilled' ? applyResult.value.items : [],
          recordResult.status === 'fulfilled' ? recordResult.value.items : [],
        );

        setRows(mergedRows);
        if (applyResult.status === 'rejected') {
          setApplyIssue(
            applyResult.reason instanceof Error
              ? applyResult.reason.message
              : '品牌授权审核列表加载失败',
          );
        }
        if (recordResult.status === 'rejected') {
          setRecordIssue(
            recordResult.reason instanceof Error
              ? recordResult.reason.message
              : '品牌授权记录加载失败',
          );
        }
        if (applyResult.status === 'rejected' && recordResult.status === 'rejected') {
          setIssue('品牌授权加载失败');
        }
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
  }, [actionSeed, refreshToken]);

  const statusItems = buildBrandAuthStatusItems(rows);
  const filteredRows = filterBrandAuthRows(rows, filters, status);
  const columns: ProColumns<BrandAuthRow>[] = buildBrandAuthColumns({
    onApprove: (id) => void handleApprove(id),
    onReject: (record) => openRejectModal(record),
    onRevoke: (record) => void handleRevoke(record.id),
    onView: (record) => setSelected(record),
    reviewingId,
  });

  function openRejectModal(record: Extract<BrandAuthRow, { sourceType: 'apply' }>) {
    rejectForm.setFieldsValue({ rejectReason: record.rejectReason ?? '' });
    setRejectTarget(record);
  }

  async function handleApprove(id: string) {
    setReviewingId(id);
    try {
      await reviewAdminBrandAuthApply(id, { status: 'approved' });
      messageApi.success('品牌授权已通过');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '品牌授权审核失败');
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) {
      return;
    }

    try {
      const values = await rejectForm.validateFields();
      setReviewingId(rejectTarget.id);
      await reviewAdminBrandAuthApply(rejectTarget.id, {
        status: 'rejected',
        rejectReason: values.rejectReason,
      });
      messageApi.success('品牌授权已拒绝');
      setRejectTarget(null);
      rejectForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setReviewingId(null);
    }
  }

  async function handleRevoke(id: string) {
    setReviewingId(id);
    try {
      await revokeAdminBrandAuthRecord(id);
      messageApi.success('品牌授权已撤销');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '品牌授权撤销失败');
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      {applyIssue ? (
        <Alert
          showIcon
          type="warning"
          message="授权审核列表加载失败"
          description="授权记录已按真实接口结果保留；待审核/已拒绝数据可能不完整。"
        />
      ) : null}
      {recordIssue ? (
        <Alert
          showIcon
          type="warning"
          message="授权记录加载失败"
          description="授权审核列表已按真实接口结果保留；已授权/已过期/已撤销数据可能不完整。"
        />
      ) : null}

      <AdminSearchPanel
        defaultCount={3}
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="orderNo">
          <Input allowClear placeholder="单号" />
        </Form.Item>
        <Form.Item name="shopName">
          <Input allowClear placeholder="店铺" />
        </Form.Item>
        <Form.Item name="brandName">
          <Input allowClear placeholder="品牌" />
        </Form.Item>
        <Form.Item name="ownerName">
          <Input allowClear placeholder="店主" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as BrandAuthStatus)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<BrandAuthRow>
          cardBordered={false}
          rowKey={(record) => `${record.sourceType}-${record.id}`}
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `共 ${total} 条`,
          }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <AdminBrandAuthDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminBrandAuthRejectModal
        form={rejectForm}
        open={rejectTarget != null}
        submitting={rejectTarget != null && reviewingId === rejectTarget.id}
        onCancel={() => {
          setRejectTarget(null);
          rejectForm.resetFields();
        }}
        onSubmit={() => void handleReject()}
      />
    </div>
  );
}
