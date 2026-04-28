'use client';

import type { GuessOption, GuessPayChannel, GuessSummary } from '@umi/shared';

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
  betSubmitting: boolean;
  payChannel: GuessPayChannel;
  onCloseShare: () => void;
  onOpenShareChannel: (label: string) => void;
  onCloseBet: () => void;
  onSetBetAmount: (value: number) => void;
  onSetPayChannel: (channel: GuessPayChannel) => void;
  onConfirmBet: () => void;
};

export function GuessDetailOverlays({
  shareOpen,
  betOpen,
  guess,
  optionStats,
  selectedOption,
  betAmount,
  betSubmitting,
  payChannel,
  onCloseShare,
  onOpenShareChannel,
  onCloseBet,
  onSetBetAmount,
  onSetPayChannel,
  onConfirmBet,
}: GuessDetailOverlaysProps) {
  const activeOption = guess.options[selectedOption];
  const activeStat = optionStats[selectedOption];
  const optionColor = selectedOption === 0 ? '#ff6b9d' : selectedOption === 1 ? '#536dfe' : '#ce93d8';
  const productName = guess.product.name;
  const unitPrice = guess.product.price;

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
                  <span className={styles.shareIcon} style={{ background: item.color }}><i className={item.icon} /></span>
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
            <div className={styles.betHeader}>
              <h3>🎰 竞猜下单</h3>
              <button type="button" onClick={onCloseBet}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.betOptionCard}>
              <div className={styles.betOptionColor} style={{ background: optionColor }} />
              <div className={styles.betOptionMain}>
                <div className={styles.betOptionLine}>
                  <span className={styles.betMuted}>预测: {activeOption?.optionText || ''}</span>
                </div>
                <p>{activeStat?.percent || 0}% 选择 · {activeOption?.voteCount || 0}人投票</p>
              </div>
              <strong className={styles.betOdds}>×{(activeOption?.odds || 1).toFixed(2)}</strong>
            </div>
            <div className={styles.betProductRow}>
              <div className={styles.betProductImgWrap}>
                <img src={guess.product.img} alt={guess.product.name} />
                <div className={styles.betImgTag}>
                  {productName.length > 8 ? `${productName.slice(0, 8)}…` : productName}
                </div>
              </div>
              <div className={styles.betProductRight}>
                <div className={styles.betQtyLabel}>
                  <i className="fa-solid fa-box" />
                  竞猜产品数量
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
                  <div className={styles.betStepper}>
                    <button className={betAmount <= 1 ? styles.betStepperDisabled : ''} type="button" onClick={() => onSetBetAmount(Math.max(1, betAmount - 1))}>
                      −
                    </button>
                    <input
                      className={styles.betStepperValue}
                      type="number"
                      min={1}
                      max={999}
                      value={betAmount}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isNaN(next)) return;
                        onSetBetAmount(Math.min(999, Math.max(1, Math.floor(next))));
                      }}
                    />
                    <span className={styles.betStepperUnit}>件</span>
                    <button className={betAmount >= 999 ? styles.betStepperDisabled : ''} type="button" onClick={() => onSetBetAmount(Math.min(999, betAmount + 1))}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.betSummary}>
              <div className={styles.betRow}>
                <span className={styles.betLabel}>竞猜数量</span>
                <span className={styles.betVal}>{betAmount}件 {productName}</span>
              </div>
              <div className={styles.betRow}>
                <span className={styles.betLabel}>合计金额</span>
                <span className={styles.betVal}>¥{(unitPrice * betAmount).toFixed(2)}</span>
              </div>
              <div className={`${styles.betRow} ${styles.betRowHighlight}`}>
                <span className={styles.betLabel}>🎁 猜中可获得</span>
                <span className={styles.betWin}>
                  {Math.round(betAmount * (activeOption?.odds || 1))}件{productName} · 价值¥{(unitPrice * betAmount * (activeOption?.odds || 1)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className={styles.payChannelRow}>
              <button
                type="button"
                className={`${styles.payChannelOption} ${payChannel === 'wechat' ? styles.payChannelActive : ''}`}
                onClick={() => onSetPayChannel('wechat')}
              >
                <i className="fa-brands fa-weixin" style={{ color: '#1aad19' }} />
                <span>微信支付</span>
                {payChannel === 'wechat' ? <i className="fa-solid fa-check" /> : null}
              </button>
              <button
                type="button"
                className={`${styles.payChannelOption} ${payChannel === 'alipay' ? styles.payChannelActive : ''}`}
                onClick={() => onSetPayChannel('alipay')}
              >
                <i className="fa-brands fa-alipay" style={{ color: '#1677ff' }} />
                <span>支付宝</span>
                {payChannel === 'alipay' ? <i className="fa-solid fa-check" /> : null}
              </button>
            </div>
            <button
              className={styles.betConfirm}
              type="button"
              disabled={betSubmitting}
              onClick={onConfirmBet}
            >
              {betSubmitting ? '提交中…' : `立即支付 ¥${(unitPrice * betAmount).toFixed(2)}`}
            </button>
            <div className={styles.betFooterText}>🎁赢方瓜分输方商品 · 🎫没猜中退补偿券 · 🤝支持好友PK</div>
          </section>
        </div>
      ) : null}
    </>
  );
}
