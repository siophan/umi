'use client';

import styles from './page.module.css';

type GuessHeroProps = {
  title: string;
  totalVotes: number;
  optionCount: number;
  totalOrders: number;
  countdownLabel: string;
  countdownText: string;
  badgeText: string;
  tags: string[];
  heroImage: string;
  heroSourceText: string;
};

export function GuessHero({
  title,
  totalVotes,
  optionCount,
  totalOrders,
  countdownLabel,
  countdownText,
  badgeText,
  tags,
  heroImage,
  heroSourceText,
}: GuessHeroProps) {
  return (
    <>
      <section className={styles.topDashboard}>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>🔥</span>
            {totalVotes}
          </div>
          <div className={styles.topLabel}>参与人数</div>
        </div>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>🎯</span>
            {optionCount}
          </div>
          <div className={styles.topLabel}>竞猜选项</div>
        </div>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>📊</span>
            <span className={styles.topValueText}>{totalOrders}</span>
          </div>
          <div className={styles.topLabel}>总订单</div>
        </div>
      </section>

      <section className={styles.hero}>
        <img src={heroImage} alt={title} className={styles.heroImg} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroCountdown}>
            <i className="fa-solid fa-clock" />
            <span>{countdownLabel}</span>
            <strong>{countdownText}</strong>
          </div>
          <h1 className={styles.heroTitle}>{title}</h1>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>{badgeText}</span>
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className={styles.heroSource}>
          <i className="fa-solid fa-database" />
          开奖数据来源：<span>{heroSourceText}</span>
        </div>
      </section>
    </>
  );
}
