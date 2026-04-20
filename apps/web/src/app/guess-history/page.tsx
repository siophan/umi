'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchGuessHistory } from '../../lib/api/guesses';
import styles from './page.module.css';

type TabKey = 'all' | 'active' | 'won' | 'lost' | 'pk';

export default function GuessHistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('all');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({
    stats: {
      total: 0,
      active: 0,
      won: 0,
      lost: 0,
      pk: 0,
      winRate: 0,
    },
    active: [] as Awaited<ReturnType<typeof fetchGuessHistory>>['active'],
    history: [] as Awaited<ReturnType<typeof fetchGuessHistory>>['history'],
    pk: [] as Awaited<ReturnType<typeof fetchGuessHistory>>['pk'],
  });

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
      try {
        const data = await fetchGuessHistory();
        if (!ignore) {
          setHistoryData(data);
        }
      } catch {
        if (ignore) {
          return;
        }
        setHistoryData({
          stats: {
            total: 0,
            active: 0,
            won: 0,
            lost: 0,
            pk: 0,
            winRate: 0,
          },
          active: [],
          history: [],
          pk: [],
        });
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredHistory = useMemo(
    () => historyData.history.filter((card) => tab === 'all' || card.outcome === tab),
    [historyData.history, tab],
  );

  const ringOffset = useMemo(() => {
    const circumference = 138.2;
    return circumference - (Math.max(0, Math.min(100, historyData.stats.winRate)) / 100) * circumference;
  }, [historyData.stats.winRate]);

  const canShowEmpty = !loading && (
    (tab === 'active' && historyData.active.length === 0) ||
    ((tab === 'all' || tab === 'won' || tab === 'lost') && filteredHistory.length === 0 && historyData.active.length === 0) ||
    (tab === 'pk' && historyData.pk.length === 0)
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.title}>我的竞猜</div>
        <button className={styles.action} type="button" onClick={() => setToast('链接已复制')}>
          <i className="fa-solid fa-share-nodes" />
        </button>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroTitle}>
          <i className="fa-solid fa-chart-pie" />
          我的竞猜数据
        </div>
        <div className={styles.statsGrid}>
          {[
            { value: historyData.stats.total, label: '总竞猜', accent: false },
            { value: historyData.stats.won, label: '猜中', accent: true },
            { value: historyData.stats.lost, label: '未中', accent: false },
            { value: `${historyData.stats.winRate}%`, label: '胜率', accent: false },
          ].map((item) => (
            <div key={item.label} className={styles.statItem}>
              <div className={`${styles.statVal} ${item.accent ? styles.accentGreen : ''}`}>{item.value}</div>
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
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className={styles.ringInfo}>
            <div className={styles.ringPct}>{historyData.stats.winRate}%</div>
            <div className={styles.ringDetail}>已结算竞猜胜率</div>
            <div className={styles.ringBar}>
              <div className={styles.ringBarWin} style={{ width: `${historyData.stats.winRate}%` }} />
              <div className={styles.ringBarLoss} />
            </div>
          </div>
        </div>
      </section>

      <nav className={styles.tabs}>
        {[
          ['all', '全部', historyData.stats.total],
          ['active', '进行中', historyData.stats.active],
          ['won', '猜中', historyData.stats.won],
          ['lost', '未中', historyData.stats.lost],
          ['pk', 'PK', historyData.stats.pk],
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
          historyData.active.map((item, index) => (
            <article className={styles.activeCard} key={item.betId} style={{ animationDelay: `${index * 0.06}s` }}>
              <div className={styles.liveBadge}>
                <span className={styles.liveDot} />
                LIVE
              </div>
              <img
                alt={item.title}
                className={styles.activeImg}
                src={`/legacy/images/guess/g20${(index % 3) + 1}.jpg`}
              />
              <div className={styles.activeBody}>
                <div className={styles.activeTitle}>{item.title}</div>
                <div className={styles.activeMeta}>{item.participants}人参与 · {item.endTime.slice(0, 10)}截止</div>
                <div className={styles.activeChoice}>我选：{item.choiceText}</div>
                <div className={styles.activeCountdown}>
                  <span className={styles.cdBox}>{item.endTime.slice(5, 7)}</span>
                  <span className={styles.cdSep}>月</span>
                  <span className={styles.cdBox}>{item.endTime.slice(8, 10)}</span>
                  <span className={styles.cdSep}>日</span>
                </div>
                <div className={styles.activeProgress}>
                  <div className={styles.activeOpts}>
                    <span>{item.options[0] || '选项一'}</span>
                    <span>{item.options[1] || '选项二'}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressLeft} style={{ width: `${item.optionProgress[0] || 0}%` }} />
                  </div>
                </div>
              </div>
            </article>
          ))}

        {(tab === 'all' || tab === 'won' || tab === 'lost') &&
          filteredHistory.map((item, index) => (
            <article
              className={`${styles.card} ${item.outcome === 'won' ? styles.cardWon : styles.cardLost}`}
              key={item.betId}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className={styles.cardHeader}>
                <span className={`${styles.resultBadge} ${item.outcome === 'won' ? styles.resultWon : styles.resultLost}`}>
                  {item.rewardText}
                </span>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardDate}>{item.date}</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span>我的选择</span>
                  <strong>{item.choiceText}</strong>
                </div>
                <div className={styles.cardRow}>
                  <span>最终结果</span>
                  <strong className={item.outcome === 'won' ? styles.good : styles.bad}>{item.resultText}</strong>
                </div>
                <div className={`${styles.rewardBox} ${item.outcome === 'won' ? styles.rewardWon : styles.rewardLost}`}>
                  {item.rewardText}
                </div>
              </div>
            </article>
          ))}

        {tab === 'pk' &&
          historyData.pk.map((item) => (
            <article className={styles.pkCard} key={item.betId}>
              <div className={styles.pkHeader}>
                <div className={styles.pkTitle}>{item.title}</div>
                <div className={`${styles.pkResult} ${item.outcome === 'won' ? styles.pkWon : styles.pkLost}`}>
                  {item.outcome === 'won' ? '赢了' : '输了'}
                </div>
              </div>
              <div className={styles.pkVs}>
                <div className={styles.pkPlayer}>
                  <img alt="player-a" src="/legacy/images/mascot/mouse-main.png" />
                  <div className={styles.pkName}>{item.leftName}</div>
                  <div className={styles.pkChoice}>{item.leftChoice}</div>
                </div>
                <div className={styles.pkIcon}>VS</div>
                <div className={styles.pkPlayer}>
                  <img alt="player-b" src="/legacy/images/mascot/mouse-happy.png" />
                  <div className={styles.pkName}>{item.rightName}</div>
                  <div className={styles.pkChoice}>{item.rightChoice}</div>
                </div>
              </div>
              <div className={styles.pkFooter}>{item.footer}</div>
            </article>
          ))}

        {canShowEmpty ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <i className="fa-solid fa-bullseye" />
            </div>
            <div className={styles.emptyText}>暂无记录</div>
            <div className={styles.emptyTip}>快去参与一场竞猜试试吧。</div>
          </div>
        ) : null}
      </main>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}
