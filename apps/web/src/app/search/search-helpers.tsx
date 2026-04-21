'use client';

import type {
  ProductFeedItem,
  SearchHotKeywordItem,
  SearchSort,
  SearchSuggestItem,
  SearchTab,
} from '@umi/shared';

import styles from './page.module.css';

export const SEARCH_HISTORY_KEY = 'gj_search_history';

export type SearchProductItem = ProductFeedItem & {
  salesText: string;
  ratingText: string | null;
  tagText: string;
};

export type SearchGuessItem = {
  id: string;
  title: string;
  meta: string;
  options: string[];
  img: string;
};

export type SearchSuggestionViewModel = {
  items: SearchSuggestItem[];
  visible: boolean;
  suggesting: boolean;
};

export function formatSalesCount(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : String(value);
}

export function formatProductItem(item: ProductFeedItem): SearchProductItem {
  return {
    ...item,
    salesText: `${formatSalesCount(item.sales)}已售`,
    ratingText: item.rating > 0 ? item.rating.toFixed(1) : null,
    tagText: [item.brand, item.category].filter(Boolean).join(' · ') || item.tag,
  };
}

export function formatGuessItem(
  item: {
    id: string;
    title: string;
    product: { brand: string; img: string };
    category: string;
    options: Array<{ optionText: string; voteCount: number; odds?: number | null }>;
  },
): SearchGuessItem {
  const totalVotes = item.options.reduce((sum, option) => sum + option.voteCount, 0);
  const metaSource = item.product.brand || item.category || '优米竞猜';
  return {
    id: item.id,
    title: item.title,
    meta: `${formatSalesCount(totalVotes)}人参与 · ${metaSource}`,
    options: item.options
      .slice(0, 3)
      .map((option) => `${option.optionText} ×${Number(option.odds ?? 0).toFixed(1).replace(/\.0$/, '')}`),
    img: item.product.img || '/legacy/images/placeholder/product-fallback.svg',
  };
}

export function highlightKeyword(text: string, keyword: string) {
  if (!keyword) {
    return text;
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <span className={styles.highlight} key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

export function clearStoredHistory(onCleared: () => void) {
  try {
    window.localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore storage errors
  }
  onCleared();
}

export type SearchBeforeViewProps = {
  ready: boolean;
  histories: string[];
  hotSearches: SearchHotKeywordItem[];
  onCommitSearch: (value: string) => void;
  onClearHistory: () => void;
};

export type SearchResultsViewProps = {
  tab: SearchTab;
  sort: SearchSort;
  query: string;
  inputValue: string;
  searching: boolean;
  noResults: boolean;
  showGuessEmpty: boolean;
  showProductEmpty: boolean;
  guessTotal: number;
  productTotal: number;
  guesses: SearchGuessItem[];
  products: SearchProductItem[];
  priceAsc: boolean;
  onTabChange: (tab: SearchTab) => void;
  onSortChange: (sort: SearchSort) => void;
  onTogglePriceSort: () => void;
  onOpenGuess: (id: string) => void;
  onOpenProduct: (id: string) => void;
};
