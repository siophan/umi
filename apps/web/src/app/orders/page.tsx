'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { OrderSummary } from '@umi/shared';

import { confirmOrder, fetchOrders, urgeOrder } from '../../lib/api/orders';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

type OrderTab = 'all' | 'pending' | 'shipped' | 'done' | 'refund';

type OrderAction = {
  text: string;
  tone?: 'primary' | 'accent';
};

const defaultOrderActions: Record<Exclude<OrderTab, 'all'>, OrderAction[]> = {
  pending: [{ text: '联系卖家' }, { text: '催发货', tone: 'primary' }],
  shipped: [{ text: '查看物流' }, { text: '确认收货', tone: 'accent' }],
  done: [{ text: '再来一单' }, { text: '评价', tone: 'primary' }],
  refund: [{ text: '查看详情' }],
};

const emptyMap: Record<OrderTab, { icon: string; title: string; desc: string }> = {
  all: { icon: '📋', title: '暂无订单', desc: '去竞猜赢零食吧！' },
  pending: { icon: '📦', title: '暂无待发货订单', desc: '去竞猜赢零食吧！' },
  shipped: { icon: '🚚', title: '暂无已发货订单', desc: '快去参与竞猜获得奖品！' },
  done: { icon: '✅', title: '暂无已完成订单', desc: '快去参与竞猜获得奖品！' },
  refund: { icon: '💰', title: '暂无退款订单', desc: '一切顺利，继续保持！' },
};

/**
 * 把订单真实状态映射成页面 Tab。
 * 订单页的“待发货/已发货/已完成/退款”是展示分组，不和底层状态码一一对应。
 */
