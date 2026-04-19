'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MobileShell } from '../components/mobile-shell';
import styles from './page.module.css';

const heroDots = [0, 1, 2];
const breakingEvents = [
  { tag: '突发', tagClass: 'breaking', text: '⚡ 乐事官方宣布马年限定新口味竞猜', highlight: '参与人数破8000' },
  { tag: '下注', tagClass: 'bet', text: '🎯 球迷小张刚刚押注「阿根廷卫冕」', highlight: '下注金额 ¥99' },
  { tag: '开奖', tagClass: 'result', text: '🎉 德芙礼盒销量竞猜刚刚开奖', highlight: '恭喜 128 位用户猜中' },
  { tag: '热议', tagClass: 'hot', text: '🔥 直播间销量竞猜热度冲上榜首', highlight: '围观人数 1.2 万+' },
] as const;

const guessCardsByCategory = {
  hot: [
  {
    id: 'g001',
    title: '2026世界杯冠军会是阿根廷还是法国？',
    image: '/legacy/images/guess/g001.jpg',
    status: '火热',
    statusClass: 'hot',
    countdown: ['06', '时', '18', '分'],
    odds: [
      { label: '阿根廷卫冕… ×1.8', trend: 'up' },
      { label: '法国夺冠… ×2.1', trend: 'down' },
    ],
    leftLabel: '阿根廷卫冕 56%',
    rightLabel: '44% 法国夺冠',
    leftWidth: '56%',
    rightWidth: '44%',
    meta: '👥 1.28万 · 6天后截止',
  },
  {
    id: 'g002',
    title: '新iPhone会不会在今年 9 月发布会上推出折叠屏？',
    image: '/legacy/images/guess/g002.jpg',
    status: '即将开奖',
    statusClass: 'ending',
    countdown: ['02', '时', '31', '分'],
    odds: [
      { label: '会发布… ×1.7', trend: 'up' },
      { label: '不会发布… ×2.3', trend: 'down' },
    ],
    leftLabel: '会发布 62%',
    rightLabel: '38% 不会发布',
    leftWidth: '62%',
    rightWidth: '38%',
    meta: '👥 9,340 · 2小时后截止',
  },
  {
    id: 'g003',
    title: '今年国庆最火自驾路线会是川藏线还是独库公路？',
    image: '/legacy/images/guess/g003.jpg',
    status: '新',
    statusClass: 'new',
    countdown: ['18', '时', '45', '分'],
    odds: [
      { label: '川藏线… ×1.9', trend: 'up' },
      { label: '独库公路… ×2.0', trend: 'down' },
    ],
    leftLabel: '川藏线 51%',
    rightLabel: '49% 独库公路',
    leftWidth: '51%',
    rightWidth: '49%',
    meta: '👥 5,870 · 明晚开奖',
  },
  ],
  entertainment: [
    {
      id: 'g004',
      title: '顶流男女主会不会在下部综艺里同台合作？',
      image: '/legacy/images/guess/g202.jpg',
      status: '热议',
      statusClass: 'hot',
      countdown: ['04', '时', '06', '分'],
      odds: [
        { label: '会同台… ×1.6', trend: 'up' },
        { label: '不会同台… ×2.6', trend: 'down' },
      ],
      leftLabel: '会同台 66%',
      rightLabel: '34% 不会同台',
      leftWidth: '66%',
      rightWidth: '34%',
      meta: '👥 8,126 · 今晚开奖',
    },
  ],
  media: [
    {
      id: 'g005',
      title: '今年暑期档票房冠军会不会被动画电影拿下？',
      image: '/legacy/images/guess/g003.jpg',
      status: '上新',
      statusClass: 'new',
      countdown: ['11', '时', '54', '分'],
      odds: [
        { label: '动画夺冠… ×1.9', trend: 'up' },
        { label: '真人夺冠… ×2.0', trend: 'down' },
      ],
      leftLabel: '动画 52%',
      rightLabel: '48% 真人',
      leftWidth: '52%',
      rightWidth: '48%',
      meta: '👥 4,312 · 明早开奖',
    },
  ],
  sports: [
    {
      id: 'g006',
      title: '欧冠决赛会不会出现加时赛？',
      image: '/legacy/images/guess/g001.jpg',
      status: '火热',
      statusClass: 'ending',
      countdown: ['01', '时', '42', '分'],
      odds: [
        { label: '会加时… ×1.7', trend: 'up' },
        { label: '不加时… ×2.3', trend: 'down' },
      ],
      leftLabel: '会加时 58%',
      rightLabel: '42% 不加时',
      leftWidth: '58%',
      rightWidth: '42%',
      meta: '👥 7,903 · 1小时后截止',
    },
  ],
} as const;

