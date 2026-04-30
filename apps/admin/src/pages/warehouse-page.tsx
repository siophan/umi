import type { WarehouseItem } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { WarehouseItemDetailDrawer } from '../components/warehouse-item-detail-drawer';
import { fetchAdminWarehouseItems } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  buildWarehouseColumns,
  buildWarehouseSourceTypeOptions,
  buildWarehouseStatusItems,
  type WarehouseFilters,
  type WarehouseStatusFilter,
} from '../lib/admin-warehouse';

interface WarehousePageProps {
  refreshToken?: number;
  warehouseType: 'virtual' | 'physical';
}

export function WarehousePage({
  refreshToken = 0,
  warehouseType,
}: WarehousePageProps) {
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [status, setStatus] = useState<WarehouseStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [form] = Form.useForm<WarehouseFilters>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminWarehouseItems(warehouseType, {
          page,
          pageSize,
          productName: filters.productName,
          sourceType: filters.sourceType,
          userId: filters.userId,
          status: status === 'all' ? undefined : status,
        });
        if (!alive) return;
        setItems(result.items);
        setTotal(result.total);
        setStatusCounts(result.statusCounts ?? {});
      } catch (error) {
        if (!alive) return;
        setItems([]);
        setTotal(0);
        setStatusCounts({});
        setIssue(error instanceof Error ? error.message : '仓库列表加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [
    filters.productName,
    filters.sourceType,
    filters.userId,
    page,
    pageSize,
    refreshToken,
    status,
    warehouseType,
  ]);

  const sourceTypeOptions = useMemo(
    () => buildWarehouseSourceTypeOptions(warehouseType),
    [warehouseType],
  );
  const columns = useMemo(
    () =>
      buildWarehouseColumns({
        warehouseType,
        onView: (record) => setSelectedItemId(record.id),
      }),
    [warehouseType],
  );
  const statusItems = useMemo(
    () => buildWarehouseStatusItems(statusCounts, warehouseType),
    [statusCounts, warehouseType],
  );

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          setPage(1);
          setFilters(form.getFieldsValue());
        }}
        onReset={() => {
          form.resetFields();
          setPage(1);
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="productName">
          <Input placeholder="商品名称" allowClear />
        </Form.Item>
        <Form.Item name="sourceType">
          <Select placeholder="来源类型" allowClear options={sourceTypeOptions} />
        </Form.Item>
        <Form.Item name="userId">
          <Input placeholder="用户 ID / 昵称" allowClear />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => {
          setPage(1);
          setStatus(key as 'all' | WarehouseItem['status']);
        }}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<WarehouseItem>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={items}
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

      <WarehouseItemDetailDrawer
        itemId={selectedItemId}
        warehouseType={warehouseType}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  );
}
