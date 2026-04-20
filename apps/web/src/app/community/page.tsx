'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

import { MobileShell } from '../../components/mobile-shell';
import type { CommunityFeedItem as CommunityFeedApiItem } from '@umi/shared';

import {
  bookmarkCommunityPost,
  createCommunityPost,
  fetchCommunityDiscovery,
  fetchCommunityFeed,
  likeCommunityPost,
  repostCommunityPost,
  unbookmarkCommunityPost,
  unlikeCommunityPost,
} from '../../lib/api/community';
import { fetchSocialOverview } from '../../lib/api/friends';
import styles from './page.module.css';

type Scope = 'public' | 'friends' | 'fans' | 'followers' | 'private';
type PublishScope = 'public' | 'followers' | 'private';

type FeedItem = {
  id: string;
  author: {
    uid?: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  tag: { text: string; cls: string };
  title: string;
  desc: string;
  images: string[];
  guessInfo?: {
    id: string;
    options: [string, string];
    participants: number;
    pcts: [number, number];
  };
  likes: number;
  comments: number;
  shares: number;
  time: string;
  liked?: boolean;
  bookmarked?: boolean;
  scope?: Scope;
};

type FollowUser = {
  id: string;
  uid?: string;
  name: string;
  avatar: string;
  hasNew: boolean;
};

const TAG_CLS_MAP: Record<string, string> = {
  品牌竞猜: styles.tagBrand,
  猜友动态: styles.tagCommunity,
  品牌资讯: styles.tagBrand,
  零食测评: styles.tagHot,
  PK战报: styles.tagPk,
  平台公告: styles.tagBrand,
  店铺动态: styles.tagHot,
  店铺推荐: styles.tagHot,
  转发: styles.tagCommunity,
};

const SCOPE_META: Record<
  Scope,
  { label: string; desc: string; icon: string; iconClass: string; feedLabel?: string }
> = {
  public: {
    label: '所有人',
    desc: '所有猜友都可以看到',
    icon: 'fa-earth-americas',
    iconClass: styles.scopeIconPublic,
  },
  friends: {
    label: '好友',
    desc: '仅互相关注的好友可见',
    icon: 'fa-user-group',
    iconClass: styles.scopeIconFriends,
    feedLabel: '好友可见',
  },
  fans: {
    label: '粉丝',
    desc: '仅关注你的粉丝可见',
    icon: 'fa-heart',
    iconClass: styles.scopeIconFans,
    feedLabel: '粉丝可见',
  },
  followers: {
    label: '粉丝',
    desc: '仅关注你的粉丝可见',
    icon: 'fa-heart',
    iconClass: styles.scopeIconFans,
    feedLabel: '粉丝可见',
  },
  private: {
    label: '仅自己',
    desc: '仅自己可见，用于保存草稿',
    icon: 'fa-lock',
    iconClass: styles.scopeIconPrivate,
    feedLabel: '仅自己',
  },
};

const defaultFollowedUsers: FollowUser[] = [
  { id: 'brand-1', uid: 'brand-1', name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', hasNew: true },
  { id: 'friend-1', uid: 'friend-1', name: '零食达人小王', avatar: '/legacy/images/mascot/mouse-main.png', hasNew: false },
  { id: 'brand-2', uid: 'brand-2', name: '三只松鼠', avatar: '/legacy/images/products/p003-squirrels.jpg', hasNew: false },
  { id: 'friend-2', uid: 'friend-2', name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', hasNew: true },
];

const topicOptions = ['🎯 竞猜心得', '🍿 零食测评', '🤝 PK战报', '🔥 热门话题', '📊 数据分析', '💡 攻略分享'];

const emojiCategories = {
  '😀 表情': ['😀', '😃', '😄', '😁', '😆', '😂', '🙂', '😊', '🥰', '😍', '😎', '🤔', '😮', '😢', '😭', '🥳'],
  '👍 手势': ['👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '👌', '✌️', '🤞', '❤️', '🔥'],
  '🎉 活动': ['🎉', '🎊', '🎈', '🎁', '🎯', '🏆', '🥇', '💰', '⭐', '🌟', '✨', '💥'],
  '🍕 美食': ['🍿', '🥤', '🍫', '🍬', '🍪', '🥜', '🍓', '🍍', '🍋', '🌶️', '🍕', '🍔'],
} as const;

const myProfile = {
  name: '我',
  avatar: '/legacy/images/mascot/mouse-main.png',
};

function fmtNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return '刚刚';
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.max(1, Math.floor(diff / day))}天前`;
  }
  return new Date(value).toISOString().slice(0, 10);
}

function mapCommunityFeedItem(item: CommunityFeedApiItem): FeedItem {
  const tagText = item.tag?.trim() || '猜友动态';
  return {
    id: item.id,
    author: {
      uid: item.author.uid,
      name: item.author.name,
      avatar: item.author.avatar || '/legacy/images/mascot/mouse-main.png',
      verified: item.author.verified,
    },
    tag: {
      text: tagText,
      cls: TAG_CLS_MAP[tagText] ?? styles.tagCommunity,
    },
    title: item.title,
    desc: item.desc,
    images: item.images,
    guessInfo: item.guessInfo
      ? {
          id: item.guessInfo.id,
          options: item.guessInfo.options,
          participants: item.guessInfo.participants,
          pcts: item.guessInfo.pcts,
        }
      : undefined,
    likes: item.likes,
    comments: item.comments,
    shares: item.shares,
    time: formatRelativeTime(item.createdAt),
    liked: item.liked,
    bookmarked: item.bookmarked,
    scope: item.scope,
  };
}

function normalizePostPreviewText(value: string | null | undefined) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function shouldRenderStandaloneTitle(title: string | null | undefined, desc: string | null | undefined) {
  const normalizedTitle = normalizePostPreviewText(title);
  if (!normalizedTitle) {
    return false;
  }

  const normalizedDesc = normalizePostPreviewText(desc);
  if (!normalizedDesc) {
    return true;
  }

  return normalizedTitle !== normalizedDesc;
}

function getScopeLabel(scope: PublishScope) {
  return SCOPE_META[scope].label;
}

export default function CommunityPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<'recommend' | 'follow'>('recommend');
  const [publishOpen, setPublishOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [publishText, setPublishText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [recommendFeed, setRecommendFeed] = useState<FeedItem[]>([]);
  const [followFeed, setFollowFeed] = useState<FeedItem[]>([]);
  const [toast, setToast] = useState('');
  const [publishScope, setPublishScope] = useState<PublishScope>('public');
  const [scopeDraft, setScopeDraft] = useState<PublishScope>('public');
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof emojiCategories>('😀 表情');
  const [bookmarkAnimating, setBookmarkAnimating] = useState<string | null>(null);
  const [followedUsers, setFollowedUsers] = useState<FollowUser[]>([]);
  const [socialReady, setSocialReady] = useState(false);
  const [feedReady, setFeedReady] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [likeSavingId, setLikeSavingId] = useState('');
  const [bookmarkSavingId, setBookmarkSavingId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hotTopics, setHotTopics] = useState<Array<{ text: string; desc: string; href: string }>>([]);
  const [heroPost, setHeroPost] = useState<FeedItem | null>(null);
  const [repostTarget, setRepostTarget] = useState<{
    postId: string;
    tab: 'recommend' | 'follow';
    title: string;
    author: string;
  } | null>(null);
  const [repostDraft, setRepostDraft] = useState('转发动态');
  const [repostSaving, setRepostSaving] = useState(false);

  const visibleFeed = useMemo(
    () => (tab === 'recommend' ? recommendFeed : followFeed),
    [followFeed, recommendFeed, tab],
  );

  useEffect(() => {
    let ignore = false;

    async function loadSocial() {
      try {
        const result = await fetchSocialOverview();
        if (ignore) {
          return;
        }

        const mergedUsers = [...result.following, ...result.friends];
        const deduped = mergedUsers.reduce<FollowUser[]>((acc, item, index) => {
          const uid = String(item.uid || item.id || '').trim();
          if (!uid || acc.some((entry) => entry.id === String(item.id))) {
            return acc;
          }

          acc.push({
            id: String(item.id),
            uid,
            name: item.name || '未知用户',
            avatar: item.avatar || '/legacy/images/mascot/mouse-main.png',
            hasNew: index < result.following.length,
          });
          return acc;
        }, []);

        setFollowedUsers(deduped.filter((_, index) => index < 10));
      } catch {
        if (ignore) {
          return;
        }
        setFollowedUsers([]);
      } finally {
        if (!ignore) {
          setSocialReady(true);
        }
      }
    }

    void loadSocial();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFeed() {
      try {
        const [recommendResult, followResult, discoveryResult] = await Promise.all([
          fetchCommunityFeed('recommend'),
          fetchCommunityFeed('follow'),
          fetchCommunityDiscovery(),
        ]);
        if (ignore) {
          return;
        }

        setRecommendFeed(recommendResult.items.map(mapCommunityFeedItem));
        setFollowFeed(followResult.items.map(mapCommunityFeedItem));
        setHeroPost(discoveryResult.hero ? mapCommunityFeedItem(discoveryResult.hero) : null);
        setHotTopics(discoveryResult.hotTopics);
        setFeedError('');
      } catch (error) {
        if (ignore) {
          return;
        }
        setRecommendFeed([]);
        setFollowFeed([]);
        setHeroPost(null);
        setHotTopics([]);
        setFeedError(error instanceof Error ? error.message : '社区动态加载失败');
      } finally {
        if (!ignore) {
          setFeedReady(true);
        }
      }
    }

    void loadFeed();
    return () => {
      ignore = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  }

  function resetPublish() {
    setPublishText('');
    setSelectedTopic(null);
    setPublishScope('public');
    setScopeDraft('public');
    setEmojiCategory('😀 表情');
    setSelectedImages([]);
    setScopeOpen(false);
    setEmojiOpen(false);
  }

  function openRepostComposer(item: FeedItem, currentTab: 'recommend' | 'follow') {
    setRepostTarget({
      postId: item.id,
      tab: currentTab,
      title: item.title,
      author: item.author.name,
    });
    setRepostDraft('转发动态');
  }

  function closeRepostComposer() {
    if (repostSaving) {
      return;
    }
    setRepostTarget(null);
    setRepostDraft('转发动态');
  }

  function updateFeedList(currentTab: 'recommend' | 'follow', updater: (list: FeedItem[]) => FeedItem[]) {
    if (currentTab === 'recommend') {
      setRecommendFeed(updater);
      return;
    }
    setFollowFeed(updater);
  }

  async function toggleLike(postId: string, currentTab: 'recommend' | 'follow') {
    if (likeSavingId === postId) {
      return;
    }

    const target = (currentTab === 'recommend' ? recommendFeed : followFeed).find((item) => item.id === postId);
    if (!target) {
      return;
    }

    const nextLiked = !target.liked;
    const update = (list: FeedItem[]) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: nextLiked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      );

    updateFeedList(currentTab, update);
    setLikeSavingId(postId);

    try {
      if (nextLiked) {
        await likeCommunityPost(postId);
      } else {
        await unlikeCommunityPost(postId);
      }
    } catch (error) {
      updateFeedList(currentTab, (list) =>
        list.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: target.liked,
                likes: target.likes,
              }
            : post,
        ),
      );
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLikeSavingId('');
    }
  }

  async function toggleBookmark(postId: string, currentTab: 'recommend' | 'follow', bookmarked: boolean) {
    if (bookmarkSavingId === postId) {
      return;
    }

    updateFeedList(currentTab, (list) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              bookmarked: !post.bookmarked,
            }
          : post,
      ),
    );

    if (!bookmarked) {
      setBookmarkAnimating(postId);
      window.setTimeout(() => {
        setBookmarkAnimating((current) => (current === postId ? null : current));
      }, 300);
    }
    setBookmarkSavingId(postId);

    try {
      if (bookmarked) {
        await unbookmarkCommunityPost(postId);
      } else {
        await bookmarkCommunityPost(postId);
      }
      showToast(bookmarked ? '已取消收藏' : '⭐ 收藏成功');
    } catch (error) {
      updateFeedList(currentTab, (list) =>
        list.map((post) =>
          post.id === postId
            ? {
                ...post,
                bookmarked,
              }
            : post,
        ),
      );
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBookmarkSavingId('');
    }
  }

  function openScopePanel() {
    setScopeDraft(publishScope);
    setScopeOpen(true);
  }

  function toggleScopeDraft(scope: PublishScope) {
    setScopeDraft(scope);
  }

  function confirmScopes() {
    setPublishScope(scopeDraft);
    setScopeOpen(false);
    showToast(`可见范围：${getScopeLabel(scopeDraft)}`);
  }

  function toggleTopic(topic: string) {
    setSelectedTopic((current) => (current === topic ? null : topic));
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setPublishText((current) => `${current}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? publishText.length;
    const end = textarea.selectionEnd ?? publishText.length;
    const next = `${publishText.slice(0, start)}${emoji}${publishText.slice(end)}`;
    setPublishText(next);

    window.setTimeout(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function updateShares(postId: string, currentTab: 'recommend' | 'follow') {
    const update = (list: FeedItem[]) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              shares: post.shares + 1,
            }
          : post,
      );

    if (currentTab === 'recommend') {
      setRecommendFeed(update);
      return;
    }

    setFollowFeed(update);
  }

  function removeSelectedImage(target: string) {
    setSelectedImages((current) => current.filter((item) => item !== target));
  }

  async function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 3);
    if (!files.length) {
      return;
    }

    const encoded = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(new Error('图片读取失败'));
            reader.readAsDataURL(file);
          }),
      ),
    );
    setSelectedImages((current) => [...current, ...encoded].filter(Boolean).slice(0, 3));
    event.target.value = '';
  }

  async function submitPublish() {
    const text = publishText.trim();
    if (!text || publishing) {
      return;
    }

    const tagText = selectedTopic?.replace(/^.\s*/u, '') || '猜友动态';

    try {
      setPublishing(true);
      const created = await createCommunityPost({
        content: text,
        tag: tagText,
        scope: publishScope,
        images: selectedImages,
      });
      const mapped = mapCommunityFeedItem(created);
      setRecommendFeed((current) => [mapped, ...current]);
      if (tab === 'follow') {
        setFollowFeed((current) => [mapped, ...current]);
      }
      setPublishOpen(false);
      showToast(`✅ 动态已发布 · ${getScopeLabel(publishScope)}可见`);
      resetPublish();
      setTab('recommend');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  }

  async function handleRepostSubmit() {
    if (!repostTarget || repostSaving) {
      return;
    }

    const content = repostDraft.trim() || '转发动态';

    try {
      setRepostSaving(true);
      const reposted = await repostCommunityPost(repostTarget.postId, {
        content,
        scope: 'public',
      });
      const mapped = mapCommunityFeedItem(reposted);
      setRecommendFeed((current) => [mapped, ...current]);
      if (repostTarget.tab === 'follow') {
        setFollowFeed((current) => [mapped, ...current]);
      }
      updateShares(repostTarget.postId, repostTarget.tab);
      setRepostTarget(null);
      setRepostDraft('转发动态');
      showToast('✅ 转发成功');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '转发失败');
    } finally {
      setRepostSaving(false);
    }
  }

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
          <section className={styles.followBar}>
            <div className={styles.followBarTitle}>
              <span>我关注的猜友</span>
              <Link href="/friends">
                管理关注 <i className="fa-solid fa-chevron-right" />
              </Link>
            </div>
            <div className={styles.followScroll}>
              {followedUsers.length ? followedUsers.map((item) => (
                <button className={styles.followItem} key={item.id} type="button" onClick={() => router.push(`/user/${encodeURIComponent(item.uid || item.id)}`)}>
                  <div className={styles.followAvatarWrap}>
                    <img
                      className={`${styles.followAvatar} ${item.hasNew ? styles.followAvatarNew : styles.followAvatarOld}`}
                      src={item.avatar}
                      alt={item.name}
                    />
                    {item.hasNew ? <span className={styles.followDot} /> : null}
                  </div>
                  <span className={styles.followName}>{item.name}</span>
                </button>
              )) : socialReady ? (
                <div className={styles.followEmpty}>你还没有关注任何猜友</div>
              ) : (
                defaultFollowedUsers.map((item) => (
                  <div className={styles.followItemSkeleton} key={item.id} />
                ))
              )}
            </div>
          </section>
        ) : null}

        {tab === 'recommend' ? (
          <>
            {heroPost ? (
              <button className={styles.banner} type="button" onClick={() => router.push(`/post/${encodeURIComponent(heroPost.id)}`)}>
                <img src={heroPost.images[0] || heroPost.author.avatar || '/legacy/images/mascot/mouse-main.png'} alt={heroPost.title} />
                <div className={styles.bannerOverlay}>
                  <div className={styles.bannerTag}>🔥 社区热议</div>
                  <div className={styles.bannerTitle}>{heroPost.title}</div>
                </div>
              </button>
            ) : null}

            <section className={styles.hotBar}>
              {hotTopics.map((item) => (
                <Link className={styles.hotItem} href={item.href} key={item.text}>
                  <span>🔥</span>
                  {item.text}
                </Link>
              ))}
            </section>
          </>
        ) : null}

        <section className={styles.feed}>
          {!feedReady ? (
            <div className={styles.empty}>
              <i className="fa-solid fa-spinner fa-spin" />
              <div className={styles.emptyTitle}>动态加载中</div>
              <div className={styles.emptyDesc}>正在同步社区内容...</div>
            </div>
          ) : visibleFeed.length ? (
            visibleFeed.map((item) => {
              const showStandaloneTitle = shouldRenderStandaloneTitle(item.title, item.desc);
              return (
              <article className={styles.card} key={item.id} onClick={() => router.push(`/post/${encodeURIComponent(item.id)}`)}>
                <header className={styles.authorRow}>
                  <button
                    className={styles.authorAvatarBtn}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/user/${encodeURIComponent(item.author.uid || item.author.name)}`);
                    }}
                  >
                    <img src={item.author.avatar} alt={item.author.name} />
                  </button>
                  <div className={styles.authorMeta}>
                    <div className={styles.authorName}>
                      {item.author.name}
                      {item.author.verified ? <i className="fa-solid fa-circle-check" /> : null}
                    </div>
                    <div className={styles.authorTime}>
                      {item.time}
                      {item.scope && item.scope !== 'public' ? (
                        <>
                          {' · '}
                          <i className={`fa-solid ${SCOPE_META[item.scope].icon}`} />
                          {' '}
                          {SCOPE_META[item.scope].feedLabel}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <span className={`${styles.tag} ${item.tag.cls}`}>{item.tag.text}</span>
                </header>

                <div className={styles.body}>
                  {showStandaloneTitle ? <h2 className={styles.titleText}>{item.title}</h2> : null}
                  <p className={`${styles.descText} ${showStandaloneTitle ? '' : styles.descTextOnly}`}>{item.desc}</p>
                </div>

                {item.images.length ? (
                  <div
                    className={`${styles.images} ${
                      item.images.length === 1 ? styles.img1 : item.images.length === 2 ? styles.img2 : styles.img3
                    }`}
                  >
                    {item.images.slice(0, 3).map((src) => (
                      <img src={src} alt={item.title} key={src} />
                    ))}
                  </div>
                ) : null}

                {item.guessInfo ? (
                  <>
                    <button
                      className={styles.guessBar}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/guess/${item.guessInfo?.id}`);
                      }}
                    >
                      <div className={styles.guessIcon}>🎯</div>
                      <div className={styles.guessInfo}>
                        <div className={styles.guessTitle}>{item.guessInfo.options.join(' vs ')}</div>
                        <div className={styles.guessData}>{fmtNum(item.guessInfo.participants)}人参与</div>
                      </div>
                      <span className={styles.guessBtn}>去竞猜</span>
                    </button>

                    <div className={styles.pkMini}>
                      <div className={`${styles.pkSeg} ${styles.pkSeg0}`} style={{ width: `${item.guessInfo.pcts[0]}%` }}>
                        {item.guessInfo.pcts[0]}%
                      </div>
                      <div className={`${styles.pkSeg} ${styles.pkSeg1}`} style={{ width: `${item.guessInfo.pcts[1]}%` }}>
                        {item.guessInfo.pcts[1]}%
                      </div>
                    </div>
                  </>
                ) : null}

                <footer className={styles.actions}>
                  <button
                    className={styles.actionItem}
                    type="button"
                    disabled={likeSavingId === item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleLike(item.id, tab);
                    }}
                  >
                    <i className={`fa-${item.liked ? 'solid' : 'regular'} fa-heart ${item.liked ? styles.actionLiked : ''}`} />
                    {fmtNum(item.likes)}
                  </button>
                  <button
                    className={styles.actionItem}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/post/${encodeURIComponent(item.id)}`);
                    }}
                  >
                    <i className="fa-regular fa-comment" />
                    {fmtNum(item.comments)}
                  </button>
                  <button
                    className={styles.actionItem}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openRepostComposer(item, tab);
                    }}
                  >
                    <i className="fa-solid fa-share-nodes" />
                    {fmtNum(item.shares)}
                  </button>
                  <button
                    className={`${styles.actionItem} ${styles.actionFav} ${item.bookmarked ? styles.favorited : ''} ${
                      bookmarkAnimating === item.id ? styles.favoritedPop : ''
                    }`}
                    type="button"
                    disabled={bookmarkSavingId === item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleBookmark(item.id, tab, Boolean(item.bookmarked));
                    }}
                  >
                    <i className={`fa-${item.bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
                  </button>
                </footer>
              </article>
              );
            })
          ) : (
            <div className={styles.empty}>
              <i className={`fa-solid ${feedError ? 'fa-triangle-exclamation' : 'fa-inbox'}`} />
              <div className={styles.emptyTitle}>{feedError ? '动态加载失败' : '暂无该分类内容'}</div>
              <div className={styles.emptyDesc}>{feedError || '换个分类看看吧~'}</div>
            </div>
          )}
        </section>

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

        {publishOpen ? (
          <div className={styles.publishOverlay} onClick={() => setPublishOpen(false)} role="presentation">
            <section className={styles.publishPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.handle} />
              <div className={styles.publishHeader}>
                <h3>发布动态</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setPublishOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.publishUser}>
                <img src={myProfile.avatar} alt={myProfile.name} />
                <div className={styles.publishUserName}>{myProfile.name}</div>
                <button
                  className={`${styles.publishScope} ${publishScope === 'public' ? '' : styles.publishScopeChanged}`}
                  type="button"
                  onClick={openScopePanel}
                >
                  <i className={`fa-solid ${SCOPE_META[publishScope].icon}`} />
                  {getScopeLabel(publishScope)}
                  <i className="fa-solid fa-chevron-down" />
                </button>
              </div>

              <textarea
                autoFocus
                ref={textareaRef}
                className={styles.textarea}
                placeholder="分享你的竞猜心得、零食测评、PK战报..."
                value={publishText}
                onChange={(event) => setPublishText(event.target.value)}
              />

              <div className={styles.mediaRow}>
                <input
                  ref={imageInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void selectImages(event)}
                />
                <button className={styles.mediaBtn} type="button" onClick={() => imageInputRef.current?.click()}>
                  <i className="fa-solid fa-image" />
                  <span>图片</span>
                </button>
                <button className={styles.mediaBtn} type="button" onClick={() => setSelectedImages([])}>
                  <i className="fa-solid fa-eraser" />
                  <span>清空图片</span>
                </button>
              </div>

              {selectedImages.length ? (
                <div className={styles.imagePreviewRow}>
                  {selectedImages.map((image) => (
                    <div className={styles.imagePreviewCard} key={image}>
                      <img src={image} alt="动态图片" />
                      <button className={styles.imagePreviewRemove} type="button" onClick={() => removeSelectedImage(image)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedImages.length ? (
                <div className={styles.attachments}>
                  {selectedImages.length ? (
                    <span className={styles.attachmentTag}>
                      <i className="fa-solid fa-image" />
                      已添加 {selectedImages.length} 张图片
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.topics}>
                {topicOptions.map((item) => (
                  <button
                    className={`${styles.topicTag} ${selectedTopic === item ? styles.topicSelected : ''}`}
                    type="button"
                    key={item}
                    onClick={() => toggleTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className={styles.toolbar}>
                <button className={styles.toolbarItem} type="button" onClick={() => setEmojiOpen(true)}>
                  <i className="fa-regular fa-face-smile" />
                  <span>表情</span>
                </button>
              </div>

              <button className={styles.submitBtn} type="button" disabled={!publishText.trim() || publishing} onClick={() => void submitPublish()}>
                <i className={`fa-solid ${publishing ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} /> {publishing ? '发布中' : '发布动态'}
              </button>
            </section>
          </div>
        ) : null}

        {repostTarget ? (
          <div className={styles.subOverlay} onClick={closeRepostComposer} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>转发动态</h3>
                <button className={styles.closeBtn} type="button" onClick={closeRepostComposer}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.repostLead}>
                <span className={styles.repostLeadIcon}>
                  <i className="fa-solid fa-retweet" />
                </span>
                <div className={styles.repostLeadText}>
                  <strong>转发到猜友圈</strong>
                  <span>补一句态度，动态会更完整。</span>
                </div>
              </div>

              <div className={styles.repostSummary}>
                <div className={styles.repostLabel}>原动态</div>
                <div className={styles.repostTitle}>{repostTarget.title || '未命名动态'}</div>
                <div className={styles.repostMeta}>作者 · {repostTarget.author}</div>
              </div>

              <div className={styles.repostField}>
                <textarea
                  autoFocus
                  className={styles.repostTextarea}
                  placeholder="这一条我为什么想转发？"
                  value={repostDraft}
                  onChange={(event) => setRepostDraft(event.target.value)}
                />
                <div className={styles.repostFieldMeta}>
                  <span>公开发布，所有人可见</span>
                  <span>{repostDraft.trim().length} 字</span>
                </div>
              </div>

              <div className={styles.repostActions}>
                <button className={styles.repostGhostBtn} type="button" onClick={closeRepostComposer}>
                  取消
                </button>
                <button
                  className={styles.repostSubmitBtn}
                  type="button"
                  disabled={repostSaving}
                  onClick={() => void handleRepostSubmit()}
                >
                  <i className={`fa-solid ${repostSaving ? 'fa-spinner fa-spin' : 'fa-retweet'}`} /> {repostSaving ? '转发中' : '确认转发'}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {scopeOpen ? (
          <div className={styles.subOverlay} onClick={() => setScopeOpen(false)} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>谁可以看</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setScopeOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {(['public', 'followers', 'private'] as PublishScope[]).map((item) => (
                <button
                  key={item}
                  className={`${styles.scopeOption} ${scopeDraft === item ? styles.scopeSelected : ''}`}
                  type="button"
                  onClick={() => toggleScopeDraft(item)}
                >
                  <span className={`${styles.scopeIcon} ${SCOPE_META[item].iconClass}`}>
                    <i className={`fa-solid ${SCOPE_META[item].icon}`} />
                  </span>
                  <span className={styles.scopeInfo}>
                    <span className={styles.scopeName}>{SCOPE_META[item].label}</span>
                    <span className={styles.scopeDesc}>{SCOPE_META[item].desc}</span>
                  </span>
                  <i className={`fa-solid fa-circle-check ${styles.scopeCheck}`} />
                </button>
              ))}

              <button className={styles.scopeConfirm} type="button" onClick={confirmScopes}>
                确定
              </button>
            </section>
          </div>
        ) : null}

        {emojiOpen ? (
          <div className={styles.subOverlay} onClick={() => setEmojiOpen(false)} role="presentation">
            <section className={`${styles.subPanel} ${styles.emojiPanel}`} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>选择表情</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setEmojiOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.emojiTabs}>
                {(Object.keys(emojiCategories) as Array<keyof typeof emojiCategories>).map((item) => (
                  <button
                    className={`${styles.emojiTab} ${emojiCategory === item ? styles.emojiTabActive : ''}`}
                    key={item}
                    type="button"
                    onClick={() => setEmojiCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className={styles.emojiGrid}>
                {emojiCategories[emojiCategory].map((item) => (
                  <button
                    className={styles.emojiButton}
                    key={`${emojiCategory}-${item}`}
                    type="button"
                    onClick={() => insertEmoji(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    </MobileShell>
  );
}
