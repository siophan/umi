'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import styles from './page.module.css';

type SearchFilter = 'all' | 'post' | 'guess' | 'user' | 'topic' | 'video';

type SearchResult = {
  id: string;
  type: SearchFilter | 'brand';
  author: string;
  avatar: string;
  verified: boolean;
  tag: string;
  tagClass: 'tagGuess' | 'tagBrand' | 'tagHot' | 'tagCommunity' | 'tagLive';
  title: string;
  desc: string;
  images: string[];
  likes: number;
  comments: number;
  shares: number;
  time: string;
};

const HISTORY_KEY = 'cy_search_history';
const filters = [
  { key: 'all', label: '全部' },
  { key: 'post', label: '动态' },
  { key: 'guess', label: '竞猜' },
  { key: 'user', label: '猜友' },
  { key: 'topic', label: '话题' },
  { key: 'video', label: '视频' },
] as const;

const hotSearches = [
  { title: '德芙vs费列罗', desc: '3890人参与竞猜', tag: '热', kind: 'hotFire' as const },
  { title: '马年年货王', desc: '坚果礼盒 vs 糕点系列', tag: '热', kind: 'hotFire' as const },
  { title: '乐事新口味投票', desc: '番茄味 vs 黄瓜味', tag: '新', kind: 'hotNew' as const },
  { title: '零食测评排行榜', desc: '2026年度十大品牌', tag: '热', kind: 'hotFire' as const },
  { title: '卫龙 vs 源氏辣条', desc: '辣味巅峰对决', tag: '爆', kind: 'hotBoom' as const },
  { title: '旺旺大礼包2026', desc: '马年限定版开箱', tag: '新', kind: 'hotNew' as const },
  { title: 'PK战报', desc: '本周最强猜友排行', tag: '热', kind: 'hotFire' as const },
  { title: '情人节竞猜', desc: '德芙限定礼盒口味', tag: '新', kind: 'hotNew' as const },
];

