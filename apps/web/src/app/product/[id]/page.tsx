'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toEntityId, type CouponListItem, type ProductDetailResult, type WarehouseItem } from '@umi/shared';

import { addCartItem } from '../../../lib/api/cart';
import { fetchCoupons } from '../../../lib/api/coupons';
import { favoriteProduct, fetchProductDetail, unfavoriteProduct } from '../../../lib/api/products';
import { ProductDetailBody } from './product-detail-body';
import { ProductDetailExchangeSheet } from './product-detail-exchange-sheet';
import { ProductDetailHeader } from './product-detail-header';
import {
  buildGuessCountdown,
  type ActiveGuessDetail,
  type ProductMode,
  sumWarehouseValue,
} from './product-detail-helpers';
import { ProductDetailSummary } from './product-detail-summary';
import styles from './page.module.css';

function parseTabParam(value: string | null): ProductMode {
  return value === 'guess' || value === 'inv' || value === 'direct' ? value : 'direct';
}

/**
 * 商品详情页主组件。
 * 当前页除了规格区外，按老系统详情页的结构和节奏做 UI 对齐，但数据链保持新系统真实接口。
 */
function ProductDetailPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = parseTabParam(searchParams?.get('tab') ?? null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [product, setProduct] = useState<null | ProductDetailResult['product']>(null);
  const [activeGuess, setActiveGuess] = useState<null | ActiveGuessDetail>(null);
  const [warehouseItems, setWarehouseItems] = useState<ProductDetailResult['warehouseItems']>([]);
  const [recommendations, setRecommendations] = useState<ProductDetailResult['recommendations']>([]);
  const [coupons, setCoupons] = useState<CouponListItem[]>([]);
  const [reviews, setReviews] = useState<ProductDetailResult['reviews']>([]);
  const [currentTab, setCurrentTab] = useState<ProductMode>(initialTab);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeConfirmOpen, setExchangeConfirmOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [favActive, setFavActive] = useState(false);
  const [selectedGuessOpt, setSelectedGuessOpt] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const heroSliderRef = useRef<HTMLDivElement | null>(null);
  const productId = typeof params?.id === 'string' ? params.id : '';

  useEffect(() => {
    let ignore = false;

    /**
     * 加载详情页首屏所需数据。
     * 商品主数据失败时整页报错；优惠券失败时只降级券区，避免非核心接口拖垮页面。
     */
    async function load() {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        setLoadError(null);
        // 优惠券接口失败不应该把详情页整页带崩，这里只把券区降级为空。
        const [result, couponItems] = await Promise.all([
          fetchProductDetail(productId),
          fetchCoupons().catch(() => [] as CouponListItem[]),
        ]);
        if (ignore) {
          return;
        }
        setProduct(result.product);
        setActiveGuess(
          result.activeGuess
            ? {
                id: result.activeGuess.id,
                title: result.activeGuess.title,
                endTime: result.activeGuess.endTime,
                options: result.activeGuess.options,
              }
            : null,
        );
        setWarehouseItems(result.warehouseItems);
        setRecommendations(result.recommendations);
        setReviews(result.reviews);
        setCoupons(couponItems.filter((item) => item.status === 'unused').slice(0, 3));
        setFavActive(result.product.favorited);
        if (!result.activeGuess) {
          setCurrentTab('direct');
        }
      } catch (error) {
        if (!ignore) {
          const message = error instanceof Error ? error.message : '商品加载失败';
          setProduct(null);
          setActiveGuess(null);
          setWarehouseItems([]);
          setRecommendations([]);
          setReviews([]);
          setCoupons([]);
          setLoadError(message);
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
  }, [productId]);

  const heroImages = useMemo(() => {
    if (!product) {
      return [];
    }
    const images = product.images.length ? product.images : [product.img];
    return images.filter(Boolean);
  }, [product]);

  const guessPrice = useMemo(() => product?.guessPrice ?? 0, [product]);
  const directPrice = useMemo(() => product?.price ?? 0, [product]);
  const selectedDeduct = selectedWarehouse.reduce((sum, id) => {
    const item = warehouseItems.find((entry: WarehouseItem) => entry.id === id);
    return sum + (item ? Number(item.price ?? 0) : 0);
  }, 0);
  const exchangeOverflow = Math.max(0, selectedDeduct - directPrice);
  const exchangeToPay = Math.max(0, directPrice - selectedDeduct);
  const inventoryPreview = warehouseItems.slice(0, 3);
  const inventoryTotalValue = sumWarehouseValue(warehouseItems);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activePrice = currentTab === 'guess' ? guessPrice : directPrice;
  const discountPercent =
    product && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;
  const reviewCount = reviews.length;
  const guessTotalVotes = activeGuess?.options.reduce((sum, option) => sum + option.voteCount, 0) || 0;
  const guessPercent = Math.min(100, Math.round((guessTotalVotes / 50) * 100));
  const remainingSlots = Math.max(0, 50 - guessTotalVotes);
  const guessCountdown = activeGuess
    ? buildGuessCountdown(activeGuess.endTime, now)
    : null;

  /**
   * 分享当前商品页。
   * 支持原生分享时优先走系统分享，否则退化为页面内提示。
   */
  async function sharePage() {
    if (!product) {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `在优米发现了${product.name}`,
          url: window.location.href,
        });
      } catch {
        return;
      }
      return;
    }
    setToast('链接已复制');
  }

  if (loading) {
    return <main className={styles.page} />;
  }

  if (!product) {
    return (
      <main className={styles.page}>
        <header className={styles.nav}>
          <button className={styles.navBtn} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className={styles.navTitle}>商品详情</div>
          <div className={styles.navActions} />
        </header>
        <section className={styles.body}>
          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.recommendTitle}>
                {loadError === '商品不存在' ? '商品不存在' : loadError || '商品加载失败'}
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <ProductDetailHeader
        scrolled={scrolled}
        productName={product.name}
        heroImages={heroImages}
        currentSlide={currentSlide}
        heroSliderRef={heroSliderRef}
        onBack={() => router.back()}
        onShare={() => void sharePage()}
        onMore={() => setToast('更多')}
        onSlideChange={setCurrentSlide}
      />

      <ProductDetailSummary
        product={product}
        coupons={coupons}
        activeGuess={activeGuess}
        currentTab={currentTab}
        activePrice={activePrice}
        directPrice={directPrice}
        guessPrice={guessPrice}
        discountPercent={discountPercent}
        onOpenCoupons={() => router.push('/coupons')}
        onOpenServiceTip={() => setToast('以下单页和店铺说明为准')}
        onChangeTab={setCurrentTab}
      />

      <ProductDetailBody
        product={product}
        activeGuess={activeGuess}
        warehouseItems={warehouseItems}
        inventoryPreview={inventoryPreview}
        inventoryTotalValue={inventoryTotalValue}
        recommendations={recommendations}
        reviews={reviews}
        coupons={coupons}
        currentTab={currentTab}
        directPrice={directPrice}
        guessPrice={guessPrice}
        selectedGuessOpt={selectedGuessOpt}
        detailExpanded={detailExpanded}
        selectedDeduct={selectedDeduct}
        exchangeToPay={exchangeToPay}
        remainingSlots={remainingSlots}
        guessTotalVotes={guessTotalVotes}
        guessPercent={guessPercent}
        reviewCount={reviewCount}
        guessCountdown={guessCountdown}
        onChangeTab={setCurrentTab}
        onSelectGuessOption={setSelectedGuessOpt}
        onOpenExchange={() => setExchangeOpen(true)}
        onToggleDetailExpanded={() => setDetailExpanded((value) => !value)}
        onOpenToast={setToast}
      />

      <div className={styles.bottomBar}>
        <div className={styles.barLeft}>
          <Link className={styles.barIcon} href={product.shopId ? `/shop/${product.shopId}` : '/my-shop'}>
            <i className="fa-solid fa-store" />
            <span>店铺</span>
          </Link>
          <button
            className={`${styles.barIcon} ${favActive ? styles.barIconFavActive : ''}`}
            type="button"
            onClick={async () => {
              if (!product) {
                return;
              }
              const previous = favActive;
              const next = !previous;
              setFavActive(next);
              try {
                if (next) {
                  await favoriteProduct(product.id);
                } else {
                  await unfavoriteProduct(product.id);
                }
                setToast(next ? '已收藏 ❤️' : '取消收藏');
              } catch {
                setFavActive(previous);
                setToast('收藏失败');
              }
            }}
          >
            <i className={`fa-${favActive ? 'solid' : 'regular'} fa-heart`} />
            <span>收藏</span>
          </button>
          <button className={styles.barIcon} type="button" onClick={() => setToast('💬 正在接入客服...')}>
            <i className="fa-regular fa-comment-dots" />
            <span>客服</span>
          </button>
        </div>
        <div className={styles.barBtns}>
          <button
            className={styles.barSub}
            type="button"
            onClick={() => {
              if (currentTab === 'guess') router.push('/guess-history');
              else if (currentTab === 'inv') router.push('/warehouse');
              else if (product) {
                void addCartItem({ productId: toEntityId(product.id), quantity: 1 })
                  .then(() => setToast('已加入购物车 🛒'))
                  .catch(() => setToast('加入购物车失败'));
              }
            }}
          >
            {currentTab === 'guess' ? (
              '我的竞猜'
            ) : currentTab === 'inv' ? (
              <>
                <i className="fa-solid fa-warehouse" />
                我的仓库
              </>
            ) : (
              <>
                <i className="fa-solid fa-cart-plus" />
                加入购物车
              </>
            )}
          </button>
          <button
            className={`${styles.barPrimary} ${currentTab === 'guess' ? styles.barPrimaryGuess : currentTab === 'inv' ? styles.barPrimaryInv : styles.barPrimaryDirect}`}
            type="button"
            onClick={() => {
              if (currentTab === 'guess') {
                if (!activeGuess) {
                  setToast('当前暂无可参与的竞猜');
                  return;
                }
                router.push(`/guess-order?id=${encodeURIComponent(activeGuess.id)}`);
              } else if (currentTab === 'direct') {
                router.push(
                  `/payment?from=product&pid=${encodeURIComponent(product.id)}&qty=1`,
                );
              }
              else setExchangeOpen(true);
            }}
          >
            {currentTab === 'guess' ? `参与竞猜 ¥${guessPrice}` : currentTab === 'inv' ? `换购 ¥${directPrice}` : `立即购买 ¥${directPrice}`}
          </button>
        </div>
      </div>

      <ProductDetailExchangeSheet
        product={product}
        warehouseItems={warehouseItems}
        selectedWarehouse={selectedWarehouse}
        selectedDeduct={selectedDeduct}
        exchangeOverflow={exchangeOverflow}
        exchangeToPay={exchangeToPay}
        exchangeOpen={exchangeOpen}
        exchangeConfirmOpen={exchangeConfirmOpen}
        onCloseExchange={() => setExchangeOpen(false)}
        onSelectWarehouse={(warehouseId) =>
          setSelectedWarehouse((current) =>
            current.includes(warehouseId)
              ? current.filter((id) => id !== warehouseId)
              : [...current, warehouseId],
          )
        }
        onApplyBestPlan={() => {
          setSelectedWarehouse(warehouseItems.map((item) => item.id));
          setToast('✨ 已应用最优方案');
        }}
        onOpenConfirm={() => setExchangeConfirmOpen(true)}
        onCloseConfirm={() => setExchangeConfirmOpen(false)}
        onConfirmExchange={() => {
          setExchangeConfirmOpen(false);
          setExchangeOpen(false);
          router.push(`/payment?from=exchange&pid=${encodeURIComponent(product.id)}&qty=1`);
        }}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailPageInner />
    </Suspense>
  );
}
