'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

type OrderTab = 'all' | 'pending' | 'shipped' | 'done' | 'refund';

type OrderAction = {
  text: string;
  tone?: 'default' | 'primary' | 'accent';
};

type OrderItem = {
  name: string;
  spec: string;
  img: string;
  price: number | string;
  typeText: string;
  typeCls: 'type-guess' | 'type-buy' | 'type-prize';
};

type Order = {
  id: string;
  shop: string;
  shopIcon: string;
  status: Exclude<OrderTab, 'all'>;
  statusText: string;
  item: OrderItem;
  guessTitle?: string;
  express?: string;
  time: string;
  actions: OrderAction[];
};

const orders: Order[] = [
  {
    id: 'ord-001',
    shop: '优米旗舰店',
    shopIcon: 'fa-solid fa-store',
    status: 'pending',
    statusText: '待发货',
    guessTitle: '猜中「下午茶饮料」',
    item: {
      name: '奥利奥原味夹心饼干 67g*3',
      spec: '经典原味 / 3包装',
      img: '/legacy/images/products/p002-oreo.jpg',
      price: 0,
      typeText: '竞猜获奖',
      typeCls: 'type-prize',
    },
    time: '2026-04-16 18:42',
    actions: [{ text: '联系卖家' }, { text: '催发货', tone: 'primary' }],
  },
  {
    id: 'ord-002',
    shop: '优米旗舰店',
    shopIcon: 'fa-solid fa-store',
    status: 'pending',
    statusText: '待发货',
    item: {
      name: '三只松鼠坚果礼盒 520g',
      spec: '混合口味 / 礼盒装',
      img: '/legacy/images/products/p003-squirrels.jpg',
      price: 128,
      typeText: '直接购买',
      typeCls: 'type-buy',
    },
    time: '2026-04-15 12:18',
    actions: [{ text: '联系卖家' }, { text: '催发货', tone: 'primary' }],
  },
  {
    id: 'ord-003',
    shop: '零食研究所',
    shopIcon: 'fa-solid fa-bag-shopping',
    status: 'shipped',
    statusText: '已发货',
    item: {
      name: '百草味肉脯组合装 240g',
      spec: '香辣 / 独立小袋',
      img: '/legacy/images/products/p005-liangpin.jpg',
      price: 86,
      typeText: '直接购买',
      typeCls: 'type-buy',
    },
    express: '顺丰 SF1234567890 · 运输中',
    time: '2026-04-14 09:30',
    actions: [{ text: '查看物流' }, { text: '确认收货', tone: 'accent' }],
  },
  {
    id: 'ord-004',
    shop: '零食研究所',
    shopIcon: 'fa-solid fa-bag-shopping',
    status: 'shipped',
    statusText: '已发货',
    item: {
      name: '可口可乐零糖组合装 12瓶',
      spec: '330ml / 12瓶',
      img: '/legacy/images/products/p009-genki.jpg',
      price: 72,
      typeText: '竞猜获奖',
      typeCls: 'type-prize',
    },
    express: '中通 ZT87654321 · 派送中',
    time: '2026-04-13 21:05',
    actions: [{ text: '查看物流' }, { text: '确认收货', tone: 'accent' }],
  },
  {
    id: 'ord-005',
    shop: '优米旗舰店',
    shopIcon: 'fa-solid fa-store',
    status: 'done',
    statusText: '已完成',
    item: {
      name: '良品铺子海苔脆片礼盒',
      spec: '海盐 / 轻食礼盒',
      img: '/legacy/images/products/p005-liangpin.jpg',
      price: 58,
      typeText: '直接购买',
      typeCls: 'type-buy',
    },
    time: '2026-04-10 14:20',
    actions: [{ text: '再来一单' }, { text: '评价', tone: 'primary' }],
  },
  {
    id: 'ord-006',
    shop: '售后中心',
    shopIcon: 'fa-solid fa-rotate-left',
    status: 'refund',
    statusText: '退款成功',
    item: {
      name: '脆脆鲨巧克力威化 20条',
      spec: '整箱 / 家庭装',
      img: '/legacy/images/products/p007-dove.jpg',
      price: 49,
      typeText: '直接购买',
      typeCls: 'type-buy',
    },
    time: '2026-04-08 10:12',
    actions: [{ text: '查看详情' }],
  },
];

const emptyMap: Record<
  OrderTab,
  { icon: string; title: string; desc: string }
> = {
  all: { icon: 'fa-regular fa-rectangle-list', title: '暂无订单', desc: '去竞猜赢零食吧！' },
  pending: { icon: 'fa-solid fa-box', title: '暂无待发货订单', desc: '去竞猜赢零食吧！' },
  shipped: {
    icon: 'fa-solid fa-truck-fast',
    title: '暂无已发货订单',
    desc: '快去参与竞猜获得奖品！',
  },
  done: { icon: 'fa-solid fa-circle-check', title: '暂无已完成订单', desc: '快去参与竞猜获得奖品！' },
  refund: { icon: 'fa-solid fa-wallet', title: '暂无退款订单', desc: '一切顺利，继续保持！' },
};

