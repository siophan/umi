'use client';

import styles from './page.module.css';

type ShopProduct = {
  id: string;
  name: string;
  img: string | null;
  price: number;
  originalPrice: number;
  sales: number;
  rating: number;
};

type ShopGuess = {
  id: string;
  title: string;
  relatedProductId: string | null;
  options: string[];
  votes: number[];
};

type ShopMeta = {
  full: string;
  desc: string;
  city: string;
  fans: string;
  grade: string;
};

type ShopDetailContentProps = {
  navSolid: boolean;
  meta: ShopMeta;
  shopProducts: ShopProduct[];
  shopGuess: ShopGuess[];
  totalSales: string;
  heroAvatarSrc: string;
  shopFacts: Array<{ value: string; name: string; desc: string }>;
  tab: 'all' | 'hot' | 'guess' | 'new';
  filter: 'default' | 'sales' | 'price' | 'rating';
  priceAsc: boolean;
  sortedProducts: ShopProduct[];
  hotProducts: ShopProduct[];
  newProducts: ShopProduct[];
  onBack: () => void;
  onShare: () => void;
  onHome: () => void;
  onTabChange: (tab: 'all' | 'hot' | 'guess' | 'new') => void;
  onFilterChange: (filter: 'default' | 'sales' | 'price' | 'rating') => void;
  onTogglePrice: () => void;
  onOpenProduct: (id: string) => void;
  onOpenGuess: (id: string) => void;
  onJumpToMain: (tab: 'all' | 'hot' | 'guess' | 'new') => void;
};

