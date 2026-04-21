'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  toEntityId,
  type CouponListItem,
  type GuessOption,
  type ProductDetailResult,
  type ProductSummary,
  type WarehouseItem,
} from '@umi/shared';

import { addCartItem } from '../../../lib/api/cart';
import { fetchCoupons } from '../../../lib/api/coupons';
import { favoriteProduct, fetchProductDetail, unfavoriteProduct } from '../../../lib/api/products';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [product, setProduct] = useState<null | ProductDetailResult['product']>(null);
  const [activeGuess, setActiveGuess] = useState<null | {
    id: string;
    title: string;
    endTime: string;
    options: GuessOption[];
  }>(null);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [recommendations, setRecommendations] = useState<ProductSummary[]>([]);
  const [coupons, setCoupons] = useState<CouponListItem[]>([]);
  const [reviews, setReviews] = useState<ProductDetailResult['reviews']>([]);
  const [currentTab, setCurrentTab] = useState<'direct' | 'guess' | 'inv'>('direct');
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

    async function load() {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        setLoadError(null);
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
  const inventoryTotalValue = warehouseItems.reduce(
    (sum, item) => sum + Number(item.price ?? 0),
    0,
  );

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
    ? (() => {
        const diff = Math.max(0, new Date(activeGuess.endTime).getTime() - now);
        return {
          hours: String(Math.floor(diff / 3600000)).padStart(2, '0'),
          minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
          seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
        };
      })()
    : null;

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
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <button className={styles.navBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>{product.name}</div>
        <div className={styles.navActions}>
          <button className={styles.navBtn} type="button" onClick={() => void sharePage()}>
            <i className="fa-solid fa-arrow-up-from-bracket" />
          </button>
          <button className={styles.navBtn} type="button" onClick={() => setToast('更多')}>
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div
          ref={heroSliderRef}
          className={styles.heroSlider}
          onScroll={(event) => {
            const target = event.currentTarget;
            const slide = Math.round(target.scrollLeft / target.clientWidth);
            setCurrentSlide(Math.max(0, Math.min(heroImages.length - 1, slide)));
          }}
        >
          {heroImages.map((src, index) => (
            <div className={styles.heroSlide} key={`${src}-${index}`}>
              <img src={src} alt={`${product.name} ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className={styles.heroDots}>
          {heroImages.map((_, index) => (
            <button
              className={index === currentSlide ? styles.heroDotActive : styles.heroDot}
              key={index}
              type="button"
              onClick={() => {
                setCurrentSlide(index);
                heroSliderRef.current?.scrollTo({
                  left: heroSliderRef.current.clientWidth * index,
                  behavior: 'smooth',
                });
              }}
            />
          ))}
        </div>
        <div className={styles.heroCounter}>
          {currentSlide + 1}/{heroImages.length}
        </div>
      </section>

      <section className={styles.priceCard}>
        <div className={styles.priceRow}>
          <div className={styles.priceMain}>
            <small>¥</small>
            {activePrice}
          </div>
          <div className={styles.priceOrig}>¥{product.originalPrice}</div>
          <div className={styles.priceTags}>
            {discountPercent > 0 ? <span className={`${styles.priceTag} ${styles.tagOff}`}>{discountPercent}%OFF</span> : null}
          </div>
        </div>
        <div className={styles.titleArea}>
          <span className={styles.productTitle}>{product.name}</span>
        </div>
        <div className={styles.productSub}>
          <span>已售 {product.sales}</span>
          <span className={styles.sep}>|</span>
          <span>⭐ {product.rating ? product.rating.toFixed(1) : '0.0'}</span>
          <span className={styles.sep}>|</span>
          <span>{product.category}</span>
        </div>
        <div className={styles.promoStrip}>
          <button className={styles.promoChip} type="button" onClick={() => router.push('/coupons')}>
            <span className={`${styles.pcTag} ${styles.pcCoupon}`}>券</span>
            {coupons.length ? `可用${coupons.length}张券` : '下单可用优惠券'}
            <i className="fa-solid fa-chevron-right" />
          </button>
          {activeGuess ? (
            <button className={styles.promoChip} type="button" onClick={() => setCurrentTab('guess')}>
              <span className={`${styles.pcTag} ${styles.pcGuess}`}>猜</span> ¥{guessPrice}参与竞猜赢商品 <i className="fa-solid fa-chevron-right" />
            </button>
          ) : null}
          <button className={styles.promoChip} type="button" onClick={() => setToast('以下单页和店铺说明为准')}>
            <span className={`${styles.pcTag} ${styles.pcSvc}`}>保</span> 服务说明以下单页和店铺规则为准 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </section>

      <section className={styles.modeSection}>
        <div className={styles.modeBar}>
          <button
            className={`${styles.modeTab} ${currentTab === 'direct' ? styles.modeDirectOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('direct')}
          >
            <span className={styles.modeIcon}>🛒</span> 直购 <span className={styles.modePrice}>¥{directPrice}</span>
          </button>
          {activeGuess ? (
            <button
              className={`${styles.modeTab} ${currentTab === 'guess' ? styles.modeGuessOn : ''}`}
              type="button"
              onClick={() => setCurrentTab('guess')}
            >
              <span className={styles.modeIcon}>🎲</span> 竞猜 <span className={styles.modePrice}>¥{guessPrice}</span>
            </button>
          ) : null}
          <button
            className={`${styles.modeTab} ${currentTab === 'inv' ? styles.modeInvOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('inv')}
          >
            <span className={styles.modeIcon}>💰</span> 换购 <span className={styles.modePrice}>¥{directPrice}</span>
          </button>
        </div>
      </section>

      <section className={styles.specSection}>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>标签</div>
          <div className={styles.specScroll}>
            {product.tags.length ? product.tags.map((item) => (
              <span className={styles.specChipOn} key={item}>
                <span className={styles.specDot} />
                {item}
              </span>
            )) : <span className={styles.specChip}>暂无标签</span>}
          </div>
        </div>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>库存</div>
          <div className={styles.specScroll}>
            <span className={styles.specChipOn}>
              现货库存 {product.stock}
              <span className={styles.specDp}>{product.stock > 0 ? '可下单' : '缺货'}</span>
            </span>
            {product.shopName ? <span className={styles.specChip}>店铺：{product.shopName}</span> : null}
          </div>
        </div>
        <div className={styles.specFoot}>
          <span className={styles.specFootSel}>
            当前商品 <b>{product.brand}</b> / <b>{product.category}</b>
          </span>
          <span className={styles.specFootPrice}>
            ¥{activePrice} <small>{product.stock > 0 ? '现价' : '暂不可下单'}</small>
          </span>
        </div>
      </section>

      <section className={styles.body}>
        {currentTab === 'guess' ? (
          <>
            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.guessHero}>
                  <div className={styles.guessHeroTop}>
                    <div className={styles.guessLabel}>竞猜价格</div>
                  </div>
                  <div className={styles.guessPrice}>
                    <small>¥</small>
                    {guessPrice}
                  </div>
                  <div className={styles.guessSub}>原价 ¥{product.originalPrice}</div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>
                    <i className="fa-solid fa-chart-pie" style={{ color: '#ff6b00' }} /> 当前进度
                  </div>
                  <div className={styles.panelMore}>
                    剩余 <strong>{remainingSlots}</strong> 个名额
                  </div>
                </div>
                <div className={styles.ringSection}>
                  <div className={styles.ringWrap}>
                    <div className={styles.ringInner}>
                      <span className={styles.ringPct}>{guessPercent}%</span>
                      <span className={styles.ringLabel}>已满</span>
                    </div>
                  </div>
                  <div className={styles.ringInfo}>
                    <div className={styles.ringStat}>
                      <strong>{guessTotalVotes}</strong>
                      <span>/50 人</span>
                    </div>
                    <div className={styles.ringStatLabel}>已参与人数</div>
                    <div className={styles.ringStat}>
                      <strong>¥{product.price}</strong>
                    </div>
                    <div className={styles.ringStatLabel}>商品市场价值</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>
                    <i className="fa-solid fa-hand-pointer" style={{ color: '#ff6b00' }} /> 选择竞猜
                  </div>
                </div>
                <div className={styles.guessOptions}>
                  {(activeGuess?.options || []).map((option: GuessOption, index: number) => {
                    const percent = guessTotalVotes > 0 ? Math.round((option.voteCount / guessTotalVotes) * 100) : 0;
                    return (
                      <button
                        className={`${styles.guessOption} ${selectedGuessOpt === index ? styles.guessOptionSelected : ''}`}
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedGuessOpt(index)}
                      >
                        <span className={styles.optionRadio} />
                        <span className={styles.optionName}>{option.optionText}</span>
                        <span className={styles.optionOdds}>{option.odds.toFixed(1)}x</span>
                        <span className={styles.optionDesc}>{`当前占比 · ${percent}%`}</span>
                        <span className={styles.optionBar}>
                          <span style={{ width: `${percent}%` }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!activeGuess ? <div className={styles.directRow}>当前暂无进行中的竞猜。</div> : null}
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>
                    <i className="fa-solid fa-users" style={{ color: '#ff6b00' }} /> 参与记录
                  </div>
                  <div className={styles.panelMore}>共 {guessTotalVotes} 人</div>
                </div>
                <div className={styles.recList}>
                  {(activeGuess?.options || []).map((item, index) => {
                    const percent = guessTotalVotes > 0 ? Math.round((item.voteCount / guessTotalVotes) * 100) : 0;
                    return (
                      <div className={styles.recItem} key={item.id}>
                        <img src={product.img} alt={item.optionText} />
                        <div className={styles.recInfo}>
                          <div className={styles.recName}>{item.optionText}</div>
                          <div className={styles.recTime}>{item.voteCount} 票 · 当前占比 {percent}%</div>
                        </div>
                        <span className={index === 0 ? styles.recTagBig : styles.recTagSmall}>
                          {index === 0 ? '高热度' : '待反转'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button className={styles.guessMore} type="button" onClick={() => setToast('查看全部')}>
                  查看更多 <i className="fa-solid fa-chevron-down" />
                </button>
              </div>
            </div>

            {guessCountdown ? (
              <div className={styles.panel}>
                <div className={styles.panelInner}>
                  <div className={styles.panelHead}>
                    <div className={styles.panelTitle}><i className="fa-solid fa-clock" style={{ color: '#E64A19' }} /> 倒计时</div>
                  </div>
                  <div className={styles.countdownBar}>
                    <div className={styles.countdownBox}>{guessCountdown.hours}</div>
                    <div className={styles.countdownSep}>:</div>
                    <div className={styles.countdownBox}>{guessCountdown.minutes}</div>
                    <div className={styles.countdownSep}>:</div>
                    <div className={styles.countdownBox}>{guessCountdown.seconds}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : currentTab === 'direct' ? (
          <>
            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.directHero}>
                  <div className={styles.directLabel}>直购价</div>
                  <div className={styles.directPrice}>
                    <small>¥</small>
                    {directPrice}
                  </div>
                  <div className={styles.directRow}>
                    <span className={styles.directOrig}>¥{product.originalPrice}</span>
                    <span className={styles.directSave}>省 ¥{Math.max(0, product.originalPrice - directPrice)}</span>
                  </div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>
                    <i className="fa-solid fa-ticket" style={{ color: '#4e6ae6' }} /> 优惠券
                  </div>
                </div>
                <div className={styles.couponStrip}>
                  {coupons.length ? coupons.map((coupon) => (
                    <div className={styles.couponCard} key={coupon.id}>
                      <strong>{coupon.type === 'shipping' ? '包邮' : `¥${coupon.amount}`}</strong>
                      <div>
                        <span>{coupon.condition}</span>
                        <em>{coupon.name}</em>
                      </div>
                    </div>
                  )) : (
                    <div className={styles.couponCard}>
                      <strong>暂无</strong>
                      <div>
                        <span>当前暂无可用优惠券</span>
                        <em>以领券中心为准</em>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}><i className="fa-solid fa-shield-halved" style={{ color: '#4e6ae6' }} /> 服务保障</div>
                </div>
                <div className={styles.serviceGrid}>
                  {[
                    '服务能力以下单页为准',
                    '发货时效以店铺说明为准',
                    '售后规则以下单结果为准',
                  ].map((item) => (
                    <div className={styles.serviceItem} key={item}>
                      <span><i className="fa-solid fa-check" /></span>
                      <em>{item}</em>
                    </div>
                  ))}
                </div>
                <div className={styles.compareRow}>
                  {activeGuess ? (
                    <button className={styles.compareCard} type="button" onClick={() => setCurrentTab('guess')}>
                      <span>竞猜价</span>
                      <strong>¥{guessPrice}</strong>
                      <em>去竞猜 <i className="fa-solid fa-arrow-right" /></em>
                    </button>
                  ) : null}
                  <button className={styles.compareCardGreen} type="button" onClick={() => setCurrentTab('inv')}>
                    <span>换购价</span>
                    <strong>¥{directPrice}</strong>
                    <em>去换购 <i className="fa-solid fa-arrow-right" /></em>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.invHero}>
                  <div className={styles.invLabel}>库存抵扣</div>
                  <div className={styles.invPrice}>
                    <small>¥</small>
                    {directPrice}
                  </div>
                  <div className={styles.invRow}>用仓库库存商品抵扣商品价值</div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>
                    <i className="fa-solid fa-calculator" style={{ color: '#00875A' }} /> 换购计算
                  </div>
                  <button className={styles.panelMore} type="button" onClick={() => setExchangeOpen(true)}>
                    选择抵扣
                  </button>
                </div>
                <div className={styles.exchangeVis}>
                  <div className={styles.exchangeBlock}>
                    <div className={styles.exchangeValueMuted}>¥{directPrice}</div>
                    <div className={styles.exchangeLabel}>商品售价</div>
                  </div>
                  <div className={styles.exchangeArrow}>-</div>
                  <div className={styles.exchangeBlock}>
                    <div className={styles.exchangeValueAccent}>¥{selectedDeduct}</div>
                    <div className={styles.exchangeLabel}>库存可抵</div>
                  </div>
                  <div className={styles.exchangeArrow}>=</div>
                  <div className={styles.exchangeBlock}>
                    <div className={styles.exchangeValueGreen}>¥{exchangeToPay}</div>
                    <div className={styles.exchangeLabel}>预计补差价</div>
                  </div>
                </div>
                {inventoryTotalValue >= directPrice ? (
                  <div className={styles.exchangeCoverTip}>
                    <i className="fa-solid fa-check-circle" /> 库存充足，可免费换购此商品
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}><i className="fa-solid fa-boxes-stacked" style={{ color: '#00875A' }} /> 我的仓库库存</div>
                  <button className={styles.panelMore} type="button" onClick={() => setExchangeOpen(true)}>
                    选择抵扣
                  </button>
                </div>
                <div className={styles.inventorySummary}>
                  共 {warehouseItems.length} 件可用库存，总价值 <strong>¥{inventoryTotalValue.toFixed(2).replace(/\.00$/, '')}</strong>
                </div>
                <div className={styles.inventoryList}>
                  {inventoryPreview.map((item: WarehouseItem) => (
                    <div className={styles.inventoryItem} key={item.id}>
                      <img src={item.productImg || product.img} alt={item.productName} />
                      <div className={styles.inventoryInfo}>
                        <div className={styles.inventoryName}>{item.productName}</div>
                        <div className={styles.inventoryMeta}>来源：{item.sourceType}</div>
                      </div>
                      <span className={styles.inventoryPrice}>¥{Number(item.price ?? 0)}</span>
                    </div>
                  ))}
                  {warehouseItems.length === 0 ? <div className={styles.directRow}>当前没有可用于换购的同款库存。</div> : null}
                </div>
                {warehouseItems.length > 3 ? (
                  <button className={styles.inventoryMore} type="button" onClick={() => setExchangeOpen(true)}>
                    查看全部 {warehouseItems.length} 件 <i className="fa-solid fa-chevron-right" />
                  </button>
                ) : null}
                <div className={styles.planBanner}>
                  <div className={styles.planIcon}>💡</div>
                  <div className={styles.planBody}>
                    <div className={styles.planTitle}>推荐方案</div>
                    <div className={styles.planDesc}>
                      选择 {warehouseItems.length} 件库存（价值 ¥{inventoryTotalValue.toFixed(2).replace(/\.00$/, '')}）
                      {inventoryTotalValue >= directPrice ? '，可完全覆盖' : `，需补差价 ¥${exchangeToPay}`}
                    </div>
                  </div>
                  <button className={styles.planCta} type="button" onClick={() => setExchangeOpen(true)}>
                    去选择
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
                <div className={styles.panelInner}>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>
                    <i className="fa-solid fa-list-ol" style={{ color: '#00875A' }} /> 换购流程
                  </div>
                </div>
                <div className={styles.flowSteps}>
                  {['选择抵扣', '确认价格', '下单发货'].map((item, index) => (
                    <div className={styles.flowStep} key={item}>
                      <div className={styles.flowNum}>{index + 1}</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {activeGuess ? (
                  <div className={styles.flowLeadRow}>
                    库存不够？{' '}
                    <button type="button" onClick={() => setCurrentTab('guess')}>
                      去竞猜赚库存
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}><i className="fa-solid fa-file-lines" style={{ color: '#999' }} /> 商品详情</div>
            </div>
            <div className={`${styles.detailText} ${detailExpanded ? styles.detailExpanded : ''}`}>
              {`${product.description}

• 品牌：${product.brand}
• 分类：${product.category}
• 店铺：${product.shopName || '优米平台'}
• 库存：${product.stock}
• 标签：${product.tags.length ? product.tags.join(' / ') : '暂无标签'}
• 发货与售后：以真实订单和店铺说明为准
`}
            </div>
            <button className={styles.detailToggle} type="button" onClick={() => setDetailExpanded((value) => !value)}>
              {detailExpanded ? '收起' : '展开全部'} <span><i className={`fa-solid ${detailExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></span>
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}><i className="fa-solid fa-comment-dots" style={{ color: '#FFB400' }} /> 用户评价 <span>({reviewCount})</span></div>
              <button className={styles.panelMore} type="button" onClick={() => setToast('查看全部评价')}>
                全部 <i className="fa-solid fa-chevron-right" style={{ fontSize: 8 }} />
              </button>
            </div>
            {reviews.length ? reviews.map((review) => (
              <div className={styles.reviewItem} key={review.id}>
                <img src={review.userAvatar || product.img} alt={review.userName} />
                <div className={styles.reviewBody}>
                  <div className={styles.reviewName}>
                    {review.userName}
                    <span className={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(Math.max(0, 5 - review.rating))}</span>
                  </div>
                  <div className={styles.reviewText}>{review.content || '该用户未填写评价内容。'}</div>
                  <div className={styles.reviewFoot}>
                    <span>{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className={styles.directRow}>暂无用户评价。</div>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.recommendTitle}><i className="fa-solid fa-fire" style={{ color: '#ff6b35' }} /> 猜你喜欢</div>
          <div className={styles.recommendGrid}>
            {recommendations.map((item) => (
              <Link className={styles.recommendItem} href={`/product/${item.id}`} key={item.id}>
                <img className={styles.recommendImg} src={item.img} alt={item.name} />
                <div className={styles.recommendName}>{item.name}</div>
                <div className={styles.recommendPrice}>¥{item.price}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

      {exchangeOpen ? (
        <div className={styles.exchangeOverlay}>
          <button className={styles.exchangeMask} type="button" onClick={() => setExchangeOpen(false)} />
          <section className={styles.exchangeSheet}>
            <div className={styles.exchangeHeader}>
              <div className={styles.exchangeTitle}>库存换购</div>
              <button type="button" onClick={() => setExchangeOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.exchangeTarget}>
              <img src={product.img} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <strong>
                  <small>¥</small>
                  {product.price}
                  {product.originalPrice > product.price ? <em>¥{product.originalPrice}</em> : null}
                </strong>
                <div className={styles.exchangeTargetTags}>
                  <span>库存换购</span>
                  <span className={styles.exchangeTargetTagGreen}>真实库存抵扣</span>
                </div>
                <p>实际补差价以当前选中的库存抵扣结果为准。</p>
              </div>
            </div>
            <div className={styles.exchangePlan}>
              <div className={styles.exchangePlanCard}>
                <div className={styles.exchangePlanIcon}>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </div>
                <div className={styles.exchangePlanInfo}>
                  <div className={styles.exchangePlanLabel}>推荐方案</div>
                  <div className={styles.exchangePlanDesc}>
                    当前仓库共 {warehouseItems.length} 件库存，可抵扣 ¥{selectedDeduct || inventoryTotalValue.toFixed(2).replace(/\.00$/, '')}
                  </div>
                </div>
                <button className={styles.exchangePlanBtn} type="button" onClick={() => {
                  setSelectedWarehouse(warehouseItems.map((item: WarehouseItem) => item.id));
                  setToast('✨ 已应用最优方案');
                }}>
                  一键选用
                </button>
              </div>
            </div>
            <div className={styles.exchangeBody}>
              <div className={styles.exchangeBodyTitle}>
                <i className="fa-solid fa-box-open" /> 我的仓库库存
              </div>
              {warehouseItems.map((item: WarehouseItem) => (
                <button
                  className={selectedWarehouse.includes(item.id) ? styles.exchangeCardSelected : styles.exchangeCard}
                  type="button"
                  key={item.id}
                  onClick={() =>
                    setSelectedWarehouse((current) =>
                      current.includes(item.id)
                        ? current.filter((id) => id !== item.id)
                        : [...current, item.id],
                    )
                  }
                >
                  <img src={item.productImg || product.img} alt={item.productName} />
                  <span className={styles.exchangeCardCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                  <div className={styles.exchangeCardInfo}>
                    <div className={styles.exchangeCardName}>{item.productName}</div>
                    <div className={styles.exchangeCardMeta}>{item.sourceType}</div>
                    <div className={styles.exchangeCardRow}>
                      <span className={styles.exchangeCardPrice}>
                        <small>¥</small>
                        {Number(item.price ?? 0)}
                      </span>
                      <span className={styles.exchangeCardSource}>可抵扣</span>
                    </div>
                  </div>
                </button>
              ))}
              {warehouseItems.length === 0 ? <div className={styles.directRow}>当前没有可用于换购的同款库存。</div> : null}
            </div>
            <div className={styles.exchangeFooter}>
              {exchangeOverflow > 0 ? (
                <div className={styles.exchangeWarn}>
                  <i className="fa-solid fa-triangle-exclamation" />
                  <div>
                    当前选中库存超出商品价值 <strong>¥{exchangeOverflow}</strong>，确认后会按当前方案换购。
                  </div>
                </div>
              ) : null}
              <div className={styles.exchangeSummary}>
                <div>
                  <span>已选</span>
                  <strong>{selectedWarehouse.length}</strong>
                </div>
                <i className={styles.exchangeDivider} />
                <div>
                  <span>预计抵扣</span>
                  <strong className={styles.exchangeSummaryAccent}>¥{selectedDeduct}</strong>
                </div>
                <i className={styles.exchangeDivider} />
                <div>
                  <span>需补差价</span>
                  <strong className={styles.exchangeSummaryGreen}>¥{exchangeToPay}</strong>
                </div>
              </div>
              <button
                className={styles.exchangeConfirm}
                disabled={selectedWarehouse.length === 0}
                type="button"
                onClick={() => {
                  if (selectedWarehouse.length === 0) return;
                  if (exchangeOverflow > 0) {
                    setExchangeConfirmOpen(true);
                    return;
                  }
                  setExchangeOpen(false);
                  router.push(`/payment?from=exchange&pid=${encodeURIComponent(product.id)}&qty=1`);
                }}
                style={{
                  background:
                    selectedWarehouse.length === 0
                      ? '#D9D9D9'
                      : exchangeOverflow > 0
                        ? 'linear-gradient(135deg,#FFA726,#FF7043)'
                        : 'linear-gradient(135deg,#2DC88A,#00875A)',
                }}
              >
                {selectedWarehouse.length === 0
                  ? '请选择要抵扣的库存'
                  : exchangeOverflow > 0
                    ? `确认换购（超出 ¥${exchangeOverflow}）`
                    : exchangeToPay > 0
                      ? `确认换购 · 补差价 ¥${exchangeToPay}`
                      : '确认换购（库存完全覆盖）'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {exchangeConfirmOpen ? (
        <div className={styles.exchangeConfirmDialog}>
          <button className={styles.exchangeMask} type="button" onClick={() => setExchangeConfirmOpen(false)} />
          <div className={styles.exchangeConfirmCard}>
            <div className={styles.exchangeConfirmIcon}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div className={styles.exchangeConfirmTitle}>超额抵扣确认</div>
            <div className={styles.exchangeConfirmDesc}>
              当前选中的库存价值高于商品售价，超出部分为 <strong>¥{exchangeOverflow}</strong>。
            </div>
            <div className={styles.exchangeConfirmBtns}>
              <button type="button" onClick={() => setExchangeConfirmOpen(false)}>重新选择</button>
              <button
                type="button"
                onClick={() => {
                  setExchangeConfirmOpen(false);
                  setExchangeOpen(false);
                  router.push(`/payment?from=exchange&pid=${encodeURIComponent(product.id)}&qty=1`);
                }}
              >
                确认换购
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
