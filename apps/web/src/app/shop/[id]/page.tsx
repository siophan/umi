'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

type TabKey = 'all' | 'hot' | 'guess' | 'new';
type FilterKey = 'default' | 'sales' | 'price' | 'rating';

const shopMeta: Record<
  string,
  {
    full: string;
    desc: string;
    since: string;
    city: string;
    fans: string;
    grade: string;
  }
> = {
  乐事: {
    full: '乐事官方旗舰店',
    desc: '全球薯片领导品牌 · 经典与创新兼备',
    since: '2008',
    city: '上海',
    fans: '128万',
    grade: '金牌商家',
  },
  奥利奥: {
    full: '奥利奥官方旗舰店',
    desc: '扭一扭舔一舔泡一泡',
    since: '2010',
    city: '上海',
    fans: '96万',
    grade: '金牌商家',
  },
  三只松鼠: {
    full: '三只松鼠旗舰店',
    desc: '中国互联网零食第一品牌',
    since: '2012',
    city: '芜湖',
    fans: '320万',
    grade: '皇冠商家',
  },
  百草味: {
    full: '百草味官方店',
    desc: '综合零食新零售品牌',
    since: '2003',
    city: '杭州',
    fans: '87万',
    grade: '金牌商家',
  },
};

const allProducts = [
  {
    id: 'p1',
    name: '奥利奥原味夹心饼干 67g*3',
    price: 26.8,
    orig: 29.9,
    sales: 12000,
    rating: 4.9,
    brand: '奥利奥',
    img: '/legacy/images/products/p002-oreo.jpg',
    badge: '品牌',
  },
  {
    id: 'p2',
    name: '三只松鼠坚果礼盒 520g',
    price: 128,
    orig: 168,
    sales: 9832,
    rating: 4.8,
    brand: '三只松鼠',
    img: '/legacy/images/products/p003-squirrels.jpg',
    badge: '热销',
  },
  {
    id: 'p3',
    name: '可口可乐零糖组合装',
    price: 72,
    orig: 88,
    sales: 8443,
    rating: 4.8,
    brand: '百草味',
    img: '/legacy/images/products/p009-genki.jpg',
    badge: '热销',
  },
  {
    id: 'p4',
    name: '良品铺子海苔脆片礼盒',
    price: 58,
    orig: 69,
    sales: 7900,
    rating: 4.7,
    brand: '百草味',
    img: '/legacy/images/products/p005-liangpin.jpg',
    badge: '新品',
  },
  {
    id: 'p5',
    name: '卫龙辣条大礼包',
    price: 39.9,
    orig: 49.9,
    sales: 15600,
    rating: 4.9,
    brand: '卫龙',
    img: '/legacy/images/products/p008-weilong.jpg',
    badge: '热销',
  },
  {
    id: 'p6',
    name: '元气森林气泡水组合装',
    price: 49.9,
    orig: 59.9,
    sales: 12110,
    rating: 4.8,
    brand: '元气森林',
    img: '/legacy/images/products/p009-genki.jpg',
    badge: '新品',
  },
];

const shopGuesses = [
  {
    id: 'g1',
    title: '世界杯冠军会是阿根廷还是法国？',
    votes: [56, 44],
    options: ['阿根廷卫冕', '法国夺冠'],
    related: 'p1',
  },
  {
    id: 'g2',
    title: '新 iPhone 会不会在 9 月发布会上推出折叠屏？',
    votes: [62, 38],
    options: ['会发布', '不会发布'],
    related: 'p2',
  },
];

