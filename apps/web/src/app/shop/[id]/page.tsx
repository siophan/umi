'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchShopDetail } from '../../../lib/api/shops';
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
        city: shopData.shop.city || '中国',
        fans: formatNum(shopData.shop.fans),
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

  const heroAvatarSrc = useMemo(() => createInitialsAvatar(meta?.full || shopId || '店铺'), [meta?.full, shopId]);
  const shopFacts = useMemo(
    () => [
      { value: `${shopData?.shop?.brandAuthCount ?? 0}`, name: '品牌授权', desc: '已通过审核品牌数' },
      { value: `${shopProducts.length}`, name: '在售商品', desc: '当前店铺商品数量' },
      { value: formatNum(totalSales), name: '累计销量', desc: '按当前商品销量聚合' },
      { value: `${shopGuess.length}`, name: '竞猜活动', desc: '当前关联竞猜数量' },
    ],
    [shopData?.shop?.brandAuthCount, shopGuess.length, shopProducts.length, totalSales],
  );

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = `${meta?.full || '店铺详情'} - UMI`;
  }, [meta?.full]);

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
              <div className={styles.heroVal}>{meta.fans}</div>
              <div className={styles.heroLbl}>粉丝</div>
            </div>
          </div>

          <div className={styles.heroTags}>
            <span className={styles.heroTag}><i className="fa-solid fa-crown" style={{ fontSize: 9, color: '#FFD700' }} /> 品牌授权</span>
            <span className={styles.heroTag}><i className="fa-solid fa-cubes-stacked" style={{ fontSize: 9 }} /> 在售商品 {shopProducts.length}</span>
            <span className={styles.heroTag}>
              <i className="fa-solid fa-location-dot" style={{ fontSize: 9 }} /> {meta.city}
            </span>
            {shopGuess.length ? (
              <span className={styles.heroTag}><i className="fa-solid fa-bullseye" style={{ fontSize: 9, color: '#FF6B00' }} /> 竞猜活动</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.couponBar}>
        {shopFacts.map((item) => (
          <div key={item.name} className={styles.coupon}>
            <div className={styles.couponAmt}>
              {item.value}
            </div>
            <div>
              <div className={styles.couponName}>{item.name}</div>
              <div className={styles.couponCond}>{item.desc}</div>
            </div>
          </div>
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
          onClick={() => jumpToMainContent('new')}
        >
          <div className={styles.activityIcon}>🎁</div>
          <div className={styles.activityBody}>
            <div className={`${styles.activityTitle} ${styles.activityTitlePurple}`}>店铺经营概览</div>
            <div className={`${styles.activityDesc} ${styles.activityDescPurple}`}>
              {shopData?.shop?.brandAuthCount ?? 0} 个授权品牌 · {shopProducts.length} 件在售商品
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
        <div className={styles.bottomButtons}>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => jumpToMainContent(shopGuess.length ? 'guess' : 'all')}
          >
            {shopGuess.length ? '🎯 参与竞猜' : '🛒 全部商品'}
          </button>
        </div>
      </footer>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}

export default function ShopDetailPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <ShopDetailPageInner />
    </Suspense>
  );
}
