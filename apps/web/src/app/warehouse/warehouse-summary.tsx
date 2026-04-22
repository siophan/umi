'use client';

import styles from './page.module.css';
import type { WarehouseTab } from './warehouse-helpers';

type WarehouseSummaryProps = {
  counts: {
    pending: number;
    shipped: number;
    delivered: number;
    consigning: number;
    totalValue: number;
  };
  onTabSelect: (tab: WarehouseTab) => void;
};

export function WarehouseSummary({ counts, onTabSelect }: WarehouseSummaryProps) {
  return (
    <section className={styles.summary}>
      <div className={styles.grid}>
        <button className={`${styles.summaryCard} ${styles.summaryPending}`} type="button" onClick={() => onTabSelect('pending')}>
          <strong>{counts.pending}</strong>
          <span>待提货</span>
        </button>
        <button className={`${styles.summaryCard} ${styles.summaryShipped}`} type="button" onClick={() => onTabSelect('shipped')}>
          <strong>{counts.shipped}</strong>
          <span>运输中</span>
        </button>
        <button className={`${styles.summaryCard} ${styles.summaryDelivered}`} type="button" onClick={() => onTabSelect('delivered')}>
          <strong>{counts.delivered}</strong>
          <span>已签收</span>
        </button>
        <button className={`${styles.summaryCard} ${styles.summaryConsigning}`} type="button" onClick={() => onTabSelect('consigning')}>
          <strong>{counts.consigning}</strong>
          <span>寄售中</span>
        </button>
      </div>
      <div className={styles.totalBar}>
        <div className={styles.totalLabel}>
          <span className={styles.totalIcon}>
            <i className="fa-solid fa-coins" />
          </span>
          物资总值
        </div>
        <div className={styles.totalValue}>
          <small>¥</small>
          {counts.totalValue.toFixed(1)}
        </div>
      </div>
    </section>
  );
}
