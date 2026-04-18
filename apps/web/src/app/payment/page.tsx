'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import styles from './page.module.css';

const addresses = [
  {
    name: '零食猎人',
    phone: '138****1808',
    detail: '上海市浦东新区张江高科技园区 88 号 3 栋 1202 室',
    tag: '默认地址',
  },
  {
    name: '阿根廷卫冕',
    phone: '136****7721',
    detail: '北京市朝阳区望京 SOHO 2 号楼 1503 室',
    tag: '公司',
  },
];

const products = [
  { name: '奥利奥原味夹心饼干 67g*3', price: 26.8, qty: 1, orig: 26.8, img: '/legacy/images/products/p002-oreo.jpg' },
  { name: '三只松鼠坚果礼盒 520g', price: 128, qty: 1, orig: 168, img: '/legacy/images/products/p003-squirrels.jpg' },
];

const coupons = [
  {
    id: 'c1',
    value: 5,
    name: '新人专享',
    cond: '满 29 可用',
    exp: '2026-04-30',
    tone: 'red',
  },
  {
    id: 'c2',
    value: 10,
    name: '店铺满减',
    cond: '满 59 可用',
    exp: '2026-04-30',
    tone: 'blue',
  },
  {
    id: 'c3',
    value: 20,
    name: '品牌大额',
    cond: '满 99 可用',
    exp: '2026-04-30',
    tone: 'green',
  },
];

const services = ['假一赔十', '破损包赔', '极速退款', '7 天无理由'];

