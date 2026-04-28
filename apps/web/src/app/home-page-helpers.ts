import type {
  BannerItem,
  GuessHistoryRecordItem,
  GuessSummary,
  LiveListItem,
  RankingItem,
} from '@umi/shared';

import type {
  BreakingEvent,
  HomeCategory,
  HomeHeroCard,
  HomeListCard,
  HomeLiveFilter,
  HomeResultCard,
  HomeStatusClass,
} from './home-page-types';
import { fallbackGuessImage, fallbackLiveImage } from './home-page-types';

export function formatCompactNumber(value: number) {
  if (value >= 10000) {
    const amount = value / 10000;
    return `${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1)}万`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return `${value}`;
}

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function formatCountdown(endTime?: string | null): [string, string, string, string] {
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

export function isEnded(endTime?: string | null): boolean {
  if (!endTime) {
    return false;
  }
  const diff = new Date(endTime).getTime() - Date.now();
  return !Number.isNaN(diff) && diff <= 0;
}

export function formatInlineCountdown(endTime?: string | null) {
  const [hours, hourLabel, minutes, minuteLabel] = formatCountdown(endTime);
  return `${hours}${hourLabel}${minutes}${minuteLabel}`;
}

export function getStatusClass(endTime?: string | null, heat = 0): HomeStatusClass {
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

export function getGuessStatusText(statusClass: HomeStatusClass) {
  if (statusClass === 'ending') {
    return '即将开奖';
  }
  if (statusClass === 'hot') {
    return '火热';
  }
  return '新';
}

export function getLiveStatusText(item: LiveListItem) {
  return item.status === 'upcoming' ? '⏰ 即将开始' : '🔴 直播中';
}

export function getGuessParticipants(item: GuessSummary) {
  return item.options.reduce((sum, option) => sum + Number(option.voteCount ?? 0), 0);
}

export function getGuessPercents(item: GuessSummary) {
  const participants = getGuessParticipants(item);
  return item.options.map((option) =>
    participants > 0 ? Math.round((Number(option.voteCount ?? 0) / participants) * 100) : 0,
  );
}

export function matchesLiveCategory(category: HomeCategory, item: LiveListItem) {
  if (category === 'hot') {
    return true;
  }
  const cid = item.currentGuess?.categoryId;
  return cid != null && String(cid) === category;
}

export function filterLiveList(
  items: LiveListItem[],
  category: HomeCategory,
): { items: LiveListItem[]; matchedCount: number; fellBack: boolean } {
  const matched = items.filter((item) => matchesLiveCategory(category, item));
  if (matched.length > 0 || category === 'hot') {
    return { items: matched, matchedCount: matched.length, fellBack: false };
  }
  return { items, matchedCount: 0, fellBack: true };
}

export function matchesHomeLiveFilter(item: LiveListItem, filter: HomeLiveFilter) {
  const title = `${item.title} ${item.currentGuess?.title || ''}`.toLowerCase();
  const status = getLiveStatusText(item);

  if (filter === 'all') {
    return true;
  }
  if (filter === 'live') {
    return status === '🔴 直播中';
  }
  if (filter === 'upcoming') {
    return status === '⏰ 即将开始';
  }
  if (filter === 'snack') {
    return title.includes('零食') || title.includes('开箱') || title.includes('试吃');
  }
  return title.includes('pk') || title.includes('品牌') || title.includes('对决');
}

export function buildTargetPath(path: string | null | undefined, fallback: string) {
  return path?.trim() ? path : fallback;
}

export function createGuessHeroCard(item: GuessSummary): HomeHeroCard {
  const percents = getGuessPercents(item);
  return {
    key: `guess-${item.id}`,
    image: item.product.img || fallbackGuessImage,
    badge: `👑 ${item.product.brand || item.category || '平台推荐'}`,
    title: item.title,
    meta: [
      `👥 ${formatCompactNumber(getGuessParticipants(item))}人`,
      item.endTime ? formatInlineCountdown(item.endTime) : '最新竞猜',
    ],
    left: item.options[0]?.optionText || '选项 A',
    right: item.options[1]?.optionText || '选项 B',
    leftPct: formatPercent(percents[0] ?? 50),
    rightPct: formatPercent(percents[1] ?? Math.max(0, 100 - (percents[0] ?? 50))),
    href: `/guess/${item.id}`,
    showPk: item.options.length >= 2,
  };
}

export function createBannerHeroCard(item: BannerItem): HomeHeroCard {
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

export function createGuessListCard(item: GuessSummary): HomeListCard {
  const percents = getGuessPercents(item);
  const statusClass = getStatusClass(item.endTime, getGuessParticipants(item));
  const leftPct = percents[0] ?? 50;
  const rightPct = percents[1] ?? Math.max(0, 100 - leftPct);
  const ended = isEnded(item.endTime);
  return {
    id: item.id,
    title: item.title,
    image: item.product.img || fallbackGuessImage,
    status: ended ? '已开奖' : getGuessStatusText(statusClass),
    statusClass,
    countdown: formatCountdown(item.endTime),
    ended,
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
    meta: `👥 ${formatCompactNumber(getGuessParticipants(item))} · ${formatInlineCountdown(item.endTime)}`,
    href: `/guess/${item.id}`,
    showPk: item.options.length >= 2,
  };
}

export function createLiveHeroCard(item: LiveListItem): HomeHeroCard {
  const currentGuess = item.currentGuess;
  const leftPct = currentGuess?.pcts[0] ?? 50;
  const rightPct = currentGuess?.pcts[1] ?? Math.max(0, 100 - leftPct);
  return {
    key: `live-${item.id}`,
    image: item.imageUrl || fallbackLiveImage,
    badge: `📺 ${item.hostName}`,
    title: currentGuess?.title || item.title,
    meta: [`🔥 ${formatCompactNumber(item.participants)}`, `${item.guessCount}场竞猜`],
    left: currentGuess?.options[0] || '直播进行中',
    right: currentGuess?.options[1] || '进入直播间',
    leftPct: formatPercent(leftPct),
    rightPct: formatPercent(rightPct),
    href: `/live/${item.id}`,
    showPk: Boolean(currentGuess && currentGuess.options.length >= 2),
  };
}

export function createLiveListCard(item: LiveListItem): HomeListCard {
  const currentGuess = item.currentGuess;
  const statusClass = getStatusClass(currentGuess?.endTime, item.participants);
  const leftPct = currentGuess?.pcts[0] ?? 50;
  const rightPct = currentGuess?.pcts[1] ?? Math.max(0, 100 - leftPct);
  const ended = isEnded(currentGuess?.endTime);
  return {
    id: item.id,
    title: currentGuess?.title || item.title,
    image: item.imageUrl || fallbackLiveImage,
    status: item.status === 'live' ? '🔴 直播中' : ended ? '已结束' : getGuessStatusText(statusClass),
    statusClass: item.status === 'live' ? 'hot' : statusClass,
    countdown: formatCountdown(currentGuess?.endTime),
    ended,
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
    meta: `${item.hostName} · ${formatCompactNumber(item.participants)}人参与`,
    href: `/live/${item.id}`,
    showPk: Boolean(currentGuess && currentGuess.options.length >= 2),
  };
}

export function createResultCard(item: GuessHistoryRecordItem): HomeResultCard {
  const won = item.outcome === 'won';
  return {
    title: item.title,
    detail: `预测: ${item.choiceText} · ${item.resultText}`,
    amount: item.rewardText || (won ? '🎉 猜中' : '未中'),
    type: won ? 'won' : 'lost',
  };
}

export function buildBreakingEvents(
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
