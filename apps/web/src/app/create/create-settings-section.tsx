'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  formatSalesLabel,
  getDiscountPercent,
  parseSalesCount,
  type ProductItem,
} from './create-helpers';
import styles from './page.module.css';

type Props = {
  stepDone: boolean;
  deadline: string;
  setDeadline: Dispatch<SetStateAction<string>>;
  isMerchantMode: boolean;
  openProductPicker: () => void;
  selectedProduct: ProductItem | null;
};

export function CreateSettingsSection({
  stepDone,
  deadline,
  setDeadline,
  isMerchantMode,
  openProductPicker,
  selectedProduct,
}: Props) {
  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>3</span> 开奖设置
        <span className={`${styles.stepStatus} ${stepDone ? styles.done : styles.pending}`}>{stepDone ? '✓ 已设置' : '待完善'}</span>
      </h3>

      <div className={styles.settingRow}>
        <div>
          <div className={styles.settingLabel}>
            开奖时间<span className={styles.requiredMark}>*</span>
          </div>
          <div className={styles.settingDesc}>竞猜截止并自动开奖</div>
        </div>
        <input className={styles.datetime} type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
      </div>

      <div className={`${styles.settingRow} ${!isMerchantMode ? styles.lockedFeature : ''}`}>
        <div>
          <div className={styles.settingLabel}>
            关联商品 {!isMerchantMode ? <span className={styles.lockedTag}>店铺专属</span> : null}
          </div>
          <div className={styles.settingDesc}>选择竞猜关联的商品，猜中可直接购买</div>
        </div>
        <button className={styles.linkBtn} type="button" onClick={openProductPicker}>
          选择商品
        </button>
      </div>

      {selectedProduct ? (
        <div className={styles.selectedProductDisplay}>
          <div className={styles.spdCard}>
            <div className={styles.spdImgWrap}>
              <img src={selectedProduct.img} alt={selectedProduct.name} />
              <div className={styles.spdImgBadge}>
                <i className="fa-solid fa-link" />
              </div>
            </div>
            <div className={styles.spdInfo}>
              <div className={styles.spdName}>{selectedProduct.name}</div>
              <div className={styles.spdBrand}>{selectedProduct.shopName ?? selectedProduct.brand}</div>
              <div className={styles.spdPriceRow}>
                {getDiscountPercent(selectedProduct) >= 10 ? <div className={styles.spdPriceTag}>省{getDiscountPercent(selectedProduct)}%</div> : null}
                <div className={styles.spdPrice}>
                  <small>¥</small>
                  {selectedProduct.price}
                </div>
                {selectedProduct.originalPrice > selectedProduct.price ? <span className={styles.spdOrigPrice}>¥{selectedProduct.originalPrice}</span> : null}
              </div>
              <div className={styles.spdMetaRow}>
                <div className={styles.spdMetaItem}>
                  <i className={`fa-solid fa-fire ${parseSalesCount(selectedProduct.sales) >= 5000 ? styles.spdMetaHot : ''}`} /> {formatSalesLabel(selectedProduct.sales)}已售
                </div>
                <div className={styles.spdMetaItem}>
                  <i className="fa-solid fa-star" /> {selectedProduct.rating}
                </div>
                {selectedProduct.stock ? (
                  <div className={styles.spdMetaItem}>
                    <i className="fa-solid fa-box" /> 库存{selectedProduct.stock}
                  </div>
                ) : null}
              </div>
            </div>
            <div className={styles.spdActions}>
              <button className={styles.spdChange} type="button" onClick={openProductPicker}>
                <i className="fa-solid fa-arrow-right-arrow-left" /> 更换
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
