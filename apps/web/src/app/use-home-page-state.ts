'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FriendPkSummary } from '@umi/shared';

import { fetchCommunityDiscovery } from '../lib/api/community';
import { fetchFriendPkSummary, fetchGuessHistory, fetchGuessList } from '../lib/api/guesses';
import { AUTH_CHANGE_EVENT, hasAuthToken } from '../lib/api/shared';
import {
  buildBreakingEvents,
  createBannerHeroCard,
  createGuessHeroCard,
  createGuessListCard,
  createLiveHeroCard,
  createLiveListCard,
  createResultCard,
  filterGuessList,
  filterLiveList,
  getGuessParticipants,
  matchesHomeLiveFilter,
} from './home-page-helpers';
import type { HomeCategory, HomeLiveFilter, HomeMode, HomePageInitialData } from './home-page-types';
import { buildCategoryTabs } from './home-page-types';

const HERO_INTERACTION_GRACE_MS = 6000;

export function useHomePageState(initialData: HomePageInitialData) {
  const [mode, setModeState] = useState<HomeMode>('guess');
  const [category, setCategory] = useState<HomeCategory>('hot');
  const [liveFilter, setLiveFilter] = useState<HomeLiveFilter>('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [breakingIndex, setBreakingIndex] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);
  const [guessBanners] = useState(initialData.guessBanners);
  const [guessCategories] = useState(initialData.guessCategories);
  const categoryTabs = useMemo(() => buildCategoryTabs(guessCategories), [guessCategories]);
  const [guessItems, setGuessItems] = useState(initialData.guessItems);
  const [guessCursor, setGuessCursor] = useState<string | null>(initialData.guessNextCursor);
  const [guessHasMore, setGuessHasMore] = useState(initialData.guessHasMore);
  const [guessLoadingMore, setGuessLoadingMore] = useState(false);
  const [liveItems] = useState(initialData.liveItems);
  const [rankingItems] = useState(initialData.rankingItems);
  const [historyItems, setHistoryItems] = useState(initialData.historyItems);
  const [hotTopics, setHotTopics] = useState(initialData.hotTopics);
  const [friendPk, setFriendPk] = useState<FriendPkSummary | null>(null);
  const [sectionErrors] = useState(initialData.sectionErrors);
  const [documentVisible, setDocumentVisible] = useState(true);
  const lastHeroInteractionRef = useRef(0);

  const setMode = useCallback((next: HomeMode) => {
    setModeState((prev) => {
      if (prev !== next) {
        setCategory('hot');
        setLiveFilter('all');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const loggedIn = hasAuthToken();
      const [historyResult, discoveryResult, friendPkResult] = await Promise.allSettled([
        loggedIn ? fetchGuessHistory() : Promise.resolve(null),
        fetchCommunityDiscovery(),
        loggedIn ? fetchFriendPkSummary() : Promise.resolve(null),
      ]);

      if (ignore) {
        return;
      }

      setHistoryItems(
        historyResult.status === 'fulfilled' && historyResult.value
          ? historyResult.value.history.slice(0, 5)
          : [],
      );
      setHotTopics(
        discoveryResult.status === 'fulfilled' ? discoveryResult.value?.hotTopics ?? [] : [],
      );
      setFriendPk(
        friendPkResult.status === 'fulfilled' && friendPkResult.value
          ? friendPkResult.value.item
          : null,
      );
    }

    void loadHomeData();

    function handleAuthChange() {
      if (!hasAuthToken()) {
        // 登出：立刻清空登录态依赖的数据，避免点到无效卡片
        setHistoryItems([]);
        setFriendPk(null);
        return;
      }
      // 登录：重新拉一次以获取登录态独有的数据
      void loadHomeData();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    }

    return () => {
      ignore = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const onChange = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const guessFilter = useMemo(() => filterGuessList(guessItems, category), [category, guessItems]);
  const liveFilterResult = useMemo(() => filterLiveList(liveItems, category), [category, liveItems]);
  const visibleGuesses = guessFilter.items;
  const visibleLives = liveFilterResult.items;

  const filteredLiveFeedItems = useMemo(
    () => visibleLives.filter((item) => matchesHomeLiveFilter(item, liveFilter)),
    [liveFilter, visibleLives],
  );

  const guessHeroCards = useMemo(() => {
    const bannerCards = guessBanners.map(createBannerHeroCard);
    if (bannerCards.length > 0) {
      return bannerCards;
    }
    return guessItems
      .slice()
      .sort((left, right) => getGuessParticipants(right) - getGuessParticipants(left))
      .slice(0, 5)
      .map(createGuessHeroCard);
  }, [guessBanners, guessItems]);

  const liveHeroCards = useMemo(
    () =>
      liveItems
        .slice()
        .sort((left, right) => right.participants - left.participants)
        .slice(0, 5)
        .map(createLiveHeroCard),
    [liveItems],
  );

  const visibleCards = useMemo(() => {
    if (mode === 'guess') {
      return visibleGuesses.map(createGuessListCard);
    }
    return visibleLives.map(createLiveListCard);
  }, [mode, visibleGuesses, visibleLives]);

  const loadMoreGuesses = useCallback(async () => {
    if (!guessHasMore || !guessCursor || guessLoadingMore) {
      return;
    }
    setGuessLoadingMore(true);
    try {
      const next = await fetchGuessList({ cursor: guessCursor });
      setGuessItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...next.items.filter((item) => !seen.has(item.id))];
      });
      setGuessCursor(next.nextCursor);
      setGuessHasMore(next.hasMore);
    } finally {
      setGuessLoadingMore(false);
    }
  }, [guessCursor, guessHasMore, guessLoadingMore]);

  const heroCards = mode === 'guess' ? guessHeroCards : liveHeroCards;
  const heroCard = heroCards[heroIndex] ?? null;

  const breakingEvents = useMemo(
    () => buildBreakingEvents(guessItems, rankingItems, hotTopics, historyItems),
    [guessItems, rankingItems, hotTopics, historyItems],
  );

  const recentResults = historyItems.slice(0, 3).map(createResultCard);
  const rankings = rankingItems.slice(0, 5);

  const categoryRealCount =
    mode === 'guess' ? guessFilter.matchedCount : liveFilterResult.matchedCount;
  const categoryFellBack =
    mode === 'guess' ? guessFilter.fellBack : liveFilterResult.fellBack;
  const sectionSubtitle =
    mode === 'guess'
      ? `${categoryRealCount}场竞猜进行中`
      : `${filteredLiveFeedItems.length}场直播进行中`;

  const markHeroInteraction = useCallback(() => {
    lastHeroInteractionRef.current = Date.now();
  }, []);

  useEffect(() => {
    setHeroIndex(0);
  }, [mode, heroCards.length]);

  useEffect(() => {
    if (heroCards.length <= 1 || !documentVisible) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (Date.now() - lastHeroInteractionRef.current < HERO_INTERACTION_GRACE_MS) {
        return;
      }
      setHeroIndex((current) => (current + 1) % heroCards.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [heroCards.length, documentVisible]);

  useEffect(() => {
    if (breakingEvents.length <= 1 || !documentVisible) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setBreakingIndex((current) => (current + 1) % breakingEvents.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [breakingEvents.length, documentVisible]);

  useEffect(() => {
    if (!documentVisible) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setPosterIndex((current) => (current + 1) % 3);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [documentVisible]);

  useEffect(() => {
    if (heroIndex >= heroCards.length) {
      setHeroIndex(0);
    }
  }, [heroCards.length, heroIndex]);

  useEffect(() => {
    if (breakingIndex >= breakingEvents.length) {
      setBreakingIndex(0);
    }
  }, [breakingEvents.length, breakingIndex]);

  return {
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
    heroCard,
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
    guessLoadingMore,
    loadMoreGuesses,
    categoryTabs,
  };
}
