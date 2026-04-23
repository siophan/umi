'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { hasAuthToken } from '../../lib/api/shared';
import { FriendsPkModal } from './friends-pk-modal';
import { FriendsOverviewSections } from './friends-overview-sections';
import { FriendsTabSections } from './friends-tab-sections';
import { useFriendsPageState } from './use-friends-page-state';
import styles from './page.module.css';

/**
 * 好友页主组件。
 * 社交关系、热门竞猜和竞猜历史来自不同接口，这里按板块独立容错，避免一处失败把整页打空。
 */
export default function FriendsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  const {
    tab,
    setTab,
    query,
    setQuery,
    toast,
    ready,
    friendsCount,
    followingCount,
    fansCount,
    pkCount,
    hotGuesses,
    socialError,
    guessError,
    followSavingId,
    requestSavingId,
    pkOpen,
    setPkOpen,
    pkTarget,
    selectedGuessId,
    setSelectedGuessId,
    pendingRequests,
    newFansCount,
    filteredFriends,
    filteredFollowing,
    filteredFans,
    filteredRequests,
    currentGuess,
    socialCountsMissing,
    guessCountsMissing,
    renderSocialError,
    showToast,
    toggleSort,
    openPk,
    openProfile,
    handleToggleFollowing,
    handleToggleFanFollow,
    confirmPk,
    acceptRequest,
    rejectRequest,
    reload,
  } = useFriendsPageState(router);

  if (!ready) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <FriendsOverviewSections
        router={router}
        tab={tab}
        onChangeTab={setTab}
        socialCountsMissing={socialCountsMissing}
        guessCountsMissing={guessCountsMissing}
        friendsCount={friendsCount}
        followingCount={followingCount}
        fansCount={fansCount}
        pkCount={pkCount}
        newFansCount={newFansCount}
        pendingRequestsCount={pendingRequests.length}
        hotGuesses={hotGuesses}
        guessError={guessError}
        query={query}
        onChangeQuery={setQuery}
        onReloadHot={reload}
        onShowToast={showToast}
      />

      <FriendsTabSections
        socialError={Boolean(socialError)}
        errorContent={renderSocialError()}
        activeTab={tab}
        filteredFriends={filteredFriends}
        filteredFollowing={filteredFollowing}
        filteredFans={filteredFans}
        filteredRequests={filteredRequests}
        followSavingId={followSavingId}
        requestSavingId={requestSavingId}
        onToggleSort={toggleSort}
        onOpenProfile={openProfile}
        onOpenPk={openPk}
        onOpenMessage={(name) => showToast(`发消息给 ${name}`)}
        onToggleFollowing={(item) => void handleToggleFollowing(item)}
        onToggleFanFollow={(item) => void handleToggleFanFollow(item)}
        onAcceptRequest={(item) => void acceptRequest(item)}
        onRejectRequest={(item) => void rejectRequest(item)}
      />

      <FriendsPkModal
        pkOpen={pkOpen}
        pkTarget={pkTarget}
        hotGuesses={hotGuesses}
        selectedGuessId={selectedGuessId}
        currentGuess={currentGuess}
        onClose={() => setPkOpen(false)}
        onSelectGuess={setSelectedGuessId}
        onConfirm={confirmPk}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