const recommendedUsers = [
  { name: '乐事官方', avatar: '/legacy/images/products/p001-lays.jpg', desc: '品牌认证', verified: true },
  { name: '三只松鼠', avatar: '/legacy/images/products/p003-squirrels.jpg', desc: '品牌认证', verified: true },
  { name: '零食达人小王', avatar: '/legacy/images/mascot/mouse-happy.png', desc: '胜率82%', verified: false },
  { name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', desc: '品牌认证', verified: true },
  { name: '坚果控大李', avatar: '/legacy/images/products/p005-liangpin.jpg', desc: '三连胜', verified: false },
];

const searchResults: SearchResult[] = [
  {
    id: 'post-1',
    type: 'guess',
    author: '优米数据中心',
    avatar: '/legacy/images/mascot/mouse-main.png',
    verified: true,
    tag: '品牌竞猜',
    tagClass: 'tagBrand',
    title: '乐事2026马年限定口味投票开启！番茄味 vs 黄瓜味',
    desc: '参与竞猜赢正品零食大礼包，猜中直接发货到家。当前3890人参与！',
    images: ['/legacy/images/guess/g001.jpg'],
    likes: 2341,
    comments: 456,
    shares: 89,
    time: '15分钟前',
  },
  {
    id: 'post-2',
    type: 'post',
    author: '零食测评官',
    avatar: '/legacy/images/mascot/mouse-casual.png',
    verified: false,
    tag: '零食测评',
    tagClass: 'tagHot',
    title: '2026年度十大零食品牌排行榜出炉！三只松鼠再登榜首',
    desc: '根据全平台销售数据与用户口碑综合评选，坚果礼盒、糕点系列和膨化零食的热度继续走高。',
    images: ['/legacy/images/products/p003-squirrels.jpg', '/legacy/images/products/p005-liangpin.jpg'],
    likes: 8723,
    comments: 1204,
    shares: 188,
    time: '1小时前',
  },
  {
    id: 'post-3',
    type: 'topic',
    author: '猜友圈',
    avatar: '/legacy/images/mascot/mouse-main.png',
    verified: true,
    tag: '猜友动态',
    tagClass: 'tagCommunity',
    title: '# 马年年货王 # 你更看好坚果礼盒还是糕点系列？',
    desc: '话题页聚合了最新年货投票、晒单和猜友战报，实时刷新热度排名。',
    images: ['/legacy/images/products/p014-qiaqia.jpg', '/legacy/images/products/p011-haidilao.jpg', '/legacy/images/products/p016-wangzai.jpg'],
    likes: 1534,
    comments: 326,
    shares: 77,
    time: '2小时前',
  },
  {
    id: 'post-4',
    type: 'video',
    author: '开箱实验室',
    avatar: '/legacy/images/mascot/mouse-sunny.png',
    verified: false,
    tag: '直播速看',
    tagClass: 'tagLive',
    title: '旺旺大礼包2026 开箱速看，限定礼盒里到底有什么？',
    desc: '一分钟看完礼盒内容物、试吃反馈和本期热门竞猜入口。',
    images: ['/legacy/images/products/p006-wangwang.jpg'],
    likes: 926,
    comments: 112,
    shares: 43,
    time: '3小时前',
  },
];

function formatNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
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

export default function CommunitySearchPage() {
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
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');

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

  const suggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword || searchedQuery) {
      return [];
    }

    const list: Array<{ title: string; hot: boolean }> = [];
    hotSearches
      .filter((item) => item.title.toLowerCase().includes(keyword))
      .slice(0, 3)
      .forEach((item) => list.push({ title: item.title, hot: true }));

    searchResults
      .filter((item) => `${item.title}${item.desc}${item.tag}`.toLowerCase().includes(keyword))
      .slice(0, 5)
      .forEach((item) => {
        if (!list.some((entry) => entry.title === item.title)) {
          list.push({ title: item.title, hot: false });
        }
      });

    return list;
  }, [query, searchedQuery]);

  const filteredResults = useMemo(() => {
    if (!searchedQuery.trim()) {
      return [];
    }

    const keyword = searchedQuery.trim().toLowerCase();
    let list = searchResults.filter((item) => `${item.title}${item.desc}${item.tag}${item.author}`.toLowerCase().includes(keyword));

    if (filter === 'post') {
      list = list.filter((item) => item.type === 'post' || item.type === 'brand');
    } else if (filter === 'guess') {
      list = list.filter((item) => item.type === 'guess');
    } else if (filter === 'topic') {
      list = list.filter((item) => item.type === 'topic');
    } else if (filter === 'video') {
      list = list.filter((item) => item.type === 'video');
    } else if (filter === 'user') {
      list = [];
    }

    return list;
  }, [filter, searchedQuery]);

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
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span><i className="fa-solid fa-user-plus" /></span> 推荐关注
            </div>
            <div className={styles.userScroll}>
              {recommendedUsers.map((user) => (
                <button className={styles.userCard} key={user.name} type="button" onClick={() => router.push(`/community-search?q=${encodeURIComponent(user.name)}`)}>
                  <img src={user.avatar} alt={user.name} />
                  <div className={styles.userName}>
                    {user.name}
                    {user.verified ? <i className="fa-solid fa-circle-check" /> : null}
                  </div>
                  <div className={styles.userDesc}>{user.desc}</div>
                  <span
                    className={followMap[user.name] ? styles.followedBtn : styles.followBtn}
                    onClick={(event) => {
                      event.stopPropagation();
                      setFollowMap((current) => ({ ...current, [user.name]: !current[user.name] }));
                      showToast(followMap[user.name] ? `已取消关注 ${user.name}` : `已关注 ${user.name}`);
                    }}
                  >
                    {followMap[user.name] ? '已关注' : '+ 关注'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.resultsView}>
          {filteredResults.length ? filteredResults.map((item) => (
            <button className={styles.resultCard} key={item.id} type="button">
              <div className={styles.resultAuthor}>
                <img src={item.avatar} alt={item.author} />
                <div>
                  <div className={styles.resultName}>
                    {item.author}
                    {item.verified ? <i className="fa-solid fa-circle-check" /> : null}
                  </div>
                  <div className={styles.resultTime}>{item.time}</div>
                </div>
                <span className={`${styles.resultTag} ${styles[item.tagClass]}`}>{item.tag}</span>
              </div>
              <div className={styles.resultBody}>
                <div className={styles.resultTitle}>{highlight(item.title, searchedQuery)}</div>
                <div className={styles.resultDesc}>{item.desc}</div>
              </div>
              <div className={`${styles.resultImages} ${styles[`img${item.images.length >= 3 ? 3 : item.images.length}` as const]}`}>
                {item.images.slice(0, 3).map((image) => (
                  <img src={image} alt={item.title} key={image} />
                ))}
              </div>
              <div className={styles.resultActions}>
                <span><i className="fa-regular fa-heart" /> {formatNum(item.likes)}</span>
                <span><i className="fa-regular fa-comment" /> {formatNum(item.comments)}</span>
                <span><i className="fa-solid fa-share-nodes" /> {formatNum(item.shares)}</span>
              </div>
            </button>
          )) : (
            <div className={styles.empty}>
              <i className="fa-solid fa-magnifying-glass" />
              <div className={styles.emptyTitle}>未找到“{searchedQuery}”相关内容</div>
              <div className={styles.emptyDesc}>换个关键词试试吧~</div>
            </div>
          )}
        </div>
      )}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
