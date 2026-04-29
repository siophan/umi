'use client';

import { useState } from 'react';
import type { CouponListItem, UserAddressItem } from '@umi/shared';

import styles from './page.module.css';
import type { PaymentProduct } from './payment-helpers';
import { PAYMENT_SERVICE_TAGS } from './payment-helpers';

type PaymentOrderSectionsProps = {
  loading: boolean;
  addressError: string | null;
  selectedAddress: UserAddressItem | null;
  products: PaymentProduct[];
  couponError: string | null;
  availableCoupons: CouponListItem[];
  selectedCoupon: CouponListItem | null;
  couponValue: number;
  method: 'wechat' | 'alipay';
  remark: string;
  subtotal: number;
  total: number;
  submitting: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onRetry: () => void;
  onManageAddresses: () => void;
  onAddressOpen: () => void;
  onCouponOpen: () => void;
  onMethodChange: (method: 'wechat' | 'alipay') => void;
  onRemarkChange: (value: string) => void;
  onSubmit: () => void;
};

export function PaymentOrderSections({
  loading,
  addressError,
  selectedAddress,
  products,
  couponError,
  availableCoupons,
  selectedCoupon,
  couponValue,
  method,
  remark,
  subtotal,
  total,
  submitting,
  canSubmit,
  onBack,
  onRetry,
  onManageAddresses,
  onAddressOpen,
  onCouponOpen,
  onMethodChange,
  onRemarkChange,
  onSubmit,
}: PaymentOrderSectionsProps) {
  const [invoiceOn, setInvoiceOn] = useState(false);
  const couponCount = availableCoupons.length;
  return (
    <>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={onBack}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>确认订单</div>
        <div className={styles.secure}>
          <i className="fa-solid fa-shield-halved" /> 安全支付
        </div>
      </header>

      {addressError ? (
        <section className={`${styles.card} ${styles.errorCard}`}>
          <div className={styles.errorTitle}>收货地址加载失败</div>
          <div className={styles.errorDesc}>{addressError}</div>
          <button className={styles.errorBtn} type="button" onClick={onRetry}>
            重新加载
          </button>
        </section>
      ) : !selectedAddress ? (
        <section className={`${styles.card} ${styles.addressCard}`}>
          <div className={styles.addrBar} />
          <button type="button" className={styles.addrRow} onClick={onManageAddresses}>
            <div className={styles.addrIcon}>
              <i className="fa-solid fa-location-dot" />
            </div>
            <div className={styles.addrInfo}>
              <div className={styles.addrTop}>
                <div className={styles.addrName}>{loading ? '正在加载地址' : '请先新增收货地址'}</div>
              </div>
              <div className={styles.addrDetail}>前往地址页添加真实收货地址后再提交订单</div>
            </div>
            <div className={styles.arrow}>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        </section>
      ) : (
        <section className={`${styles.card} ${styles.addressCard}`}>
          <div className={styles.addrBar} />
          <button type="button" className={styles.addrRow} onClick={onAddressOpen}>
            <div className={styles.addrIcon}>
              <i className="fa-solid fa-location-dot" />
            </div>
            <div className={styles.addrInfo}>
              <div className={styles.addrTop}>
                <div className={styles.addrName}>{selectedAddress.name}</div>
                <div className={styles.addrPhone}>{selectedAddress.phone}</div>
                {selectedAddress.tag ? <div className={styles.addrTag}>{selectedAddress.tag}</div> : null}
              </div>
              <div className={styles.addrDetail}>
                {selectedAddress.province}
                {selectedAddress.city}
                {selectedAddress.district}
                {selectedAddress.detail}
              </div>
            </div>
            <div className={styles.arrow}>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-bag-shopping" /> 商品信息
        </div>
        {products.length === 1 && products[0]?.img ? (
          <div className={styles.productPoster}>
            <img alt={products[0].name} src={products[0].img} />
            <span className={styles.productPosterTag}>🔥 热销商品</span>
          </div>
        ) : null}
        {products.map((item, index) => (
          <div className={styles.productRow} key={`${item.productId}-${index}`}>
            {index > 0 ? <div className={styles.divider} /> : null}
            <img alt={item.name} className={styles.productImg} src={item.img} />
            <div className={styles.productInfo}>
              <div className={styles.productName}>{item.name}</div>
              <div className={styles.productTags}>
                <span className={styles.tag}>包邮</span>
                <span className={styles.tag}>7天退换</span>
              </div>
              <div className={styles.productBottom}>
                <div>
                  <span className={styles.price}>¥ {item.price.toFixed(2)}</span>
                  <span className={styles.orig}>¥ {item.orig.toFixed(2)}</span>
                </div>
                <div className={styles.qty}>×{item.qty}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-truck-fast" /> 配送信息
        </div>
        <div className={styles.detailRow}>
          <i className="fa-solid fa-truck" />
          <span className={styles.detailLabel}>配送方式</span>
          <strong className={styles.detailValue}>顺丰速运</strong>
        </div>
        <div className={styles.detailRow}>
          <i className="fa-regular fa-clock" />
          <span className={styles.detailLabel}>预计送达</span>
          <strong className={`${styles.detailValue} ${styles.green}`}>明天 12:00 前</strong>
        </div>
        <div className={styles.detailRow}>
          <i className="fa-solid fa-box-open" />
          <span className={styles.detailLabel}>运费</span>
          <strong className={`${styles.detailValue} ${styles.green}`}>包邮</strong>
        </div>
        <div className={styles.detailRow}>
          <i className="fa-solid fa-shield-halved" />
          <span className={styles.detailLabel}>运费险</span>
          <strong className={styles.detailValue}>已赠送</strong>
        </div>
      </section>

      <section className={styles.card}>
        {couponError ? (
          <div className={styles.inlineError}>
            <div>
              <div className={styles.inlineErrorTitle}>优惠券加载失败</div>
              <div className={styles.inlineErrorDesc}>{couponError}</div>
            </div>
            <button className={styles.inlineErrorBtn} type="button" onClick={onRetry}>
              重试
            </button>
          </div>
        ) : (
          <button className={styles.couponRow} type="button" onClick={onCouponOpen}>
            <div className={styles.couponLeft}>
              <i className="fa-solid fa-ticket" />
              优惠券
              <span
                className={`${styles.couponBadge} ${couponCount === 0 ? styles.couponBadgeMuted : ''}`}
              >
                {couponCount > 0 ? `${couponCount}张可用` : '未使用'}
              </span>
            </div>
            <div
              className={`${styles.couponRight} ${selectedCoupon ? '' : styles.couponRightMuted}`}
            >
              <span>{selectedCoupon ? `-¥${couponValue.toFixed(2)}` : '未使用'}</span>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-credit-card" /> 支付方式
        </div>
        <button
          type="button"
          className={`${styles.pm} ${method === 'wechat' ? styles.pmActive : ''}`}
          onClick={() => onMethodChange('wechat')}
        >
          <div className={styles.pmIcon} style={{ background: '#07C160' }}>
            <i className="fa-brands fa-weixin" />
          </div>
          <div className={styles.pmInfo}>
            <div className={styles.pmName}>微信支付</div>
            <div className={styles.pmDesc}>推荐使用，支付立减</div>
          </div>
          <div className={styles.pmCheck}>✓</div>
        </button>
        <button
          type="button"
          className={`${styles.pm} ${method === 'alipay' ? styles.pmActive : ''}`}
          onClick={() => onMethodChange('alipay')}
        >
          <div className={styles.pmIcon} style={{ background: '#1677ff' }}>
            <i className="fa-brands fa-alipay" />
          </div>
          <div className={styles.pmInfo}>
            <div className={styles.pmName}>支付宝</div>
            <div className={styles.pmDesc}>支付宝快捷支付</div>
          </div>
          <div className={styles.pmCheck}>✓</div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-rotate-left" /> 退货权益
        </div>
        <div className={styles.detailRow}>
          <i className={`fa-solid fa-circle-check ${styles.detailGreenIcon}`} />
          <span className={styles.detailLabel}>7天无理由退货</span>
          <strong className={`${styles.detailValue} ${styles.detailLink}`}>查看详情</strong>
        </div>
        <div className={styles.detailRow}>
          <i className={`fa-solid fa-circle-check ${styles.detailGreenIcon}`} />
          <span className={styles.detailLabel}>破损包赔</span>
          <strong className={styles.detailValue}>签收48小时内可申请</strong>
        </div>
        <div className={styles.detailRow}>
          <i className={`fa-solid fa-circle-check ${styles.detailGreenIcon}`} />
          <span className={styles.detailLabel}>运费险</span>
          <strong className={styles.detailValue}>退货免运费</strong>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-file-invoice" /> 发票信息
        </div>
        <button
          type="button"
          className={styles.detailRowButton}
          onClick={() => setInvoiceOn((prev) => !prev)}
        >
          <i className="fa-solid fa-receipt" />
          <span className={styles.detailLabel}>发票类型</span>
          <strong className={`${styles.detailValue} ${styles.detailLink}`}>
            {invoiceOn ? '电子发票（个人）' : '不开发票'}
          </strong>
        </button>
        {invoiceOn ? (
          <>
            <div className={styles.detailRow}>
              <i className="fa-regular fa-building" />
              <span className={styles.detailLabel}>发票抬头</span>
              <strong className={styles.detailValue}>个人</strong>
            </div>
            <div className={styles.detailRow}>
              <i className="fa-regular fa-envelope" />
              <span className={styles.detailLabel}>接收邮箱</span>
              <strong className={styles.detailValue}>user@example.com</strong>
            </div>
          </>
        ) : null}
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-award" /> 服务保障
        </div>
        <div className={styles.services}>
          {PAYMENT_SERVICE_TAGS.map((item) => (
            <div className={styles.serviceTag} key={item.label}>
              <i className={`fa-solid ${item.icon}`} />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-regular fa-message" /> 订单备注
        </div>
        <textarea
          className={styles.remarkInput}
          rows={2}
          placeholder="选填，备注特殊需求"
          value={remark}
          onChange={(event) => onRemarkChange(event.target.value)}
        />
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-receipt" /> 价格明细
        </div>
        <div className={styles.priceRow}>
          <span>商品金额</span>
          <strong>¥{subtotal.toFixed(2)}</strong>
        </div>
        <div className={styles.priceRow}>
          <span>运费</span>
          <strong className={styles.green}>包邮</strong>
        </div>
        <div className={styles.priceRow}>
          <span>优惠券</span>
          <strong className={styles.discount}>
            {couponValue > 0 ? `-¥${couponValue.toFixed(2)}` : '无'}
          </strong>
        </div>
        <div className={`${styles.priceRow} ${styles.totalRow}`}>
          <span>实付金额</span>
          <strong className={styles.total}>
            <small>¥</small>
            {total.toFixed(2)}
          </strong>
        </div>
      </section>

      <footer className={styles.bottom}>
        <div>
          <div className={styles.bottomLabel}>合计</div>
          <div className={styles.bottomPrice}>
            <small>¥</small>
            {total.toFixed(2)}
          </div>
        </div>
        <button className={styles.payBtn} type="button" onClick={onSubmit} disabled={!canSubmit}>
          {submitting ? '提交中...' : '立即支付'}
        </button>
      </footer>
    </>
  );
}
