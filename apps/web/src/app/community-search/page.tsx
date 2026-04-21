'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CommunityFeedItem, UserSearchItem } from '@umi/shared';

import { fetchCommunityDiscovery, searchCommunity } from '../../lib/api/community';
import { followUser, searchUsers, unfollowUser } from '../../lib/api/users';
import { hasAuthToken } from '../../lib/api/shared';
import { CommunitySearchDefaultView } from './default-view';
import { CommunitySearchResultsView } from './results-view';
import {
  HISTORY_KEY,
  highlight,
  postType,
  searchFilters,
  type HotSearchItem,
  type SearchFilter,
} from './page-helpers';
import styles from './page.module.css';

function CommunitySearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [focused, setFocused] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<UserSearchItem[]>([]);
  const [posts, setPosts] = useState<CommunityFeedItem[]>([]);
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [followSavingId, setFollowSavingId] = useState('');
  const [toast, setToast] = useState('');
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const [hotError, setHotError] = useState('');
  const [recommendError, setRecommendError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [discoveryReloadToken, setDiscoveryReloadToken] = useState(0);
  const [searchReloadToken, setSearchReloadToken] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      } catch {
        window.localStorage.removeItem(HISTORY_KEY);
      }
    }

    const preset = searchParams.get('q')?.trim() || '';
    inputRef.current?.focus();
    if (preset) {
      setQuery(preset);
      setSearchedQuery(preset);
      setFocused(true);
    }

    setLoggedIn(hasAuthToken());
    setAuthReady(true);

    return () => {
      if (blurTimer.current) {
        window.clearTimeout(blurTimer.current);
      }
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadRecommended() {
      if (!authReady) {
        return;
      }
      if (!loggedIn) {
        setRecommendedUsers([]);
        setHotSearches([]);
        setRecommendError('');
        setHotError('');
        setReady(true);
        return;
      }

      const [userResult, discoveryResult] = await Promise.allSettled([
        searchUsers(),
        fetchCommunityDiscovery(),
      ]);
      if (ignore) {
        return;
      }

      if (userResult.status === 'fulfilled') {
        setRecommendedUsers(userResult.value.items.slice(0, 6));
        setRecommendError('');
      } else {
        setRecommendedUsers([]);
        setRecommendError(
          userResult.reason instanceof Error ? userResult.reason.message : '推荐关注加载失败，请稍后重试',
        );
      }

      if (discoveryResult.status === 'fulfilled') {
        setHotSearches(
          discoveryResult.value.hotTopics.slice(0, 8).map((item, index) => ({
            title: item.text,
            desc: item.desc,
            tag: index === 0 ? '爆' : index < 3 ? '热' : '新',
            kind: index === 0 ? 'hotBoom' : index < 3 ? 'hotFire' : 'hotNew',
          })),
        );
        setHotError('');
      } else {
        setHotSearches([]);
        setHotError(
          discoveryResult.reason instanceof Error ? discoveryResult.reason.message : '热搜加载失败，请稍后重试',
        );
      }

      setReady(true);
    }

    void loadRecommended();
    return () => {
      ignore = true;
    };
  }, [authReady, discoveryReloadToken, loggedIn]);

  useEffect(() => {
    let ignore = false;

    async function runSearch() {
      if (!authReady) {
        return;
      }
      const keyword = searchedQuery.trim();
      if (!keyword) {
        setPosts([]);
        setUsers([]);
        setSearching(false);
        return;
      }
      if (!loggedIn) {
        setPosts([]);
        setUsers([]);
        setSearchError('');
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        setSearchError('');
        const result = await searchCommunity(keyword);
        if (ignore) {
          return;
        }
        setPosts(result.posts);
        setUsers(result.users);
      } catch (error) {
        if (!ignore) {
          setPosts([]);
          setUsers([]);
          setSearchError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
        }
      } finally {
        if (!ignore) {
          setSearching(false);
        }
      }
    }

    void runSearch();
    return () => {
      ignore = true;
    };
  }, [authReady, loggedIn, searchedQuery, searchReloadToken]);

  const loginRedirect = useMemo(() => {
    const keyword = searchedQuery.trim() || query.trim();
    return keyword ? `/community-search?q=${encodeURIComponent(keyword)}` : '/community-search';
  }, [query, searchedQuery]);

  const authAction = searchedQuery.trim() ? '查看社区搜索结果' : '进入社区搜索';

  const suggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword || searchedQuery) {
      return [];
    }

    const list: Array<{ title: string; hot: boolean }> = [];
    hotSearches
      .filter((item) => item.title.toLowerCase().includes(keyword))
      .slice(0, 4)
      .forEach((item) => list.push({ title: item.title, hot: true }));

    recommendedUsers
      .filter((item) => item.name.toLowerCase().includes(keyword))
      .slice(0, 4)
      .forEach((item) => {
        if (!list.some((entry) => entry.title === item.name)) {
          list.push({ title: item.name, hot: false });
        }
      });

    return list.slice(0, 6);
  }, [query, recommendedUsers, searchedQuery]);

  const filteredPosts = useMemo(() => {
    if (filter === 'all' || filter === 'post') {
      return posts;
    }
    return posts.filter((item) => postType(item) === filter);
  }, [filter, posts]);

  const filteredUsers = useMemo(() => {
    if (filter === 'user' || filter === 'all') {
      return users;
    }
    return [];
  }, [filter, users]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  }

  function saveHistory(value: string) {
    const next = [value, ...searchHistory.filter((item) => item !== value)].slice(0, 10);
    setSearchHistory(next);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function doSearch(value: string) {
    const keyword = value.trim();
    if (!keyword) {
      return;
    }
    setQuery(keyword);
    setSearchedQuery(keyword);
    saveHistory(keyword);
    setFocused(false);
  }

  function clearSearch() {
    setQuery('');
    setSearchedQuery('');
    setFocused(false);
    inputRef.current?.focus();
  }

  async function toggleFollow(user: UserSearchItem) {
    try {
      setFollowSavingId(user.id);
      const followed = user.relation === 'friend' || user.relation === 'following';
      if (followed) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }

      const nextRelation: UserSearchItem['relation'] = followed
        ? (user.relation === 'friend' ? 'fan' : 'none')
        : (user.relation === 'fan' ? 'friend' : 'following');
      const update = (list: UserSearchItem[]) =>
        list.map((item) => (item.id === user.id ? { ...item, relation: nextRelation } : item));

      setRecommendedUsers(update);
      setUsers(update);
      showToast(followed ? `已取消关注 ${user.name}` : `已关注 ${user.name}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setFollowSavingId('');
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={`${styles.inputWrap} ${focused ? styles.inputFocus : ''}`}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value.trim()) {
                setSearchedQuery('');
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setFocused(false), 200);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                doSearch(query);
              }
            }}
            placeholder="搜索动态、话题、猜友..."
          />
          <button
            className={query ? `${styles.clearBtn} ${styles.clearBtnShow}` : styles.clearBtn}
            type="button"
            onClick={clearSearch}
          >
            <i className="fa-solid fa-xmark" />
          </button>
          {focused && suggestions.length > 0 ? (
            <div className={styles.suggestList}>
              {suggestions.map((item) => (
                <button className={styles.suggestItem} key={item.title} type="button" onMouseDown={() => doSearch(item.title)}>
                  <i className={item.hot ? 'fa-solid fa-fire' : 'fa-solid fa-magnifying-glass'} />
                  <span>{highlight(item.title, query)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button className={styles.cancelBtn} type="button" onClick={() => router.back()}>
          取消
        </button>
      </div>

      <div className={styles.filters}>
        {searchFilters.map((item) => (
          <button
            className={filter === item.key ? styles.filterActive : styles.filter}
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!searchedQuery ? (
        <CommunitySearchDefaultView
          loggedIn={loggedIn}
          searchHistory={searchHistory}
          hotSearches={hotSearches}
          hotError={hotError}
          ready={ready}
          recommendedUsers={recommendedUsers}
          recommendError={recommendError}
          followSavingId={followSavingId}
          onLogin={() =>
            router.push(
              `/login?redirect=${encodeURIComponent(loginRedirect)}&action=${encodeURIComponent(authAction)}`,
            )
          }
          onSearch={doSearch}
          onClearHistory={() => {
            setSearchHistory([]);
            window.localStorage.removeItem(HISTORY_KEY);
            showToast('搜索历史已清除');
          }}
          onRetryDiscovery={() => setDiscoveryReloadToken((value) => value + 1)}
          onUserOpen={(uid) => router.push(`/user/${encodeURIComponent(uid)}`)}
          onToggleFollow={(user) => {
            void toggleFollow(user);
          }}
        />
      ) : (
        <CommunitySearchResultsView
          loggedIn={loggedIn}
          searchedQuery={searchedQuery}
          searching={searching}
          searchError={searchError}
          filteredUsers={filteredUsers}
          filteredPosts={filteredPosts}
          followSavingId={followSavingId}
          onLogin={() =>
            router.push(
              `/login?redirect=${encodeURIComponent(loginRedirect)}&action=${encodeURIComponent(authAction)}`,
            )
          }
          onRetrySearch={() => setSearchReloadToken((value) => value + 1)}
          onUserOpen={(uid) => router.push(`/user/${encodeURIComponent(uid)}`)}
          onToggleFollow={(user) => {
            void toggleFollow(user);
          }}
          onPostOpen={(postId) => router.push(`/post/${encodeURIComponent(postId)}`)}
        />
      )}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}

export default function CommunitySearchPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <CommunitySearchPageInner />
    </Suspense>
  );
}
