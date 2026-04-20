import type {
  SearchHotResult,
  SearchResult,
  SearchSort,
  SearchSuggestResult,
  SearchTab,
} from '@umi/shared';

import { getJson } from './shared';

export async function fetchSearchResult(options: {
  q: string;
  tab?: SearchTab;
  sort?: SearchSort;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('q', options.q.trim());
  if (options.tab && options.tab !== 'all') {
    searchParams.set('tab', options.tab);
  }
  if (options.sort && options.sort !== 'default') {
    searchParams.set('sort', options.sort);
  }
  if (typeof options.limit === 'number') {
    searchParams.set('limit', String(options.limit));
  }
  return getJson<SearchResult>(`/api/search?${searchParams.toString()}`);
}

export async function fetchSearchHotKeywords(limit?: number) {
  const query = typeof limit === 'number' ? `?limit=${limit}` : '';
  return getJson<SearchHotResult>(`/api/search/hot${query}`);
}

export async function fetchSearchSuggestions(q: string, limit?: number) {
  const searchParams = new URLSearchParams();
  searchParams.set('q', q.trim());
  if (typeof limit === 'number') {
    searchParams.set('limit', String(limit));
  }
  return getJson<SearchSuggestResult>(`/api/search/suggest?${searchParams.toString()}`);
}
