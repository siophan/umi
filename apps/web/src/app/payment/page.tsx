'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toEntityId, type CouponListItem, type EntityId, type UserAddressItem } from '@umi/shared';

import { fetchAddresses } from '../../lib/api/address';
import { fetchCoupons } from '../../lib/api/coupons';
import { createOrder } from '../../lib/api/orders';
import { fetchProductDetail } from '../../lib/api/products';
import styles from './page.module.css';

type PaymentProduct = {
  productId: string;
  cartItemId?: string;
  name: string;
  price: number;
  qty: number;
  orig: number;
  img: string;
};

function parseCouponCondition(condition: string) {
  const match = condition.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function getCouponDiscount(coupon: CouponListItem | null, subtotal: number) {
  if (!coupon || coupon.status !== 'unused') {
    return 0;
  }

  const threshold = parseCouponCondition(coupon.condition);
  if (threshold > 0 && subtotal < threshold) {
    return 0;
  }

  if (coupon.type === 'amount' || coupon.type === 'shipping') {
    return Math.min(subtotal, coupon.amount);
  }

  if (coupon.type === 'percent') {
    const rate = Math.max(0, Math.min(100, coupon.amount));
    return Number(((subtotal * (100 - rate)) / 100).toFixed(2));
  }

  return 0;
}

function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addresses, setAddresses] = useState<UserAddressItem[]>([]);
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [coupons, setCoupons] = useState<CouponListItem[]>([]);
  const [addressIndex, setAddressIndex] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [addrOpen, setAddrOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [invoiceOn, setInvoiceOn] = useState(false);
  const [pwd, setPwd] = useState('');
  const [remark, setRemark] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const from = searchParams.get('from');
        const [addressResult, couponResult] = await Promise.all([
          fetchAddresses().catch(() => []),
          fetchCoupons().catch(() => []),
        ]);

        if (ignore) {
          return;
        }

        setAddresses(addressResult);
        const defaultIndex = addressResult.findIndex((item) => item.isDefault);
        setAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
        setCoupons(couponResult.filter((item) => item.status === 'unused'));

        if (from === 'cart') {
          const raw = window.sessionStorage.getItem('payCartItems');
          if (!raw) {
            setProducts([]);
            return;
          }
          const parsed = JSON.parse(raw) as Array<{
            id?: string;
            cartItemId?: string;
            name?: string;
            price?: number;
            qty?: number;
            img?: string;
            orig?: number;
          }>;
          setProducts(
            parsed.map((item) => ({
              productId: item.id || '',
              cartItemId: item.cartItemId,
              name: item.name || '商品',
              price: Number(item.price) || 0,
              qty: Math.max(1, Number(item.qty) || 1),
              orig: Number(item.orig ?? item.price) || 0,
              img: item.img || '',
            })),
          );
          return;
        }

        const productId = searchParams.get('pid');
        if (!productId) {
          setProducts([]);
          return;
        }

        const detail = await fetchProductDetail(productId);
        if (ignore) {
          return;
        }
        setProducts([
          {
            productId: detail.product.id,
            name: detail.product.name,
            price: detail.product.price,
            qty: Math.max(1, Number(searchParams.get('qty') || 1) || 1),
            orig: detail.product.originalPrice,
            img: detail.product.img,
          },
        ]);
      } catch (error) {
        if (!ignore) {
          setProducts([]);
          setAddresses([]);
          setCoupons([]);
          setToast(error instanceof Error ? error.message : '订单信息加载失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedAddress = addresses[addressIndex] || null;
  const selectedCoupon = coupons.find((item) => item.id === couponId) || null;
  const subtotal = useMemo(
    () => products.reduce((sum, item) => sum + item.price * item.qty, 0),
    [products],
  );
  const couponValue = useMemo(
    () => getCouponDiscount(selectedCoupon, subtotal),
    [selectedCoupon, subtotal],
  );
  const total = useMemo(() => Math.max(0, subtotal - couponValue), [couponValue, subtotal]);
  const availableCoupons = useMemo(
    () => coupons.filter((item) => getCouponDiscount(item, subtotal) > 0),
    [coupons, subtotal],
  );

  async function submitOrder() {
    if (submitting) {
      return;
    }
    if (!selectedAddress) {
      setToast('请先选择收货地址');
      return;
    }
    if (!products.length) {
      setToast('没有可提交的商品');
      return;
    }

    const from = searchParams.get('from');
    const source = from === 'cart' ? 'cart' : 'product';
    const cartItemIds = products
      .map((item) => item.cartItemId)
      .filter((item): item is string => Boolean(item))
      .map((item) => toEntityId<EntityId>(item));

    if (source === 'cart' && cartItemIds.length !== products.length) {
      setToast('购物车商品信息已过期，请返回购物车重试');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        source,
        addressId: selectedAddress.id,
        couponId: selectedCoupon?.id || null,
        paymentMethod: method,
        note: remark.trim() || null,
        productId:
          source === 'product' && products[0]?.productId
            ? toEntityId(products[0].productId)
            : undefined,
        quantity: source === 'product' ? products[0]?.qty : undefined,
        cartItemIds: source === 'cart' ? cartItemIds : undefined,
      });

      if (source === 'cart') {
        window.sessionStorage.removeItem('payCartItems');
      }

      setCreatedOrderId(result.id);
      setPwdOpen(false);
      setSuccessOpen(true);
      setPwd('');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '下单失败');
      setPwd('');
      setPwdOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>确认订单</div>
        <div className={styles.secure}>
          <i className="fa-solid fa-shield-halved" /> 安全支付
        </div>
      </header>

      {!selectedAddress ? (
        <section className={`${styles.card} ${styles.addressCard}`}>
          <div className={styles.addrBar} />
          <button type="button" className={styles.addrRow} onClick={() => router.push('/address')}>
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
          <button type="button" className={styles.addrRow} onClick={() => setAddrOpen(true)}>
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
        {products.length === 1 && products[0] ? (
          <div className={styles.productPoster}>
            <img alt={products[0].name} src={products[0].img} />
            <span className={styles.productPosterTag}>真实商品</span>
          </div>
        ) : null}
        {products.map((item, index) => (
          <div className={styles.productRow} key={`${item.productId}-${index}`}>
            {index > 0 ? <div className={styles.divider} /> : null}
            <img alt={item.name} className={styles.productImg} src={item.img} />
            <div className={styles.productInfo}>
              <div className={styles.productName}>{item.name}</div>
              <div className={styles.productTags}>
                <span className={styles.tagBrand}>真实订单</span>
                <span className={styles.tag}>正品保障</span>
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
          <strong className={styles.detailValue}>普通快递</strong>
        </div>
        <div className={styles.detailRow}>
          <i className="fa-regular fa-clock" />
          <span className={styles.detailLabel}>预计送达</span>
          <strong className={`${styles.detailValue} ${styles.green}`}>支付后尽快发货</strong>
        </div>
        <div className={styles.detailRow}>
          <i className="fa-solid fa-box-open" />
          <span className={styles.detailLabel}>运费</span>
          <strong className={`${styles.detailValue} ${styles.green}`}>包邮</strong>
        </div>
      </section>

      <section className={styles.card}>
        <button className={styles.couponRow} type="button" onClick={() => setCouponOpen(true)}>
          <div className={styles.couponLeft}>
            <i className="fa-solid fa-ticket" />
            优惠券
            <span className={styles.couponBadge}>{availableCoupons.length}张可用</span>
          </div>
          <div className={styles.couponRight}>
            <span>{selectedCoupon ? `-¥ ${couponValue.toFixed(2)}` : '不使用'}</span>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-credit-card" /> 支付方式
        </div>
        <button type="button" className={`${styles.pm} ${method === 'wechat' ? styles.pmActive : ''}`} onClick={() => setMethod('wechat')}>
          <div className={styles.pmIcon} style={{ background: '#07C160' }}>
            <i className="fa-brands fa-weixin" />
          </div>
          <div className={styles.pmInfo}>
            <div className={styles.pmName}>微信支付</div>
            <div className={styles.pmDesc}>提交后直接落真实订单</div>
          </div>
          <div className={styles.pmCheck}>✓</div>
        </button>
        <button type="button" className={`${styles.pm} ${method === 'alipay' ? styles.pmActive : ''}`} onClick={() => setMethod('alipay')}>
          <div className={styles.pmIcon} style={{ background: '#1677ff' }}>
            <i className="fa-brands fa-alipay" />
          </div>
          <div className={styles.pmInfo}>
            <div className={styles.pmName}>支付宝</div>
            <div className={styles.pmDesc}>提交后直接落真实订单</div>
          </div>
          <div className={styles.pmCheck}>✓</div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-file-invoice" /> 发票信息
        </div>
        <button className={styles.detailRowButton} type="button" onClick={() => setInvoiceOn((value) => !value)}>
          <i className="fa-solid fa-receipt" />
          <span className={styles.detailLabel}>发票类型</span>
          <span className={`${styles.detailValue} ${styles.detailLink}`}>{invoiceOn ? '电子发票（个人）' : '不开发票'}</span>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-award" /> 服务保障
        </div>
        <div className={styles.services}>
          {['正品保障', '破损包赔', '7天无理由', '安全支付', '真实订单'].map((item) => (
            <div className={styles.serviceTag} key={item}>
              <i className="fa-solid fa-circle-check" />
              {item}
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
          onChange={(event) => setRemark(event.target.value)}
        />
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-receipt" /> 价格明细
        </div>
        <div className={styles.priceRow}>
          <span>商品金额</span>
          <strong>¥ {subtotal.toFixed(2)}</strong>
        </div>
        <div className={styles.priceRow}>
          <span>优惠金额</span>
          <strong className={styles.discount}>-¥ {couponValue.toFixed(2)}</strong>
        </div>
        <div className={styles.priceRow}>
          <span>运费</span>
          <strong className={styles.green}>包邮</strong>
        </div>
        <div className={`${styles.priceRow} ${styles.totalRow}`}>
          <span>实付金额</span>
          <strong className={styles.total}>¥ {total.toFixed(2)}</strong>
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
        <button className={styles.payBtn} type="button" onClick={() => setPwdOpen(true)} disabled={!products.length || !selectedAddress || submitting}>
          {submitting ? '提交中...' : '立即支付'}
        </button>
      </footer>

      {addrOpen ? (
        <div className={styles.overlay}>
          <div className={styles.sheetBg} onClick={() => setAddrOpen(false)} />
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>选择收货地址</div>
              <button type="button" className={styles.sheetClose} onClick={() => setAddrOpen(false)}>×</button>
            </div>
            <div className={styles.sheetList}>
              {addresses.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.addrItem} ${addressIndex === index ? styles.addrActive : ''}`}
                  onClick={() => {
                    setAddressIndex(index);
                    setAddrOpen(false);
                  }}
                >
                  <div className={styles.addrItemTop}>
                    <span>{item.name}</span>
                    <span>{item.phone}</span>
                    {item.tag ? <span className={styles.addrMiniTag}>{item.tag}</span> : null}
                  </div>
                  <div className={styles.addrItemDetail}>{item.province}{item.city}{item.district}{item.detail}</div>
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
          <div className={styles.sheetBg} onClick={() => setCouponOpen(false)} />
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>选择优惠券</div>
              <button type="button" className={styles.sheetClose} onClick={() => setCouponOpen(false)}>×</button>
            </div>
            <div className={styles.couponList}>
              {availableCoupons.map((item) => {
                const discount = getCouponDiscount(item, subtotal);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.couponItem} ${couponId === item.id ? styles.couponActive : ''}`}
                    onClick={() => {
                      setCouponId(item.id);
                      setCouponOpen(false);
                    }}
                  >
                    <div className={`${styles.couponFace} ${styles.red}`}>
                      <div className={styles.couponVal}>¥{discount.toFixed(2)}</div>
                      <div className={styles.couponSmall}>优惠券</div>
                    </div>
                    <div className={styles.couponInfo}>
                      <div className={styles.couponName}>{item.name}</div>
                      <div className={styles.couponCond}>{item.condition}</div>
                      <div className={styles.couponExp}>有效期至 {item.expireAt ? item.expireAt.slice(0, 10) : '长期有效'}</div>
                    </div>
                    <div className={styles.couponCheck}>{couponId === item.id ? '✓' : ''}</div>
                  </button>
                );
              })}
              {!availableCoupons.length ? <div className={styles.sheetNotUse}>当前暂无可用优惠券</div> : null}
            </div>
            <div className={styles.sheetNotUse} onClick={() => { setCouponId(null); setCouponOpen(false); }}>
              不使用优惠券
            </div>
          </div>
        </div>
      ) : null}

      {pwdOpen ? (
        <div className={styles.passwordOverlay}>
          <div className={styles.sheetBg} onClick={() => !submitting && setPwdOpen(false)} />
          <div className={styles.passwordSheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>请输入支付密码</div>
              <button type="button" className={styles.sheetClose} onClick={() => !submitting && setPwdOpen(false)}>×</button>
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
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => (
                <button
                  key={key || 'empty'}
                  type="button"
                  className={`${styles.key} ${key === '' ? styles.emptyKey : ''} ${key === '⌫' ? styles.delKey : ''}`}
                  onClick={() => {
                    if (submitting || key === '') return;
                    if (key === '⌫') {
                      setPwd((prev) => prev.slice(0, -1));
                      return;
                    }
                    const next = `${pwd}${key}`.slice(0, 6);
                    setPwd(next);
                    if (next.length === 6) {
                      void submitOrder();
                    }
                  }}
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
          <div className={styles.sheetBg} onClick={() => setSuccessOpen(false)} />
          <div className={styles.successCard}>
            <div className={styles.successIcon}>🎉</div>
            <div className={styles.successTitle}>支付成功</div>
            <div className={styles.successDesc}>真实订单已创建</div>
            <button
              type="button"
              className={styles.payBtn}
              onClick={() => router.push(createdOrderId ? `/order-detail?id=${encodeURIComponent(createdOrderId)}` : '/orders')}
            >
              查看订单
            </button>
          </div>
        </div>
      ) : null}

      {toast ? <div className={styles.successDesc} style={{ position: 'fixed', left: '50%', bottom: 110, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.78)', color: '#fff', padding: '8px 14px', borderRadius: 999, zIndex: 400 }}>{toast}</div> : null}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <PaymentPageInner />
    </Suspense>
  );
}
