'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { fetchShopDetail } from '../../../lib/api';
import styles from './page.module.css';

type TabKey = 'all' | 'hot' | 'guess' | 'new';
type FilterKey = 'default' | 'sales' | 'price' | 'rating';

const coupons = [
  { value: 5, name: '新人专享', cond: '满29可用' },
  { value: 10, name: '店铺满减', cond: '满59可用' },
  { value: 20, name: '品牌大额', cond: '满99可用' },
  { value: 50, name: '限时特惠', cond: '满199可用' },
];

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

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const routeParams = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<Awaited<ReturnType<typeof fetchShopDetail>> | null>(null);
  const [tab, setTab] = useState<TabKey>('all');
  const [filter, setFilter] = useState<FilterKey>('default');
  const [followed, setFollowed] = useState(false);
  const [shopFavorited, setShopFavorited] = useState(false);
  const [claimedCoupons, setClaimedCoupons] = useState<number[]>([]);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
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

  const shopId = typeof routeParams?.id === 'string' ? routeParams.id : params.id;

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchShopDetail(shopId);
        if (!ignore) {
          setShopData(result);
        }
      } catch {
        if (!ignore) {
          setShopData(null);
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
  }, [shopId]);

  const meta = shopData?.shop
    ? {
        full: shopData.shop.name,
        desc: shopData.shop.description || '品质保证 · 正品行货',
        city: shopData.shop.city || '中国',
        fans: formatNum(shopData.shop.fans),
        grade:
          shopData.shop.brandAuthCount > 8
            ? '至尊商家'
            : shopData.shop.brandAuthCount > 3
              ? '皇冠商家'
              : '金牌商家',
      }
    : {
        full: decodeURIComponent(searchParams.get('brand') || params.id || '店铺'),
        desc: '品质保证 · 正品行货',
        city: '中国',
        fans: '0',
        grade: '金牌商家',
      };

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
  const avgRating = useMemo(() => {
    if (!shopProducts.length) return '4.8';
    return (
      shopProducts.reduce((sum, item) => sum + item.rating, 0) /
      shopProducts.length
    ).toFixed(1);
  }, [shopProducts]);

  const showAll = tab === 'all';
  const showHot = tab === 'hot';
  const showGuess = tab === 'guess';
  const showNew = tab === 'new';

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

  const openedYear = useMemo(() => {
    const years = shopProducts
      .map((item) => new Date(item.createdAt).getFullYear())
      .filter((value) => Number.isFinite(value));
    return years.length ? `${Math.min(...years)}年` : '2020年';
  }, [shopProducts]);

  const logoSrc = shopData?.shop?.logo || shopProducts[0]?.img || '/legacy/images/products/p001-lays.jpg';
  const heroAvatarSrc = useMemo(() => createInitialsAvatar(meta.full), [meta.full]);

  const scoreQuality = useMemo(() => {
    const base = shopProducts.length ? Number(avgRating) : 4.7;
    return Math.min(4.9, Math.max(4.3, base - 0.1)).toFixed(1);
  }, [avgRating, shopProducts.length]);

  const scoreShipping = useMemo(() => {
    const base = shopProducts.length ? Number(avgRating) : 4.8;
    return Math.min(4.9, Math.max(4.2, base)).toFixed(1);
  }, [avgRating, shopProducts.length]);

  const scoreService = useMemo(() => {
    const base = shopProducts.length ? Number(avgRating) : 4.9;
    return Math.min(4.9, Math.max(4.4, base + 0.1)).toFixed(1);
  }, [avgRating, shopProducts.length]);

  const scoreAverage = useMemo(() => {
    return (
      (Number(scoreQuality) + Number(scoreShipping) + Number(scoreService)) /
      3
    ).toFixed(1);
  }, [scoreQuality, scoreService, scoreShipping]);

  const scoreCircumference = 2 * Math.PI * 22;
  const scoreOffset = scoreCircumference * (1 - Number(scoreAverage) / 5);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = `${meta.full} - 优米`;
  }, [meta.full]);

  function claimCoupon(value: number) {
    if (claimedCoupons.includes(value)) {
      return;
    }

    setClaimedCoupons((current) => [...current, value]);
    showToast(`🎫 ¥${value}优惠券已领取`);
  }

  function toggleFollow() {
    setFollowed((current) => {
      const next = !current;
      showToast(next ? '✅ 关注成功' : '已取消关注');
      return next;
    });
  }

  function toggleShopFavorite() {
    setShopFavorited((current) => {
      const next = !current;
      showToast(next ? '⭐ 收藏成功' : '取消收藏');
      return next;
    });
  }

  function toggleCardFav(event: React.MouseEvent<HTMLButtonElement>, productId: string) {
    event.preventDefault();
    event.stopPropagation();
    setLikedProducts((current) => {
      if (current.includes(productId)) {
        return current.filter((item) => item !== productId);
      }

      showToast('❤️ 已收藏');
      return [...current, productId];
    });
  }

  if (loading) {
    return <div className={styles.page} />;
  }

  return (
    <div className={styles.page}>
      <header className={`${styles.nav} ${navSolid ? styles.navSolid : styles.navTransparent}`}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>{meta.full}</div>
        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => showToast('分享店铺 📤')}
          >
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => router.push('/')}
          >
            <i className="fa-solid fa-home" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <img
            alt={meta.full}
            src={shopProducts[0]?.img || '/legacy/images/products/p001-lays.jpg'}
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroRow}>
            <img
              className={styles.heroAvatar}
              alt={meta.full}
              src={heroAvatarSrc}
            />
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>
                {meta.full}
                <span
                  className={`${styles.heroVerified} ${
                    meta.grade === '至尊商家'
                      ? styles.gradeSupreme
                      : meta.grade === '皇冠商家'
                        ? styles.gradeCrown
                        : styles.gradeGold
                  }`}
                >
                  <i className="fa-solid fa-shield-check" /> {meta.grade}
                </span>
              </div>
              <div className={styles.heroDesc}>{meta.desc}</div>
            </div>
            <button
              type="button"
              className={`${styles.followBtn} ${followed ? styles.followed : ''}`}
              onClick={toggleFollow}
            >
              {followed ? '已关注' : '+ 关注'}
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroVal}>{shopProducts.length}</div>
              <div className={styles.heroLbl}>全部商品</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroVal}>
                {formatNum(totalSales)}
              </div>
              <div className={styles.heroLbl}>总销量</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroVal}>{avgRating}</div>
              <div className={styles.heroLbl}>店铺评分</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroVal}>{meta.fans}</div>
              <div className={styles.heroLbl}>粉丝</div>
            </div>
          </div>

          <div className={styles.heroTags}>
            <span className={styles.heroTag}><i className="fa-solid fa-crown" style={{ fontSize: 9, color: '#FFD700' }} /> 品牌授权</span>
            <span className={styles.heroTag}><i className="fa-solid fa-truck-fast" style={{ fontSize: 9 }} /> 顺丰包邮</span>
            <span className={styles.heroTag}>
              <i className="fa-solid fa-location-dot" style={{ fontSize: 9 }} /> {meta.city} · {openedYear}
            </span>
            {shopGuess.length ? (
              <span className={styles.heroTag}><i className="fa-solid fa-bullseye" style={{ fontSize: 9, color: '#FF6B00' }} /> 竞猜活动</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.scoreCard}>
        <div className={styles.scoreRing}>
          <svg viewBox="0 0 52 52">
            <circle className={styles.scoreRingBg} cx="26" cy="26" r="22" />
            <circle
              className={styles.scoreRingFill}
              cx="26"
              cy="26"
              r="22"
              strokeDasharray={scoreCircumference}
              strokeDashoffset={scoreOffset}
            />
          </svg>
          <div className={styles.scoreVal}>{scoreAverage}</div>
        </div>
        <div className={styles.scoreItems}>
          <div className={styles.scoreItem}>
            <div className={`${styles.scoreItemVal} ${Number(scoreQuality) >= 4.5 ? styles.scoreItemValHigh : ''}`}>{scoreQuality}</div>
            <div className={styles.scoreItemLbl}>商品质量</div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: `${(Number(scoreQuality) / 5) * 100}%`, background: 'var(--c-green)' }}
              />
            </div>
          </div>
          <div className={styles.scoreItem}>
            <div className={`${styles.scoreItemVal} ${Number(scoreShipping) >= 4.5 ? styles.scoreItemValHigh : ''}`}>{scoreShipping}</div>
            <div className={styles.scoreItemLbl}>物流速度</div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: `${(Number(scoreShipping) / 5) * 100}%`, background: 'var(--c-blue)' }}
              />
            </div>
          </div>
          <div className={styles.scoreItem}>
            <div className={`${styles.scoreItemVal} ${Number(scoreService) >= 4.5 ? styles.scoreItemValHigh : ''}`}>{scoreService}</div>
            <div className={styles.scoreItemLbl}>服务态度</div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: `${(Number(scoreService) / 5) * 100}%`, background: 'var(--c-orange)' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.couponBar}>
        {coupons.map((item) => (
          <button type="button" key={item.name} className={styles.coupon} onClick={() => claimCoupon(item.value)}>
            <div className={styles.couponAmt}>
              <small>¥</small>
              {item.value}
            </div>
            <div>
              <div className={styles.couponName}>{item.name}</div>
              <div className={styles.couponCond}>{item.cond}</div>
            </div>
            <div className={`${styles.couponBtn} ${claimedCoupons.includes(item.value) ? styles.couponBtnClaimed : ''}`}>
              {claimedCoupons.includes(item.value) ? '已领取' : '领取'}
            </div>
          </button>
        ))}
      </section>

      <section className={styles.activityBanner}>
        {shopGuess.length ? (
          <button
            type="button"
            className={styles.activityCard}
            onClick={() => setTab('guess')}
          >
            <div className={styles.activityIcon}>🎯</div>
            <div className={styles.activityBody}>
              <div className={`${styles.activityTitle} ${styles.activityTitleOrange}`}>竞猜活动进行中</div>
              <div className={`${styles.activityDesc} ${styles.activityDescOrange}`}>
                {shopGuess.length} 场竞猜 · 超低价赢商品
              </div>
            </div>
            <div className={`${styles.activityArrow} ${styles.activityArrowOrange}`}><i className="fa-solid fa-chevron-right" /></div>
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.activityCard} ${styles.activityPurple}`}
          onClick={() => showToast('活动即将开启')}
        >
          <div className={styles.activityIcon}>🎁</div>
          <div className={styles.activityBody}>
            <div className={`${styles.activityTitle} ${styles.activityTitlePurple}`}>会员专属福利</div>
            <div className={`${styles.activityDesc} ${styles.activityDescPurple}`}>
              关注店铺享额外折扣 · 新品优先体验
            </div>
          </div>
          <div className={`${styles.activityArrow} ${styles.activityArrowPurple}`}><i className="fa-solid fa-chevron-right" /></div>
        </button>
      </section>

      <nav className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${showAll ? styles.tabOn : ''}`}
          onClick={() => setTab('all')}
        >
          全部商品 <span>{shopProducts.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${showHot ? styles.tabOn : ''}`}
          onClick={() => setTab('hot')}
        >
          热销爆款
        </button>
        <button
          type="button"
          className={`${styles.tab} ${showGuess ? styles.tabOn : ''}`}
          onClick={() => setTab('guess')}
        >
          竞猜活动 <span>{shopGuess.length}</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${showNew ? styles.tabOn : ''}`}
          onClick={() => setTab('new')}
        >
          上新
        </button>
      </nav>

      {!showGuess ? (
        <div className={styles.filterBar}>
          {[
            ['default', '综合'],
            ['sales', '销量'],
            ['price', '价格'],
            ['rating', '好评'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${styles.filter} ${filter === key ? styles.filterOn : ''}`}
              onClick={() => {
                if (key === 'price' && filter === 'price') {
                  setPriceAsc((current) => !current);
                }
                if (key !== 'price') {
                  setPriceAsc(true);
                }
                setFilter(key as FilterKey);
              }}
            >
              {label}{' '}
              {key === 'price' ? (
                <i className={`fa-solid ${priceAsc ? 'fa-sort-up' : 'fa-sort-down'}`} />
              ) : key !== 'default' ? (
                <i className="fa-solid fa-sort" />
              ) : (
                ''
              )}
            </button>
          ))}
        </div>
      ) : null}

      <main>
        {(showAll || showHot) && (
          <section className={styles.panel}>
            <div className={styles.grid}>
              {(showHot ? hotProducts : sortedProducts).map((item) => (
                <button
                  className={styles.productCard}
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <div className={styles.productImg}>
                    <img alt={item.name} src={item.img || '/legacy/images/products/p001-lays.jpg'} />
                    <span
                      className={`${styles.productBadge} ${
                        shopGuess.some((guess) => guess.relatedProductId === item.id)
                          ? styles.badgeGuess
                          : item.sales > 3000
                            ? styles.badgeHot
                            : styles.badgeBrand
                      }`}
                    >
                      {shopGuess.some((guess) => guess.relatedProductId === item.id)
                        ? '🎯 竞猜'
                        : item.sales > 3000
                          ? '🔥 热销'
                          : '品牌'}
                    </span>
                    <button
                      type="button"
                      className={`${styles.fav} ${likedProducts.includes(item.id) ? styles.favLiked : ''}`}
                      onClick={(event) => toggleCardFav(event, item.id)}
                    >
                      <i className={`${likedProducts.includes(item.id) ? 'fa-solid' : 'fa-regular'} fa-heart`} />
                    </button>
                  </div>
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productPrice}>
                      <span>¥</span>
                      <strong>{item.price}</strong>
                      <em>¥{item.originalPrice}</em>
                    </div>
                    <div className={styles.productMeta}>
                      <span>{formatNum(item.sales)}人付款</span>
                      <span>⭐ {item.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
              {!(showHot ? hotProducts : sortedProducts).length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📦</div>
                  <div className={styles.emptyText}>暂无商品</div>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {showGuess && (
          <section className={styles.guessPanel}>
            {shopGuess.length ? shopGuess.map((guess) => {
              const totalVotes = guess.votes.reduce((sum, value) => sum + value, 0);
              return (
                <button
                  className={styles.guessCard}
                  key={guess.id}
                  type="button"
                  onClick={() => router.push(`/guess/${guess.id}`)}
                >
                  <div className={styles.guessTop}>
                    <img
                      alt={guess.title}
                      src={
                        shopProducts.find((item) => item.id === guess.relatedProductId)
                          ?.img || shopProducts[0]?.img || '/legacy/images/products/p001-lays.jpg'
                      }
                    />
                    <div className={styles.guessInfo}>
                      <div className={styles.guessTitle}>{guess.title}</div>
                      <div className={styles.guessMeta}>
                        {formatNum(totalVotes)}人参与 · 店铺竞猜
                      </div>
                    </div>
                  </div>
                  <div className={styles.guessOpts}>
                    {guess.options.slice(0, 2).map((option, index) => (
                      <div className={styles.guessOpt} key={`${guess.id}-${option}`}>
                        <div className={styles.guessOptName}>{option}</div>
                        <div className={styles.guessOptBar}>
                          <div
                            className={styles.guessOptFill}
                            style={{ width: `${guess.votes[index] || 0}%` }}
                          />
                        </div>
                        <div className={styles.guessPct}>{guess.votes[index] || 0}%</div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.guessFooter}>
                    <span className={styles.guessPeople}>
                      <i className="fa-solid fa-users" /> {formatNum(totalVotes)}人参与
                    </span>
                    <span className={styles.guessBtn}>去竞猜</span>
                  </div>
                </button>
              );
            }) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🎯</div>
                <div className={styles.emptyText}>暂无竞猜活动</div>
              </div>
            )}
          </section>
        )}

        {showNew && (
          <section className={styles.panel}>
            <div className={styles.grid}>
              {newProducts.map((item) => (
                <button
                  className={styles.productCard}
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <div className={styles.productImg}>
                    <img alt={item.name} src={item.img || '/legacy/images/products/p001-lays.jpg'} />
                    <span
                      className={`${styles.productBadge} ${
                        shopGuess.some((guess) => guess.relatedProductId === item.id)
                          ? styles.badgeGuess
                          : item.sales > 3000
                            ? styles.badgeHot
                            : styles.badgeBrand
                      }`}
                    >
                      {shopGuess.some((guess) => guess.relatedProductId === item.id)
                        ? '🎯 竞猜'
                        : item.sales > 3000
                          ? '🔥 热销'
                          : '品牌'}
                    </span>
                    <button
                      type="button"
                      className={`${styles.fav} ${likedProducts.includes(item.id) ? styles.favLiked : ''}`}
                      onClick={(event) => toggleCardFav(event, item.id)}
                    >
                      <i className={`${likedProducts.includes(item.id) ? 'fa-solid' : 'fa-regular'} fa-heart`} />
                    </button>
                  </div>
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productPrice}>
                      <span>¥</span>
                      <strong>{item.price}</strong>
                      <em>¥{item.originalPrice}</em>
                  </div>
                  <div className={styles.productMeta}>
                      <span>{formatNum(item.sales)}人付款</span>
                      <span>⭐ {item.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
              {!newProducts.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📦</div>
                  <div className={styles.emptyText}>暂无商品</div>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.bottomBar}>
        <button
          className={`${styles.bottomIcon} ${shopFavorited ? styles.bottomIconFavOn : ''}`}
          type="button"
          onClick={toggleShopFavorite}
        >
          <span><i className={`${shopFavorited ? 'fa-solid' : 'fa-regular'} fa-heart`} /></span>
          收藏
        </button>
        <button
          className={styles.bottomIcon}
          type="button"
          onClick={() => showToast('💬 正在接入客服...')}
        >
          <span><i className="fa-regular fa-comment-dots" /></span>
          客服
        </button>
        <div className={styles.bottomButtons}>
          <button
            className={styles.chatBtn}
            type="button"
            onClick={() => showToast('💬 正在接入店铺客服...')}
          >
            <i className="fa-regular fa-comment-dots" style={{ fontSize: 14 }} /> 聊一聊
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => setTab(shopGuess.length ? 'guess' : 'all')}
          >
            {shopGuess.length ? '🎯 参与竞猜' : '🛒 全部商品'}
          </button>
        </div>
      </footer>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}
