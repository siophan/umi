'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import {
  acceptFriendRequest,
  fetchSocialOverview,
  rejectFriendRequest,
} from '../../lib/api/friends';
import { fetchGuessHistory, fetchGuessList } from '../../lib/api/guesses';
import { followUser, unfollowUser } from '../../lib/api/users';
import {
  type FanItem,
  type FriendItem,
  type FriendSort,
  type FollowingItem,
  getErrorMessage,
  normalizeFan,
  normalizeFollowing,
  normalizeFriend,
  normalizeHotGuess,
  normalizeRequest,
  type RequestItem,
  type FriendsTab,
  type HotGuessItem,
} from './friends-helpers';
import styles from './page.module.css';

export function useFriendsPageState(router: AppRouterInstance) {
  const toastTimer = useRef<number | null>(null);
  const [tab, setTab] = useState<FriendsTab>('friends');
  const [sortBy, setSortBy] = useState<FriendSort>('online');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [fans, setFans] = useState<FanItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pkCount, setPkCount] = useState<number | null>(null);
  const [hotGuesses, setHotGuesses] = useState<HotGuessItem[]>([]);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [followSavingId, setFollowSavingId] = useState('');
  const [requestSavingId, setRequestSavingId] = useState('');
  const [pkOpen, setPkOpen] = useState(false);
  const [pkTarget, setPkTarget] = useState<FriendItem | null>(null);
  const [selectedGuessId, setSelectedGuessId] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setSocialError(null);
      setGuessError(null);
      const [socialResult, guessListResult, guessHistoryResult] = await Promise.allSettled([
        fetchSocialOverview(),
        fetchGuessList(),
        fetchGuessHistory(),
      ]);

      if (ignore) {
        return;
      }

      if (socialResult.status === 'fulfilled') {
        const result = socialResult.value;
        const followingIds = new Set(result.following.map((item) => String(item.id)));
        const fanIds = new Set(result.fans.map((item) => String(item.id)));

        setFriends(result.friends.map(normalizeFriend));
        setFollowing(result.following.map((item, index) => normalizeFollowing(item, index, fanIds.has(String(item.id)))));
        setFans(result.fans.map((item, index) => normalizeFan(item, index, followingIds.has(String(item.id)))));
        setRequests(result.requests.map(normalizeRequest));
      } else {
        setFriends([]);
        setFollowing([]);
        setFans([]);
        setRequests([]);
        setSocialError(getErrorMessage(socialResult.reason, '社交关系读取失败'));
      }

      if (guessListResult.status === 'fulfilled') {
        setHotGuesses(guessListResult.value.items.slice(0, 5).map(normalizeHotGuess));
      } else {
        setHotGuesses([]);
        setGuessError(getErrorMessage(guessListResult.reason, '竞猜列表读取失败'));
      }

      if (guessHistoryResult.status === 'fulfilled') {
        setPkCount(guessHistoryResult.value.stats.pk);
      } else {
        setPkCount(null);
        setGuessError((current) => current || getErrorMessage(guessHistoryResult.reason, '竞猜历史读取失败'));
      }

      if (!ignore) {
        setReady(true);
      }
    }

    void load();
    return () => {
      ignore = true;
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, [reloadToken]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'pending'),
    [requests],
  );

  const newFansCount = useMemo(
    () => fans.filter((item) => item.isNew && !item.followedBack).length,
    [fans],
  );

  const filteredFriends = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const list = friends.filter((item) => !keyword || item.name.toLowerCase().includes(keyword));
    if (sortBy === 'online') {
      return [...list].sort((left, right) => Number(right.status === 'online') - Number(left.status === 'online'));
    }
    if (sortBy === 'winRate') {
      return [...list].sort((left, right) => right.winRate - left.winRate);
    }
    return [...list].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  }, [friends, query, sortBy]);

  const filteredFollowing = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return following.filter((item) => !keyword || item.name.toLowerCase().includes(keyword));
  }, [following, query]);

  const filteredFans = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return fans.filter((item) => !keyword || item.name.toLowerCase().includes(keyword));
  }, [fans, query]);

  const filteredRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return pendingRequests.filter((item) => !keyword || item.name.toLowerCase().includes(keyword));
  }, [pendingRequests, query]);

  const currentGuess = hotGuesses.find((item) => item.id === selectedGuessId) || hotGuesses[0] || null;
  const socialCountsMissing = Boolean(socialError);
  const guessCountsMissing = Boolean(guessError);

  function renderSocialError(): ReactNode {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>社交关系加载失败</div>
        <div className={styles.errorDesc}>{socialError}</div>
        <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
          重新加载
        </button>
      </div>
    );
  }

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  }

  function toggleSort() {
    const nextSort = sortBy === 'online' ? 'winRate' : sortBy === 'winRate' ? 'name' : 'online';
    const labels: Record<FriendSort, string> = {
      online: '在线优先',
      winRate: '胜率排序',
      name: '名称排序',
    };
    setSortBy(nextSort);
    showToast(`排序: ${labels[nextSort]}`);
  }

  function openPk(friend: FriendItem) {
    setPkTarget(friend);
    setSelectedGuessId(hotGuesses[0]?.id ?? '');
    setPkOpen(true);
  }

  function openProfile(uid: string) {
    if (!uid) {
      showToast('用户主页暂不可用');
      return;
    }
    router.push(`/user/${encodeURIComponent(uid)}`);
  }

  async function handleToggleFollowing(item: FollowingItem) {
    try {
      setFollowSavingId(item.id);
      if (item.followed) {
        await unfollowUser(item.id);
        setFollowing((current) => current.filter((entry) => entry.id !== item.id));
        setFans((current) => current.map((entry) => (
          entry.id === item.id ? { ...entry, followedBack: false } : entry
        )));
        showToast(`已取消关注 ${item.name}`);
        return;
      }

      await followUser(item.id);
      setFollowing((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, followed: true } : entry
      )));
      setFans((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, followedBack: true } : entry
      )));
      showToast(`已关注 ${item.name}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setFollowSavingId('');
    }
  }

  async function handleToggleFanFollow(item: FanItem) {
    try {
      setFollowSavingId(item.id);
      if (item.followedBack) {
        await unfollowUser(item.id);
        setFans((current) => current.map((entry) => (
          entry.id === item.id ? { ...entry, followedBack: false } : entry
        )));
        setFollowing((current) => current.filter((entry) => entry.id !== item.id));
        showToast(`已取消关注 ${item.name}`);
        return;
      }

      await followUser(item.id);
      setFans((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, followedBack: true } : entry
      )));
      setFollowing((current) => {
        if (current.some((entry) => entry.id === item.id)) {
          return current.map((entry) => (
            entry.id === item.id ? { ...entry, mutual: true, followed: true } : entry
          ));
        }
        return [
          normalizeFollowing(
            {
              id: item.id,
              uid: item.uid,
              name: item.name,
              avatar: item.avatar,
              signature: item.bio,
              followers: 0,
              posts: 0,
              shopVerified: false,
              mutual: true,
            },
            current.length,
            true,
          ),
          ...current,
        ];
      });
      showToast(`已回关 ${item.name}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setFollowSavingId('');
    }
  }

  function confirmPk() {
    if (!selectedGuessId || !pkTarget) {
      showToast('请选择一个竞猜项目');
      return;
    }
    setPkOpen(false);
    router.push(`/guess/${encodeURIComponent(selectedGuessId)}?pkFriend=${encodeURIComponent(pkTarget.uid)}`);
  }

  async function acceptRequest(item: RequestItem) {
    try {
      setRequestSavingId(item.id);
      await acceptFriendRequest(item.id);
      setRequests((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: 'accepted' } : entry)));
      setFriends((current) => {
        if (current.some((entry) => entry.id === item.id)) {
          return current;
        }
        return [
          {
            id: item.id,
            uid: item.uid,
            name: item.name,
            avatar: item.avatar,
            status: 'online',
            winRate: item.winRate,
            level: 6,
            streak: 0,
            bio: item.message || '刚刚成为你的好友',
          },
          ...current,
        ];
      });
      showToast(`已添加 ${item.name} 为好友`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '接受好友申请失败');
    } finally {
      setRequestSavingId('');
    }
  }

  async function rejectRequest(item: RequestItem) {
    try {
      setRequestSavingId(item.id);
      await rejectFriendRequest(item.id);
      setRequests((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: 'rejected' } : entry)));
      showToast(`已忽略 ${item.name} 的好友申请`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '忽略好友申请失败');
    } finally {
      setRequestSavingId('');
    }
  }

  return {
    tab,
    setTab,
    query,
    setQuery,
    toast,
    ready,
    friendsCount: friends.length,
    followingCount: following.length,
    fansCount: fans.length,
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
    reload: () => setReloadToken((current) => current + 1),
  };
}
