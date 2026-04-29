'use client';

import { useRouter } from 'next/navigation';
import type { CouponListItem, UserAddressItem } from '@umi/shared';

import styles from './page.module.css';
import type { PaymentProduct } from './payment-helpers';
import { getCouponDiscount } from './payment-helpers';

type PaymentOverlaysProps = {
  addrOpen: boolean;
  couponOpen: boolean;
  pwdOpen: boolean;
  successOpen: boolean;
  toast: string;
  addresses: UserAddressItem[];
  addressIndex: number;
  availableCoupons: CouponListItem[];
  couponId: string | null;
  subtotal: number;
  method: 'wechat' | 'alipay';
  total: number;
  pwd: string;
  submitting: boolean;
  createdOrderId: string | null;
  onAddressClose: () => void;
  onAddressSelect: (index: number) => void;
  onCouponClose: () => void;
  onCouponSelect: (couponId: string | null) => void;
  onPasswordClose: () => void;
  onPasswordKeyPress: (key: string) => void;
  onSuccessClose: () => void;
  onToastClear: () => void;
};

const PASSWORD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

export function PaymentOverlays({
  addrOpen,
  couponOpen,
  pwdOpen,
  successOpen,
  toast,
  addresses,
  addressIndex,
  availableCoupons,
  couponId,
  subtotal,
  method,
  total,
  pwd,
  submitting,
  createdOrderId,
  onAddressClose,
  onAddressSelect,
  onCouponClose,
  onCouponSelect,
  onPasswordClose,
  onPasswordKeyPress,
  onSuccessClose,
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
                    <span>{item.phone}</span>
                    {item.tag ? <span className={styles.addrMiniTag}>{item.tag}</span> : null}
                  </div>
                  <div className={styles.addrItemDetail}>
                    {item.province}
                    {item.city}
                    {item.district}
                    {item.detail}
                  </div>
                  <div className={styles.addrItemCheck}>{addressIndex === index ? '✓' : ''}</div>
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
              {availableCoupons.map((item) => {
                const discount = getCouponDiscount(item, subtotal);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.couponItem} ${couponId === item.id ? styles.couponActive : ''}`}
                    onClick={() => onCouponSelect(item.id)}
                  >
                    <div className={`${styles.couponFace} ${styles.faceRed}`}>
                      <div className={styles.couponVal}>¥{discount.toFixed(2)}</div>
                      <div className={styles.couponSmall}>优惠券</div>
                    </div>
                    <div className={styles.couponInfo}>
                      <div className={styles.couponName}>{item.name}</div>
                      <div className={styles.couponCond}>{item.condition}</div>
                      <div className={styles.couponExp}>
                        有效期至 {item.expireAt ? item.expireAt.slice(0, 10) : '长期有效'}
                      </div>
                    </div>
                    <div className={styles.couponCheck}>{couponId === item.id ? '✓' : ''}</div>
                  </button>
                );
              })}
              {!availableCoupons.length ? <div className={styles.sheetNotUse}>当前暂无可用优惠券</div> : null}
            </div>
            <button className={styles.sheetNotUse} type="button" onClick={() => onCouponSelect(null)}>
              不使用优惠券
            </button>
          </div>
        </div>
      ) : null}

      {pwdOpen ? (
        <div className={styles.passwordOverlay}>
          <div className={styles.sheetBg} onClick={() => !submitting && onPasswordClose()} />
          <div className={styles.passwordSheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>请输入支付密码</div>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => !submitting && onPasswordClose()}
              >
                ×
              </button>
            </div>
            <div className={styles.payAmount}>
              <div className={styles.payAmountLabel}>{method === 'wechat' ? '微信支付' : '支付宝'}</div>
              <div className={styles.payAmountValue}>¥ {total.toFixed(2)}</div>
            </div>
            <div className={styles.pwdDots}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={`${styles.pwdDot} ${pwd[index] ? styles.filled : ''}`}>
                  {pwd[index] ? '•' : ''}
                </div>
              ))}
            </div>
            <div className={styles.keypad}>
              {PASSWORD_KEYS.map((key) => (
                <button
                  key={key || 'empty'}
                  type="button"
                  className={`${styles.key} ${key === '' ? styles.emptyKey : ''} ${key === '⌫' ? styles.delKey : ''}`}
                  onClick={() => onPasswordKeyPress(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className={styles.successOverlay}>
          <div className={styles.sheetBg} onClick={onSuccessClose} />
          <div className={styles.successCard}>
            <div className={styles.successIcon}>🎉</div>
            <div className={styles.successTitle}>支付成功</div>
            <div className={styles.successDesc}>真实订单已创建</div>
            <button
              type="button"
              className={styles.payBtn}
              onClick={() =>
                router.push(
                  createdOrderId ? `/order-detail?id=${encodeURIComponent(createdOrderId)}` : '/orders',
                )
              }
            >
              查看订单
            </button>
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
