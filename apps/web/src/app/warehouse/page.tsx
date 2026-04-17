'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

type WarehouseTab = 'all' | 'pending' | 'shipped' | 'delivered' | 'consigning';

type WarehouseItem = {
  id: string;
  product: string;
  img: string;
  quantity: number;
  price: number;
  source: string;
  date: string;
  status: Exclude<WarehouseTab, 'all'>;
  consignPrice?: number;
  estimateDays?: number;
};

const warehouseItems: WarehouseItem[] = [
  {
    id: 'wh-001',
    product: '奥利奥原味夹心饼干',
    img: 'https://picsum.photos/seed/wh-oreo/300/300',
    quantity: 2,
    price: 28,
    source: '竞猜奖励',
    date: '2026-04-16',
    status: 'pending',
  },
  {
    id: 'wh-002',
    product: '三只松鼠坚果礼盒',
    img: 'https://picsum.photos/seed/wh-nuts/300/300',
    quantity: 1,
    price: 128,
    source: '直接购买',
    date: '2026-04-15',
    status: 'pending',
  },
  {
    id: 'wh-003',
    product: '百草味肉脯组合装',
    img: 'https://picsum.photos/seed/wh-meat/300/300',
    quantity: 1,
    price: 86,
    source: '商家发货',
    date: '2026-04-14',
    status: 'shipped',
  },
  {
    id: 'wh-004',
    product: '可口可乐零糖组合装',
    img: 'https://picsum.photos/seed/wh-cola/300/300',
    quantity: 3,
    price: 72,
    source: '竞猜奖励',
    date: '2026-04-13',
    status: 'delivered',
  },
  {
    id: 'wh-005',
    product: '脆脆鲨巧克力威化',
    img: 'https://picsum.photos/seed/wh-wafer/300/300',
    quantity: 1,
    price: 49,
    source: '寄售中',
    date: '2026-04-12',
    status: 'consigning',
    consignPrice: 42.8,
    estimateDays: 2,
  },
  {
    id: 'wh-006',
    product: '良品铺子海苔脆片礼盒',
    img: 'https://picsum.photos/seed/wh-snack/300/300',
    quantity: 1,
    price: 58,
    source: '仓库调入',
    date: '2026-04-11',
    status: 'delivered',
  },
];

const statusMeta: Record<
  Exclude<WarehouseTab, 'all'>,
  [string, string, string]
> = {
  pending: ['待提货', 's-pending', '◷'],
  shipped: ['运输中', 's-shipped', '➜'],
  delivered: ['已签收', 's-delivered', '✓'],
  consigning: ['寄售中', 's-consigning', '✦'],
};

const emptyMap: Record<
  WarehouseTab,
  { icon: string; title: string; desc: string }
> = {
  all: { icon: '📦', title: '暂无商品', desc: '快去参与竞猜获得奖品！' },
  pending: {
    icon: '📦',
    title: '暂无待提货商品',
    desc: '快去参与竞猜获得奖品！',
  },
  shipped: {
    icon: '🚚',
    title: '暂无运输中商品',
    desc: '货品出发后这里会显示物流状态。',
  },
  delivered: {
    icon: '📥',
    title: '暂无已签收商品',
    desc: '签收完成后会进入这里。',
  },
  consigning: {
    icon: '🏷️',
    title: '暂无寄售中商品',
    desc: '把仓库好物挂出来试试。',
  },
};

function getWarehouseStatusClass(status: Exclude<WarehouseTab, 'all'>) {
  switch (status) {
    case 'pending':
      return styles.statusPending;
    case 'shipped':
      return styles.statusShipped;
    case 'delivered':
      return styles.statusDelivered;
    case 'consigning':
      return styles.statusConsigning;
  }
}

