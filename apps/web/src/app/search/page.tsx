'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

type ResultTab = 'all' | 'product' | 'guess';

const histories = ['乐事', '世界杯竞猜', '奥利奥', '新品上新'];
const hotSearches = [
  { text: '世界杯冠军', rank: 1, badge: '热' },
  { text: 'iPhone 折叠屏', rank: 2, badge: '新' },
  { text: '泡泡玛特盲盒', rank: 3, badge: '升' },
  { text: '零食礼包', rank: 4, badge: '' },
];

const products = [
  {
    name: '奥利奥原味夹心饼干 67g*3',
    price: 26.8,
    orig: 29.9,
    sales: '1.2万',
    rating: '4.9',
    tag: '热销',
    img: '/legacy/images/product/p001.jpg',
  },
  {
    name: '三只松鼠坚果礼盒 520g',
    price: 128,
    orig: 168,
    sales: '9,832',
    rating: '4.8',
    tag: '品牌',
    img: '/legacy/images/product/p002.jpg',
  },
  {
    name: '可口可乐零糖组合装',
    price: 72,
    orig: 88,
    sales: '8,443',
    rating: '4.8',
    tag: '新品',
    img: '/legacy/images/product/p003.jpg',
  },
  {
    name: '良品铺子海苔脆片礼盒',
    price: 58,
    orig: 69,
    sales: '7,900',
    rating: '4.7',
    tag: '品牌',
    img: '/legacy/images/product/p004.jpg',
  },
];

const guesses = [
  {
    title: '2026 世界杯冠军会是阿根廷还是法国？',
    meta: '👥 1.28万 · 6天后截止',
    optA: '阿根廷卫冕 56%',
    optB: '44% 法国夺冠',
    img: '/legacy/images/guess/g001.jpg',
  },
  {
    title: '新 iPhone 会不会推出折叠屏？',
    meta: '👥 9,340 · 2小时后截止',
    optA: '会发布 62%',
    optB: '38% 不会发布',
    img: '/legacy/images/guess/g002.jpg',
  },
  {
    title: '国庆自驾最火路线会是哪条？',
    meta: '👥 5,870 · 明晚开奖',
    optA: '川藏线 51%',
    optB: '49% 独库公路',
    img: '/legacy/images/guess/g003.jpg',
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ResultTab>('all');
  const [filter, setFilter] = useState<
    'default' | 'sales' | 'price' | 'rating'
  >('default');

  const hasQuery = query.trim().length > 0;

  const resultCounts = useMemo(
    () => ({
      product: products.length,
      guess: guesses.length,
    }),
    [],
  );

  const visibleProducts = useMemo(() => {
    if (!hasQuery) return products;
    return products.filter(
      (item) => item.name.includes(query) || item.tag.includes(query),
    );
  }, [hasQuery, query]);

  const visibleGuesses = useMemo(() => {
    if (!hasQuery) return guesses;
    return guesses.filter((item) => item.title.includes(query));
  }, [hasQuery, query]);
  const noResults = visibleProducts.length === 0 && visibleGuesses.length === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => window.history.back()}
        >
          ‹
        </button>
        <div className={`${styles.inputWrap} ${query ? styles.focus : ''}`}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) =>
              event.key === 'Enter' && setQuery(event.currentTarget.value)
            }
            placeholder="搜索商品、竞猜、品牌..."
          />
          {query ? (
            <button
              type="button"
              className={styles.clear}
              onClick={() => setQuery('')}
            >
              ×
            </button>
          ) : null}
        </div>
        <button
          className={styles.searchBtn}
          type="button"
          onClick={() => setQuery(query)}
        >
          搜索
        </button>
      </header>

      {hasQuery ? (
        <>
          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'all' ? styles.active : ''}`}
              type="button"
              onClick={() => setTab('all')}
            >
              综合
            </button>
            <button
              className={`${styles.tab} ${tab === 'product' ? styles.active : ''}`}
              type="button"
              onClick={() => setTab('product')}
            >
              商品<span>{resultCounts.product}</span>
            </button>
            <button
              className={`${styles.tab} ${tab === 'guess' ? styles.active : ''}`}
              type="button"
              onClick={() => setTab('guess')}
            >
              竞猜<span>{resultCounts.guess}</span>
            </button>
          </nav>

          <div className={styles.filterBar}>
            {[
              ['default', '综合'],
              ['sales', '销量'],
              ['price', '价格'],
              ['rating', '好评'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.filter} ${filter === key ? styles.filterActive : ''}`}
                onClick={() => setFilter(key as typeof filter)}
              >
                {label}
              </button>
            ))}
          </div>

          <main className={styles.results}>
            {(tab === 'all' || tab === 'product') && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>商品结果</div>
                <div className={styles.grid}>
                  {visibleProducts.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      className={styles.productCard}
                    >
                      <div className={styles.productImg}>
                        <img alt={item.name} src={item.img} />
                        <span className={styles.badge}>{item.tag}</span>
                      </div>
                      <div className={styles.productBody}>
                        <div className={styles.productName}>{item.name}</div>
                        <div className={styles.productRow}>
                          <span className={styles.price}>
                            ¥{item.price.toFixed(2)}
                          </span>
                          <span className={styles.orig}>
                            ¥{item.orig.toFixed(2)}
                          </span>
                        </div>
                        <div className={styles.productMeta}>
                          <span>{item.sales} 人付款</span>
                          <span>⭐ {item.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'guess') && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>竞猜结果</div>
                <div className={styles.guessList}>
                  {visibleGuesses.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      className={styles.guessCard}
                    >
                      <img
                        alt={item.title}
                        className={styles.guessImg}
                        src={item.img}
                      />
                      <div className={styles.guessInfo}>
                        <div className={styles.guessTitle}>{item.title}</div>
                        <div className={styles.guessMeta}>{item.meta}</div>
                        <div className={styles.guessOptions}>
                          <span className={styles.optHot}>{item.optA}</span>
                          <span className={styles.opt}>{item.optB}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {noResults ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>⌕</div>
                <div className={styles.emptyText}>没有找到相关结果</div>
                <div className={styles.emptyTip}>
                  试试搜索商品、竞猜或品牌名称
                </div>
              </div>
            ) : null}
          </main>
        </>
      ) : (
        <div className={styles.before}>
          <div className={styles.sectionHeader}>
            <span>🕐 搜索历史</span>
            <button type="button" className={styles.iconBtn}>
              ×
            </button>
          </div>
          <div className={styles.tags}>
            {histories.map((item) => (
              <button
                key={item}
                type="button"
                className={styles.tag}
                onClick={() => setQuery(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.sectionHeader}>
            <span>🔥 热门搜索</span>
          </div>
          <div className={styles.hotList}>
            {hotSearches.map((item) => (
              <button
                key={item.rank}
                type="button"
                className={styles.hotItem}
                onClick={() => setQuery(item.text)}
              >
                <div
                  className={`${styles.rank} ${styles[`rank${item.rank}` as 'rank1' | 'rank2' | 'rank3' | 'rank4'] || styles.rankNormal}`}
                >
                  {item.rank}
                </div>
                <div className={styles.hotText}>{item.text}</div>
                {item.badge ? (
                  <div className={styles.hotBadge}>{item.badge}</div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
