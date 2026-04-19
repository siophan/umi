'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type OrderStatus = 'pending' | 'shipped' | 'done' | 'refund';
type TimelineStep = {
  text: string;
  time: string;
  done: boolean;
  active: boolean;
  detail?: string;
};

const initialOrder = {
  id: 'OD20260416001',
  status: 'shipped' as OrderStatus,
  statusText: '已发货',
  statusDesc: '包裹正在运送中',
  icon: '🚚',
  bannerClass: 'shipped',
  shopName: '乐事官方旗舰店',
  product: {
    name: '奥利奥原味夹心饼干 67g*3',
    spec: '经典原味 / 3包装',
    price: 0,
    originalPrice: 26.8,
    quantity: 1,
    img: '/legacy/images/products/p002-oreo.jpg',
    type: 'prize',
    typeText: '🎯 竞猜获奖',
  },
  guessTitle: '世界杯冠军竞猜',
  guessId: 'g001',
  address: {
    name: '零食猎人',
    phone: '138****1808',
    detail: '上海市浦东新区张江高科技园区 88 号 3 栋 1202 室',
    tag: '默认',
  },
  express: {
    company: '顺丰速运',
    no: 'SF1234567890',
    phone: '95338',
    logs: [
      { text: '快递员正在派送中，请保持电话畅通', time: '预计今天 12:00 前送达', active: true },
      { text: '快件到达上海浦东分拨中心', time: '2026-04-16 21:36', done: true },
      { text: '快件已从华东转运中心发出', time: '2026-04-16 23:10', done: true },
    ],
  },
  priceRows: [
    { label: '商品金额', value: '¥26.80' },
    { label: '竞猜减免', value: '-¥26.80', discount: true },
    { label: '运费', value: '包邮', free: true },
    { label: '支付方式', value: '🎯 竞猜获奖(免费)' },
  ],
  coupon: {
    amount: 26.8,
    cond: '满29元可用',
    tag: '竞猜补偿券',
  },
  infoRows: [
    { label: '订单编号', value: 'OD20260416001', copy: true },
    { label: '下单时间', value: '2026-04-16 18:42' },
    { label: '支付时间', value: '2026-04-16 18:42' },
    { label: '发货时间', value: '2026-04-16 20:15' },
  ],
  refundInfo: {
    reason: '商品缺货，系统自动取消',
    amount: '¥26.80',
    status: '退款完成',
  },
};

