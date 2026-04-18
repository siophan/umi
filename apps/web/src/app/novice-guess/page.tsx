'use client';

import styles from './page.module.css';

const rewards = [
  { title: '首猜免单', desc: '首次参与竞猜完全免费' },
  { title: '猜中入仓', desc: '命中后商品自动进入仓库' },
  { title: '猜错补券', desc: '未命中也有补偿券可领' },
];

export default function NoviceGuessPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.badge}>NEW PLAYER QUEST</div>
        <h1>送你一次免费竞猜</h1>
        <p>先体验一次优米的新手玩法，0 元上手，猜中直接拿走好物。</p>
        <div className={styles.liveRow}>
          <span className={styles.dot} />
          <strong>23,841</strong>
          <span>新人正在参加</span>
        </div>
        <button className={styles.cta} type="button">立即免费参与</button>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>新手奖励</div>
        <div className={styles.rewardGrid}>
          {rewards.map((item) => (
            <article className={styles.reward} key={item.title}>
              <div className={styles.rewardIcon}>🎁</div>
              <div className={styles.rewardTitle}>{item.title}</div>
              <div className={styles.rewardDesc}>{item.desc}</div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>本轮试炼</div>
        <div className={styles.productCard}>
          <img src="/legacy/images/products/p001-lays.jpg" alt="乐事原味薯片" />
          <div className={styles.productInfo}>
            <div className={styles.productName}>乐事原味薯片 70g</div>
            <div className={styles.productMeta}>新手专属 · 预计今晚 20:00 开奖</div>
            <div className={styles.vs}>
              <button className={styles.optionA} type="button">会售罄</button>
              <div className={styles.vsMid}>VS</div>
              <button className={styles.optionB} type="button">不会售罄</button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionTitle}>规则说明</div>
        <div className={styles.ruleItem}><span>1</span><p>新手竞猜仅限首次参与，成功后自动解锁正式竞猜。</p></div>
        <div className={styles.ruleItem}><span>2</span><p>猜中后商品直接进入仓库，可自提或转实物。</p></div>
        <div className={styles.ruleItem}><span>3</span><p>猜错也会发放补偿券，不会空手而归。</p></div>
      </section>
    </main>
  );
}
