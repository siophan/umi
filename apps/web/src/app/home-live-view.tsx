'use client';

import type { LiveListItem } from '@umi/shared';

import {
  fallbackAvatar,
  fallbackLiveImage,
  liveFilters,
  type HomeLiveFilter,
  type HomeSectionErrors,
} from './home-page-types';
import { formatCompactNumber, getLiveStatusText } from './home-page-helpers';
import styles from './page.module.css';

type Props = {
  liveFilter: HomeLiveFilter;
  onSelectLiveFilter: (filter: HomeLiveFilter) => void;
  filteredLiveFeedItems: LiveListItem[];
  sectionErrors: HomeSectionErrors;
  onOpenLive: (id: string) => void;
};

export function HomeLiveView({
  liveFilter,
  onSelectLiveFilter,
  filteredLiveFeedItems,
  sectionErrors,
  onOpenLive,
}: Props) {
  return (
    <>
      <div className={styles.liveCatBar}>
        {liveFilters.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.liveCatChip} ${liveFilter === item.key ? styles.liveCatActive : ''}`}
            onClick={() => onSelectLiveFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.liveFeed}>
        {filteredLiveFeedItems.length ? (
          filteredLiveFeedItems.map((item) => {
            const currentGuess = item.currentGuess;
            const leftPct = currentGuess?.pcts[0] ?? 50;
            const rightPct = currentGuess?.pcts[1] ?? Math.max(0, 100 - leftPct);
            const statusText = getLiveStatusText(item);
            return (
              <article className={styles.liveFeedCard} key={item.id}>
                <div className={styles.liveFeedHost}>
                  <img className={styles.liveFeedAvatar} src={item.hostAvatar || fallbackAvatar} alt={item.hostName} />
                  <div>
                    <div className={styles.liveFeedHostName}>{item.hostName}</div>
                    <div className={styles.liveFeedHostStat}>
                      {item.guessCount}场竞猜 · {formatCompactNumber(item.viewers)}观看
                    </div>
                  </div>
                  <span
                    className={`${styles.liveFeedStatus} ${statusText === '🔴 直播中' ? styles.liveFeedStatusLive : statusText === '⏰ 即将开始' ? styles.liveFeedStatusUpcoming : styles.liveFeedStatusReplay}`}
                  >
                    {statusText}
                  </span>
                </div>
                <button className={styles.liveFeedCover} type="button" onClick={() => onOpenLive(item.id)}>
                  <img src={item.imageUrl || fallbackLiveImage} alt={item.title} />
                  <div className={styles.liveFeedViewers}>👁 {formatCompactNumber(item.viewers)}</div>
                  <div className={styles.liveFeedTitleBar}>
                    <div className={styles.liveFeedTitle}>{currentGuess?.title || item.title}</div>
                  </div>
                </button>
                <div className={styles.livePk}>
                  <div className={styles.livePkHead}>
                    <span className={styles.livePkIcon}>⚡</span>
                    <span className={styles.livePkLabel}>直播竞猜</span>
                    <span className={styles.livePkHot}>
                      <i className="fa-solid fa-fire" /> {item.participants}人参与
                    </span>
                  </div>
                  <div className={styles.livePkBar}>
                    <div className={`${styles.livePkOpt} ${styles.livePkOptA}`}>{currentGuess?.options[0] || '直播中'}</div>
                    <div className={styles.livePkVs}>VS</div>
                    <div className={`${styles.livePkOpt} ${styles.livePkOptB}`}>{currentGuess?.options[1] || '围观中'}</div>
                  </div>
                  <div className={styles.livePkProgress}>
                    <div className={styles.livePkFillA} style={{ width: `${leftPct}%` }} />
                    <div className={styles.livePkFillB} style={{ width: `${rightPct}%` }} />
                  </div>
                  <div className={styles.livePkPct}>
                    <span className={styles.livePctA}>{leftPct}%</span>
                    <span className={styles.livePkQuestion}>{currentGuess?.title || item.title}</span>
                    <span className={styles.livePctB}>{rightPct}%</span>
                  </div>
                  <div className={styles.livePkCta}>
                    <button className={styles.livePkBtn} type="button" onClick={() => onOpenLive(item.id)}>
                      参与竞猜
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : sectionErrors.lives ? (
          <div className={styles.sectionNotice}>直播列表加载失败，请稍后刷新重试。</div>
        ) : (
          <div className={styles.emptyState}>暂无直播</div>
        )}
      </div>
    </>
  );
}
