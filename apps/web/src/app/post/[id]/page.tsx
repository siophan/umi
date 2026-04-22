'use client';

import { useParams, useRouter } from 'next/navigation';
import { PostDetailArticle } from './post-detail-article';
import { PostDetailComments } from './post-detail-comments';
import { PostDetailOverlays } from './post-detail-overlays';
import { PostDetailRelated } from './post-detail-related';
import { usePostDetailState } from './use-post-detail-state';
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
