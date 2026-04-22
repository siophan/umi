'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RankingItem } from '@umi/shared';
import styles from './page.module.css';

type RankTab = 'winRate' | 'earnings' | 'active';
type RankTabState = {
  items: RankingItem[];
  error: string | null;
};

const tabs: Array<{
  key: RankTab;
  label: string;
}> = [
  { key: 'winRate', label: '胜率排行' },
  { key: 'earnings', label: '收益排行' },
  { key: 'active', label: '活跃排行' },
];

const fallbackAvatar = '/legacy/images/mascot/mouse-main.png';

type RankingPageClientProps = {
  initialStateMap: Record<RankTab, RankTabState>;
};

/**
 * 排行榜客户端页。
 * 服务端已预取三类榜单，这里只做本地 tab 切换，不再重复发请求。
 */
export default function RankingPageClient({ initialStateMap }: RankingPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<RankTab>('winRate');
  const current = initialStateMap[tab];
  const data = current.items;
  const podium = useMemo(() => [data[1] ?? null, data[0] ?? null, data[2] ?? null], [data]);
  const rest = data.slice(3);
  const myRank = data[3] ?? null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className={styles.title}>排行榜</span>
        <div className={styles.headerActions} />
      </header>

      <div className={styles.tabNav}>
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.tabNavItem} ${tab === item.key ? styles.active : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className={styles.podium}>
        {podium.map((item, index) => {
          const cls = index === 0 ? styles.second : index === 1 ? styles.first : styles.third;
          const medal = index === 0 ? '🥈' : index === 1 ? '🥇' : '🥉';
          return (
            <div className={`${styles.podiumItem} ${cls}`} key={`${medal}-${item?.userId || index}`}>
              <div className={styles.piMedal}>{medal}</div>
              {item ? (
                <>
                  <img src={item.avatar || fallbackAvatar} alt={item.nickname} />
                  <div className={styles.piName}>{item.nickname}</div>
                  <div className={styles.piValue}>{item.value}</div>
                </>
              ) : (
                <>
                  <div className={styles.podiumPlaceholder} />
                  <div className={styles.piName}>--</div>
                  <div className={styles.piValue}>--</div>
                </>
              )}
              <div className={styles.piBar} />
            </div>
          );
        })}
      </section>
      {current.error ? (
        <div className={styles.stateCard} role="alert">
          <div className={styles.stateTitle}>榜单加载失败</div>
          <div className={styles.stateMessage}>{current.error}</div>
          <button className={styles.retryBtn} type="button" onClick={() => router.refresh()}>
            重试
          </button>
        </div>
      ) : null}
      {!current.error && !data.length ? <div className={styles.state}>暂无榜单结果</div> : null}
      {rest.length ? (
        <div>
          {rest.map((item) => (
            <div className={styles.rankItem} key={`${item.userId}-${item.rank}`}>
              <div className={styles.riRank}>{item.rank}</div>
              <img className={styles.avatar} src={item.avatar || fallbackAvatar} alt={item.nickname} />
              <div className={styles.riInfo}>
                <div className={styles.riName}>{item.nickname}</div>
                <div className={styles.riLevel}>{`Lv.${item.level}`}</div>
              </div>
              <div className={styles.riValue}>{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.myRank}>
        <span className={styles.myRankNo}>{myRank ? `#${myRank.rank}` : '--'}</span>
        <img className={styles.avatarSm} src={myRank?.avatar || fallbackAvatar} alt={myRank?.nickname || 'ranking-user'} />
        <div className={styles.myRankInfo}>
          <div className={styles.myRankName}>{myRank ? myRank.nickname : '暂无我的排名'}</div>
        </div>
        <div className={styles.myRankValue}>{myRank?.value || '--'}</div>
      </div>

      <div className={styles.bottomGap} />
    </main>
  );
}
