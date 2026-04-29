'use client';

import { useRouter } from 'next/navigation';
import type { CouponListItem, UserAddressItem } from '@umi/shared';

import styles from './page.module.css';

type PaymentOverlaysProps = {
  addrOpen: boolean;
  couponOpen: boolean;
  toast: string;
  addresses: UserAddressItem[];
  addressIndex: number;
  availableCoupons: CouponListItem[];
  couponId: string | null;
  onAddressClose: () => void;
  onAddressSelect: (index: number) => void;
  onCouponClose: () => void;
  onCouponSelect: (couponId: string | null) => void;
  onToastClear: () => void;
};

export function PaymentOverlays({
  addrOpen,
  couponOpen,
  toast,
  addresses,
  addressIndex,
  availableCoupons,
  couponId,
  onAddressClose,
  onAddressSelect,
  onCouponClose,
  onCouponSelect,
  onToastClear,
}: PaymentOverlaysProps) {
  const router = useRouter();

  return (
    <>
      {addrOpen ? (
        <div className={styles.overlay}>
          <div className={styles.sheetBg} onClick={onAddressClose} />
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>选择收货地址</div>
              <button type="button" className={styles.sheetClose} onClick={onAddressClose}>
                ×
              </button>
            </div>
            <div className={styles.sheetList}>
              {addresses.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.addrItem} ${addressIndex === index ? styles.addrActive : ''}`}
                  onClick={() => onAddressSelect(index)}
                >
                  <div className={styles.addrItemTop}>
                    <span>{item.name}</span>
                    <span className={styles.addrItemPhone}>{item.phone}</span>
                    {item.isDefault ? (
                      <span className={styles.addrMiniTag}>默认</span>
                    ) : item.tag ? (
                      <span className={styles.addrMiniTag}>{item.tag}</span>
                    ) : null}
                    <span className={styles.addrItemCheck}>
                      <i className="fa-solid fa-circle-check" />
                    </span>
                  </div>
                  <div className={styles.addrItemDetail}>
                    {item.province}
                    {item.city}
                    {item.district}
                    {item.detail}
                  </div>
                </button>
              ))}
            </div>
            <button className={styles.sheetAdd} type="button" onClick={() => router.push('/address')}>
              + 管理收货地址
            </button>
          </div>
        </div>
      ) : null}

      {couponOpen ? (
        <div className={styles.overlay}>
          <div className={styles.sheetBg} onClick={onCouponClose} />
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>选择优惠券</div>
              <button type="button" className={styles.sheetClose} onClick={onCouponClose}>
                ×
              </button>
            </div>
            <div className={styles.couponList}>
              {!availableCoupons.length ? (
                <div className={styles.couponEmpty}>
                  <i className="fa-regular fa-folder-open" />
                  <div className={styles.couponEmptyText}>当前暂无可用优惠券</div>
                  <div className={styles.couponEmptyHint}>去"我的优惠券"领取更多福利</div>
                </div>
              ) : null}
              {availableCoupons.map((item) => {
                const faceClass =
                  item.type === 'percent'
                    ? styles.faceBlue
                    : item.type === 'shipping'
                      ? styles.faceGreen
                      : styles.faceRed;
                const faceLabel =
                  item.type === 'percent'
                    ? '折扣券'
                    : item.type === 'shipping'
                      ? '运费券'
                      : '满减券';
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.couponItem} ${couponId === item.id ? styles.couponActive : ''}`}
                    onClick={() => onCouponSelect(item.id)}
                  >
                    <div className={`${styles.couponFace} ${faceClass}`}>
                      <div className={styles.couponVal}>
                        {item.type === 'percent' ? (
                          <>
                            {(item.amount / 10).toFixed(1).replace(/\.0$/, '')}
                            <small>折</small>
                          </>
                        ) : (
                          <>
                            <small>¥</small>
                            {Number.isInteger(item.amount) ? item.amount : item.amount.toFixed(2)}
                          </>
                        )}
                      </div>
                      <div className={styles.couponSmall}>{faceLabel}</div>
                    </div>
                    <div className={styles.couponInfo}>
                      <div className={styles.couponName}>{item.name}</div>
                      <div className={styles.couponCond}>{item.condition || '无门槛'}</div>
                      <div className={styles.couponExp}>
                        {item.expireAt ? `${item.expireAt.slice(0, 10)} 到期` : '长期有效'}
                      </div>
                    </div>
                    <div className={styles.couponCheck}>
                      <i className="fa-solid fa-circle-check" />
                    </div>
                  </button>
                );
              })}
            </div>
            {availableCoupons.length ? (
              <button className={styles.sheetNotUse} type="button" onClick={() => onCouponSelect(null)}>
                不使用优惠券
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {toast ? (
        <button
          type="button"
          className={styles.successDesc}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 110,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.78)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 999,
            zIndex: 400,
          }}
          onClick={onToastClear}
        >
          {toast}
        </button>
      ) : null}
    </>
  );
}
