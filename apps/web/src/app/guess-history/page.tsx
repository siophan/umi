'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

type TabKey = 'all' | 'active' | 'won' | 'lost' | 'pk';

const stats = [
  { value: 28, label: '总竞猜', accent: false },
  { value: 19, label: '猜中', accent: true },
  { value: 9, label: '未中', accent: false },
  { value: '67.9%', label: '胜率', accent: false },
];

const activeGuesses = [
  {
    title: '2026世界杯冠军会是阿根廷还是法国？',
    meta: '👥 1.28万 · 6天后截止',
    choice: '我选：阿根廷卫冕',
    countdown: ['06', '时', '18', '分'],
    progress: [56, 44],
  },
  {
    title: '新 iPhone 会不会在今年 9 月发布会上推出折叠屏？',
    meta: '👥 9,340 · 2小时后截止',
    choice: '我选：会发布',
    countdown: ['02', '时', '31', '分'],
    progress: [62, 38],
  },
];

const historyCards = [
  {
    type: 'won',
    title: '德芙情人节礼盒销量竞猜',
    date: '2026-04-12',
    choice: '会爆单',
    result: '猜中！香氛礼盒已入仓库',
    reward: '🎉 猜中',
    rewardClass: styles.rewardWon,
  },
  {
    type: 'lost',
    title: '泡泡玛特联名盲盒热度竞猜',
    date: '2026-04-08',
    choice: '热度破万',
    result: '未中，已补偿 8 元优惠券',
    reward: '🎫 8 元券',
    rewardClass: styles.rewardLost,
  },
  {
    type: 'won',
    title: '苹果折叠屏发布时间竞猜',
    date: '2026-04-03',
    choice: '会发布',
    result: '猜中！已补发权益金',
    reward: '🎉 猜中',
    rewardClass: styles.rewardWon,
  },
];

const pkCards = [
  {
    title: '球迷小张 vs 零食猎人',
    result: '赢了',
    mode: 'won',
    left: '球迷小张\n阿根廷卫冕',
    right: '零食猎人\n法国夺冠',
    footer: '1.28万人围观 · 2026-04-14',
  },
  {
    title: '阿森纳球迷 vs 预测家',
    result: '输了',
    mode: 'lost',
    left: '阿森纳球迷\n会进前四',
    right: '预测家\n不会进前四',
    footer: '9,812 人围观 · 2026-04-10',
  },
];

