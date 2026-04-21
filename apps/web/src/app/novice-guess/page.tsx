'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { NoviceGuessGame } from './novice-guess-game';
import {
  CONFETTI,
  formatPrice,
  QUESTIONS,
  STREAK_REWARDS,
  TICKER_ITEMS,
  type ProductReward,
} from './novice-guess-helpers';
import { NoviceGuessResult } from './novice-guess-result';
import { NoviceGuessSplash } from './novice-guess-splash';
import styles from './page.module.css';

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
      setToast(`已点亮体验奖励：${question.product.name}`);
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
    setToast('演示战绩卡已生成');
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
            <div className={styles.modalPrizeTitle}>已点亮 {question.product.badge}</div>
            <div className={styles.modalPrizeSub}>
              {question.product.badge === '首题奖励' ? '你的第一件体验奖励已点亮' : '小神秘体验奖励已点亮'}
              <br />
              <span className={styles.modalPrizeHint}>当前仍是体验模式，只展示演示结果，不会发放真实奖励</span>
            </div>

            <div className={styles.modalProductCard}>
              <img className={styles.modalProductImage} src={question.product.img} alt={question.product.name} />
              <div className={styles.modalProductInfo}>
                <div className={styles.modalProductName}>{question.product.name}</div>
                <div className={styles.modalProductValue}>{formatPrice(question.product.price)}</div>
                <div className={styles.modalProductStatus}>体验模式已点亮，仅用于演示展示</div>
              </div>
            </div>
          </div>

          <div className={styles.modalChallengeSection}>
            <div className={styles.modalDivider}>
              <span>CONTINUE</span>
            </div>
            <div className={styles.modalChallengeTitle}>继续点亮后续体验奖励</div>
            <div className={styles.modalChallengeDesc}>
              {currentRound === QUESTIONS.length - 2
                ? '全部猜中可点亮最终体验大奖展示。'
                : `再答对 ${QUESTIONS.length - wins} 题，可继续点亮后续体验奖励。`}
              <br />
              {currentRound === QUESTIONS.length - 2 ? '距离完整体验只差最后一步。' : '继续挑战，解锁更多演示内容。'}
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
              查看结果，去探索更多
              <span className={styles.modalExploreArrow}>→</span>
            </button>
            <div className={styles.modalSecondaryRow}>
              <button className={styles.modalSecondaryButton} type="button" onClick={handleShare}>
                晒战绩
              </button>
              <button className={styles.modalSecondaryButton} type="button" onClick={() => router.push('/features')}>
                继续体验
              </button>
            </div>
          </div>
        </div>
      </div>

      {phase === 'splash' ? (
        <NoviceGuessSplash liveCount={liveCount} tickerLoop={tickerLoop} onStart={startGame} onEnterHome={() => router.push('/')} />
      ) : null}

      {phase === 'game' ? (
        <NoviceGuessGame
          liveCount={liveCount}
          currentRound={currentRound}
          remaining={remaining}
          timerPercent={timerPercent}
          revealed={revealed}
          wins={wins}
          totalPrize={totalPrize}
          allPrizeValue={allPrizeValue}
          question={question}
          onClose={() => router.push('/')}
          onResolveRound={handleResolveRound}
          optionState={optionState}
        />
      ) : null}

      {phase === 'result' ? (
        <NoviceGuessResult
          isLose={isLose}
          isFullWin={isFullWin}
          wins={wins}
          question={question}
          wonProducts={wonProducts}
          totalPrize={totalPrize}
          brandDate={brandDate}
          onShare={handleShare}
          onExplore={() => router.push('/features')}
          onRegister={() => router.push('/register')}
        />
      ) : null}
    </main>
  );
}
