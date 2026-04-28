import type {
  BannerItem,
  GuessHistoryRecordItem,
  GuessSummary,
  LiveListItem,
  RankingItem,
} from '@umi/shared';

export type HomeMode = 'guess' | 'live';
export type HomeCategory =
  | 'hot'
  | 'entertainment'
  | 'media'
  | 'sports'
  | 'finance'
  | 'tech'
  | 'game'
  | 'society'
  | 'weather';
export type HomeLiveFilter = 'all' | 'live' | 'upcoming' | 'replay' | 'snack' | 'pk';
export type TrendType = 'up' | 'down';
export type HomeStatusClass = 'hot' | 'ending' | 'new';
export type BreakingTagClass = 'breaking' | 'bet' | 'result' | 'hot';

export type BreakingEvent = {
  tag: string;
  tagClass: BreakingTagClass;
  text: string;
  highlight: string;
};

export type HomeHeroCard = {
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

export type HomeListCard = {
  id: string;
  title: string;
  image: string;
  status: string;
  statusClass: HomeStatusClass;
  countdown: [string, string, string, string];
  ended: boolean;
  odds: Array<{ label: string; trend: TrendType }>;
  leftLabel: string;
  rightLabel: string;
  leftWidth: string;
  rightWidth: string;
  meta: string;
  href: string;
  showPk: boolean;
};

export type HomeResultCard = {
  title: string;
  detail: string;
  amount: string;
  type: 'won' | 'lost';
};

export type HomeSectionErrors = {
  banners: string | null;
  guesses: string | null;
  lives: string | null;
  rankings: string | null;
};

export type HomePageInitialData = {
  guessBanners: BannerItem[];
  guessItems: GuessSummary[];
  liveItems: LiveListItem[];
  rankingItems: RankingItem[];
  historyItems: GuessHistoryRecordItem[];
  hotTopics: Array<{ text: string; desc: string }>;
  sectionErrors: HomeSectionErrors;
};

export type HomePageClientProps = {
  initialData: HomePageInitialData;
};

export const categoryTabs: Array<{
  key: HomeCategory;
  label: string;
  icon: string;
  cls: string;
}> = [
  { key: 'hot', label: '今日热点', icon: 'fa-solid fa-fire', cls: 'hot' },
  { key: 'entertainment', label: '娱乐明星', icon: 'fa-solid fa-star', cls: 'star' },
  { key: 'media', label: '影视综艺', icon: 'fa-solid fa-clapperboard', cls: 'movie' },
  { key: 'sports', label: '体育赛事', icon: 'fa-solid fa-futbol', cls: 'sport' },
  { key: 'finance', label: '财经股市', icon: 'fa-solid fa-chart-line', cls: 'finance' },
  { key: 'tech', label: '科技数码', icon: 'fa-solid fa-microchip', cls: 'tech' },
  { key: 'game', label: '游戏电竞', icon: 'fa-solid fa-gamepad', cls: 'game' },
  { key: 'society', label: '社会事件', icon: 'fa-solid fa-newspaper', cls: 'society' },
  { key: 'weather', label: '天气出行', icon: 'fa-solid fa-cloud-sun', cls: 'weather' },
];

export const liveFilters: Array<{ key: HomeLiveFilter; label: string }> = [
  { key: 'all', label: '🔥 推荐' },
  { key: 'live', label: '🔴 直播中' },
  { key: 'upcoming', label: '⏰ 即将开始' },
  { key: 'snack', label: '🍿 零食开箱' },
  { key: 'pk', label: '⚔️ 品牌PK' },
  { key: 'replay', label: '🎬 精彩回放' },
];

export const fallbackGuessImage = '/legacy/images/guess/g001.jpg';
export const fallbackLiveImage = '/legacy/images/products/p001-lays.jpg';
export const fallbackAvatar = '/legacy/images/mascot/mouse-main.png';
