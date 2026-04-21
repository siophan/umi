'use client';

import type { CommunityCommentSort, CommunityPostDetailResult } from '@umi/shared';
import type { RefObject } from 'react';

import { EMOJIS, findTopLevelCommentIdByReplyId, formatRelativeTime, type ReplyTarget } from './post-detail-helpers';
import styles from './page.module.css';

type PostDetailCommentsProps = {
  detailComments: CommunityPostDetailResult['comments'];
  totalCommentCount: number;
  commentSort: CommunityCommentSort;
  expandedReplyIds: Record<string, boolean>;
  commentLikeSavingId: string;
  comment: string;
  commentSaving: boolean;
  emojiOpen: boolean;
  commentsRef: RefObject<HTMLElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  onChangeSort: () => void;
  onOpenUser: (uid: string) => void;
  onReply: (replyTo: ReplyTarget, prefix: string) => void;
  onToggleReplyThread: (commentId: string) => void;
  onToggleCommentLike: (commentId: string) => void;
  onCommentChange: (value: string) => void;
  onToggleEmoji: () => void;
  onInsertEmoji: (emoji: string) => void;
  onSubmitComment: () => void;
};

export function PostDetailComments({
  detailComments,
  totalCommentCount,
  commentSort,
  expandedReplyIds,
  commentLikeSavingId,
  comment,
  commentSaving,
  emojiOpen,
  commentsRef,
  inputRef,
  onChangeSort,
  onOpenUser,
  onReply,
  onToggleReplyThread,
  onToggleCommentLike,
  onCommentChange,
  onToggleEmoji,
  onInsertEmoji,
  onSubmitComment,
}: PostDetailCommentsProps) {
  return (
    <>
      <section className={styles.comments} ref={commentsRef}>
        <div className={styles.commentsHeader}>
          <div>
            <span className={styles.commentsTitle}>评论</span>
            <span className={styles.commentsCount}>{totalCommentCount} 条</span>
          </div>
          <button className={styles.sortBtn} type="button" onClick={onChangeSort}>
            <i className={`fa-solid ${commentSort === 'hot' ? 'fa-arrow-down-wide-short' : 'fa-arrow-down-short-wide'}`} />
            {commentSort === 'hot' ? '最热' : '最新'}
          </button>
        </div>
        {detailComments.length ? detailComments.map((item) => (
          <article className={styles.comment} key={item.id}>
            <button className={styles.commentAvatarBtn} type="button" onClick={() => onOpenUser(item.authorUid)}>
              <img className={styles.commentAvatar} src={item.authorAvatar || '/legacy/images/mascot/mouse-main.png'} alt={item.authorName} />
            </button>
            <div className={styles.commentBody}>
              <div className={styles.commentTop}>
                <button className={styles.commentNameBtn} type="button" onClick={() => onOpenUser(item.authorUid)}>
                  {item.authorName}
                </button>
                <div className={styles.commentTime}>{formatRelativeTime(item.createdAt)}</div>
              </div>
              <div className={styles.commentText}>{item.content}</div>
              <div className={styles.commentActions}>
                <span onClick={() => onReply({ id: item.id, name: item.authorName }, `回复 @${item.authorName}：`)}>回复</span>
              </div>
              {item.replies?.length ? (
                <div className={styles.replies}>
                  {(expandedReplyIds[item.id] ? item.replies : item.replies.slice(0, 2)).map((reply) => (
                    <div className={styles.reply} key={reply.id}>
                      <div className={styles.replyHead}>
                        <button className={styles.replyNameBtn} type="button" onClick={() => onOpenUser(reply.authorUid)}>
                          {reply.authorName}
                        </button>
                        <em>回复</em>
                      </div>
                      <div className={styles.replyText}>{reply.content}</div>
                      <div className={styles.replyFooter}>
                        <div className={styles.replyMeta}>{formatRelativeTime(reply.createdAt)}</div>
                        <div className={styles.replyActions}>
                          <button
                            className={styles.replyActionBtn}
                            type="button"
                            onClick={() => {
                              const topLevelId = findTopLevelCommentIdByReplyId(detailComments, reply.id);
                              onReply({ id: topLevelId ?? reply.id, name: reply.authorName }, `回复 @${reply.authorName}：`);
                            }}
                          >
                            回复
                          </button>
                          <button
                            className={`${styles.replyLikeBtn} ${reply.liked ? styles.commentLikeActive : ''}`}
                            type="button"
                            disabled={commentLikeSavingId === reply.id}
                            onClick={() => onToggleCommentLike(reply.id)}
                          >
                            <i className={reply.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                            <span>{reply.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {item.replies.length > 2 ? (
                    <button className={styles.replyMore} type="button" onClick={() => onToggleReplyThread(item.id)}>
                      {expandedReplyIds[item.id] ? '收起回复' : '查看全部回复'}
                      <i className={`fa-solid ${expandedReplyIds[item.id] ? 'fa-chevron-up' : 'fa-chevron-right'}`} />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <button
              className={`${styles.commentLike} ${item.liked ? styles.commentLikeActive : ''}`}
              type="button"
              aria-label="评论点赞"
              disabled={commentLikeSavingId === item.id}
              onClick={() => onToggleCommentLike(item.id)}
            >
              <i className={item.liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
              <span>{item.likes}</span>
            </button>
          </article>
        )) : (
          <article className={styles.comment}>
            <div className={styles.commentBody}>
              <div className={styles.commentText}>还没有评论，来抢第一个位置。</div>
            </div>
          </article>
        )}
      </section>

      <footer className={styles.inputBar}>
        <input
          ref={inputRef}
          className={styles.input}
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="说点什么..."
        />
        <button className={styles.emojiBtn} type="button" onClick={onToggleEmoji}>
          <i className="fa-regular fa-face-smile" />
        </button>
        <button className={styles.sendBtn} type="button" disabled={!comment.trim() || commentSaving} onClick={onSubmitComment}>
          {commentSaving ? '发送中' : '发送'}
        </button>
      </footer>

      {emojiOpen ? (
        <div className={styles.emojiPicker}>
          {EMOJIS.map((emoji) => (
            <button className={styles.emojiButton} key={emoji} type="button" onClick={() => onInsertEmoji(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
