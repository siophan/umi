'use client';

import { useMemo, useState } from 'react';
import { useRouter } from "next/navigation";
import styles from './page.module.css';

type RankTab = 'winRate' | 'earnings' | 'active';

const rankData = {
  winRate: [
    {
      rank: 1,
      name: '预言大师',
      rate: '82.3%',
      level: 'Lv.98',
      avatar: '/legacy/images/mascot/mouse-main.png',
    },
    {
      rank: 2,
      name: '零食侦探',
      rate: '79.6%',
      level: 'Lv.92',
      avatar: '/legacy/images/mascot/mouse-happy.png',
    },
    {
      rank: 3,
      name: '热点猎手',
      rate: '76.1%',
      level: 'Lv.88',
      avatar: '/legacy/images/mascot/mouse-casual.png',
    },
    {
      rank: 4,
      name: '零食猎人',
      rate: '68.5%',
      level: 'Lv.74',
      avatar: '/legacy/images/mascot/mouse-main.png',
    },
    {
      rank: 5,
      name: '阿根廷卫冕',
      rate: '66.2%',
      level: 'Lv.70',
      avatar: '/legacy/images/mascot/mouse-happy.png',
    },
  ],
  earnings: [
    {
      rank: 1,
      name: '赚币王',
      rate: '¥12,680',
      level: 'Lv.99',
      avatar: '/legacy/images/mascot/mouse-main.png',
    },
    {
      rank: 2,
      name: '稳健派',
      rate: '¥10,230',
      level: 'Lv.94',
      avatar: '/legacy/images/mascot/mouse-happy.png',
    },
    {
      rank: 3,
      name: '套利专家',
      rate: '¥8,860',
      level: 'Lv.90',
      avatar: '/legacy/images/mascot/mouse-casual.png',
    },
    {
      rank: 4,
      name: '零食猎人',
      rate: '¥6,400',
      level: 'Lv.74',
      avatar: '/legacy/images/mascot/mouse-main.png',
    },
  ],
  active: [
    {
      rank: 1,
      name: '冲浪玩家',
      rate: '88 次',
      level: 'Lv.96',
      avatar: '/legacy/images/mascot/mouse-main.png',
    },
    {
      rank: 2,
      name: '夜猫子',
      rate: '76 次',
      level: 'Lv.90',
      avatar: '/legacy/images/mascot/mouse-happy.png',
    },
    {
      rank: 3,
      name: '连胜机器',
      rate: '64 次',
      level: 'Lv.87',
      avatar: '/legacy/images/mascot/mouse-casual.png',
    },
    {
      rank: 4,
      name: '零食猎人',
      rate: '52 次',
      level: 'Lv.74',
      avatar: '/legacy/images/mascot/mouse-main.png',
    },
  ],
} satisfies Record<
  RankTab,
  { rank: number; name: string; rate: string; level: string; avatar: string }[]
>;

export default function RankingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<RankTab>('winRate');

  const data = useMemo(() => rankData[tab], [tab]);
  const podium = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => router.back()}
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>排行榜</div>
        <div className={styles.headerAction} />
      </header>

      <nav className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'winRate' ? styles.active : ''}`}
          onClick={() => setTab('winRate')}
        >
          胜率排行
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'earnings' ? styles.active : ''}`}
          onClick={() => setTab('earnings')}
        >
          收益排行
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'active' ? styles.active : ''}`}
          onClick={() => setTab('active')}
        >
          活跃排行
        </button>
      </nav>

      <section className={styles.podium}>
        <div className={`${styles.podiumItem} ${styles.second}`}>
          <div className={styles.medal}>🥈</div>
          {podium[1] ? (
            <img alt={podium[1].name} src={podium[1].avatar} />
          ) : null}
          <div className={styles.podiumName}>{podium[1]?.name}</div>
          <div className={styles.podiumValue}>{podium[1]?.rate}</div>
          <div className={styles.bar} />
        </div>
        <div className={`${styles.podiumItem} ${styles.first}`}>
          <div className={styles.medal}>🥇</div>
          {podium[0] ? (
            <img alt={podium[0].name} src={podium[0].avatar} />
          ) : null}
          <div className={styles.podiumName}>{podium[0]?.name}</div>
          <div className={styles.podiumValue}>{podium[0]?.rate}</div>
          <div className={styles.bar} />
        </div>
        <div className={`${styles.podiumItem} ${styles.third}`}>
          <div className={styles.medal}>🥉</div>
          {podium[2] ? (
            <img alt={podium[2].name} src={podium[2].avatar} />
          ) : null}
          <div className={styles.podiumName}>{podium[2]?.name}</div>
          <div className={styles.podiumValue}>{podium[2]?.rate}</div>
          <div className={styles.bar} />
        </div>
      </section>

      <main className={styles.list}>
        {rest.map((item) => (
          <div className={styles.rankItem} key={item.rank}>
            <div className={styles.rank}>{item.rank}</div>
            <img className={styles.avatar} alt={item.name} src={item.avatar} />
            <div className={styles.info}>
              <div className={styles.name}>{item.name}</div>
              <div className={styles.level}>{item.level}</div>
            </div>
            <div className={styles.value}>{item.rate}</div>
          </div>
        ))}
      </main>

      <footer className={styles.myRank}>
        <span className={styles.myNo}>#4</span>
        <img
          className={styles.myAvatar}
          alt="me"
          src="/legacy/images/mascot/mouse-main.png"
        />
        <div className={styles.myInfo}>
          <div className={styles.myName}>零食猎人 (我)</div>
        </div>
        <div className={styles.myValue}>68.5%</div>
      </footer>
    </div>
  );
}
