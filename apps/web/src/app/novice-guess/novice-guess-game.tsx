'use client';

import type { ProductReward, QuestionItem } from './novice-guess-helpers';
import { formatPrice, STREAK_REWARDS } from './novice-guess-helpers';
import styles from './page.module.css';

type NoviceGuessGameProps = {
  liveCount: number;
  currentRound: number;
  remaining: number;
  timerPercent: number;
  revealed: boolean;
  wins: number;
  totalPrize: number;
  allPrizeValue: number;
  question: QuestionItem;
  onClose: () => void;
  onResolveRound: (index: number) => void;
  optionState: (index: number) => string;
};

export function NoviceGuessGame({
  liveCount,
  currentRound,
  remaining,
  timerPercent,
  revealed,
  wins,
  totalPrize,
  allPrizeValue,
  question,
  onClose,
  onResolveRound,
  optionState,
}: NoviceGuessGameProps) {
  return (
    <section className={styles.phaseGame}>
      <div className={styles.gameHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>🎁 新手福利场</div>
          <div className={styles.headerLive}>
            <span className={styles.liveDot} />
            <span>{liveCount.toLocaleString()} 在线</span>
          </div>
        </div>
        <button className={styles.closeBtn} type="button" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className={styles.timerBar}>
        <div className={`${styles.timerFill} ${remaining <= 5 ? styles.danger : ''}`} style={{ width: `${timerPercent}%` }} />
      </div>

      <div className={styles.streakBar}>
        {STREAK_REWARDS.map((item, index) => {
          const stateClass = index < wins ? styles.streakDone : index === currentRound ? styles.streakCurrent : '';
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
            <img className={`${styles.questionImage} ${revealed ? styles.reveal : styles.blur}`} src={question.img} alt={question.question} />
            <div className={styles.questionOverlay}>
              <div className={styles.questionText}>{question.question}</div>
            </div>
            <div className={styles.roundBadge}>
              第 {currentRound + 1}/3 题 · {question.categoryIcon} {question.category}
            </div>
          </div>
        </div>

        <div className={styles.optionsArea}>
          {question.options.map((option, index) => (
            <button key={option} className={`${styles.optionBtn} ${optionState(index)}`} type="button" onClick={() => onResolveRound(index)}>
              <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
              <span className={styles.optionText}>{option}</span>
              <span className={styles.optionPct}>
                {index === question.correct || !revealed ? `${question.pcts[index]}%` : ''}
              </span>
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
              猜中即可点亮体验奖励
            </div>
            <div className={styles.prizeValueRow}>
              <span className={styles.prizeValue}>{formatPrice(question.product.guessPrice)}</span>
              <span className={styles.prizeOrig}>{formatPrice(question.product.price)}</span>
            </div>
          </div>
          <div className={styles.prizeTag}>体验模式</div>
        </div>
        <div className={styles.totalLine}>
          🎁 本场共 {STREAK_REWARDS.length} 件体验商品展示 · 总价值 <span className={styles.totalValue}>{formatPrice(allPrizeValue)}</span> · 已点亮{' '}
          <span className={styles.totalValue}>{formatPrice(totalPrize)}</span>
        </div>
      </div>
    </section>
  );
}
