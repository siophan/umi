'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

type ProductReward = {
  name: string;
  img: string;
  price: number;
  guessPrice: number;
  badge: string;
};

type QuestionItem = {
  category: string;
  categoryIcon: string;
  img: string;
  question: string;
  options: string[];
  correct: number;
  hint: string;
  pcts: number[];
  product: ProductReward;
};

const QUESTIONS: QuestionItem[] = [
  {
    category: '萌宠百科',
    categoryIcon: '🐾',
    img: '/legacy/images/products/p001-lays.jpg',
    question: '猫咪平均每天要睡多少个小时？',
    options: ['6-8小时', '8-10小时', '12-16小时', '18-22小时'],
    correct: 2,
    hint: '猫咪是出了名的“睡神”，一天大部分时间都在补眠。',
    pcts: [8, 18, 52, 22],
    product: {
      name: '乐事原味薯片 70g',
      img: '/legacy/images/products/p001-lays.jpg',
      price: 9.9,
      guessPrice: 0,
      badge: '首题奖励',
    },
  },
  {
    category: '生活趣知',
    categoryIcon: '☕',
    img: '/legacy/images/products/p002-oreo.jpg',
    question: '冰淇淋在什么温度下最好吃？',
    options: ['-18°C 以下', '-14°C 左右', '-8°C 左右', '0°C 刚好'],
    correct: 2,
    hint: '太冷会让舌头麻木，反而吃不出香味。',
    pcts: [22, 18, 45, 15],
    product: {
      name: '奥利奥原味夹心饼干',
      img: '/legacy/images/products/p002-oreo.jpg',
      price: 16.8,
      guessPrice: 0,
      badge: '二连奖励',
    },
  },
  {
    category: '美食百科',
    categoryIcon: '🍜',
    img: '/legacy/images/products/p003-squirrels.jpg',
    question: '花生其实属于什么类植物？',
    options: ['坚果类', '豆科植物', '根茎类', '谷物类'],
    correct: 1,
    hint: '花生虽然常被当作坚果，但它其实和大豆是亲戚。',
    pcts: [35, 42, 13, 10],
    product: {
      name: '三只松鼠坚果礼盒',
      img: '/legacy/images/products/p003-squirrels.jpg',
      price: 59.9,
      guessPrice: 0,
      badge: '终极大奖',
    },
  },
];

const TICKER_ITEMS = [
  {
    name: '鼠鼠补给站',
    avatar: '/legacy/images/mascot/mouse-main.png',
    prize: '智慧达人礼包',
  },
  {
    name: '零食侦探社',
    avatar: '/legacy/images/mascot/mouse-happy.png',
    prize: '星巴克兑换券',
  },
  {
    name: '甜品公主',
    avatar: '/legacy/images/mascot/mouse-casual.png',
    prize: '零食大礼包',
  },
  {
    name: '品牌观察员',
    avatar: '/legacy/images/products/p007-dove.jpg',
    prize: '神秘大奖',
  },
  {
    name: '乐事官方',
    avatar: '/legacy/images/products/p001-lays.jpg',
    prize: '价值¥99礼盒',
  },
];

const STREAK_REWARDS = [
  { emoji: '🌟', name: '智慧达人奖', desc: '第1题奖品' },
  { emoji: '🎁', name: '小神秘奖品', desc: '连续猜对2题解锁' },
  { emoji: '🎊', name: '大神秘奖品', desc: '3连全胜解锁' },
];

const CONFETTI = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
  delay: `${(index % 6) * 0.12}s`,
  duration: `${4 + (index % 4) * 0.45}s`,
}));

function formatPrice(value: number) {
  return `¥${value.toFixed(1)}`;
}