export default function WarehousePage() {
  const [tab, setTab] = useState<WarehouseTab>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [sellItem, setSellItem] = useState<WarehouseItem | null>(null);
  const [sellPrice, setSellPrice] = useState('0');
  const [sellQty, setSellQty] = useState('1');
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const counts = useMemo(
    () =>
      warehouseItems.reduce(
        (acc, item) => {
          acc[item.status] += item.quantity;
          acc.totalValue += item.price * item.quantity;
          return acc;
        },
        { pending: 0, shipped: 0, delivered: 0, consigning: 0, totalValue: 0 },
      ),
    [],
  );

  const filtered =
    tab === 'all'
      ? warehouseItems
      : warehouseItems.filter((item) => item.status === tab);

  const triggerToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  const openSell = (item: WarehouseItem) => {
    setSellItem(item);
    setSellPrice(String(Math.round(item.price * 0.85 * 10) / 10));
    setSellQty('1');
  };

  const closeSell = () => setSellItem(null);

  const submitSell = () => {
    if (!sellItem) return;
    triggerToast(`🏷️ 已寄售 ${sellItem.product} ×${sellQty}`);
    closeSell();
  };

  const priceValue = sellItem ? Number.parseFloat(sellPrice) || 0 : 0;
  const sellRatio =
    sellItem && priceValue > 0 ? priceValue / sellItem.price : 0;
  const estimate = (() => {
    if (!sellItem || !priceValue) return null;
    if (sellRatio <= 0.7)
      return {
        title: '1-1 日内出售成功',
        desc: '低于市场价30%+，极速出售',
        level: 3,
      };
    if (sellRatio <= 0.85)
      return {
        title: '1-2 日内出售成功',
        desc: '价格极具竞争力，市场需求旺盛',
        level: 3,
      };
    if (sellRatio <= 0.95)
      return {
        title: '1-3 日内出售成功',
        desc: '价格合理，预计较快出售',
        level: 2,
      };
    if (sellRatio <= 1.05)
      return {
        title: '预计 5 日内出售',
        desc: '接近市场价，需要一定等待时间',
        level: 1,
      };
    return {
      title: '预计 7 日内出售',
      desc: '高于市场价，出售可能较慢',
      level: 0,
    };
  })();

  return (
    <MobileShell tab="warehouse">
      <div className={styles.page}>
        <header className={styles.header}>
          <button
            className={styles.back}
            type="button"
            onClick={() => window.history.back()}
          >
            ‹
          </button>
          <h1 className={styles.title}>我的仓库</h1>
          <button
            className={styles.action}
            type="button"
            onClick={() => triggerToast('批量操作')}
          >
            ☰
          </button>
        </header>

        <section className={styles.summary}>
          <div className={styles.grid}>
            <button
              className={`${styles.summaryCard} ${styles.summaryPending}`}
              type="button"
              onClick={() => setTab('pending')}
            >
              <strong>{counts.pending}</strong>
              <span>待提货</span>
            </button>
            <button
              className={`${styles.summaryCard} ${styles.summaryShipped}`}
              type="button"
              onClick={() => setTab('shipped')}
            >
              <strong>{counts.shipped}</strong>
              <span>运输中</span>
            </button>
            <button
              className={`${styles.summaryCard} ${styles.summaryDelivered}`}
              type="button"
              onClick={() => setTab('delivered')}
            >
              <strong>{counts.delivered}</strong>
              <span>已签收</span>
            </button>
            <button
              className={`${styles.summaryCard} ${styles.summaryConsigning}`}
              type="button"
              onClick={() => setTab('consigning')}
            >
              <strong>{counts.consigning}</strong>
              <span>寄售中</span>
            </button>
          </div>
          <div className={styles.totalBar}>
            <div className={styles.totalLabel}>
              <span className={styles.totalIcon}>◌</span>
              物资总值
            </div>
            <div className={styles.totalValue}>
              <small>¥</small>
              {counts.totalValue.toFixed(1)}
            </div>
          </div>
        </section>

        <section className={styles.tabs}>
          {(
            [
              'all',
              'pending',
              'shipped',
              'delivered',
              'consigning',
            ] as WarehouseTab[]
          ).map((value) => {
            const badge = value === 'all' ? 0 : counts[value];
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
                    ? '待提货'
                    : value === 'shipped'
                      ? '运输中'
                      : value === 'delivered'
                        ? '已签收'
                        : '寄售中'}
                {badge > 0 ? (
                  <span className={styles.badge}>{badge}</span>
                ) : null}
              </button>
            );
          })}
        </section>

        <main className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>{emptyMap[tab].icon}</div>
              <div className={styles.emptyText}>{emptyMap[tab].title}</div>
              <div className={styles.emptyDesc}>{emptyMap[tab].desc}</div>
            </div>
          ) : (
            filtered.map((item, index) => {
              const meta = statusMeta[item.status];
              return (
                <article
                  key={item.id}
                  className={styles.card}
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
                >
                  <img
                    className={styles.img}
                    src={item.img}
                    alt={item.product}
                  />
                  <div className={styles.body}>
                    <div className={styles.name}>{item.product}</div>
                    <div className={styles.meta}>
                      <span>×{item.quantity}</span>
                      <span className={styles.sep}>|</span>
                      <span>{item.source}</span>
                      <span className={styles.sep}>|</span>
                      <span>{item.date}</span>
                    </div>
                    <div className={styles.price}>
                      <small>¥</small>
                      {(
                        Math.round(item.price * item.quantity * 10) / 10
                      ).toFixed(1)}
                    </div>
                    <div
                      className={`${styles.status} ${getWarehouseStatusClass(item.status)}`}
                    >
                      <span>{meta[2]}</span>
                      {meta[0]}
                      {item.status === 'consigning' && item.estimateDays ? (
                        <span> · 预计 {item.estimateDays} 日内售出</span>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {item.status === 'pending' ? (
                      <>
                        <button
                          className={`${styles.btn} ${styles.primary}`}
                          type="button"
                          onClick={() =>
                            triggerToast(`已申请提货 ${item.product}`)
                          }
                        >
                          提货
                        </button>
                        <button
                          className={`${styles.btn} ${styles.sell}`}
                          type="button"
                          onClick={() => openSell(item)}
                        >
                          寄售
                        </button>
                      </>
                    ) : item.status === 'shipped' ? (
                      <button
                        className={`${styles.btn} ${styles.outline}`}
                        type="button"
                        onClick={() => triggerToast('物流：顺丰 SF1234567890')}
                      >
                        物流
                      </button>
                    ) : item.status === 'consigning' ? (
                      <>
                        <div className={styles.consignPriceRow}>
                          <span className={styles.consignPrice}>
                            ¥{item.consignPrice?.toFixed(1) || '0.0'}
                          </span>
                          <span className={styles.consignLabel}>寄售价</span>
                        </div>
                        <button
                          className={`${styles.btn} ${styles.cancel}`}
                          type="button"
                          onClick={() =>
                            triggerToast(`✅ 已取消寄售 ${item.product}`)
                          }
                        >
                          取消寄售
                        </button>
                      </>
                    ) : (
                      <button
                        className={`${styles.btn} ${styles.sell}`}
                        type="button"
                        onClick={() => openSell(item)}
                      >
                        寄售
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </main>

        {sellItem ? (
          <div className={styles.overlay} onClick={closeSell}>
            <div
              className={styles.panel}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.sellHead}>
                <div className={styles.sellTitle}>寄售商品</div>
                <button
                  className={styles.close}
                  type="button"
                  onClick={closeSell}
                >
                  ×
                </button>
              </div>

              <div className={styles.sellProduct}>
                <img src={sellItem.img} alt={sellItem.product} />
                <div className={styles.sellProductInfo}>
                  <div className={styles.sellProductName}>
                    {sellItem.product}
                  </div>
                  <div className={styles.sellProductMeta}>
                    ×{sellItem.quantity} · {sellItem.source}
                  </div>
                  <div className={styles.sellProductVal}>
                    <small>¥</small>
                    {sellItem.price}
                    <span> /件</span>
                  </div>
                </div>
              </div>

              {estimate ? (
                <div className={styles.estimate}>
                  <div className={styles.estimateIcon}>⚡</div>
                  <div className={styles.estimateInfo}>
                    <div className={styles.estimateTitle}>{estimate.title}</div>
                    <div className={styles.estimateDesc}>{estimate.desc}</div>
                    <div className={styles.estimateDays}>
                      {[1, 2, 3].map((day) => (
                        <div
                          key={day}
                          className={`${styles.estimateDot} ${day <= estimate.level ? styles.dotActive : styles.dotInactive}`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={styles.field}>
                <div className={styles.label}>寄售价格</div>
                <input
                  className={styles.input}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={sellPrice}
                  onChange={(event) => setSellPrice(event.target.value)}
                  placeholder="输入你的寄售价格"
                />
                <div className={styles.hint}>建议寄售价：参考市场价</div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>寄售数量</div>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  max={String(sellItem.quantity)}
                  value={sellQty}
                  onChange={(event) => setSellQty(event.target.value)}
                />
                <div className={styles.hint}>可售数量：{sellItem.quantity}</div>
              </div>

              <button
                className={styles.submit}
                type="button"
                onClick={submitSell}
              >
                确认寄售
              </button>
            </div>
          </div>
        ) : null}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </div>
    </MobileShell>
  );
}
