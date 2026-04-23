'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchCommunityDiscovery } from '../lib/api/community';
import { fetchGuessHistory } from '../lib/api/guesses';
import { hasAuthToken } from '../lib/api/shared';
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

export function useHomePageState(initialData: HomePageInitialData) {
  const [mode, setMode] = useState<HomeMode>('guess');
  const [category, setCategory] = useState<HomeCategory>('hot');
  const [liveFilter, setLiveFilter] = useState<HomeLiveFilter>('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [breakingIndex, setBreakingIndex] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);
  const [guessBanners, setGuessBanners] = useState(initialData.guessBanners);
  const [guessItems, setGuessItems] = useState(initialData.guessItems);
  const [liveItems, setLiveItems] = useState(initialData.liveItems);
  const [rankingItems, setRankingItems] = useState(initialData.rankingItems);
  const [historyItems, setHistoryItems] = useState(initialData.historyItems);
  const [hotTopics, setHotTopics] = useState(initialData.hotTopics);
  const [sectionErrors] = useState(initialData.sectionErrors);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const shouldLoadHistory = hasAuthToken();
      const [historyResult, discoveryResult] = await Promise.allSettled([
        shouldLoadHistory ? fetchGuessHistory() : Promise.resolve(null),
        fetchCommunityDiscovery(),
      ]);

      if (ignore) {
        return;
      }

      setHistoryItems(
        historyResult.status === 'fulfilled' && historyResult.value
          ? historyResult.value.history.slice(0, 5)
          : [],
      );
      setHotTopics(discoveryResult.status === 'fulfilled' ? discoveryResult.value.hotTopics : []);
    }

    void loadHomeData();
    return () => {
      ignore = true;
    };
  }, []);

  const visibleGuesses = useMemo(
    () => filterGuessList(guessItems, category),
    [category, guessItems],
  );
  const visibleLives = useMemo(
    () => filterLiveList(liveItems, category),
    [category, liveItems],
  );
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
        .sort((left, right) => right.viewers - left.viewers)
        .slice(0, 5)
        .map(createLiveHeroCard),
    [liveItems],
  );
  const visibleCards = useMemo(
    () =>
      (mode === 'guess' ? visibleGuesses.map(createGuessListCard) : visibleLives.map(createLiveListCard)).slice(
        0,
        12,
      ),
    [mode, visibleGuesses, visibleLives],
  );
  const heroCards = mode === 'guess' ? guessHeroCards : liveHeroCards;
  const heroCard = heroCards[heroIndex] ?? null;
  const breakingEvents = useMemo(
    () => buildBreakingEvents(guessItems, rankingItems, hotTopics, historyItems),
    [guessItems, rankingItems, hotTopics, historyItems],
  );
  const recentResults = historyItems.slice(0, 3).map(createResultCard);
  const rankings = rankingItems.slice(0, 3);
  const sectionSubtitle =
    mode === 'guess'
      ? `${visibleGuesses.length}场竞猜进行中`
      : `${filteredLiveFeedItems.length}场直播进行中`;
  const focusGuess = visibleGuesses[0] ?? null;

  useEffect(() => {
    setHeroIndex(0);
  }, [mode, heroCards.length]);

  useEffect(() => {
    if (heroCards.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroCards.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [heroCards.length]);

  useEffect(() => {
    if (breakingEvents.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setBreakingIndex((current) => (current + 1) % breakingEvents.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [breakingEvents.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPosterIndex((current) => (current + 1) % 3);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

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
    focusGuess,
    recentResults,
    sectionSubtitle,
    filteredLiveFeedItems,
  };
}
