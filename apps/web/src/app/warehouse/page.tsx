'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { WarehouseItem } from '@umi/shared';

import {
  cancelConsignWarehouseItem,
  consignWarehouseItem,
  fetchPhysicalWarehouse,
  fetchVirtualWarehouse,
  shipWarehouseItem,
} from '../../lib/api/warehouse';
import { hasAuthToken } from '../../lib/api/shared';
import { MobileShell } from '../../components/mobile-shell';
import { WarehouseConsignModal } from './warehouse-consign-modal';
import { WarehouseShipModal } from './warehouse-ship-modal';
import { WarehouseTrackingModal } from './warehouse-tracking-modal';
import {
  buildSellEstimate,
  mapWarehouseTab,
  type WarehouseTab,
} from './warehouse-helpers';
import { WarehouseList } from './warehouse-list';
import { WarehouseSummary } from './warehouse-summary';
import { WarehouseTabs } from './warehouse-tabs';
import styles from './page.module.css';

/**
 * 我的仓库页主组件。
 * 页面同时展示虚拟仓和实体仓，因此首屏需要并行拉取两套数据后再合并排序。
 */
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
  const [trackingItem, setTrackingItem] = useState<WarehouseItem | null>(null);
  const [shipItem, setShipItem] = useState<WarehouseItem | null>(null);
  const [shipping, setShipping] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  /**
   * 虚拟仓和实体仓来自两条独立接口，任一条失败时整页直接报错，不伪造部分成功结果。
   */
  const loadWarehouse = useCallback(async (shouldIgnore: () => boolean = () => false) => {
    if (!hasAuthToken()) {
      setLoading(false);
      return;
    }
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

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tab]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const loadMore = useCallback(() => {
    setVisibleCount((current) => current + PAGE_SIZE);
  }, []);

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
  };

  const closeSell = () => setSellItem(null);

  const priceValue = sellItem ? Number.parseFloat(sellPrice) || 0 : 0;
  const estimate = buildSellEstimate(sellItem, sellPrice);

  /**
   * 寄售动作先做前端价格校验，再调用真实寄售接口（整批寄售，按 warehouse_item 1:1 挂出）。
   */
  const submitSell = async () => {
    if (!sellItem) return;
    if (!priceValue || priceValue <= 0) {
      triggerToast('请输入有效价格');
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
      triggerToast(`🏷️ 已寄售 ${sellItem.productName} ×${sellItem.quantity}，寄售价 ¥${priceValue}`);
      closeSell();
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : '寄售失败，请重试');
    }
  };

  return (
    <MobileShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <h1 className={styles.title}>我的仓库</h1>
          <div className={styles.action} />
        </header>

        <WarehouseSummary counts={counts} onTabSelect={setTab} />
        <WarehouseTabs tab={tab} counts={counts} onChange={setTab} />
        <WarehouseList
          loading={loading}
          error={error}
          tab={tab}
          items={visibleItems}
          totalCount={filtered.length}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onReload={() => void loadWarehouse()}
          onOpenSell={openSell}
          onCancelConsign={(item) => {
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
          onTrackShipment={(item) => setTrackingItem(item)}
          onPickup={(item) => setShipItem(item)}
        />

        {sellItem ? (
          <WarehouseConsignModal
            item={sellItem}
            sellPrice={sellPrice}
            estimate={estimate}
            onClose={closeSell}
            onPriceChange={setSellPrice}
            onSubmit={() => void submitSell()}
          />
        ) : null}

        {trackingItem ? (
          <WarehouseTrackingModal
            item={trackingItem}
            onClose={() => setTrackingItem(null)}
            onCopyResult={(success) => triggerToast(success ? '✅ 运单号已复制' : '复制失败，请手动选择')}
          />
        ) : null}

        {shipItem ? (
          <WarehouseShipModal
            item={shipItem}
            submitting={shipping}
            onClose={() => {
              if (shipping) return;
              setShipItem(null);
            }}
            onSubmit={(addressId) => {
              void (async () => {
                if (!shipItem || shipping) return;
                setShipping(true);
                try {
                  await shipWarehouseItem(shipItem.id, addressId);
                  triggerToast(`📦 已提交提货：${shipItem.productName}`);
                  setShipItem(null);
                  await loadWarehouse();
                } catch (error) {
                  triggerToast(error instanceof Error ? error.message : '提货失败，请重试');
                } finally {
                  setShipping(false);
                }
              })();
            }}
          />
        ) : null}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </div>
    </MobileShell>
  );
}
