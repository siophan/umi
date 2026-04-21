import { ProTable } from '@ant-design/pro-components';
import { Alert, ConfigProvider, Form, Input, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminOrderRecord } from '../lib/api/orders';
import { fetchAdminOrders } from '../lib/api/orders';
import {
  buildOrderColumns,
  buildOrderStatusItems,
  buildOrderTypeOptions,
  filterOrders,
  type OrderFilters,
  type OrderStatusFilter,
} from '../lib/admin-orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface OrdersPageProps {
  refreshToken?: number;
}

export function OrdersPage({ refreshToken = 0 }: OrdersPageProps) {
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [status, setStatus] = useState<OrderStatusFilter>('all');
  const [form] = Form.useForm<OrderFilters>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminOrders();
        if (!alive) {
          return;
        }
        setOrders(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setOrders([]);
        setIssue(error instanceof Error ? error.message : '订单列表加载失败');
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
  }, [refreshToken]);

  const filteredOrders = useMemo(() => filterOrders(orders, filters, status), [filters, orders, status]);
  const orderTypeOptions = useMemo(() => buildOrderTypeOptions(orders), [orders]);
  const statusItems = useMemo(() => buildOrderStatusItems(orders), [orders]);
  const columns = useMemo(
    () =>
      buildOrderColumns({
        onView: (orderId) => {
          window.location.hash = `/orders/detail/${orderId}`;
        },
      }),
    [],
  );

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        defaultCount={3}
        onSearch={() => {
          const values = form.getFieldsValue();
          setFilters(values);
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="orderSn">
          <Input placeholder="订单号" allowClear />
        </Form.Item>
        <Form.Item name="buyer">
          <Input placeholder="买家" allowClear />
        </Form.Item>
        <Form.Item name="productName">
          <Input placeholder="商品" allowClear />
        </Form.Item>
        <Form.Item name="orderType">
          <Select placeholder="订单类型" allowClear options={orderTypeOptions} />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as OrderStatusFilter)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminOrderRecord>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredOrders}
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
