'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BannerItem, GuessHistoryRecordItem, GuessSummary, LiveListItem, RankingItem } from '@umi/shared';

import { MobileShell } from '../components/mobile-shell';
import { fetchBanners } from '../lib/api/banners';
import { fetchCommunityDiscovery } from '../lib/api/community';
import { fetchGuessHistory, fetchGuessList } from '../lib/api/guesses';
import { fetchLiveList } from '../lib/api/lives';
import { fetchRankings } from '../lib/api/rankings';
import styles from './page.module.css';

type HomeMode = 'guess' | 'live';
type HomeCategory = 'hot' | 'entertainment' | 'media' | 'sports';
type HomeLiveFilter = 'all' | 'live' | 'upcoming' | 'replay' | 'snack' | 'pk';
type TrendType = 'up' | 'down';
type HomeStatusClass = 'hot' | 'ending' | 'new';
type BreakingTagClass = 'breaking' | 'bet' | 'result' | 'hot';

type BreakingEvent = {
  tag: string;
  tagClass: BreakingTagClass;
  text: string;
  highlight: string;
};

type HomeHeroCard = {
  key: string;
  image: string;
  badge: string;
  title: string;
  meta: [string, string];
  left: string;
  right: string;
  leftPct: string;
  rightPct: string;
  href: string;
  targetPath?: string | null;
  showPk: boolean;
};

type HomeListCard = {
  id: string;
  title: string;
  image: string;
  status: string;
  statusClass: HomeStatusClass;
  countdown: [string, string, string, string];
  odds: Array<{ label: string; trend: TrendType }>;
  leftLabel: string;
  rightLabel: string;
  leftWidth: string;
  rightWidth: string;
  meta: string;
  href: string;
  showPk: boolean;
};

type HomeResultCard = {
  title: string;
  detail: string;
  amount: string;
  type: 'won' | 'lost';
};

const categoryTabs: Array<{
  key: HomeCategory;
  label: string;
  icon: string;
  cls: string;
}> = [
  { key: 'hot', label: '今日热点', icon: 'fa-solid fa-fire', cls: 'hot' },
  { key: 'entertainment', label: '娱乐明星', icon: 'fa-solid fa-star', cls: 'star' },
  { key: 'media', label: '影视综艺', icon: 'fa-solid fa-clapperboard', cls: 'movie' },
  { key: 'sports', label: '体育赛事', icon: 'fa-solid fa-futbol', cls: 'sport' },
];

const liveFilters: Array<{ key: HomeLiveFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'live', label: '🔴 正在直播' },
  { key: 'upcoming', label: '⏰ 即将开始' },
  { key: 'replay', label: '🎬 精彩回放' },
  { key: 'snack', label: '零食开箱' },
  { key: 'pk', label: '品牌PK' },
];

const fallbackGuessImage = '/legacy/images/guess/g001.jpg';
const fallbackLiveImage = '/legacy/images/products/p001-lays.jpg';
const fallbackAvatar = '/legacy/images/mascot/mouse-main.png';

type HomePageInitialData = {
  guessBanners: BannerItem[];
  guessItems: GuessSummary[];
  liveItems: LiveListItem[];
  rankingItems: RankingItem[];
  historyItems: GuessHistoryRecordItem[];
  hotTopics: Array<{ text: string; desc: string }>;
  sectionErrors: {
    banners: string | null;
    guesses: string | null;
    lives: string | null;
    rankings: string | null;
  };
};

type HomePageClientProps = {
  initialData: HomePageInitialData;
};

function formatCompactNumber(value: number) {
  if (value >= 10000) {
    const amount = value / 10000;
    return `${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1)}万`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatCountdown(endTime?: string | null): [string, string, string, string] {
  if (!endTime) {
    return ['--', '时', '--', '分'];
  }

  const diff = new Date(endTime).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) {
    return ['00', '时', '00', '分'];
  }

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [String(hours).padStart(2, '0'), '时', String(minutes).padStart(2, '0'), '分'];
}

function getStatusClass(endTime?: string | null, heat = 0): HomeStatusClass {
  if (!endTime) {
    return heat > 2000 ? 'hot' : 'new';
  }

  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 6 * 60 * 60 * 1000) {
    return 'ending';
  }
  if (heat > 2000) {
    return 'hot';
  }
  return 'new';
}

