'use client';

import type { WarehouseItem } from '@umi/shared';

import type { ProductDetailData } from './product-detail-helpers';
import { formatPriceNumber } from './product-detail-helpers';
import styles from './page.module.css';

type ProductDetailExchangeSheetProps = {
  product: ProductDetailData;
  warehouseItems: WarehouseItem[];
  selectedWarehouse: string[];
  selectedDeduct: number;
  exchangeOverflow: number;
  exchangeToPay: number;
  exchangeOpen: boolean;
  exchangeConfirmOpen: boolean;
  onCloseExchange: () => void;
  onSelectWarehouse: (warehouseId: string) => void;
  onApplyBestPlan: () => void;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirmExchange: () => void;
};

export function ProductDetailExchangeSheet({
  product,
  warehouseItems,
  selectedWarehouse,
  selectedDeduct,
  exchangeOverflow,
  exchangeToPay,
  exchangeOpen,
  exchangeConfirmOpen,
  onCloseExchange,
  onSelectWarehouse,
  onApplyBestPlan,
  onOpenConfirm,
  onCloseConfirm,
  onConfirmExchange,
}: ProductDetailExchangeSheetProps) {
  if (!exchangeOpen && !exchangeConfirmOpen) {
    return null;
  }

  return (
    <>
      {exchangeOpen ? (
        <div className={styles.exchangeOverlay}>
          <button className={styles.exchangeMask} type="button" onClick={onCloseExchange} />
          <section className={styles.exchangeSheet}>
            <div className={styles.exchangeHeader}>
              <div className={styles.exchangeTitle}>库存换购</div>
              <button type="button" onClick={onCloseExchange}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.exchangeTarget}>
              <img src={product.img} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <strong>
                  <small>¥</small>
                  {product.price}
                  {product.originalPrice > product.price ? <em>¥{product.originalPrice}</em> : null}
                </strong>
                <div className={styles.exchangeTargetTags}>
                  <span>库存换购</span>
                  <span className={styles.exchangeTargetTagGreen}>真实库存抵扣</span>
                </div>
                <p>实际补差价以当前选中的库存抵扣结果为准。</p>
              </div>
            </div>
            <div className={styles.exchangePlan}>
              <div className={styles.exchangePlanCard}>
                <div className={styles.exchangePlanIcon}>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </div>
                <div className={styles.exchangePlanInfo}>
                  <div className={styles.exchangePlanLabel}>推荐方案</div>
                  <div className={styles.exchangePlanDesc}>
                    当前仓库共 {warehouseItems.length} 件库存，可抵扣 ¥{selectedDeduct || formatPriceNumber(warehouseItems.reduce((sum, item) => sum + Number(item.price ?? 0), 0))}
                  </div>
                </div>
                <button className={styles.exchangePlanBtn} type="button" onClick={onApplyBestPlan}>
                  一键选用
                </button>
              </div>
            </div>
            <div className={styles.exchangeBody}>
              <div className={styles.exchangeBodyTitle}>
                <i className="fa-solid fa-box-open" /> 我的仓库库存
              </div>
              {warehouseItems.map((item: WarehouseItem) => (
                <button
                  className={selectedWarehouse.includes(item.id) ? styles.exchangeCardSelected : styles.exchangeCard}
                  type="button"
                  key={item.id}
                  onClick={() => onSelectWarehouse(item.id)}
                >
                  <img src={item.productImg || product.img} alt={item.productName} />
                  <span className={styles.exchangeCardCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                  <div className={styles.exchangeCardInfo}>
                    <div className={styles.exchangeCardName}>{item.productName}</div>
                    <div className={styles.exchangeCardMeta}>{item.sourceType}</div>
                    <div className={styles.exchangeCardRow}>
                      <span className={styles.exchangeCardPrice}>
                        <small>¥</small>
                        {Number(item.price ?? 0)}
                      </span>
                      <span className={styles.exchangeCardSource}>可抵扣</span>
                    </div>
                  </div>
                </button>
              ))}
              {warehouseItems.length === 0 ? <div className={styles.directRow}>当前没有可用于换购的同款库存。</div> : null}
            </div>
            <div className={styles.exchangeFooter}>
              {exchangeOverflow > 0 ? (
                <div className={styles.exchangeWarn}>
                  <i className="fa-solid fa-triangle-exclamation" />
                  <div>
                    当前选中库存超出商品价值 <strong>¥{exchangeOverflow}</strong>，确认后会按当前方案换购。
                  </div>
                </div>
              ) : null}
              <div className={styles.exchangeSummary}>
                <div>
                  <span>已选</span>
                  <strong>{selectedWarehouse.length}</strong>
                </div>
                <i className={styles.exchangeDivider} />
                <div>
                  <span>预计抵扣</span>
                  <strong className={styles.exchangeSummaryAccent}>¥{selectedDeduct}</strong>
                </div>
                <i className={styles.exchangeDivider} />
                <div>
                  <span>需补差价</span>
                  <strong className={styles.exchangeSummaryGreen}>¥{exchangeToPay}</strong>
                </div>
              </div>
              <button
                className={styles.exchangeConfirm}
                disabled={selectedWarehouse.length === 0}
                type="button"
                onClick={() => {
                  if (selectedWarehouse.length === 0) {
                    return;
                  }
                  if (exchangeOverflow > 0) {
                    onOpenConfirm();
                    return;
                  }
                  onConfirmExchange();
                }}
                style={{
                  background:
                    selectedWarehouse.length === 0
                      ? '#D9D9D9'
                      : exchangeOverflow > 0
                        ? 'linear-gradient(135deg,#FFA726,#FF7043)'
                        : 'linear-gradient(135deg,#2DC88A,#00875A)',
                }}
              >
                {selectedWarehouse.length === 0
                  ? '请选择要抵扣的库存'
                  : exchangeOverflow > 0
                    ? `确认换购（超出 ¥${exchangeOverflow}）`
                    : exchangeToPay > 0
                      ? `确认换购 · 补差价 ¥${exchangeToPay}`
                      : '确认换购（库存完全覆盖）'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {exchangeConfirmOpen ? (
        <div className={styles.exchangeConfirmDialog}>
          <button className={styles.exchangeMask} type="button" onClick={onCloseConfirm} />
          <div className={styles.exchangeConfirmCard}>
            <div className={styles.exchangeConfirmIcon}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div className={styles.exchangeConfirmTitle}>超额抵扣确认</div>
            <div className={styles.exchangeConfirmDesc}>
              当前选中的库存价值高于商品售价，超出部分为 <strong>¥{exchangeOverflow}</strong>。
            </div>
            <div className={styles.exchangeConfirmBtns}>
              <button type="button" onClick={onCloseConfirm}>重新选择</button>
              <button type="button" onClick={onConfirmExchange}>
                确认换购
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