function getOrderStatusClass(status: Order['status']) {
  switch (status) {
    case 'pending':
      return styles.statusPending;
    case 'shipped':
      return styles.statusShipped;
    case 'done':
      return styles.statusDone;
    case 'refund':
      return styles.statusRefund;
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<OrderTab>('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const total = orders.length;
  const guessWon = orders.filter(
    (order) =>
      order.item.typeCls === 'type-prize' ||
      order.id === 'ord-001' ||
      order.id === 'ord-004',
  ).length;
  const bought = orders.filter(
    (order) => order.item.typeCls === 'type-buy',
  ).length;
  const refunded = orders.filter((order) => order.status === 'refund').length;
  const filtered =
    tab === 'all' ? orders : orders.filter((order) => order.status === tab);

  const triggerToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  const handleAction = (order: Order, action: OrderAction) => {
    const actionMap: Record<string, string> = {
      联系卖家: '正在接入客服...',
      催发货: '✅ 已提醒卖家尽快发货',
      查看物流: `📦 ${order.express || '物流信息加载中'}`,
      确认收货: '✅ 已确认收货，感谢购买！',
      再来一单: '正在跳转到商品页...',
      评价: '📝 评价功能即将上线',
      查看详情: '正在打开售后详情...',
    };

    triggerToast(actionMap[action.text] || action.text);
  };

  return (
    <MobileShell tab="orders">
      <div className={styles.page}>
        <header className={styles.header}>
          <button
            className={styles.back}
            type="button"
            onClick={() => router.back()}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <h1 className={styles.title}>我的订单</h1>
          <div className={styles.headerSpacer} />
        </header>

        <section className={styles.stats}>
          <div className={`${styles.stat} ${styles.summaryAll}`}>
            <strong>{total}</strong>
            <span>全部订单</span>
          </div>
          <div className={`${styles.stat} ${styles.summaryPrize}`}>
            <strong className={styles.statAccent}>{guessWon}</strong>
            <span>竞猜获奖</span>
          </div>
          <div className={`${styles.stat} ${styles.summaryBuy}`}>
            <strong>{bought}</strong>
            <span>直接购买</span>
          </div>
          <div className={`${styles.stat} ${styles.summaryRevenue}`}>
            <strong>¥1,680</strong>
            <span>累计消费</span>
          </div>
        </section>

        <section className={styles.tabs}>
          {(['all', 'pending', 'shipped', 'done', 'refund'] as OrderTab[]).map(
            (value) => {
              const badge =
                value === 'pending' ? 3 : value === 'shipped' ? 2 : 0;
              return (
                <button
                  key={value}
                  className={`${styles.tab} ${tab === value ? styles.active : ''}`}
                  type="button"
                  onClick={() => setTab(value)}
                >
                  {value === 'all'
                    ? '全部'
                    : value === 'pending'
                      ? '待发货'
                      : value === 'shipped'
                        ? '已发货'
                        : value === 'done'
                          ? '已完成'
                          : '退款'}
                  {badge > 0 ? (
                    <span className={styles.badge}>{badge}</span>
                  ) : null}
                </button>
              );
            },
          )}
        </section>

        <main className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <i className={emptyMap[tab].icon} />
              </div>
              <div className={styles.emptyTitle}>{emptyMap[tab].title}</div>
              <div className={styles.emptyDesc}>{emptyMap[tab].desc}</div>
              <button
                className={styles.emptyBtn}
                type="button"
                onClick={() => triggerToast('去竞猜看看')}
              >
                去竞猜
              </button>
            </div>
          ) : (
            filtered.map((order, index) => (
              <article
                key={order.id}
                className={styles.card}
                style={{ animationDelay: `${Math.min(index * 0.04, 0.24)}s` }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.shopName}>
                    <span className={styles.shopIcon}>
                      <i className={order.shopIcon} />
                    </span>
                    {order.shop}
                  </div>
                  <span
                    className={`${styles.status} ${getOrderStatusClass(order.status)}`}
                  >
                    {order.statusText}
                  </span>
                </div>

                {order.guessTitle ? (
                  <div className={styles.guessTitle}>
                    <span>
                      <i className="fa-solid fa-trophy" />
                    </span>
                    {order.guessTitle}
                  </div>
                ) : null}

                <button
                  type="button"
                  className={styles.item}
                  onClick={() => triggerToast(`查看订单 ${order.id}`)}
                >
                  <img
                    className={styles.itemImg}
                    src={order.item.img}
                    alt={order.item.name}
                  />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{order.item.name}</div>
                    <div className={styles.itemSpec}>{order.item.spec}</div>
                    <div className={styles.itemBottom}>
                      <span
                        className={`${styles.type} ${styles[order.item.typeCls]}`}
                      >
                        {order.item.typeText}
                      </span>
                      <span
                        className={`${styles.price} ${order.item.price === 0 ? styles.free : ''}`}
                      >
                        {order.item.price === 0 ? (
                          <>
                            <i className="fa-solid fa-gift" /> 免费
                          </>
                        ) : (
                          <>
                            <small>¥</small>
                            {typeof order.item.price === 'number'
                              ? order.item.price
                              : order.item.price}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </button>

                {order.express ? (
                  <div className={styles.express}>
                    <span className={styles.expressIcon}>
                      <i className="fa-solid fa-arrow-right-long" />
                    </span>
                    <span className={styles.expressText}>{order.express}</span>
                  </div>
                ) : null}

                <div className={styles.footer}>
                  <span className={styles.time}>{order.time}</span>
                  <div className={styles.actions}>
                    {order.actions.map((action) => (
                      <button
                        key={action.text}
                        type="button"
                        className={`${styles.btn} ${action.tone === 'primary' ? styles.primary : ''} ${action.tone === 'accent' ? styles.btnAccent : ''}`}
                        onClick={() => handleAction(order, action)}
                      >
                        {action.text}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </main>

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </div>
    </MobileShell>
  );
}