export default function PaymentPage() {
  const router = useRouter();
  const [addressIndex, setAddressIndex] = useState(0);
  const [couponIndex, setCouponIndex] = useState(0);
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [addrOpen, setAddrOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [pwd, setPwd] = useState('');

  const couponValue = couponIndex >= 0 ? coupons[couponIndex]?.value || 0 : 0;
  const total = useMemo(
    () =>
      Math.max(
        products.reduce((sum, item) => sum + item.price * item.qty, 0) -
          couponValue,
        0,
      ),
    [couponValue],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => router.back()}
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>确认订单</div>
        <div className={styles.secure}>
          <i className="fa-solid fa-shield-halved" /> 安全支付
        </div>
      </header>

      <section className={`${styles.card} ${styles.addressCard}`}>
        <div className={styles.addrBar} />
        <button
          type="button"
          className={styles.addrRow}
          onClick={() => setAddrOpen(true)}
        >
          <div className={styles.addrIcon}>
            <i className="fa-solid fa-location-dot" />
          </div>
          <div className={styles.addrInfo}>
            <div className={styles.addrTop}>
              <div className={styles.addrName}>
                {addresses[addressIndex].name}
              </div>
              <div className={styles.addrPhone}>
                {addresses[addressIndex].phone}
              </div>
              <div className={styles.addrTag}>
                {addresses[addressIndex].tag}
              </div>
            </div>
            <div className={styles.addrDetail}>
              {addresses[addressIndex].detail}
            </div>
          </div>
          <div className={styles.arrow}>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-bag-shopping" /> 商品信息
        </div>
        {products.map((item, index) => (
          <div className={styles.productRow} key={item.name}>
            {index > 0 ? <div className={styles.divider} /> : null}
            <img
              alt={item.name}
              className={styles.productImg}
              src={item.img}
            />
            <div className={styles.productInfo}>
              <div className={styles.productName}>{item.name}</div>
              <div className={styles.productTags}>
                <span className={styles.tagBrand}>品牌授权</span>
                <span className={styles.tag}>正品保障</span>
              </div>
              <div className={styles.productBottom}>
                <div>
                  <span className={styles.price}>
                    ¥ {item.price.toFixed(2)}
                  </span>
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
        <div className={styles.row}>
          <span>配送方式</span>
          <strong>顺丰速运</strong>
        </div>
        <div className={styles.row}>
          <span>预计送达</span>
          <strong className={styles.green}>明天 12:00 前</strong>
        </div>
        <div className={styles.row}>
          <span>运费</span>
          <strong className={styles.green}>包邮</strong>
        </div>
        <div className={styles.row}>
          <span>运费险</span>
          <strong>已赠送</strong>
        </div>
      </section>

      <section className={styles.card}>
        <button
          className={styles.couponRow}
          type="button"
          onClick={() => setCouponOpen(true)}
        >
          <div className={styles.couponLeft}>
            <i className="fa-solid fa-ticket" />
            优惠券
            <span className={styles.couponBadge}>3张可用</span>
          </div>
          <div className={styles.couponRight}>
            <span>-¥ {couponValue.toFixed(2)}</span>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-credit-card" /> 支付方式
        </div>
        <button
          type="button"
          className={`${styles.pm} ${method === 'wechat' ? styles.pmActive : ''}`}
          onClick={() => setMethod('wechat')}
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
          onClick={() => setMethod('alipay')}
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
          <i className="fa-solid fa-award" /> 服务保障
        </div>
        <div className={styles.services}>
          {services.map((item) => (
            <div className={styles.serviceTag} key={item}>
              <i className="fa-solid fa-circle-check" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-receipt" /> 费用明细
        </div>
        <div className={styles.priceRow}>
          <span>商品金额</span>
          <strong>
            ¥{' '}
            {products
              .reduce((sum, item) => sum + item.price * item.qty, 0)
              .toFixed(2)}
          </strong>
        </div>
        <div className={styles.priceRow}>
          <span>优惠金额</span>
          <strong className={styles.discount}>
            -¥ {couponValue.toFixed(2)}
          </strong>
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
          <div className={styles.bottomLabel}>实付金额</div>
          <div className={styles.bottomPrice}>
            <small>¥</small>
            {total.toFixed(2)}
          </div>
        </div>
        <button
          className={styles.payBtn}
          type="button"
          onClick={() => setPwdOpen(true)}
        >
          立即支付
        </button>
      </footer>

      {addrOpen ? (
        <div className={styles.overlay}>
          <div className={styles.sheetBg} onClick={() => setAddrOpen(false)} />
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>选择收货地址</div>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setAddrOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.sheetList}>
              {addresses.map((item, index) => (
                <button
                  key={item.detail}
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
                    <span className={styles.addrMiniTag}>{item.tag}</span>
                  </div>
                  <div className={styles.addrItemDetail}>{item.detail}</div>
                  <div className={styles.addrItemCheck}>
                    {addressIndex === index ? '✓' : ''}
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.sheetAdd}>+ 新增收货地址</div>
          </div>
        </div>
      ) : null}

      {couponOpen ? (
        <div className={styles.overlay}>
          <div
            className={styles.sheetBg}
            onClick={() => setCouponOpen(false)}
          />
          <div className={styles.sheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>选择优惠券</div>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setCouponOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.couponList}>
              {coupons.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.couponItem} ${couponIndex === index ? styles.couponActive : ''}`}
                  onClick={() => {
                    setCouponIndex(index);
                    setCouponOpen(false);
                  }}
                >
                  <div className={`${styles.couponFace} ${styles[item.tone]}`}>
                    <div className={styles.couponVal}>¥{item.value}</div>
                    <div className={styles.couponSmall}>优惠券</div>
                  </div>
                  <div className={styles.couponInfo}>
                    <div className={styles.couponName}>{item.name}</div>
                    <div className={styles.couponCond}>{item.cond}</div>
                    <div className={styles.couponExp}>有效期至 {item.exp}</div>
                  </div>
                  <div className={styles.couponCheck}>
                    {couponIndex === index ? '✓' : ''}
                  </div>
                </button>
              ))}
            </div>
            <div
              className={styles.sheetNotUse}
              onClick={() => {
                setCouponIndex(-1);
                setCouponOpen(false);
              }}
            >
              不使用优惠券
            </div>
          </div>
        </div>
      ) : null}

      {pwdOpen ? (
        <div className={styles.passwordOverlay}>
          <div className={styles.sheetBg} onClick={() => setPwdOpen(false)} />
          <div className={styles.passwordSheet}>
            <div className={styles.sheetHead}>
              <div className={styles.sheetTitle}>请输入支付密码</div>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setPwdOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.payAmount}>
              <div className={styles.payAmountLabel}>支付金额</div>
              <div className={styles.payAmountValue}>¥ {total.toFixed(2)}</div>
            </div>
            <div className={styles.pwdDots}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`${styles.pwdDot} ${pwd[index] ? styles.filled : ''}`}
                >
                  {pwd[index] ? '•' : ''}
                </div>
              ))}
            </div>
            <div className={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
                (key) => (
                  <button
                    key={key || 'empty'}
                    type="button"
                    className={`${styles.key} ${key === '' ? styles.emptyKey : ''} ${key === '⌫' ? styles.delKey : ''}`}
                    onClick={() => {
                      if (key === '') return;
                      if (key === '⌫') {
                        setPwd((prev) => prev.slice(0, -1));
                        return;
                      }
                      const next = `${pwd}${key}`.slice(0, 6);
                      setPwd(next);
                      if (next.length === 6) {
                        setPwdOpen(false);
                        setSuccessOpen(true);
                      }
                    }}
                  >
                    {key}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className={styles.successOverlay}>
          <div
            className={styles.sheetBg}
            onClick={() => setSuccessOpen(false)}
          />
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.successTitle}>支付成功</div>
            <div className={styles.successDesc}>
              订单已创建，等待开奖结果。猜中后将自动发货。
            </div>
            <button
              type="button"
              className={styles.payBtn}
              onClick={() => setSuccessOpen(false)}
            >
              完成
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
