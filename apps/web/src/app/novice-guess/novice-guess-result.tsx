'use client';

import { formatPrice, STREAK_REWARDS, type ProductReward, type QuestionItem } from './novice-guess-helpers';
import styles from './page.module.css';

type NoviceGuessResultProps = {
  isLose: boolean;
  isFullWin: boolean;
  wins: number;
  question: QuestionItem;
  wonProducts: ProductReward[];
  totalPrize: number;
  brandDate: string;
  onShare: () => void;
  onExplore: () => void;
  onRegister: () => void;
};

export function NoviceGuessResult({
  isLose,
  isFullWin,
  wins,
  question,
  wonProducts,
  totalPrize,
  brandDate,
  onShare,
  onExplore,
  onRegister,
}: NoviceGuessResultProps) {
  return (
    <section className={styles.phaseResult}>
      {isLose ? (
        <div className={styles.resultBody}>
          <div className={styles.resultHero}>
            <div className={styles.modalPrizeIcon}>😢</div>
            <div className={styles.loseTitle}>这次差一点</div>
            <div className={styles.loseSub}>别灰心，继续体验下一轮，后面的演示内容还在等你。</div>
          </div>

          <div className={styles.challengeCard}>
            <div className={styles.challengeTitle}>连胜奖励进度</div>
            <div className={styles.challengeSub}>
              正确答案是「{question.options[question.correct]}」
              <br />
              没关系，这里仍是新手体验模式。
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
              当前页面仅作演示，结果不会进入真实账户或仓库。
            </div>
          </div>

          <div className={styles.revivalBox}>
            <div className={styles.revivalTitle}>🔄 继续体验</div>
            <div className={styles.revivalDesc}>
              连胜中断，但你仍可以继续体验：
              <br />
              • 分享演示战绩 → 生成体验海报
              <br />
              • 返回功能页 → 探索更多真实能力
            </div>
            <div className={styles.revivalButtons}>
              <button className={styles.revivalPrimary} type="button" onClick={onShare}>
                📤 分享战绩
              </button>
              <button className={styles.revivalGhost} type="button" onClick={onExplore}>
                继续逛逛
              </button>
            </div>
          </div>
          <div className={styles.loginHint}>
            去 <button className={styles.inlineLink} type="button" onClick={onRegister}>登录</button> 后体验真实业务页面。
          </div>
        </div>
      ) : (
        <div className={`${styles.resultBody} ${styles.winScroll}`}>
          <div className={styles.winHero}>
            <div className={styles.winGlow} />
            <div className={styles.winRays}>
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} className={styles.winRay} style={{ transform: `translate(-50%, -60%) rotate(${index * 36}deg)` }} />
              ))}
            </div>
            <div className={styles.winTrophy}>{isFullWin ? '🏆' : '🎉'}</div>
            <div className={`${styles.winTitle} ${isFullWin ? styles.full : styles.partial}`}>{isFullWin ? '🔥 全部猜中！' : `恭喜猜中 ${wins} 题！`}</div>
            <div className={styles.winTagline}>当前展示的是体验奖励，不会发放到真实账户</div>
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
                  <div className={styles.lootStatus}>✅ 体验模式已点亮</div>
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
            <span className={styles.brandText}>先熟悉猜题体验</span>
            <span className={styles.brandDot} />
            <span className={styles.brandText}>{brandDate}</span>
          </div>

          <div className={styles.challengeCard}>
            <div className={styles.challengeTitle}>连续奖励进度</div>
            <div className={styles.challengeSub}>继续完成后续题目，可把剩下的体验奖励一起点亮。</div>
            <div className={styles.challengeList}>
              {STREAK_REWARDS.map((item, index) => {
                const stateClass = index < wins ? styles.challengeDone : index === wins ? styles.challengeNext : styles.challengeLocked;
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
              当前页是静态体验页，奖励和结果都不会进入真实账户。
            </div>
          </div>

          <div className={styles.resultActions}>
            <button className={styles.primaryAction} type="button" onClick={onExplore}>
              <span className={styles.buttonShine} />
              探索更多竞猜话题
              <span className={styles.ctaArrow}>→</span>
            </button>
            <div className={styles.secondaryRow}>
              <button className={styles.secondaryAction} type="button" onClick={onShare}>
                晒战绩
              </button>
              <button className={styles.secondaryAction} type="button" onClick={onExplore}>
                继续体验
              </button>
            </div>
            <div className={styles.loginHint}>
              去 <button className={styles.inlineLink} type="button" onClick={onRegister}>登录</button> 后体验真实业务链路。
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