function getGuessStatusText(statusClass: HomeStatusClass) {
  if (statusClass === 'ending') {
    return '即将开奖';
  }
  if (statusClass === 'hot') {
    return '火热';
  }
  return '上新';
}

function getLiveStatusText(item: LiveListItem) {
  const raw = String(item.status || '').toLowerCase();
  if (raw.includes('replay') || raw.includes('completed') || raw.includes('done')) {
    return '精彩回放';
  }
  if (item.startTime && new Date(item.startTime).getTime() > Date.now()) {
    return '即将开始';
  }
  return '直播中';
}

function getGuessParticipants(item: GuessSummary) {
  return item.options.reduce((sum, option) => sum + Number(option.voteCount ?? 0), 0);
}

function getGuessPercents(item: GuessSummary) {
  const participants = getGuessParticipants(item);
  return item.options.map((option) =>
    participants > 0 ? Math.round((Number(option.voteCount ?? 0) / participants) * 100) : 0,
  );
}

function matchesGuessCategory(category: HomeCategory, label: string) {
  if (category === 'hot') {
    return true;
  }
  if (category === 'entertainment') {
    return label.includes('娱乐') || label.includes('明星') || label.includes('生活');
  }
  if (category === 'media') {
    return label.includes('影视') || label.includes('综艺') || label.includes('生活');
  }
  return label.includes('体育') || label.includes('足球') || label.includes('篮球');
}

function matchesLiveCategory(category: HomeCategory, item: LiveListItem) {
  const source = `${item.currentGuess?.category || ''} ${item.title}`.trim();
  return matchesGuessCategory(category, source);
}

function filterGuessList(items: GuessSummary[], category: HomeCategory) {
  const filtered = items.filter((item) => matchesGuessCategory(category, item.category || ''));
  return filtered.length > 0 || category === 'hot' ? filtered : items;
}

function filterLiveList(items: LiveListItem[], category: HomeCategory) {
  const filtered = items.filter((item) => matchesLiveCategory(category, item));
  return filtered.length > 0 || category === 'hot' ? filtered : items;
}

function matchesHomeLiveFilter(item: LiveListItem, filter: HomeLiveFilter) {
  const title = `${item.title} ${item.currentGuess?.title || ''}`.toLowerCase();
  const status = getLiveStatusText(item);

  if (filter === 'all') {
    return true;
  }
  if (filter === 'live') {
    return status === '直播中';
  }
  if (filter === 'upcoming') {
    return status === '即将开始';
  }
  if (filter === 'replay') {
    return status === '精彩回放';
  }
  if (filter === 'snack') {
    return title.includes('零食') || title.includes('开箱') || title.includes('试吃');
  }
  return title.includes('pk') || title.includes('品牌') || title.includes('对决');
}

function buildTargetPath(path: string | null | undefined, fallback: string) {
  return path?.trim() ? path : fallback;
}

function createGuessHeroCard(item: GuessSummary): HomeHeroCard {
  const percents = getGuessPercents(item);
  return {
    key: `guess-${item.id}`,
    image: item.product.img || fallbackGuessImage,
    badge: `👑 ${item.product.brand || item.category || '平台推荐'}`,
    title: item.title,
    meta: [`👥 ${formatCompactNumber(getGuessParticipants(item))}人`, item.endTime ? '进行中' : '最新竞猜'],
    left: item.options[0]?.optionText || '选项 A',
    right: item.options[1]?.optionText || '选项 B',
    leftPct: formatPercent(percents[0] ?? 50),
    rightPct: formatPercent(percents[1] ?? Math.max(0, 100 - (percents[0] ?? 50))),
    href: `/guess/${item.id}`,
    showPk: item.options.length >= 2,
  };
}

