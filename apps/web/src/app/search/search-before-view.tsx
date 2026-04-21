'use client';

import type { SearchHotKeywordItem } from '@umi/shared';

import styles from './page.module.css';

type SearchBeforeViewProps = {
  ready: boolean;
  histories: string[];
  hotSearches: SearchHotKeywordItem[];
  onCommitSearch: (value: string) => void;
  onClearHistory: () => void;
};

export function SearchBeforeView({
  ready,
  histories,
  hotSearches,
  onCommitSearch,
  onClearHistory,
}: SearchBeforeViewProps) {
  return (
    <div className={styles.before}>
      {histories.length > 0 ? (
        <div className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <span>🕐 搜索历史</span>
            <button type="button" className={styles.iconBtn} onClick={onClearHistory}>
              <i className="fa-solid fa-trash-can" />
            </button>
          </div>
          <div className={styles.tags}>
            {histories.map((item) => (
              <button key={item} type="button" className={styles.tag} onClick={() => onCommitSearch(item)}>
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
            <button
              key={`${item.rank}-${item.keyword}`}
              type="button"
              className={styles.hotItem}
              onClick={() => onCommitSearch(item.keyword)}
            >
              <div
                className={`${styles.rank} ${
                  item.rank === 1
                    ? styles.rank1
                    : item.rank === 2
                      ? styles.rank2
                      : item.rank === 3
                        ? styles.rank3
                        : styles.rankNormal
                }`}
              >
                {item.rank}
              </div>
              <div className={styles.hotText}>{item.keyword}</div>
              {item.badge ? (
                <div
                  className={`${styles.hotBadge} ${
                    item.badge === '热'
                      ? styles.badgeHot
                      : item.badge === '新'
                        ? styles.badgeNew
                        : styles.badgeRise
                  }`}
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
  );
}
