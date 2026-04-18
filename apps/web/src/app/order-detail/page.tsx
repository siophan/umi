'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

type OrderStatus = 'pending' | 'shipped' | 'done' | 'refund';

const order = {
  id: 'OD20260416001',
  status: 'shipped' as OrderStatus,
  statusText: '已发货',
  statusDesc: '商品已交由顺丰速运，正在送往你的地址',
  icon: '🚚',
  bannerClass: 'shipped',
  shopName: '优米旗舰店',
  product: {
    name: '奥利奥原味夹心饼干 67g*3',
    spec: '经典原味 / 3包装',
    price: 0,
    img: '/legacy/images/product/p001.jpg',
    type: '竞猜获奖',
  },
  guessTitle: '世界杯冠军竞猜',
  address: {
    name: '零食猎人',
    phone: '138****1808',
    detail: '上海市浦东新区张江高科技园区 88 号 3 栋 1202 室',
    tag: '默认',
  },
  express: {
    company: '顺丰速运',
    no: 'SF1234567890',
    status: '运输中',
  },
  priceRows: [
    { label: '商品金额', value: '¥26.80' },
    { label: '优惠金额', value: '-¥26.80', discount: true },
    { label: '运费', value: '包邮', free: true },
  ],
  infoRows: [
    { label: '订单编号', value: 'OD20260416001', copy: true },
    { label: '下单时间', value: '2026-04-16 18:42' },
    { label: '付款方式', value: '竞猜获奖自动发货' },
  ],
};

const timeline = [
  { text: '订单已创建', time: '2026-04-16 18:42', done: true, active: false },
  { text: '商品已出库', time: '2026-04-16 19:02', done: true, active: false },
  {
    text: '物流揽收',
    time: '2026-04-16 20:15',
    done: true,
    active: true,
    detail: '顺丰已完成首站扫描',
  },
  {
    text: '正在配送',
    time: '预计明天 12:00 前',
    done: false,
    active: false,
    detail: '快递员正在派送中',
  },
];

export default function OrderDetailPage() {
  const [toast, setToast] = useState('');

  const total = useMemo(() => '¥0.00', []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => window.history.back()}
        >
          ‹
        </button>
        <div className={styles.title}>订单详情</div>
        <div className={styles.headerRight}>
          <button
            className={styles.headerBtn}
            type="button"
            onClick={() => showToast('分享订单')}
          >
            ↗
          </button>
          <button
            className={styles.headerBtn}
            type="button"
            onClick={() => showToast('联系客服')}
          >
            ☎
          </button>
        </div>
      </header>

      <section className={`${styles.banner} ${styles[order.bannerClass]}`}>
        <div className={styles.bannerMain}>
          <div className={styles.bannerIcon}>{order.icon}</div>
          <div>
            <div className={styles.bannerTitle}>{order.statusText}</div>
            <div className={styles.bannerDesc}>{order.statusDesc}</div>
          </div>
        </div>
        <div className={styles.bannerBg}>{order.icon}</div>
      </section>

      <section className={styles.timelineCard}>
        <div className={styles.cardTitle}>
          <span>◉</span>
          物流进度
        </div>
        <div className={styles.timeline}>
          {timeline.map((item) => (
            <div
              key={item.text}
              className={`${styles.timelineItem} ${item.done ? styles.done : ''} ${item.active ? styles.active : ''}`}
            >
              <div className={styles.dot}>
                <span>•</span>
              </div>
              <div className={styles.timelineText}>{item.text}</div>
              <div className={styles.timelineTime}>{item.time}</div>
              {item.detail ? (
                <div className={styles.timelineDetail}>{item.detail}</div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <span>◉</span>
          商家信息
        </div>
        <button
          className={styles.shopRow}
          type="button"
          onClick={() => showToast('进入店铺')}
        >
          <div className={styles.shopIcon}>店</div>
          <div className={styles.shopName}>{order.shopName}</div>
          <div className={styles.arrow}>›</div>
        </button>

        <div className={styles.product}>
          <img alt={order.product.name} src={order.product.img} />
          <div className={styles.productInfo}>
            <div className={styles.productName}>{order.product.name}</div>
            <div className={styles.productSpec}>{order.product.spec}</div>
            <div className={styles.productBottom}>
              <span className={styles.productType}>{order.product.type}</span>
              <span
                className={`${styles.productPrice} ${order.product.price === 0 ? styles.free : ''}`}
              >
                {order.product.price === 0
                  ? '🎁 免费'
                  : `¥${order.product.price.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <button
          className={styles.guessInfo}
          type="button"
          onClick={() => showToast(order.guessTitle)}
        >
          <div className={styles.guessIcon}>🎯</div>
          <div className={styles.guessText}>
            <div className={styles.guessLabel}>关联竞猜</div>
            <div className={styles.guessTitle}>{order.guessTitle}</div>
          </div>
          <div className={styles.guessArrow}>›</div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <span>◉</span>
          收货信息
        </div>
        <div className={styles.address}>
          <div className={styles.addressIcon}>⌂</div>
          <div className={styles.addressInfo}>
            <div className={styles.addressName}>
              {order.address.name}
              <span>{order.address.phone}</span>
              <span className={styles.addressTag}>{order.address.tag}</span>
            </div>
            <div className={styles.addressDetail}>{order.address.detail}</div>
          </div>
        </div>

        <button
          className={styles.express}
          type="button"
          onClick={() => showToast('查看物流详情')}
        >
          <div className={styles.expressIcon}>⇢</div>
          <div className={styles.expressInfo}>
            <div className={styles.expressCompany}>{order.express.company}</div>
            <div className={styles.expressNo}>{order.express.no}</div>
            <div className={styles.expressStatus}>{order.express.status}</div>
          </div>
          <div className={styles.expressArrow}>›</div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <span>◉</span>
          订单金额
        </div>
        {order.priceRows.map((row) => (
          <div key={row.label} className={styles.priceRow}>
            <span className={styles.priceLabel}>{row.label}</span>
            <span
              className={`${styles.priceValue} ${row.discount ? styles.discount : ''} ${row.free ? styles.freeValue : ''}`}
            >
              {row.value}
            </span>
          </div>
        ))}
        <div className={styles.priceTotal}>
          <span>实付金额</span>
          <strong>{total}</strong>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <span>◉</span>
          订单信息
        </div>
        {order.infoRows.map((row) => (
          <div key={row.label} className={styles.infoRow}>
            <span className={styles.infoLabel}>{row.label}</span>
            <span
              className={`${styles.infoValue} ${row.copy ? styles.copy : ''}`}
              onClick={() => row.copy && showToast('已复制订单编号')}
            >
              {row.value}
            </span>
          </div>
        ))}
      </section>

      <footer className={styles.bottom}>
        <button
          className={styles.btnOutline}
          type="button"
          onClick={() => showToast('联系卖家')}
        >
          联系卖家
        </button>
        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => showToast('确认收货')}
        >
          确认收货
        </button>
      </footer>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}
