'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { WarehouseItem } from '@umi/shared';

import { cancelConsignWarehouseItem, consignWarehouseItem, fetchPhysicalWarehouse, fetchVirtualWarehouse } from '../../lib/api/warehouse';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

type WarehouseTab = 'all' | 'pending' | 'shipped' | 'delivered' | 'consigning';

const statusMeta: Record<WarehouseTab, [string, string, string]> = {
  all: ['全部', '', 'fa-box-open'],
  pending: ['待提货', 's-pending', 'fa-clock'],
  shipped: ['运输中', 's-shipped', 'fa-truck'],
  delivered: ['已签收', 's-delivered', 'fa-circle-check'],
  consigning: ['寄售中', 's-consigning', 'fa-tags'],
};

const emptyMap: Record<WarehouseTab, { icon: string; title: string; desc: string }> = {
  all: { icon: 'fa-solid fa-box-open', title: '暂无商品', desc: '快去参与竞猜获得奖品！' },
  pending: { icon: 'fa-solid fa-box-open', title: '暂无待提货商品', desc: '快去参与竞猜获得奖品！' },
  shipped: { icon: 'fa-solid fa-box-open', title: '暂无运输中商品', desc: '货品出发后这里会显示物流状态。' },
  delivered: { icon: 'fa-solid fa-box-open', title: '暂无已签收商品', desc: '签收完成后会进入这里。' },
  consigning: { icon: 'fa-solid fa-box-open', title: '暂无寄售中商品', desc: '把仓库好物挂出来试试。' },
};

function mapWarehouseTab(item: WarehouseItem): Exclude<WarehouseTab, 'all'> {
  if (item.status === 'consigning') {
    return 'consigning';
  }
  if (item.status === 'shipping') {
    return 'shipped';
  }
  if (item.status === 'delivered' || item.status === 'completed') {
    return 'delivered';
  }
  return 'pending';
}

function getWarehouseStatusClass(tab: WarehouseTab) {
  if (tab === 'pending') {
    return styles.statusPending;
  }
  if (tab === 'shipped') {
    return styles.statusShipped;
  }
  if (tab === 'delivered') {
    return styles.statusDelivered;
  }
  return styles.statusConsigning;
}

