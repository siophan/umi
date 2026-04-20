'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  ProductFeedItem,
  SearchHotKeywordItem,
  SearchSort,
  SearchSuggestItem,
  SearchTab,
} from '@umi/shared';

import {
  fetchSearchHotKeywords,
  fetchSearchResult,
  fetchSearchSuggestions,
} from '../../lib/api/search';
import styles from './page.module.css';

const SEARCH_HISTORY_KEY = 'gj_search_history';

type SearchProductItem = ProductFeedItem & {
  salesText: string;
  ratingText: string | null;
  tagText: string;
};

type SearchGuessItem = {
  id: string;
  title: string;
  meta: string;
  options: string[];
  img: string;
};

function formatSalesCount(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : String(value);
}

function formatProductItem(item: ProductFeedItem): SearchProductItem {
  return {
    ...item,
    salesText: `${formatSalesCount(item.sales)}已售`,
    ratingText: item.rating > 0 ? item.rating.toFixed(1) : null,
    tagText: [item.brand, item.category].filter(Boolean).join(' · ') || item.tag,
  };
}

function formatGuessItem(item: Awaited<ReturnType<typeof fetchSearchResult>>['guesses']['items'][number]): SearchGuessItem {
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

  const highlight = (text: string) => {
    const keyword = query.trim() || inputValue.trim();
    if (!keyword) return text;
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
                      <span className={styles.suggestText}>{highlight(item.text)}</span>
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
        <>
          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'all' ? styles.active : ''}`}
              type="button"
              onClick={() => {
                setTab('all');
                syncSearchParams(query, 'all', sort);
              }}
            >
              综合
            </button>
            <button
              className={`${styles.tab} ${tab === 'product' ? styles.active : ''}`}
              type="button"
              onClick={() => {
                setTab('product');
                syncSearchParams(query, 'product', sort);
              }}
            >
              商品
              <span className={styles.tabCount}>{productTotal ? `(${productTotal})` : ''}</span>
            </button>
            <button
              className={`${styles.tab} ${tab === 'guess' ? styles.active : ''}`}
              type="button"
              onClick={() => {
                setTab('guess');
                syncSearchParams(query, 'guess', sort);
              }}
            >
              竞猜
              <span className={styles.tabCount}>{guessTotal ? `(${guessTotal})` : ''}</span>
            </button>
          </nav>

          <div className={styles.filterBar} style={{ display: tab === 'guess' ? 'none' : 'flex' }}>
            {[
              ['default', '综合'],
              ['sales', '销量'],
              ['price-asc', '价格↑'],
              ['price-desc', '价格↓'],
              ['rating', '评分'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.filter} ${sort === key ? styles.filterActive : ''}`}
                onClick={() => {
                  setSort(key as SearchSort);
                  syncSearchParams(query, tab, key as SearchSort);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.results}>
            {searching ? (
              <div className={styles.empty}>
                <i className={`fa-solid fa-spinner fa-spin ${styles.emptyIcon}`} />
                <p className={styles.emptyText}>搜索中</p>
                <div className={styles.emptyTip}>正在查找相关商品和竞猜...</div>
              </div>
            ) : null}

            {!searching && noResults ? (
              <div className={styles.empty}>
                <i className={`fa-regular fa-face-meh ${styles.emptyIcon}`} />
                <p className={styles.emptyText}>未找到"{query}"相关内容</p>
                <div className={styles.emptyTip}>试试换个关键词搜索</div>
              </div>
            ) : null}

            {!searching && showGuessEmpty ? (
              <div className={styles.empty}>
                <i className={`fa-regular fa-face-meh ${styles.emptyIcon}`} />
                <p className={styles.emptyText}>无相关竞猜</p>
              </div>
            ) : null}

            {!searching && showProductEmpty ? (
              <div className={styles.empty}>
                <i className={`fa-regular fa-face-meh ${styles.emptyIcon}`} />
                <p className={styles.emptyText}>无相关商品</p>
              </div>
            ) : null}

            {!searching && (tab === 'all' || tab === 'guess') && guesses.length > 0 ? (
              <section className={styles.guessSection}>
                {tab === 'all' ? <div className={styles.resultTitle}>🎰 竞猜话题 ({guessTotal})</div> : null}
                <div className={styles.guessList}>
                  {(tab === 'all' ? guesses.slice(0, 4) : guesses).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.guessCard}
                      onClick={() => router.push(`/guess/${item.id}`)}
                    >
                      <img className={styles.guessImg} src={item.img} alt={item.title} />
                      <div className={styles.guessInfo}>
                        <div className={styles.guessTitle}>{highlight(item.title)}</div>
                        <div className={styles.guessMeta}>👥 {item.meta}</div>
                        <div className={styles.guessOptions}>
                          {item.options.map((option, index) => (
                            <span key={`${item.id}-${option}`} className={index === 0 ? styles.optHot : styles.opt}>
                              {highlight(option)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {tab === 'all' && guessTotal > 4 ? (
                  <div className={styles.viewAllWrap}>
                    <button
                      className={styles.viewAll}
                      type="button"
                      onClick={() => {
                        setTab('guess');
                        syncSearchParams(query, 'guess', sort);
                      }}
                    >
                      查看全部{guessTotal}个竞猜 →
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!searching && (tab === 'all' || tab === 'product') && products.length > 0 ? (
              <section>
                {tab === 'all' ? <div className={styles.resultTitle}>🛍️ 商品 ({productTotal})</div> : null}
                <div className={styles.grid}>
                  {(tab === 'all' ? products.slice(0, 6) : products).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.productCard}
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      <img src={item.img} alt={item.name} />
                      <div className={styles.productBody}>
                        <div className={styles.productName}>{highlight(item.name)}</div>
                        <div className={styles.productRow}>
                          <div className={styles.price}>
                            <em>¥</em>
                            {item.price}
                          </div>
                          <div className={styles.orig}>¥{item.originalPrice}</div>
                        </div>
                        <div className={styles.productMeta}>
                          <span className={styles.productSales}>{item.salesText}</span>
                          {item.ratingText ? (
                            <span className={styles.productRating}>★ {item.ratingText}</span>
                          ) : (
                            <span className={styles.productRatingEmpty}>暂无评分</span>
                          )}
                        </div>
                        <div className={styles.productTag}>{item.tagText}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {tab === 'all' && productTotal > 6 ? (
                  <div className={styles.viewAllWrap}>
                    <button
                      className={styles.viewAll}
                      type="button"
                      onClick={() => {
                        setTab('product');
                        syncSearchParams(query, 'product', sort);
                      }}
                    >
                      查看全部{productTotal}件商品 →
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </>
      ) : (
        <div className={styles.before}>
          {histories.length > 0 ? (
            <div className={styles.historySection}>
              <div className={styles.sectionHeader}>
                <span>🕐 搜索历史</span>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => {
                    setHistories([]);
                    try {
                      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
                    } catch {
                      // ignore storage errors
                    }
                    showToast('搜索历史已清空');
                  }}
                >
                  <i className="fa-solid fa-trash-can" />
                </button>
              </div>
              <div className={styles.tags}>
                {histories.map((item) => (
                  <button key={item} type="button" className={styles.tag} onClick={() => commitSearch(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.sectionHeader}>
            <span>🔥 热门搜索</span>
          </div>
          {ready && hotSearches.length ? (
            <div className={styles.hotList}>
              {hotSearches.map((item) => (
                <button key={`${item.rank}-${item.keyword}`} type="button" className={styles.hotItem} onClick={() => commitSearch(item.keyword)}>
                  <div
                    className={`${styles.rank} ${item.rank === 1 ? styles.rank1 : item.rank === 2 ? styles.rank2 : item.rank === 3 ? styles.rank3 : styles.rankNormal}`}
                  >
                    {item.rank}
                  </div>
                  <div className={styles.hotText}>{item.keyword}</div>
                  {item.badge ? (
                    <div
                      className={`${styles.hotBadge} ${item.badge === '热' ? styles.badgeHot : item.badge === '新' ? styles.badgeNew : styles.badgeRise}`}
                    >
                      {item.badge}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : ready ? (
            <div className={styles.sectionEmpty}>暂无热门搜索</div>
          ) : (
            <div className={styles.sectionEmpty}>热门搜索加载中...</div>
          )}
        </div>
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
