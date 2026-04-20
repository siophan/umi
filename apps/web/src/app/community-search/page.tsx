'use client';

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CommunityFeedItem, UserSearchItem } from '@umi/shared';

import { fetchCommunityDiscovery, searchCommunity } from '../../lib/api/community';
import { followUser, searchUsers, unfollowUser } from '../../lib/api/users';
import styles from './page.module.css';

type SearchFilter = 'all' | 'post' | 'guess' | 'user';

const HISTORY_KEY = 'cy_search_history';
const filters = [
  { key: 'all', label: '全部' },
  { key: 'post', label: '动态' },
  { key: 'guess', label: '竞猜' },
  { key: 'user', label: '猜友' },
] as const;

function formatNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return '刚刚';
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  }
  return `${Math.max(1, Math.floor(diff / day))}天前`;
}

function highlight(text: string, keyword: string) {
  if (!keyword.trim()) {
    return text;
  }

  const keywordLower = keyword.toLowerCase();
  const pattern = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => (
    part.toLowerCase() === keywordLower ? <em key={`${part}-${index}`}>{part}</em> : <Fragment key={`${part}-${index}`}>{part}</Fragment>
  ));
}

function userDesc(user: UserSearchItem) {
  if (user.shopVerified) {
    return '品牌认证';
  }
  if ((user.winRate ?? 0) > 0) {
    return `胜率${user.winRate}%`;
  }
  if ((user.followers ?? 0) > 0) {
    return `${formatNum(user.followers ?? 0)}粉丝`;
  }
  return '猜友';
}

function postType(post: CommunityFeedItem): Exclude<SearchFilter, 'all' | 'user'> {
  if (post.guessInfo) {
    return 'guess';
  }
  return 'post';
}

