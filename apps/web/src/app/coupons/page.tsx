'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CouponListItem } from '@umi/shared';

import { fetchCoupons } from '../../lib/api/coupons';
import styles from './page.module.css';

export default function CouponsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<CouponListItem['status']>('unused');
  const [couponsData, setCouponsData] = useState<CouponListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchCoupons();
        if (!ignore) {
          setCouponsData(result);
          setError('');
        }
      } catch (loadError) {
        if (!ignore) {
          setCouponsData([]);
          setError(loadError instanceof Error ? loadError.message : '优惠券加载失败，请稍后重试');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const coupons = useMemo(() => couponsData.filter((item) => item.status === tab), [couponsData, tab]);
  const availableCount = couponsData.filter((item) => item.status === 'unused').length;
  const summaryCount = error ? '--' : loading ? '...' : `${availableCount}`;
  const summaryLabel = error ? '优惠券读取失败' : '可用优惠券';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>我的优惠券</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.summary}>
        <div className={styles.count}>{summaryCount}</div>
        <div className={styles.label}>{summaryLabel}</div>
      </section>

      <nav className={styles.tabs}>
        {[
          { key: 'unused', label: '未使用' },
          { key: 'used', label: '已使用' },
          { key: 'expired', label: '已过期' },
        ].map((item) => (
          <button
            key={item.key}
            className={`${styles.tab} ${tab === item.key ? styles.tabActive : ''}`}
            type="button"
            onClick={() => setTab(item.key as CouponListItem['status'])}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className={styles.list}>
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyText}>正在加载优惠券...</div>
          </div>
        ) : error ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <i className="fa-solid fa-circle-exclamation" />
            </div>
            <div className={styles.emptyText}>{error}</div>
            <button className={styles.retryBtn} type="button" onClick={() => setReloadToken((value) => value + 1)}>
              重试
            </button>
          </div>
        ) : coupons.length ? (
          coupons.map((coupon) => (
            <article key={coupon.id} className={`${styles.card} ${coupon.status === 'used' ? styles.used : ''}`}>
              <div className={styles.value}>
                <div className={styles.amount}>{coupon.type === 'percent' ? `${coupon.amount}%` : `¥${coupon.amount}`}</div>
                <div className={styles.unit}>{coupon.type === 'percent' ? '折扣' : '满减'}</div>
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{coupon.name}</div>
                <div className={styles.condition}>{coupon.condition}</div>
                <div className={styles.expire}>有效期至 {coupon.expireAt ? coupon.expireAt.slice(0, 10) : '长期有效'} · 来源: {coupon.source}</div>
              </div>
              <div className={styles.action}>
                {coupon.status === 'unused' ? (
                  <button className={styles.useBtn} type="button" onClick={() => router.push('/mall')}>
                    使用
                  </button>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <i className="fa-solid fa-ticket" />
            </div>
            <div className={styles.emptyText}>暂无优惠券</div>
          </div>
        )}
      </section>
    </main>
  );
}
