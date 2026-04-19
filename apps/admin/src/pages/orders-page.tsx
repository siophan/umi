import type { OrderSummary } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Card, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { formatAmount, formatDateTime, orderStatusMeta } from '../lib/format';

interface OrdersPageProps {
  loading: boolean;
  orders: OrderSummary[];
}

export function OrdersPage({ loading, orders }: OrdersPageProps) {
  const [selected, setSelected] = useState<OrderSummary | null>(null);
  const [filters, setFilters] = useState<{
    orderId?: string;
    userId?: string;
    orderType?: string;
  }>({});
  const [status, setStatus] = useState<'all' | OrderSummary['status']>('all');
  const [form] = Form.useForm<{ orderId?: string; userId?: string; orderType?: string }>();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) {
        return false;
      }
      if (
        filters.orderId &&
        !String(order.id).toLowerCase().includes(filters.orderId.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        filters.userId &&
        !String(order.userId).toLowerCase().includes(filters.userId.trim().toLowerCase())
      ) {
        return false;
      }
      if (filters.orderType && order.orderType !== filters.orderType) {
        return false;
      }
      return true;
    });
  }, [filters, orders, status]);

  const orderTypeOptions = useMemo(
    () =>
      Array.from(new Set(orders.map((item) => item.orderType).filter(Boolean))).map((value) => ({
        label: value,
        value,
      })),
    [orders],
  );

  const columns: TableColumnsType<OrderSummary> = [
    {
      title: '订单号',
      dataIndex: 'id',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: '用户',
      dataIndex: 'userId',
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      render: (value) => value ?? '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (value: number) => formatAmount(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: OrderSummary['status']) => (
        <Tag color={orderStatusMeta[value].color}>{orderStatusMeta[value].label}</Tag>
      ),
    },
    {
      title: '商品数',
      render: (_, record) => record.items.length,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="page-stack">
      <AdminSearchPanel
        form={form}
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
        <Form.Item name="orderId">
          <Input placeholder="订单号" allowClear />
        </Form.Item>
        <Form.Item name="userId">
          <Input placeholder="用户 ID" allowClear />
        </Form.Item>
        <Form.Item name="orderType">
          <Select placeholder="订单类型" allowClear options={orderTypeOptions} />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: orders.length },
          { key: 'pending', label: '待支付', count: orders.filter((item) => item.status === 'pending').length },
          { key: 'paid', label: '已支付', count: orders.filter((item) => item.status === 'paid').length },
          { key: 'shipping', label: '配送中', count: orders.filter((item) => item.status === 'shipping').length },
          { key: 'completed', label: '已完成', count: orders.filter((item) => item.status === 'completed').length },
          { key: 'refund_pending', label: '退款审核', count: orders.filter((item) => item.status === 'refund_pending').length },
          { key: 'refunded', label: '已退款', count: orders.filter((item) => item.status === 'refunded').length },
          { key: 'cancelled', label: '已取消', count: orders.filter((item) => item.status === 'cancelled').length },
        ]}
        onChange={(key) => setStatus(key as 'all' | OrderSummary['status'])}
      />
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </Card>

      <Drawer
        open={selected != null}
        width={460}
        title={selected?.id}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户 ID">{selected.userId}</Descriptions.Item>
              <Descriptions.Item label="竞猜标题">
                {selected.guessTitle ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={orderStatusMeta[selected.status].color}>
                  {orderStatusMeta[selected.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selected.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                {formatAmount(selected.amount)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="订单明细" size="small">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {selected.items.map((item) => (
                  <div className="detail-line" key={item.id}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space direction="vertical" size={0}>
                        <Typography.Text strong>{item.productName}</Typography.Text>
                        <Typography.Text type="secondary">
                          x{item.quantity}
                        </Typography.Text>
                      </Space>
                      <Typography.Text>{formatAmount(item.itemAmount)}</Typography.Text>
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
