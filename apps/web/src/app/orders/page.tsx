'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { OrderListSummary, OrderSummary } from '@umi/shared';

import { confirmOrder, fetchOrders, urgeOrder } from '../../lib/api/orders';
import { hasAuthToken } from '../../lib/api/shared';
import { MobileShell } from '../../components/mobile-shell';
import { OrdersList } from './orders-list';
import {
  type OrderAction,
  type OrderTab,
} from './order-helpers';
import { OrdersSummary } from './orders-summary';
import styles from './page.module.css';

const EMPTY_SUMMARY: OrderListSummary = {
  total: 0,
  guessWon: 0,
  bought: 0,
  totalSpent: 0,
  pendingCount: 0,
  shippedCount: 0,
};

/**
 * 订单列表页主组件。
 * 服务端按 tab 过滤 + cursor 分页，前端无限滚动加载更多。
 */
export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<OrderTab>('all');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [summary, setSummary] = useState<OrderListSummary>(EMPTY_SUMMARY);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
   * 拉取订单首页。tab 切换或路由变化时重置游标。
   */
  const loadFirstPage = useCallback(
    async (currentTab: OrderTab, shouldIgnore: () => boolean = () => false) => {
      if (!hasAuthToken()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrders({ tab: currentTab });
        if (shouldIgnore()) return;
        setOrders(data.items);
        setSummary(data.summary);
        setCursor(data.nextCursor);
      } catch (loadError) {
        if (shouldIgnore()) return;
        setError(loadError instanceof Error ? loadError.message : '订单加载失败，请稍后重试');
      } finally {
        if (!shouldIgnore()) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let ignore = false;
    void loadFirstPage(tab, () => ignore);

    return () => {
      ignore = true;
    };
  }, [loadFirstPage, tab, pathname]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchOrders({ tab, cursor });
      setOrders((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } catch {
      // 静默失败，等下次进入 sentinel 时再试
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, tab]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  const badgeMap = useMemo(
    () => ({ pending: summary.pendingCount, shipped: summary.shippedCount }),
    [summary.pendingCount, summary.shippedCount],
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
      const shopUserId = order.items[0]?.shopUserId;
      router.push(shopUserId ? `/chat/${shopUserId}` : '/chat');
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
    <MobileShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <h1 className={styles.title}>我的订单</h1>
        </header>

        <OrdersSummary
          total={summary.total}
          guessWon={summary.guessWon}
          bought={summary.bought}
          totalSpent={summary.totalSpent}
          tab={tab}
          badgeMap={badgeMap}
          onTabChange={setTab}
        />

        <OrdersList
          loading={loading}
          error={error}
          tab={tab}
          orders={orders}
          onReload={() => void loadFirstPage(tab)}
          onGoGuess={() => router.push('/')}
          onOpenDetail={(orderId) => router.push(`/order-detail?id=${encodeURIComponent(orderId)}`)}
          onAction={handleAction}
        />

        {cursor ? (
          <div ref={sentinelRef} className={styles.loadMoreSentinel}>
            {loadingMore ? '加载中...' : null}
          </div>
        ) : null}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </div>
    </MobileShell>
  );
}
