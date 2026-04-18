 'use client';

import { useMemo, useState } from 'react';

import { MobileShell } from '../components/mobile-shell';
import styles from './page.module.css';

const heroDots = [0, 1, 2, 3, 4];

const guessCards = [
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
];

const liveCards = [
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
];

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
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alpha',
    name: '预言大师',
    rate: '82.3%',
  },
  {
    rank: '🥈',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=beta',
    name: '零食侦探',
    rate: '79.6%',
  },
  {
    rank: '🥉',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=gamma',
    name: '热点猎手',
    rate: '76.1%',
  },
];

export default function HomePage() {
  const [mode, setMode] = useState<'guess' | 'live'>('guess');
  const [category, setCategory] = useState<'hot' | 'entertainment' | 'media' | 'sports'>('hot');

  const visibleCards = useMemo(() => (mode === 'guess' ? guessCards : liveCards), [mode]);
  const sectionSubtitle = mode === 'guess' ? '8场竞猜进行中' : '2场直播竞猜进行中';

  return (
    <MobileShell tab="home" tone="dark">
      <main className={styles.page}>
        <header className="home-header-v3">
          <div className="mini-tabs" id="miniTabs">
            <div className="mini-tab-slider" id="miniTabSlider" />
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
            <button className="hv3-action" type="button" title="搜索" onClick={() => window.location.assign('/search')}>
              <i className="fa-solid fa-magnifying-glass" />
            </button>
            <button className="hv3-action" type="button" onClick={() => window.location.assign('/notifications')}>
              <i className="fa-regular fa-bell" />
              <div className="notif-dot" />
            </button>
          </div>
        </header>

        <div className={styles.breakingBar}>
          <span className={`${styles.breakingTag} ${styles.breakingTagHot}`}>突发</span>
          <span className={styles.breakingDot} />
          <div className={styles.breakingScroll}>
            <div className={styles.breakingInner}>
              <span>
                ⚡ 乐事官方宣布马年限定新口味竞猜<span className={styles.highlight}>参与人数破8000</span>
              </span>
              <span className={styles.sep}>·</span>
              <span>
                🔥 本周竞猜王者诞生：<span className={styles.highlight}>连胜12场</span>
              </span>
            </div>
          </div>
        </div>

        <section className={styles.heroSwiper}>
          <div className={styles.heroTrack}>
            <article className={styles.heroSlide}>
              <img alt="hero" src={mode === 'guess' ? '/legacy/images/guess/g201.jpg' : '/legacy/images/guess/g202.jpg'} />
              <div className={styles.heroRank}>🏆 TOP 1</div>
              <div className={styles.heroOverlay}>
                <div className={styles.heroBadge}>{mode === 'guess' ? '👑 FIFA官方合作' : '🎥 直播连麦专场'}</div>
                <div className={styles.heroTitle}>
                  {mode === 'guess'
                    ? '2026世界杯冠军会是阿根廷还是法国？'
                    : '德芙新品直播现场竞猜：今晚销量能否破 5 万单？'}
                </div>
                <div className={styles.heroMeta}>
                  <span>{mode === 'guess' ? '👥 1.28万人' : '👥 8,632人围观'}</span>
                  <span>{mode === 'guess' ? '6天后截止' : '48分钟后封盘'}</span>
                </div>
                <div className={styles.heroPk}>
                  <div className={styles.heroPkLabels}>
                    <span>{mode === 'guess' ? '阿根廷卫冕' : '销量破5万'}</span>
                    <span>{mode === 'guess' ? '法国夺冠' : '销量不破5万'}</span>
                  </div>
                  <div className={styles.heroPkBar}>
                    <div className={styles.heroPkLeft} style={{ width: mode === 'guess' ? '56%' : '63%' }} />
                    <div className={styles.heroPkRight} style={{ width: mode === 'guess' ? '44%' : '37%' }} />
                  </div>
                  <div className={styles.heroPkLabels}>
                    <span>{mode === 'guess' ? '56%' : '63%'}</span>
                    <span>{mode === 'guess' ? '44%' : '37%'}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div className={styles.heroDots}>
            {heroDots.map((dot) => (
              <span className={`${styles.heroDot} ${dot === 0 ? styles.heroDotActive : ''}`} key={dot} />
            ))}
          </div>
        </section>

        <div className={styles.pkBanner}>
          <div className={styles.pkLive}>LIVE</div>
          <div className={styles.pkPlayers}>
            <img alt="pk-a" src="https://api.dicebear.com/7.x/adventurer/svg?seed=pk-a" />
            <div className={styles.pkVs}>VS</div>
            <img alt="pk-b" src="https://api.dicebear.com/7.x/adventurer/svg?seed=pk-b" />
          </div>
          <div className={styles.pkInfo}>
            <div className={styles.pkTitle}>好友PK对战中</div>
            <div className={styles.pkSub}>{mode === 'guess' ? '球迷小张 vs 零食猎人 · 1.28万人围观' : '直播抢答中 · 主播团 vs 猜友团'}</div>
          </div>
          <button className={styles.pkBtn} type="button">
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
            <article className={styles.guessCard} key={card.id}>
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
                  <button className={styles.pkMiniBtn} type="button">
                    ⚡
                  </button>
                  <button className={styles.joinBtn} type="button">
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
          <a className={styles.sectionMore} href="javascript:void(0)">
            全部记录 <i className="fa-solid fa-chevron-right" />
          </a>
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
          <a className={styles.sectionMore} href="javascript:void(0)">
            完整榜单 <i className="fa-solid fa-chevron-right" />
          </a>
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