const liveCardsByCategory = {
  hot: [
  {
    id: 'l001',
    title: '德芙新品直播现场竞猜：今晚销量能否破 5 万单？',
    image: '/legacy/images/guess/g201.jpg',
    status: '直播中',
    statusClass: 'hot',
    countdown: ['00', '时', '48', '分'],
    odds: [
      { label: '能破5万… ×1.6', trend: 'up' },
      { label: '无法突破… ×2.4', trend: 'down' },
    ],
    leftLabel: '突破 63%',
    rightLabel: '37% 不破',
    leftWidth: '63%',
    rightWidth: '37%',
    meta: '直播间 8,632人 · 48分钟后封盘',
  },
  {
    id: 'l002',
    title: '三只松鼠周年场直播：坚果礼盒会不会 10 分钟内售罄？',
    image: '/legacy/images/guess/g202.jpg',
    status: '连麦中',
    statusClass: 'ending',
    countdown: ['01', '时', '12', '分'],
    odds: [
      { label: '会售罄… ×1.8', trend: 'up' },
      { label: '不会售罄… ×2.1', trend: 'down' },
    ],
    leftLabel: '会售罄 54%',
    rightLabel: '46% 不会',
    leftWidth: '54%',
    rightWidth: '46%',
    meta: '直播间 5,912人 · 72分钟后截止',
  },
  ],
  entertainment: [
    {
      id: 'l003',
      title: '明星同款直播专场：联名礼盒能否 5 分钟售罄？',
      image: '/legacy/images/guess/g202.jpg',
      status: '直播中',
      statusClass: 'hot',
      countdown: ['00', '时', '36', '分'],
      odds: [
        { label: '5分钟售罄… ×1.8', trend: 'up' },
        { label: '不会售罄… ×2.2', trend: 'down' },
      ],
      leftLabel: '会售罄 57%',
      rightLabel: '43% 不会',
      leftWidth: '57%',
      rightWidth: '43%',
      meta: '直播间 6,218人 · 36分钟后封盘',
    },
  ],
  media: [
    {
      id: 'l004',
      title: '综艺冠军直播返场：限定零食箱会不会秒光？',
      image: '/legacy/images/guess/g201.jpg',
      status: '连麦中',
      statusClass: 'ending',
      countdown: ['00', '时', '58', '分'],
      odds: [
        { label: '会秒光… ×1.9', trend: 'up' },
        { label: '不会秒光… ×2.0', trend: 'down' },
      ],
      leftLabel: '会秒光 53%',
      rightLabel: '47% 不会',
      leftWidth: '53%',
      rightWidth: '47%',
      meta: '直播间 4,925人 · 58分钟后截止',
    },
  ],
  sports: [
    {
      id: 'l005',
      title: '球星联名专场直播：限量球衣会不会一分钟抢空？',
      image: '/legacy/images/guess/g001.jpg',
      status: '直播中',
      statusClass: 'hot',
      countdown: ['00', '时', '22', '分'],
      odds: [
        { label: '会抢空… ×1.5', trend: 'up' },
        { label: '不会抢空… ×2.8', trend: 'down' },
      ],
      leftLabel: '会抢空 69%',
      rightLabel: '31% 不会',
      leftWidth: '69%',
      rightWidth: '31%',
      meta: '直播间 9,106人 · 22分钟后封盘',
    },
  ],
} as const;

