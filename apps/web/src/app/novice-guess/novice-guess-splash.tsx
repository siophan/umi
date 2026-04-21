'use client';

import styles from './page.module.css';

type NoviceGuessSplashProps = {
  liveCount: number;
  tickerLoop: Array<{ name: string; avatar: string; prize: string }>;
  onStart: () => void;
  onEnterHome: () => void;
};

export function NoviceGuessSplash({ liveCount, tickerLoop, onStart, onEnterHome }: NoviceGuessSplashProps) {
  return (
    <section className={styles.phaseSplash}>
      <div className={styles.splashParticles}>
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className={styles.particle}
            style={{
              left: `${(index * 17) % 100}%`,
              animationDelay: `${(index % 6) * 0.7}s`,
              animationDuration: `${11 + (index % 4) * 2}s`,
            }}
          />
        ))}
      </div>

      <span className={styles.giftFloat} style={{ top: '18%', left: '8%', animationDelay: '0s' }}>🎁</span>
      <span className={styles.giftFloat} style={{ top: '24%', right: '12%', animationDelay: '-2s' }}>✨</span>
      <span className={styles.giftFloat} style={{ bottom: '28%', left: '15%', animationDelay: '-4s' }}>🎯</span>
      <span className={styles.giftFloat} style={{ bottom: '22%', right: '8%', animationDelay: '-6s' }}>🏆</span>

      <div className={styles.liveTicker}>
        <div className={styles.tickerTrack}>
          {tickerLoop.map((item, index) => (
            <div className={styles.tickerItem} key={`${item.name}-${index}`}>
              <img className={styles.tickerAvatar} src={item.avatar} alt={item.name} />
              <span>{item.name} 正在体验</span>
              <span className={styles.prize}>{item.prize}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.splashCenter}>
        <div className={styles.splashBrand}>⚡ 新用户专属福利</div>
        <div className={styles.splashLogo}>Umi</div>
        <div className={styles.splashSlogan}>先体验一轮猜题流程</div>
        <div className={styles.splashSub}>静态演示页 · 用来熟悉玩法</div>
        <div className={styles.splashLive}>
          <span className={styles.dot} />
          <span className={styles.count}>{liveCount.toLocaleString()}</span>
          <span>人正在猜</span>
        </div>
        <button className={styles.splashCta} type="button" onClick={onStart}>
          <span className={styles.ctaShine} />
          <span className={styles.ctaIcon}>🎁</span>
          开始体验
          <span className={styles.ctaSub}>演示模式 · 不发放真实奖励</span>
        </button>
        <button className={styles.splashSkip} type="button" onClick={onEnterHome}>
          已有账号，直接进入
          <span className={styles.skipArrow}>→</span>
        </button>
      </div>
    </section>
  );
}
