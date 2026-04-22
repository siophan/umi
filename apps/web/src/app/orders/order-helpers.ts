import type { OrderSummary } from '@umi/shared';

import styles from './page.module.css';

export type OrderTab = 'all' | 'pending' | 'shipped' | 'done' | 'refund';

export type OrderAction = {
  text: string;
  tone?: 'primary' | 'accent';
};

export const defaultOrderActions: Record<Exclude<OrderTab, 'all'>, OrderAction[]> = {
  pending: [{ text: '联系卖家' }, { text: '催发货', tone: 'primary' }],
  shipped: [{ text: '查看物流' }, { text: '确认收货', tone: 'accent' }],
  done: [{ text: '再来一单' }, { text: '评价', tone: 'primary' }],
  refund: [{ text: '查看详情' }],
};

export const emptyMap: Record<OrderTab, { icon: string; title: string; desc: string }> = {
  all: { icon: '📋', title: '暂无订单', desc: '去竞猜赢零食吧！' },
  pending: { icon: '📦', title: '暂无待发货订单', desc: '去竞猜赢零食吧！' },
  shipped: { icon: '🚚', title: '暂无已发货订单', desc: '快去参与竞猜获得奖品！' },
  done: { icon: '✅', title: '暂无已完成订单', desc: '快去参与竞猜获得奖品！' },
  refund: { icon: '💰', title: '暂无退款订单', desc: '一切顺利，继续保持！' },
};

export function mapOrderToTab(status: OrderSummary['status']): OrderTab {
  if (status === 'pending' || status === 'paid') {
    return 'pending';
  }
  if (status === 'shipping' || status === 'delivered') {
    return 'shipped';
  }
  if (status === 'completed') {
    return 'done';
  }
  return 'refund';
}

export function getOrderStatusClass(status: OrderSummary['status']) {
  const tab = mapOrderToTab(status);
  if (tab === 'pending') {
    return styles.statusPending;
  }
  if (tab === 'shipped') {
    return styles.statusShipped;
  }
  if (tab === 'done') {
    return styles.statusDone;
  }
  return styles.statusRefund;
}

export function getOrderStatusText(status: OrderSummary['status']) {
  switch (status) {
    case 'pending':
    case 'paid':
      return '待发货';
    case 'shipping':
    case 'delivered':
      return '已发货';
    case 'completed':
      return '已完成';
    case 'refund_pending':
      return '退款中';
    case 'refunded':
      return '退款成功';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
}

export function getShopName(order: OrderSummary) {
  if (order.orderType === 'guess' || order.guessId) {
    return '竞猜奖励';
  }
  if (order.orderType === 'shop') {
    return '店铺订单';
  }
  return '订单中心';
}

export function getShopIcon(order: OrderSummary) {
  if (order.orderType === 'guess' || order.guessId) {
    return 'fa-solid fa-trophy';
  }
  return 'fa-solid fa-store';
}

export function getExpressText(order: OrderSummary) {
  if (order.status === 'shipping') {
    return '物流运输中';
  }
  if (order.status === 'delivered') {
    return '待确认收货';
  }
  return '';
}
