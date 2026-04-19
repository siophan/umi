'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import type { CommunityFeedItem, CommunityPostDetailResult } from '@joy/shared';

import {
  bookmarkCommunityPost,
  createCommunityComment,
  fetchCommunityPost,
  likeCommunityComment,
  likeCommunityPost,
  repostCommunityPost,
  unbookmarkCommunityPost,
  unlikeCommunityComment,
  unlikeCommunityPost,
} from '../../../lib/api';
import styles from './page.module.css';

const TAG_CLS_MAP: Record<string, string> = {
  品牌竞猜: styles.tagBrand,
  猜友动态: styles.tagGuess,
  品牌资讯: styles.tagBrand,
  零食测评: styles.tagHot,
  PK战报: styles.tagGuess,
  平台公告: styles.tagBrand,
  店铺动态: styles.tagHot,
  店铺推荐: styles.tagHot,
  转发: styles.tagGuess,
};

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return '刚刚';
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.max(1, Math.floor(diff / day))}天前`;
  }
  return new Date(value).toISOString().slice(0, 10);
}

function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

function guessLabel(post: CommunityFeedItem) {
  return post.tag?.trim() || '猜友动态';
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = String(params?.id || '').trim();
  const [detail, setDetail] = useState<CommunityPostDetailResult | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [likeSaving, setLikeSaving] = useState(false);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentLikeSavingId, setCommentLikeSavingId] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [repostOpen, setRepostOpen] = useState(false);
  const [repostDraft, setRepostDraft] = useState('转发动态');
  const [repostSaving, setRepostSaving] = useState(false);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Record<string, boolean>>({});
  const commentsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchCommunityPost(postId);
        if (ignore) {
          return;
        }
        setDetail(result);
        setError('');
      } catch (loadError) {
        if (ignore) {
          return;
        }
        setDetail(null);
        setError(loadError instanceof Error ? loadError.message : '动态加载失败');
      } finally {
        if (!ignore) {
          setReady(true);
        }
      }
    }

    if (!postId) {
      setReady(true);
      setError('动态不存在');
      return;
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [postId]);

  const post = detail?.post ?? null;
  const imageClass = useMemo(() => {
    if (!post) {
      return styles.img1;
    }
    if (post.images.length === 1) return styles.img1;
    if (post.images.length === 2) return styles.img2;
    return styles.img3;
  }, [post]);

  async function handleToggleLike() {
    if (!post || likeSaving) {
      return;
    }

    const previous = post.liked;
    const previousLikes = post.likes;
    setLikeSaving(true);
    setDetail((current) =>
      current
        ? {
            ...current,
            post: {
              ...current.post,
              liked: !current.post.liked,
              likes: current.post.likes + (current.post.liked ? -1 : 1),
            },
          }
        : current,
    );

    try {
      if (previous) {
        await unlikeCommunityPost(post.id);
      } else {
        await likeCommunityPost(post.id);
      }
    } catch {
      setDetail((current) =>
        current
          ? {
              ...current,
              post: {
                ...current.post,
                liked: previous,
                likes: previousLikes,
              },
            }
          : current,
      );
    } finally {
      setLikeSaving(false);
    }
  }

  async function handleToggleBookmark() {
    if (!post || bookmarkSaving) {
      return;
    }

    const previous = post.bookmarked;
    setBookmarkSaving(true);
    setDetail((current) =>
      current
        ? {
            ...current,
            post: {
              ...current.post,
              bookmarked: !current.post.bookmarked,
            },
          }
        : current,
    );

    try {
      if (previous) {
        await unbookmarkCommunityPost(post.id);
      } else {
        await bookmarkCommunityPost(post.id);
      }
    } catch {
      setDetail((current) =>
        current
          ? {
              ...current,
              post: {
                ...current.post,
                bookmarked: previous,
              },
            }
          : current,
      );
    } finally {
      setBookmarkSaving(false);
    }
  }

  async function handleSubmitComment() {
    if (!post || commentSaving) {
      return;
    }
    const content = comment.trim();
    if (!content) {
      return;
    }

    try {
      setCommentSaving(true);
      const created = await createCommunityComment(post.id, {
        content,
        parentId: replyTo?.id ?? null,
      });
      setDetail((current) =>
        current
          ? {
              ...current,
              post: {
                ...current.post,
                comments: current.post.comments + 1,
              },
              comments: replyTo
                ? current.comments.map((item) =>
                    item.id === replyTo.id
                      ? { ...item, replies: [...(item.replies ?? []), created] }
                      : item,
                  )
                : [created, ...current.comments],
            }
          : current,
      );
      setComment('');
      setReplyTo(null);
    } catch {
      // Keep the UI quiet here; the page already blocks duplicate submits and will stay editable.
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleToggleCommentLike(commentId: string) {
    if (commentLikeSavingId) {
      return;
    }

    let previousLiked = false;
    let previousLikes = 0;

    setDetail((current) => {
      if (!current) {
        return current;
      }

      const nextComments = current.comments.map((item) => {
        if (item.id !== commentId) {
          return item;
        }
        previousLiked = item.liked;
        previousLikes = item.likes;
        return {
          ...item,
          liked: !item.liked,
          likes: item.likes + (item.liked ? -1 : 1),
        };
      });

      return {
        ...current,
        comments: nextComments,
      };
    });

    try {
      setCommentLikeSavingId(commentId);
      if (previousLiked) {
        await unlikeCommunityComment(commentId);
      } else {
        await likeCommunityComment(commentId);
      }
    } catch {
      setDetail((current) =>
        current
          ? {
              ...current,
              comments: current.comments.map((item) =>
                item.id === commentId
                  ? {
                      ...item,
                      liked: previousLiked,
                      likes: previousLikes,
                    }
                  : item,
              ),
            }
          : current,
      );
    } finally {
      setCommentLikeSavingId('');
    }
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
        </header>
        <section className={styles.related}>
          <div className={styles.relatedTitle}>
            <span><i className="fa-solid fa-spinner fa-spin" /></span> 动态加载中
          </div>
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
        </header>
        <section className={styles.related}>
          <div className={styles.relatedTitle}>
            <span><i className="fa-solid fa-triangle-exclamation" /></span> {error || '动态不存在'}
          </div>
        </section>
      </main>
    );
  }

  const tagClass = TAG_CLS_MAP[guessLabel(post)] ?? styles.tagGuess;
  const comments = detail?.comments ?? [];
  const related = detail?.related ?? [];

  function openRepostComposer() {
    setShareOpen(false);
    setRepostDraft('转发动态');
    setRepostOpen(true);
  }

  function closeRepostComposer() {
    if (repostSaving) {
      return;
    }
    setRepostOpen(false);
    setRepostDraft('转发动态');
  }

  async function handleRepostFromDetail() {
    if (!post || repostSaving) {
      return;
    }

    try {
      setRepostSaving(true);
      await repostCommunityPost(post.id, {
        content: repostDraft.trim() || '转发动态',
        scope: 'public',
      });
      setDetail((current) =>
        current
          ? {
              ...current,
              post: {
                ...current.post,
                shares: current.post.shares + 1,
              },
            }
          : current,
      );
      setRepostOpen(false);
      setRepostDraft('转发动态');
    } catch {
      // noop
    } finally {
      setRepostSaving(false);
    }
  }

  function toggleReplyThread(commentId: string) {
    setExpandedReplyIds((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
  }

  function handleSaveImage() {
    if (!post?.images.length) {
      return;
    }
    const link = document.createElement('a');
    link.href = post.images[0];
    link.download = `post-${post.id}-image`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.headerTitle}>{post.title || '动态详情'}</div>
        <button className={styles.moreBtn} type="button" onClick={() => setShareOpen(true)}>
          <i className="fa-solid fa-ellipsis" />
        </button>
      </header>

      <article className={styles.card}>
        <div className={styles.cardAuthor}>
          <img src={post.author.avatar || '/legacy/images/mascot/mouse-main.png'} alt={post.author.name} />
          <div className={styles.cardAuthorInfo}>
            <div className={styles.cardAuthorName}>
              {post.author.name}
              {post.author.verified ? <span><i className="fa-solid fa-circle-check" /></span> : null}
            </div>
            <div className={styles.cardAuthorMeta}>
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.location ? (
                <span className={styles.cardAuthorLoc}>
                  <i className="fa-solid fa-location-dot" />
                  {post.location}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {post.title ? <h1 className={styles.title}>{post.title}</h1> : null}
          <p className={styles.text}>{post.desc}</p>
          <div className={styles.tags}>
            <span className={tagClass}>{guessLabel(post)}</span>
            {post.scope !== 'public' ? <span className={styles.tagHot}>{post.scope === 'followers' ? '粉丝可见' : '仅自己'}</span> : null}
          </div>
        </div>

        {post.images.length ? (
          <div className={styles.images}>
            <div className={imageClass}>
              {post.images.map((img) => (
                <img src={img} alt={post.title} key={img} />
              ))}
            </div>
          </div>
        ) : null}

        {post.guessInfo ? (
          <section className={styles.guessBar}>
            <div className={styles.guessHead}>
              <div className={styles.guessTitle}>关联竞猜</div>
              <span className={styles.guessCount}>{formatCount(post.guessInfo.participants)}人参与</span>
            </div>
            <div className={styles.guessOptions}>
              {post.guessInfo.options.map((item, index) => (
                <button className={styles.guessOption} key={item} type="button" onClick={() => router.push(`/guess/${post.guessInfo?.id}`)}>
                  <div className={styles.guessName}>{item}</div>
                  <div className={styles.guessBarWrap}>
                    <span style={{ width: `${post.guessInfo?.pcts[index] ?? 0}%` }} />
                  </div>
                  <div className={styles.guessPct}>{post.guessInfo?.pcts[index] ?? 0}%</div>
                </button>
              ))}
            </div>
            <div className={styles.guessCta}>
              <Link href={`/guess/${post.guessInfo.id}`}>去参与竞猜 <i className="fa-solid fa-arrow-right" /></Link>
            </div>
          </section>
        ) : null}

        <section className={styles.interact}>
          <button className={`${styles.interactItem} ${post.liked ? styles.active : ''}`} type="button" disabled={likeSaving} onClick={() => void handleToggleLike()}>
            <i className={`${post.liked ? 'fa-solid' : 'fa-regular'} fa-heart`} /> <span>{formatCount(post.likes)}</span>
          </button>
          <button className={styles.interactItem} type="button" onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <i className="fa-regular fa-comment" /> <span>{formatCount(comments.length)}</span>
          </button>
          <button className={styles.interactItem} type="button" onClick={() => setShareOpen(true)}>
            <i className="fa-solid fa-share-nodes" /> <span>{formatCount(post.shares)}</span>
          </button>
          <button className={`${styles.interactItem} ${post.bookmarked ? styles.faved : ''}`} type="button" disabled={bookmarkSaving} onClick={() => void handleToggleBookmark()}>
            <i className={`${post.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark`} />
          </button>
        </section>
      </article>

      <section className={styles.comments} ref={commentsRef}>
        <div className={styles.commentsHeader}>
          <div>
            <span className={styles.commentsTitle}>评论</span>
            <span className={styles.commentsCount}>{comments.length} 条</span>
          </div>
          <button className={styles.sortBtn} type="button">
            <i className="fa-solid fa-arrow-down-wide-short" /> 最热
          </button>
        </div>
        {comments.length ? comments.map((item) => (
          <article className={styles.comment} key={item.id}>
            <img className={styles.commentAvatar} src={item.authorAvatar || '/legacy/images/mascot/mouse-main.png'} alt={item.authorName} />
            <div className={styles.commentBody}>
              <div className={styles.commentTop}>
                <div className={styles.commentName}>{item.authorName}</div>
                <div className={styles.commentTime}>{formatRelativeTime(item.createdAt)}</div>
              </div>
              <div className={styles.commentText}>{item.content}</div>
              <div className={styles.commentActions}>
                <span onClick={() => setReplyTo({ id: item.id, name: item.authorName })}>回复</span>
              </div>
              {item.replies?.length ? (
                <div className={styles.replies}>
                  {(expandedReplyIds[item.id] ? item.replies : item.replies.slice(0, 2)).map((reply) => (
                    <div className={styles.reply} key={reply.id}>
                      <div className={styles.replyHead}>
                        <span>{reply.authorName}</span>
                        <em>回复</em>
                      </div>
                      <div className={styles.replyText}>{reply.content}</div>
                      <div className={styles.replyMeta}>{formatRelativeTime(reply.createdAt)}</div>
                    </div>
                  ))}
                  {item.replies.length > 2 ? (
                    <button className={styles.replyMore} type="button" onClick={() => toggleReplyThread(item.id)}>
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
              onClick={() => void handleToggleCommentLike(item.id)}
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

      <section className={styles.related}>
        <div className={styles.relatedTitle}>
          <span><i className="fa-solid fa-sparkles" /></span> 相关推荐
        </div>
        <div className={styles.relatedList}>
          {related.length ? related.map((item) => (
            <Link className={styles.relatedItem} href={`/post/${item.id}`} key={item.id}>
              {item.images.length ? (
                <img className={styles.relatedThumb} src={item.images[0]} alt={item.title} />
              ) : (
                <div className={styles.relatedFallback}>
                  <i className="fa-solid fa-fire" />
                </div>
              )}
              <div className={styles.relatedInfo}>
                <div className={styles.relatedName}>{item.title}</div>
                <div className={styles.relatedMeta}>{item.author.name} · {formatCount(item.likes)}赞</div>
              </div>
            </Link>
          )) : (
            <div className={styles.relatedMeta}>暂无更多相关推荐</div>
          )}
        </div>
      </section>

      <footer className={styles.inputBar}>
        {replyTo ? (
          <div className={styles.replyHint}>
            回复 @{replyTo.name}
            <button type="button" onClick={() => setReplyTo(null)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ) : null}
        <input
          className={styles.input}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="说点什么..."
        />
        <button className={styles.emojiBtn} type="button">
          <i className="fa-regular fa-face-smile" />
        </button>
        <button className={styles.sendBtn} type="button" disabled={!comment.trim() || commentSaving} onClick={() => void handleSubmitComment()}>
          {commentSaving ? '发送中' : '发送'}
        </button>
      </footer>

      {shareOpen ? (
        <div className={styles.shareOverlay} onClick={() => setShareOpen(false)} role="presentation">
          <section className={styles.sharePanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.shareGrab} />
            <div className={styles.shareTitle}>分享到</div>
            <div className={styles.shareGrid}>
              {[
                { label: '微信', icon: 'fa-brands fa-weixin', bg: '#07C160', fg: '#fff' },
                { label: '朋友圈', icon: 'fa-solid fa-circle-nodes', bg: '#07C160', fg: '#fff' },
                { label: 'QQ', icon: 'fa-brands fa-qq', bg: '#12B7F5', fg: '#fff' },
                { label: '微博', icon: 'fa-brands fa-weibo', bg: '#E6162D', fg: '#fff' },
                { label: '复制链接', icon: 'fa-solid fa-link', bg: '#f0f0f0', fg: '#666' },
                { label: '举报', icon: 'fa-solid fa-flag', bg: '#f0f0f0', fg: '#666' },
                { label: '收藏', icon: 'fa-solid fa-bookmark', bg: '#FFF3E0', fg: '#FF9800' },
                { label: '保存图片', icon: 'fa-solid fa-download', bg: '#f0f0f0', fg: '#666' },
              ].map((item) => (
                <button
                  className={styles.shareItem}
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.label === '复制链接') {
                      void navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                      setShareOpen(false);
                      return;
                    }
                    if (item.label === '收藏') {
                      void handleToggleBookmark();
                      setShareOpen(false);
                      return;
                    }
                    if (item.label === '保存图片') {
                      handleSaveImage();
                      setShareOpen(false);
                    }
                  }}
                >
                  <span className={styles.shareItemIcon} style={{ background: item.bg, color: item.fg }}><i className={item.icon} /></span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>
            <button className={styles.shareCancelBtn} type="button" onClick={() => setShareOpen(false)}>
              取消
            </button>
          </section>
        </div>
      ) : null}

      {repostOpen ? (
        <div className={styles.shareOverlay} onClick={closeRepostComposer} role="presentation">
          <section className={styles.sharePanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.shareGrab} />
            <div className={styles.shareTitle}>转发动态</div>
            <div className={styles.repostLead}>
              <span className={styles.repostLeadIcon}>
                <i className="fa-solid fa-retweet" />
              </span>
              <div className={styles.repostLeadText}>
                <strong>转发到猜友圈</strong>
                <span>让朋友知道这条动态为什么值得看。</span>
              </div>
            </div>
            <div className={styles.repostSummary}>
              <div className={styles.repostSummaryLabel}>原动态</div>
              <div className={styles.repostSummaryTitle}>{post.title || '未命名动态'}</div>
              <div className={styles.repostSummaryMeta}>作者 · {post.author.name}</div>
            </div>
            <div className={styles.repostField}>
              <textarea
                autoFocus
                className={styles.repostTextarea}
                placeholder="这一条我为什么想转发？"
                value={repostDraft}
                onChange={(event) => setRepostDraft(event.target.value)}
              />
              <div className={styles.repostFieldMeta}>
                <span>公开发布，所有人可见</span>
                <span>{repostDraft.trim().length} 字</span>
              </div>
            </div>
            <div className={styles.repostActions}>
              <button className={styles.cancelBtn} type="button" onClick={closeRepostComposer}>
                取消
              </button>
              <button className={styles.repostSubmitBtn} type="button" disabled={repostSaving} onClick={() => void handleRepostFromDetail()}>
                {repostSaving ? '转发中' : '确认转发'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
