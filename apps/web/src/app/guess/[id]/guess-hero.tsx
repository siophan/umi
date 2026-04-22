'use client';

import styles from './page.module.css';

type GuessHeroProps = {
  title: string;
  totalVotes: number;
  optionCount: number;
  statusText: string;
  countdownLabel: string;
  countdownText: string;
  category: string;
  brand?: string;
  heroImage: string;
};

export function GuessHero({
  title,
  totalVotes,
  optionCount,
  statusText,
  countdownLabel,
  countdownText,
  category,
  brand,
  heroImage,
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
            <span className={styles.topValueText}>{statusText}</span>
          </div>
          <div className={styles.topLabel}>当前状态</div>
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
            <span className={styles.badge}>{statusText}</span>
            <span>{brand}</span>
            <span>{category}</span>
            <span>{totalVotes} 人参与</span>
          </div>
        </div>
        <div className={styles.heroSource}>
          <i className="fa-solid fa-database" />
          开奖数据来源：<span>平台官方数据</span>
        </div>
      </section>
    </>
  );
}