export default function NoviceGuessPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'splash' | 'game' | 'result'>('splash');
  const [currentRound, setCurrentRound] = useState(0);
  const [remaining, setRemaining] = useState(15);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [wins, setWins] = useState(0);
  const [wonProducts, setWonProducts] = useState<ProductReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [liveCount, setLiveCount] = useState(2847);

  const question = QUESTIONS[currentRound];
  const totalPrize = useMemo(
    () => wonProducts.reduce((sum, item) => sum + item.price, 0),
    [wonProducts],
  );
  const allPrizeValue = useMemo(
    () => QUESTIONS.reduce((sum, item) => sum + item.product.price, 0),
    [],
  );
  const brandDate = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
    [],
  );
  const timerPercent = Math.max((remaining / 15) * 100, 0);
  const isLose = phase === 'result' && wins === 0;
  const isFullWin = phase === 'result' && wins === QUESTIONS.length;
  const tickerLoop = [...TICKER_ITEMS, ...TICKER_ITEMS];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveCount((value) => Math.max(2800, value + (Math.random() > 0.5 ? 1 : -1)));
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (phase !== 'game' || selectedIndex !== null || streakModalOpen || loading) {
      return undefined;
    }

    if (remaining <= 0) {
      handleResolveRound(null);
      return undefined;
    }

    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, remaining, selectedIndex, streakModalOpen, loading]);

  function startGame() {
    setPhase('game');
    setCurrentRound(0);
    setRemaining(15);
    setSelectedIndex(null);
    setRevealed(false);
    setWins(0);
    setStreak(0);
    setWonProducts([]);
    setStreakModalOpen(false);
    setToast('');
  }

  function handleResolveRound(choiceIndex: number | null) {
    if (phase !== 'game' || selectedIndex !== null) {
      return;
    }

    const correct = choiceIndex === question.correct;
    const nextWins = correct ? wins + 1 : wins;
    const hasNextRound = currentRound < QUESTIONS.length - 1;

    setSelectedIndex(choiceIndex);
    setRevealed(true);

    if (correct) {
      setWins(nextWins);
      setStreak((value) => value + 1);
      setWonProducts((value) => [...value, question.product]);
      setToast(`已解锁 ${question.product.name}`);
    }

    window.setTimeout(() => {
      setLoading(true);
      window.setTimeout(() => {
        setLoading(false);
        if (correct && hasNextRound) {
          setStreakModalOpen(true);
          return;
        }
        setPhase('result');
      }, 850);
    }, 900);
  }

  function continueChallenge() {
    if (currentRound >= QUESTIONS.length - 1) {
      setStreakModalOpen(false);
      setPhase('result');
      return;
    }

    setCurrentRound((value) => value + 1);
    setRemaining(15);
    setSelectedIndex(null);
    setRevealed(false);
    setStreakModalOpen(false);
  }

  function handleShare() {
    setToast('战绩卡已生成');
  }

  function optionState(index: number) {
    if (selectedIndex === null) {
      return '';
    }
    if (index === question.correct) {
      return styles.correct;
    }
    if (index === selectedIndex) {
      return styles.wrong;
    }
    return styles.disabled;
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambientBg}>
        <div className={styles.ambientOrb} />
        <div className={styles.ambientOrb} />
        <div className={styles.ambientOrb} />
      </div>
      <div className={styles.noiseOverlay} />

      {phase === 'result' && wins > 0 ? (
        <div className={styles.confettiBox}>
          {CONFETTI.map((item) => (
            <span
              key={item.id}
              className={styles.confetti}
              style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration }}
            />
          ))}
        </div>
      ) : null}

      <div className={`${styles.achieveToast} ${toast ? styles.visible : ''}`}>🏆 {toast}</div>

      <div className={`${styles.loadingOverlay} ${loading ? styles.visible : ''}`}>
        <div className={styles.loadingRing} />
        <div className={styles.loadingText}>开奖中</div>
        <div className={styles.loadingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className={`${styles.streakModalOverlay} ${streakModalOpen ? styles.visible : ''}`}>
        <div className={styles.streakModal}>
          <div className={styles.modalPrizeSection}>
            <div className={styles.modalPrizeIcon}>{question.product.badge === '终极大奖' ? '🎊' : '🎁'}</div>
            <div className={styles.modalPrizeTitle}>恭喜解锁 {question.product.badge}</div>
            <div className={styles.modalPrizeSub}>
              {question.product.badge === '首题奖励' ? '你的第一件竞猜战利品已入库' : '小神秘奖品已解锁'}
              <br />
              <span className={styles.modalPrizeHint}>可在「我的仓库」中查看</span>
            </div>

            <div className={styles.modalProductCard}>
              <img className={styles.modalProductImage} src={question.product.img} alt={question.product.name} />
              <div className={styles.modalProductInfo}>
                <div className={styles.modalProductName}>{question.product.name}</div>
                <div className={styles.modalProductValue}>{formatPrice(question.product.price)}</div>
                <div className={styles.modalProductStatus}>猜中已锁定，完成后自动入仓</div>
              </div>
            </div>
          </div>

          <div className={styles.modalChallengeSection}>
            <div className={styles.modalDivider}>
              <span>CONTINUE</span>
            </div>
            <div className={styles.modalChallengeTitle}>继续冲击连续奖励</div>
            <div className={styles.modalChallengeDesc}>
              {currentRound === QUESTIONS.length - 2
                ? '全部猜中可解锁大神秘奖品！'
                : `再答对 ${QUESTIONS.length - wins} 题，可把后续奖励全部拿下。`}
              <br />
              {currentRound === QUESTIONS.length - 2 ? '距离全胜之王只差最后一步！' : '继续挑战，赢更多！'}
            </div>

            <div className={styles.modalRewardsPreview}>
              {STREAK_REWARDS.map((item, index) => {
                const itemClass =
                  index < wins ? styles.previewDone : index === wins ? styles.previewNext : styles.previewMystery;
                return (
                  <div key={item.name} className={`${styles.previewItem} ${itemClass}`}>
                    <div className={styles.previewEmoji}>{item.emoji}</div>
                    <div className={styles.previewCount}>{index + 1} 连胜</div>
                    <div className={styles.previewName}>{item.name}</div>
                  </div>
                );
              })}
            </div>

            <button className={styles.modalMainButton} type="button" onClick={continueChallenge}>
              <span className={styles.buttonShine} />
              🔥 继续挑战，赢更多！
            </button>
            <button className={styles.modalExploreButton} type="button" onClick={() => setPhase('result')}>
              收下奖品，去探索更多
              <span className={styles.modalExploreArrow}>→</span>
            </button>
            <div className={styles.modalSecondaryRow}>
              <button className={styles.modalSecondaryButton} type="button" onClick={handleShare}>
                晒战绩
              </button>
              <button className={styles.modalSecondaryButton} type="button" onClick={() => router.push('/warehouse')}>
                我的仓库
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className={`${styles.phaseSplash} ${phase !== 'splash' ? styles.phaseHidden : ''}`}>
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
                <span>{item.name} 刚拿到</span>
                <span className={styles.prize}>{item.prize}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.splashCenter}>
          <div className={styles.splashBrand}>⚡ 新用户专属福利</div>
          <div className={styles.splashLogo}>Umi</div>
          <div className={styles.splashSlogan}>猜对了就是你的</div>
          <div className={styles.splashSub}>万物皆可猜 · 猜中免费拿</div>
          <div className={styles.splashLive}>
            <span className={styles.dot} />
            <span className={styles.count}>{liveCount.toLocaleString()}</span>
            <span>人正在猜</span>
          </div>
          <button className={styles.splashCta} type="button" onClick={startGame}>
            <span className={styles.ctaShine} />
            <span className={styles.ctaIcon}>🎁</span>
            免费猜一次
            <span className={styles.ctaSub}>0元赢好物 · 新人必得</span>
          </button>
          <button className={styles.splashSkip} type="button" onClick={() => router.push('/')}>
            已有账号，直接进入
            <span className={styles.skipArrow}>→</span>
          </button>
        </div>
      </section>

      <section className={`${styles.phaseGame} ${phase === 'game' ? styles.phaseActive : ''}`}>
        <div className={styles.gameHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBadge}>🎁 新手福利场</div>
            <div className={styles.headerLive}>
              <span className={styles.liveDot} />
              <span>{liveCount.toLocaleString()} 在线</span>
            </div>
          </div>
          <button className={styles.closeBtn} type="button" onClick={() => router.push('/')}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.timerBar}>
          <div
            className={`${styles.timerFill} ${remaining <= 5 ? styles.danger : ''}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        <div className={styles.streakBar}>
          {STREAK_REWARDS.map((item, index) => {
            const stateClass =
              index < wins ? styles.streakDone : index === currentRound ? styles.streakCurrent : '';
            return (
              <div key={item.name} className={`${styles.streakStep} ${stateClass}`}>
                <div className={styles.rewardIcon}>{item.emoji}</div>
                <div className={styles.streakFill} />
                <div className={styles.streakLabel}>{index + 1} 连胜</div>
              </div>
            );
          })}
          <div className={styles.streakLegend}>连胜挑战</div>
        </div>

        <div className={styles.questionArea}>
          <div className={styles.questionCard}>
            <div className={styles.questionImageWrap}>
              <img
                className={`${styles.questionImage} ${revealed ? styles.reveal : styles.blur}`}
                src={question.img}
                alt={question.question}
              />
              <div className={styles.questionOverlay}>
                <div className={styles.questionText}>{question.question}</div>
              </div>
              <div className={styles.roundBadge}>第 {currentRound + 1}/3 题 · {question.categoryIcon} {question.category}</div>
            </div>
          </div>

          <div className={styles.optionsArea}>
            {question.options.map((option, index) => (
              <button
                key={option}
                className={`${styles.optionBtn} ${optionState(index)}`}
                type="button"
                onClick={() => handleResolveRound(index)}
              >
                <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                <span className={styles.optionText}>{option}</span>
                <span className={styles.optionPct}>{selectedIndex === null ? `${question.pcts[index]}%` : index === question.correct ? `${question.pcts[index]}%` : ''}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.gameBottom}>
          <div className={styles.gameInfo}>
            <span>
              第 <b>{currentRound + 1}</b>/3 题
            </span>
            <div className={styles.timerPill}>⏱ {remaining}s</div>
          </div>
          <div className={styles.prizeBar}>
            <div className={styles.prizeIcon}>🎁</div>
            <div className={styles.prizeInfo}>
              <div className={styles.prizeLabel}>
                <span className={styles.dot} />
                猜中即可免费获得
              </div>
              <div className={styles.prizeValueRow}>
                <span className={styles.prizeValue}>{formatPrice(question.product.guessPrice)}</span>
                <span className={styles.prizeOrig}>{formatPrice(question.product.price)}</span>
              </div>
            </div>
            <div className={styles.prizeTag}>猜中免费</div>
          </div>
          <div className={styles.totalLine}>
            🎁 本场共 {QUESTIONS.length} 件商品可赢 · 总价值 <span className={styles.totalValue}>{formatPrice(allPrizeValue)}</span> · 已赢{' '}
            <span className={styles.totalValue}>{formatPrice(totalPrize)}</span>
          </div>
        </div>
      </section>

      <section className={`${styles.phaseResult} ${phase === 'result' ? styles.phaseActive : ''}`}>
        {isLose ? (
          <div className={styles.resultBody}>
            <div className={styles.resultHero}>
              <div className={styles.modalPrizeIcon}>😢</div>
              <div className={styles.loseTitle}>这次差一点</div>
              <div className={styles.loseSub}>别灰心，马上复活继续挑战，奖励还在等你。</div>
            </div>

            <div className={styles.challengeCard}>
              <div className={styles.challengeTitle}>连胜奖励进度</div>
              <div className={styles.challengeSub}>
                正确答案是「{question.options[question.correct]}」
                <br />
                没关系，新手都有免费复活机会！
              </div>
              <div className={styles.challengeList}>
                {STREAK_REWARDS.map((item, index) => (
                  <div className={`${styles.challengeItem} ${styles.challengeLocked}`} key={item.name}>
                    <div className={styles.challengeNumber}>{index + 1}</div>
                    <div className={styles.challengeInfo}>
                      <div className={styles.challengeName}>{item.name}</div>
                      <div className={styles.challengeDesc}>{item.desc}</div>
                    </div>
                    <div className={styles.challengeEmoji}>{item.emoji}</div>
                  </div>
                ))}
              </div>
              <div className={styles.challengeWarning}>
                <span className={styles.warningIcon}>⚠</span>
                未猜中不会入仓，奖励仅保留本次挑战结果。
              </div>
            </div>

            <div className={styles.revivalBox}>
              <div className={styles.revivalTitle}>🔄 复活机会！</div>
              <div className={styles.revivalDesc}>
                连胜中断，但你可以：
                <br />
                • 分享给好友 → 立即获得 1 次复活机会
                <br />
                • 邀请 2 位好友参与 → 免费再来一轮！
              </div>
              <div className={styles.revivalButtons}>
                <button className={styles.revivalPrimary} type="button" onClick={handleShare}>
                  📤 分享复活
                </button>
                <button className={styles.revivalGhost} type="button" onClick={() => router.push('/all-features')}>
                  继续逛逛
                </button>
              </div>
            </div>
            <div className={styles.loginHint}>
              去 <button className={styles.inlineLink} type="button" onClick={() => router.push('/register')}>登录保存</button>，下次继续挑战更轻松。
            </div>
          </div>
        ) : (
          <div className={`${styles.resultBody} ${styles.winScroll}`}>
            <div className={styles.winHero}>
              <div className={styles.winGlow} />
              <div className={styles.winRays}>
                {Array.from({ length: 10 }, (_, index) => (
                  <span
                    key={index}
                    className={styles.winRay}
                    style={{ transform: `translate(-50%, -60%) rotate(${index * 36}deg)` }}
                  />
                ))}
              </div>
              <div className={styles.winTrophy}>{isFullWin ? '🏆' : '🎉'}</div>
              <div className={`${styles.winTitle} ${isFullWin ? styles.full : styles.partial}`}>
                {isFullWin ? '🔥 全部猜中！' : `恭喜猜中 ${wins} 题！`}
              </div>
              <div className={styles.winTagline}>奖励已锁定，完成注册后自动入仓</div>
            </div>

            <div className={styles.lootGrid}>
              {wonProducts.map((item, index) => (
                <div className={styles.lootCard} key={item.name}>
                  <img className={styles.lootImage} src={item.img} alt={item.name} />
                  <div className={styles.lootBadge}>第{index + 1}题</div>
                  <div className={styles.lootGlow} />
                  <div className={styles.lootInfo}>
                    <div className={styles.lootName}>{item.name}</div>
                    <div className={styles.lootPrice}>{formatPrice(item.price)}</div>
                    <div className={styles.lootStatus}>✅ 猜中已锁定</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.statsRibbon}>
              <div className={styles.stat}>
                <div className={`${styles.statNum} ${styles.gold}`}>{wonProducts.length}</div>
                <div className={styles.statLabel}>赢得商品</div>
              </div>
              <div className={styles.stat}>
                <div className={`${styles.statNum} ${styles.green}`}>{wins}</div>
                <div className={styles.statLabel}>连胜纪录</div>
              </div>
              <div className={styles.stat}>
                <div className={`${styles.statNum} ${styles.cyan}`}>{formatPrice(totalPrize)}</div>
                <div className={styles.statLabel}>总价值</div>
              </div>
            </div>
            {isFullWin ? <div className={styles.statBadge}>💎 全胜之王</div> : null}

            <div className={styles.brandStrip}>
              <span className={styles.brandLogo}>Umi</span>
              <span className={styles.brandDot} />
              <span className={styles.brandText}>猜对了就是你的</span>
              <span className={styles.brandDot} />
              <span className={styles.brandText}>{brandDate}</span>
            </div>

            <div className={styles.challengeCard}>
              <div className={styles.challengeTitle}>连续奖励进度</div>
              <div className={styles.challengeSub}>继续完成后续题目，可把剩下的奖励一起收入仓库。</div>
              <div className={styles.challengeList}>
                {STREAK_REWARDS.map((item, index) => {
                  const stateClass =
                    index < wins ? styles.challengeDone : index === wins ? styles.challengeNext : styles.challengeLocked;
                  return (
                    <div className={`${styles.challengeItem} ${stateClass}`} key={item.name}>
                      <div className={styles.challengeNumber}>{index + 1}</div>
                      <div className={styles.challengeInfo}>
                        <div className={styles.challengeName}>{item.name}</div>
                        <div className={styles.challengeDesc}>{item.desc}</div>
                      </div>
                      <div className={styles.challengeEmoji}>{item.emoji}</div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.challengeWarning}>
                <span className={styles.warningIcon}>⚠</span>
                未注册时奖励仅保留当前会话，请尽快登录保存。
              </div>
            </div>

            <div className={styles.resultActions}>
              <button className={styles.primaryAction} type="button" onClick={() => router.push('/all-features')}>
                <span className={styles.buttonShine} />
                探索更多竞猜话题
                <span className={styles.ctaArrow}>→</span>
              </button>
              <div className={styles.secondaryRow}>
                <button className={styles.secondaryAction} type="button" onClick={handleShare}>
                  晒战绩
                </button>
                <button className={styles.secondaryAction} type="button" onClick={() => router.push('/warehouse')}>
                  我的仓库
                </button>
              </div>
              <div className={styles.loginHint}>
                去 <button className={styles.inlineLink} type="button" onClick={() => router.push('/register')}>登录保存</button>，奖励不会丢。
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
