'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserSearchItem } from '@umi/shared';

import { fetchMe, logout } from '../../lib/api/auth';
import { clearAuthToken } from '../../lib/api/shared';
import { fetchMeActivity, fetchMeSummary, searchUsers } from '../../lib/api/users';
import { MobileShell } from '../../components/mobile-shell';
import { MeActivitySections } from './me-activity-sections';
import {
  buildSearchItemDesc,
  getSearchRelationLabel,
  type ActivityPost,
} from './me-helpers';
import { MeOverlays } from './me-overlays';
import { MeProfileSummary } from './me-profile-summary';
import styles from './page.module.css';

export default function MePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'works' | 'favs' | 'likes'>('works');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [activity, setActivity] = useState({
    works: [] as Array<{
      id: string;
      title: string;
      desc: string;
      tag: string | null;
      images: string[];
      likes: number;
      comments: number;
      createdAt: string;
      authorName: string | null;
      authorAvatar: string | null;
    }>,
    bookmarks: [] as Array<{
      id: string;
      title: string;
      desc: string;
      tag: string | null;
      images: string[];
      likes: number;
      comments: number;
      createdAt: string;
      authorName: string | null;
      authorAvatar: string | null;
    }>,
    likes: [] as Array<{
      id: string;
      title: string;
      desc: string;
      tag: string | null;
      images: string[];
      likes: number;
      comments: number;
      createdAt: string;
      authorName: string | null;
      authorAvatar: string | null;
    }>,
  });
  const [currentUser, setCurrentUser] = useState({
    id: '',
    uid: '',
    name: '',
    phone: '',
    avatar: '/legacy/images/mascot/mouse-main.png',
    signature: '',
    level: 1,
    following: 0,
    followers: 0,
    totalGuess: 0,
    wins: 0,
    shopVerified: false,
  });
  const [summary, setSummary] = useState({
    activeOrderCount: 0,
    warehouseItemCount: 0,
    availableCouponCount: 0,
  });
  const [authReady, setAuthReady] = useState(false);
  const likeTotal = useMemo(
    () => activity.works.reduce((sum, post) => sum + post.likes, 0),
    [activity.works],
  );
  const stats = useMemo(
    () => [
      { value: currentUser.following, label: '关注' },
      { value: currentUser.followers, label: '粉丝' },
      { value: likeTotal, label: '获赞' },
    ],
    [currentUser.followers, currentUser.following, likeTotal],
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const warehouseBadge = summary.warehouseItemCount > 0 ? Math.min(summary.warehouseItemCount, 99) : 0;
  const orderBadge = summary.activeOrderCount > 0 ? Math.min(summary.activeOrderCount, 99) : 0;

  const searchSections = useMemo(() => {
    if (!searchValue.trim()) {
      return searchResults.length > 0
        ? [
            {
              title: '推荐关注',
              items: searchResults,
            },
          ]
        : [];
    }

    return [
      {
        title: '我的好友',
        items: searchResults.filter((item) => item.relation === 'friend'),
      },
      {
        title: '我关注的人',
        items: searchResults.filter((item) => item.relation === 'following'),
      },
      {
        title: '关注我的人',
        items: searchResults.filter((item) => item.relation === 'fan'),
      },
      {
        title: '其他用户',
        items: searchResults.filter((item) => item.relation === 'none'),
      },
    ].filter((section) => section.items.length > 0);
  }, [searchResults, searchValue]);

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      try {
        const [user, meActivity, meSummary] = await Promise.all([
          fetchMe(),
          fetchMeActivity(),
          fetchMeSummary().catch(() => ({
            activeOrderCount: 0,
            warehouseItemCount: 0,
            availableCouponCount: 0,
          })),
        ]);
        if (ignore) {
          return;
        }
        setCurrentUser({
          id: user.id,
          uid: user.uid,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar || '/legacy/images/mascot/mouse-main.png',
          signature: user.signature || '',
          level: user.level || 1,
          following: user.following || 0,
          followers: user.followers || 0,
          totalGuess: user.totalGuess || 0,
          wins: user.wins || 0,
          shopVerified: user.shopVerified || false,
        });
        setUnreadMessageCount(meActivity.unreadMessageCount);
        setActivity({
          works: meActivity.works,
          bookmarks: meActivity.bookmarks,
          likes: meActivity.likes,
        });
        setSummary(meSummary);
        setAuthReady(true);
      } catch {
        if (ignore) {
          return;
        }
        clearAuthToken();
        router.replace('/login?redirect=/me');
      }
    }

    void loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, [router]);

  useEffect(() => {
    if (!searchOpen) {
      return undefined;
    }

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const result = await searchUsers(searchValue);
        if (!ignore) {
          setSearchResults(result.items);
        }
      } catch {
        if (!ignore) {
          setSearchResults([]);
        }
      } finally {
        if (!ignore) {
          setSearchLoading(false);
        }
      }
    }, searchValue.trim() ? 180 : 0);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [searchOpen, searchValue]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
    } catch {
      // Ignore logout API errors and clear local auth state anyway.
    } finally {
      clearAuthToken();
      router.replace('/login');
    }
  }

  async function handleCopyUid() {
    try {
      await navigator.clipboard.writeText(currentUser.uid || currentUser.id);
      setToast('已复制优米号');
    } catch {
      setToast('已复制');
    }
  }

  if (!authReady) {
    return (
      <MobileShell tab="me" tone="light">
        <main className={styles.page} />
      </MobileShell>
    );
  }

  return (
      <MobileShell tab="me" tone="light">
      <main className={styles.page}>
        <MeProfileSummary
          currentUser={currentUser}
          stats={stats}
          unreadMessageCount={unreadMessageCount}
          warehouseBadge={warehouseBadge}
          orderBadge={orderBadge}
          onOpenChat={() => router.push('/chat')}
          onOpenFriends={() => router.push('/friends')}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onEditProfile={() => router.push('/edit-profile')}
          onCopyUid={() => void handleCopyUid()}
          onOpenShopApply={() => setShopModalOpen(true)}
        />

        <MeActivitySections
          tab={tab}
          currentUser={{ avatar: currentUser.avatar, name: currentUser.name }}
          activity={activity}
          onChangeTab={setTab}
          onSharePost={() => setToast('分享动态')}
          onOpenCommunity={() => router.push('/community')}
        />

        <MeOverlays
          settingsOpen={settingsOpen}
          searchOpen={searchOpen}
          shopModalOpen={shopModalOpen}
          loggingOut={loggingOut}
          searchLoading={searchLoading}
          searchValue={searchValue}
          searchSections={searchSections}
          currentUser={{ name: currentUser.name, phone: currentUser.phone, avatar: currentUser.avatar }}
          summary={summary}
          onCloseSettings={() => setSettingsOpen(false)}
          onCloseSearch={() => {
            setSearchOpen(false);
            setSearchValue('');
          }}
          onCloseShopModal={() => setShopModalOpen(false)}
          onChangeSearchValue={setSearchValue}
          onPickSearchQuick={setSearchValue}
          onOpenUser={(uid, id) => {
            setSearchOpen(false);
            setSearchValue('');
            router.push(`/user/${encodeURIComponent(uid || id)}`);
          }}
          onOpenEditProfile={() => router.push('/edit-profile')}
          onOpenOrders={() => router.push('/orders')}
          onOpenAddress={() => router.push('/address')}
          onOpenCoupons={() => router.push('/coupons')}
          onShowToast={setToast}
          onLogout={() => void handleLogout()}
          onSubmitShopApply={() => {
            setShopModalOpen(false);
            router.push('/my-shop');
          }}
        />

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    </MobileShell>
  );
}
