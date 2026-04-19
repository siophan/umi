import type { OrderSummary } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Card, Descriptions, Drawer, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import { formatAmount, formatDateTime, orderStatusMeta } from '../lib/format';

interface OrdersPageProps {
  loading: boolean;
  orders: OrderSummary[];
}

export function OrdersPage({ loading, orders }: OrdersPageProps) {
  const [selected, setSelected] = useState<OrderSummary | null>(null);

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
      <Space wrap size={16}>
        <Card className="metric-card">
          <Statistic
            title="已支付"
            value={orders.filter((order) => order.status === 'paid').length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="配送中"
            value={orders.filter((order) => order.status === 'shipping').length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="退款审核"
            value={orders.filter((order) => order.status === 'refund_pending').length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="订单 GMV"
            value={formatAmount(orders.reduce((sum, order) => sum + order.amount, 0))}
          />
        </Card>
      </Space>

      <Card title="订单与履约">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{ pageSize: 6 }}
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
