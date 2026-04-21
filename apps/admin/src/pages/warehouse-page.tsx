import type { WarehouseItem } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { fetchAdminWarehouseItems } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  buildWarehouseColumns,
  buildWarehouseSourceTypeOptions,
  buildWarehouseStatusItems,
  filterWarehouseItems,
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
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [status, setStatus] = useState<WarehouseStatusFilter>('all');
  const [form] = Form.useForm<WarehouseFilters>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const itemsResult = await fetchAdminWarehouseItems(warehouseType);
        if (!alive) {
          return;
        }
        setItems(itemsResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setItems([]);
        setIssue(error instanceof Error ? error.message : '仓库列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [refreshToken, warehouseType]);

  const filteredItems = useMemo(
    () => filterWarehouseItems(items, filters, status, warehouseType),
    [filters, items, status, warehouseType],
  );
  const sourceTypeOptions = useMemo(
    () => buildWarehouseSourceTypeOptions(warehouseType),
    [warehouseType],
  );
  const columns = useMemo(
    () =>
      buildWarehouseColumns({
        warehouseType,
        onView: (record) => {
          window.location.hash = `#/warehouse/${warehouseType}/detail/${record.id}`;
        },
      }),
    [warehouseType],
  );
  const statusItems = useMemo(
    () => buildWarehouseStatusItems(items, warehouseType),
    [items, warehouseType],
  );

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          setFilters(form.getFieldsValue());
        }}
        onReset={() => {
          form.resetFields();
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
          <Input placeholder="用户 ID" allowClear />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as 'all' | WarehouseItem['status'])}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<WarehouseItem>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredItems}
          loading={loading}
        options={{ reload: true, density: true, fullScreen: false, setting: true }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={false}
        toolBarRender={() => []}
      />
      </ConfigProvider>
    </div>
  );
}
