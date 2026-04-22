import type { WarehouseItem } from '@umi/shared';

import styles from './page.module.css';

export type WarehouseTab = 'all' | 'pending' | 'shipped' | 'delivered' | 'consigning';

export const statusMeta: Record<WarehouseTab, [string, string, string]> = {
  all: ['全部', '', 'fa-box-open'],
  pending: ['待提货', 's-pending', 'fa-clock'],
  shipped: ['运输中', 's-shipped', 'fa-truck'],
  delivered: ['已签收', 's-delivered', 'fa-circle-check'],
  consigning: ['寄售中', 's-consigning', 'fa-tags'],
};

export const emptyMap: Record<WarehouseTab, { icon: string; title: string; desc: string }> = {
  all: { icon: 'fa-solid fa-box-open', title: '暂无商品', desc: '快去参与竞猜获得奖品！' },
  pending: { icon: 'fa-solid fa-box-open', title: '暂无待提货商品', desc: '快去参与竞猜获得奖品！' },
  shipped: { icon: 'fa-solid fa-box-open', title: '暂无运输中商品', desc: '货品出发后这里会显示物流状态。' },
  delivered: { icon: 'fa-solid fa-box-open', title: '暂无已签收商品', desc: '签收完成后会进入这里。' },
  consigning: { icon: 'fa-solid fa-box-open', title: '暂无寄售中商品', desc: '把仓库好物挂出来试试。' },
};

export function mapWarehouseTab(item: WarehouseItem): Exclude<WarehouseTab, 'all'> {
  if (item.status === 'consigning') {
    return 'consigning';
  }
  if (item.status === 'shipping') {
    return 'shipped';
  }
  if (item.status === 'delivered' || item.status === 'completed') {
    return 'delivered';
  }
  return 'pending';
}

export function getWarehouseStatusClass(tab: WarehouseTab) {
  if (tab === 'pending') {
    return styles.statusPending;
  }
  if (tab === 'shipped') {
    return styles.statusShipped;
  }
  if (tab === 'delivered') {
    return styles.statusDelivered;
  }
  return styles.statusConsigning;
}

export function buildSellEstimate(item: WarehouseItem | null, sellPrice: string) {
  if (!item) {
    return null;
  }
  const priceValue = Number.parseFloat(sellPrice) || 0;
  if (!priceValue || !item.price) {
    return null;
  }
  const ratio = priceValue / item.price;
  if (ratio <= 0.7) {
    return { title: '1-1 日内出售成功', desc: '低于市场价30%+，极速出售', level: 3 };
  }
  if (ratio <= 0.85) {
    return { title: '1-2 日内出售成功', desc: '价格极具竞争力，市场需求旺盛', level: 3 };
  }
  if (ratio <= 0.95) {
    return { title: '1-3 日内出售成功', desc: '价格合理，预计较快出售', level: 2 };
  }
  if (ratio <= 1.05) {
    return { title: '预计 5 日内出售', desc: '接近市场价，需要一定等待时间', level: 1 };
  }
  return { title: '预计 7 日内出售', desc: '高于市场价，出售可能较慢', level: 0 };
}