function createBannerHeroCard(item: BannerItem): HomeHeroCard {
  if (item.guess) {
    const guessCard = createGuessHeroCard(item.guess);
    return {
      ...guessCard,
      key: `banner-${item.id}`,
      image: item.imageUrl || guessCard.image,
      badge: item.title ? `👑 ${item.title}` : guessCard.badge,
      meta: guessCard.meta,
      href: buildTargetPath(item.targetPath, guessCard.href),
      targetPath: item.targetPath,
    };
  }

  return {
    key: `banner-${item.id}`,
    image: item.imageUrl || fallbackGuessImage,
    badge: item.subtitle ? `📣 ${item.subtitle}` : '📣 运营推荐',
    title: item.title,
    meta: ['平台运营位', item.position],
    left: '',
    right: '',
    leftPct: '0%',
    rightPct: '0%',
    href: buildTargetPath(item.targetPath, '/'),
    targetPath: item.targetPath,
    showPk: false,
  };
}

function createGuessListCard(item: GuessSummary): HomeListCard {
  const percents = getGuessPercents(item);
  const statusClass = getStatusClass(item.endTime, getGuessParticipants(item));
  const leftPct = percents[0] ?? 50;
  const rightPct = percents[1] ?? Math.max(0, 100 - leftPct);
  return {
    id: item.id,
    title: item.title,
    image: item.product.img || fallbackGuessImage,
    status: getGuessStatusText(statusClass),
    statusClass,
    countdown: formatCountdown(item.endTime),
    odds: item.options.slice(0, 2).map((option, index, array) => ({
      label: `${option.optionText.slice(0, 8)} ×${option.odds.toFixed(1)}`,
      trend:
        Number(option.voteCount ?? 0) >= Number(array[index === 0 ? 1 : 0]?.voteCount ?? 0)
          ? 'up'
          : 'down',
    })),
    leftLabel: `${item.options[0]?.optionText || '选项A'} ${formatPercent(leftPct)}`,
    rightLabel: `${formatPercent(rightPct)} ${item.options[1]?.optionText || '选项B'}`,
    leftWidth: formatPercent(leftPct),
    rightWidth: formatPercent(rightPct),
    meta: `👥 ${formatCompactNumber(getGuessParticipants(item))} · ${item.category || '热门竞猜'}`,
    href: `/guess/${item.id}`,
    showPk: item.options.length >= 2,
  };
}

function createLiveHeroCard(item: LiveListItem): HomeHeroCard {
  const currentGuess = item.currentGuess;
  const leftPct = currentGuess?.pcts[0] ?? 50;
  const rightPct = currentGuess?.pcts[1] ?? Math.max(0, 100 - leftPct);
  return {
    key: `live-${item.id}`,
    image: item.imageUrl || fallbackLiveImage,
    badge: `📺 ${item.hostName}`,
    title: currentGuess?.title || item.title,
    meta: [`👁 ${formatCompactNumber(item.viewers)}`, `${item.guessCount}场竞猜`],
    left: currentGuess?.options[0] || '直播进行中',
    right: currentGuess?.options[1] || '进入直播间',
    leftPct: formatPercent(leftPct),
    rightPct: formatPercent(rightPct),
    href: `/live/${item.id}`,
    showPk: Boolean(currentGuess && currentGuess.options.length >= 2),
  };
}

function createLiveListCard(item: LiveListItem): HomeListCard {
  const currentGuess = item.currentGuess;
  const statusClass = getStatusClass(currentGuess?.endTime, item.viewers);
  const leftPct = currentGuess?.pcts[0] ?? 50;
  const rightPct = currentGuess?.pcts[1] ?? Math.max(0, 100 - leftPct);
  return {
    id: item.id,
    title: currentGuess?.title || item.title,
    image: item.imageUrl || fallbackLiveImage,
    status: item.status === 'live' ? '直播中' : getGuessStatusText(statusClass),
    statusClass: item.status === 'live' ? 'hot' : statusClass,
    countdown: formatCountdown(currentGuess?.endTime),
    odds: currentGuess
      ? currentGuess.options.slice(0, 2).map((option, index) => ({
          label: `${option.slice(0, 8)} ×${Number(currentGuess.odds[index] ?? 1).toFixed(1)}`,
          trend:
            Number(currentGuess.pcts[index] ?? 0) >= Number(currentGuess.pcts[index === 0 ? 1 : 0] ?? 0)
              ? 'up'
              : 'down',
        }))
      : [],
    leftLabel: currentGuess
      ? `${currentGuess.options[0] || '选项A'} ${formatPercent(leftPct)}`
      : `${item.hostName} 开播中`,
    rightLabel: currentGuess
      ? `${formatPercent(rightPct)} ${currentGuess.options[1] || '选项B'}`
      : `${item.guessCount}场竞猜`,
    leftWidth: formatPercent(leftPct),
    rightWidth: formatPercent(rightPct),
    meta: `${item.hostName} · ${formatCompactNumber(item.viewers)}人围观`,
    href: `/live/${item.id}`,
    showPk: Boolean(currentGuess && currentGuess.options.length >= 2),
  };
}

