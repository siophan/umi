'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchShopDetail } from '../../../lib/api/shops';
import { ShopDetailContent } from './shop-detail-content';
import styles from './page.module.css';

type TabKey = 'all' | 'hot' | 'guess' | 'new';
type FilterKey = 'default' | 'sales' | 'price' | 'rating';

function formatNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function createInitialsAvatar(seed: string) {
  const safeSeed = seed.trim() || '店铺';
  const text = safeSeed.slice(0, 2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="136" height="136" viewBox="0 0 136 136">
      <rect width="136" height="136" rx="36" fill="#1a1a1a"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff"
        font-family="Inter, -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="42" font-weight="700">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * 店铺详情页主组件。
 * 页面保留老系统详情节奏，但数据来源完全走当前真实店铺详情接口。
 */
function ShopDetailPageInner() {
  const routeParams = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<Awaited<ReturnType<typeof fetchShopDetail>> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [tab, setTab] = useState<TabKey>('all');
  const [filter, setFilter] = useState<FilterKey>('default');
  const [navSolid, setNavSolid] = useState(false);
  const [toast, setToast] = useState('');
  const [priceAsc, setPriceAsc] = useState(true);

  const showToast = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const shopId = typeof routeParams?.id === 'string' ? routeParams.id : '';

  useEffect(() => {
    let ignore = false;

    /**
     * 店铺详情失败时要明确落到错误态，不能退回假店铺信息继续渲染。
     */
    async function load() {
      if (!ignore) {
        setLoading(true);
        setLoadError('');
      }

      try {
        const result = await fetchShopDetail(shopId);
        if (!ignore) {
          setShopData(result);
        }
      } catch (error) {
        if (!ignore) {
          setShopData(null);
          setLoadError(error instanceof Error ? error.message : '店铺详情加载失败，请稍后重试');
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
  }, [reloadToken, shopId]);

  const meta = shopData?.shop
    ? {
        full: shopData.shop.name,
        desc: shopData.shop.description || '品质保证 · 正品行货',
        city: shopData.shop.city || '',
        fans: formatNum(shopData.shop.fans),
        logo: shopData.shop.logo || '',
        avgRating: shopData.shop.avgRating || 0,
        ownerUserId: shopData.shop.ownerUserId,
        viewerFollowed: shopData.shop.viewerFollowed,
        grade:
          shopData.shop.brandAuthCount > 8
            ? '至尊商家'
            : shopData.shop.brandAuthCount > 3
            ? '皇冠商家'
              : '金牌商家',
      }
    : null;

  const shopProducts = useMemo(
    () => shopData?.products || [],
    [shopData],
  );
  const shopGuess = useMemo(
    () => shopData?.guesses || [],
    [shopData],
  );

  const totalSales = useMemo(
    () => shopProducts.reduce((sum, item) => sum + item.sales, 0),
    [shopProducts],
  );

  const sortedProducts = useMemo(() => {
    const list = [...shopProducts];
    if (filter === 'sales') return list.sort((a, b) => b.sales - a.sales);
    if (filter === 'price') return list.sort((a, b) => (priceAsc ? a.price - b.price : b.price - a.price));
    if (filter === 'rating') return list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [filter, priceAsc, shopProducts]);

  const hotProducts = [...shopProducts]
    .filter((item) => item.sales > 1000)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8);
  const newProducts = [...shopProducts].reverse().slice(0, 6);

  const heroAvatarSrc = useMemo(() => {
    if (meta?.logo) return meta.logo;
    return createInitialsAvatar(meta?.full || shopId || '店铺');
  }, [meta?.full, meta?.logo, shopId]);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = `${meta?.full || '店铺详情'} - UMI`;
  }, [meta?.full]);

  /**
   * 顶部快捷入口会直接带着 tab 跳到主体内容区，保持老店铺页的浏览节奏。
   */
  function jumpToMainContent(nextTab: TabKey) {
    setTab(nextTab);
    window.setTimeout(() => {
      window.scrollTo({ top: 420, behavior: 'smooth' });
    }, 50);
  }

  if (loading) {
    return <div className={styles.page} />;
  }

  if (!shopData || !meta) {
    return (
      <div className={styles.page}>
        <header className={`${styles.nav} ${styles.navSolid}`}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className={styles.navTitle}>店铺详情</div>
          <div className={styles.navActions}>
            <button type="button" className={styles.navBtn} onClick={() => setReloadToken((value) => value + 1)}>
              <i className="fa-solid fa-rotate-right" />
            </button>
            <button type="button" className={styles.navBtn} onClick={() => router.push('/')}>
              <i className="fa-solid fa-home" />
            </button>
          </div>
        </header>

        <main className={styles.issueWrap}>
          <div className={styles.issueCard}>
            <div className={styles.issueIcon}>
              <i className="fa-solid fa-store-slash" />
            </div>
            <div className={styles.issueTitle}>店铺详情暂时不可用</div>
            <div className={styles.issueDesc}>{loadError || '当前无法读取店铺数据，请稍后重试。'}</div>
            <div className={styles.issueActions}>
              <button className={styles.issueGhostBtn} type="button" onClick={() => router.back()}>
                返回上一页
              </button>
              <button className={styles.issuePrimaryBtn} type="button" onClick={() => setReloadToken((value) => value + 1)}>
                重新加载
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <ShopDetailContent
        navSolid={navSolid}
        meta={meta}
        shopProducts={shopProducts}
        shopGuess={shopGuess}
        totalSales={formatNum(totalSales)}
        heroAvatarSrc={heroAvatarSrc}
        tab={tab}
        filter={filter}
        priceAsc={priceAsc}
        sortedProducts={sortedProducts}
        hotProducts={hotProducts}
        newProducts={newProducts}
        onBack={() => router.back()}
        onShare={async () => {
          const url = typeof window !== 'undefined' ? window.location.href : '';
          const title = meta?.full ?? '店铺';
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
              await navigator.share({ title, url });
              return;
            } catch (error) {
              if ((error as { name?: string })?.name === 'AbortError') return;
            }
          }
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(url);
              showToast('链接已复制');
              return;
            } catch {
              // fallthrough
            }
          }
          showToast('当前环境不支持分享');
        }}
        onHome={() => router.push('/')}
        onTabChange={setTab}
        onFilterChange={(nextFilter) => {
          if (nextFilter !== 'price') {
            setPriceAsc(true);
          }
          setFilter(nextFilter);
        }}
        onTogglePrice={() => {
          setPriceAsc((current) => !current);
          setFilter('price');
        }}
        onOpenProduct={(id) => router.push(`/product/${id}`)}
        onOpenGuess={(id) => router.push(`/guess/${id}`)}
        onJumpToMain={jumpToMainContent}
        onToast={showToast}
      />
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </>
  );
}

export default function ShopDetailPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <ShopDetailPageInner />
    </Suspense>
  );
}
