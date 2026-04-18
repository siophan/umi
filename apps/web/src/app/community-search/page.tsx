'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import styles from './page.module.css';

const hotSearches = [
  { title: '德芙vs费列罗', desc: '3890人参与竞猜', tag: '热', cls: styles.hotFire },
  { title: '马年年货王', desc: '坚果礼盒 vs 糕点系列', tag: '热', cls: styles.hotFire },
  { title: '乐事新口味投票', desc: '番茄味 vs 黄瓜味', tag: '新', cls: styles.hotNew },
  { title: '零食测评排行榜', desc: '2026年度十大品牌', tag: '热', cls: styles.hotFire },
  { title: '卫龙 vs 源氏辣条', desc: '辣味巅峰对决', tag: '爆', cls: styles.hotBoom },
  { title: '旺旺大礼包2026', desc: '马年限定版开箱', tag: '新', cls: styles.hotNew },
];

const recUsers = [
  { name: '乐事官方', avatar: '/legacy/images/products/p001-lays.jpg', desc: '品牌认证', verified: true },
  { name: '三只松鼠', avatar: '/legacy/images/products/p003-squirrels.jpg', desc: '品牌认证', verified: true },
  { name: '零食达人小王', avatar: '/legacy/images/mascot/mouse-happy.png', desc: '胜率82%', verified: false },
  { name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', desc: '品牌认证', verified: true },
];

const results = [
  {
    id: 'post-1',
    author: '优米数据中心',
    avatar: '/legacy/images/mascot/mouse-main.png',
    tag: '品牌竞猜',
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
    author: '零食测评官',
    avatar: '/legacy/images/mascot/mouse-casual.png',
    tag: '零食测评',
    title: '2026年度十大零食品牌排行榜出炉！三只松鼠再登榜首',
    desc: '根据全平台销售数据与用户口碑综合评选...',
    images: ['/legacy/images/products/p003-squirrels.jpg', '/legacy/images/products/p005-liangpin.jpg'],
    likes: 8723,
    comments: 1204,
    shares: 188,
    time: '1小时前',
  },
];

const filters = [
  { key: 'all', label: '全部' },
  { key: 'post', label: '动态' },
  { key: 'guess', label: '竞猜' },
  { key: 'user', label: '猜友' },
  { key: 'topic', label: '话题' },
  { key: 'video', label: '视频' },
] as const;

export default function CommunitySearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const [searchHistory, setSearchHistory] = useState(['乐事新口味投票', '三只松鼠年货']);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = results.filter((item) => !q || `${item.title}${item.desc}${item.tag}`.toLowerCase().includes(q));
    if (filter === 'guess') list = list.filter((item) => item.tag.includes('竞猜'));
    if (filter === 'topic') list = list.filter((item) => item.tag.includes('竞猜'));
    return list;
  }, [filter, query]);

  const showResults = query.trim().length > 0;

  const onSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) return;
    setSearchHistory((current) => [value, ...current.filter((item) => item !== value)].slice(0, 10));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={`${styles.inputWrap} ${query ? styles.inputFocus : ''}`}>
          <span><i className="fa-solid fa-magnifying-glass" /></span>
          <input
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索动态、话题、猜友..."
          />
          {query ? (
            <button className={styles.clearBtn} type="button" onClick={() => setQuery('')}>
              <i className="fa-solid fa-xmark" />
            </button>
          ) : null}
        </div>
        <button className={styles.cancelBtn} type="button" onClick={() => router.back()}>
          取消
        </button>
      </header>

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

      {!showResults ? (
        <div className={styles.defaultView}>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span><i className="fa-solid fa-clock-rotate-left" /></span> 搜索历史
              <button type="button" onClick={() => setSearchHistory([])}>
                <i className="fa-solid fa-trash-can" /> 清除
              </button>
            </div>
            <div className={styles.historyList}>
              {searchHistory.map((item) => (
                <button className={styles.historyItem} key={item} type="button" onClick={() => onSearch(item)}>
                  <span><i className="fa-solid fa-clock-rotate-left" /></span>
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span><i className="fa-solid fa-fire-flame-curved" /></span> 热搜榜
            </div>
            <div className={styles.hotList}>
              {hotSearches.map((item, index) => (
                <button className={styles.hotItem} key={item.title} type="button" onClick={() => onSearch(item.title)}>
                  <div className={`${styles.hotRank} ${index < 3 ? styles[`rank${index + 1}` as const] : styles.rank4}`}>
                    {index + 1}
                  </div>
                  <div className={styles.hotText}>
                    <div className={styles.hotTitle}>{item.title}</div>
                    <div className={styles.hotDesc}>{item.desc}</div>
                  </div>
                  <span className={item.cls}>{item.tag}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <span><i className="fa-solid fa-user-plus" /></span> 推荐关注
            </div>
            <div className={styles.userScroll}>
              {recUsers.map((user) => (
                <Link
                  className={styles.userCard}
                  href={`/user/${encodeURIComponent(user.name)}`}
                  key={user.name}
                >
                  <img src={user.avatar} alt={user.name} />
                  <div className={styles.userName}>
                    {user.name}
                    {user.verified ? <i className="fa-solid fa-circle-check" /> : null}
                  </div>
                  <div className={styles.userDesc}>{user.desc}</div>
                  <button
                    className={styles.followBtn}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setFollowMap((current) => ({
                        ...current,
                        [user.name]: !current[user.name],
                      }));
                    }}
                  >
                    {followMap[user.name] ? '已关注' : '+ 关注'}
                  </button>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.resultsView}>
          {filteredResults.length ? (
            filteredResults.map((item) => (
              <Link className={styles.resultCard} href={`/post/${item.id}`} key={item.id}>
                <div className={styles.resultAuthor}>
                  <img src={item.avatar} alt={item.author} />
                  <div>
                    <div className={styles.resultName}>{item.author}</div>
                    <div className={styles.resultTime}>{item.time}</div>
                  </div>
                  <span className={`${styles.resultTag} ${item.tag.includes('竞猜') ? styles.tagGuess : styles.tagHot}`}>
                    {item.tag}
                  </span>
                </div>
                <div className={styles.resultBody}>
                  <div className={styles.resultTitle}>{item.title}</div>
                  <div className={styles.resultDesc}>{item.desc}</div>
                </div>
                <div
                  className={`${styles.resultImages} ${
                    item.images.length === 1 ? styles.img1 : item.images.length === 2 ? styles.img2 : styles.img3
                  }`}
                >
                  {item.images.map((img) => (
                    <img src={img} alt={item.title} key={img} />
                  ))}
                </div>
                <div className={styles.resultActions}>
                  <span><i className="fa-regular fa-heart" /> {item.likes}</span>
                  <span><i className="fa-regular fa-comment" /> {item.comments}</span>
                  <span><i className="fa-solid fa-share-nodes" /> {item.shares}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><i className="fa-solid fa-magnifying-glass" /></div>
              <div className={styles.emptyTitle}>未找到相关内容</div>
              <div className={styles.emptyDesc}>换个关键词试试吧~</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
