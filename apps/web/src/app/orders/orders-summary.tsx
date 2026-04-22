'use client';

import styles from './page.module.css';
import type { OrderTab } from './order-helpers';

type OrdersSummaryProps = {
  total: number;
  guessWon: number;
  bought: number;
  totalSpent: number;
  tab: OrderTab;
  badgeMap: { pending: number; shipped: number };
  onTabChange: (tab: OrderTab) => void;
};

export function OrdersSummary({
  total,
  guessWon,
  bought,
  totalSpent,
  tab,
  badgeMap,
  onTabChange,
}: OrdersSummaryProps) {
  return (
    <>
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
              onClick={() => onTabChange(value)}
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
    </>
  );
}
