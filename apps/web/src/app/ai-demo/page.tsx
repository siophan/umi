'use client';

import styles from './page.module.css';

const features = [
  { icon: '🌈', name: '七彩光环', info: 'Apple Intelligence 风格，全光谱渐变旋转环' },
  { icon: '🔮', name: '深空球体', info: '多层径向渐变，球面高光与底部反光' },
  { icon: '✨', name: '流光扫描', info: '45° 倾斜光束，4 秒循环高光扫过' },
  { icon: '💫', name: '脉冲呼吸', info: '彩色边框扩散，3.5s 渐隐生命感' },
  { icon: '💎', name: '文字辉光', info: 'AI 文字呼吸发光，多层 text-shadow' },
  { icon: '🔴', name: '通知红点', info: '渐变红点与心跳动画，强化提醒' },
];

export default function AiDemoPage() {
  return (
    <main className={styles.page}>
      <div className={styles.bg}>
        <div className={`${styles.orb} ${styles.a}`} />
        <div className={`${styles.orb} ${styles.b}`} />
      </div>
      <div className={styles.gridBg} />

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>AI ASSISTANT · v11</div>
          <h1>AI 智能助手</h1>
          <p>七彩光环 · 深空球体 · 流光扫描 · 脉冲呼吸</p>
        </div>

        <div className={styles.features}>
          {features.map((item) => (
            <article className={styles.feature} key={item.name}>
              <span className={styles.featureIcon}>{item.icon}</span>
              <div className={styles.featureName}>{item.name}</div>
              <div className={styles.featureInfo}>{item.info}</div>
            </article>
          ))}
        </div>

        <div className={styles.hint}>
          <i className="fa-solid fa-arrow-right" /> 看右下角的 AI 按钮 ↘
        </div>
      </div>

      <div className={styles.aiBtn}>
        <div className={styles.aiPulse} />
        <div className={styles.aiRing} />
        <div className={styles.aiBody}>
          <span className={styles.aiText}>AI</span>
        </div>
        <div className={styles.aiDot} />
      </div>
    </main>
  );
}
