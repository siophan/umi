'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { GuessHistoryListTab } from '@umi/shared';

import { fetchGuessHistory, fetchGuessHistoryPage } from '../../lib/api/guesses';
import { hasAuthToken } from '../../lib/api/shared';
import styles from './page.module.css';

type TabKey = 'all' | 'active' | 'won' | 'lost' | 'pk';

type Streak = { type: 'win' | 'loss'; count: number };
type HistoryItem = Awaited<ReturnType<typeof fetchGuessHistory>>['history'][number];
type ActiveItem = Awaited<ReturnType<typeof fetchGuessHistory>>['active'][number];
type PkItem = Awaited<ReturnType<typeof fetchGuessHistory>>['pk'][number];

/** UI tab → 服务端 list tab 映射（"all" 复用 history 流，"已结算"两个 tab 各自独立游标） */
const TAB_TO_LIST: Record<TabKey, GuessHistoryListTab> = {
  all: 'history',
  active: 'active',
  won: 'won',
  lost: 'lost',
  pk: 'pk',
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 22; // r=22 → ≈138.23

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0) {
      setValue(target || 0);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function computeStreaks(records: HistoryItem[]): Record<number, Streak> {
  const out: Record<number, Streak> = {};
  if (records.length < 2) {
    return out;
  }
  // refunded 不计入连胜/连败，遇到就断 streak
  const isCountable = (outcome: HistoryItem['outcome']) => outcome === 'won' || outcome === 'lost';
  let count = 0;
  let prev: HistoryItem['outcome'] | null = null;

  const flush = (endExclusive: number) => {
    if (count >= 2 && prev) {
      for (let j = endExclusive - count; j < endExclusive; j += 1) {
        out[j] = { type: prev === 'won' ? 'win' : 'loss', count };
      }
    }
    count = 0;
    prev = null;
  };

  for (let i = 0; i < records.length; i += 1) {
    const cur = records[i].outcome;
    if (!isCountable(cur)) {
      flush(i);
      continue;
    }
    if (cur === prev) {
      count += 1;
    } else {
      flush(i);
      count = 1;
      prev = cur;
    }
  }
  flush(records.length);
  return out;
}

function formatCount(n: number) {
  if (n >= 10_000) {
    return `${(n / 10_000).toFixed(1).replace(/\.0$/, '')}w`;
  }
  return String(n);
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function CountdownBoxes({ endTime, now }: { endTime: string; now: number }) {
  const diff = new Date(endTime).getTime() - now;
  if (diff <= 0) {
    return (
      <span className={styles.activeEnded}>
        <i className="fa-solid fa-circle-check" /> 已开奖
      </span>
    );
  }
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return (
    <>
      <i className="fa-solid fa-clock" />
      距开奖
      <span className={styles.cdBox}>{pad2(h)}</span>
      <span className={styles.cdSep}>:</span>
      <span className={styles.cdBox}>{pad2(m)}</span>
      <span className={styles.cdSep}>:</span>
      <span className={styles.cdBox}>{pad2(s)}</span>
    </>
  );
}

function ActiveCard({
  item,
  index,
  now,
  compact,
  onOpen,
}: {
  item: ActiveItem;
  index: number;
  now: number;
  compact?: boolean;
  onOpen: (id: string) => void;
}) {
  const pctA = item.optionProgress[0] ?? 0;
  const pctB = item.optionProgress[1] ?? Math.max(0, 100 - pctA);
  const optionA = item.options[0] || '选项A';
  const optionB = item.options[1] || '选项B';
  return (
    <article
      className={`${styles.activeCard} ${compact ? styles.activeCardCompact : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => onOpen(String(item.guessId))}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(String(item.guessId));
        }
      }}
    >
      <div className={styles.liveBadge}>
        <span className={styles.liveDot} />
        进行中
      </div>
      {item.imageUrl ? (
        <img alt={item.title} className={styles.activeImg} src={item.imageUrl} />
      ) : (
        <div className={`${styles.activeImg} ${styles.activeImgFallback}`}>
          <i className="fa-solid fa-image" />
        </div>
      )}
      <div className={styles.activeBody}>
        <div className={styles.activeTitle}>{item.title}</div>
        <div className={styles.activeMeta}>
          <span>
            <i className="fa-solid fa-users" /> {formatCount(item.participants)}人参与
          </span>
          {item.oddsCurrent > 0 ? (
            <span>
              <i className="fa-solid fa-chart-line" /> 倍率 ×{item.oddsCurrent.toFixed(2)}
            </span>
          ) : null}
        </div>
        <div className={styles.activeChoice}>
          <i className="fa-solid fa-hand-pointer" />
          我选了：{item.choiceText}
        </div>
        <div className={styles.activeCountdown}>
          <CountdownBoxes endTime={item.endTime} now={now} />
        </div>
        <div className={styles.activeProgress}>
          <div className={styles.activeOpts}>
            <span className={styles.optA}>
              {optionA} {pctA}%
            </span>
            <span className={styles.optB}>
              {optionB} {pctB}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressLeft} style={{ width: `${pctA}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function HistoryCard({
  item,
  index,
  streak,
  onOpen,
}: {
  item: HistoryItem;
  index: number;
  streak: Streak | undefined;
  onOpen: (id: string) => void;
}) {
  const cardSideClass =
    item.outcome === 'won' ? styles.cardWon : item.outcome === 'refunded' ? styles.cardRefunded : styles.cardLost;
  const badgeText =
    item.outcome === 'won' ? '🎉 猜中' : item.outcome === 'refunded' ? '💸 已退款' : '🎫 未中';
  const badgeClass =
    item.outcome === 'won'
      ? styles.resultWon
      : item.outcome === 'refunded'
        ? styles.resultRefunded
        : styles.resultLost;
  const rewardClass =
    item.outcome === 'won'
      ? styles.rewardWon
      : item.outcome === 'refunded'
        ? styles.rewardRefunded
        : styles.rewardLost;
  const rewardIcon =
    item.outcome === 'won' ? 'fa-gift' : item.outcome === 'refunded' ? 'fa-rotate-left' : 'fa-ticket';
  const rewardLine =
    item.outcome === 'won'
      ? item.wonAmountYuan > 0
        ? `投入 ¥${item.amountYuan.toFixed(2)}，赢得 ¥${item.wonAmountYuan.toFixed(2)}`
        : `投入 ¥${item.amountYuan.toFixed(2)}，已猜中`
      : item.outcome === 'refunded'
        ? `投入 ¥${item.amountYuan.toFixed(2)} 已原路退回`
        : `投入 ¥${item.amountYuan.toFixed(2)}，未中`;
  const resultValueClass =
    item.outcome === 'won' ? styles.good : item.outcome === 'refunded' ? styles.muted : styles.bad;

  return (
    <article
      className={`${styles.card} ${cardSideClass}`}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => onOpen(String(item.guessId))}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(String(item.guessId));
        }
      }}
    >
      <div className={styles.cardHeader}>
        <span className={`${styles.resultBadge} ${badgeClass}`}>{badgeText}</span>
        <div className={styles.cardTitle}>
          <span className={styles.cardTitleText}>{item.title}</span>
          {streak ? (
            <span className={`${styles.streakBadge} ${streak.type === 'win' ? styles.streakWin : styles.streakLoss}`}>
              {streak.type === 'win' ? '🔥' : '💪'} {streak.type === 'win' ? '连胜' : '连败'}
              {streak.count}
            </span>
          ) : null}
        </div>
        <div className={styles.cardDate}>{item.date}</div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardRow}>
          <span>我的预测</span>
          <strong>{item.choiceText}</strong>
        </div>
        <div className={styles.cardRow}>
          <span>{item.outcome === 'refunded' ? '处理结果' : '正确答案'}</span>
          <strong className={resultValueClass}>{item.resultText}</strong>
        </div>
        <div className={styles.cardRow}>
          <span>投入金额</span>
          <strong>¥{item.amountYuan.toFixed(2)}</strong>
        </div>
        <div className={styles.cardRow}>
          <span>竞猜规模</span>
          <strong>{formatCount(item.participants)}人参与</strong>
        </div>
        <div className={`${styles.rewardBox} ${rewardClass}`}>
          <i className={`fa-solid ${rewardIcon}`} />
          {rewardLine}
        </div>
      </div>
    </article>
  );
}

