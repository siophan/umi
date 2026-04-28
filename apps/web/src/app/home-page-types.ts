import type {
  BannerItem,
  GuessCategoryItem,
  GuessHistoryRecordItem,
  GuessSummary,
  LiveListItem,
  RankingItem,
} from '@umi/shared';

export type HomeMode = 'guess' | 'live';

/**
 * 分类 tab 的 key：
 * - 'hot' 表示固定首位 meta tab（匹配全部，不在 DB 里）
 * - 其他值是 category.id（来自 /api/guesses/categories）
 */
export type HomeCategory = string;

export type HomeCategoryTab = {
  key: HomeCategory;
  label: string;
  iconClass: string;
  themeClass: string;
};

export type HomeLiveFilter = 'all' | 'live' | 'upcoming' | 'snack' | 'pk';
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
  guessNextCursor: string | null;
  guessHasMore: boolean;
  guessCategories: GuessCategoryItem[];
  liveItems: LiveListItem[];
  rankingItems: RankingItem[];
  historyItems: GuessHistoryRecordItem[];
  hotTopics: Array<{ text: string; desc: string }>;
  sectionErrors: HomeSectionErrors;
};

export type HomePageClientProps = {
  initialData: HomePageInitialData;
};

export const HOT_CATEGORY: HomeCategoryTab = {
  key: 'hot',
  label: '今日热点',
  iconClass: 'fa-solid fa-fire',
  themeClass: 'hot',
};

export function buildCategoryTabs(items: GuessCategoryItem[]): HomeCategoryTab[] {
  return [
    HOT_CATEGORY,
    ...items.map((item) => ({
      key: item.id,
      label: item.name,
      iconClass: item.iconClass || 'fa-solid fa-tag',
      themeClass: item.themeClass || 'hot',
    })),
  ];
}

export const liveFilters: Array<{ key: HomeLiveFilter; label: string }> = [
  { key: 'all', label: '🔥 推荐' },
  { key: 'live', label: '🔴 直播中' },
  { key: 'upcoming', label: '⏰ 即将开始' },
  { key: 'snack', label: '🍿 零食开箱' },
  { key: 'pk', label: '⚔️ 品牌PK' },
];

export const fallbackGuessImage = '/legacy/images/guess/g001.jpg';
export const fallbackLiveImage = '/legacy/images/products/p001-lays.jpg';
export const fallbackAvatar = '/legacy/images/mascot/mouse-main.png';
