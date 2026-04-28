'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LiveListItem } from '@umi/shared';

import styles from './page.module.css';

type LiveFilter = 'all' | 'live' | 'upcoming' | 'snack' | 'pk';

const filters: Array<{ key: LiveFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'live', label: '🔴 正在直播' },
  { key: 'upcoming', label: '⏰ 即将开始' },
  { key: 'snack', label: '零食开箱' },
  { key: 'pk', label: '品牌PK' },
];

const fallbackCover = '/legacy/images/products/p001-lays.jpg';
const fallbackAvatar = '/legacy/images/mascot/mouse-main.png';

function formatNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

/**
 * 直播页的部分筛选仍是前端轻规则，例如“零食开箱/品牌PK”，后续如果有运营分类再替换掉这里。
 */
function matchesFilter(item: LiveListItem, filter: LiveFilter) {
  const title = `${item.title} ${item.currentGuess?.title || ''}`.toLowerCase();

  if (filter === 'all') {
    return true;
  }
  if (filter === 'live') {
    return item.status === 'live';
  }
  if (filter === 'upcoming') {
    return item.status === 'upcoming';
  }
  if (filter === 'snack') {
    return title.includes('零食') || title.includes('开箱') || title.includes('试吃');
  }
  return title.includes('pk') || title.includes('品牌') || title.includes('对决');
}

function getFeaturedLabel(status: LiveListItem['status']) {
  if (status === 'upcoming') {
    return ['即将开始', 'upcoming'] as const;
  }
  return ['直播中', 'live'] as const;
}

type LivesPageClientProps = {
  initialItems: LiveListItem[];
  initialError: string | null;
};

/**
 * 直播列表客户端页。
 * 当前只消费服务端预取结果，本地筛选不再额外请求接口。
 */
export default function LivesPageClient({ initialItems, initialError }: LivesPageClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<LiveFilter>('all');
  const items = initialItems;
  const filteredItems = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [filter, items]);
  const featured = filteredItems[0] ?? null;
  const moreLives = filteredItems.slice(1);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className={styles.title}>竞猜直播</span>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} type="button" onClick={() => router.push('/search')}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>
      </header>

      <div className={styles.tagScroll}>
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.tag} ${filter === item.key ? styles.active : ''}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>🔥 热门直播</div>
      </div>

      {initialError ? (
        <div className={styles.errorCard} role="alert">
          <div className={styles.errorTitle}>直播列表加载失败</div>
          <div className={styles.errorMessage}>{initialError}</div>
          <button className={styles.retryBtn} type="button" onClick={() => router.refresh()}>
            重试
          </button>
        </div>
      ) : null}

      {initialError ? null : featured ? (
        <div className={styles.featuredWrap}>
          <button className={styles.liveCard} type="button" onClick={() => router.push(`/live/${featured.id}`)}>
            <img src={featured.imageUrl || fallbackCover} alt={featured.title} />
            <div className={styles.liveOverlay}>
              <div className={styles.liveTop}>
                {(() => {
                  const [label, cls] = getFeaturedLabel(featured.status);
                  return <span className={`${styles.liveTag} ${styles[`liveTag${cls[0].toUpperCase()}${cls.slice(1)}`]}`}>{cls === 'live' ? '● ' : ''}{label}</span>;
                })()}
                <span className={styles.liveViewers}>🔥 {formatNum(featured.participants)}</span>
              </div>
              <div className={styles.liveBottom}>
                <div className={styles.liveTitle}>{featured.currentGuess?.title || featured.title}</div>
                <div className={styles.liveHost}>
                  <img src={featured.hostAvatar || fallbackAvatar} alt={featured.hostName} />
                  <span>{featured.hostName}</span>
                  <span className={styles.liveHostMeta}>🎯 {featured.guessCount}场竞猜</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className={styles.state}>暂无直播</div>
      )}

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>更多直播</div>
      </div>

      {initialError ? null : !moreLives.length ? <div className={styles.state}>暂无更多直播</div> : null}

      {initialError ? null : (
        <div className={styles.liveGrid}>
          {moreLives.map((item) => (
            <button className={styles.liveMini} key={item.id} type="button" onClick={() => router.push(`/live/${item.id}`)}>
              <img src={item.imageUrl || fallbackCover} alt={item.title} />
              <div className={styles.liveMiniInfo}>
                <div className={styles.liveMiniTitle}>{item.currentGuess?.title || item.title}</div>
                <div className={styles.liveMiniViewers}>
                  {item.status === 'live' ? '🔴' : '⏰'} {formatNum(item.participants)}人参与 · {item.guessCount}场竞猜
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
