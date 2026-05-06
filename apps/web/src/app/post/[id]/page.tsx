'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PostDetailArticle } from './post-detail-article';
import { PostDetailComments } from './post-detail-comments';
import { PostDetailOverlays } from './post-detail-overlays';
import { PostDetailRelated } from './post-detail-related';
import { usePostDetailState } from './use-post-detail-state';
import { hasAuthToken } from '../../../lib/api/shared';
import { followUser, unfollowUser } from '../../../lib/api/users';
import styles from './page.module.css';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = String(params?.id || '').trim();
  const {
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
  } = usePostDetailState(postId);

  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followAuthorSaving, setFollowAuthorSaving] = useState(false);

  async function handleToggleFollowAuthor() {
    if (!post) return;
    if (!hasAuthToken()) {
      router.push('/login');
      return;
    }
    if (followAuthorSaving) return;
    const next = !isFollowingAuthor;
    setFollowAuthorSaving(true);
    setIsFollowingAuthor(next);
    try {
      if (next) {
        await followUser(post.author.id);
        showToast('✅ 关注成功');
      } else {
        await unfollowUser(post.author.id);
        showToast('已取消关注');
      }
    } catch (error) {
      setIsFollowingAuthor(!next);
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setFollowAuthorSaving(false);
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
      <PostDetailArticle
        post={post}
        imageClass={imageClass}
        tagClass={tagClass}
        likeSaving={likeSaving}
        bookmarkSaving={bookmarkSaving}
        totalCommentCount={totalCommentCount}
        isFollowingAuthor={isFollowingAuthor}
        followAuthorSaving={followAuthorSaving}
        showFollowAuthor
        onToggleFollowAuthor={() => void handleToggleFollowAuthor()}
        onOpenUser={(uid) => router.push(`/user/${encodeURIComponent(uid)}`)}
        onOpenGuess={(guessId) => router.push(`/guess/${guessId}`)}
        onToggleLike={() => void handleToggleLike()}
        onOpenComments={() => {
          commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.setTimeout(() => inputRef.current?.focus(), 350);
        }}
        onOpenShare={() => setShareOpen(true)}
        onToggleBookmark={() => void handleToggleBookmark()}
      />

      <PostDetailComments
        detailComments={comments}
        totalCommentCount={totalCommentCount}
        commentSort={commentSort}
        expandedReplyIds={expandedReplyIds}
        commentLikeSavingId={commentLikeSavingId}
        comment={comment}
        commentSaving={commentSaving}
        emojiOpen={emojiOpen}
        commentsRef={commentsRef}
        inputRef={inputRef}
        onChangeSort={() => setCommentSort((current) => (current === 'hot' ? 'newest' : 'hot'))}
        onOpenUser={(uid) => router.push(`/user/${encodeURIComponent(uid)}`)}
        onReply={openReplyInput}
        onToggleReplyThread={toggleReplyThread}
        onToggleCommentLike={(commentId) => void handleToggleCommentLike(commentId)}
        onCommentChange={(nextValue) => {
          setComment(nextValue);
          if (!nextValue.trim()) {
            setReplyTo(null);
          }
        }}
        onToggleEmoji={() => setEmojiOpen((current) => !current)}
        onInsertEmoji={insertEmoji}
        onSubmitComment={() => void handleSubmitComment()}
      />

      <PostDetailRelated related={related} />

      <PostDetailOverlays
        post={post}
        shareOpen={shareOpen}
        reportOpen={reportOpen}
        reportReason={reportReason}
        reportDetail={reportDetail}
        reportSaving={reportSaving}
        onCloseShare={() => setShareOpen(false)}
        onShareAction={(label) => void handleShareAction(label)}
        onCloseReport={() => setReportOpen(false)}
        onChangeReportReason={setReportReason}
        onChangeReportDetail={setReportDetail}
        onSubmitReport={() => void handleSubmitReport()}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