function postTagClass(post: CommunityFeedItem) {
  if (post.guessInfo || post.author.verified) {
    return 'tagBrand';
  }
  if ((post.tag || '').includes('测评')) {
    return 'tagHot';
  }
  if ((post.tag || '').includes('视频')) {
    return 'tagLive';
  }
  return 'tagCommunity';
}

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
  const [searching, setSearching] = useState(false);
  const [followSavingId, setFollowSavingId] = useState('');
  const [toast, setToast] = useState('');
  const [hotSearches, setHotSearches] = useState<Array<{ title: string; desc: string; tag: string; kind: 'hotFire' | 'hotNew' | 'hotBoom' }>>([]);

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
      try {
        const [result, discovery] = await Promise.all([searchUsers(), fetchCommunityDiscovery()]);
        if (ignore) {
          return;
        }
        setRecommendedUsers(result.items.slice(0, 6));
        setHotSearches(
          discovery.hotTopics.slice(0, 8).map((item, index) => ({
            title: item.text,
            desc: item.desc,
            tag: index === 0 ? '爆' : index < 3 ? '热' : '新',
            kind: index === 0 ? 'hotBoom' : index < 3 ? 'hotFire' : 'hotNew',
          })),
        );
      } catch {
        if (!ignore) {
          setRecommendedUsers([]);
          setHotSearches([]);
        }
      } finally {
        if (!ignore) {
          setReady(true);
        }
      }
    }

    void loadRecommended();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function runSearch() {
      const keyword = searchedQuery.trim();
      if (!keyword) {
        setPosts([]);
        setUsers([]);
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        const result = await searchCommunity(keyword);
        if (ignore) {
          return;
        }
        setPosts(result.posts);
        setUsers(result.users);
      } catch {
        if (!ignore) {
          setPosts([]);
          setUsers([]);
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
  }, [searchedQuery]);

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
        {filters.map((item) => (
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
        <div className={styles.defaultView}>
          {searchHistory.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                <span><i className="fa-solid fa-clock-rotate-left" /></span> 搜索历史
                <button
                  type="button"
                  onClick={() => {
                    setSearchHistory([]);
                    window.localStorage.removeItem(HISTORY_KEY);
                    showToast('搜索历史已清除');
                  }}
                >
                  <i className="fa-solid fa-trash-can" /> 清除
                </button>
              </div>
              <div className={styles.historyList}>
                {searchHistory.map((item) => (
                  <button className={styles.historyItem} key={item} type="button" onClick={() => doSearch(item)}>
                    <i className="fa-solid fa-clock-rotate-left" />
                    {item}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span><i className="fa-solid fa-fire" /></span> 热搜榜
            </div>
            {hotSearches.length ? (
              <div className={styles.hotList}>
                {hotSearches.map((item, index) => (
                  <button className={styles.hotItem} key={item.title} type="button" onClick={() => doSearch(item.title)}>
                    <div className={`${styles.hotRank} ${styles[`rank${index < 3 ? index + 1 : 4}` as const]}`}>
                      {index + 1}
                    </div>
                    <div className={styles.hotText}>
                      <div className={styles.hotItemTitle}>{item.title}</div>
                      <div className={styles.hotItemDesc}>{item.desc}</div>
                    </div>
                    <span className={styles[item.kind]}>{item.tag}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.sectionEmpty}>暂无热搜内容</div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span><i className="fa-solid fa-user-plus" /></span> 推荐关注
            </div>
            {ready && recommendedUsers.length ? (
              <div className={styles.userScroll}>
                {recommendedUsers.map((user) => {
                  const followed = user.relation === 'friend' || user.relation === 'following';
                  return (
                    <button className={styles.userCard} key={user.id} type="button" onClick={() => router.push(`/user/${encodeURIComponent(user.uid)}`)}>
                      <img src={user.avatar || '/legacy/images/mascot/mouse-main.png'} alt={user.name} />
                      <div className={styles.userName}>
                        {user.name}
                        {user.shopVerified ? <i className="fa-solid fa-circle-check" /> : null}
                      </div>
                      <div className={styles.userDesc}>{userDesc(user)}</div>
                      <span
                        className={followed ? styles.followedBtn : styles.followBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          void toggleFollow(user);
                        }}
                      >
                        {followSavingId === user.id ? '处理中' : followed ? '已关注' : '+ 关注'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.sectionEmpty}>暂无推荐用户</div>
            )}
          </section>
        </div>
      ) : (
        <div className={styles.resultsView}>
          {searching ? (
            <div className={styles.empty}>
              <i className="fa-solid fa-spinner fa-spin" />
              <div className={styles.emptyTitle}>搜索中</div>
              <div className={styles.emptyDesc}>正在查找相关内容...</div>
            </div>
          ) : (
            <>
              {filteredUsers.length ? (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <span><i className="fa-solid fa-user" /></span> 相关猜友
                  </div>
                  <div className={styles.userScroll}>
                    {filteredUsers.map((user) => {
                      const followed = user.relation === 'friend' || user.relation === 'following';
                      return (
                        <button className={styles.userCard} key={user.id} type="button" onClick={() => router.push(`/user/${encodeURIComponent(user.uid)}`)}>
                          <img src={user.avatar || '/legacy/images/mascot/mouse-main.png'} alt={user.name} />
                          <div className={styles.userName}>
                            {user.name}
                            {user.shopVerified ? <i className="fa-solid fa-circle-check" /> : null}
                          </div>
                          <div className={styles.userDesc}>{userDesc(user)}</div>
                          <span
                            className={followed ? styles.followedBtn : styles.followBtn}
                            onClick={(event) => {
                              event.stopPropagation();
                              void toggleFollow(user);
                            }}
                          >
                            {followSavingId === user.id ? '处理中' : followed ? '已关注' : '+ 关注'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {filteredPosts.length ? filteredPosts.map((item) => (
                <button className={styles.resultCard} key={item.id} type="button" onClick={() => router.push(`/post/${encodeURIComponent(item.id)}`)}>
                  <div className={styles.resultAuthor}>
                    <img src={item.author.avatar || '/legacy/images/mascot/mouse-main.png'} alt={item.author.name} />
                    <div>
                      <div className={styles.resultName}>
                        {item.author.name}
                        {item.author.verified ? <i className="fa-solid fa-circle-check" /> : null}
                      </div>
                      <div className={styles.resultTime}>{formatRelativeTime(item.createdAt)}</div>
                    </div>
                    <span className={`${styles.resultTag} ${styles[postTagClass(item)]}`}>{item.tag || '猜友动态'}</span>
                  </div>
                  <div className={styles.resultBody}>
                    <div className={styles.resultTitle}>{highlight(item.title, searchedQuery)}</div>
                    <div className={styles.resultDesc}>{item.desc}</div>
                  </div>
                  {item.images.length ? (
                    <div className={`${styles.resultImages} ${styles[`img${item.images.length >= 3 ? 3 : item.images.length}` as const]}`}>
                      {item.images.slice(0, 3).map((image) => (
                        <img src={image} alt={item.title} key={image} />
                      ))}
                    </div>
                  ) : null}
                  <div className={styles.resultActions}>
                    <span><i className="fa-regular fa-heart" /> {formatNum(item.likes)}</span>
                    <span><i className="fa-regular fa-comment" /> {formatNum(item.comments)}</span>
                    <span><i className="fa-solid fa-share-nodes" /> {formatNum(item.shares)}</span>
                  </div>
                </button>
              )) : null}

              {!filteredPosts.length && !filteredUsers.length ? (
                <div className={styles.empty}>
                  <i className="fa-solid fa-magnifying-glass" />
                  <div className={styles.emptyTitle}>未找到“{searchedQuery}”相关内容</div>
                  <div className={styles.emptyDesc}>换个关键词试试吧~</div>
                </div>
              ) : null}
            </>
          )}
        </div>
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
