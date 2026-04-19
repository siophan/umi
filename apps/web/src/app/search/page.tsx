'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type ResultTab = 'all' | 'product' | 'guess';
type SortKey = 'default' | 'sales' | 'price-asc' | 'price-desc' | 'rating';

const defaultHistories = ['乐事', '世界杯竞猜', '奥利奥', '新品上新'];
const hotSearches = [
  { text: '乐事薯片', rank: 1, badge: '热' },
  { text: '三只松鼠坚果', rank: 2, badge: '热' },
  { text: '世界杯竞猜', rank: 3, badge: '新' },
  { text: '德芙巧克力', rank: 4, badge: '' },
  { text: '辣条', rank: 5, badge: '↑' },
  { text: '螺蛳粉', rank: 6, badge: '' },
  { text: '年货大礼包', rank: 7, badge: '新' },
  { text: '元气森林', rank: 8, badge: '' },
];

const products = [
  {
    id: 'p002',
    name: '奥利奥原味夹心饼干 67g*3',
    price: 26.8,
    originalPrice: 29.9,
    sales: 12000,
    salesText: '1.2万',
    rating: 4.9,
    tag: '热销',
    img: '/legacy/images/products/p002-oreo.jpg',
  },
  {
    id: 'p003',
    name: '三只松鼠坚果礼盒 520g',
    price: 128,
    originalPrice: 168,
    sales: 9832,
    salesText: '9832',
    rating: 4.8,
    tag: '品牌',
    img: '/legacy/images/products/p003-squirrels.jpg',
  },
  {
    id: 'p009',
    name: '可口可乐零糖组合装',
    price: 72,
    originalPrice: 88,
    sales: 8443,
    salesText: '8443',
    rating: 4.8,
    tag: '新品',
    img: '/legacy/images/products/p009-genki.jpg',
  },
  {
    id: 'p005',
    name: '良品铺子海苔脆片礼盒',
    price: 58,
    originalPrice: 69,
    sales: 7900,
    salesText: '7900',
    rating: 4.7,
    tag: '品牌',
    img: '/legacy/images/products/p005-liangpin.jpg',
  },
];

