'use client';

import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { type GuessCommentSummary, type GuessOption } from '@umi/shared';

import { getDaysToEnd } from './guess-detail-helpers';
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
  topicDetail?: string | null;
  description?: string | null;
  tags?: string[];
  comments: GuessCommentSummary[];
  commentCount: number;
  commentsLoading: boolean;
  commentSubmitting: boolean;
  onSelectOption: (index: number) => void;
  onParticipateClick: () => void;
  onPostComment: (content: string) => Promise<void> | void;
  onToggleCommentLike: (commentId: string, liked: boolean) => Promise<void> | void;
  vsAreaRef: RefObject<HTMLDivElement | null>;
};

function formatCommentTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}天前`;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function GuessBattlePanel({
  title,
  options,
  displayVotes,
  breathing,
  totalVotes,
  topicBadge,
  endTime,
  topicDetail,
  description,
  tags,
  comments,
  commentCount,
  commentsLoading,
  commentSubmitting,
  onSelectOption,
  onParticipateClick,
  onPostComment,
  onToggleCommentLike,
  vsAreaRef,
}: GuessBattlePanelProps) {
  const [draft, setDraft] = useState('');

  async function submitDraft() {
    const content = draft.trim();
    if (!content || commentSubmitting) return;
    await onPostComment(content);
    setDraft('');
  }

  const [topicExpanded, setTopicExpanded] = useState(false);
  const displayTopicText = topicDetail?.trim() || description?.trim() || `${title} 正在进行中，围绕「${topicBadge || '热门竞猜'}」展开投票。`;
  const topicMetaLabel = useMemo(() => {
    const firstTag = tags?.find(Boolean);
    return firstTag || topicBadge || '热门';
  }, [tags, topicBadge]);

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
          {options.flatMap((option, index) => {
            const nodes = [
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
                    <span>
                      <i className="fa-solid fa-users" /> {option.voteCount}人
                    </span>
                    <span className={styles.fpOdds}>×{option.odds.toFixed(2)}</span>
                  </div>
                </div>
              </article>,
            ];
            if (index < options.length - 1) {
              nodes.push(
                <div className={styles.vsBadge} key={`vs-${option.id}`}>
                  VS
                </div>,
              );
            }
            return nodes;
          })}
        </div>

        <div className={styles.participantsRow}>
          <span className={styles.participantText}>{totalVotes}人参与中</span>
        </div>
      </section>

      <section className={styles.topicCard}>
        <div className={styles.topicHeader}>
          <div className={styles.topicLabel}><i className="fa-solid fa-scroll" /> 话题详情</div>
          <span className={styles.topicBadge}>{topicBadge}</span>
        </div>
        <p className={`${styles.topicText} ${topicExpanded ? styles.topicTextExpanded : ''}`}>{displayTopicText}</p>
        <button className={styles.topicToggle} type="button" onClick={() => setTopicExpanded((value) => !value)}>
          {topicExpanded ? '收起' : '展开全文'}{' '}
          <i className={`fa-solid fa-chevron-down ${topicExpanded ? styles.topicToggleExpanded : ''}`} />
        </button>
        <div className={styles.topicMeta}>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-users" /> {totalVotes}人参与</span>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-clock" /> 距结束{getDaysToEnd(endTime)}天</span>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-fire" /> {topicMetaLabel}</span>
        </div>
      </section>

      <section className={styles.descBlock}>
        <p>{description?.trim() || '参与竞猜，猜中即可获得商品发货！'}</p>
      </section>

      <div className={styles.dividerThick} />
      <div className={styles.dividerThick} />
      <section className={styles.commentsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>热门评论</div>
          <span className={styles.sectionMore}>{commentCount}条评论</span>
        </div>
        <div className={styles.commentsList}>
          {commentsLoading ? (
            <div className={styles.commentsEmpty}>加载中…</div>
          ) : comments.length === 0 ? (
            <div className={styles.commentsEmpty}>暂无评论，快来抢沙发</div>
          ) : (
            comments.map((c) => (
              <div className={styles.commentItem} key={c.id}>
                <img
                  src={c.authorAvatar || '/legacy/images/mascot/mouse-main.png'}
                  alt={c.authorName}
                />
                <div className={styles.commentBody}>
                  <div className={styles.commentAuthor}>{c.authorName}</div>
                  <div className={styles.commentText}>{c.content}</div>
                  <div className={styles.commentActions}>
                    <span>{formatCommentTime(c.createdAt)}</span>
                    <button
                      className={`${styles.likeBtn} ${c.liked ? styles.likeBtnLiked : ''}`}
                      type="button"
                      onClick={() => {
                        void onToggleCommentLike(c.id, !c.liked);
                      }}
                    >
                      <i className={c.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} /> {c.likes}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={styles.commentInputBar}>
          <input
            type="text"
            placeholder="说说你的看法..."
            maxLength={500}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submitDraft();
              }
            }}
          />
          <button
            type="button"
            disabled={commentSubmitting || !draft.trim()}
            onClick={() => {
              void submitDraft();
            }}
          >
            {commentSubmitting ? '发送中...' : '发送'}
          </button>
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
