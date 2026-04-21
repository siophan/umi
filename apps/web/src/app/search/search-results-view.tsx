'use client';

import type { SearchSort, SearchTab } from '@umi/shared';

import styles from './page.module.css';
import { highlightKeyword, type SearchGuessItem, type SearchProductItem } from './search-helpers';

type SearchResultsViewProps = {
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

export function SearchResultsView({
  tab,
  sort,
  query,
  inputValue,
  searching,
  noResults,
  showGuessEmpty,
  showProductEmpty,
  guessTotal,
  productTotal,
  guesses,
  products,
  priceAsc,
  onTabChange,
  onSortChange,
  onTogglePriceSort,
  onOpenGuess,
  onOpenProduct,
}: SearchResultsViewProps) {
  const keyword = query.trim() || inputValue.trim();

  return (
    <>
      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'all' ? styles.active : ''}`} type="button" onClick={() => onTabChange('all')}>
          综合
        </button>
        <button
          className={`${styles.tab} ${tab === 'product' ? styles.active : ''}`}
          type="button"
          onClick={() => onTabChange('product')}
        >
          商品
          <span className={styles.tabCount}>{productTotal ? `(${productTotal})` : ''}</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'guess' ? styles.active : ''}`}
          type="button"
          onClick={() => onTabChange('guess')}
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
              if (key === 'price-asc' || key === 'price-desc') {
                onTogglePriceSort();
                return;
              }
              onSortChange(key as SearchSort);
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
                <button key={item.id} type="button" className={styles.guessCard} onClick={() => onOpenGuess(item.id)}>
                  <img className={styles.guessImg} src={item.img} alt={item.title} />
                  <div className={styles.guessInfo}>
                    <div className={styles.guessTitle}>{highlightKeyword(item.title, keyword)}</div>
                    <div className={styles.guessMeta}>👥 {item.meta}</div>
                    <div className={styles.guessOptions}>
                      {item.options.map((option, index) => (
                        <span key={`${item.id}-${option}`} className={index === 0 ? styles.optHot : styles.opt}>
                          {highlightKeyword(option, keyword)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {tab === 'all' && guessTotal > 4 ? (
              <div className={styles.viewAllWrap}>
                <button className={styles.viewAll} type="button" onClick={() => onTabChange('guess')}>
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
                <button key={item.id} type="button" className={styles.productCard} onClick={() => onOpenProduct(item.id)}>
                  <img src={item.img} alt={item.name} />
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{highlightKeyword(item.name, keyword)}</div>
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
                <button className={styles.viewAll} type="button" onClick={() => onTabChange('product')}>
                  查看全部{productTotal}件商品 →
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
