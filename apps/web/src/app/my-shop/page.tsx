'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  fetchMyShop,
  fetchMyShopStats,
  fetchShopStatus,
  removeShopProduct,
  submitShopApplication,
} from '../../lib/api/shops';
import { hasAuthToken } from '../../lib/api/shared';
import { ActiveShopContent } from './active-shop-content';
import {
  buildMonthChange,
  buildShopOverview,
  getShopStatusText,
  initialShopData,
  initialShopStats,
  initialShopStatus,
  shopLogo,
  type ShopData,
  type ShopFormState,
  type ShopStatsData,
  type ShopStatusData,
} from './my-shop-helpers';
import styles from './page.module.css';
import { ShopStatusContent } from './shop-status-content';

export default function MyShopPage() {
  const router = useRouter();
  const [statsOpen, setStatsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopStatusData>(initialShopStatus);
  const [shopData, setShopData] = useState<ShopData>(initialShopData);
  const [shopStats, setShopStats] = useState<ShopStatsData>(initialShopStats);
  const [form, setForm] = useState<ShopFormState>({
    shopName: '',
    categoryId: '',
    reason: '',
  });

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadPage(shouldIgnore: () => boolean = () => false) {
    if (!hasAuthToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const status = await fetchShopStatus();
      if (shouldIgnore()) {
        return;
      }
      setShopStatus(status);

      if (status.status === 'active') {
        const [data, stats] = await Promise.all([fetchMyShop(), fetchMyShopStats()]);
        if (!shouldIgnore()) {
          setShopData(data);
          setShopStats(stats);
        }
      } else {
        setShopData(initialShopData);
        setShopStats(initialShopStats);
        if (status.latestApplication) {
          setForm({
            shopName: status.latestApplication.shopName,
            categoryId: status.latestApplication.categoryId || '',
            reason: status.latestApplication.reason || '',
          });
        }
      }
    } catch (loadError) {
      if (shouldIgnore()) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : '读取店铺状态失败');
    } finally {
      if (!shouldIgnore()) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let ignore = false;
    void loadPage(() => ignore);
    return () => {
      ignore = true;
    };
  }, []);

  const shop = shopData.shop;
  const brandList = shopData.brandAuths;
  const productList = shopData.products;
  const approvedBrandCount = useMemo(
    () => brandList.filter((item) => item.status === 'approved').length,
    [brandList],
  );
  const ratingLabel = useMemo(() => (shop?.rating ? `${shop.rating.toFixed(1)}⭐` : '--'), [shop?.rating]);
  const heroShop = shop
    ? {
        name: shop.name,
        tag: getShopStatusText(shop.status),
        productCount: shop.productCount,
        orderCount: shop.orderCount,
        revenue: `¥${shop.revenue.toFixed(1)}`,
        rating: ratingLabel,
        logo: shop.logo || shopLogo,
      }
    : {
        name: '暂未开通店铺',
        tag: '请先完成开店',
        productCount: 0,
        orderCount: 0,
        revenue: '¥0.0',
        rating: '--',
        logo: shopLogo,
      };
  const shopOverview = useMemo(() => buildShopOverview(shopStats), [shopStats]);
  const monthChange = useMemo(() => buildMonthChange(shopStats), [shopStats]);
  const statsCards = useMemo(
    () => [
      { value: heroShop.revenue, label: '累计收入', helper: monthChange.revenue, className: styles.revenue },
      { value: `${heroShop.orderCount}`, label: '累计订单', helper: monthChange.orders, className: styles.orders },
      {
        value: `${heroShop.productCount}`,
        label: '在售商品',
        helper: `${approvedBrandCount} 个授权品牌`,
        className: styles.views,
      },
      {
        value: heroShop.rating,
        label: '店铺评分',
        helper: shop?.rating ? '当前评分' : '评分暂未接入',
        className: styles.rate,
      },
    ],
    [
      approvedBrandCount,
      heroShop.orderCount,
      heroShop.productCount,
      heroShop.rating,
      heroShop.revenue,
      monthChange.orders,
      monthChange.revenue,
      shop?.rating,
    ],
  );

  function showToast(message: string) {
    setToast(message);
  }

  async function refreshStatusAndShop() {
    const status = await fetchShopStatus();
    setShopStatus(status);
    if (status.status === 'active') {
      const [data, stats] = await Promise.all([fetchMyShop(), fetchMyShopStats()]);
      setShopData(data);
      setShopStats(stats);
    } else {
      setShopData(initialShopData);
      setShopStats(initialShopStats);
    }
  }

  async function handleSubmitApplication() {
    if (!form.shopName.trim()) {
      showToast('请填写店铺名称');
      return;
    }
    if (!form.categoryId) {
      showToast('请选择经营分类');
      return;
    }
    if (!form.reason.trim()) {
      showToast('请填写开店说明');
      return;
    }

    setSubmitting(true);
    try {
      await submitShopApplication({
        shopName: form.shopName.trim(),
        categoryId: form.categoryId,
        reason: form.reason.trim(),
      });
      showToast('开店申请已提交');
      await refreshStatusAndShop();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '提交申请失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (shopStatus.status !== 'active') {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className={styles.headerTitle}>开店申请</div>
          <div className={styles.actionsTop} />
        </header>

        <ShopStatusContent
          loading={loading}
          error={error}
          submitting={submitting}
          shopStatus={shopStatus}
          form={form}
          onRetry={() => void loadPage()}
          onSubmit={() => void handleSubmitApplication()}
          onFormChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        />

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>我的店铺</div>
        <div className={styles.actionsTop}>
          <button
            className={styles.iconBtn}
            type="button"
            onClick={() => {
              if (!shop?.id) {
                showToast(loading ? '店铺数据加载中' : '暂无店铺可预览');
                return;
              }
              router.push(`/shop/${shop.id}`);
            }}
          >
            <i className="fa-solid fa-eye" />
          </button>
        </div>
      </header>

      <ActiveShopContent
        heroShop={heroShop}
        brandList={brandList}
        productList={productList}
        statsOpen={statsOpen}
        statsCards={statsCards}
        shopOverview={shopOverview}
        onQuickAction={(label) => {
          if (label === '品牌授权') {
            router.push('/brand-auth');
          }
          if (label === '上架商品') {
            router.push('/add-product');
          }
          if (label === '数据统计') {
            setStatsOpen(true);
          }
        }}
        onCloseStats={() => setStatsOpen(false)}
        onManageBrands={() => router.push('/brand-auth')}
        onAddProduct={() => router.push('/add-product')}
        onRemoveProduct={(productId) => {
          void (async () => {
            try {
              await removeShopProduct(productId);
              showToast('已下架');
              await refreshStatusAndShop();
            } catch (removeError) {
              showToast(removeError instanceof Error ? removeError.message : '下架失败，请重试');
            }
          })();
        }}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
