import type { TableColumnsType } from 'antd';
import { ProTable } from '@ant-design/pro-components';

import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminOrderRecord } from '../lib/api/orders';
import { fetchAdminOrders } from '../lib/api/orders';
import { formatAmount, formatDateTime, orderStatusMeta } from '../lib/format';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface OrdersPageProps {
  refreshToken?: number;
}

export function OrdersPage({ refreshToken = 0 }: OrdersPageProps) {
  const [selected, setSelected] = useState<AdminOrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [filters, setFilters] = useState<{
    orderSn?: string;
    buyer?: string;
    productName?: string;
    orderType?: string;
  }>({});
  const [status, setStatus] = useState<'all' | AdminOrderRecord['status']>('all');
  const [form] = Form.useForm<{
    orderSn?: string;
    buyer?: string;
    productName?: string;
    orderType?: string;
  }>();

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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) {
        return false;
      }
      if (
        filters.orderSn &&
        !String(order.orderSn || order.id).toLowerCase().includes(filters.orderSn.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        filters.buyer &&
        !`${order.user.name || ''} ${order.user.phoneNumber || ''} ${order.user.uidCode || ''} ${order.userId}`
          .toLowerCase()
          .includes(filters.buyer.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        filters.productName &&
        !order.items.some((item) =>
          item.productName.toLowerCase().includes(filters.productName?.trim().toLowerCase() || ''),
        )
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
        label: getOrderTypeLabel(value as AdminOrderRecord['orderType']),
        value,
      })),
    [orders],
  );

  function getOrderTypeLabel(value: AdminOrderRecord['orderType']) {
    if (value === 'guess_reward') {
      return '竞猜奖励单';
    }
    if (value === 'shop_order') {
      return '店铺订单';
    }
    return '-';
  }

  function getBuyerLabel(record: AdminOrderRecord) {
    return record.user.name || record.user.phoneNumber || record.user.uidCode || record.userId;
  }

  const columns: TableColumnsType<AdminOrderRecord> = [
    {
      title: '订单号',
      dataIndex: 'orderSn',
      width: 180,
      render: (_, record) => <Typography.Text strong>{record.orderSn || record.id}</Typography.Text>,
    },
    {
      title: '买家',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{getBuyerLabel(record)}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.user.phoneNumber || record.user.uidCode || record.userId}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      width: 120,
      render: (value: AdminOrderRecord['orderType']) => getOrderTypeLabel(value),
    },
    {
      title: '商品',
      width: 240,
      render: (_, record) => {
        const firstItem = record.items[0];
        if (!firstItem) {
          return '-';
        }

        return (
          <div>
            <Typography.Text strong>{firstItem.productName}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              {record.items.length > 1 ? `共 ${record.items.length} 件商品` : `x${firstItem.quantity}`}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 140,
      render: (_: number, record) => (
        <div>
          <Typography.Text strong>{formatAmount(record.amount)}</Typography.Text>
          {record.couponDiscount > 0 ? (
            <Typography.Text style={{ display: 'block' }} type="secondary">
              优惠 {formatAmount(record.couponDiscount)}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value: AdminOrderRecord['status']) => (
        <Tag color={orderStatusMeta[value].color}>{orderStatusMeta[value].label}</Tag>
      ),
    },
    {
      title: '物流单号',
      width: 180,
      render: (_, record) => record.fulfillment?.trackingNo || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => setSelected(record)}>
          查看
        </Button>
      ),
    },
  ];

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
        onChange={(key) => setStatus(key as 'all' | AdminOrderRecord['status'])}
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

      <Drawer
        open={selected != null}
        width={460}
        title={selected?.id}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="订单号">{selected.orderSn || selected.id}</Descriptions.Item>
            <Descriptions.Item label="买家">{getBuyerLabel(selected)}</Descriptions.Item>
            <Descriptions.Item label="用户 ID">{selected.userId}</Descriptions.Item>
            <Descriptions.Item label="订单类型">{getOrderTypeLabel(selected.orderType)}</Descriptions.Item>
            <Descriptions.Item label="关联竞猜">
              {selected.guessTitle ?? selected.guessId ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={orderStatusMeta[selected.status].color}>
                {orderStatusMeta[selected.status].label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">{formatAmount(selected.amount)}</Descriptions.Item>
            <Descriptions.Item label="原价金额">{formatAmount(selected.originalAmount)}</Descriptions.Item>
            <Descriptions.Item label="优惠金额">{formatAmount(selected.couponDiscount)}</Descriptions.Item>
            <Descriptions.Item label="收货人">
              {selected.address?.name || selected.fulfillment?.receiverName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {selected.address?.phoneNumber || selected.fulfillment?.phoneNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="收货地址">
              {selected.address
                ? `${selected.address.province || ''}${selected.address.city || ''}${selected.address.district || ''}${selected.address.detail || ''}` || '-'
                : selected.fulfillment?.detailAddress || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="物流单号">
              {selected.fulfillment?.trackingNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发货时间">
              {formatDateTime(selected.fulfillment?.shippedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {formatDateTime(selected.fulfillment?.completedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="退款单号">
              {selected.refund?.refundNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="退款原因">
              {selected.refund?.reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(selected.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="订单明细">
              <div style={{ display: 'grid', gap: 12 }}>
                {selected.items.length > 0
                  ? selected.items.map((item) => (
                      <div className="detail-line" key={item.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <div>
                            <Typography.Text strong>{item.productName}</Typography.Text>
                            <Typography.Text style={{ display: 'block' }} type="secondary">
                              {item.skuText ? `${item.skuText} / ` : ''}x{item.quantity}
                            </Typography.Text>
                          </div>
                          <Typography.Text>{formatAmount(item.itemAmount)}</Typography.Text>
                        </div>
                      </div>
                    ))
                  : '-'}
              </div>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
