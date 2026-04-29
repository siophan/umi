'use client';

import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  formatSalesLabel,
  getDiscountPercent,
  type ProductItem,
} from './create-helpers';
import styles from './page.module.css';

type Props = {
  stepDone: boolean;
  deadline: string;
  setDeadline: Dispatch<SetStateAction<string>>;
  revealAt: string;
  setRevealAt: Dispatch<SetStateAction<string>>;
  minParticipants: string;
  setMinParticipants: Dispatch<SetStateAction<string>>;
  isMerchantMode: boolean;
  openProductPicker: () => void;
  selectedProduct: ProductItem | null;
};

function formatDatetimeLocal(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function CreateSettingsSection({
  stepDone,
  deadline,
  setDeadline,
  revealAt,
  setRevealAt,
  minParticipants,
  setMinParticipants,
  isMerchantMode,
  openProductPicker,
  selectedProduct,
}: Props) {
  const minDeadline = useMemo(() => formatDatetimeLocal(new Date()), []);
  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>3</span> 开奖设置
        <span className={`${styles.stepStatus} ${stepDone ? styles.done : styles.pending}`}>{stepDone ? '✓ 已设置' : '待完善'}</span>
      </h3>

      <div className={styles.settingRow}>
        <div>
          <div className={styles.settingLabel}>
            {isMerchantMode ? '投注截止时间' : '开奖时间'}<span className={styles.requiredMark}>*</span>
          </div>
          <div className={styles.settingDesc}>
            {isMerchantMode ? '到时停止接受投注' : '竞猜截止并自动开奖'}
          </div>
        </div>
        <input className={styles.datetime} type="datetime-local" min={minDeadline} value={deadline} onChange={(event) => setDeadline(event.target.value)} />
      </div>

      {isMerchantMode ? (
        <>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>
                揭晓时间<span className={styles.requiredMark}>*</span>
              </div>
              <div className={styles.settingDesc}>到时公布结果并结算</div>
            </div>
            <input
              className={styles.datetime}
              type="datetime-local"
              min={deadline || minDeadline}
              value={revealAt}
              onChange={(event) => setRevealAt(event.target.value)}
            />
          </div>

          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>
                最低参与人数<span className={styles.requiredMark}>*</span>
              </div>
              <div className={styles.settingDesc}>未达标自动流标，已投注金额按原支付通道退回</div>
            </div>
            <input
              className={styles.datetime}
              type="number"
              min={1}
              step={1}
              placeholder="例如 10"
              value={minParticipants}
              onChange={(event) => setMinParticipants(event.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
        </>
      ) : null}

      <div className={styles.settingRow}>
        <div>
          <div className={styles.settingLabel}>
            关联商品<span className={styles.requiredMark}>*</span>
          </div>
          <div className={styles.settingDesc}>
            {isMerchantMode ? '从本店商品中选择竞猜话题相关产品' : '选择本次PK的"赌注"商品，猜中可直接购买'}
          </div>
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
                  <i className={`fa-solid fa-fire ${selectedProduct.sales >= 5000 ? styles.spdMetaHot : ''}`} /> {formatSalesLabel(selectedProduct.sales)}已售
                </div>
                <div className={styles.spdMetaItem}>
                  <i className="fa-solid fa-star" /> {selectedProduct.rating.toFixed(1)}
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
