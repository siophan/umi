'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { MobileShell } from '../../components/mobile-shell';
import { CommunityComposerOverlays } from './community-composer-overlays';
import { CommunityFeedList } from './community-feed-list';
import { CommunityFollowBar } from './community-follow-bar';
import { CommunityRecommendHighlights } from './community-recommend-highlights';
import {
} from './page-helpers';
import { useCommunityPageState } from './use-community-page-state';
import styles from './page.module.css';

export default function CommunityPage() {
  const router = useRouter();
  const {
    textareaRef,
    imageInputRef,
    tab,
    setTab,
    publishOpen,
    setPublishOpen,
    scopeOpen,
    setScopeOpen,
    emojiOpen,
    setEmojiOpen,
    publishText,
    setPublishText,
    selectedTopic,
    toast,
    publishScope,
    scopeDraft,
    emojiCategory,
    setEmojiCategory,
    bookmarkAnimating,
    followedUsers,
    socialReady,
    feedReady,
    feedError,
    likeSavingId,
    bookmarkSavingId,
    publishing,
    selectedImages,
    hotTopics,
    heroPost,
    repostTarget,
    repostDraft,
    setRepostDraft,
    repostSaving,
    visibleFeed,
    openRepostComposer,
    closeRepostComposer,
    toggleLike,
    toggleBookmark,
    openScopePanel,
    toggleScopeDraft,
    confirmScopes,
    toggleTopic,
    insertEmoji,
    removeSelectedImage,
    clearSelectedImages,
    selectImages,
    submitPublish,
    handleRepostSubmit,
    defaultFollowedUsers,
  } = useCommunityPageState();

  return (
    <MobileShell tab="community" tone="light">
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.title}>
            猜友<span>圈</span>
          </div>
          <div className={styles.spacer} />
          <button className={styles.iconBtn} type="button" onClick={() => router.push('/community-search')}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button className={styles.iconBtn} type="button" onClick={() => router.push('/notifications')}>
            <i className="fa-regular fa-bell" />
          </button>
        </header>

        <nav className={styles.tabs}>
          <button className={tab === 'recommend' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('recommend')}>
            为您推荐
          </button>
          <button className={tab === 'follow' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('follow')}>
            你的关注
          </button>
        </nav>

        {tab === 'follow' ? (
          <CommunityFollowBar
            followedUsers={followedUsers}
            socialReady={socialReady}
            fallbackUsers={defaultFollowedUsers}
            onOpenUser={(userId) => router.push(`/user/${encodeURIComponent(userId)}`)}
          />
        ) : null}

        {tab === 'recommend' ? (
          <CommunityRecommendHighlights
            heroPost={heroPost}
            hotTopics={hotTopics}
            onOpenPost={(postId) => router.push(`/post/${encodeURIComponent(postId)}`)}
          />
        ) : null}

        <CommunityFeedList
          feedReady={feedReady}
          feedError={feedError}
          feed={visibleFeed}
          currentTab={tab}
          likeSavingId={likeSavingId}
          bookmarkSavingId={bookmarkSavingId}
          bookmarkAnimating={bookmarkAnimating}
          onOpenPost={(postId) => router.push(`/post/${encodeURIComponent(postId)}`)}
          onOpenUser={(userId) => router.push(`/user/${encodeURIComponent(userId)}`)}
          onOpenGuess={(guessId) => router.push(`/guess/${guessId}`)}
          onToggleLike={(postId, currentTab) => void toggleLike(postId, currentTab)}
          onOpenRepost={openRepostComposer}
          onToggleBookmark={(postId, currentTab, bookmarked) => void toggleBookmark(postId, currentTab, bookmarked)}
        />

        <div className={styles.loadMore}>
          {feedReady ? (
            <><i className="fa-solid fa-check" /> 已展示最新动态</>
          ) : (
            <><i className="fa-solid fa-spinner fa-spin" /> 加载更多动态...</>
          )}
        </div>

        <button className={styles.publishFab} type="button" onClick={() => setPublishOpen(true)}>
          <i className="fa-solid fa-pen-to-square" />
        </button>

        <CommunityComposerOverlays
          publishOpen={publishOpen}
          onClosePublish={() => setPublishOpen(false)}
          textareaRef={textareaRef}
          imageInputRef={imageInputRef}
          publishScope={publishScope}
          onOpenScopePanel={openScopePanel}
          publishText={publishText}
          onChangePublishText={setPublishText}
          selectedImages={selectedImages}
          onSelectImages={selectImages}
          onClearImages={clearSelectedImages}
          onRemoveSelectedImage={removeSelectedImage}
          selectedTopic={selectedTopic}
          onToggleTopic={toggleTopic}
          onOpenEmoji={() => setEmojiOpen(true)}
          publishing={publishing}
          onSubmitPublish={() => void submitPublish()}
          repostTarget={repostTarget}
          repostDraft={repostDraft}
          onChangeRepostDraft={setRepostDraft}
          onCloseRepost={closeRepostComposer}
          repostSaving={repostSaving}
          onSubmitRepost={() => void handleRepostSubmit()}
          scopeOpen={scopeOpen}
          onCloseScope={() => setScopeOpen(false)}
          scopeDraft={scopeDraft}
          onToggleScopeDraft={toggleScopeDraft}
          onConfirmScopes={confirmScopes}
          emojiOpen={emojiOpen}
          onCloseEmoji={() => setEmojiOpen(false)}
          emojiCategory={emojiCategory}
          onChangeEmojiCategory={setEmojiCategory}
          onInsertEmoji={insertEmoji}
        />

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    </MobileShell>
  );
}
