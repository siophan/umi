'use client';

import Link from 'next/link';

import styles from './page.module.css';

const tags = [
  '趣味竞猜',
  '好友PK',
  '潮品商城',
  '猜中即赚',
];

const rules = [
  { icon: '🎯', title: '竞猜玩法', desc: '每件商品设有竞猜选项，选择你认为正确的答案并支付竞猜金额即可参与。' },
  { icon: '🏆', title: '奖励机制', desc: '猜中商品直接发货，未猜中获得等额优惠券补偿。' },
  { icon: '🔒', title: '公平保障', desc: '竞猜结果由系统自动判定，不可人为干预。' },
];

export default function SplashPage() {
  return (
    <main className={styles.page}>
      <section className={styles.frame}>
        <div className={styles.loadingScreen}>
          <div className={styles.logo}>
            <span>猜</span>
            <span>趣</span>
            <span>社</span>
          </div>
          <div className={styles.sub}>UMe</div>
          <div className={styles.barWrap}><div className={styles.bar} /></div>
          <div className={styles.percent}>100%</div>
        </div>

        <div className={styles.videoBackdrop}>
          <img src="/legacy/images/mascot/profile-banner.jpg" alt="优米启动页" />
          <div className={styles.topOverlay} />
          <div className={styles.bottomOverlay} />
        </div>

        <button className={styles.skip} type="button">跳过 5s</button>

        <div className={styles.hero}>
          <div className={styles.brand}>
            <span>猜</span>
            <span>趣</span>
            <span>社</span>
          </div>
          <div className={styles.en}>UMe</div>
          <div className={styles.divider} />
          <div className={styles.sloganMain}>竞猜赢好物 · 社交新玩法</div>
          <div className={styles.sloganSub}>猜中发货 · 猜错补券 · 稳赚不亏</div>
          <div className={styles.tags}>
            {tags.map((item) => (
              <span className={styles.tag} key={item}>{item}</span>
            ))}
          </div>
          <Link className={styles.enter} href="/">
            <span>🎯</span> 开始探索 <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </section>

      <section className={styles.rules}>
        <div className={styles.rulesCard}>
          <div className={styles.rulesHeader}>
            <div className={styles.rulesIcon}>📜</div>
            <div className={styles.rulesTitle}>竞猜规则</div>
            <div className={styles.rulesSub}>GUESS RULES · 优米</div>
          </div>
          <div className={styles.ruleList}>
            {rules.map((item, index) => (
              <article className={styles.ruleItem} key={item.title}>
                <div className={styles.ruleNum}>{index + 1}</div>
                <div className={styles.ruleBody}>
                  <div className={styles.ruleHead}>{item.icon} {item.title}</div>
                  <div className={styles.ruleDesc}>{item.desc}</div>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.tip}>💡 新手建议先体验“新手竞猜”了解流程，系统赠送的体验金不扣真实费用。</div>
          <button className={styles.confirm} type="button">我已知晓</button>
        </div>
      </section>
    </main>
  );
}
