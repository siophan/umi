'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { quickActions, type FriendsTab, type HotGuessItem } from './friends-helpers';
import styles from './page.module.css';

type Props = {
  router: AppRouterInstance;
  tab: FriendsTab;
  onChangeTab: (tab: FriendsTab) => void;
  socialCountsMissing: boolean;
  guessCountsMissing: boolean;
  friendsCount: number;
  followingCount: number;
  fansCount: number;
  pkCount: number | null;
  newFansCount: number;
  pendingRequestsCount: number;
  hotGuesses: HotGuessItem[];
  guessError: string | null;
  query: string;
  onChangeQuery: (value: string) => void;
  onReloadHot: () => void;
  onShowToast: (message: string) => void;
};

export function FriendsOverviewSections({
  router,
  tab,
  onChangeTab,
  socialCountsMissing,
  guessCountsMissing,
  friendsCount,
  followingCount,
  fansCount,
  pkCount,
  newFansCount,
  pendingRequestsCount,
  hotGuesses,
  guessError,
  query,
  onChangeQuery,
  onReloadHot,
  onShowToast,
}: Props) {
  return (
    <>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.headerTitle}>好友</div>
        <button className={styles.actionBtn} type="button" onClick={() => onShowToast('添加好友')}>
          <i className="fa-solid fa-user-plus" />
        </button>
      </header>

      <section className={styles.heroCard}>
        <div className={styles.heroStats}>
          <button className={styles.heroStat} type="button" onClick={() => onChangeTab('friends')}>
            <div className={styles.heroNum}>{socialCountsMissing ? '--' : friendsCount}</div>
            <div className={styles.heroLabel}>好友</div>
          </button>
          <button className={styles.heroStat} type="button" onClick={() => onChangeTab('following')}>
            <div className={styles.heroNum}>{socialCountsMissing ? '--' : followingCount}</div>
            <div className={styles.heroLabel}>关注</div>
          </button>
          <button className={styles.heroStat} type="button" onClick={() => onChangeTab('fans')}>
            <div className={styles.heroNum}>{socialCountsMissing ? '--' : fansCount}</div>
            <div className={styles.heroLabel}>粉丝</div>
          </button>
          <div className={styles.heroStat}>
            <div className={styles.heroNum}>{guessCountsMissing ? '--' : pkCount ?? 0}</div>
            <div className={styles.heroLabel}>PK场</div>
          </div>
        </div>
      </section>

      <section className={styles.quickBar}>
        {quickActions.map((item) => (
          <button
            className={styles.quickItem}
            key={item.label}
            type="button"
            onClick={() => {
              if (item.label === '邀请好友') {
                router.push('/invite');
                return;
              }
              if (item.label === '排行榜') {
                router.push('/ranking');
                return;
              }
              if (item.label === 'PK记录') {
                router.push('/guess-history');
                return;
              }
              if (item.label === '社区') {
                router.push('/community');
              }
            }}
          >
            <div className={`${styles.quickIcon} ${styles[item.tone]}`}>{item.icon}</div>
            <div className={styles.quickLabel}>{item.label}</div>
          </button>
        ))}
      </section>

      <section className={styles.hotStrip}>
        <div className={styles.hotTitle}>
          <i className="fa-solid fa-fire" />
          <span>好友都在猜</span>
          <button type="button" onClick={() => router.push('/guess-history')}>查看更多</button>
        </div>
        <div className={styles.hotScroll}>
          {!guessError ? hotGuesses.map((item) => (
            <button className={styles.hotChip} key={item.id} type="button" onClick={() => router.push(`/guess/${encodeURIComponent(item.id)}`)}>
              <div className={styles.hotChipIcon}>{item.icon}</div>
              <div className={styles.hotChipTitle}>{item.title}</div>
              <div className={styles.hotChipMeta}>
                <span className={styles.hotChipHot}>🔥 {item.hot}</span>
                <span>人参与</span>
              </div>
            </button>
          )) : null}
          {guessError ? (
            <div className={styles.hotError}>
              <div className={styles.hotErrorTitle}>竞猜链加载失败</div>
              <div className={styles.hotErrorDesc}>{guessError}</div>
              <button className={styles.hotErrorBtn} type="button" onClick={onReloadHot}>
                重试
              </button>
            </div>
          ) : null}
          {!guessError && !hotGuesses.length ? <div className={styles.hotEmpty}>暂无热门竞猜</div> : null}
        </div>
      </section>

      <nav className={styles.tabs}>
        {[
          { key: 'friends', label: '好友' },
          { key: 'following', label: '关注' },
          { key: 'fans', label: '粉丝', badge: newFansCount },
          { key: 'requests', label: '申请', badge: pendingRequestsCount },
        ].map((item) => (
          <button
            className={tab === item.key ? styles.tabActive : styles.tab}
            key={item.key}
            type="button"
            onClick={() => onChangeTab(item.key as FriendsTab)}
          >
            {item.label}
            {item.badge ? <span className={styles.tabBadge}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <section className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <i className="fa-solid fa-magnifying-glass" />
          <input value={query} onChange={(event) => onChangeQuery(event.target.value)} placeholder="搜索用户..." />
        </div>
      </section>
    </>
  );
}
