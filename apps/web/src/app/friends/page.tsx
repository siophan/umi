'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { GuessSummary } from '@umi/shared';

import {
  acceptFriendRequest,
  fetchSocialOverview,
  rejectFriendRequest,
} from '../../lib/api/friends';
import { fetchGuessHistory, fetchGuessList } from '../../lib/api/guesses';
import { followUser, unfollowUser } from '../../lib/api/users';
import styles from './page.module.css';

type FriendsTab = 'friends' | 'following' | 'fans' | 'requests';
type FriendSort = 'online' | 'winRate' | 'name';

type FriendItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  winRate: number;
  level: number;
  streak: number;
  bio: string;
};

type FollowingItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  verified: boolean;
  desc: string;
  fans: number;
  posts: number;
  tag: string;
  mutual: boolean;
  followed: boolean;
};

type FanItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  winRate: number;
  bio: string;
  time: string;
  followedBack: boolean;
  isNew: boolean;
};

type RequestItem = {
  id: string;
  uid: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  mutualFriends: number;
  winRate: number;
  status: 'pending' | 'accepted' | 'rejected';
};

type HotGuessItem = {
  id: string;
  title: string;
  hot: number;
  icon: string;
  participants: number;
  options: [string, string];
};

const myAvatar = '/legacy/images/mascot/mouse-main.png';
const quickActions = [
  { label: '邀请好友', icon: '📨', tone: 'blue' as const },
  { label: '排行榜', icon: '🏆', tone: 'orange' as const },
  { label: 'PK记录', icon: '⚔️', tone: 'purple' as const },
  { label: '社区', icon: '💬', tone: 'green' as const },
];

function formatFans(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return String(value);
}

function winRateClass(value: number) {
  if (value >= 65) {
    return styles.winHigh;
  }
  if (value >= 50) {
    return styles.winMid;
  }
  return styles.winLow;
}

function normalizeFriend(item: any, index: number): FriendItem {
  return {
    id: String(item.id || item.friendId || `friend-${index}`),
    uid: String(item.uid || item.uidCode || item.id || item.friendId || `friend-${index}`),
    name: item.name || item.friendName || '未知用户',
    avatar: item.avatar || item.friendAvatar || myAvatar,
    status: item.status === 'online' || item.online ? 'online' : 'offline',
    winRate: Number(item.winRate ?? 0),
    level: Number(item.level ?? 1),
    streak: Number(item.streak ?? 0),
    bio: item.bio || item.signature || '这个人很懒，还没有留下签名。',
  };
}

function normalizeFollowing(item: any, index: number, mutual = false): FollowingItem {
  return {
    id: String(item.id || `following-${index}`),
    uid: String(item.uid || item.uidCode || item.id || `following-${index}`),
    name: item.name || '未知用户',
    avatar: item.avatar || myAvatar,
    verified: Boolean(item.shopVerified ?? item.verified),
    desc: item.desc || item.signature || '暂无简介',
    fans: Number(item.followers ?? item.fans ?? 0),
    posts: Number(item.posts ?? 0),
    tag: item.tag || (item.shopVerified ? '品牌' : '猜友'),
    mutual: Boolean(item.mutual ?? mutual),
    followed: true,
  };
}

function normalizeFan(item: any, index: number, followedBack = false): FanItem {
  return {
    id: String(item.id || `fan-${index}`),
    uid: String(item.uid || item.uidCode || item.id || `fan-${index}`),
    name: item.name || '未知用户',
    avatar: item.avatar || myAvatar,
    winRate: Number(item.winRate ?? 0),
    bio: item.bio || item.signature || '这个人很懒，还没有留下签名。',
    time: item.time || item.createdAt || '',
    followedBack: Boolean(item.followedBack ?? followedBack),
    isNew: Boolean(item.isNew ?? false),
  };
}

function normalizeRequest(item: any, index: number): RequestItem {
  return {
    id: String(item.id || `request-${index}`),
    uid: String(item.uid || item.uidCode || item.id || `request-${index}`),
    name: item.name || '未知用户',
    avatar: item.avatar || myAvatar,
    message: item.message || item.msg || '请求添加你为好友',
    time: item.time || item.createdAt || '',
    mutualFriends: Number(item.mutualFriends ?? 0),
    winRate: Number(item.winRate ?? 0),
    status: 'pending',
  };
}