const guesses = [
  {
    id: 'g001',
    title: '2026 世界杯冠军会是阿根廷还是法国？',
    meta: '1.28万参与 · 6天后截止',
    optA: '阿根廷卫冕 56%',
    optB: '44% 法国夺冠',
    img: '/legacy/images/guess/g001.jpg',
  },
  {
    id: 'g002',
    title: '新 iPhone 会不会推出折叠屏？',
    meta: '9340参与 · 2小时后截止',
    optA: '会发布 62%',
    optB: '38% 不会发布',
    img: '/legacy/images/guess/g002.jpg',
  },
  {
    id: 'g003',
    title: '国庆自驾最火路线会是哪条？',
    meta: '5870参与 · 明晚开奖',
    optA: '川藏线 51%',
    optB: '49% 独库公路',
    img: '/legacy/images/guess/g003.jpg',
  },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [histories, setHistories] = useState<string[]>(defaultHistories);
  const [tab, setTab] = useState<ResultTab>('all');
  const [sort, setSort] = useState<SortKey>('default');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('joy-search-history');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setHistories(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const saveHistory = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setHistories((current) => {
      const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, 10);
      try {
        window.localStorage.setItem('joy-search-history', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setTab('all');
    setSort('default');
    saveHistory(trimmed);
  };

  const hasQuery = query.trim().length > 0;

  const highlight = (text: string) => {
    const keyword = query.trim();
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

  const visibleProducts = useMemo(() => {
    const filtered = !hasQuery
      ? products
      : products.filter((item) => item.name.includes(query) || item.tag.includes(query));
    const next = [...filtered];
    switch (sort) {
      case 'sales':
        next.sort((a, b) => b.sales - a.sales);
        break;
      case 'price-asc':
        next.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        next.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        next.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return next;
  }, [hasQuery, query, sort]);

  const visibleGuesses = useMemo(() => {
    if (!hasQuery) return guesses;
    return guesses.filter((item) => item.title.includes(query));
  }, [hasQuery, query]);

  const noResults = hasQuery && visibleProducts.length === 0 && visibleGuesses.length === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={`${styles.inputWrap} ${focused ? styles.focus : ''}`}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            autoFocus
            value={query}
            placeholder="搜索商品、竞猜、品牌..."
            onBlur={() => setFocused(false)}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitSearch(event.currentTarget.value);
            }}
          />
          <button
            type="button"
            className={`${styles.clear} ${query ? styles.clearShow : ''}`}
            onClick={() => setQuery('')}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <button className={styles.searchBtn} type="button" onClick={() => commitSearch(query)}>
          搜索
        </button>
      </header>

      {hasQuery ? (
        <>
          <nav className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'all' ? styles.active : ''}`} type="button" onClick={() => setTab('all')}>
              综合
            </button>
            <button className={`${styles.tab} ${tab === 'product' ? styles.active : ''}`} type="button" onClick={() => setTab('product')}>
              商品<span className={styles.tabCount}>{visibleProducts.length ? `(${visibleProducts.length})` : ''}</span>
            </button>
            <button className={`${styles.tab} ${tab === 'guess' ? styles.active : ''}`} type="button" onClick={() => setTab('guess')}>
              竞猜<span className={styles.tabCount}>{visibleGuesses.length ? `(${visibleGuesses.length})` : ''}</span>
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
                onClick={() => setSort(key as SortKey)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.results}>
            {noResults ? (
              <div className={styles.empty}>
                <i className={`fa-regular fa-face-meh ${styles.emptyIcon}`} />
                <p className={styles.emptyText}>未找到"{query}"相关内容</p>
                <div className={styles.emptyTip}>试试换个关键词搜索</div>
              </div>
            ) : null}

            {!noResults && (tab === 'all' || tab === 'guess') && visibleGuesses.length > 0 ? (
              <section className={styles.guessSection}>
                {tab === 'all' ? <div className={styles.resultTitle}>🎰 竞猜话题 ({visibleGuesses.length})</div> : null}
                <div className={styles.guessList}>
                  {(tab === 'all' ? visibleGuesses.slice(0, 4) : visibleGuesses).map((item) => (
                    <button key={item.id} type="button" className={styles.guessCard} onClick={() => router.push(`/guess/${item.id}`)}>
                      <img className={styles.guessImg} src={item.img} alt={item.title} />
                      <div className={styles.guessInfo}>
                        <div className={styles.guessTitle}>{highlight(item.title)}</div>
                        <div className={styles.guessMeta}>👥 {item.meta}</div>
                        <div className={styles.guessOptions}>
                          <span className={styles.optHot}>{item.optA}</span>
                          <span className={styles.opt}>{item.optB}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {tab === 'all' && visibleGuesses.length > 4 ? (
                  <div className={styles.viewAllWrap}>
                    <button className={styles.viewAll} type="button" onClick={() => setTab('guess')}>
                      查看全部{visibleGuesses.length}个竞猜 →
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!noResults && (tab === 'all' || tab === 'product') && visibleProducts.length > 0 ? (
              <section>
                {tab === 'all' ? <div className={styles.resultTitle}>🛍️ 商品 ({visibleProducts.length})</div> : null}
                <div className={styles.grid}>
                  {(tab === 'all' ? visibleProducts.slice(0, 6) : visibleProducts).map((item) => (
                    <button key={item.id} type="button" className={styles.productCard} onClick={() => router.push(`/product/${item.id}`)}>
                      <img src={item.img} alt={item.name} />
                      <div className={styles.productBody}>
                        <div className={styles.productName}>{highlight(item.name)}</div>
                        <div className={styles.productRow}>
                          <div className={styles.price}><em>¥</em>{item.price}</div>
                          <div className={styles.orig}>¥{item.originalPrice}</div>
                        </div>
                        <div className={styles.productMeta}>
                          <span className={styles.productSales}>{item.salesText} 人付款</span>
                          <span className={styles.productRating}><i className="fa-solid fa-star" /> {item.rating.toFixed(1)}</span>
                        </div>
                        <div className={styles.productTag}>{item.tag}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {tab === 'all' && visibleProducts.length > 6 ? (
                  <div className={styles.viewAllWrap}>
                    <button className={styles.viewAll} type="button" onClick={() => setTab('product')}>
                      查看全部{visibleProducts.length}个商品 →
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </>
      ) : (
        <div className={styles.before}>
          <div className={styles.sectionHeader}>
            <span>🕐 搜索历史</span>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                setHistories([]);
                try {
                  window.localStorage.removeItem('joy-search-history');
                } catch {
                  // ignore storage errors
                }
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

          <div className={styles.sectionHeader}>
            <span>🔥 热门搜索</span>
          </div>
          <div className={styles.hotList}>
            {hotSearches.map((item) => (
              <button key={item.rank} type="button" className={styles.hotItem} onClick={() => commitSearch(item.text)}>
                <div className={`${styles.rank} ${item.rank === 1 ? styles.rank1 : item.rank === 2 ? styles.rank2 : item.rank === 3 ? styles.rank3 : styles.rankNormal}`}>
                  {item.rank}
                </div>
                <div className={styles.hotText}>{item.text}</div>
                {item.badge ? (
                  <div className={`${styles.hotBadge} ${item.badge === '热' ? styles.badgeHot : item.badge === '新' ? styles.badgeNew : styles.badgeRise}`}>
                    {item.badge}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
