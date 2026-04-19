'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { GuessOption, ProductSummary, WarehouseItem } from '@joy/shared';

import { fetchProductDetail } from '../../../lib/api';
import styles from './page.module.css';

const reviews = [
  {
    user: '阿柠',
    avatar: '/legacy/images/mascot/mouse-main.png',
    stars: 5,
    text: '正品！质量很好，包装完好无损，物流也很快！',
    time: '2 小时前',
    likes: 327,
  },
  {
    user: '零食控',
    avatar: '/legacy/images/mascot/mouse-happy.png',
    stars: 5,
    text: '买了好多次了，品质稳定，价格实惠，竞猜超有趣。',
    time: '3 天前',
    likes: 215,
  },
];

const colorOptions = ['曜黑', '雾白', '奶咖', '樱桃红'];
const sizeOptions = ['39', '40', '41', '42'];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<null | {
    id: string;
    name: string;
    brand: string;
    img: string;
    price: number;
    guessPrice: number;
    category: string;
    status: string;
    shopId: string | null;
    shopName: string | null;
    images: string[];
    originalPrice: number;
    stock: number;
    tags: string[];
    description: string;
  }>(null);
  const [activeGuess, setActiveGuess] = useState<null | {
    id: string;
    title: string;
    options: GuessOption[];
  }>(null);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [recommendations, setRecommendations] = useState<ProductSummary[]>([]);
  const [currentTab, setCurrentTab] = useState<'direct' | 'guess' | 'inv'>('direct');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [favActive, setFavActive] = useState(false);
  const [selectedGuessOpt, setSelectedGuessOpt] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>(['vw-1']);
  const [reviewLikes, setReviewLikes] = useState<number[]>(reviews.map((item) => item.likes));
  const [toast, setToast] = useState('');
  const productId = typeof params?.id === 'string' ? params.id : '';

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        const result = await fetchProductDetail(productId);
        if (ignore) {
          return;
        }
        setProduct(result.product);
        setActiveGuess(
          result.activeGuess
            ? {
                id: result.activeGuess.id,
                title: result.activeGuess.title,
                options: result.activeGuess.options,
              }
            : null,
        );
        setWarehouseItems(result.warehouseItems);
        setRecommendations(result.recommendations);
        if (!result.activeGuess) {
          setCurrentTab('direct');
        }
      } catch {
        if (!ignore) {
          setProduct(null);
          setActiveGuess(null);
          setWarehouseItems([]);
          setRecommendations([]);
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
  const invPrice = useMemo(() => Math.max(0, directPrice - 120), [directPrice]);
  const selectedDeduct = selectedWarehouse.reduce((sum, id) => {
    const item = warehouseItems.find((entry: WarehouseItem) => entry.id === id);
    return sum + (item ? Number(item.price ?? 0) : 0);
  }, 0);
  const exchangeOverflow = Math.max(0, selectedDeduct - directPrice);
  const exchangeToPay = Math.max(0, directPrice - selectedDeduct);

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

  const activePrice = currentTab === 'guess' ? guessPrice : currentTab === 'inv' ? invPrice : directPrice;

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
              <div className={styles.recommendTitle}>商品不存在</div>
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
        <div className={styles.navTitle}>商品详情</div>
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
              onClick={() => setCurrentSlide(index)}
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
            <span className={`${styles.priceTag} ${styles.tagHot}`}>热门</span>
            <span className={`${styles.priceTag} ${styles.tagOff}`}>低价</span>
          </div>
        </div>
        <div className={styles.titleArea}>
          <span className={`${styles.titleBadge} ${styles.selfBadge}`}>自营</span>
          <span className={`${styles.titleBadge} ${styles.authBadge}`}>认证</span>
          <span className={`${styles.titleBadge} ${styles.guessBadge}`}>竞猜</span>
          <span className={styles.productTitle}>{product.name}</span>
        </div>
        <div className={styles.productSub}>
          <span>{product.brand}</span>
          <span className={styles.sep}>·</span>
          <span>{product.category}</span>
          <span className={styles.sep}>·</span>
          <span>{guessPrice} 竞猜价</span>
        </div>
        <div className={styles.promoStrip}>
          <button className={styles.promoChip} type="button" onClick={() => setToast('领取优惠券')}>
            <span className={`${styles.pcTag} ${styles.pcCoupon}`}>券</span> 满 50 减 5 <i className="fa-solid fa-chevron-right" />
          </button>
          <button className={styles.promoChip} type="button" onClick={() => setCurrentTab('guess')}>
            <span className={`${styles.pcTag} ${styles.pcGuess}`}>猜</span> ¥{guessPrice}参与竞猜赢商品 <i className="fa-solid fa-chevron-right" />
          </button>
          <button className={styles.promoChip} type="button" onClick={() => setToast('服务保障')}>
            <span className={`${styles.pcTag} ${styles.pcSvc}`}>保</span> 正品 · 24h发货 · 7天退换 <i className="fa-solid fa-chevron-right" />
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
          <button
            className={`${styles.modeTab} ${currentTab === 'guess' ? styles.modeGuessOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('guess')}
          >
            <span className={styles.modeIcon}>🎲</span> 竞猜 <span className={styles.modePrice}>¥{guessPrice}</span>
          </button>
          <button
            className={`${styles.modeTab} ${currentTab === 'inv' ? styles.modeInvOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('inv')}
          >
            <span className={styles.modeIcon}>💰</span> 换购 <span className={styles.modePrice}>¥{invPrice}</span>
          </button>
        </div>
      </section>

      <section className={styles.specSection}>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>颜色</div>
          <div className={styles.specScroll}>
            {colorOptions.map((item, index) => (
              <button
                className={selectedColor === index ? styles.specChipOn : styles.specChip}
                key={item}
                type="button"
                onClick={() => setSelectedColor(index)}
              >
                <span className={styles.specDot} />
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>尺码</div>
          <div className={styles.specScroll}>
            {sizeOptions.map((item, index) => (
              <button
                className={selectedSize === index ? styles.specChipOn : styles.specChip}
                key={item}
                type="button"
                onClick={() => setSelectedSize(index)}
              >
                {item}
                <span className={styles.specDp}>现货</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.specFoot}>
          <span className={styles.specFootSel}>
            已选 <b>{colorOptions[selectedColor]}</b> / <b>{sizeOptions[selectedSize]}</b>
          </span>
          <span className={styles.specFootPrice}>
            ¥{activePrice} <small>现价</small>
          </span>
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>
                <span>⟡</span> {currentTab === 'guess' ? '竞猜玩法' : currentTab === 'inv' ? '换购玩法' : '直购玩法'}
              </div>
              <button className={styles.panelMore} type="button" onClick={() => setCurrentTab('guess')}>
                去竞猜
              </button>
            </div>

            {currentTab === 'guess' ? (
              <>
                <div className={styles.guessHero}>
                  <div className={styles.guessHeroTop}>
                    <div className={styles.guessLabel}>竞猜价格</div>
                    <span className={styles.guessTag}>热门</span>
                  </div>
                  <div className={styles.guessPrice}>
                    <small>¥</small>
                    {guessPrice}
                  </div>
                  <div className={styles.guessSub}>原价 ¥{product.originalPrice}</div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>当前进度</div>
                  <div className={styles.panelMore}>
                    剩余 <strong>{Math.max(0, 50 - (activeGuess?.options.reduce((sum, option) => sum + option.voteCount, 0) || 0))}</strong> 个名额
                  </div>
                </div>
                <div className={styles.ringSection}>
                  <div className={styles.ringWrap}>
                    <div className={styles.ringInner}>
                      <span className={styles.ringPct}>
                        {Math.min(
                          100,
                          Math.round((((activeGuess?.options.reduce((sum, option) => sum + option.voteCount, 0) || 0) / 50) * 100)),
                        )}
                        %
                      </span>
                      <span className={styles.ringLabel}>已满</span>
                    </div>
                  </div>
                  <div className={styles.ringInfo}>
                    <div className={styles.ringStat}>
                      <strong>{activeGuess?.options.reduce((sum, option) => sum + option.voteCount, 0) || 0}</strong>
                      <span>/50 人</span>
                    </div>
                    <div className={styles.ringStatLabel}>已参与人数</div>
                    <div className={styles.ringStat}>
                      <strong>¥{product.price}</strong>
                    </div>
                    <div className={styles.ringStatLabel}>商品市场价值</div>
                  </div>
                </div>
                <div className={styles.guessOptions}>
                  {(activeGuess?.options || []).map((option: GuessOption, index: number) => {
                    const totalVotes = activeGuess?.options.reduce((sum, item) => sum + item.voteCount, 0) || 0;
                    const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
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
                <button className={styles.guessMore} type="button" onClick={() => setToast('查看全部')}>
                  查看更多 <i className="fa-solid fa-chevron-down" />
                </button>
                <div className={styles.recList}>
                  {[
                    { name: '美食猎人', choice: '猜大', time: '2 分钟前', av: '/legacy/images/mascot/mouse-main.png', cls: styles.recTagBig },
                    { name: '零食控小王', choice: '猜小', time: '5 分钟前', av: '/legacy/images/mascot/mouse-happy.png', cls: styles.recTagSmall },
                    { name: '零食猎人', choice: '猜大', time: '8 分钟前', av: '/legacy/images/mascot/mouse-casual.png', cls: styles.recTagBig },
                  ].map((item) => (
                    <div className={styles.recItem} key={`${item.name}-${item.time}`}>
                      <img src={item.av} alt={item.name} />
                      <div className={styles.recInfo}>
                        <div className={styles.recName}>{item.name}</div>
                        <div className={styles.recTime}>{item.time}</div>
                      </div>
                      <span className={item.cls}>{item.choice}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : currentTab === 'direct' ? (
              <>
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
                  <div className={styles.panelTitle}>优惠券</div>
                </div>
                <div className={styles.couponStrip}>
                  <div className={styles.couponCard}>
                    <strong>¥5</strong>
                    <div>
                      <span>满 50 可用</span>
                      <em>领取</em>
                    </div>
                  </div>
                  <div className={styles.couponCard}>
                    <strong>¥15</strong>
                    <div>
                      <span>满 100 可用</span>
                      <em>领取</em>
                    </div>
                  </div>
                  <div className={styles.couponCard}>
                    <strong>¥20</strong>
                    <div>
                      <span>新人专享</span>
                      <em>领取</em>
                    </div>
                  </div>
                </div>
                <div className={styles.serviceGrid}>
                  {['正品保证', '24h发货', '顺丰包邮', '7天退换', '运费险', '极速退款'].map((item) => (
                    <div className={styles.serviceItem} key={item}>
                      <span><i className="fa-solid fa-check" /></span>
                      <em>{item}</em>
                    </div>
                  ))}
                </div>
                <div className={styles.compareRow}>
                  <button className={styles.compareCard} type="button" onClick={() => setCurrentTab('guess')}>
                    <span>竞猜价</span>
                    <strong>¥{guessPrice}</strong>
                    <em>去竞猜 <i className="fa-solid fa-arrow-right" /></em>
                  </button>
                  <button className={styles.compareCardGreen} type="button" onClick={() => setCurrentTab('inv')}>
                    <span>换购价</span>
                    <strong>¥{invPrice}</strong>
                    <em>去换购 <i className="fa-solid fa-arrow-right" /></em>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.invHero}>
                  <div className={styles.invLabel}>库存换购</div>
                  <div className={styles.invPrice}>
                    <small>¥</small>
                    {invPrice}
                  </div>
                  <div className={styles.invRow}>用仓库库存商品抵扣商品价值</div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>换购计算</div>
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
                    <div className={styles.exchangeValueGreen}>¥0</div>
                    <div className={styles.exchangeLabel}>免费换购</div>
                  </div>
                </div>
                <div className={styles.inventoryList}>
                  {warehouseItems.map((item: WarehouseItem) => (
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
                <div className={styles.flowSteps}>
                  {['选择抵扣', '确认价格', '下单发货'].map((item, index) => (
                    <div className={styles.flowStep} key={item}>
                      <div className={styles.flowNum}>{index + 1}</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>商品详情</div>
            </div>
            <div className={`${styles.detailText} ${detailExpanded ? styles.detailExpanded : ''}`}>
              {`${product.description}

• 品牌：${product.brand}
• 分类：${product.category}
• 发货：24小时内发货，顺丰/中通
• 保障：7天无理由退换，正品保证

优米独家渠道商品，支持直购、竞猜、库存换购三种方式。`}
            </div>
            <button className={styles.detailToggle} type="button" onClick={() => setDetailExpanded((value) => !value)}>
              {detailExpanded ? '收起' : '展开全部'} <span><i className={`fa-solid ${detailExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></span>
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}><i className="fa-solid fa-comment-dots" style={{ color: '#FFB400' }} /> 用户评价 <span>{reviews.length}</span></div>
              <button className={styles.panelMore} type="button" onClick={() => setToast('查看全部评价')}>
                全部 <i className="fa-solid fa-chevron-right" style={{ fontSize: 8 }} />
              </button>
            </div>
              {reviews.map((review, index) => (
              <article className={styles.reviewItem} key={review.user}>
                <img src={review.avatar} alt={review.user} />
                <div className={styles.reviewBody}>
                  <div className={styles.reviewName}>
                    {review.user}
                    <span className={styles.reviewStars}>★★★★★</span>
                  </div>
                  <div className={styles.reviewText}>{review.text}</div>
                  <div className={styles.reviewFoot}>
                    <span>{review.time}</span>
                    <button
                      className={styles.reviewLike}
                      type="button"
                      onClick={() => {
                        setReviewLikes((current) =>
                          current.map((likes, itemIndex) => (itemIndex === index ? likes + 1 : likes)),
                        );
                        setToast('已点赞');
                      }}
                    >
                      <i className="fa-regular fa-thumbs-up" /> {reviewLikes[index]}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.recommendTitle}>猜你喜欢</div>
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
            <span><i className="fa-solid fa-store" /></span>
            <em>店铺</em>
          </Link>
          <button
            className={`${styles.barIcon} ${favActive ? styles.barIconFavActive : ''}`}
            type="button"
            onClick={() => {
              setFavActive((value) => {
                const next = !value;
                setToast(next ? '已收藏 ❤️' : '取消收藏');
                return next;
              });
            }}
          >
            <span><i className={`fa-${favActive ? 'solid' : 'regular'} fa-heart`} /></span>
            <em>收藏</em>
          </button>
          <button className={styles.barIcon} type="button" onClick={() => setToast('💬 正在接入客服...')}>
            <span><i className="fa-regular fa-comment-dots" /></span>
            <em>客服</em>
          </button>
        </div>
        <div className={styles.barBtns}>
          <button
            className={styles.barSub}
            type="button"
            onClick={() => {
              if (currentTab === 'guess') router.push('/guess-history');
              else if (currentTab === 'inv') router.push('/warehouse');
              else setToast('已加入购物车 🛒');
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
                  `/payment?from=product&pid=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(String(directPrice))}&img=${encodeURIComponent(product.img)}`,
                );
              }
              else setExchangeOpen(true);
            }}
          >
            {currentTab === 'guess' ? `参与竞猜 ¥${guessPrice}` : currentTab === 'inv' ? `换购 ¥${invPrice}` : `立即购买 ¥${directPrice}`}
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
                <strong>¥{product.price}</strong>
                <p>当前可用库存合计足以抵扣这件商品的绝大部分价格。</p>
              </div>
            </div>
            <div className={styles.exchangeBody}>
                <div className={styles.exchangeBodyTitle}>我的仓库库存</div>
              <button className={styles.exchangePlanBtn} type="button" onClick={() => {
                setSelectedWarehouse(warehouseItems.map((item: WarehouseItem) => item.id));
                setToast('✨ 已应用最优方案');
              }}>
                一键选用
              </button>
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
                  <div className={styles.exchangeCardInfo}>
                    <div className={styles.exchangeCardName}>{item.productName}</div>
                    <div className={styles.exchangeCardMeta}>{item.sourceType}</div>
                  </div>
                  <div className={styles.exchangeCardPrice}>¥{Number(item.price ?? 0)}</div>
                </button>
              ))}
              {warehouseItems.length === 0 ? <div className={styles.directRow}>当前没有可用于换购的同款库存。</div> : null}
            </div>
            <div className={styles.exchangeFooter}>
              <div className={styles.exchangeSummary}>
                <div>
                  <span>已选</span>
                  <strong>{selectedWarehouse.length}</strong>
                </div>
                <div>
                  <span>预计抵扣</span>
                  <strong>¥{selectedDeduct}</strong>
                </div>
                <div>
                  <span>需补差价</span>
                  <strong>¥{exchangeToPay}</strong>
                </div>
              </div>
              <button
                className={styles.exchangeConfirm}
                disabled={selectedWarehouse.length === 0}
                type="button"
                onClick={() => {
                  if (selectedWarehouse.length === 0) return;
                  setExchangeOpen(false);
                  router.push(
                    `/payment?from=exchange&pid=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}&price=${encodeURIComponent(String(exchangeToPay || 0.01))}&img=${encodeURIComponent(product.img)}`,
                  );
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

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
