'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { followUser, unfollowUser } from '../../../lib/api/users';
import { hasAuthToken } from '../../../lib/api/shared';
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
  logo: string;
  avgRating: number;
  ownerUserId: string;
  viewerFollowed: boolean;
  grade: string;
};

type ShopDetailContentProps = {
  navSolid: boolean;
  meta: ShopMeta;
  shopProducts: ShopProduct[];
  shopGuess: ShopGuess[];
  totalSales: string;
  heroAvatarSrc: string;
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
  onToast: (message: string) => void;
};

function formatNum(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

const STATIC_COUPONS: Array<{ amount: number; name: string; cond: string }> = [
  { amount: 5, name: '新人专享', cond: '满 29 可用' },
  { amount: 10, name: '店铺满减', cond: '满 59 可用' },
  { amount: 20, name: '品牌大额', cond: '满 99 可用' },
  { amount: 50, name: '限时特惠', cond: '满 199 可用' },
];

const SCORE_LABELS: Array<{ key: 'quality' | 'logistics' | 'service'; label: string; color: string }> = [
  { key: 'quality', label: '商品质量', color: '#00a66e' },
  { key: 'logistics', label: '物流速度', color: '#4a6cf7' },
  { key: 'service', label: '服务态度', color: '#ff6b00' },
];

export function ShopDetailContent(props: ShopDetailContentProps) {
  const {
    navSolid,
    meta,
    shopProducts,
    shopGuess,
    totalSales,
    heroAvatarSrc,
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
    onToast,
  } = props;

  const router = useRouter();
  const [following, setFollowing] = useState(meta.viewerFollowed);
  const [followBusy, setFollowBusy] = useState(false);
  const [favored, setFavored] = useState(false);
  const [claimed, setClaimed] = useState<Record<number, boolean>>({});
  const [cardFav, setCardFav] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFollowing(meta.viewerFollowed);
  }, [meta.viewerFollowed]);

  const showGuess = tab === 'guess';
  const showHot = tab === 'hot';
  const showNew = tab === 'new';
  const activeProducts = showHot ? hotProducts : showNew ? newProducts : sortedProducts;
  const heroBgImg = shopProducts[0]?.img || meta.logo || '';

  const ringRadius = 22;
  const ringCircum = 2 * Math.PI * ringRadius;
  const ringPct = meta.avgRating > 0 ? meta.avgRating / 5 : 0;

  async function toggleFollow() {
    if (followBusy) return;
    if (!hasAuthToken()) {
      onToast('请先登录');
      router.push('/login');
      return;
    }
    const next = !following;
    setFollowBusy(true);
    setFollowing(next);
    try {
      if (next) {
        await followUser(meta.ownerUserId);
        onToast('✅ 关注成功');
      } else {
        await unfollowUser(meta.ownerUserId);
        onToast('已取消关注');
      }
    } catch (error) {
      setFollowing(!next);
      onToast(error instanceof Error ? error.message : '操作失败，请稍后重试');
    } finally {
      setFollowBusy(false);
    }
  }

  function toggleFav() {
    const next = !favored;
    setFavored(next);
    onToast(next ? '⭐ 收藏成功' : '取消收藏');
  }

  function toggleCardFav(productId: string) {
    setCardFav((prev) => {
      const next = !prev[productId];
      onToast(next ? '❤️ 已收藏' : '取消收藏');
      return { ...prev, [productId]: next };
    });
  }

  function claim(idx: number, amount: number) {
    if (claimed[idx]) return;
    setClaimed((prev) => ({ ...prev, [idx]: true }));
    onToast(`🎫 ¥${amount} 优惠券已领取`);
  }

  function openChat() {
    if (!hasAuthToken()) {
      onToast('请先登录');
      router.push('/login');
      return;
    }
    router.push(`/chat/${meta.ownerUserId}`);
  }

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
          {heroBgImg ? <img alt={meta.full} src={heroBgImg} /> : null}
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
            <button
              type="button"
              className={`${styles.heroFollow} ${following ? styles.heroFollowOn : ''}`}
              onClick={toggleFollow}
              disabled={followBusy}
            >
              {following ? '已关注' : '+ 关注'}
            </button>
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
              <div className={styles.heroVal}>{meta.avgRating > 0 ? meta.avgRating.toFixed(1) : '—'}</div>
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
            {meta.city ? (
              <span className={styles.heroTag}><i className="fa-solid fa-location-dot" style={{ fontSize: 9 }} /> {meta.city}</span>
            ) : null}
            {shopGuess.length ? <span className={styles.heroTag}><i className="fa-solid fa-bullseye" style={{ fontSize: 9, color: '#FF6B00' }} /> 竞猜活动</span> : null}
          </div>
        </div>
      </section>

      <section className={styles.scoreCard}>
        <div className={styles.scoreRing}>
          <svg viewBox="0 0 52 52">
            <circle className={styles.scoreRingBg} cx="26" cy="26" r={ringRadius} />
            <circle
              className={styles.scoreRingFill}
              cx="26"
              cy="26"
              r={ringRadius}
              strokeDasharray={ringCircum}
              strokeDashoffset={ringCircum * (1 - ringPct)}
            />
          </svg>
          <div className={styles.scoreVal}>{meta.avgRating > 0 ? meta.avgRating.toFixed(1) : '—'}</div>
        </div>
        <div className={styles.scoreItems}>
          {SCORE_LABELS.map((item) => {
            const value = meta.avgRating;
            const pct = value > 0 ? (value / 5) * 100 : 0;
            return (
              <div key={item.key} className={styles.scoreItem}>
                <div className={`${styles.scoreItemVal} ${value >= 4.5 ? styles.scoreItemValHigh : ''}`}>
                  {value > 0 ? value.toFixed(1) : '—'}
                </div>
                <div className={styles.scoreItemLbl}>{item.label}</div>
                <div className={styles.scoreItemBar}>
                  <div className={styles.scoreItemFill} style={{ width: `${pct}%`, background: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.couponBar}>
        {STATIC_COUPONS.map((coupon, idx) => (
          <div key={coupon.amount} className={styles.coupon} onClick={() => claim(idx, coupon.amount)}>
            <div className={styles.couponAmt}><small>¥</small>{coupon.amount}</div>
            <div>
              <div className={styles.couponName}>{coupon.name}</div>
              <div className={styles.couponCond}>{coupon.cond}</div>
            </div>
            <button
              type="button"
              className={`${styles.couponBtn} ${claimed[idx] ? styles.couponBtnClaimed : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                claim(idx, coupon.amount);
              }}
            >
              {claimed[idx] ? '已领取' : '领取'}
            </button>
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
        <button
          type="button"
          className={`${styles.activityCard} ${styles.activityPurple}`}
          onClick={() => onToast('🎁 会员福利即将开启')}
        >
          <div className={styles.activityIcon}>🎁</div>
          <div className={styles.activityBody}>
            <div className={`${styles.activityTitle} ${styles.activityTitlePurple}`}>会员专属福利</div>
            <div className={`${styles.activityDesc} ${styles.activityDescPurple}`}>关注店铺享额外折扣 · 新品优先体验</div>
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
                const liked = !!cardFav[item.id];
                return (
                  <button className={styles.productCard} key={item.id} type="button" onClick={() => onOpenProduct(item.id)}>
                    <div className={styles.productImg}>
                      {item.img ? <img alt={item.name} src={item.img} /> : null}
                      <span className={`${styles.productBadge} ${hasGuess ? styles.badgeGuess : item.sales > 3000 ? styles.badgeHot : styles.badgeBrand}`}>
                        {hasGuess ? '🎯 竞猜' : item.sales > 3000 ? '🔥 热销' : '品牌'}
                      </span>
                      <button
                        type="button"
                        className={`${styles.productFav} ${liked ? styles.productFavOn : ''}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleCardFav(item.id);
                        }}
                      >
                        <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                      </button>
                    </div>
                    <div className={styles.productBody}>
                      <div className={styles.productName}>{item.name}</div>
                      <div className={styles.productPrice}>
                        <span>¥</span>
                        <strong>{item.price}</strong>
                        {item.originalPrice > item.price ? <em>¥{item.originalPrice}</em> : null}
                      </div>
                      <div className={styles.productMeta}>
                        <span>{formatNum(item.sales)}人付款</span>
                        <span className={styles.productRating}>⭐ {item.rating > 0 ? item.rating.toFixed(1) : '—'}</span>
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
                const guessImg = shopProducts.find((item) => item.id === guess.relatedProductId)?.img || shopProducts[0]?.img || '';
                return (
                  <button className={styles.guessCard} key={guess.id} type="button" onClick={() => onOpenGuess(guess.id)}>
                    <div className={styles.guessTop}>
                      {guessImg ? <img alt={guess.title} src={guessImg} /> : <div className={styles.guessImgPlaceholder} />}
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
        <button
          type="button"
          className={`${styles.botIcon} ${favored ? styles.botIconOn : ''}`}
          onClick={toggleFav}
        >
          <i className={favored ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
          <span>收藏</span>
        </button>
        <button type="button" className={styles.botIcon} onClick={openChat}>
          <i className="fa-regular fa-comment-dots" />
          <span>客服</span>
        </button>
        <div className={styles.bottomButtons}>
          <button className={styles.chatBtn} type="button" onClick={openChat}>
            <i className="fa-regular fa-comment-dots" /> 聊一聊
          </button>
          <button className={styles.primaryBtn} type="button" onClick={() => onJumpToMain(shopGuess.length ? 'guess' : 'all')}>
            {shopGuess.length ? '🎯 参与竞猜' : '🛒 全部商品'}
          </button>
        </div>
      </footer>
    </div>
  );
}
