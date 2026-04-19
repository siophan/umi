'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

const tickerItems = [
  { name: '小鹿', prize: '智慧达人礼包', avatar: '/legacy/images/mascot/mouse-cute.png' },
  { name: '咖啡控', prize: '星巴克兑换券', avatar: '/legacy/images/mascot/mouse-reserved.png' },
  { name: '猫奴', prize: '萌宠限定礼盒', avatar: '/legacy/images/mascot/mouse-casual.png' },
  { name: '答题王', prize: '3连全胜大奖', avatar: '/legacy/images/mascot/mouse-main.png' },
  { name: '吃货本货', prize: '价值¥99零食盲盒', avatar: '/legacy/images/mascot/mouse-happy.png' },
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
      { icon: '🏆', text: '猜中：商品直接发货到家，享受超低竞猜价，最高可省 90%' },
      { icon: '🎁', text: '未猜中：获得等额优惠券补偿，可用于商城直购，不亏反赚' },
      { icon: '⚡', text: '好友PK：邀请好友对战竞猜，胜者赢取额外奖励和排行荣誉' },
    ],
  },
  {
    title: '注意事项',
    items: [
      { icon: '💳', text: '竞猜金额支付后不可退回，请确认后再参与' },
      { icon: '📦', text: '猜中商品将在 48小时内发货，物流信息可在“我的订单”中查看' },
      { icon: '🔒', text: '平台保障公平公正，竞猜结果由系统自动判定，不可人为干预' },
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
          <img className={styles.backdrop} src="/legacy/images/profile-banner.jpg" alt="优米" />
        </div>

        <div className={`${styles.loadingScreen} ${uiReady ? styles.loadingHide : ''}`}>
          <div className={styles.loadingLogo}>
            <span className={styles.lc1}>猜</span>
            <span className={styles.lc2}>趣</span>
            <span className={styles.lc3}>社</span>
          </div>
          <div className={styles.loadingSub}>UMe</div>
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
                  <span>刚赢了</span>
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
            <div className={`${styles.brandEn} ${styles.brandEnShow}`}>UMe</div>
            <div className={`${styles.brandDivider} ${styles.brandDividerShow}`} />
            <div className={`${styles.slogan} ${styles.sloganShow}`}>
              <div className={styles.sloganMain}>竞猜赢好物 · 社交新玩法</div>
              <div className={styles.sloganSub}>猜中发货 · 猜错补券 · 稳赚不亏</div>
            </div>
            <div className={`${styles.tags} ${styles.tagsShow}`}>
              <span className={styles.tag}><i className="fa-solid fa-dice" /> 趣味竞猜</span>
              <span className={styles.tag}><i className="fa-solid fa-user-group" /> 好友PK</span>
              <span className={styles.tag}><i className="fa-solid fa-bag-shopping" /> 潮品商城</span>
              <span className={styles.tag}><i className="fa-solid fa-gift" /> 猜中即赚</span>
            </div>
          </div>

          <div className={styles.bottomArea}>
            <button className={`${styles.enterBtn} ${styles.enterBtnShow}`} type="button" onClick={enterApp}>
              <span className={styles.btnIcon}>🎯</span>
              开始探索
              <i className="fa-solid fa-arrow-right" />
            </button>
            <div className={`${styles.copyright} ${styles.copyrightShow}`}>© 2026 优米 UMe</div>
          </div>
        </div>
      </div>

      <div className={`${styles.rulesOverlay} ${rulesOpen ? styles.rulesOverlayShow : ''}`}>
        <div className={styles.rulesCard}>
          <div className={styles.rulesHeader}>
            <div className={styles.rulesIcon}>📜</div>
            <div className={styles.rulesTitle}>竞猜规则</div>
            <div className={styles.rulesSubtitle}>GUESS RULES · 优米</div>
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
            <span>新手建议先体验“新手竞猜”了解流程，系统赠送的体验金不扣真实费用哦~</span>
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
