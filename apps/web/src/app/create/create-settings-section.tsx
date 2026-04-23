'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  formatSalesLabel,
  getDiscountPercent,
  parseSalesCount,
  type CouponType,
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
  couponEnabled: boolean;
  setCouponEnabled: Dispatch<SetStateAction<boolean>>;
  couponType: CouponType;
  setCouponType: Dispatch<SetStateAction<CouponType>>;
  couponThreshold: string;
  setCouponThreshold: Dispatch<SetStateAction<string>>;
  couponAmount: string;
  setCouponAmount: Dispatch<SetStateAction<string>>;
  couponDiscount: string;
  setCouponDiscount: Dispatch<SetStateAction<string>>;
  couponMaxOff: string;
  setCouponMaxOff: Dispatch<SetStateAction<string>>;
  previewCoupon: string;
};

export function CreateSettingsSection({
  stepDone,
  deadline,
  setDeadline,
  isMerchantMode,
  openProductPicker,
  selectedProduct,
  couponEnabled,
  setCouponEnabled,
  couponType,
  setCouponType,
  couponThreshold,
  setCouponThreshold,
  couponAmount,
  setCouponAmount,
  couponDiscount,
  setCouponDiscount,
  couponMaxOff,
  setCouponMaxOff,
  previewCoupon,
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

      <div className={styles.settingRow}>
        <div>
          <div className={styles.settingLabel}>最低参与人数</div>
          <div className={styles.settingDesc}>未达到将自动退款</div>
        </div>
        <input className={styles.miniNumber} type="number" value="10" readOnly />
      </div>

      <div className={`${styles.settingRow} ${!isMerchantMode ? styles.lockedFeature : ''}`}>
        <div>
          <div className={styles.settingLabel}>
            关联商品 {!isMerchantMode ? <span className={styles.lockedTag}>商家专属</span> : null}
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
              <div className={styles.spdBrand}>
                {selectedProduct.brand} <span className={styles.spdBrandTag}>品牌直供</span>
              </div>
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

      <div className={styles.settingRow}>
        <div>
          <div className={styles.settingLabel}>好友PK模式</div>
          <div className={styles.settingDesc}>允许好友对战</div>
        </div>
        <button className={`${styles.toggle} ${styles.toggleActive}`} type="button" aria-label="好友PK模式已开启">
          <span />
        </button>
      </div>

      <div className={`${styles.settingRow} ${styles.settingRowLast} ${!isMerchantMode ? styles.lockedFeature : ''}`}>
        <div>
          <div className={styles.settingLabel}>
            自动生成优惠券 {!isMerchantMode ? <span className={styles.lockedTag}>商家专属</span> : null}
          </div>
          <div className={styles.settingDesc}>未中者自动获得补偿券</div>
        </div>
        <button
          className={`${styles.toggle} ${couponEnabled ? styles.toggleActive : ''}`}
          type="button"
          disabled={!isMerchantMode}
          onClick={() => setCouponEnabled((value) => !value)}
        >
          <span />
        </button>
      </div>

      {couponEnabled && isMerchantMode ? (
        <div className={styles.couponConfig}>
          <div className={styles.couponConfigTitle}>🏷️ 优惠券配置</div>
          <div className={styles.couponTypes}>
            <button type="button" className={`${styles.couponType} ${couponType === 'full_reduce' ? styles.couponTypeOn : ''}`} onClick={() => setCouponType('full_reduce')}>
              <div className={styles.couponTypeIcon}>💰</div>
              <div className={styles.couponTypeName}>满减券</div>
              <div className={styles.couponTypeDesc}>满X元减Y元</div>
            </button>
            <button type="button" className={`${styles.couponType} ${couponType === 'discount' ? styles.couponTypeOn : ''}`} onClick={() => setCouponType('discount')}>
              <div className={styles.couponTypeIcon}>🌟</div>
              <div className={styles.couponTypeName}>折扣券</div>
              <div className={styles.couponTypeDesc}>打X折优惠</div>
            </button>
            <button type="button" className={`${styles.couponType} ${couponType === 'no_threshold' ? styles.couponTypeOn : ''}`} onClick={() => setCouponType('no_threshold')}>
              <div className={styles.couponTypeIcon}>🎁</div>
              <div className={styles.couponTypeName}>无门槛券</div>
              <div className={styles.couponTypeDesc}>直接抵扣现金</div>
            </button>
          </div>

          {couponType === 'full_reduce' ? (
            <div className={styles.couponFields}>
              <label className={styles.couponField}>
                <span>满足金额</span>
                <input type="number" value={couponThreshold} onChange={(event) => setCouponThreshold(event.target.value)} />
                <small>元</small>
              </label>
              <label className={styles.couponField}>
                <span>减免金额</span>
                <input type="number" value={couponAmount} onChange={(event) => setCouponAmount(event.target.value)} />
                <small>元</small>
              </label>
            </div>
          ) : null}

          {couponType === 'discount' ? (
            <div className={styles.couponFields}>
              <label className={styles.couponField}>
                <span>折扣力度</span>
                <input type="number" value={couponDiscount} onChange={(event) => setCouponDiscount(event.target.value)} />
                <small>折</small>
              </label>
              <label className={styles.couponField}>
                <span>最高优惠</span>
                <input type="number" value={couponMaxOff} onChange={(event) => setCouponMaxOff(event.target.value)} />
                <small>元</small>
              </label>
            </div>
          ) : null}

          {couponType === 'no_threshold' ? (
            <div className={styles.couponFields}>
              <label className={styles.couponField}>
                <span>抵扣金额</span>
                <input type="number" value={couponAmount} onChange={(event) => setCouponAmount(event.target.value)} />
                <small>元</small>
              </label>
            </div>
          ) : null}

          <div className={styles.couponPreview}>
            <div className={styles.couponPreviewIcon}>🏷️</div>
            <div className={styles.couponPreviewInfo}>
              <div className={styles.couponPreviewAmount}>{couponType === 'discount' ? `${couponDiscount}折` : `¥${couponAmount}`}</div>
              <div className={styles.couponPreviewCond}>{previewCoupon}</div>
            </div>
            <div className={styles.couponPreviewTag}>未中补偿</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
