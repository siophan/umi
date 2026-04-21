import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { AdminShopDetailDrawer } from '../components/admin-shop-detail-drawer';
import type { AdminShopItem } from '../lib/api/merchant';
import { fetchAdminShopDetail, fetchAdminShops, updateAdminShopStatus } from '../lib/api/merchant';
import { fetchAdminCategories } from '../lib/api/categories';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  buildShopCategoryOptions,
  buildShopColumns,
  buildShopStatusItems,
  EMPTY_SHOPS_DATA,
  filterShops,
  type ShopFilters,
  type ShopsPageData,
} from '../lib/admin-shops';

interface ShopsPageProps {
  refreshToken?: number;
}

export function ShopsPage({ refreshToken = 0 }: ShopsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<ShopFilters>();
  const [data, setData] = useState<ShopsPageData>(EMPTY_SHOPS_DATA);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShopFilters>({});
  const [status, setStatus] = useState<'all' | AdminShopItem['status']>('all');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailIssue, setDetailIssue] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchAdminShopDetail>> | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [shops, categories] = await Promise.all([
          fetchAdminShops().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) {
          return;
        }
        setData({ categories, shops });
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(EMPTY_SHOPS_DATA);
        setIssue(error instanceof Error ? error.message : '店铺列表加载失败');
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

  const categoryOptions = useMemo(() => buildShopCategoryOptions(data), [data]);
  const statusItems = useMemo(() => buildShopStatusItems(data.shops), [data.shops]);
  const filteredRows = useMemo(
    () => filterShops(data.shops, filters, status),
    [data.shops, filters, status],
  );
  const columns = buildShopColumns({
    onOpenDetail: (shopId) => void handleOpenDetail(shopId),
    onUpdateStatus: (record, nextStatus) => void handleUpdateStatus(record, nextStatus),
    updatingId,
  });

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
        <Form.Item name="name">
          <Input allowClear placeholder="店铺名称" />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear options={categoryOptions} placeholder="主营类目" />
        </Form.Item>
        <Form.Item name="ownerName">
          <Input allowClear placeholder="店主" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminShopItem>
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

      <AdminShopDetailDrawer
        detail={detail}
        detailIssue={detailIssue}
        detailLoading={detailLoading}
        open={selectedShopId != null}
        onClose={() => {
          setSelectedShopId(null);
          setDetail(null);
          setDetailIssue(null);
        }}
      />
    </div>
  );

  async function handleUpdateStatus(
    record: AdminShopItem,
    nextStatus: 'active' | 'paused' | 'closed',
  ) {
    setUpdatingId(record.id);
    try {
      await updateAdminShopStatus(record.id, { status: nextStatus });
      messageApi.success(
        nextStatus === 'active' ? '店铺已启用' : nextStatus === 'paused' ? '店铺已暂停' : '店铺已关闭',
      );
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新店铺状态失败');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleOpenDetail(shopId: string) {
    setSelectedShopId(shopId);
    setDetail(null);
    setDetailIssue(null);
    setDetailLoading(true);
    try {
      setDetail(await fetchAdminShopDetail(shopId));
    } catch (error) {
      setDetailIssue(error instanceof Error ? error.message : '店铺详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  }
}
