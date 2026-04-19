'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const filters = ['全部', '🔴 正在直播', '⏰ 即将开始', '🎬 精彩回放', '零食开箱', '品牌PK'];

const featured = {
  title: '乐事春季限定开箱夜',
  host: '乐事官方旗舰店',
  viewers: '2.8万',
  guesses: 3,
  status: '直播中',
  img: '/legacy/images/guess/g203.jpg',
  avatar: '/legacy/images/products/p001-lays.jpg',
};

const lives = [
  { id: 'live-dove', title: '德芙新品试吃会', meta: '🔴 1.2万人 · 2场竞猜', img: '/legacy/images/products/p007-dove.jpg' },
  { id: 'live-squirrel', title: '三只松鼠年货局', meta: '⏰ 8千人预约 · 1场竞猜', img: '/legacy/images/products/p003-squirrels.jpg' },
  { id: 'live-want', title: '旺旺零食回放', meta: '🎬 6.4千人观看 · 精彩回放', img: '/legacy/images/products/p016-wangzai.jpg' },
  { id: 'live-liangpin', title: '良品铺子直播专场', meta: '🔴 9.3千人 · 4场竞猜', img: '/legacy/images/products/p005-liangpin.jpg' },
];

export default function LivesPage() {
  const router = useRouter();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className={styles.title}>竞猜直播</span>
        <button className={styles.action} type="button">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </header>

      <div className={styles.tags}>
        {filters.map((item, index) => (
          <button className={index === 0 ? styles.tagActive : styles.tag} key={item} type="button">
            {item}
          </button>
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>🔥 热门直播</div>
        <button className={styles.featured} type="button" onClick={() => router.push('/live/live-lays')}>
          <img className={styles.featuredImg} src={featured.img} alt={featured.title} />
          <div className={styles.overlay}>
            <div className={styles.overlayTop}>
              <span className={`${styles.liveTag} ${styles.liveTagLive}`}>● {featured.status}</span>
              <span className={styles.viewerTag}>👁 {featured.viewers}</span>
            </div>
            <div className={styles.overlayBottom}>
              <div className={styles.featuredTitle}>{featured.title}</div>
              <div className={styles.hostRow}>
                <img src={featured.avatar} alt={featured.host} />
                <span>{featured.host}</span>
                <em>🎯 {featured.guesses}场竞猜</em>
              </div>
            </div>
          </div>
        </button>
      </section>

      <div className={styles.divider} />

      <section className={styles.section}>
        <div className={styles.sectionTitle}>更多直播</div>
        <div className={styles.grid}>
          {lives.map((item) => (
            <button className={styles.card} key={item.id} type="button" onClick={() => router.push(`/live/${item.id}`)}>
              <img src={item.img} alt={item.title} />
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardMeta}>{item.meta}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