function formatNum(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

export function ShopDetailContent(props: ShopDetailContentProps) {
  const {
    navSolid,
    meta,
    shopProducts,
    shopGuess,
    totalSales,
    heroAvatarSrc,
    shopFacts,
    tab,
    filter,
    priceAsc,
    sortedProducts,
    hotProducts,
    newProducts,
    onBack,
    onShare,
    onHome,
    onTabChange,
    onFilterChange,
    onTogglePrice,
    onOpenProduct,
    onOpenGuess,
    onJumpToMain,
  } = props;

  const showGuess = tab === 'guess';
  const showHot = tab === 'hot';
  const showNew = tab === 'new';
  const activeProducts = showHot ? hotProducts : showNew ? newProducts : sortedProducts;

  return (
    <div className={styles.page}>
      <header className={`${styles.nav} ${navSolid ? styles.navSolid : styles.navTransparent}`}>
        <button className={styles.back} type="button" onClick={onBack}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>{meta.full}</div>
        <div className={styles.navActions}>
          <button type="button" className={styles.navBtn} onClick={onShare}>
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button type="button" className={styles.navBtn} onClick={onHome}>
            <i className="fa-solid fa-home" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <img alt={meta.full} src={shopProducts[0]?.img || '/legacy/images/products/p001-lays.jpg'} />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroRow}>
            <img className={styles.heroAvatar} alt={meta.full} src={heroAvatarSrc} />
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>
                {meta.full}
                <span className={`${styles.heroVerified} ${meta.grade === '至尊商家' ? styles.gradeSupreme : meta.grade === '皇冠商家' ? styles.gradeCrown : styles.gradeGold}`}>
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
              <div className={styles.heroVal}>{totalSales}</div>
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
            <span className={styles.heroTag}><i className="fa-solid fa-location-dot" style={{ fontSize: 9 }} /> {meta.city}</span>
            {shopGuess.length ? <span className={styles.heroTag}><i className="fa-solid fa-bullseye" style={{ fontSize: 9, color: '#FF6B00' }} /> 竞猜活动</span> : null}
          </div>
        </div>
      </section>

      <section className={styles.couponBar}>
        {shopFacts.map((item) => (
          <div key={item.name} className={styles.coupon}>
            <div className={styles.couponAmt}>{item.value}</div>
            <div>
              <div className={styles.couponName}>{item.name}</div>
              <div className={styles.couponCond}>{item.desc}</div>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.activityBanner}>
        {shopGuess.length ? (
          <button type="button" className={styles.activityCard} onClick={() => onTabChange('guess')}>
            <div className={styles.activityIcon}>🎯</div>
            <div className={styles.activityBody}>
              <div className={`${styles.activityTitle} ${styles.activityTitleOrange}`}>竞猜活动进行中</div>
              <div className={`${styles.activityDesc} ${styles.activityDescOrange}`}>{shopGuess.length} 场竞猜 · 超低价赢商品</div>
            </div>
            <div className={`${styles.activityArrow} ${styles.activityArrowOrange}`}><i className="fa-solid fa-chevron-right" /></div>
          </button>
        ) : null}
        <button type="button" className={`${styles.activityCard} ${styles.activityPurple}`} onClick={() => onJumpToMain('new')}>
          <div className={styles.activityIcon}>🎁</div>
          <div className={styles.activityBody}>
            <div className={`${styles.activityTitle} ${styles.activityTitlePurple}`}>店铺经营概览</div>
            <div className={`${styles.activityDesc} ${styles.activityDescPurple}`}>{shopFacts[0]?.value ?? 0} 个授权品牌 · {shopProducts.length} 件在售商品</div>
          </div>
          <div className={`${styles.activityArrow} ${styles.activityArrowPurple}`}><i className="fa-solid fa-chevron-right" /></div>
        </button>
      </section>

      <nav className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${tab === 'all' ? styles.tabOn : ''}`} onClick={() => onTabChange('all')}>
          全部商品 <span>{shopProducts.length}</span>
        </button>
        <button type="button" className={`${styles.tab} ${tab === 'hot' ? styles.tabOn : ''}`} onClick={() => onTabChange('hot')}>
          热销爆款
        </button>
        <button type="button" className={`${styles.tab} ${tab === 'guess' ? styles.tabOn : ''}`} onClick={() => onTabChange('guess')}>
          竞猜活动 <span>{shopGuess.length}</span>
        </button>
        <button type="button" className={`${styles.tab} ${tab === 'new' ? styles.tabOn : ''}`} onClick={() => onTabChange('new')}>
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
                  onTogglePrice();
                } else {
                  onFilterChange(key as 'default' | 'sales' | 'price' | 'rating');
                }
              }}
            >
              {label}{' '}
              {key === 'price' ? <i className={`fa-solid ${priceAsc ? 'fa-sort-up' : 'fa-sort-down'}`} /> : key !== 'default' ? <i className="fa-solid fa-sort" /> : ''}
            </button>
          ))}
        </div>
      ) : null}

      <main>
        {!showGuess ? (
          <section className={styles.panel}>
            <div className={styles.grid}>
              {activeProducts.map((item) => {
                const hasGuess = shopGuess.some((guess) => guess.relatedProductId === item.id);
                return (
                  <button className={styles.productCard} key={item.id} type="button" onClick={() => onOpenProduct(item.id)}>
                    <div className={styles.productImg}>
                      <img alt={item.name} src={item.img || '/legacy/images/products/p001-lays.jpg'} />
                      <span className={`${styles.productBadge} ${hasGuess ? styles.badgeGuess : item.sales > 3000 ? styles.badgeHot : styles.badgeBrand}`}>
                        {hasGuess ? '🎯 竞猜' : item.sales > 3000 ? '🔥 热销' : '品牌'}
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
                );
              })}
              {!activeProducts.length ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📦</div>
                  <div className={styles.emptyText}>暂无商品</div>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section className={styles.guessPanel}>
            {shopGuess.length ? (
              shopGuess.map((guess) => {
                const totalVotes = guess.votes.reduce((sum, value) => sum + value, 0);
                return (
                  <button className={styles.guessCard} key={guess.id} type="button" onClick={() => onOpenGuess(guess.id)}>
                    <div className={styles.guessTop}>
                      <img alt={guess.title} src={shopProducts.find((item) => item.id === guess.relatedProductId)?.img || shopProducts[0]?.img || '/legacy/images/products/p001-lays.jpg'} />
                      <div className={styles.guessInfo}>
                        <div className={styles.guessTitle}>{guess.title}</div>
                        <div className={styles.guessMeta}>{formatNum(totalVotes)}人参与 · 店铺竞猜</div>
                      </div>
                    </div>
                    <div className={styles.guessOpts}>
                      {guess.options.slice(0, 2).map((option, index) => (
                        <div className={styles.guessOpt} key={`${guess.id}-${option}`}>
                          <div className={styles.guessOptName}>{option}</div>
                          <div className={styles.guessOptBar}>
                            <div className={styles.guessOptFill} style={{ width: `${guess.votes[index] || 0}%` }} />
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
              })
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🎯</div>
                <div className={styles.emptyText}>暂无竞猜活动</div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className={styles.bottomBar}>
        <div className={styles.bottomButtons}>
          <button className={styles.primaryBtn} type="button" onClick={() => onJumpToMain(shopGuess.length ? 'guess' : 'all')}>
            {shopGuess.length ? '🎯 参与竞猜' : '🛒 全部商品'}
          </button>
        </div>
      </footer>
    </div>
  );
}