function PkCard({ item, index, onOpen }: { item: PkItem; index: number; onOpen: (id: string) => void }) {
  return (
    <article
      className={styles.pkCard}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => onOpen(String(item.guessId))}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(String(item.guessId));
        }
      }}
    >
      <div className={styles.pkHeader}>
        <div className={styles.pkTitle}>{item.title}</div>
        <div
          className={`${styles.pkResult} ${
            item.outcome === 'won'
              ? styles.pkWon
              : item.outcome === 'refunded'
                ? styles.pkRefunded
                : styles.pkLost
          }`}
        >
          {item.outcome === 'won' ? '🎉 胜利' : item.outcome === 'refunded' ? '💸 已退款' : '💪 惜败'}
        </div>
      </div>
      <div className={styles.pkVs}>
        <div className={styles.pkPlayer}>
          {item.leftAvatar ? (
            <img alt={item.leftName} src={item.leftAvatar} />
          ) : (
            <div className={styles.pkAvatarFallback}>{item.leftName.slice(0, 1)}</div>
          )}
          <div className={styles.pkName}>{item.leftName}</div>
          <div className={styles.pkChoice}>选: {item.leftChoice}</div>
        </div>
        <div className={styles.pkIcon}>VS</div>
        <div className={styles.pkPlayer}>
          {item.rightAvatar ? (
            <img alt={item.rightName} src={item.rightAvatar} />
          ) : (
            <div className={styles.pkAvatarFallback}>{item.rightName.slice(0, 1)}</div>
          )}
          <div className={styles.pkName}>{item.rightName}</div>
          <div className={styles.pkChoice}>选: {item.rightChoice}</div>
        </div>
      </div>
      <div className={styles.pkFooter}>
        {item.date} · 奖品：{item.prize}
      </div>
    </article>
  );
}