function createResultCard(item: GuessHistoryRecordItem): HomeResultCard {
  const won = item.outcome === 'won';
  return {
    title: item.title,
    detail: `预测: ${item.choiceText} · ${item.resultText}`,
    amount: item.rewardText || (won ? '🎉 猜中' : '未中'),
    type: won ? 'won' : 'lost',
  };
}

function buildBreakingEvents(
  guesses: GuessSummary[],
  rankings: RankingItem[],
  hotTopics: Array<{ text: string; desc: string }>,
  history: GuessHistoryRecordItem[],
): BreakingEvent[] {
  const events: BreakingEvent[] = [];
  const topGuess = guesses
    .slice()
    .sort((left, right) => getGuessParticipants(right) - getGuessParticipants(left))[0];
  const topRank = rankings[0];
  const topTopic = hotTopics[0];
  const recentRecord = history[0];

  if (topGuess) {
    events.push({
      tag: '热门',
      tagClass: 'hot',
      text: topGuess.title,
      highlight: `${formatCompactNumber(getGuessParticipants(topGuess))}人参与`,
    });
  }

  if (recentRecord) {
    events.push({
      tag: '开奖',
      tagClass: 'result',
      text: recentRecord.title,
      highlight: recentRecord.rewardText || recentRecord.resultText,
    });
  }

  if (topRank) {
    events.push({
      tag: '榜单',
      tagClass: 'hot',
      text: `${topRank.nickname} 冲上胜率榜首`,
      highlight: topRank.value,
    });
  }

  if (topTopic) {
    events.push({
      tag: '热议',
      tagClass: 'breaking',
      text: `#${topTopic.text}`,
      highlight: topTopic.desc,
    });
  }

  return events.length > 0
    ? events
    : [
        {
          tag: '热门',
          tagClass: 'hot',
          text: '正在刷新首页内容',
          highlight: '请稍候',
        },
      ];
}

function openTargetPath(router: ReturnType<typeof useRouter>, targetPath?: string | null) {
  if (!targetPath) {
    return;
  }

  if (/^https?:\/\//.test(targetPath)) {
    window.location.href = targetPath;
    return;
  }

  router.push(targetPath);
}