function guessIcon(category: string) {
  if (category.includes('体育') || category.includes('足球') || category.includes('篮球')) {
    return '⚽';
  }
  if (category.includes('科技') || category.includes('数码')) {
    return '📱';
  }
  if (category.includes('影视') || category.includes('娱乐')) {
    return '🎬';
  }
  if (category.includes('财经') || category.includes('金融')) {
    return '₿';
  }
  if (category.includes('零食') || category.includes('美食')) {
    return '🍿';
  }
  return '🎯';
}

function normalizeHotGuess(item: GuessSummary): HotGuessItem {
  const participants = item.options.reduce((sum, option) => sum + Number(option.voteCount ?? 0), 0);
  return {
    id: item.id,
    title: item.title,
    hot: participants,
    icon: guessIcon(item.category),
    participants,
    options: [item.options[0]?.optionText || '选项A', item.options[1]?.optionText || '选项B'],
  };
}

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
  const [pkCount, setPkCount] = useState(0);
  const [hotGuesses, setHotGuesses] = useState<HotGuessItem[]>([]);
  const [followSavingId, setFollowSavingId] = useState('');
  const [requestSavingId, setRequestSavingId] = useState('');
  const [pkOpen, setPkOpen] = useState(false);
  const [pkTarget, setPkTarget] = useState<FriendItem | null>(null);
  const [selectedGuessId, setSelectedGuessId] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
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
      }

      setHotGuesses(
        guessListResult.status === 'fulfilled'
          ? guessListResult.value.items.slice(0, 5).map(normalizeHotGuess)
          : [],
      );
      setPkCount(guessHistoryResult.status === 'fulfilled' ? guessHistoryResult.value.stats.pk : 0);

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
  }, []);

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
            <div className={styles.heroNum}>{friends.length}</div>
            <div className={styles.heroLabel}>好友</div>
          </button>
          <button className={styles.heroStat} type="button" onClick={() => setTab('following')}>
            <div className={styles.heroNum}>{following.length}</div>
            <div className={styles.heroLabel}>关注</div>
          </button>
          <button className={styles.heroStat} type="button" onClick={() => setTab('fans')}>
            <div className={styles.heroNum}>{fans.length}</div>
            <div className={styles.heroLabel}>粉丝</div>
          </button>
          <div className={styles.heroStat}>
            <div className={styles.heroNum}>{pkCount}</div>
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
          {hotGuesses.map((item) => (
            <button className={styles.hotChip} key={item.id} type="button" onClick={() => router.push(`/guess/${encodeURIComponent(item.id)}`)}>
              <div className={styles.hotChipIcon}>{item.icon}</div>
              <div className={styles.hotChipTitle}>{item.title}</div>
              <div className={styles.hotChipMeta}>
                <span className={styles.hotChipHot}>🔥 {formatFans(item.hot)}</span>
                <span>人参与</span>
              </div>
            </button>
          ))}
          {!hotGuesses.length ? <div className={styles.hotEmpty}>暂无热门竞猜</div> : null}
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

      {tab === 'friends' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>我的好友 ({filteredFriends.length})</span>
            <button className={styles.sortBtn} type="button" onClick={toggleSort}>
              <i className="fa-solid fa-arrow-down-short-wide" /> 排序
            </button>
          </div>
          {filteredFriends.length ? filteredFriends.map((item) => (
            <article className={styles.card} key={item.id}>
              <button className={styles.avatarButton} type="button" onClick={() => openProfile(item.uid)}>
                <img className={styles.avatar} src={item.avatar} alt={item.name} />
                <span className={`${styles.onlineDot} ${item.status === 'online' ? styles.online : styles.offline}`} />
              </button>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <button className={styles.nameButton} type="button" onClick={() => openProfile(item.uid)}>
                    {item.name}
                  </button>
                  <span className={styles.level}>Lv.{item.level}</span>
                  <span className={item.status === 'online' ? styles.onlineTagOn : styles.onlineTagOff}>
                    {item.status === 'online' ? '在线' : '离线'}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaChip}>
                    <i className="fa-solid fa-crosshairs" />
                    胜率 <b className={winRateClass(item.winRate)}>{item.winRate}%</b>
                  </span>
                  {item.streak > 0 ? <span className={styles.streak}>🔥{item.streak}连胜</span> : null}
                </div>
                <div className={styles.bio}>{item.bio}</div>
              </div>
              <div className={styles.actions}>
                <button className={styles.primaryBtn} type="button" onClick={() => openPk(item)}>
                  <i className="fa-solid fa-bolt" /> PK
                </button>
                <button className={styles.outlineIconBtn} type="button" onClick={() => showToast(`发消息给 ${item.name}`)}>
                  <i className="fa-regular fa-comment" />
                </button>
              </div>
            </article>
          )) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>👋</div>
              <div className={styles.emptyTitle}>暂无好友</div>
              <div className={styles.emptyDesc}>去猜友圈认识新朋友吧~</div>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'following' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>我的关注 ({filteredFollowing.length})</span>
          </div>
          {filteredFollowing.length ? filteredFollowing.map((item) => (
            <article className={styles.card} key={item.id}>
              <button className={styles.avatarButton} type="button" onClick={() => openProfile(item.uid)}>
                <img className={styles.avatar} src={item.avatar} alt={item.name} />
              </button>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <button className={styles.nameButton} type="button" onClick={() => openProfile(item.uid)}>
                    {item.name}
                  </button>
                  {item.verified ? <i className={`fa-solid fa-circle-check ${styles.verified}`} /> : null}
                  <span className={styles.badgeBrand}>{item.tag}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaChip}>{item.desc}</span>
                  <span className={styles.metaChip}><i className="fa-solid fa-users" /> {formatFans(item.fans)}</span>
                  <span className={styles.metaChip}><i className="fa-solid fa-file-lines" /> {item.posts}动态</span>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  className={item.followed ? (item.mutual ? styles.mutualBtn : styles.followedBtn) : styles.primaryBtn}
                  type="button"
                  disabled={followSavingId === item.id}
                  onClick={() => void handleToggleFollowing(item)}
                >
                  {followSavingId === item.id ? '处理中' : item.followed ? (item.mutual ? '互关' : '已关注') : '关注'}
                </button>
              </div>
            </article>
          )) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <div className={styles.emptyTitle}>暂无关注</div>
              <div className={styles.emptyDesc}>发现感兴趣的用户就关注吧~</div>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'fans' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>我的粉丝 ({filteredFans.length})</span>
          </div>
          {filteredFans.length ? filteredFans.map((item) => (
            <article className={styles.card} key={item.id}>
              <button className={styles.avatarButton} type="button" onClick={() => openProfile(item.uid)}>
                <img className={styles.avatar} src={item.avatar} alt={item.name} />
              </button>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <button className={styles.nameButton} type="button" onClick={() => openProfile(item.uid)}>
                    {item.name}
                  </button>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaChip}>
                    <i className="fa-solid fa-crosshairs" />
                    胜率 <b className={winRateClass(item.winRate)}>{item.winRate}%</b>
                  </span>
                  <span className={styles.metaChip}>{item.bio}</span>
                </div>
                <div className={styles.fanTime}>{item.time}关注了你</div>
              </div>
              <div className={styles.actions}>
                <button
                  className={item.followedBack ? styles.mutualBtn : styles.primaryBtn}
                  type="button"
                  disabled={followSavingId === item.id}
                  onClick={() => void handleToggleFanFollow(item)}
                >
                  {followSavingId === item.id ? '处理中' : item.followedBack ? '互关' : '回关'}
                </button>
              </div>
            </article>
          )) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>✨</div>
              <div className={styles.emptyTitle}>暂无粉丝</div>
              <div className={styles.emptyDesc}>多参与竞猜互动，吸引更多关注~</div>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'requests' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>好友申请 ({filteredRequests.length})</span>
          </div>
          {filteredRequests.length ? filteredRequests.map((item) => (
            <article className={styles.requestCard} key={item.id}>
              <button className={styles.avatarButton} type="button" onClick={() => openProfile(item.uid)}>
                <img className={styles.avatar} src={item.avatar} alt={item.name} />
              </button>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <button className={styles.nameButton} type="button" onClick={() => openProfile(item.uid)}>
                    {item.name}
                  </button>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaChip}>
                    <i className="fa-solid fa-crosshairs" />
                    胜率 <b className={winRateClass(item.winRate)}>{item.winRate}%</b>
                  </span>
                </div>
                {item.mutualFriends > 0 ? (
                  <div className={styles.requestMutual}>
                    <i className="fa-solid fa-user-group" /> {item.mutualFriends} 位共同好友
                  </div>
                ) : null}
                {item.message ? <div className={styles.requestMsg}>"{item.message}"</div> : null}
                <div className={styles.requestActions}>
                  <button
                    className={styles.primaryBtn}
                    type="button"
                    disabled={requestSavingId === item.id}
                    onClick={() => void acceptRequest(item)}
                  >
                    <i className="fa-solid fa-check" /> {requestSavingId === item.id ? '处理中' : '接受'}
                  </button>
                  <button
                    className={styles.outlineBtn}
                    type="button"
                    disabled={requestSavingId === item.id}
                    onClick={() => void rejectRequest(item)}
                  >
                    <i className="fa-solid fa-xmark" /> {requestSavingId === item.id ? '处理中' : '忽略'}
                  </button>
                </div>
                <div className={styles.requestTime}>
                  <i className="fa-regular fa-clock" /> {item.time}
                </div>
              </div>
            </article>
          )) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🎉</div>
              <div className={styles.emptyTitle}>暂无新申请</div>
              <div className={styles.emptyDesc}>已处理所有好友申请</div>
            </div>
          )}
        </section>
      ) : null}

      {pkOpen && pkTarget ? (
        <div className={styles.pkOverlay} onClick={() => setPkOpen(false)} role="presentation">
          <section className={styles.pkModal} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.pkHeader}>
              <button className={styles.pkClose} type="button" onClick={() => setPkOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
              <div className={styles.pkTitle}>⚔️ 发起PK对战</div>
              <div className={styles.pkSubtitle}>选择真实竞猜项目后直接进入竞猜详情</div>
            </div>
            <div className={styles.pkVs}>
              <div className={styles.pkPlayer}>
                <img src={myAvatar} alt="我" />
                <div className={styles.pkPlayerName}>我</div>
                <div className={styles.pkPlayerStats}>进入竞猜后自行选择</div>
              </div>
              <div className={styles.pkVsIcon}>VS</div>
              <div className={styles.pkPlayer}>
                <img src={pkTarget.avatar} alt={pkTarget.name} />
                <div className={styles.pkPlayerName}>{pkTarget.name}</div>
                <div className={styles.pkPlayerStats}>胜率 {pkTarget.winRate}%</div>
              </div>
            </div>
            <div className={styles.pkSelect}>
              <div className={styles.pkSelectLabel}>选择PK竞猜项目：</div>
              <div className={styles.pkList}>
                {hotGuesses.map((item) => (
                  <button
                    className={selectedGuessId === item.id ? styles.pkItemActive : styles.pkItem}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGuessId(item.id)}
                  >
                    <div className={styles.pkItemIcon}>{item.icon}</div>
                    <div className={styles.pkItemBody}>
                      <div className={styles.pkItemTitle}>{item.title}</div>
                      <div className={styles.pkItemMeta}>{formatFans(item.participants)}人参与 · {item.options.join(' vs ')}</div>
                    </div>
                    <div className={styles.pkItemCheck}>
                      <i className="fa-solid fa-circle-check" />
                    </div>
                  </button>
                ))}
                {!hotGuesses.length ? <div className={styles.pkEmpty}>暂无可用竞猜，先去首页看看</div> : null}
              </div>
            </div>
            <div className={styles.pkFooter}>
              <button className={styles.cancelBtn} type="button" onClick={() => setPkOpen(false)}>
                取消
              </button>
              <button className={styles.primaryFooterBtn} type="button" onClick={confirmPk} disabled={!currentGuess}>
                进入竞猜
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
