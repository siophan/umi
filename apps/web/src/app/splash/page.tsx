'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

const tickerItems = [
  { name: '品牌体验', prize: '竞猜新玩法', avatar: '/legacy/images/mascot/mouse-cute.png' },
  { name: '好友互动', prize: '社交竞猜体验', avatar: '/legacy/images/mascot/mouse-reserved.png' },
  { name: '趣味探索', prize: '浏览更多话题', avatar: '/legacy/images/mascot/mouse-casual.png' },
  { name: '新手指南', prize: '了解基础流程', avatar: '/legacy/images/mascot/mouse-main.png' },
  { name: '平台精选', prize: '发现热门内容', avatar: '/legacy/images/mascot/mouse-happy.png' },
];

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
  size: `${3 + (index % 4)}px`,
  delay: `${(index % 6) * 0.8}s`,
  duration: `${10 + (index % 5) * 2}s`,
}));

const rules = [
  {
    title: '竞猜玩法',
    items: [
      { icon: '🎯', text: '每件商品设有竞猜选项，选择你认为正确的答案并支付竞猜金额即可参与' },
      { icon: '⏰', text: '每场竞猜设有倒计时，截止前可随时参与，超时自动结算' },
      { icon: '📊', text: '赔率根据参与人数实时变动，越早参与可能获得更高赔率' },
    ],
  },
      {
        title: '奖励机制',
        items: [
      { icon: '🏆', text: '不同活动会配置不同奖励和结算方式，请以具体页面和实际规则为准' },
      { icon: '🎁', text: '部分新手体验页仅用于演示流程，不代表奖励已发放或已入仓' },
      { icon: '⚡', text: '好友互动、排行和商城能力会按页面当前接线状态逐步开放' },
        ],
      },
  {
    title: '注意事项',
    items: [
      { icon: '💳', text: '不同页面处于不同接线阶段，正式支付和发货信息请以真实订单页为准' },
      { icon: '📦', text: '是否发货、是否入仓、是否补偿，都以具体业务页和实际接口结果为准' },
      { icon: '🔒', text: '引导页和宣传素材可能用于说明玩法，不等同于实时中奖动态或收益承诺' },
    ],
  },
];

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [uiReady, setUiReady] = useState(false);
  const [tapHintVisible, setTapHintVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [skipRules, setSkipRules] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(100, current + 20);
      });
    }, 240);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress < 100) {
      return;
    }

    const timer = window.setTimeout(() => setTapHintVisible(true), 380);
    return () => window.clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (!uiReady || rulesOpen) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rulesOpen, uiReady]);

  useEffect(() => {
    if (uiReady && countdown === 0 && !rulesOpen) {
      router.replace('/');
    }
  }, [countdown, router, rulesOpen, uiReady]);

  const tickerLoop = useMemo(() => [...tickerItems, ...tickerItems], []);

  const enterApp = () => {
    if (skipRules) {
      router.push('/novice-guess');
      return;
    }
    setRulesOpen(true);
  };

  const handleActivateSplash = () => {
    setTapHintVisible(false);
    setUiReady(true);
  };

  return (
    <main className={styles.splash}>
      <div className={styles.frame}>
        <div className={styles.videoLayer}>
          <video
            className={styles.video}
            muted
            playsInline
            autoPlay
            loop
            poster="/legacy/images/profile-banner.jpg"
          />
          <img className={styles.backdrop} src="/legacy/images/profile-banner.jpg" alt="Umi" />
        </div>

        <div className={`${styles.loadingScreen} ${uiReady ? styles.loadingHide : ''}`}>
          <div className={styles.loadingLogo}>
            <span className={styles.lc1}>猜</span>
            <span className={styles.lc2}>趣</span>
            <span className={styles.lc3}>社</span>
          </div>
          <div className={styles.loadingSub}>UMI</div>
          <div className={styles.loadingBarWrap}>
            <div className={styles.loadingBar} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.loadingPercent}>{progress}%</div>
          <div className={styles.loadingTip}>正在加载动画...</div>
        </div>

        <button
          className={`${styles.tapHint} ${tapHintVisible ? styles.tapHintShow : ''}`}
          type="button"
          onClick={handleActivateSplash}
        >
          <span className={styles.tapCircle}>
            <i className="fa-solid fa-play" />
          </span>
          <span className={styles.tapText}>点击播放</span>
        </button>

        <button className={`${styles.skipBtn} ${uiReady ? styles.skipShow : ''}`} type="button" onClick={() => router.replace('/')}>
          跳过 <span>{countdown}</span>s
        </button>

        <div className={`${styles.uiLayer} ${uiReady ? styles.uiLayerShow : ''}`}>
          <div className={styles.overlayTop} />
          <div className={styles.overlayBottom} />
          <div className={styles.particles}>
            {particles.map((item) => (
              <span
                key={item.id}
                className={styles.pt}
                style={{
                  left: item.left,
                  width: item.size,
                  height: item.size,
                  animationDelay: item.delay,
                  animationDuration: item.duration,
                }}
              />
            ))}
          </div>

          <div className={styles.ticker}>
            <div className={styles.tickerTrack}>
              {tickerLoop.map((item, index) => (
                <div className={styles.tickerItem} key={`${item.name}-${index}`}>
                  <img src={item.avatar} alt={item.name} />
                  <span>{item.name}</span>
                  <span>正在了解</span>
                  <span className={styles.tickerPrize}>{item.prize}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.topBrand}>
            <div className={styles.brandTitle}>
              <span className={`${styles.brandChar} ${styles.brandShow}`}>猜</span>
              <span className={`${styles.brandChar} ${styles.brandShow}`}>趣</span>
              <span className={`${styles.brandChar} ${styles.brandShow}`}>社</span>
            </div>
            <div className={`${styles.brandEn} ${styles.brandEnShow}`}>UMI</div>
            <div className={`${styles.brandDivider} ${styles.brandDividerShow}`} />
            <div className={`${styles.slogan} ${styles.sloganShow}`}>
              <div className={styles.sloganMain}>竞猜体验 · 社交新玩法</div>
              <div className={styles.sloganSub}>玩法与奖励以具体页面说明和真实结果为准</div>
            </div>
            <div className={`${styles.tags} ${styles.tagsShow}`}>
              <span className={styles.tag}><i className="fa-solid fa-dice" /> 趣味竞猜</span>
              <span className={styles.tag}><i className="fa-solid fa-user-group" /> 好友PK</span>
              <span className={styles.tag}><i className="fa-solid fa-bag-shopping" /> 潮品商城</span>
              <span className={styles.tag}><i className="fa-solid fa-gift" /> 玩法体验</span>
            </div>
          </div>

          <div className={styles.bottomArea}>
            <button className={`${styles.enterBtn} ${styles.enterBtnShow}`} type="button" onClick={enterApp}>
              <span className={styles.btnIcon}>🎯</span>
              开始探索
              <i className="fa-solid fa-arrow-right" />
            </button>
            <div className={`${styles.copyright} ${styles.copyrightShow}`}>© 2026 Umi UMI</div>
          </div>
        </div>
      </div>

      <div className={`${styles.rulesOverlay} ${rulesOpen ? styles.rulesOverlayShow : ''}`}>
        <div className={styles.rulesCard}>
          <div className={styles.rulesHeader}>
            <div className={styles.rulesIcon}>📜</div>
            <div className={styles.rulesTitle}>竞猜规则</div>
            <div className={styles.rulesSubtitle}>GUESS RULES · Umi</div>
          </div>
          <div className={styles.rulesBody}>
            {rules.map((section, index) => (
              <div className={styles.ruleSection} key={section.title}>
                <div className={styles.ruleSectionTitle}>
                  <span className={styles.ruleNum}>{index + 1}</span>
                  {section.title}
                </div>
                {section.items.map((item) => (
                  <div className={styles.ruleItem} key={item.text}>
                    <div className={styles.ruleItemIcon}>{item.icon}</div>
                    <div className={styles.ruleItemText}>{item.text}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
            <div className={styles.rulesTip}>
              <span className={styles.rulesTipIcon}>💡</span>
            <span>新手建议先体验“新手竞猜”了解流程，体验页文案不代表实时中奖、固定补偿或收益承诺。</span>
            </div>
          <div className={styles.rulesFooter}>
            <button className={styles.rulesConfirmBtn} type="button" onClick={() => router.push('/novice-guess')}>
              我已知晓
            </button>
            <label className={styles.rulesCheckRow}>
              <input type="checkbox" checked={skipRules} onChange={(event) => setSkipRules(event.target.checked)} />
              <span>下次不再显示</span>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