export default function WarehousePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<WarehouseTab>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellItem, setSellItem] = useState<WarehouseItem | null>(null);
  const [sellPrice, setSellPrice] = useState('0');
  const [sellQty, setSellQty] = useState('1');
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const loadWarehouse = useCallback(async (shouldIgnore: () => boolean = () => false) => {
    setLoading(true);
    setError(null);
    try {
      const [virtualData, physicalData] = await Promise.all([fetchVirtualWarehouse(), fetchPhysicalWarehouse()]);
      if (!shouldIgnore()) {
        const merged = [...virtualData.items, ...physicalData.items];
        setItems(merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
    } catch (loadError) {
      if (shouldIgnore()) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : '仓库加载失败，请稍后重试');
    } finally {
      if (!shouldIgnore()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void loadWarehouse(() => ignore);

    return () => {
      ignore = true;
    };
  }, [loadWarehouse, pathname]);

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const mapped = mapWarehouseTab(item);
          acc[mapped] += item.quantity;
          acc.totalValue += (item.price || 0) * item.quantity;
          return acc;
        },
        { pending: 0, shipped: 0, delivered: 0, consigning: 0, totalValue: 0 },
      ),
    [items],
  );

  const filtered = tab === 'all' ? items : items.filter((item) => mapWarehouseTab(item) === tab);

  const triggerToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  const openSell = (item: WarehouseItem) => {
    setSellItem(item);
    setSellPrice(String(Math.round((item.price || 0) * 0.85 * 10) / 10));
    setSellQty('1');
  };

  const closeSell = () => setSellItem(null);

  const priceValue = sellItem ? Number.parseFloat(sellPrice) || 0 : 0;
  const ratio = sellItem && sellItem.price ? priceValue / sellItem.price : 0;
  const estimate =
    !sellItem || !priceValue
      ? null
      : ratio <= 0.7
        ? { title: '1-1 日内出售成功', desc: '低于市场价30%+，极速出售', level: 3 }
        : ratio <= 0.85
          ? { title: '1-2 日内出售成功', desc: '价格极具竞争力，市场需求旺盛', level: 3 }
          : ratio <= 0.95
            ? { title: '1-3 日内出售成功', desc: '价格合理，预计较快出售', level: 2 }
            : ratio <= 1.05
              ? { title: '预计 5 日内出售', desc: '接近市场价，需要一定等待时间', level: 1 }
              : { title: '预计 7 日内出售', desc: '高于市场价，出售可能较慢', level: 0 };

  const submitSell = async () => {
    if (!sellItem) return;
    const quantity = Number.parseInt(sellQty, 10);
    if (!priceValue || priceValue <= 0) {
      triggerToast('请输入有效价格');
      return;
    }
    if (!quantity || quantity <= 0 || quantity > sellItem.quantity) {
      triggerToast('数量无效');
      return;
    }

    try {
      const result = await consignWarehouseItem(sellItem.id, priceValue);
      setItems((current) =>
        current.map((item) =>
          item.id === sellItem.id
            ? { ...item, status: 'consigning', consignPrice: priceValue, estimateDays: result.estimateDays }
            : item,
        ),
      );
      triggerToast(`🏷️ 已寄售 ${sellItem.productName} ×${quantity}，寄售价 ¥${priceValue}`);
      closeSell();
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : '寄售失败，请重试');
    }
  };

  return (
    <MobileShell tab="warehouse">
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <h1 className={styles.title}>我的仓库</h1>
          <div className={styles.action} />
        </header>

        <section className={styles.summary}>
          <div className={styles.grid}>
            <button className={`${styles.summaryCard} ${styles.summaryPending}`} type="button" onClick={() => setTab('pending')}>
              <strong>{counts.pending}</strong>
              <span>待提货</span>
            </button>
            <button className={`${styles.summaryCard} ${styles.summaryShipped}`} type="button" onClick={() => setTab('shipped')}>
              <strong>{counts.shipped}</strong>
              <span>运输中</span>
            </button>
            <button className={`${styles.summaryCard} ${styles.summaryDelivered}`} type="button" onClick={() => setTab('delivered')}>
              <strong>{counts.delivered}</strong>
              <span>已签收</span>
            </button>
            <button className={`${styles.summaryCard} ${styles.summaryConsigning}`} type="button" onClick={() => setTab('consigning')}>
              <strong>{counts.consigning}</strong>
              <span>寄售中</span>
            </button>
          </div>
          <div className={styles.totalBar}>
            <div className={styles.totalLabel}>
              <span className={styles.totalIcon}>
                <i className="fa-solid fa-coins" />
              </span>
              物资总值
            </div>
            <div className={styles.totalValue}>
              <small>¥</small>
              {counts.totalValue.toFixed(1)}
            </div>
          </div>
        </section>

        <section className={styles.tabs}>
          {(['all', 'pending', 'shipped', 'delivered', 'consigning'] as WarehouseTab[]).map((value) => {
            const badge =
              value === 'all'
                ? 0
                : counts[value as Exclude<WarehouseTab, 'all'>];
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
                {badge > 0 ? <span className={styles.badge}>{badge}</span> : null}
              </button>
            );
          })}
        </section>

        <main className={styles.list}>
          {!loading && error ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><i className="fa-solid fa-triangle-exclamation" /></div>
              <div className={styles.emptyText}>仓库加载失败</div>
              <div className={styles.emptyDesc}>{error}</div>
              <button className={styles.emptyBtn} type="button" onClick={() => void loadWarehouse()}>
                <i className="fa-solid fa-rotate-right" />
                重新加载
              </button>
            </div>
          ) : !loading && filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><i className={emptyMap[tab].icon} /></div>
              <div className={styles.emptyText}>{emptyMap[tab].title}</div>
              <div className={styles.emptyDesc}>{emptyMap[tab].desc}</div>
            </div>
          ) : (
            filtered.map((item, index) => {
              const mappedTab = mapWarehouseTab(item);
              const meta = statusMeta[mappedTab];
              return (
                <article
                  key={`${item.warehouseType}-${item.id}`}
                  className={styles.card}
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
                >
                  <img
                    className={styles.img}
                    src={item.productImg || '/legacy/images/products/p001-lays.jpg'}
                    alt={item.productName}
                  />
                  <div className={styles.body}>
                    <div className={styles.name}>{item.productName}</div>
                    <div className={styles.meta}>
                      <span>×{item.quantity}</span>
                      <span className={styles.sep}>|</span>
                      <span>{item.sourceType || item.warehouseType}</span>
                      <span className={styles.sep}>|</span>
                      <span>{item.createdAt.slice(0, 10)}</span>
                    </div>
                    <div className={styles.price}>
                      <small>¥</small>
                      {(((item.price || 0) * item.quantity) * 10 / 10).toFixed(1)}
                    </div>
                    <div className={`${styles.status} ${getWarehouseStatusClass(mappedTab)}`}>
                      <i className={`fa-solid ${meta[2]}`} />
                      {meta[0]}
                      {mappedTab === 'consigning' && item.estimateDays ? <span> · 预计 {item.estimateDays} 日内售出</span> : null}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {mappedTab === 'consigning' ? (
                      <>
                        <div className={styles.consignPriceRow}>
                          <span className={styles.consignPrice}>¥{(item.consignPrice || 0).toFixed(1)}</span>
                          <span className={styles.consignLabel}>寄售价</span>
                        </div>
                        <button
                          className={`${styles.btn} ${styles.cancel}`}
                          type="button"
                          onClick={() => {
                            void (async () => {
                              try {
                                await cancelConsignWarehouseItem(item.id);
                                setItems((current) =>
                                  current.map((entry) =>
                                    entry.id === item.id
                                      ? { ...entry, status: 'stored', consignPrice: undefined, estimateDays: undefined }
                                      : entry,
                                  ),
                                );
                                triggerToast(`✅ 已取消寄售 ${item.productName}`);
                              } catch (error) {
                                triggerToast(error instanceof Error ? error.message : '取消寄售失败');
                              }
                            })();
                          }}
                        >
                          <i className="fa-solid fa-xmark" />
                          取消寄售
                        </button>
                      </>
                    ) : mappedTab === 'shipped' ? (
                      <button
                        className={`${styles.btn} ${styles.outline}`}
                        type="button"
                        onClick={() => triggerToast('物流：顺丰 SF1234567890')}
                      >
                        <i className="fa-solid fa-location-dot" />
                        物流
                      </button>
                    ) : mappedTab === 'pending' ? (
                      <>
                        <button
                          className={`${styles.btn} ${styles.primary}`}
                          type="button"
                          onClick={() => {
                            setItems((current) =>
                              current.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      status: 'shipping',
                                    }
                                  : entry,
                              ),
                            );
                            triggerToast('已申请提货 📦');
                          }}
                        >
                          <i className="fa-solid fa-truck-fast" />
                          提货
                        </button>
                        <button
                          className={`${styles.btn} ${styles.sell}`}
                          type="button"
                          onClick={() => openSell(item)}
                        >
                          <i className="fa-solid fa-tag" />
                          寄售
                        </button>
                      </>
                    ) : (
                      <button
                        className={`${styles.btn} ${styles.sell}`}
                        type="button"
                        onClick={() => openSell(item)}
                      >
                        <i className="fa-solid fa-tag" />
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
            <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
              <div className={styles.sellHead}>
                <div className={styles.sellTitle}>寄售商品</div>
                <button className={styles.close} type="button" onClick={closeSell}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.sellProduct}>
                <img src={sellItem.productImg || '/legacy/images/products/p001-lays.jpg'} alt={sellItem.productName} />
                <div className={styles.sellProductInfo}>
                  <div className={styles.sellProductName}>{sellItem.productName}</div>
                  <div className={styles.sellProductMeta}>×{sellItem.quantity} · {sellItem.sourceType || sellItem.warehouseType}</div>
                  <div className={styles.sellProductVal}>
                    <small>¥</small>
                    {sellItem.price || 0}
                    <span> /件</span>
                  </div>
                </div>
              </div>

              {estimate ? (
                <div className={styles.estimate}>
                  <div className={styles.estimateIcon}>
                    <i className="fa-solid fa-bolt" />
                  </div>
                  <div className={styles.estimateInfo}>
                    <div className={styles.estimateTitle}>
                      <i className="fa-solid fa-chart-line" />
                      {estimate.title}
                    </div>
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
                <div className={styles.hint}>建议寄售价：¥{Math.round((sellItem.price || 0) * 0.85 * 10) / 10}（市场价 ¥{sellItem.price || 0}）</div>
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

              <button className={styles.submit} type="button" onClick={() => void submitSell()}>
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