const shippedTimeline: TimelineStep[] = [
  { text: '订单已创建', time: '2026-04-16 18:42', done: true, active: false, detail: '' },
  { text: '支付成功', time: '2026-04-16 18:42', done: true, active: false, detail: '' },
  { text: '商家发货', time: '2026-04-16 20:15', done: true, active: true, detail: '' },
  { text: '确认收货', time: '', done: false, active: false, detail: '' },
  { text: '交易完成', time: '', done: false, active: false, detail: '' },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [toast, setToast] = useState('');
  const [logisticsOpen, setLogisticsOpen] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const total = order.product.price === 0 ? '🎁 免费' : `¥${order.product.price.toFixed(2)}`;
  const timeline: TimelineStep[] = order.status === 'done'
    ? [
        { text: '订单已创建', time: '2026-04-16 18:42', done: true, active: false, detail: '' },
        { text: '支付成功', time: '2026-04-16 18:42', done: true, active: false, detail: '' },
        { text: '商家发货', time: '2026-04-16 20:15', done: true, active: false, detail: '' },
        { text: '确认收货', time: '2026-04-17 11:18', done: true, active: false, detail: '' },
        { text: '交易完成', time: '2026-04-17 11:18', done: true, active: true, detail: '' },
      ]
    : shippedTimeline;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => router.back()}
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.title}>订单详情</div>
        <div className={styles.headerRight}>
          <button
            className={styles.headerBtn}
            type="button"
            onClick={() => showToast('客服')}
          >
            <i className="fa-solid fa-headset" />
          </button>
          <button
            className={styles.headerBtn}
            type="button"
            onClick={() => showToast('更多操作')}
          >
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
      </header>

      <section className={`${styles.banner} ${styles[order.bannerClass]}`}>
        <div className={styles.bannerMain}>
          <div className={styles.bannerIcon}>
            <i className="fa-solid fa-truck-fast" />
          </div>
          <div>
            <div className={styles.bannerTitle}>{order.statusText}</div>
            <div className={styles.bannerDesc}>{order.statusDesc}</div>
          </div>
        </div>
        <div className={styles.bannerBg}>
          <i className="fa-solid fa-truck-fast" />
        </div>
      </section>

      <section className={styles.timelineCard}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-route" />
          订单进度
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
          <i className="fa-solid fa-truck-fast" />
          物流信息
        </div>
        <button
          className={styles.express}
          type="button"
          onClick={() => setLogisticsOpen(true)}
        >
          <div className={styles.expressIcon}>
            <i className="fa-solid fa-truck-fast" />
          </div>
          <div className={styles.expressInfo}>
            <div className={styles.expressCompany}>
              {order.express.company} <span>{order.express.no}</span>
            </div>
            <div className={styles.expressStatus}>
              <i className="fa-solid fa-circle" />
              {order.express.logs[0]?.text}
            </div>
            <div className={styles.expressNo}>客服电话: {order.express.phone}</div>
          </div>
          <div className={styles.expressArrow}>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-location-dot" />
          收货地址
        </div>
        <div className={styles.address}>
          <div className={styles.addressIcon}>
            <i className="fa-solid fa-location-dot" />
          </div>
          <div className={styles.addressInfo}>
            <div className={styles.addressName}>
              {order.address.name}
              <span>{order.address.phone}</span>
              <span className={styles.addressTag}>{order.address.tag}</span>
            </div>
            <div className={styles.addressDetail}>{order.address.detail}</div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <button
          className={styles.shopRow}
          type="button"
          onClick={() => showToast('进入店铺')}
        >
          <div className={styles.shopIcon}>
            <i className="fa-solid fa-crown" />
          </div>
          <div className={styles.shopName}>{order.shopName}</div>
          <div className={styles.arrow}>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>

        <div className={styles.product}>
          <img alt={order.product.name} src={order.product.img} />
          <div className={styles.productInfo}>
            <div className={styles.productName}>{order.product.name}</div>
            <div className={styles.productSpec}>{order.product.spec}</div>
            <div className={styles.productBottom}>
              <span className={styles.productType}>{order.product.typeText}</span>
              <span
                className={`${styles.productPrice} ${order.product.price === 0 ? styles.free : ''}`}
              >
                {order.product.price === 0
                  ? '🎁 免费'
                  : (
                    <>
                      <small>¥</small>
                      {order.product.price.toFixed(1)}
                    </>
                  )}
              </span>
            </div>
          </div>
        </div>

        <button
          className={styles.guessInfo}
          type="button"
          onClick={() => router.push(`/guess/${order.guessId}`)}
        >
          <div className={styles.guessIcon}>🎯</div>
          <div className={styles.guessText}>
            <div className={styles.guessLabel}>关联竞猜</div>
            <div className={styles.guessTitle}>{order.guessTitle}</div>
          </div>
          <div className={styles.guessArrow}>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-receipt" />
          价格明细
        </div>
        {order.coupon ? (
          <div className={styles.couponCard}>
            <div className={styles.couponIcon}>🎫</div>
            <div className={styles.couponInfo}>
              <div className={styles.couponAmount}>¥{order.coupon.amount.toFixed(1)}</div>
              <div className={styles.couponCond}>{order.coupon.cond}</div>
            </div>
            <div className={styles.couponTag}>{order.coupon.tag}</div>
          </div>
        ) : null}
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
          <span>实付款：</span>
          <strong>{total}</strong>
        </div>
      </section>

      {order.status === 'refund' ? (
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-rotate-left" />
            退款详情
          </div>
          <div className={styles.refundInfo}>
            <div className={styles.refundRow}>
              <span className={styles.refundLabel}>退款原因</span>
              <span className={styles.refundValue}>{order.refundInfo.reason}</span>
            </div>
            <div className={styles.refundRow}>
              <span className={styles.refundLabel}>退款金额</span>
              <span className={styles.refundValue}>{order.refundInfo.amount}</span>
            </div>
            <div className={styles.refundRow}>
              <span className={styles.refundLabel}>退款状态</span>
              <span className={styles.refundValue}>{order.refundInfo.status}</span>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-file-lines" />
          订单信息
        </div>
        {order.infoRows.map((row) => (
          <div key={row.label} className={styles.infoRow}>
            <span className={styles.infoLabel}>{row.label}</span>
            <span
              className={`${styles.infoValue} ${row.copy ? styles.copy : ''}`}
              onClick={() => row.copy && showToast(`✅ 已复制: ${row.value}`)}
            >
              {row.value}
              {row.copy ? <i className="fa-regular fa-copy" /> : null}
            </span>
          </div>
        ))}
      </section>

      {order.status === 'done' ? (
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-star" />
            商品评价
          </div>
          <button className={styles.rating} type="button" onClick={() => showToast('📝 评价功能即将上线')}>
            <div className={styles.ratingStars}>
              <i className="fa-regular fa-star" />
              <i className="fa-regular fa-star" />
              <i className="fa-regular fa-star" />
              <i className="fa-regular fa-star" />
              <i className="fa-regular fa-star" />
            </div>
            <div className={styles.ratingText}>去评价，赢积分</div>
            <div className={styles.ratingArrow}>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        </section>
      ) : null}

      <footer className={styles.bottom}>
        <div className={styles.bottomLeft}>
          <button
            className={styles.bottomIcon}
            type="button"
            onClick={() => showToast('联系客服')}
          >
            <i className="fa-solid fa-headset" />
            <span>客服</span>
          </button>
          <button
            className={styles.bottomIcon}
            type="button"
            onClick={() => showToast('进入店铺')}
          >
            <i className="fa-solid fa-store" />
            <span>店铺</span>
          </button>
        </div>
        <button
          className={styles.btnOutline}
          type="button"
          onClick={() => {
            if (order.status === 'shipped') {
              setLogisticsOpen(true);
              return;
            }
            if (order.status === 'done' || order.status === 'refund') {
              showToast('正在跳转...');
              return;
            }
            showToast('取消订单申请已提交');
          }}
        >
          {order.status === 'shipped'
            ? '查看物流'
            : order.status === 'done' || order.status === 'refund'
              ? '再来一单'
              : '取消订单'}
        </button>
        {order.status !== 'refund' ? (
          <button
            className={styles.btnPrimary}
            type="button"
            onClick={() => {
              if (order.status === 'done') {
                showToast('📝 评价功能即将上线');
                return;
              }
              if (order.status === 'shipped') {
                setOrder((current) => ({
                  ...current,
                  status: 'done',
                  statusText: '已完成',
                  statusDesc: '交易完成，感谢您的购买',
                  bannerClass: 'done',
                  infoRows: [
                    ...current.infoRows,
                    { label: '完成时间', value: '2026-04-17 11:18' },
                  ],
                }));
                showToast('✅ 已确认收货');
                return;
              }
              showToast('✅ 已提醒卖家尽快发货');
            }}
          >
            {order.status === 'shipped' ? '确认收货' : order.status === 'done' ? '评价' : '催发货'}
          </button>
        ) : null}
      </footer>

      {logisticsOpen ? (
        <div className={styles.modalOverlay} onClick={() => setLogisticsOpen(false)} role="presentation">
          <div className={styles.modal} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.modalHandle} />
            <div className={styles.modalTitle}>📦 物流详情</div>
            <div className={styles.logisticsHeader}>
              <div>
                <div className={styles.logisticsCompany}>{order.express.company}</div>
                <div className={styles.logisticsNo}>{order.express.no}</div>
              </div>
              <button type="button" className={styles.copyBtn} onClick={() => showToast(`✅ 已复制: ${order.express.no}`)}>
                <i className="fa-regular fa-copy" />
                复制
              </button>
            </div>
            {order.express.logs.map((log) => (
              <div key={`${log.text}-${log.time}`} className={styles.logisticsItem}>
                <div className={`${styles.logisticsDot} ${log.active ? styles.logisticsActive : styles.logisticsDone}`}>
                  <i className={`fa-solid ${log.active ? 'fa-location-dot' : 'fa-check'}`} />
                </div>
                <div>
                  <div className={styles.logisticsText}>{log.text}</div>
                  <div className={styles.logisticsTime}>{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}
