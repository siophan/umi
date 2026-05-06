'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { hasAuthToken } from '../lib/api/shared';
import { MobileShell } from '../components/mobile-shell';
import { HomeGuessView } from './home-guess-view';
import { HomeLiveView } from './home-live-view';
import {
  type HomeHeroCard,
  type HomePageClientProps,
} from './home-page-types';
import { useHomePageState } from './use-home-page-state';
import styles from './page.module.css';

function openTargetPath(router: ReturnType<typeof useRouter>, targetPath?: string | null) {
  if (!targetPath) {
    return;
  }

  if (/^https?:\/\//.test(targetPath)) {
    window.location.href = targetPath;
    return;
  }

  router.push(targetPath);
}

export default function HomePageClient({ initialData }: HomePageClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);
  const {
    mode,
    setMode,
    category,
    setCategory,
    categoryFellBack,
    liveFilter,
    setLiveFilter,
    heroIndex,
    setHeroIndex,
    posterIndex,
    sectionErrors,
    heroCards,
    visibleCards,
    breakingEvents,
    breakingIndex,
    rankings,
    friendPk,
    recentResults,
    sectionSubtitle,
    filteredLiveFeedItems,
    markHeroInteraction,
    guessHasMore,
    guessLoading,
    guessLoadingMore,
    loadMoreGuesses,
    categoryTabs,
  } = useHomePageState(initialData);

  function handleOpenHero(card: HomeHeroCard) {
    openTargetPath(router, card.targetPath || card.href);
  }

  function openNotifications() {
    router.push(hasAuthToken() ? '/notifications' : '/login');
  }

  function handleOpenMode(_index: number) {
    setToast('玩法即将上线');
  }

  return (
    <MobileShell tab="home" tone="dark">
      <main className={styles.page}>
        <header className="home-header-v3">
          <div className="mini-tabs" id="miniTabs">
            <div className={`mini-tab-slider ${mode === 'live' ? 'pos-1' : ''}`} id="miniTabSlider" />
            <button
              className={`mini-tab ${mode === 'guess' ? 'active' : ''}`}
              data-idx="0"
              type="button"
              onClick={() => setMode('guess')}
            >
              <span className="tab-emoji">🎰</span>竞猜
            </button>
            <button
              className={`mini-tab ${mode === 'live' ? 'active' : ''}`}
              data-idx="1"
              type="button"
              onClick={() => setMode('live')}
            >
              <span className="tab-emoji">📺</span>直播竞猜
            </button>
          </div>
          <div className="hv3-spacer" />
          <div className="hv3-actions">
            <button className="hv3-action" type="button" title="搜索" onClick={() => router.push('/search')}>
              <i className="fa-solid fa-magnifying-glass" />
            </button>
            <button className="hv3-action" type="button" onClick={openNotifications}>
              <i className="fa-regular fa-bell" />
            </button>
          </div>
        </header>

        {mode === 'guess' ? (
          <HomeGuessView
            breakingEvents={breakingEvents}
            breakingIndex={breakingIndex}
            sectionErrors={sectionErrors}
            heroCards={heroCards}
            heroIndex={heroIndex}
            onSelectHero={setHeroIndex}
            onHeroInteraction={markHeroInteraction}
            onOpenHero={handleOpenHero}
            rankings={rankings}
            friendPk={friendPk}
            onJoinFriendPk={() => {
              if (friendPk) {
                router.push(`/guess/${friendPk.id}`);
              }
            }}
            category={category}
            onSelectCategory={setCategory}
            categoryFellBack={categoryFellBack}
            sectionSubtitle={sectionSubtitle}
            posterIndex={posterIndex}
            onOpenMode={handleOpenMode}
            visibleCards={visibleCards}
            onOpenCard={(href) => router.push(href)}
            recentResults={recentResults}
            onOpenHistory={() => router.push('/guess-history')}
            onOpenRanking={() => router.push('/ranking')}
            hasMoreGuesses={guessHasMore}
            loadingMoreGuesses={guessLoadingMore}
            loadingGuesses={guessLoading}
            onLoadMoreGuesses={() => void loadMoreGuesses()}
            categoryTabs={categoryTabs}
          />
        ) : (
          <HomeLiveView
            breakingEvents={breakingEvents}
            breakingIndex={breakingIndex}
            liveFilter={liveFilter}
            onSelectLiveFilter={setLiveFilter}
            filteredLiveFeedItems={filteredLiveFeedItems}
            sectionErrors={sectionErrors}
            categoryFellBack={categoryFellBack}
            rankings={rankings}
            onOpenLive={(id) => router.push(`/live/${id}`)}
            onOpenRanking={() => router.push('/ranking')}
          />
        )}
      </main>
      {toast ? (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 88,
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.78)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          {toast}
        </div>
      ) : null}
    </MobileShell>
  );
}