const heroCardsByMode = {
  guess: [
    {
      image: '/legacy/images/guess/g201.jpg',
      badge: '👑 FIFA官方合作',
      title: '2026世界杯冠军会是阿根廷还是法国？',
      meta: ['👥 1.28万人', '6天后截止'],
      left: '阿根廷卫冕',
      right: '法国夺冠',
      leftPct: '56%',
      rightPct: '44%',
      href: '/guess/g001',
    },
    {
      image: '/legacy/images/guess/g202.jpg',
      badge: '🎬 影视热榜',
      title: '暑期档票房冠军会不会被动画电影拿下？',
      meta: ['👥 6,812人', '明晚截止'],
      left: '动画夺冠',
      right: '真人夺冠',
      leftPct: '52%',
      rightPct: '48%',
      href: '/guess/g005',
    },
    {
      image: '/legacy/images/guess/g003.jpg',
      badge: '⚽ 焦点赛事',
      title: '欧冠决赛会不会出现加时赛？',
      meta: ['👥 7,903人', '1小时后截止'],
      left: '会加时',
      right: '不加时',
      leftPct: '58%',
      rightPct: '42%',
      href: '/guess/g006',
    },
  ],
  live: [
    {
      image: '/legacy/images/guess/g202.jpg',
      badge: '🎥 直播连麦专场',
      title: '德芙新品直播现场竞猜：今晚销量能否破 5 万单？',
      meta: ['👥 8,632人围观', '48分钟后封盘'],
      left: '销量破5万',
      right: '销量不破5万',
      leftPct: '63%',
      rightPct: '37%',
      href: '/live/l001',
    },
    {
      image: '/legacy/images/guess/g201.jpg',
      badge: '🛒 热门带货',
      title: '直播限时秒杀场：联名礼包会不会 5 分钟售罄？',
      meta: ['👥 5,912人围观', '72分钟后封盘'],
      left: '会售罄',
      right: '不会售罄',
      leftPct: '54%',
      rightPct: '46%',
      href: '/live/l002',
    },
    {
      image: '/legacy/images/guess/g001.jpg',
      badge: '🏟 球星联名',
      title: '球星联名专场直播：限量球衣会不会一分钟抢空？',
      meta: ['👥 9,106人围观', '22分钟后封盘'],
      left: '会抢空',
      right: '不会抢空',
      leftPct: '69%',
      rightPct: '31%',
      href: '/live/l005',
    },
  ],
} as const;

const recentResults = [
  {
    title: '德芙情人节礼盒销量竞猜',
    detail: '预测: 会爆单 · 猜中！香氛礼盒已入仓库',
    amount: '🎉 猜中',
    type: 'won',
  },
  {
    title: '泡泡玛特联名盲盒热度竞猜',
    detail: '预测: 热度破万 · 未中，已补偿8元优惠券',
    amount: '🎫 8元券',
    type: 'lost',
  },
  {
    title: '苹果折叠屏发布时间竞猜',
    detail: '预测: 会发布 · 猜中！已补发权益金',
    amount: '🎉 猜中',
    type: 'won',
  },
];

