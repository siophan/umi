import type { TableColumnsType } from 'antd';
import { Button, Tag, Typography } from 'antd';

import type { AdminOrderRecord } from './api/orders';
import { formatDateTime, formatYuanAmount, orderStatusMeta } from './format';

export type OrderFilters = {
  orderSn?: string;
  buyer?: string;
  productName?: string;
  orderType?: string;
};

export type OrderStatusFilter = 'all' | AdminOrderRecord['status'];

export function getOrderTypeLabel(value: AdminOrderRecord['orderType']) {
  if (value === 'guess_reward') {
    return '竞猜奖励单';
  }
  if (value === 'shop_order') {
    return '店铺订单';
  }
  return '-';
}

export function getBuyerLabel(record: AdminOrderRecord) {
  return record.user.name || record.user.phoneNumber || record.user.uidCode || record.userId;
}

export function buildOrderTypeOptions(orders: AdminOrderRecord[]) {
  return Array.from(new Set(orders.map((item) => item.orderType).filter(Boolean))).map((value) => ({
    label: getOrderTypeLabel(value as AdminOrderRecord['orderType']),
    value,
  }));
}

export function buildOrderStatusItems(orders: AdminOrderRecord[]) {
  return [
    { key: 'all', label: '全部', count: orders.length },
    { key: 'pending', label: '待支付', count: orders.filter((item) => item.status === 'pending').length },
    { key: 'paid', label: '已支付', count: orders.filter((item) => item.status === 'paid').length },
    { key: 'shipping', label: '配送中', count: orders.filter((item) => item.status === 'shipping').length },
    { key: 'delivered', label: '已送达', count: orders.filter((item) => item.status === 'delivered').length },
    { key: 'completed', label: '已完成', count: orders.filter((item) => item.status === 'completed').length },
    {
      key: 'refund_pending',
      label: '退款审核',
      count: orders.filter((item) => item.status === 'refund_pending').length,
    },
    { key: 'refunded', label: '已退款', count: orders.filter((item) => item.status === 'refunded').length },
    { key: 'cancelled', label: '已取消', count: orders.filter((item) => item.status === 'cancelled').length },
  ];
}

export function filterOrders(
  orders: AdminOrderRecord[],
  filters: OrderFilters,
  status: OrderStatusFilter,
) {
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
}

type BuildOrderColumnsOptions = {
  onView: (orderId: string) => void;
};

export function buildOrderColumns({
  onView,
}: BuildOrderColumnsOptions): TableColumnsType<AdminOrderRecord> {
  return [
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
          <Typography.Text strong>{formatYuanAmount(record.amount)}</Typography.Text>
          {record.couponDiscount > 0 ? (
            <Typography.Text style={{ display: 'block' }} type="secondary">
              优惠 {formatYuanAmount(record.couponDiscount)}
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
        <Button size="small" type="link" onClick={() => onView(record.id)}>
          查看
        </Button>
      ),
    },
  ];
}