function EmptyBlock({
  icon,
  title,
  tip,
  ctaLabel,
  onCta,
}: {
  icon: string;
  title: string;
  tip: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyText}>{title}</div>
      <div className={styles.emptyTip}>{tip}</div>
      {ctaLabel && onCta ? (
        <button type="button" className={styles.emptyBtn} onClick={onCta}>
          <i className="fa-solid fa-fire" /> {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function GuessHistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('all');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    won: 0,
    lost: 0,
    pk: 0,
    winRate: 0,
    level: 1,
  });

  // 五条独立流：active / history / won / lost / pk
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [wonItems, setWonItems] = useState<HistoryItem[]>([]);
  const [lostItems, setLostItems] = useState<HistoryItem[]>([]);
  const [pkItems, setPkItems] = useState<PkItem[]>([]);
  const [cursors, setCursors] = useState<Record<GuessHistoryListTab, string | null>>({
    active: null,
    history: null,
    won: null,
    lost: null,
    pk: null,
  });
  // won/lost 不在首屏返回，标记是否已 lazy 加载过
  const [loadedTabs, setLoadedTabs] = useState<Record<GuessHistoryListTab, boolean>>({
    active: false,
    history: false,
    won: false,
    lost: false,
    pk: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // toast 自动消失
  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // 未登录跳走
  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  // 首屏加载：拉 stats + active/history/pk 各自第一页
  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      if (!hasAuthToken()) {
        if (!ignore) setLoading(false);
        return;
      }
      if (!ignore) {
        setLoading(true);
        setLoadError('');
      }
      try {
        const data = await fetchGuessHistory();
        if (ignore) return;
        setStats(data.stats);
        setActiveItems(data.active);
        setHistoryItems(data.history);
        setPkItems(data.pk);
        setWonItems([]);
        setLostItems([]);
        setCursors({
          active: data.nextCursor.active,
          history: data.nextCursor.history,
          won: null,
          lost: null,
          pk: data.nextCursor.pk,
        });
        setLoadedTabs({ active: true, history: true, won: false, lost: false, pk: true });
      } catch (error) {
        if (ignore) return;
        setLoadError(error instanceof Error ? error.message : '竞猜历史加载失败，请稍后重试');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  // 倒计时 tick — 仅在有 active 时启用
  useEffect(() => {
    if (activeItems.length === 0) {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeItems.length]);

  const animatedTotal = useAnimatedNumber(stats.total);
  const animatedWon = useAnimatedNumber(stats.won);
  const animatedRate = useAnimatedNumber(Math.round(stats.winRate));

  const streaks = useMemo(() => {
    if (tab === 'won') return computeStreaks(wonItems);
    if (tab === 'lost') return computeStreaks(lostItems);
    return computeStreaks(historyItems);
  }, [tab, historyItems, wonItems, lostItems]);

  const ringOffset = useMemo(() => {
    const winRate = Math.max(0, Math.min(100, stats.winRate));
    return RING_CIRCUMFERENCE - (winRate / 100) * RING_CIRCUMFERENCE;
  }, [stats.winRate]);

  const goHome = () => router.push('/');
  const goFriends = () => router.push('/friends');
  const openGuess = (id: string) => router.push(`/guess/${encodeURIComponent(id)}`);

  // 拉某 tab 的下一页（cursor=null 表示 lazy 首页）
  const loadTabPage = useCallback(
    async (listTab: GuessHistoryListTab, cursor: string | null) => {
      const data = await fetchGuessHistoryPage(listTab, cursor);
      const append = cursor !== null;
      if (data.tab === 'active') {
        setActiveItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } else if (data.tab === 'pk') {
        setPkItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } else if (data.tab === 'won') {
        setWonItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } else if (data.tab === 'lost') {
        setLostItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } else {
        setHistoryItems((prev) => (append ? [...prev, ...data.items] : data.items));
      }
      setCursors((prev) => ({ ...prev, [listTab]: data.nextCursor }));
      setLoadedTabs((prev) => ({ ...prev, [listTab]: true }));
    },
    [],
  );

  // tab 切换：若 won/lost 没加载过，触发 lazy 首页
  useEffect(() => {
    const listTab = TAB_TO_LIST[tab];
    if (!loadedTabs[listTab]) {
      void loadTabPage(listTab, null).catch(() => {
        /* 静默；用户可下拉重试 */
      });
    }
  }, [tab, loadedTabs, loadTabPage]);

  // sentinel 触底加载更多（当前 tab）
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const listTab = TAB_TO_LIST[tab];
    const cursor = cursors[listTab];
    if (!cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingMore) return;
        setLoadingMore(true);
        void loadTabPage(listTab, cursor)
          .catch(() => {
            /* 静默；下次进入再试 */
          })
          .finally(() => setLoadingMore(false));
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, cursors, loadingMore, loadTabPage]);

  const handleSwitchTab = (next: TabKey) => {
    if (next === tab) {
      return;
    }
    setTab(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.title}>我的竞猜</div>
        <button className={styles.action} type="button" onClick={() => setToast('竞猜数据分享功能开发中')}>
          <i className="fa-solid fa-share-nodes" />
        </button>
      </header>

      {loadError ? (
        <main className={styles.records}>
          <div className={styles.issueCard}>
            <div className={styles.issueIcon}>
              <i className="fa-solid fa-circle-exclamation" />
            </div>
            <div className={styles.issueTitle}>竞猜历史暂时不可用</div>
            <div className={styles.issueDesc}>{loadError}</div>
            <button className={styles.issueBtn} type="button" onClick={() => setReloadToken((value) => value + 1)}>
              重新加载
            </button>
          </div>
        </main>
      ) : (
        <>
          <section className={styles.hero}>
            <div className={styles.heroTitle}>
              <i className="fa-solid fa-chart-pie" />
              我的竞猜数据
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statVal}>{loading ? 0 : animatedTotal}</div>
                <div className={styles.statLabel}>总竞猜</div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statVal} ${styles.accentGreen}`}>{loading ? 0 : animatedWon}</div>
                <div className={styles.statLabel}>猜中</div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statVal} ${styles.accentGold}`}>{loading ? '0%' : `${animatedRate}%`}</div>
                <div className={styles.statLabel}>胜率</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statVal}>Lv.{stats.level}</div>
                <div className={styles.statLabel}>等级</div>
              </div>
            </div>

            <div className={styles.ringCard}>
              <svg className={styles.ringSvg} viewBox="0 0 56 56">
                <defs>
                  <linearGradient id="ghRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a8ff78" />
                    <stop offset="100%" stopColor="#78ffd6" />
                  </linearGradient>
                </defs>
                <circle className={styles.ringBg} cx="28" cy="28" r="22" />
                <circle
                  className={styles.ringFill}
                  cx="28"
                  cy="28"
                  r="22"
                  strokeDasharray={RING_CIRCUMFERENCE.toFixed(2)}
                  strokeDashoffset={ringOffset.toFixed(2)}
                />
              </svg>
              <div className={styles.ringInfo}>
                <div className={styles.ringPct}>{stats.winRate}%</div>
                <div className={styles.ringDetail}>
                  猜中 {stats.won} 次 / 共 {stats.won + stats.lost} 次
                </div>
                <div className={styles.ringBar}>
                  <div className={styles.ringBarWin} style={{ width: `${stats.winRate}%` }} />
                  <div className={styles.ringBarLoss} />
                </div>
              </div>
            </div>
          </section>

          <nav className={styles.tabs}>
            {(
              [
                ['all', '📋 全部', stats.total],
                ['active', '🔴 正在进行', stats.active],
                ['won', '🎉 猜中', stats.won],
                ['lost', '🎫 未中', stats.lost],
                ['pk', '⚡ PK记录', stats.pk],
              ] as Array<[TabKey, string, number]>
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
                onClick={() => handleSwitchTab(key)}
              >
                {label}
                <span className={styles.count}>{count}</span>
                {key === 'active' && stats.active > 0 ? <span className={styles.tabDot} /> : null}
              </button>
            ))}
          </nav>

          <main className={styles.records}>
            {/* 全部 tab：先显示进行中分区 + 历史记录分区头 */}
            {tab === 'all' && activeItems.length > 0 ? (
              <>
                <div className={styles.sectionHead}>
                  <span className={styles.sectionDot} />
                  正在进行 ({stats.active})
                </div>
                {activeItems.slice(0, 2).map((item, index) => (
                  <ActiveCard key={item.betId} item={item} index={index} now={now} compact onOpen={openGuess} />
                ))}
                {stats.active > 2 ? (
                  <button type="button" className={styles.seeAll} onClick={() => handleSwitchTab('active')}>
                    查看全部 {stats.active} 个进行中 →
                  </button>
                ) : null}
                <div className={styles.sectionHead}>📋 历史记录</div>
              </>
            ) : null}

            {/* 进行中 tab */}
            {tab === 'active' &&
              activeItems.map((item, index) => (
                <ActiveCard key={item.betId} item={item} index={index} now={now} onOpen={openGuess} />
              ))}

            {/* 猜中/未中/全部 历史记录 */}
            {tab === 'all' &&
              historyItems.map((item, index) => (
                <HistoryCard key={item.betId} item={item} index={index} streak={streaks[index]} onOpen={openGuess} />
              ))}
            {tab === 'won' &&
              wonItems.map((item, index) => (
                <HistoryCard key={item.betId} item={item} index={index} streak={streaks[index]} onOpen={openGuess} />
              ))}
            {tab === 'lost' &&
              lostItems.map((item, index) => (
                <HistoryCard key={item.betId} item={item} index={index} streak={streaks[index]} onOpen={openGuess} />
              ))}

            {/* PK 记录 */}
            {tab === 'pk' &&
              pkItems.map((item, index) => (
                <PkCard key={item.betId} item={item} index={index} onOpen={openGuess} />
              ))}

            {/* sentinel 用于触底加载更多 */}
            {cursors[TAB_TO_LIST[tab]] ? (
              <div ref={sentinelRef} className={styles.loadMoreSentinel}>
                {loadingMore ? '加载中…' : ''}
              </div>
            ) : null}

            {/* Empty */}
            {!loading && tab === 'active' && activeItems.length === 0 ? (
              <EmptyBlock icon="🔴" title="暂无进行中的竞猜" tip="去大厅参与精彩竞猜吧！" ctaLabel="去参与竞猜" onCta={goHome} />
            ) : null}
            {!loading && tab === 'all' && historyItems.length === 0 && activeItems.length === 0 ? (
              <EmptyBlock icon="📋" title="暂无竞猜记录" tip="快去参与竞猜吧！" ctaLabel="去参与竞猜" onCta={goHome} />
            ) : null}
            {!loading && tab === 'won' && loadedTabs.won && wonItems.length === 0 ? (
              <EmptyBlock icon="🎉" title="暂无猜中记录" tip="继续加油，好运即将到来！" ctaLabel="去参与竞猜" onCta={goHome} />
            ) : null}
            {!loading && tab === 'lost' && loadedTabs.lost && lostItems.length === 0 ? (
              <EmptyBlock icon="🎫" title="暂无未中记录" tip="你太厉害了，全部猜中！" ctaLabel="去参与竞猜" onCta={goHome} />
            ) : null}
            {!loading && tab === 'pk' && pkItems.length === 0 ? (
              <EmptyBlock icon="⚡" title="暂无 PK 记录" tip="邀请好友开始 PK 对决吧！" ctaLabel="邀请好友" onCta={goFriends} />
            ) : null}
          </main>
        </>
      )}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}