function mapOrderToTab(status: OrderSummary['status']): OrderTab {
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

/**
 * 订单状态标签对应的样式类。
 */
function getOrderStatusClass(status: OrderSummary['status']) {
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

/**
 * 订单状态文案。
 * 这里把 paid / delivered 等底层状态收成用户端统一可读文案。
 */
function getOrderStatusText(status: OrderSummary['status']) {
  switch (status) {
    case 'pending':
      return '待发货';
    case 'paid':
      return '待发货';
    case 'shipping':
      return '已发货';
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

/**
 * 生成订单卡片的店头文案。
 * 竞猜奖励和普通商城订单的展示口径不同，这里统一收口。
 */
function getShopName(order: OrderSummary) {
  if (order.orderType === 'guess' || order.guessId) {
    return '竞猜奖励';
  }
  if (order.orderType === 'shop') {
    return '店铺订单';
  }
  return '订单中心';
}

/**
 * 生成订单卡片店头图标。
 */
function getShopIcon(order: OrderSummary) {
  if (order.orderType === 'guess' || order.guessId) {
    return 'fa-solid fa-trophy';
  }
  return 'fa-solid fa-store';
}

/**
 * 物流辅助文案。
 * 这里只补充卡片摘要，详细进度仍以订单详情页为准。
 */
function getExpressText(order: OrderSummary) {
  if (order.status === 'shipping') {
    return '物流运输中';
  }
  if (order.status === 'delivered') {
    return '待确认收货';
  }
  return '';
}

/**
 * 订单列表页主组件。
 * 订单数据走真实接口，列表结构和交互节奏按老订单页对齐。
 */
export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<OrderTab>('all');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  /**
   * 拉取订单列表。
   * 通过 shouldIgnore 处理组件卸载后的竞态，避免旧请求覆盖新状态。
   */
  const loadOrders = useCallback(async (shouldIgnore: () => boolean = () => false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      if (!shouldIgnore()) {
        setOrders(data.items);
      }
    } catch (loadError) {
      if (shouldIgnore()) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : '订单加载失败，请稍后重试');
    } finally {
      if (!shouldIgnore()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void loadOrders(() => ignore);

    return () => {
      ignore = true;
    };
  }, [loadOrders, pathname]);

  const total = orders.length;
  const guessWon = orders.filter((order) => order.orderType === 'guess' || Boolean(order.guessId)).length;
  const bought = orders.filter((order) => order.orderType !== 'guess' && !order.guessId).length;
  const refunded = orders.filter((order) => mapOrderToTab(order.status) === 'refund').length;
  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  const filtered = tab === 'all' ? orders : orders.filter((order) => mapOrderToTab(order.status) === tab);
  const badgeMap = useMemo(
    () => ({
      pending: orders.filter((order) => mapOrderToTab(order.status) === 'pending').length,
      shipped: orders.filter((order) => mapOrderToTab(order.status) === 'shipped').length,
    }),
    [orders],
  );

  const triggerToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  /**
   * 处理订单卡片上的动作按钮。
   * 不同动作会跳详情、确认收货、催发货或跳转到商品/评价链路。
   */
  const handleAction = async (order: OrderSummary, action: OrderAction) => {
    if (action.text === '查看物流' || action.text === '查看详情') {
      router.push(`/order-detail?id=${encodeURIComponent(order.id)}`);
      return;
    }
    if (action.text === '再来一单') {
      const productId = order.items[0]?.productId;
      if (!productId) {
        triggerToast('订单中没有可复购商品');
        return;
      }
      triggerToast('正在跳转到商品页...');
      window.setTimeout(() => router.push(`/product/${encodeURIComponent(productId)}`), 240);
      return;
    }
    if (action.text === '确认收货') {
      try {
        await confirmOrder(order.id);
        triggerToast('✅ 已确认收货，感谢购买！');
        setOrders((current) =>
          current.map((entry) =>
            entry.id === order.id
              ? {
                  ...entry,
                  status: 'completed',
                }
              : entry,
          ),
        );
      } catch (error) {
        triggerToast(error instanceof Error ? error.message : '确认收货失败');
      }
      return;
    }
    if (action.text === '联系卖家') {
      router.push('/chat');
      return;
    }
    if (action.text === '催发货') {
      urgeOrder(order.id)
        .then(() => triggerToast('✅ 已提醒卖家尽快发货'))
        .catch((err: unknown) => triggerToast(err instanceof Error ? err.message : '催发货失败'));
      return;
    }
    if (action.text === '评价') {
      const productId = order.items[0]?.productId;
      if (productId) {
        router.push(`/review?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(productId)}`);
        return;
      }
      triggerToast('暂无可评价商品');
      return;
    }
    triggerToast(action.text);
  };

  return (
    <MobileShell tab="orders">
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <h1 className={styles.title}>我的订单</h1>
        </header>

        <section className={styles.stats}>
          <div className={`${styles.stat} ${styles.summaryAll}`}>
            <strong>{total}</strong>
            <span>全部订单</span>
          </div>
          <div className={`${styles.stat} ${styles.summaryPrize}`}>
            <strong className={styles.statAccent}>{guessWon}</strong>
            <span>竞猜获奖</span>
          </div>
          <div className={`${styles.stat} ${styles.summaryBuy}`}>
            <strong>{bought}</strong>
            <span>直接购买</span>
          </div>
          <div className={`${styles.stat} ${styles.summaryRevenue}`}>
            <strong>¥{totalSpent.toFixed(1)}</strong>
            <span>累计消费</span>
          </div>
        </section>

        <section className={styles.tabs}>
          {(['all', 'pending', 'shipped', 'done', 'refund'] as OrderTab[]).map((value) => {
            const badge = value === 'pending' ? badgeMap.pending : value === 'shipped' ? badgeMap.shipped : 0;
            return (
              <button
                key={value}
                className={`${styles.tab} ${tab === value ? styles.active : ''}`}
                type="button"
                onClick={() => setTab(value)}
              >
                {value === 'all'
                  ? '全部'
                  : value === 'pending'
                    ? '待发货'
                    : value === 'shipped'
                      ? '已发货'
                      : value === 'done'
                        ? '已完成'
                        : '退款'}
                {badge > 0 ? <span className={styles.badge}>{badge}</span> : null}
              </button>
            );
          })}
        </section>

        <main className={styles.list}>
          {!loading && error ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⚠️</div>
              <div className={styles.emptyTitle}>订单加载失败</div>
              <div className={styles.emptyDesc}>{error}</div>
              <button className={styles.emptyBtn} type="button" onClick={() => void loadOrders()}>
                <i className="fa-solid fa-rotate-right" />
                重新加载
              </button>
            </div>
          ) : !loading && filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>{emptyMap[tab].icon}</div>
              <div className={styles.emptyTitle}>{emptyMap[tab].title}</div>
              <div className={styles.emptyDesc}>{emptyMap[tab].desc}</div>
              <button className={styles.emptyBtn} type="button" onClick={() => router.push('/')}>
                <i className="fa-solid fa-gamepad" />
                去竞猜
              </button>
            </div>
          ) : (
            filtered.map((order, index) => {
              const item = order.items[0];
              return (
                <article
                  key={order.id}
                  className={styles.card}
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.24)}s` }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.shopName}>
                      <span className={styles.shopIcon}>
                        <i className={getShopIcon(order)} />
                      </span>
                      {getShopName(order)}
                    </div>
                    <span className={`${styles.status} ${getOrderStatusClass(order.status)}`}>
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>

                  {order.guessId ? (
                    <div className={styles.guessTitle}>
                      <span>
                        <i className="fa-solid fa-trophy" />
                      </span>
                      {order.guessTitle || '猜中竞猜奖励'}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => router.push(`/order-detail?id=${encodeURIComponent(order.id)}`)}
                  >
                    <img
                      className={styles.itemImg}
                      src={item?.productImg || '/legacy/images/products/p001-lays.jpg'}
                      alt={item?.productName || order.id}
                    />
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item?.productName || '订单商品'}</div>
                      <div className={styles.itemSpec}>{item?.skuText || `共 ${order.items.length} 件商品`}</div>
                      <div className={styles.itemBottom}>
                        <span className={`${styles.type} ${styles[order.orderType === 'guess' || order.guessId ? 'type-prize' : 'type-buy']}`}>
                          {order.orderType === 'guess' || order.guessId ? '🎯 竞猜获奖' : '🛒 直接购买'}
                        </span>
                        <span className={`${styles.price} ${order.amount === 0 ? styles.free : ''}`}>
                          {order.amount === 0 ? (
                            '🎁 免费'
                          ) : (
                            <>
                              <small>¥</small>
                              {order.amount.toFixed(1)}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>

                  {getExpressText(order) ? (
                    <div className={styles.express}>
                      <span className={styles.expressIcon}>
                        <i className="fa-solid fa-arrow-right-long" />
                      </span>
                      <span className={styles.expressText}>{getExpressText(order)}</span>
                    </div>
                  ) : null}

                  <div className={styles.footer}>
                    <span className={styles.time}>{new Date(order.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                    <div className={styles.actions}>
                      {defaultOrderActions[mapOrderToTab(order.status) as Exclude<OrderTab, 'all'>].map((action) => (
                        <button
                          key={action.text}
                          type="button"
                          className={`${styles.btn} ${action.tone === 'primary' ? styles.primary : ''} ${action.tone === 'accent' ? styles.btnAccent : ''}`}
                          onClick={() => handleAction(order, action)}
                        >
                          {action.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </div>
    </MobileShell>
  );
}