const coupons = [
  { value: 5, name: '新人专享', cond: '满 29 可用' },
  { value: 10, name: '店铺满减', cond: '满 59 可用' },
  { value: 20, name: '品牌大额', cond: '满 99 可用' },
  { value: 50, name: '限时特惠', cond: '满 199 可用' },
];

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<TabKey>('all');
  const [filter, setFilter] = useState<FilterKey>('default');
  const [followed, setFollowed] = useState(false);

  const brand = decodeURIComponent(params.id || '乐事');
  const meta = shopMeta[brand] || {
    full: `${brand}旗舰店`,
    desc: '品质保证 · 正品行货',
    since: '2020',
    city: '中国',
    fans: '10万',
    grade: '金牌商家',
  };

  const shopProducts = useMemo(
    () =>
      allProducts.filter((item) => item.brand === brand || brand === '乐事'),
    [brand],
  );
  const shopGuess = useMemo(
    () => (brand === '乐事' ? shopGuesses : shopGuesses.slice(0, 1)),
    [brand],
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
    if (filter === 'price') return list.sort((a, b) => a.price - b.price);
    if (filter === 'rating') return list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [filter, shopProducts]);

  const hotProducts = sortedProducts
    .filter((item) => item.sales > 9000)
    .slice(0, 8);
  const newProducts = [...sortedProducts].reverse().slice(0, 6);

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <button
          className={styles.back}
          type="button"
          onClick={() => window.history.back()}
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>{meta.full}</div>
        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => alert('分享店铺 📤')}
          >
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => alert('返回首页')}
          >
            <i className="fa-solid fa-house" />
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
              src={shopProducts[0]?.img || '/legacy/images/products/p001-lays.jpg'}
            />
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>
                {meta.full}
                <span className={styles.heroVerified}><i className="fa-solid fa-shield-halved" /> {meta.grade}</span>
              </div>
              <div className={styles.heroDesc}>{meta.desc}</div>
            </div>
            <button
              type="button"
              className={`${styles.followBtn} ${followed ? styles.followed : ''}`}
              onClick={() => setFollowed((value) => !value)}
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
                {totalSales.toLocaleString()}
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
            <span className={styles.heroTag}>品牌授权</span>
            <span className={styles.heroTag}>顺丰包邮</span>
            <span className={styles.heroTag}>
              {meta.city} · {meta.since}年
            </span>
            {shopGuess.length ? (
              <span className={styles.heroTag}>竞猜活动</span>
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
              strokeDasharray="138.2"
              strokeDashoffset="24.2"
            />
          </svg>
          <div className={styles.scoreVal}>4.8</div>
        </div>
        <div className={styles.scoreItems}>
          <div className={styles.scoreItem}>
            <div className={styles.scoreItemVal}>4.7</div>
            <div className={styles.scoreItemLbl}>商品质量</div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: '94%', background: 'var(--c-green)' }}
              />
            </div>
          </div>
          <div className={styles.scoreItem}>
            <div className={styles.scoreItemVal}>4.8</div>
            <div className={styles.scoreItemLbl}>物流速度</div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: '96%', background: 'var(--c-blue)' }}
              />
            </div>
          </div>
          <div className={styles.scoreItem}>
            <div className={styles.scoreItemVal}>4.9</div>
            <div className={styles.scoreItemLbl}>服务态度</div>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: '98%', background: 'var(--c-orange)' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.couponBar}>
        {coupons.map((item) => (
          <button type="button" key={item.name} className={styles.coupon}>
            <div className={styles.couponAmt}>
              <small>¥</small>
              {item.value}
            </div>
            <div>
              <div className={styles.couponName}>{item.name}</div>
              <div className={styles.couponCond}>{item.cond}</div>
            </div>
            <div className={styles.couponBtn}>领取</div>
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
            <div className={styles.activityIcon}><i className="fa-solid fa-bullseye" /></div>
            <div className={styles.activityBody}>
              <div className={styles.activityTitle}>竞猜活动进行中</div>
              <div className={styles.activityDesc}>
                {shopGuess.length} 场竞猜 · 超低价赢商品
              </div>
            </div>
            <div className={styles.activityArrow}><i className="fa-solid fa-chevron-right" /></div>
          </button>
        ) : null}
        <button
          type="button"
          className={`${styles.activityCard} ${styles.activityPurple}`}
          onClick={() => alert('活动即将开启')}
        >
          <div className={styles.activityIcon}><i className="fa-solid fa-gift" /></div>
          <div className={styles.activityBody}>
            <div className={styles.activityTitle}>会员专属福利</div>
            <div className={styles.activityDesc}>
              关注店铺享额外折扣 · 新品优先体验
            </div>
          </div>
          <div className={styles.activityArrow}><i className="fa-solid fa-chevron-right" /></div>
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
            onClick={() => setFilter(key as FilterKey)}
          >
            {label} {key !== 'default' ? <i className="fa-solid fa-arrow-down-up-across-line" /> : ''}
          </button>
        ))}
      </div>

      <main>
        {(showAll || showHot) && (
          <section className={styles.panel}>
            <div className={styles.grid}>
              {(showHot ? hotProducts : sortedProducts).map((item) => (
                <button
                  className={styles.productCard}
                  key={item.id}
                  type="button"
                  onClick={() => alert(item.name)}
                >
                  <div className={styles.productImg}>
                    <img alt={item.name} src={item.img} />
                    <span
                      className={`${styles.productBadge} ${item.badge === '热销' ? styles.badgeHot : item.badge === '新品' ? styles.badgeNew : styles.badgeBrand}`}
                    >
                      {item.badge}
                    </span>
                    <span className={styles.fav}><i className="fa-regular fa-heart" /></span>
                  </div>
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productPrice}>
                      <span>¥</span>
                      <strong>{item.price}</strong>
                      <em>¥{item.orig}</em>
                    </div>
                    <div className={styles.productMeta}>
                      <span>{item.sales.toLocaleString()} 人付款</span>
                      <span>⭐ {item.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {showGuess && (
          <section className={styles.guessPanel}>
            {shopGuess.map((guess) => (
              <button
                className={styles.guessCard}
                key={guess.id}
                type="button"
                onClick={() => alert(guess.title)}
              >
                <div className={styles.guessTop}>
                  <img
                    alt={guess.title}
                    src={
                      shopProducts.find((item) => item.id === guess.related)
                        ?.img || shopProducts[0]?.img
                    }
                  />
                    <div className={styles.guessInfo}>
                      <div className={styles.guessTitle}>{guess.title}</div>
                      <div className={styles.guessMeta}>
                        <i className="fa-solid fa-users" /> 1.2万参与 · 奖池 10,000 币
                      </div>
                    </div>
                </div>
                <div className={styles.guessOpts}>
                  <div className={styles.guessOpt}>
                    <div className={styles.guessOptName}>
                      {guess.options[0]}
                    </div>
                    <div className={styles.guessOptBar}>
                      <div
                        className={styles.guessOptFill}
                        style={{ width: `${guess.votes[0]}%` }}
                      />
                    </div>
                    <div className={styles.guessPct}>{guess.votes[0]}%</div>
                  </div>
                  <div className={styles.guessOpt}>
                    <div className={styles.guessOptName}>
                      {guess.options[1]}
                    </div>
                    <div className={styles.guessOptBar}>
                      <div
                        className={styles.guessOptFill}
                        style={{ width: `${guess.votes[1]}%` }}
                      />
                    </div>
                    <div className={styles.guessPct}>{guess.votes[1]}%</div>
                  </div>
                </div>
              </button>
            ))}
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
                  onClick={() => alert(item.name)}
                >
                  <div className={styles.productImg}>
                    <img alt={item.name} src={item.img} />
                    <span
                      className={`${styles.productBadge} ${styles.badgeNew}`}
                    >
                      新品
                    </span>
                  </div>
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productPrice}>
                      <span>¥</span>
                      <strong>{item.price}</strong>
                      <em>¥{item.orig}</em>
                    </div>
                    <div className={styles.productMeta}>
                      <span>{item.sales.toLocaleString()} 人付款</span>
                      <span>⭐ {item.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.bottomBar}>
        <button
          className={styles.bottomIcon}
          type="button"
          onClick={() => setFollowed((value) => !value)}
        >
          <span><i className={`${followed ? 'fa-solid' : 'fa-regular'} fa-heart`} /></span>
          收藏
        </button>
        <button
          className={styles.bottomIcon}
          type="button"
          onClick={() => alert('正在接入客服...')}
        >
          <span><i className="fa-regular fa-comments" /></span>
          客服
        </button>
        <div className={styles.bottomButtons}>
          <button
            className={styles.chatBtn}
            type="button"
            onClick={() => alert('正在接入店铺客服...')}
          >
            聊一聊
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => setTab('guess')}
          >
            <i className="fa-solid fa-bullseye" /> 参与竞猜
          </button>
        </div>
      </footer>
    </div>
  );
}