export default function HomePageClient({ initialData }: HomePageClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>('guess');
  const [category, setCategory] = useState<HomeCategory>('hot');
  const [liveFilter, setLiveFilter] = useState<HomeLiveFilter>('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [breakingIndex, setBreakingIndex] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);
  const [guessBanners, setGuessBanners] = useState<BannerItem[]>(initialData.guessBanners);
  const [guessItems, setGuessItems] = useState<GuessSummary[]>(initialData.guessItems);
  const [liveItems, setLiveItems] = useState<LiveListItem[]>(initialData.liveItems);
  const [rankingItems, setRankingItems] = useState<RankingItem[]>(initialData.rankingItems);
  const [historyItems, setHistoryItems] = useState<GuessHistoryRecordItem[]>(initialData.historyItems);
  const [hotTopics, setHotTopics] = useState<Array<{ text: string; desc: string }>>(initialData.hotTopics);
  const [sectionErrors, setSectionErrors] = useState(initialData.sectionErrors);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const [
        bannersResult,
        guessResult,
        liveResult,
        rankingResult,
        historyResult,
        discoveryResult,
      ] = await Promise.allSettled([
        fetchBanners('home_hero', 5),
        fetchGuessList(),
        fetchLiveList(12),
        fetchRankings({ type: 'winRate', periodType: 'allTime', limit: 10 }),
        fetchGuessHistory(),
        fetchCommunityDiscovery(),
      ]);

      if (ignore) {
        return;
      }

      setSectionErrors({
        banners:
          bannersResult.status === 'rejected'
            ? bannersResult.reason instanceof Error
              ? bannersResult.reason.message
              : '首页头图加载失败'
            : null,
        guesses:
          guessResult.status === 'rejected'
            ? guessResult.reason instanceof Error
              ? guessResult.reason.message
              : '竞猜列表加载失败'
            : null,
        lives:
          liveResult.status === 'rejected'
            ? liveResult.reason instanceof Error
              ? liveResult.reason.message
              : '直播列表加载失败'
            : null,
        rankings:
          rankingResult.status === 'rejected'
            ? rankingResult.reason instanceof Error
              ? rankingResult.reason.message
              : '榜单加载失败'
            : null,
      });

      setGuessBanners(
        bannersResult.status === 'fulfilled' ? bannersResult.value.items : [],
      );
      setGuessItems(
        guessResult.status === 'fulfilled'
          ? guessResult.value.items.filter((item) => item.status === 'active')
          : [],
      );
      setLiveItems(liveResult.status === 'fulfilled' ? liveResult.value.items : []);
      setRankingItems(rankingResult.status === 'fulfilled' ? rankingResult.value.items : []);
      setHistoryItems(
        historyResult.status === 'fulfilled' ? historyResult.value.history.slice(0, 5) : [],
      );
      setHotTopics(
        discoveryResult.status === 'fulfilled' ? discoveryResult.value.hotTopics : [],
      );
    }

    void loadHomeData();
    return () => {
      ignore = true;
    };
  }, []);

  const visibleGuesses = useMemo(
    () => filterGuessList(guessItems, category),
    [category, guessItems],
  );
  const visibleLives = useMemo(
    () => filterLiveList(liveItems, category),
    [category, liveItems],
  );
  const filteredLiveFeedItems = useMemo(
    () => visibleLives.filter((item) => matchesHomeLiveFilter(item, liveFilter)),
    [liveFilter, visibleLives],
  );
  const guessHeroCards = useMemo(() => {
    const bannerCards = guessBanners.map(createBannerHeroCard);
    if (bannerCards.length > 0) {
      return bannerCards;
    }
    return guessItems
      .slice()
      .sort((left, right) => getGuessParticipants(right) - getGuessParticipants(left))
      .slice(0, 5)
      .map(createGuessHeroCard);
  }, [guessBanners, guessItems]);
  const liveHeroCards = useMemo(
    () =>
      liveItems
        .slice()
        .sort((left, right) => right.viewers - left.viewers)
        .slice(0, 5)
        .map(createLiveHeroCard),
    [liveItems],
  );
  const visibleCards = useMemo(
    () =>
      (mode === 'guess' ? visibleGuesses.map(createGuessListCard) : visibleLives.map(createLiveListCard)).slice(0, 12),
    [mode, visibleGuesses, visibleLives],
  );
  const heroCards = mode === 'guess' ? guessHeroCards : liveHeroCards;
  const heroCard = heroCards[heroIndex] ?? null;
  const breakingEvents = useMemo(
    () => buildBreakingEvents(guessItems, rankingItems, hotTopics, historyItems),
    [guessItems, rankingItems, hotTopics, historyItems],
  );
  const breakingEvent = breakingEvents[breakingIndex] ?? breakingEvents[0];
  const recentResults = historyItems.slice(0, 3).map(createResultCard);
  const rankings = rankingItems.slice(0, 3);
  const sectionSubtitle =
    mode === 'guess'
      ? `${visibleCards.length}场竞猜进行中`
      : `${visibleCards.length}场直播进行中`;
  const focusGuess = visibleGuesses[0] ?? null;
  const focusLive = visibleLives[0] ?? null;

  useEffect(() => {
    setHeroIndex(0);
  }, [mode]);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroCards.length]);

  useEffect(() => {
    if (heroCards.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroCards.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [heroCards.length]);

  useEffect(() => {
    if (breakingEvents.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setBreakingIndex((current) => (current + 1) % breakingEvents.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [breakingEvents.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPosterIndex((current) => (current + 1) % 3);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (heroIndex >= heroCards.length) {
      setHeroIndex(0);
    }
  }, [heroCards.length, heroIndex]);

  useEffect(() => {
    if (breakingIndex >= breakingEvents.length) {
      setBreakingIndex(0);
    }
  }, [breakingEvents.length, breakingIndex]);

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

        {mode === 'guess' ? (
          <>
            <div className={styles.breakingBar}>
              <span
                className={`${styles.breakingTag} ${styles[`breakingTag${breakingEvent.tagClass[0].toUpperCase()}${breakingEvent.tagClass.slice(1)}`]}`}
              >
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

            {sectionErrors.banners ? (
              <div className={styles.sectionNotice}>首页头图加载失败，当前已降级展示其他真实内容。</div>
            ) : null}

            {heroCard ? (
              <section className={styles.heroSwiper}>
                <div className={styles.heroTrack}>
                  <article
                    className={styles.heroSlide}
                    onClick={() => openTargetPath(router, heroCard.targetPath || heroCard.href)}
                  >
                    <img alt={heroCard.title} src={heroCard.image || fallbackGuessImage} />
                    <div className={styles.heroRank}>🏆 TOP 1</div>
                    <div className={styles.heroOverlay}>
                      <div className={styles.heroBadge}>{heroCard.badge}</div>
                      <div className={styles.heroTitle}>{heroCard.title}</div>
                      <div className={styles.heroMeta}>
                        <span>{heroCard.meta[0]}</span>
                        <span>{heroCard.meta[1]}</span>
                      </div>
                      {heroCard.showPk ? (
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
                      ) : null}
                    </div>
                  </article>
                </div>
                <div className={styles.heroDots}>
                  {heroCards.map((item, index) => (
                    <button
                      className={`${styles.heroDot} ${item.key === heroCard.key ? styles.heroDotActive : ''}`}
                      key={item.key}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <div className={styles.pkBanner}>
              <div className={styles.pkLive}>LIVE</div>
              <div className={styles.pkPlayers}>
                <img alt="focus-left" src={rankings[0]?.avatar || fallbackAvatar} />
                <div className={styles.pkVs}>VS</div>
                <img alt="focus-right" src={rankings[1]?.avatar || fallbackAvatar} />
              </div>
              <div className={styles.pkInfo}>
                <div className={styles.pkTitle}>{focusGuess ? focusGuess.title : '好友PK对战中'}</div>
                <div className={styles.pkSub}>
                  {focusGuess
                    ? `${focusGuess.options[0]?.optionText || '选项A'} vs ${focusGuess.options[1]?.optionText || '选项B'} · 👥${formatCompactNumber(getGuessParticipants(focusGuess))}`
                    : '暂无进行中的热门竞猜'}
                </div>
              </div>
              <button
                className={styles.pkBtn}
                type="button"
                onClick={() => {
                  if (focusGuess) {
                    router.push(`/guess/${focusGuess.id}`);
                  }
                }}
              >
                加入PK
              </button>
            </div>

            <div className={styles.catBar}>
              <div className={styles.catScroll}>
                {categoryTabs.map((item) => (
                  <button
                    className={`${styles.catChip} ${styles[`cat${item.cls[0].toUpperCase()}${item.cls.slice(1)}`]} ${category === item.key ? styles.catActive : ''}`}
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                  >
                    <span className={styles.catIcon}>
                      <i className={item.icon} />
                    </span>
                    <span className={styles.catText}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>正在进行</div>
                <div className={styles.sectionSubtitle}>{sectionSubtitle}</div>
              </div>
              <div className={styles.modeRoller}>
                <div className={styles.modeViewport}>
                  <div className={styles.modeTrack} style={{ transform: `translateY(-${posterIndex * 42}px)` }}>
                    <div className={`${styles.modeItem} ${styles.modeChampion}`}>
                      <span className={styles.modeEmoji}>🏆</span>
                      <span className={styles.modeName}>冠军之路</span>
                      <span className={styles.modeSub}>连胜封神</span>
                      <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
                    </div>
                    <div className={`${styles.modeItem} ${styles.modeTriple}`}>
                      <span className={styles.modeEmoji}>⛩️</span>
                      <span className={styles.modeName}>闯三关</span>
                      <span className={styles.modeSub}>奖金翻倍</span>
                      <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
                    </div>
                    <div className={`${styles.modeItem} ${styles.modeBlind}`}>
                      <span className={styles.modeEmoji}>🎁</span>
                      <span className={styles.modeName}>盲盒竞猜</span>
                      <span className={styles.modeSub}>惊喜开箱</span>
                      <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className={styles.listArea}>
              {visibleCards.length ? (
                visibleCards.map((card) => (
                  <article className={styles.guessCard} key={`${mode}-${card.id}`} onClick={() => router.push(card.href)}>
                    <div className={styles.cardImageWrap}>
                      <img alt={card.title} src={card.image || fallbackGuessImage} />
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
                      {card.odds.length ? (
                        <div className={styles.oddsRow}>
                          {card.odds.map((odd) => (
                            <span className={`${styles.oddChip} ${styles[odd.trend]}`} key={`${card.id}-${odd.label}`}>
                              {odd.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className={styles.pkRow}>
                        {card.showPk ? (
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
                        ) : (
                          <div className={styles.duel}>
                            <div className={styles.duelLabels}>
                              <span>{card.leftLabel}</span>
                              <span>{card.rightLabel}</span>
                            </div>
                          </div>
                        )}
                        {card.showPk ? (
                          <button
                            className={styles.pkMiniBtn}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(card.href);
                            }}
                          >
                            ⚡
                          </button>
                        ) : null}
                        <button
                          className={styles.joinBtn}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(card.href);
                          }}
                        >
                          参与
                        </button>
                      </div>
                      <div className={styles.cardMeta}>{card.meta}</div>
                    </div>
                  </article>
                ))
              ) : sectionErrors.guesses ? (
                <div className={styles.sectionNotice}>竞猜列表加载失败，请稍后刷新重试。</div>
              ) : (
                <div className={styles.emptyState}>暂无可展示的竞猜内容</div>
              )}
            </section>

            <div className={styles.divider} />

            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>🎉 最近开奖</div>
              <button className={styles.sectionMore} type="button" onClick={() => router.push('/guess-history')}>
                全部记录 <i className="fa-solid fa-chevron-right" />
              </button>
            </div>

            <section className={styles.resultArea}>
              {recentResults.length ? (
                recentResults.map((item) => (
                  <div className={styles.resultItem} key={`${item.title}-${item.amount}`}>
                    <div className={`${styles.resultIcon} ${styles[item.type]}`}>{item.type === 'won' ? '🎉' : '🎫'}</div>
                    <div className={styles.resultInfo}>
                      <div className={styles.resultTitle}>{item.title}</div>
                      <div className={styles.resultDetail}>{item.detail}</div>
                    </div>
                    <div className={`${styles.resultAmount} ${styles[item.type]}`}>{item.amount}</div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>登录后可查看你的开奖记录</div>
              )}
            </section>

            <div className={styles.divider} />

            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>🏆 竞猜达人榜</div>
              <button className={styles.sectionMore} type="button" onClick={() => router.push('/ranking')}>
                完整榜单 <i className="fa-solid fa-chevron-right" />
              </button>
            </div>

            <section className={styles.rankArea}>
              {rankings.length ? (
                rankings.map((item, index) => (
                  <div className={styles.rankRow} key={`${item.userId}-${item.rank}`}>
                    <div className={styles.rankNo}>{['🥇', '🥈', '🥉'][index] || `#${item.rank}`}</div>
                    <img alt={item.nickname} className={styles.rankAvatar} src={item.avatar || fallbackAvatar} />
                    <div className={styles.rankName}>{item.nickname}</div>
                    <div className={styles.rankRate}>{item.value}</div>
                  </div>
                ))
              ) : sectionErrors.rankings ? (
                <div className={styles.sectionNotice}>榜单加载失败，请稍后刷新重试。</div>
              ) : (
                <div className={styles.emptyState}>暂无排行榜结果</div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className={styles.liveCatBar}>
              {liveFilters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.liveCatChip} ${liveFilter === item.key ? styles.liveCatActive : ''}`}
                  onClick={() => setLiveFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.liveFeed}>
              {filteredLiveFeedItems.length ? (
                filteredLiveFeedItems.map((item) => {
                  const currentGuess = item.currentGuess;
                  const leftPct = currentGuess?.pcts[0] ?? 50;
                  const rightPct = currentGuess?.pcts[1] ?? Math.max(0, 100 - leftPct);
                  const statusText = getLiveStatusText(item);
                  return (
                    <article className={styles.liveFeedCard} key={item.id}>
                      <div className={styles.liveFeedHost}>
                        <img className={styles.liveFeedAvatar} src={item.hostAvatar || fallbackAvatar} alt={item.hostName} />
                        <div>
                          <div className={styles.liveFeedHostName}>{item.hostName}</div>
                          <div className={styles.liveFeedHostStat}>{item.guessCount}场竞猜 · {formatCompactNumber(item.viewers)}观看</div>
                        </div>
                        <span className={`${styles.liveFeedStatus} ${statusText === '直播中' ? styles.liveFeedStatusLive : statusText === '即将开始' ? styles.liveFeedStatusUpcoming : styles.liveFeedStatusReplay}`}>
                          {statusText === '直播中' ? '🔴 直播中' : statusText === '即将开始' ? '⏰ 即将开始' : '🎬 回放'}
                        </span>
                      </div>
                      <button className={styles.liveFeedCover} type="button" onClick={() => router.push(`/live/${item.id}`)}>
                        <img src={item.imageUrl || fallbackLiveImage} alt={item.title} />
                        <div className={styles.liveFeedViewers}>👁 {formatCompactNumber(item.viewers)}</div>
                        <div className={styles.liveFeedTitleBar}>
                          <div className={styles.liveFeedTitle}>{currentGuess?.title || item.title}</div>
                        </div>
                      </button>
                      <div className={styles.livePk}>
                        <div className={styles.livePkHead}>
                          <span className={styles.livePkIcon}>⚡</span>
                          <span className={styles.livePkLabel}>直播竞猜</span>
                          <span className={styles.livePkHot}><i className="fa-solid fa-fire" /> {item.participants}人参与</span>
                        </div>
                        <div className={styles.livePkBar}>
                          <div className={`${styles.livePkOpt} ${styles.livePkOptA}`}>{currentGuess?.options[0] || '直播中'}</div>
                          <div className={styles.livePkVs}>VS</div>
                          <div className={`${styles.livePkOpt} ${styles.livePkOptB}`}>{currentGuess?.options[1] || '围观中'}</div>
                        </div>
                        <div className={styles.livePkProgress}>
                          <div className={styles.livePkFillA} style={{ width: `${leftPct}%` }} />
                          <div className={styles.livePkFillB} style={{ width: `${rightPct}%` }} />
                        </div>
                        <div className={styles.livePkPct}>
                          <span className={styles.livePctA}>{leftPct}%</span>
                          <span className={styles.livePkQuestion}>{currentGuess?.title || item.title}</span>
                          <span className={styles.livePctB}>{rightPct}%</span>
                        </div>
                        <div className={styles.livePkCta}>
                          <button className={styles.livePkBtn} type="button" onClick={() => router.push(`/live/${item.id}`)}>
                            参与竞猜
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : sectionErrors.lives ? (
                <div className={styles.sectionNotice}>直播列表加载失败，请稍后刷新重试。</div>
              ) : (
                <div className={styles.emptyState}>暂无直播</div>
              )}
            </div>
          </>
        )}
      </main>
    </MobileShell>
  );
}
