'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  CommunityCommentSort,
  CommunityPostDetailResult,
} from '@umi/shared';

import {
  bookmarkCommunityPost,
  createCommunityComment,
  fetchCommunityPost,
  likeCommunityComment,
  likeCommunityPost,
  reportCommunityPost,
  unbookmarkCommunityPost,
  unlikeCommunityComment,
  unlikeCommunityPost,
} from '../../../lib/api/community';
import {
  appendReplyToTree,
  guessLabel,
  mapCommentTree,
  REPORT_REASON_OPTIONS,
  TAG_CLS_MAP,
  type ReplyTarget,
} from './post-detail-helpers';
import styles from './page.module.css';

export function usePostDetailState(postId: string) {
  const [detail, setDetail] = useState<CommunityPostDetailResult | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState('');
  const [likeSaving, setLikeSaving] = useState(false);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentLikeSavingId, setCommentLikeSavingId] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Record<string, boolean>>({});
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>('hot');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<(typeof REPORT_REASON_OPTIONS)[number]['value']>(10);
  const [reportDetail, setReportDetail] = useState('');
  const [reportSaving, setReportSaving] = useState(false);
  const commentsRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(''), 1800);
  }

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchCommunityPost(postId, commentSort);
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
  }, [commentSort, postId]);

  const post = detail?.post ?? null;
  const comments = detail?.comments ?? [];
  const related = detail?.related ?? [];
  const totalCommentCount = post?.comments ?? 0;
  const imageClass = useMemo(() => {
    if (!post) {
      return styles.img1;
    }
    if (post.images.length === 1) return styles.img1;
    if (post.images.length === 2) return styles.img2;
    return styles.img3;
  }, [post]);
  const tagClass = post ? TAG_CLS_MAP[guessLabel(post)] ?? styles.tagGuess : styles.tagGuess;

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
    } catch (error) {
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
      showToast(error instanceof Error ? error.message : '点赞失败');
    } finally {
      setLikeSaving(false);
    }
  }

  async function handleToggleBookmark() {
    if (!post || bookmarkSaving) {
      return false;
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
      return true;
    } catch (error) {
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
      showToast(error instanceof Error ? error.message : '收藏失败');
      return false;
    } finally {
      setBookmarkSaving(false);
    }
  }

  async function handleSubmitComment() {
    if (!post || commentSaving) {
      return;
    }
    const prefix = replyTo ? `回复 @${replyTo.name}：` : '';
    const rawContent = comment.trim();
    const content = replyTo && rawContent.startsWith(prefix)
      ? rawContent.slice(prefix.length).trim()
      : rawContent;
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
                ? appendReplyToTree(current.comments, replyTo.id, created)
                : [created, ...current.comments],
            }
          : current,
      );
      setComment('');
      setReplyTo(null);
      setEmojiOpen(false);
      showToast('评论已发送');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '评论发送失败');
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

      const nextComments = mapCommentTree(current.comments, commentId, (item) => {
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
    } catch (error) {
      setDetail((current) =>
        current
          ? {
              ...current,
              comments: mapCommentTree(current.comments, commentId, (item) => ({
                ...item,
                liked: previousLiked,
                likes: previousLikes,
              })),
            }
          : current,
      );
      showToast(error instanceof Error ? error.message : '评论点赞失败');
    } finally {
      setCommentLikeSavingId('');
    }
  }

  function toggleReplyThread(commentId: string) {
    setExpandedReplyIds((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
  }

  function openReplyInput(target: ReplyTarget) {
    setReplyTo(target);
    setComment(`回复 @${target.name}：`);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSaveImage() {
    if (!post?.images.length) {
      showToast('当前动态暂无图片可保存');
      return;
    }
    const link = document.createElement('a');
    link.href = post.images[0];
    link.download = `post-${post.id}-image`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('图片已保存');
  }

  function insertEmoji(emoji: string) {
    setComment((current) => `${current}${emoji}`);
    inputRef.current?.focus();
  }

  async function handleShareAction(label: string) {
    if (!post) {
      return;
    }

    const url = `${window.location.origin}/post/${post.id}`;
    const title = post.title || '动态详情';
    const text = post.desc || title;

    try {
      if (label === '复制链接') {
        await navigator.clipboard.writeText(url);
        showToast('链接已复制');
        setShareOpen(false);
        return;
      }

      if (label === '收藏') {
        const nextBookmarked = !post.bookmarked;
        const success = await handleToggleBookmark();
        if (success) {
          showToast(nextBookmarked ? '⭐ 收藏成功' : '已取消收藏');
        }
        setShareOpen(false);
        return;
      }

      if (label === '保存图片') {
        handleSaveImage();
        setShareOpen(false);
        return;
      }

      if (label === '举报') {
        setShareOpen(false);
        setReportOpen(true);
        return;
      }

      if ((label === '微信' || label === '朋友圈') && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url });
        setShareOpen(false);
        return;
      }

      if (label === 'QQ') {
        window.open(
          `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}`,
          '_blank',
          'noopener,noreferrer',
        );
        showToast('正在打开 QQ 分享');
        setShareOpen(false);
        return;
      }

      if (label === '微博') {
        window.open(
          `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${title} ${text}`)}`,
          '_blank',
          'noopener,noreferrer',
        );
        showToast('正在打开微博分享');
        setShareOpen(false);
        return;
      }

      await navigator.clipboard.writeText(url);
      showToast(`链接已复制，请去${label}粘贴分享`);
      setShareOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '分享失败');
    }
  }

  async function handleSubmitReport() {
    if (!post || reportSaving) {
      return;
    }

    try {
      setReportSaving(true);
      await reportCommunityPost(post.id, {
        reasonType: reportReason,
        reasonDetail: reportDetail.trim() || null,
      });
      setReportOpen(false);
      setReportReason(10);
      setReportDetail('');
      showToast('举报已提交');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '举报失败');
    } finally {
      setReportSaving(false);
    }
  }

  return {
    detail,
    setDetail,
    ready,
    error,
    post,
    comments,
    related,
    totalCommentCount,
    imageClass,
    tagClass,
    shareOpen,
    setShareOpen,
    comment,
    setComment,
    setReplyTo,
    toast,
    likeSaving,
    bookmarkSaving,
    commentSaving,
    commentLikeSavingId,
    expandedReplyIds,
    commentSort,
    setCommentSort,
    emojiOpen,
    setEmojiOpen,
    reportOpen,
    setReportOpen,
    reportReason,
    setReportReason,
    reportDetail,
    setReportDetail,
    reportSaving,
    commentsRef,
    inputRef,
    handleToggleLike,
    handleToggleBookmark,
    handleSubmitComment,
    handleToggleCommentLike,
    toggleReplyThread,
    openReplyInput,
    insertEmoji,
    handleShareAction,
    handleSubmitReport,
    showToast,
  };
}
