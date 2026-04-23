'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { OrderSummary } from '@umi/shared';

import { confirmOrder, fetchOrders, urgeOrder } from '../../lib/api/orders';
import { hasAuthToken } from '../../lib/api/shared';
import { MobileShell } from '../../components/mobile-shell';
import { OrdersList } from './orders-list';
import {
  mapOrderToTab,
  type OrderAction,
  type OrderTab,
} from './order-helpers';
import { OrdersSummary } from './orders-summary';
import styles from './page.module.css';

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
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

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
    if (!hasAuthToken()) {
      setLoading(false);
      return;
    }
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

        <OrdersSummary
          total={total}
          guessWon={guessWon}
          bought={bought}
          totalSpent={totalSpent}
          tab={tab}
          badgeMap={badgeMap}
          onTabChange={setTab}
        />

        <OrdersList
          loading={loading}
          error={error}
          tab={tab}
          orders={filtered}
          onReload={() => void loadOrders()}
          onGoGuess={() => router.push('/')}
          onOpenDetail={(orderId) => router.push(`/order-detail?id=${encodeURIComponent(orderId)}`)}
          onAction={handleAction}
        />

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </div>
    </MobileShell>
  );
}