const rankings = [
  {
    rank: '🥇',
    avatar: '/legacy/images/mascot/mouse-main.png',
    name: '预言大师',
    rate: '82.3%',
  },
  {
    rank: '🥈',
    avatar: '/legacy/images/mascot/mouse-happy.png',
    name: '零食侦探',
    rate: '79.6%',
  },
  {
    rank: '🥉',
    avatar: '/legacy/images/mascot/mouse-casual.png',
    name: '热点猎手',
    rate: '76.1%',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'guess' | 'live'>('guess');
  const [category, setCategory] = useState<'hot' | 'entertainment' | 'media' | 'sports'>('hot');
  const [heroIndex, setHeroIndex] = useState(0);
  const [breakingIndex, setBreakingIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.sessionStorage.getItem('splashShown')) {
      window.sessionStorage.setItem('splashShown', '1');
      router.replace('/splash');
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroDots.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBreakingIndex((current) => (current + 1) % breakingEvents.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  const visibleCards = useMemo(
    () => (mode === 'guess' ? guessCardsByCategory[category] : liveCardsByCategory[category]),
    [category, mode],
  );
  const heroCards = heroCardsByMode[mode];
  const heroCard = heroCards[heroIndex % heroCards.length];
  const breakingEvent = breakingEvents[breakingIndex % breakingEvents.length];
  const sectionSubtitle = mode === 'guess' ? '8场竞猜进行中' : '2场直播竞猜进行中';

  return (
    <MobileShell tab="home" tone="dark">
      <main className={styles.page}>
        <header className="home-header-v3">
          <div className="mini-tabs" id="miniTabs">
            <div className={`mini-tab-slider ${mode === 'live' ? 'pos-1' : ''}`} id="miniTabSlider" />
            <button
              className={`mini-tab ${mode === 'guess' ? 'active' : ''}`}
              data-idx="0"
              type="button"
              onClick={() => setMode('guess')}
            >
              <span className="tab-emoji">🎰</span>竞猜
            </button>
            <button
              className={`mini-tab ${mode === 'live' ? 'active' : ''}`}
              data-idx="1"
              type="button"
              onClick={() => setMode('live')}
            >
              <span className="tab-emoji">📺</span>直播竞猜
            </button>
          </div>
          <div className="hv3-spacer" />
          <div className="hv3-actions">
            <button className="hv3-action" type="button" title="搜索" onClick={() => router.push('/search')}>
              <i className="fa-solid fa-magnifying-glass" />
            </button>
            <button className="hv3-action" type="button" onClick={() => router.push('/notifications')}>
              <i className="fa-regular fa-bell" />
              <div className="notif-dot" />
            </button>
          </div>
        </header>

        <div className={styles.breakingBar}>
          <span className={`${styles.breakingTag} ${styles[`breakingTag${breakingEvent.tagClass[0].toUpperCase()}${breakingEvent.tagClass.slice(1)}`]}`}>
            {breakingEvent.tag}
          </span>
          <span className={styles.breakingDot} />
          <div className={styles.breakingScroll}>
            <div className={styles.breakingInner}>
              <span>
                {breakingEvent.text}
                <span className={styles.highlight}>{breakingEvent.highlight}</span>
              </span>
            </div>
          </div>
        </div>

        <section className={styles.heroSwiper}>
          <div className={styles.heroTrack}>
            <article className={styles.heroSlide} onClick={() => router.push(heroCard.href)}>
              <img alt="hero" src={heroCard.image} />
              <div className={styles.heroRank}>🏆 TOP 1</div>
              <div className={styles.heroOverlay}>
                <div className={styles.heroBadge}>{heroCard.badge}</div>
                <div className={styles.heroTitle}>{heroCard.title}</div>
                <div className={styles.heroMeta}>
                  <span>{heroCard.meta[0]}</span>
                  <span>{heroCard.meta[1]}</span>
                </div>
                <div className={styles.heroPk}>
                  <div className={styles.heroPkLabels}>
                    <span>{heroCard.left}</span>
                    <span>{heroCard.right}</span>
                  </div>
                  <div className={styles.heroPkBar}>
                    <div className={styles.heroPkLeft} style={{ width: heroCard.leftPct }} />
                    <div className={styles.heroPkRight} style={{ width: heroCard.rightPct }} />
                  </div>
                  <div className={styles.heroPkLabels}>
                    <span>{heroCard.leftPct}</span>
                    <span>{heroCard.rightPct}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div className={styles.heroDots}>
            {heroDots.map((dot) => (
              <button
                className={`${styles.heroDot} ${dot === heroIndex ? styles.heroDotActive : ''}`}
                key={dot}
                type="button"
                onClick={() => setHeroIndex(dot)}
              />
            ))}
          </div>
        </section>

        <div className={styles.pkBanner}>
          <div className={styles.pkLive}>LIVE</div>
          <div className={styles.pkPlayers}>
            <img alt="pk-a" src="/legacy/images/mascot/mouse-main.png" />
            <div className={styles.pkVs}>VS</div>
            <img alt="pk-b" src="/legacy/images/mascot/mouse-happy.png" />
          </div>
          <div className={styles.pkInfo}>
            <div className={styles.pkTitle}>好友PK对战中</div>
            <div className={styles.pkSub}>{mode === 'guess' ? '球迷小张 vs 零食猎人 · 1.28万人围观' : '直播抢答中 · 主播团 vs 猜友团'}</div>
          </div>
          <button className={styles.pkBtn} type="button" onClick={() => router.push(mode === 'guess' ? '/guess-order?id=g001&choice=0&qty=1' : '/live/l001')}>
            {mode === 'guess' ? '加入PK' : '进入直播'}
          </button>
        </div>

        <div className={styles.catBar}>
          <div className={styles.catScroll}>
            <button className={`${styles.catChip} ${category === 'hot' ? styles.catActive : ''}`} type="button" onClick={() => setCategory('hot')}>
              <i className="fa-solid fa-fire" />
              <span>今日热点</span>
            </button>
            <button className={`${styles.catChip} ${category === 'entertainment' ? styles.catActive : ''}`} type="button" onClick={() => setCategory('entertainment')}>
              <i className="fa-solid fa-star" />
              <span>娱乐明星</span>
            </button>
            <button className={`${styles.catChip} ${category === 'media' ? styles.catActive : ''}`} type="button" onClick={() => setCategory('media')}>
              <i className="fa-solid fa-clapperboard" />
              <span>影视综艺</span>
            </button>
            <button className={`${styles.catChip} ${category === 'sports' ? styles.catActive : ''}`} type="button" onClick={() => setCategory('sports')}>
              <i className="fa-solid fa-futbol" />
              <span>体育赛事</span>
            </button>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitle}>正在进行</div>
            <div className={styles.sectionSubtitle}>{sectionSubtitle}</div>
          </div>
          <div className={styles.modeRoller}>
            <div className={`${styles.modeItem} ${styles.modeChampion}`}>
              <span className={styles.modeEmoji}>🏆</span>
              <span>冠军之路</span>
            </div>
            <div className={`${styles.modeItem} ${styles.modeTriple}`}>
              <span className={styles.modeEmoji}>⛩️</span>
              <span>闯三关</span>
            </div>
            <div className={`${styles.modeItem} ${styles.modeBlind}`}>
              <span className={styles.modeEmoji}>🎁</span>
              <span>盲盒竞猜</span>
            </div>
          </div>
        </div>

        <section className={styles.listArea}>
          {visibleCards.map((card) => (
            <article className={styles.guessCard} key={card.id} onClick={() => router.push(mode === 'guess' ? `/guess/${card.id}` : `/live/${card.id}`)}>
              <div className={styles.cardImageWrap}>
                <img alt={card.title} src={card.image} />
                <span className={`${styles.cardStatus} ${styles[card.statusClass]}`}>{card.status}</span>
                <div className={styles.cardCountdown}>
                  <span className={styles.cdNum}>{card.countdown[0]}</span>
                  <span className={styles.cdSep}>{card.countdown[1]}</span>
                  <span className={styles.cdNum}>{card.countdown[2]}</span>
                  <span className={styles.cdSep}>{card.countdown[3]}</span>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{card.title}</div>
                <div className={styles.oddsRow}>
                  {card.odds.map((odd) => (
                    <span className={`${styles.oddChip} ${styles[odd.trend]}`} key={odd.label}>
                      {odd.label}
                    </span>
                  ))}
                </div>
                <div className={styles.pkRow}>
                  <div className={styles.duel}>
                    <div className={styles.duelLabels}>
                      <span>{card.leftLabel}</span>
                      <span>{card.rightLabel}</span>
                    </div>
                    <div className={styles.duelBar}>
                      <div className={styles.duelLeft} style={{ width: card.leftWidth }} />
                      <div className={styles.duelRight} style={{ width: card.rightWidth }} />
                    </div>
                  </div>
                  <button className={styles.pkMiniBtn} type="button" onClick={(event) => { event.stopPropagation(); router.push('/guess-order?id=g001&choice=0&qty=1'); }}>
                    ⚡
                  </button>
                  <button className={styles.joinBtn} type="button" onClick={(event) => { event.stopPropagation(); router.push(mode === 'guess' ? `/guess/${card.id}` : `/live/${card.id}`); }}>
                    {mode === 'guess' ? '参与' : '围观'}
                  </button>
                </div>
                <div className={styles.cardMeta}>{card.meta}</div>
              </div>
            </article>
          ))}
        </section>

        <div className={styles.divider} />

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>🎉 最近开奖</div>
          <button className={styles.sectionMore} type="button" onClick={() => router.push('/guess-history')}>
            全部记录 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>

        <section className={styles.resultArea}>
          {recentResults.map((item) => (
            <div className={styles.resultItem} key={item.title}>
              <div className={`${styles.resultIcon} ${styles[item.type]}`}>{item.type === 'won' ? '🎉' : '🎫'}</div>
              <div className={styles.resultInfo}>
                <div className={styles.resultTitle}>{item.title}</div>
                <div className={styles.resultDetail}>{item.detail}</div>
              </div>
              <div className={`${styles.resultAmount} ${styles[item.type]}`}>{item.amount}</div>
            </div>
          ))}
        </section>

        <div className={styles.divider} />

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>🏆 竞猜达人榜</div>
          <button className={styles.sectionMore} type="button" onClick={() => router.push('/ranking')}>
            完整榜单 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>

        <section className={styles.rankArea}>
          {rankings.map((item) => (
            <div className={styles.rankRow} key={item.name}>
              <div className={styles.rankNo}>{item.rank}</div>
              <img alt={item.name} className={styles.rankAvatar} src={item.avatar} />
              <div className={styles.rankName}>{item.name}</div>
              <div className={styles.rankRate}>{item.rate}</div>
            </div>
          ))}
        </section>
      </main>
    </MobileShell>
  );
}
