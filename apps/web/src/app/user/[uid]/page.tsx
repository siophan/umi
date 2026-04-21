'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { fetchChatDetail, sendChatMessage } from '../../../lib/api/chat';
import { fetchUserProfile, fetchUserProfileActivity, followUser, unfollowUser } from '../../../lib/api/users';
import { UserProfileChatOverlay } from './user-profile-chat-overlay';
import { UserProfileSections } from './user-profile-sections';
import styles from './page.module.css';

type ProfilePost = {
  id: string;
  tag: {
    text: string;
    cls?: string;
  };
  title: string;
  desc: string;
  images: string[];
  likes: number;
  comments: number;
  time: string;
  author?: {
    name: string;
    avatar: string;
    verified?: boolean;
  };
};

type ChatMessage = {
  id: string;
  side: 'other' | 'me';
  text: string;
};

type ProfileViewModel = {
  id: string;
  uid: string;
  name: string;
  verified: boolean;
  level: string;
  bio: string;
  tags: string[];
  location: string;
  gender: string;
  age: string;
  cover: string;
  avatar: string;
  followers: number;
  following: number;
  wins: number;
  works: ProfilePost[];
  liked: ProfilePost[];
  chatSeed: ChatMessage[];
};

function formatTimeLabel(value: string) {
  if (!value) {
    return '';
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}天前`;
  }
  return new Date(value).toLocaleDateString('zh-CN');
}

function mapPostTag(tag: string | null) {
  if (!tag) {
    return { text: '猜友动态' };
  }

  if (tag.includes('品牌')) {
    return { text: tag, cls: 'tagBrand' };
  }
  if (tag.includes('竞猜') || tag.includes('预测')) {
    return { text: tag, cls: 'tagGuess' };
  }
  if (tag.includes('PK')) {
    return { text: tag, cls: 'tagPk' };
  }
  return { text: tag, cls: 'tagHot' };
}

function mapProfilePost(item: Awaited<ReturnType<typeof fetchUserProfileActivity>>['works'][number]): ProfilePost {
  return {
    id: item.id,
    tag: mapPostTag(item.tag),
    title: item.title,
    desc: item.desc,
    images: item.images,
    likes: item.likes,
    comments: item.comments,
    time: formatTimeLabel(item.createdAt),
    author: {
      name: item.authorName || '优米用户',
      avatar: item.authorAvatar || '/legacy/images/mascot/mouse-casual.png',
    },
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams<{ uid: string }>();
  const profileUid = typeof params?.uid === 'string' ? params.uid : '';
  const [profile, setProfile] = useState<ProfileViewModel | null>(null);
  const [tab, setTab] = useState<'works' | 'liked'>('works');
  const [following, setFollowing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [visibility, setVisibility] = useState({ works: true, liked: true });
  const [chatLoading, setChatLoading] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const statItems = useMemo(
    () => [
      { value: profile?.wins ?? 0, label: '获赞' },
      { value: profile?.following ?? 0, label: '关注' },
      { value: profile?.followers ?? 0, label: '粉丝' },
    ],
    [profile?.followers, profile?.following, profile?.wins],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let ignore = false;

    setProfile(null);
    setChatMessages([]);
    setVisibility({ works: true, liked: true });
    setError('');
    setLoading(true);

    async function loadProfile() {
      try {
        const [user, activity] = await Promise.all([
          fetchUserProfile(profileUid),
          fetchUserProfileActivity(profileUid),
        ]);
        if (ignore) {
          return;
        }
        setProfile({
          id: user.id,
          uid: user.uid || profileUid,
          name: user.name || '优米用户',
          verified: Boolean(user.shopVerified),
          level: `Lv.${user.level || 1}${user.title ? ` ${user.title}` : ''}`,
          bio: user.signature || '这个人很神秘，还没有留下个性签名。',
          tags: [
            user.shopVerified ? '店铺用户' : '普通用户',
            user.title || `Lv.${user.level || 1}`,
          ].filter(Boolean) as string[],
          location: user.region || '',
          gender: user.gender || '',
          age: user.birthday
            ? `${Math.max(1, new Date().getFullYear() - new Date(user.birthday).getFullYear())}岁`
            : '',
          cover: '/legacy/images/profile-banner.jpg',
          avatar: user.avatar || '/legacy/images/mascot/mouse-casual.png',
          followers: user.followers || 0,
          following: user.following || 0,
          wins: user.wins || 0,
          works: activity.works.map((item) => mapProfilePost(item)),
          liked: activity.likes.map((item) => mapProfilePost(item)),
          chatSeed: [],
        });
        setVisibility({
          works: activity.worksVisible,
          liked: activity.likedVisible,
        });
        setFollowing(user.relation === 'friend' || user.relation === 'following');
      } catch {
        if (!ignore) {
          setProfile(null);
          setChatMessages([]);
          setVisibility({ works: true, liked: true });
          setFollowing(false);
          setError('用户主页加载失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (profileUid) {
      void loadProfile();
    } else {
      setError('缺少用户标识');
      setLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, [profileUid, reloadToken]);

  async function handleCopyUid() {
    if (!profile) {
      return;
    }
    try {
      await navigator.clipboard.writeText(profile.uid || profile.id);
    } catch {
      // ignore clipboard issues
    }
    setToast('已复制优米号');
  }

  async function handleToggleFollow() {
    if (!profile || !profile.id || followSaving) {
      return;
    }

    try {
      setFollowSaving(true);
      if (following) {
        await unfollowUser(profile.id);
        setFollowing(false);
        setToast('已取消关注');
      } else {
        await followUser(profile.id);
        setFollowing(true);
        setToast('✅ 关注成功');
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setFollowSaving(false);
    }
  }

  async function openChat() {
    if (!profile || !profile.id) {
      return;
    }

    try {
      setChatLoading(true);
      setChatOpen(true);
      const detail = await fetchChatDetail(profile.id);
      setChatMessages(
        detail.items.map((item) => ({
          id: String(item.id),
          side: item.from === 'me' ? 'me' : 'other',
          text: item.content,
        })),
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : '读取聊天记录失败');
      setChatOpen(false);
    } finally {
      setChatLoading(false);
    }
  }

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text || !profile || !profile.id) {
      return;
    }

    try {
      setTyping(true);
      const sent = await sendChatMessage(profile.id, { content: text });
      setChatMessages((current) => [...current, { id: String(sent.id), side: 'me', text: sent.content }]);
      setChatInput('');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setTyping(false);
    }
  }

  if (loading) {
    return <main className={styles.page} />;
  }

  if (!profile) {
    return (
      <main className={styles.page}>
        <header className={`${styles.topbar} ${styles.topbarScrolled}`}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
        </header>
        <section className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>{error || '用户主页加载失败'}</div>
          <div className={styles.errorDesc}>请稍后重试，当前页不再回退为默认演示主页。</div>
          <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
            重新加载
          </button>
        </section>
      </main>
    );
  }

  const profileData = profile;

  return (
    <main className={styles.page}>
      <UserProfileSections
        profile={profileData}
        tab={tab}
        following={following}
        scrolled={scrolled}
        statItems={statItems}
        likedPosts={likedPosts}
        visibility={visibility}
        followSaving={followSaving}
        onBack={() => router.back()}
        onCopyUid={() => void handleCopyUid()}
        onOpenChat={() => void openChat()}
        onToggleFollow={() => void handleToggleFollow()}
        onToggleTab={setTab}
        onToggleLike={(id) =>
          setLikedPosts((current) => ({
            ...current,
            [id]: !current[id],
          }))
        }
        onShare={() => setToast('分享主页')}
        onMore={() => setToast('更多选项')}
      />

      <UserProfileChatOverlay
        open={chatOpen}
        loading={chatLoading}
        profileName={profileData.name}
        profileAvatar={profileData.avatar}
        chatMessages={chatMessages}
        chatInput={chatInput}
        typing={typing}
        onClose={() => setChatOpen(false)}
        onMore={() => setToast('更多设置')}
        onInputChange={setChatInput}
        onSend={sendMessage}
        onSendImage={() => setToast('发送图片')}
        onSendEmoji={() => setToast('发送表情')}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
