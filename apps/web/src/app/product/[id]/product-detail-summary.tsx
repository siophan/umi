'use client';

import type { CouponListItem } from '@umi/shared';

import type { ActiveGuessDetail, ProductDetailData, ProductMode } from './product-detail-helpers';
import styles from './page.module.css';

function buildShippingChipText(
  freight: number | null,
  shipFrom: string | null,
  deliveryDays: string | null,
): string {
  const parts: string[] = [];
  if (freight === 0 || freight == null) {
    parts.push('包邮');
  } else if (freight > 0) {
    parts.push(`运费 ¥${freight}`);
  }
  if (shipFrom) parts.push(`${shipFrom}发货`);
  if (deliveryDays) parts.push(deliveryDays);
  if (parts.length === 0) return '服务说明以下单页和店铺规则为准';
  return parts.join(' · ');
}

type ProductDetailSummaryProps = {
  product: ProductDetailData;
  coupons: CouponListItem[];
  activeGuess: ActiveGuessDetail | null;
  currentTab: ProductMode;
  activePrice: number;
  directPrice: number;
  guessPrice: number;
  discountPercent: number;
  onOpenCoupons: () => void;
  onOpenServiceTip: () => void;
  onChangeTab: (tab: ProductMode) => void;
};

export function ProductDetailSummary({
  product,
  coupons,
  activeGuess,
  currentTab,
  activePrice,
  directPrice,
  guessPrice,
  discountPercent,
  onOpenCoupons,
  onOpenServiceTip,
  onChangeTab,
}: ProductDetailSummaryProps) {
  return (
    <>
      <section className={styles.priceCard}>
        <div className={styles.priceRow}>
          <div className={styles.priceMain}>
            <small>¥</small>
            {activePrice}
          </div>
          <div className={styles.priceOrig}>¥{product.originalPrice}</div>
          <div className={styles.priceTags}>
            {discountPercent > 0 ? <span className={`${styles.priceTag} ${styles.tagOff}`}>{discountPercent}%OFF</span> : null}
          </div>
        </div>
        <div className={styles.titleArea}>
          <span className={styles.productTitle}>{product.name}</span>
        </div>
        <div className={styles.productSub}>
          <span>已售 {product.sales}</span>
          <span className={styles.sep}>|</span>
          <span>⭐ {product.rating ? product.rating.toFixed(1) : '0.0'}</span>
          <span className={styles.sep}>|</span>
          <span>{product.category}</span>
        </div>
        <div className={styles.promoStrip}>
          <button className={styles.promoChip} type="button" onClick={onOpenCoupons}>
            <span className={`${styles.pcTag} ${styles.pcCoupon}`}>券</span>
            {coupons.length ? `可用${coupons.length}张券` : '下单可用优惠券'}
            <i className="fa-solid fa-chevron-right" />
          </button>
          {activeGuess ? (
            <button className={styles.promoChip} type="button" onClick={() => onChangeTab('guess')}>
              <span className={`${styles.pcTag} ${styles.pcGuess}`}>猜</span> ¥{guessPrice}参与竞猜赢商品 <i className="fa-solid fa-chevron-right" />
            </button>
          ) : null}
          <button className={styles.promoChip} type="button" onClick={onOpenServiceTip}>
            <span className={`${styles.pcTag} ${styles.pcSvc}`}>保</span>{' '}
            {buildShippingChipText(product.freight, product.shipFrom, product.deliveryDays)}{' '}
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </section>

      <section className={styles.modeSection}>
        <div className={styles.modeBar}>
          <button
            className={`${styles.modeTab} ${currentTab === 'direct' ? styles.modeDirectOn : ''}`}
            type="button"
            onClick={() => onChangeTab('direct')}
          >
            <span className={styles.modeIcon}>🛒</span> 直购 <span className={styles.modePrice}>¥{directPrice}</span>
          </button>
          {activeGuess ? (
            <button
              className={`${styles.modeTab} ${currentTab === 'guess' ? styles.modeGuessOn : ''}`}
              type="button"
              onClick={() => onChangeTab('guess')}
            >
              <span className={styles.modeIcon}>🎲</span> 竞猜 <span className={styles.modePrice}>¥{guessPrice}</span>
            </button>
          ) : null}
          <button
            className={`${styles.modeTab} ${currentTab === 'inv' ? styles.modeInvOn : ''}`}
            type="button"
            onClick={() => onChangeTab('inv')}
          >
            <span className={styles.modeIcon}>💰</span> 换购 <span className={styles.modePrice}>¥{directPrice}</span>
          </button>
        </div>
      </section>

      <section className={styles.specSection}>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>标签</div>
          <div className={styles.specScroll}>
            {product.tags.length ? product.tags.map((item) => (
              <span className={styles.specChipOn} key={item}>
                <span className={styles.specDot} />
                {item}
              </span>
            )) : <span className={styles.specChip}>暂无标签</span>}
          </div>
        </div>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>库存</div>
          <div className={styles.specScroll}>
            <span className={styles.specChipOn}>
              现货库存 {product.stock}
              <span className={styles.specDp}>{product.stock > 0 ? '可下单' : '缺货'}</span>
            </span>
            {product.shopName ? <span className={styles.specChip}>店铺：{product.shopName}</span> : null}
          </div>
        </div>
        <div className={styles.specFoot}>
          <span className={styles.specFootSel}>
            当前商品 <b>{product.brand}</b> / <b>{product.category}</b>
          </span>
          <span className={styles.specFootPrice}>
            ¥{activePrice} <small>{product.stock > 0 ? '现价' : '暂不可下单'}</small>
          </span>
        </div>
      </section>
    </>
  );
}
