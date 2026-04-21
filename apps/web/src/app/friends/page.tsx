'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  acceptFriendRequest,
  fetchSocialOverview,
  rejectFriendRequest,
} from '../../lib/api/friends';
import { fetchGuessHistory, fetchGuessList } from '../../lib/api/guesses';
import { followUser, unfollowUser } from '../../lib/api/users';
import { FriendsPkModal } from './friends-pk-modal';
import {
  type FanItem,
  type FriendItem,
  type FriendSort,
  type FollowingItem,
  formatFans,
  getErrorMessage,
  myAvatar,
  normalizeFan,
  normalizeFollowing,
  normalizeFriend,
  normalizeHotGuess,
  normalizeRequest,
  type RequestItem,
  type FriendsTab,
  quickActions,
  type HotGuessItem,
} from './friends-helpers';
import { FriendsTabSections } from './friends-tab-sections';
import styles from './page.module.css';

export default function FriendsPage() {
  const router = useRouter();
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

  function renderSocialError() {
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

  if (!ready) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.headerTitle}>好友</div>
        <button className={styles.actionBtn} type="button" onClick={() => showToast('添加好友')}>
          <i className="fa-solid fa-user-plus" />
        </button>
      </header>

      <section className={styles.heroCard}>
        <div className={styles.heroStats}>
          <button className={styles.heroStat} type="button" onClick={() => setTab('friends')}>
            <div className={styles.heroNum}>{socialCountsMissing ? '--' : friends.length}</div>
            <div className={styles.heroLabel}>好友</div>
          </button>
          <button className={styles.heroStat} type="button" onClick={() => setTab('following')}>
            <div className={styles.heroNum}>{socialCountsMissing ? '--' : following.length}</div>
            <div className={styles.heroLabel}>关注</div>
          </button>
          <button className={styles.heroStat} type="button" onClick={() => setTab('fans')}>
            <div className={styles.heroNum}>{socialCountsMissing ? '--' : fans.length}</div>
            <div className={styles.heroLabel}>粉丝</div>
          </button>
          <div className={styles.heroStat}>
            <div className={styles.heroNum}>{guessCountsMissing ? '--' : pkCount ?? 0}</div>
            <div className={styles.heroLabel}>PK场</div>
          </div>
        </div>
      </section>

      <section className={styles.quickBar}>
        {quickActions.map((item) => (
          <button
            className={styles.quickItem}
            key={item.label}
            type="button"
            onClick={() => {
              if (item.label === '邀请好友') {
                router.push('/invite');
                return;
              }
              if (item.label === '排行榜') {
                router.push('/ranking');
                return;
              }
              if (item.label === 'PK记录') {
                router.push('/guess-history');
                return;
              }
              if (item.label === '社区') {
                router.push('/community');
                return;
              }
            }}
          >
            <div className={`${styles.quickIcon} ${styles[item.tone]}`}>{item.icon}</div>
            <div className={styles.quickLabel}>{item.label}</div>
          </button>
        ))}
      </section>

      <section className={styles.hotStrip}>
        <div className={styles.hotTitle}>
          <i className="fa-solid fa-fire" />
          <span>好友都在猜</span>
          <button type="button" onClick={() => router.push('/guess-history')}>查看更多</button>
        </div>
        <div className={styles.hotScroll}>
          {!guessError ? hotGuesses.map((item) => (
            <button className={styles.hotChip} key={item.id} type="button" onClick={() => router.push(`/guess/${encodeURIComponent(item.id)}`)}>
              <div className={styles.hotChipIcon}>{item.icon}</div>
              <div className={styles.hotChipTitle}>{item.title}</div>
              <div className={styles.hotChipMeta}>
                <span className={styles.hotChipHot}>🔥 {formatFans(item.hot)}</span>
                <span>人参与</span>
              </div>
            </button>
          )) : null}
          {guessError ? (
            <div className={styles.hotError}>
              <div className={styles.hotErrorTitle}>竞猜链加载失败</div>
              <div className={styles.hotErrorDesc}>{guessError}</div>
              <button className={styles.hotErrorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
                重试
              </button>
            </div>
          ) : null}
          {!guessError && !hotGuesses.length ? <div className={styles.hotEmpty}>暂无热门竞猜</div> : null}
        </div>
      </section>

      <nav className={styles.tabs}>
        {[
          { key: 'friends', label: '好友' },
          { key: 'following', label: '关注' },
          { key: 'fans', label: '粉丝', badge: newFansCount },
          { key: 'requests', label: '申请', badge: pendingRequests.length },
        ].map((item) => (
          <button
            className={tab === item.key ? styles.tabActive : styles.tab}
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as FriendsTab)}
          >
            {item.label}
            {item.badge ? <span className={styles.tabBadge}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <section className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <i className="fa-solid fa-magnifying-glass" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户..." />
        </div>
      </section>

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