export default function GuessHistoryPage() {
  const [tab, setTab] = useState<TabKey>('all');

  const filteredHistory = useMemo(
    () => historyCards.filter((card) => tab === 'all' || card.type === tab),
    [tab],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => window.history.back()}
        >
          ‹
        </button>
        <div className={styles.title}>我的竞猜</div>
        <button
          className={styles.action}
          type="button"
          onClick={() => alert('分享竞猜数据')}
        >
          ↗
        </button>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroTitle}>
          <span>◔</span>
          我的竞猜数据
        </div>
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <div key={item.label} className={styles.statItem}>
              <div
                className={`${styles.statVal} ${item.accent ? styles.accentGreen : ''}`}
              >
                {item.value}
              </div>
              <div className={styles.statLabel}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.ringCard}>
          <svg className={styles.ringSvg} viewBox="0 0 56 56">
            <defs>
              <linearGradient id="ghRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ff9800" />
              </linearGradient>
            </defs>
            <circle className={styles.ringBg} cx="28" cy="28" r="22" />
            <circle
              className={styles.ringFill}
              cx="28"
              cy="28"
              r="22"
              strokeDasharray="138.2"
              strokeDashoffset="45.8"
            />
          </svg>
          <div className={styles.ringInfo}>
            <div className={styles.ringPct}>67.9%</div>
            <div className={styles.ringDetail}>胜率较上周 +8.4%</div>
            <div className={styles.ringBar}>
              <div className={styles.ringBarWin} style={{ width: '67.9%' }} />
              <div className={styles.ringBarLoss} />
            </div>
          </div>
        </div>
      </section>

      <nav className={styles.tabs}>
        {[
          ['all', '全部', '28'],
          ['active', '进行中', '2'],
          ['won', '猜中', '19'],
          ['lost', '未中', '9'],
          ['pk', 'PK', '2'],
        ].map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key as TabKey)}
          >
            {label}
            <span className={styles.count}>{count}</span>
          </button>
        ))}
      </nav>

      <main className={styles.records}>
        {(tab === 'all' || tab === 'active') &&
          activeGuesses.map((item, index) => (
            <article
              className={styles.activeCard}
              key={item.title}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className={styles.liveBadge}>
                <span className={styles.liveDot} />
                LIVE
              </div>
              <img
                alt={item.title}
                className={styles.activeImg}
                src={`/legacy/images/guess/g20${index + 1}.jpg`}
              />
              <div className={styles.activeBody}>
                <div className={styles.activeTitle}>{item.title}</div>
                <div className={styles.activeMeta}>{item.meta}</div>
                <div className={styles.activeChoice}>{item.choice}</div>
                <div className={styles.activeCountdown}>
                  <span className={styles.cdBox}>{item.countdown[0]}</span>
                  <span className={styles.cdSep}>时</span>
                  <span className={styles.cdBox}>{item.countdown[2]}</span>
                  <span className={styles.cdSep}>分</span>
                </div>
                <div className={styles.activeProgress}>
                  <div className={styles.activeOpts}>
                    <span>选项一</span>
                    <span>选项二</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressLeft}
                      style={{ width: `${item.progress[0]}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}

        {(tab === 'all' || tab === 'won' || tab === 'lost') &&
          filteredHistory.map((item, index) => (
            <article
              className={`${styles.card} ${item.type === 'won' ? styles.cardWon : styles.cardLost}`}
              key={item.title}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className={styles.cardHeader}>
                <span
                  className={`${styles.resultBadge} ${item.type === 'won' ? styles.resultWon : styles.resultLost}`}
                >
                  {item.reward}
                </span>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardDate}>{item.date}</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span>我的选择</span>
                  <strong>{item.choice}</strong>
                </div>
                <div className={styles.cardRow}>
                  <span>最终结果</span>
                  <strong
                    className={item.type === 'won' ? styles.good : styles.bad}
                  >
                    {item.result}
                  </strong>
                </div>
                <div className={`${styles.rewardBox} ${item.rewardClass}`}>
                  {item.reward}
                </div>
              </div>
            </article>
          ))}

        {tab === 'pk' &&
          pkCards.map((item) => (
            <article className={styles.pkCard} key={item.title}>
              <div className={styles.pkHeader}>
                <div className={styles.pkTitle}>{item.title}</div>
                <div
                  className={`${styles.pkResult} ${item.mode === 'won' ? styles.pkWon : styles.pkLost}`}
                >
                  {item.result}
                </div>
              </div>
              <div className={styles.pkVs}>
                <div className={styles.pkPlayer}>
                  <img
                    alt="player-a"
                    src="https://api.dicebear.com/7.x/adventurer/svg?seed=player-a"
                  />
                  <div className={styles.pkName}>
                    {item.left.split('\n')[0]}
                  </div>
                  <div className={styles.pkChoice}>
                    {item.left.split('\n')[1]}
                  </div>
                </div>
                <div className={styles.pkIcon}>VS</div>
                <div className={styles.pkPlayer}>
                  <img
                    alt="player-b"
                    src="https://api.dicebear.com/7.x/adventurer/svg?seed=player-b"
                  />
                  <div className={styles.pkName}>
                    {item.right.split('\n')[0]}
                  </div>
                  <div className={styles.pkChoice}>
                    {item.right.split('\n')[1]}
                  </div>
                </div>
              </div>
              <div className={styles.pkFooter}>{item.footer}</div>
            </article>
          ))}

        {tab !== 'pk' &&
        tab !== 'active' &&
        tab !== 'all' &&
        filteredHistory.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎯</div>
            <div className={styles.emptyText}>暂无记录</div>
            <div className={styles.emptyTip}>
              去参与一场竞猜，记录就会出现在这里。
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
