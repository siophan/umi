'use client';

import type { RefObject } from 'react';
import { type GuessOption } from '@umi/shared';

import { formatEndTime } from './guess-detail-helpers';
import styles from './page.module.css';

type GuessBattleOption = GuessOption & {
  percent: number;
  tone: string;
};

type GuessBattlePanelProps = {
  title: string;
  options: GuessBattleOption[];
  displayVotes: number[];
  breathing: boolean;
  totalVotes: number;
  topicBadge: string;
  endTime: string;
  onSelectOption: (index: number) => void;
  onParticipateClick: () => void;
  vsAreaRef: RefObject<HTMLDivElement | null>;
};

export function GuessBattlePanel({
  title,
  options,
  displayVotes,
  breathing,
  totalVotes,
  topicBadge,
  endTime,
  onSelectOption,
  onParticipateClick,
  vsAreaRef,
}: GuessBattlePanelProps) {
  return (
    <>
      <section className={styles.pkPanel}>
        <h2 className={styles.pkTitle}>
          <span className={styles.pkTitleIcon}>🎲</span>
          {title}
        </h2>
        <div className={styles.dpBarWrap}>
          <div className={styles.dpBarLabels}>
            {options.map((option) => (
              <div className={styles.dblItem} key={`label-${option.id}`} style={{ width: `${Math.max(option.percent, 3)}%` }}>
                <span className={styles.dblName}>{option.optionText}</span>
              </div>
            ))}
          </div>
          <div className={styles.dpBarOuter}>
            <div className={styles.dpBar}>
              {options.map((option, index) => (
                <div
                  className={`${styles.dbSeg} ${styles[`dbSeg${index}` as keyof typeof styles]}`}
                  key={`seg-${option.id}`}
                  style={{ width: `${displayVotes[index]}%` }}
                >
                  {displayVotes[index] >= 15 ? `${option.percent}%` : ''}
                </div>
              ))}
            </div>
            {displayVotes.slice(0, -1).map((_, index) => {
              const offset = displayVotes.slice(0, index + 1).reduce((sum, value) => sum + value, 0);
              return (
                <div className={styles.barClash} key={`clash-${index}`} style={{ left: `${offset}%` }}>
                  <div className={styles.clashGlow} />
                  <div className={styles.clashRing} />
                  <div className={styles.clashBolt}>⚡</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.betGuideHint}>
          <i className={`fa-solid fa-angle-down ${styles.ghArrow}`} />
          点击下方选项即可参与竞猜
          <i className={`fa-solid fa-angle-down ${styles.ghArrow}`} />
        </div>
        <div className={styles.vsRow} ref={vsAreaRef}>
          {options.map((option, index) => (
            <article
              className={`${styles.optionPill} ${option.tone} ${breathing ? styles.breathing : ''}`}
              key={option.id}
              onClick={() => onSelectOption(index)}
            >
              <div className={styles.optionFill} style={{ width: `${option.percent}%` }} />
              <div className={styles.optionContent}>
                <div className={styles.optionName}>{option.optionText}</div>
                <div className={styles.optionPercent}>{option.percent}%</div>
                <div className={styles.optionMeta}>
                  <span>{option.odds.toFixed(2)} 倍</span>
                  <span>{option.voteCount} 票</span>
                </div>
              </div>
              {index === 0 ? <div className={styles.vsBadge}>VS</div> : null}
            </article>
          ))}
        </div>

        <div className={styles.participantsRow}>
          <span className={styles.participantBadge}>{totalVotes}人参与</span>
          <span className={styles.participantText}>共 {options.length} 个竞猜选项</span>
        </div>
      </section>

      <section className={styles.topicCard}>
        <div className={styles.topicHeader}>
          <div className={styles.topicLabel}><i className="fa-solid fa-scroll" /> 话题详情</div>
          <span className={styles.topicBadge}>{topicBadge}</span>
        </div>
        <p className={styles.topicText}>
          竞猜背景说明待补充，当前页仅展示真实竞猜标题、商品、选项、赔率、票数和结束时间。
        </p>
        <div className={styles.topicMeta}>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-users" /> {totalVotes}人参与</span>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-clock" /> {formatEndTime(endTime)}</span>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-fire" /> {topicBadge || '热门'}</span>
        </div>
      </section>

      <section className={styles.descBlock}>
        <p>
          当前详情页已对齐真实竞猜数据；收藏和评论功能仍待接入，因此这里不再展示本地演示态统计或互动结果。
        </p>
      </section>

      <section className={styles.commentsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>评论</div>
          <span className={styles.sectionMore}>待接入</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <div className={styles.emptyTitle}>评论功能待接入</div>
          <div className={styles.emptyDesc}>当前页不再展示演示评论，也不会再用本地状态伪装评论互动。</div>
        </div>
      </section>

      <section className={styles.rulesCard}>
        <h3>📋 竞猜规则</h3>
        <div className={styles.ruleItem}>
          <span>🎉</span>
          <div className={styles.ruleText}>
            <b>猜中</b>：商品直接发货
          </div>
        </div>
        <div className={styles.ruleItem}>
          <span>🎫</span>
          <div className={styles.ruleText}>
            <b className={styles.ruleWarn}>没猜中</b>：自动获得竞猜补偿券
          </div>
        </div>
        <div className={styles.ruleItem}>
          <span>🤝</span>
          <div className={styles.ruleText}>
            <b className={styles.ruleCyan}>好友PK</b>：输的请客赢的提货
          </div>
        </div>
        <div className={styles.ruleItem}>
          <span>📊</span>
          <div className={styles.ruleText}>支持率根据投票人数实时变化</div>
        </div>
      </section>

      <section className={styles.detailBottom}>
        <button className={styles.detailPrimary} type="button" onClick={onParticipateClick}>
          <i className="fa-solid fa-hand-pointer" />
          <span>参与竞猜</span>
          <small>· 猜中即发货</small>
        </button>
      </section>
    </>
  );
}
