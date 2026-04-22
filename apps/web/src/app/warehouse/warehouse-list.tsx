'use client';

import type { WarehouseItem } from '@umi/shared';

import styles from './page.module.css';
import {
  emptyMap,
  getWarehouseStatusClass,
  mapWarehouseTab,
  statusMeta,
  type WarehouseTab,
} from './warehouse-helpers';

type WarehouseListProps = {
  loading: boolean;
  error: string | null;
  tab: WarehouseTab;
  items: WarehouseItem[];
  onReload: () => void;
  onOpenSell: (item: WarehouseItem) => void;
  onCancelConsign: (item: WarehouseItem) => void;
  onTrackShipment: () => void;
  onPickup: (item: WarehouseItem) => void;
};

export function WarehouseList({
  loading,
  error,
  tab,
  items,
  onReload,
  onOpenSell,
  onCancelConsign,
  onTrackShipment,
  onPickup,
}: WarehouseListProps) {
  return (
    <main className={styles.list}>
      {!loading && error ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><i className="fa-solid fa-triangle-exclamation" /></div>
          <div className={styles.emptyText}>仓库加载失败</div>
          <div className={styles.emptyDesc}>{error}</div>
          <button className={styles.emptyBtn} type="button" onClick={onReload}>
            <i className="fa-solid fa-rotate-right" />
            重新加载
          </button>
        </div>
      ) : !loading && items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><i className={emptyMap[tab].icon} /></div>
          <div className={styles.emptyText}>{emptyMap[tab].title}</div>
          <div className={styles.emptyDesc}>{emptyMap[tab].desc}</div>
        </div>
      ) : (
        items.map((item, index) => {
          const mappedTab = mapWarehouseTab(item);
          const meta = statusMeta[mappedTab];
          return (
            <article
              key={`${item.warehouseType}-${item.id}`}
              className={styles.card}
              style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
            >
              <img
                className={styles.img}
                src={item.productImg || '/legacy/images/products/p001-lays.jpg'}
                alt={item.productName}
              />
              <div className={styles.body}>
                <div className={styles.name}>{item.productName}</div>
                <div className={styles.meta}>
                  <span>×{item.quantity}</span>
                  <span className={styles.sep}>|</span>
                  <span>{item.sourceType || item.warehouseType}</span>
                  <span className={styles.sep}>|</span>
                  <span>{item.createdAt.slice(0, 10)}</span>
                </div>
                <div className={styles.price}>
                  <small>¥</small>
                  {(((item.price || 0) * item.quantity) * 10 / 10).toFixed(1)}
                </div>
                <div className={`${styles.status} ${getWarehouseStatusClass(mappedTab)}`}>
                  <i className={`fa-solid ${meta[2]}`} />
                  {meta[0]}
                  {mappedTab === 'consigning' && item.estimateDays ? <span> · 预计 {item.estimateDays} 日内售出</span> : null}
                </div>
              </div>
              <div className={styles.actions}>
                {mappedTab === 'consigning' ? (
                  <>
                    <div className={styles.consignPriceRow}>
                      <span className={styles.consignPrice}>¥{(item.consignPrice || 0).toFixed(1)}</span>
                      <span className={styles.consignLabel}>寄售价</span>
                    </div>
                    <button className={`${styles.btn} ${styles.cancel}`} type="button" onClick={() => onCancelConsign(item)}>
                      <i className="fa-solid fa-xmark" />
                      取消寄售
                    </button>
                  </>
                ) : mappedTab === 'shipped' ? (
                  <button className={`${styles.btn} ${styles.outline}`} type="button" onClick={onTrackShipment}>
                    <i className="fa-solid fa-location-dot" />
                    物流
                  </button>
                ) : mappedTab === 'pending' ? (
                  <>
                    <button className={`${styles.btn} ${styles.primary}`} type="button" onClick={() => onPickup(item)}>
                      <i className="fa-solid fa-truck-fast" />
                      提货
                    </button>
                    <button className={`${styles.btn} ${styles.sell}`} type="button" onClick={() => onOpenSell(item)}>
                      <i className="fa-solid fa-tag" />
                      寄售
                    </button>
                  </>
                ) : (
                  <button className={`${styles.btn} ${styles.sell}`} type="button" onClick={() => onOpenSell(item)}>
                    <i className="fa-solid fa-tag" />
                    寄售
                  </button>
                )}
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}
