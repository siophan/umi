'use client';

import type { WarehouseItem } from '@umi/shared';

import styles from './page.module.css';

type WarehouseConsignModalProps = {
  item: WarehouseItem;
  sellPrice: string;
  estimate: { title: string; desc: string; level: number } | null;
  onClose: () => void;
  onPriceChange: (value: string) => void;
  onSubmit: () => void;
};

export function WarehouseConsignModal({
  item,
  sellPrice,
  estimate,
  onClose,
  onPriceChange,
  onSubmit,
}: WarehouseConsignModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.sellHead}>
          <div className={styles.sellTitle}>寄售商品</div>
          <button className={styles.close} type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.sellProduct}>
          <img src={item.productImg || '/legacy/images/products/p001-lays.jpg'} alt={item.productName} />
          <div className={styles.sellProductInfo}>
            <div className={styles.sellProductName}>{item.productName}</div>
            <div className={styles.sellProductMeta}>×{item.quantity} · {item.sourceType || item.warehouseType}</div>
            <div className={styles.sellProductVal}>
              <small>¥</small>
              {item.price || 0}
              <span> /件</span>
            </div>
          </div>
        </div>

        {estimate ? (
          <div className={styles.estimate}>
            <div className={styles.estimateIcon}>
              <i className="fa-solid fa-bolt" />
            </div>
            <div className={styles.estimateInfo}>
              <div className={styles.estimateTitle}>
                <i className="fa-solid fa-chart-line" />
                {estimate.title}
              </div>
              <div className={styles.estimateDesc}>{estimate.desc}</div>
              <div className={styles.estimateDays}>
                {[1, 2, 3].map((day) => (
                  <div
                    key={day}
                    className={`${styles.estimateDot} ${day <= estimate.level ? styles.dotActive : styles.dotInactive}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.field}>
          <div className={styles.label}>寄售价格</div>
          <input
            className={styles.input}
            type="number"
            min="0.1"
            step="0.1"
            value={sellPrice}
            onChange={(event) => onPriceChange(event.target.value)}
            placeholder="输入你的寄售价格"
          />
          <div className={styles.hint}>建议寄售价：¥{Math.round((item.price || 0) * 0.85 * 10) / 10}（市场价 ¥{item.price || 0}）</div>
        </div>

        <div className={styles.hint} style={{ marginBottom: 14 }}>
          本次将整批寄售 ×{item.quantity}，售出后一次性结算
        </div>

        <button className={styles.submit} type="button" onClick={onSubmit}>
          确认寄售
        </button>
      </div>
    </div>
  );
}
