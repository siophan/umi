'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SearchHotKeywordItem, SearchSort, SearchSuggestItem, SearchTab } from '@umi/shared';

import {
  fetchSearchHotKeywords,
  fetchSearchResult,
  fetchSearchSuggestions,
} from '../../lib/api/search';
import { SearchBeforeView } from './search-before-view';
import {
  clearStoredHistory,
  formatGuessItem,
  formatProductItem,
  highlightKeyword,
  SEARCH_HISTORY_KEY,
  type SearchGuessItem,
  type SearchProductItem,
} from './search-helpers';
import { SearchResultsView } from './search-results-view';
import styles from './page.module.css';

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastTimerRef = useRef<number | null>(null);
  const suggestTimerRef = useRef<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [histories, setHistories] = useState<string[]>([]);
  const [tab, setTab] = useState<SearchTab>('all');
  const [sort, setSort] = useState<SearchSort>('default');
  const [focused, setFocused] = useState(false);
  const [products, setProducts] = useState<SearchProductItem[]>([]);
  const [guesses, setGuesses] = useState<SearchGuessItem[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [guessTotal, setGuessTotal] = useState(0);
  const [hotSearches, setHotSearches] = useState<SearchHotKeywordItem[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestItem[]>([]);
  const [ready, setReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(''), 1800);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (suggestTimerRef.current) {
        window.clearTimeout(suggestTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextQuery = searchParams.get('q')?.trim() || '';
    const nextTab = searchParams.get('tab');
    const nextSort = searchParams.get('sort');

    setInputValue(nextQuery);
    setQuery(nextQuery);
    setTab(nextTab === 'product' || nextTab === 'guess' || nextTab === 'all' ? nextTab : 'all');
    setSort(
      nextSort === 'sales' ||
        nextSort === 'price-asc' ||
        nextSort === 'price-desc' ||
        nextSort === 'rating' ||
        nextSort === 'default'
        ? nextSort
        : 'default',
    );
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setHistories(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSearchHotKeywords(8)
      .then((result) => {
        if (!cancelled) {
          setHotSearches(result.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHotSearches([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      setProducts([]);
      setGuesses([]);
      setProductTotal(0);
      setGuessTotal(0);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    fetchSearchResult({ q: keyword, sort, limit: 50 })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products.items.map((item) => formatProductItem(item)));
        setGuesses(result.guesses.items.map((item) => formatGuessItem(item)));
        setProductTotal(result.products.total);
        setGuessTotal(result.guesses.total);
      })
      .catch((error) => {
        if (cancelled) return;
        setProducts([]);
        setGuesses([]);
        setProductTotal(0);
        setGuessTotal(0);
        showToast(error instanceof Error ? error.message : '搜索失败');
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, sort]);

  useEffect(() => {
    const keyword = inputValue.trim();
    if (!focused || !keyword || keyword === query.trim()) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }

    if (suggestTimerRef.current) {
      window.clearTimeout(suggestTimerRef.current);
    }

    setSuggesting(true);
    suggestTimerRef.current = window.setTimeout(() => {
      fetchSearchSuggestions(keyword, 8)
        .then((result) => {
          setSuggestions(result.items);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setSuggesting(false);
        });
    }, 180);

    return () => {
      if (suggestTimerRef.current) {
        window.clearTimeout(suggestTimerRef.current);
      }
    };
  }, [focused, inputValue, query]);

  const hasQuery = query.trim().length > 0;
  const showSuggestions = focused && inputValue.trim().length > 0 && inputValue.trim() !== query.trim();

  const saveHistory = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setHistories((current) => {
      const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, 10);
      try {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const syncSearchParams = (nextQuery: string, nextTab: SearchTab, nextSort: SearchSort) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    if (nextTab !== 'all') params.set('tab', nextTab);
    if (nextSort !== 'default') params.set('sort', nextSort);
    router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      showToast('请输入搜索内容');
      return;
    }
    setInputValue(trimmed);
    setQuery(trimmed);
    setTab('all');
    setSort('default');
    setFocused(false);
    setSuggestions([]);
    saveHistory(trimmed);
    syncSearchParams(trimmed, 'all', 'default');
  };

  const noResults = hasQuery && productTotal === 0 && guessTotal === 0;
  const showProductEmpty = !searching && hasQuery && tab === 'product' && productTotal === 0;
  const showGuessEmpty = !searching && hasQuery && tab === 'guess' && guessTotal === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.searchField}>
          <div className={`${styles.inputWrap} ${focused ? styles.focus : ''}`}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              autoFocus
              value={inputValue}
              placeholder="搜索商品、竞猜、品牌..."
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              onChange={(event) => setInputValue(event.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitSearch(event.currentTarget.value);
                }
              }}
            />
            <button
              type="button"
              className={`${styles.clear} ${inputValue ? styles.clearShow : ''}`}
              onClick={() => {
                setInputValue('');
                setQuery('');
                setTab('all');
                setSort('default');
                setSuggestions([]);
                syncSearchParams('', 'all', 'default');
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          {showSuggestions ? (
            <div className={styles.suggestPanel}>
              {suggesting ? <div className={styles.suggestLoading}>联想中...</div> : null}
              {!suggesting && suggestions.length === 0 ? (
                <div className={styles.suggestEmpty}>暂无联想词</div>
              ) : null}
              {!suggesting && suggestions.length > 0 ? (
                <div className={styles.suggestList}>
                  {suggestions.map((item) => (
                    <button
                      key={`${item.type}-${item.text}`}
                      type="button"
                      className={styles.suggestItem}
                      onClick={() => commitSearch(item.text)}
                    >
                      <i className="fa-solid fa-magnifying-glass" />
                      <span className={styles.suggestText}>
                        {highlightKeyword(item.text, query.trim() || inputValue.trim())}
                      </span>
                      <span className={styles.suggestType}>
                        {item.type === 'product' ? '商品' : item.type === 'guess' ? '竞猜' : '品牌'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <button className={styles.searchBtn} type="button" onClick={() => commitSearch(inputValue)}>
          搜索
        </button>
      </header>

      {hasQuery ? (
        <SearchResultsView
          tab={tab}
          sort={sort}
          query={query}
          inputValue={inputValue}
          searching={searching}
          noResults={noResults}
          showGuessEmpty={showGuessEmpty}
          showProductEmpty={showProductEmpty}
          guessTotal={guessTotal}
          productTotal={productTotal}
          guesses={guesses}
          products={products}
          priceAsc={sort === 'price-asc'}
          onTabChange={(nextTab) => {
            setTab(nextTab);
            syncSearchParams(query, nextTab, sort);
          }}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            syncSearchParams(query, tab, nextSort);
          }}
          onTogglePriceSort={() => {
            const nextSort = sort === 'price-asc' ? 'price-desc' : 'price-asc';
            setSort(nextSort);
            syncSearchParams(query, tab, nextSort);
          }}
          onOpenGuess={(id) => router.push(`/guess/${id}`)}
          onOpenProduct={(id) => router.push(`/product/${id}`)}
        />
      ) : (
        <SearchBeforeView
          ready={ready}
          histories={histories}
          hotSearches={hotSearches}
          onCommitSearch={commitSearch}
          onClearHistory={() =>
            clearStoredHistory(() => {
              setHistories([]);
              showToast('搜索历史已清空');
            })
          }
        />
      )}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <SearchPageInner />
    </Suspense>
  );
}
