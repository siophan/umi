'use client';

import { useState } from 'react';
import type { WarehouseItem } from '@umi/shared';

import styles from './page.module.css';

type WarehouseTrackingModalProps = {
  item: WarehouseItem;
  onClose: () => void;
  onCopyResult: (success: boolean) => void;
};

export function WarehouseTrackingModal({ item, onClose, onCopyResult }: WarehouseTrackingModalProps) {
  const [copying, setCopying] = useState(false);
  const tracking = item.tracking ?? null;

  const handleCopy = async () => {
    if (!tracking?.trackingNo || copying) return;
    setCopying(true);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(tracking.trackingNo);
      } else {
        const ta = document.createElement('textarea');
        ta.value = tracking.trackingNo;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      onCopyResult(true);
    } catch {
      onCopyResult(false);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.sellHead}>
          <div className={styles.sellTitle}>物流信息</div>
          <button className={styles.close} type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.sellProduct}>
          <img src={item.productImg || '/legacy/images/products/p001-lays.jpg'} alt={item.productName} />
          <div className={styles.sellProductInfo}>
            <div className={styles.sellProductName}>{item.productName}</div>
            <div className={styles.sellProductMeta}>×{item.quantity} · {item.sourceType || item.warehouseType}</div>
          </div>
        </div>

        {tracking ? (
          <>
            {tracking.carrier ? (
              <div className={styles.field}>
                <div className={styles.label}>承运商</div>
                <div className={styles.trackingValue}>{tracking.carrier}</div>
              </div>
            ) : null}
            <div className={styles.field}>
              <div className={styles.label}>运单号</div>
              <div className={styles.trackingNoRow}>
                <div className={styles.trackingNo}>{tracking.trackingNo}</div>
                <button
                  className={styles.copyBtn}
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={copying}
                >
                  <i className="fa-regular fa-copy" />
                  复制
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.trackingEmpty}>
            <div className={styles.trackingEmptyIcon}>
              <i className="fa-solid fa-truck-fast" />
            </div>
            <div className={styles.trackingEmptyTitle}>暂无物流信息</div>
            <div className={styles.trackingEmptyDesc}>商品已出库，承运商揽收后会同步运单号</div>
          </div>
        )}

        <button className={styles.submit} type="button" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  );
}
