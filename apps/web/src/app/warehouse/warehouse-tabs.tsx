'use client';

import styles from './page.module.css';
import type { WarehouseTab } from './warehouse-helpers';

type WarehouseTabsProps = {
  tab: WarehouseTab;
  counts: {
    pending: number;
    shipped: number;
    delivered: number;
    consigning: number;
  };
  onChange: (tab: WarehouseTab) => void;
};

export function WarehouseTabs({ tab, counts, onChange }: WarehouseTabsProps) {
  return (
    <section className={styles.tabs}>
      {(['all', 'pending', 'shipped', 'delivered', 'consigning'] as WarehouseTab[]).map((value) => {
        const badge = value === 'all' ? 0 : counts[value as Exclude<WarehouseTab, 'all'>];
        return (
          <button
            key={value}
            className={`${styles.tab} ${tab === value ? styles.active : ''}`}
            type="button"
            onClick={() => onChange(value)}
          >
            {value === 'all'
              ? '全部'
              : value === 'pending'
                ? '待提货'
                : value === 'shipped'
                  ? '运输中'
                  : value === 'delivered'
                    ? '已签收'
                    : '寄售中'}
            {badge > 0 ? <span className={styles.badge}>{badge}</span> : null}
          </button>
        );
      })}
    </section>
  );
}
