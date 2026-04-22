'use client';

import type { GuessOption, GuessSummary } from '@umi/shared';

import { shareChannels } from './guess-detail-helpers';
import styles from './page.module.css';

type GuessBattleOption = GuessOption & {
  percent: number;
};

type GuessDetailOverlaysProps = {
  shareOpen: boolean;
  betOpen: boolean;
  guess: GuessSummary;
  optionStats: GuessBattleOption[];
  selectedOption: number;
  betAmount: number;
  onCloseShare: () => void;
  onOpenShareChannel: (label: string) => void;
  onCloseBet: () => void;
  onSelectOption: (index: number) => void;
  onSetBetAmount: (value: number) => void;
  onConfirmBet: () => void;
};

export function GuessDetailOverlays({
  shareOpen,
  betOpen,
  guess,
  optionStats,
  selectedOption,
  betAmount,
  onCloseShare,
  onOpenShareChannel,
  onCloseBet,
  onSelectOption,
  onSetBetAmount,
  onConfirmBet,
}: GuessDetailOverlaysProps) {
  return (
    <>
      {shareOpen ? (
        <div className={styles.sheet}>
          <button className={styles.sheetMask} type="button" onClick={onCloseShare} />
          <section className={styles.sheetPanel}>
            <div className={styles.sheetGrab} />
            <h3>分享竞猜</h3>
            <div className={styles.shareGrid}>
              {shareChannels.map((item) => (
                <button className={styles.shareItem} type="button" key={item.label} onClick={() => onOpenShareChannel(item.label)}>
                  <span style={{ background: item.color }}><i className={item.icon} /></span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>
            <button className={styles.sheetCancel} type="button" onClick={onCloseShare}>
              取消
            </button>
          </section>
        </div>
      ) : null}

      {betOpen ? (
        <div className={styles.sheet}>
          <button className={styles.sheetMask} type="button" onClick={onCloseBet} />
          <section className={`${styles.sheetPanel} ${styles.betPanel}`}>
            <div className={styles.sheetGrab} />
            <div className={styles.betHeader}>
              <h3>🎰 竞猜下单</h3>
              <button type="button" onClick={onCloseBet}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.betOptionCard}>
              <div className={styles.betOptionLine}>
                <span className={styles.betMuted}>预测: {guess.options[selectedOption]?.optionText || ''}</span>
                <strong>×{(guess.options[selectedOption]?.odds || 1).toFixed(2)}</strong>
              </div>
              <p>{optionStats[selectedOption]?.percent || 0}% 选择 · {guess.options[selectedOption]?.voteCount || 0}人投票</p>
            </div>
            <div className={styles.betProductRow}>
              <div className={styles.betProductImgWrap}>
                <img src={guess.product.img} alt={guess.product.name} />
                <div className={styles.betImgTag}>
                  {guess.product.name.length > 8 ? `${guess.product.name.slice(0, 8)}…` : guess.product.name}
                </div>
              </div>
              <div className={styles.betProductRight}>
                <div className={styles.betQtyLabel}>
                  <i className="fa-solid fa-box" />
                  竞猜产品数量
                </div>
                <div className={styles.betQtyHint}>按件数参与竞猜</div>
              </div>
            </div>
            <div className={styles.betPills}>
              {guess.options.map((option: GuessOption, index: number) => (
                <button
                  className={selectedOption === index ? styles.betPillActive : styles.betPill}
                  key={option.id}
                  type="button"
                  onClick={() => onSelectOption(index)}
                >
                  {option.optionText}
                </button>
              ))}
            </div>
            <div className={styles.betAmounts}>
              {[1, 3, 5].map((value: number) => (
                <button
                  className={betAmount === value ? styles.betAmountActive : styles.betAmount}
                  key={value}
                  type="button"
                  onClick={() => onSetBetAmount(value)}
                >
                  {value}件
                </button>
              ))}
            </div>
            <div className={styles.betStepper}>
              <button className={betAmount <= 1 ? styles.betStepperDisabled : ''} type="button" onClick={() => onSetBetAmount(Math.max(1, betAmount - 1))}>
                -
              </button>
              <span className={styles.betStepperValue}>{betAmount}</span>
              <span className={styles.betStepperUnit}>件</span>
              <button className={betAmount >= 999 ? styles.betStepperDisabled : ''} type="button" onClick={() => onSetBetAmount(Math.min(999, betAmount + 1))}>
                +
              </button>
            </div>
            <div className={styles.betSummary}>
              <div className={styles.betRow}>
                <span className={styles.betLabel}>竞猜数量</span>
                <span className={styles.betVal}>{betAmount}件 {guess.product.name}</span>
              </div>
              <div className={styles.betRow}>
                <span className={styles.betLabel}>合计金额</span>
                <span className={styles.betVal}>¥{(guess.product.price * betAmount).toFixed(2)}</span>
              </div>
              <div className={`${styles.betRow} ${styles.betRowHighlight}`}>
                <span className={styles.betLabel}>🎁 猜中可获得</span>
                <span className={styles.betWin}>
                  {Math.round(betAmount * (guess.options[selectedOption]?.odds || 1))}件{guess.product.name} · 价值¥{(guess.product.price * betAmount * (guess.options[selectedOption]?.odds || 1)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className={styles.betFooterText}>🎁赢方瓜分输方商品 · 🎫没猜中退补偿券 · 🤝支持好友PK</div>
            <button className={styles.betConfirm} type="button" onClick={onConfirmBet}>
              🎰 立即竞猜
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}

