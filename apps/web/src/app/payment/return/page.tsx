'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { OrderPayStatus } from '@umi/shared';

import { fetchOrderPayStatus } from '../../../lib/api/orders';
import styles from './page.module.css';

type PollResult = { status: OrderPayStatus; message?: string };

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TRIES = 60;

function ReturnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('out_trade_no');
  const [result, setResult] = useState<PollResult | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setResult({ status: 'failed', message: '缺少订单号，无法确认支付状态' });
      return;
    }
    let cancelled = false;
    let count = 0;
    const tick = async () => {
      count += 1;
      setTries(count);
      try {
        const data = await fetchOrderPayStatus(orderId);
        if (cancelled) return;
        if (data.payStatus === 'paid' || data.payStatus === 'failed' || data.payStatus === 'closed') {
          setResult({ status: data.payStatus });
          return;
        }
        if (count >= POLL_MAX_TRIES) {
          setResult({ status: 'waiting', message: '支付状态确认超时，请在订单页查看最终结果' });
          return;
        }
        window.setTimeout(tick, POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;
        setResult({ status: 'failed', message: error instanceof Error ? error.message : '查询支付状态失败' });
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!result) {
    return (
      <main className={styles.page}>
        <div className={styles.spin} />
        <div className={styles.title}>正在确认支付结果</div>
        <div className={styles.desc}>已检查 {tries} 次，请稍候...</div>
      </main>
    );
  }

  if (result.status === 'paid') {
    return (
      <main className={styles.page}>
        <div className={styles.icon}>🎉</div>
        <div className={styles.title}>支付成功</div>
        <div className={styles.desc}>订单已创建，可在我的订单查看物流</div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => router.replace(orderId ? `/order-detail?id=${encodeURIComponent(orderId)}` : '/orders')}
        >
          查看订单
        </button>
        <button type="button" className={styles.secondary} onClick={() => router.replace('/?tab=mall')}>
          返回继续购物
        </button>
      </main>
    );
  }

  if (result.status === 'closed' || result.status === 'failed') {
    return (
      <main className={styles.page}>
        <div className={styles.icon}>⚠️</div>
        <div className={styles.title}>{result.status === 'closed' ? '支付已关闭' : '支付失败'}</div>
        <div className={styles.desc}>{result.message ?? '可在我的订单内重新发起支付'}</div>
        <button type="button" className={styles.primary} onClick={() => router.replace('/orders')}>
          前往我的订单
        </button>
        <button type="button" className={styles.secondary} onClick={() => router.replace('/?tab=mall')}>
          返回继续购物
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.icon}>⏳</div>
      <div className={styles.title}>支付仍在处理中</div>
      <div className={styles.desc}>{result.message ?? '请稍后在我的订单查看结果'}</div>
      <button type="button" className={styles.primary} onClick={() => router.replace('/orders')}>
        前往我的订单
      </button>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <ReturnPageInner />
    </Suspense>
  );
}
