import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminShopApplyDetailDrawer } from '../components/admin-shop-apply-detail-drawer';
import { AdminShopApplyRejectModal } from '../components/admin-shop-apply-reject-modal';
import {
  AdminSearchPanel,
  AdminStatusTabs,
} from '../components/admin-list-controls';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminShopApplyItem } from '../lib/api/merchant';
import { fetchAdminShopApplies, reviewAdminShopApply } from '../lib/api/merchant';
import {
  buildShopApplyCategoryOptions,
  buildShopApplyColumns,
  buildShopApplyStatusItems,
  EMPTY_SHOP_APPLIES_DATA,
  filterShopApplies,
  type ShopApplyFilters,
  type ShopAppliesPageData,
} from '../lib/admin-shop-applies';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface ShopAppliesPageProps {
  refreshToken?: number;
}

export function ShopAppliesPage({ refreshToken = 0 }: ShopAppliesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<ShopApplyFilters>();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [data, setData] = useState<ShopAppliesPageData>(EMPTY_SHOP_APPLIES_DATA);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [categoryIssue, setCategoryIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShopApplyFilters>({});
  const [status, setStatus] = useState<'all' | AdminShopApplyItem['status']>('all');
  const [selected, setSelected] = useState<AdminShopApplyItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminShopApplyItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      setCategoryIssue(null);
      try {
        const shopApplies = await fetchAdminShopApplies().then((result) => result.items);
        if (!alive) {
          return;
        }
        setData((current) => ({ ...current, shopApplies }));

        try {
          const categories = await fetchAdminCategories().then((result) => result.items);
          if (!alive) {
            return;
          }
          setData({ categories, shopApplies });
        } catch (error) {
          if (!alive) {
            return;
          }
          setData({ categories: [], shopApplies });
          setCategoryIssue(error instanceof Error ? error.message : '主营类目字典加载失败');
        }
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(EMPTY_SHOP_APPLIES_DATA);
        setIssue(error instanceof Error ? error.message : '开店审核列表加载失败');
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
  }, [refreshToken, actionSeed]);

  const categoryOptions = useMemo(() => buildShopApplyCategoryOptions(data), [data]);
  const statusItems = useMemo(() => buildShopApplyStatusItems(data.shopApplies), [data.shopApplies]);
  const filteredRows = useMemo(
    () => filterShopApplies(data.shopApplies, filters, status),
    [data.shopApplies, filters, status],
  );
  const columns = useMemo(
    () =>
      buildShopApplyColumns({
        onApprove: (id) => void handleApprove(id),
        onReject: (record) => openRejectModal(record),
        onView: (record) => setSelected(record),
        reviewingId,
      }),
    [reviewingId],
  );

  function openRejectModal(record: AdminShopApplyItem) {
    rejectForm.setFieldsValue({ rejectReason: record.rejectReason ?? '' });
    setRejectTarget(record);
  }

  async function handleApprove(id: string) {
    setReviewingId(id);
    try {
      await reviewAdminShopApply(id, { status: 'approved' });
      messageApi.success('开店申请已通过');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '开店申请审核失败');
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
      await reviewAdminShopApply(rejectTarget.id, {
        status: 'rejected',
        rejectReason: values.rejectReason,
      });
      messageApi.success('开店申请已拒绝');
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

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      {categoryIssue ? <Alert showIcon type="warning" message={categoryIssue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        defaultCount={3}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="applyNo">
          <Input allowClear placeholder="申请单号" />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear options={categoryOptions} placeholder="主营类目" />
        </Form.Item>
        <Form.Item name="shopName">
          <Input allowClear placeholder="店铺名" />
        </Form.Item>
        <Form.Item name="applicant">
          <Input allowClear placeholder="申请人" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminShopApplyItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <AdminShopApplyDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminShopApplyRejectModal
        form={rejectForm}
        open={!!rejectTarget}
        submitting={!!reviewingId}
        onCancel={() => {
          setRejectTarget(null);
          rejectForm.resetFields();
        }}
        onSubmit={() => {
          void handleReject();
        }}
      />
    </div>
  );
}
