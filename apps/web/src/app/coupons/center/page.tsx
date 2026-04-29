'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CouponTemplateItem } from '@umi/shared';

import { claimCouponTemplate, fetchCouponTemplates } from '../../../lib/api/coupons';
import styles from './page.module.css';

function CouponCenterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams?.get('shopId') ?? undefined;
  const [items, setItems] = useState<CouponTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchCouponTemplates({ shopId })
      .then((result) => {
        if (!ignore) setItems(result.items);
      })
      .catch(() => {
        if (!ignore) setItems([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [shopId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleClaim(template: CouponTemplateItem) {
    if (!template.claimable) {
      setToast(template.claimDisabledReason || '该券暂不可领取');
      return;
    }
    setClaimingId(template.id);
    try {
      await claimCouponTemplate(template.id);
      setToast('领取成功，可在「我的优惠券」查看');
      setItems((current) =>
        current.map((item) =>
          item.id === template.id
            ? {
                ...item,
                userClaimed: item.userClaimed + 1,
                remaining: item.remaining == null ? null : Math.max(0, item.remaining - 1),
                claimable:
                  item.userLimit > 0 ? item.userClaimed + 1 < item.userLimit : item.claimable,
                claimDisabledReason:
                  item.userLimit > 0 && item.userClaimed + 1 >= item.userLimit
                    ? '已达领取上限'
                    : item.claimDisabledReason,
              }
            : item,
        ),
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : '领取失败');
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <button className={styles.navBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>领券中心</div>
        <button className={styles.navBtn} type="button" onClick={() => router.push('/coupons')}>
          我的券
        </button>
      </header>

      {loading ? (
        <div className={styles.empty}>加载中…</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>暂无可领取的优惠券</div>
      ) : (
        <section className={styles.list}>
          {items.map((item) => (
            <article className={styles.card} key={item.id}>
              <div className={styles.cardLeft}>
                <div className={styles.amountWrap}>
                  {item.type === 'percent' ? (
                    <>
                      <span className={styles.amount}>{(item.amount / 10).toFixed(1)}</span>
                      <span className={styles.amountUnit}>折</span>
                    </>
                  ) : item.type === 'shipping' ? (
                    <span className={styles.amount}>包邮</span>
                  ) : (
                    <>
                      <span className={styles.amountSign}>¥</span>
                      <span className={styles.amount}>{item.amount}</span>
                    </>
                  )}
                </div>
                <div className={styles.condition}>{item.condition}</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{item.name}</div>
                {item.description ? <div className={styles.cardDesc}>{item.description}</div> : null}
                <div className={styles.cardMeta}>
                  {item.expireAt ? `${new Date(item.expireAt).toLocaleDateString('zh-CN')} 截止` : `领取后 ${item.validDays} 天有效`}
                  {item.remaining != null ? <span> · 剩 {item.remaining}</span> : null}
                </div>
              </div>
              <button
                className={`${styles.claimBtn} ${item.claimable ? '' : styles.claimBtnDisabled}`}
                type="button"
                onClick={() => void handleClaim(item)}
                disabled={!item.claimable || claimingId === item.id}
              >
                {claimingId === item.id ? '领取中' : item.claimable ? '领取' : item.claimDisabledReason || '不可领'}
              </button>
            </article>
          ))}
        </section>
      )}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}

export default function CouponCenterPage() {
  return (
    <Suspense fallback={null}>
      <CouponCenterInner />
    </Suspense>
  );
}
