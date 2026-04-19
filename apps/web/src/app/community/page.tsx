'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

type Scope = 'public' | 'friends' | 'fans' | 'private';

type FeedItem = {
  id: string;
  author: {
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
  name: string;
  avatar: string;
  hasNew: boolean;
};

type GuessActivity = {
  id: string;
  title: string;
  participants: number;
  options: [string, string];
  pcts: [number, number];
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
  private: {
    label: '仅自己',
    desc: '仅自己可见，用于保存草稿',
    icon: 'fa-lock',
    iconClass: styles.scopeIconPrivate,
    feedLabel: '仅自己',
  },
};

const hotTopics = [
  { icon: '🔥', text: '德芙vs费列罗', href: '/post/post-1' },
  { icon: '🏆', text: '马年年货王', href: '/post/post-2' },
  { icon: '🎯', text: '薯片新口味', href: '/post/post-3' },
  { icon: '📊', text: '本周胜率榜', href: '/ranking' },
  { icon: '🎉', text: '情人节竞猜', href: '/guess/guess-1' },
  { icon: '🌟', text: '热门竞猜', href: '/guess/guess-2' },
  { icon: '🤝', text: 'PK排行榜', href: '/ranking' },
];

const followedUsers: FollowUser[] = [
  { id: 'brand-1', name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', hasNew: true },
  { id: 'friend-1', name: '零食达人小王', avatar: '/legacy/images/mascot/mouse-main.png', hasNew: false },
  { id: 'brand-2', name: '三只松鼠', avatar: '/legacy/images/products/p003-squirrels.jpg', hasNew: false },
  { id: 'friend-2', name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', hasNew: true },
];

const recommendFeedData: FeedItem[] = [
  {
    id: 'post-1',
    author: { name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', verified: true },
    tag: { text: '品牌竞猜', cls: TAG_CLS_MAP.品牌竞猜 },
    title: '乐事2026马年限定口味投票开启！番茄味 vs 黄瓜味',
    desc: '参与竞猜赢正品零食大礼包，猜中直接发货到家。当前3890人参与！',
    images: ['/legacy/images/guess/g001.jpg'],
    guessInfo: { id: 'guess-1', options: ['番茄味', '黄瓜味'], participants: 3890, pcts: [58, 42] },
    likes: 2341,
    comments: 456,
    shares: 89,
    time: '15分钟前',
    liked: true,
    bookmarked: false,
    scope: 'public',
  },
  {
    id: 'post-2',
    author: { name: '零食测评官', avatar: '/legacy/images/guess/g202.jpg', verified: false },
    tag: { text: '零食测评', cls: TAG_CLS_MAP.零食测评 },
    title: '2026年度十大零食品牌排行榜出炉！三只松鼠再登榜首',
    desc: '根据全平台销售数据与用户口碑综合评选，看看你喜欢的品牌有没有上榜。',
    images: ['/legacy/images/products/p002-oreo.jpg', '/legacy/images/products/p005-liangpin.jpg'],
    likes: 8723,
    comments: 1204,
    shares: 188,
    time: '1小时前',
    liked: false,
    bookmarked: true,
    scope: 'friends',
  },
  {
    id: 'post-3',
    author: { name: '品牌观察员', avatar: '/legacy/images/products/p009-genki.jpg', verified: false },
    tag: { text: '品牌资讯', cls: TAG_CLS_MAP.品牌资讯 },
    title: '新品试吃开箱：今年最值得期待的年货礼盒',
    desc: '这期给大家看一下礼盒开箱和口味预测，最后还会附上开奖时间。',
    images: ['/legacy/images/guess/g202.jpg'],
    likes: 5031,
    comments: 681,
    shares: 96,
    time: '3小时前',
    liked: false,
    bookmarked: false,
    scope: 'fans',
  },
];

const followFeedData: FeedItem[] = [
  {
    id: 'follow-post-1',
    author: { name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', verified: true },
    tag: { text: '店铺动态', cls: TAG_CLS_MAP.店铺动态 },
    title: '今天仓库补了三款断货零食，评论区告诉我你最想先抢哪一包',
    desc: '刚把周末补货单整理完，黄瓜味薯片、海盐坚果和巧克力曲奇已经重新上架，晚上 8 点前下单还会加送试吃包。',
    images: ['/legacy/images/products/p001-lays.jpg', '/legacy/images/products/p003-squirrels.jpg'],
    likes: 1288,
    comments: 230,
    shares: 46,
    time: '9分钟前',
    liked: false,
    bookmarked: false,
    scope: 'public',
  },
  {
    id: 'follow-post-2',
    author: { name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', verified: true },
    tag: { text: '品牌竞猜', cls: TAG_CLS_MAP.品牌竞猜 },
    title: '德芙礼盒 PK 竞猜还剩最后 2 小时，黑巧还是榛仁更稳？',
    desc: '目前黑巧阵营暂时领先，但榛仁组追得很紧，投票区已经有不少粉丝开始晒单站队。',
    images: ['/legacy/images/products/p007-dove.jpg'],
    guessInfo: { id: 'guess-2', options: ['黑巧礼盒', '榛仁礼盒'], participants: 2145, pcts: [54, 46] },
    likes: 2450,
    comments: 312,
    shares: 71,
    time: '28分钟前',
    liked: true,
    bookmarked: true,
    scope: 'public',
  },
];

const topicOptions = ['🎯 竞猜心得', '🍿 零食测评', '🤝 PK战报', '🔥 热门话题', '📊 数据分析', '💡 攻略分享'];

const locationData = [
  { name: '📍 当前位置', address: '北京·朝阳区' },
  { name: '🏬 三里屯太古里', address: '北京市朝阳区三里屯路19号' },
  { name: '🏢 国贸CBD', address: '北京市朝阳区建国门外大街' },
  { name: '🛍️ 王府井步行街', address: '北京市东城区王府井大街' },
  { name: '🌃 外滩', address: '上海市黄浦区中山东一路' },
  { name: '🏞️ 西湖风景区', address: '杭州市西湖区龙井路1号' },
];

const mentionUsers: FollowUser[] = [
  ...followedUsers,
  { name: '零食测评官', avatar: '/legacy/images/guess/g202.jpg', hasNew: false },
  { name: '品牌观察员', avatar: '/legacy/images/products/p009-genki.jpg', hasNew: false },
];

const guessActivities: GuessActivity[] = [
  { id: 'guess-1', title: '乐事薯片新口味大竞猜', participants: 1234, options: ['番茄味', '黄瓜味'], pcts: [55, 45] },
  { id: 'guess-2', title: '德芙vs费列罗情人节对决', participants: 3890, options: ['德芙', '费列罗'], pcts: [58, 42] },
  { id: 'guess-3', title: '三只松鼠马年年货销量王', participants: 2567, options: ['坚果礼盒', '糕点系列'], pcts: [62, 38] },
];

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

function getScopeLabel(scopes: Scope[]) {
  return scopes.map((item) => SCOPE_META[item].label).join('、');
}

function getPrimaryScope(scopes: Scope[]) {
  return scopes[0] ?? 'public';
}

export default function CommunityPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<'recommend' | 'follow'>('recommend');
  const [publishOpen, setPublishOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [guessOpen, setGuessOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [publishText, setPublishText] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [recommendFeed, setRecommendFeed] = useState(recommendFeedData);
  const [followFeed, setFollowFeed] = useState(followFeedData);
  const [toast, setToast] = useState('');
  const [publishScopes, setPublishScopes] = useState<Scope[]>(['public']);
  const [scopeDraft, setScopeDraft] = useState<Scope[]>(['public']);
  const [location, setLocation] = useState<string | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [guessLink, setGuessLink] = useState<GuessActivity | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [guessQuery, setGuessQuery] = useState('');
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof emojiCategories>('😀 表情');
  const [bookmarkAnimating, setBookmarkAnimating] = useState<string | null>(null);

  const visibleFeed = useMemo(
    () => (tab === 'recommend' ? recommendFeed : followFeed),
    [followFeed, recommendFeed, tab],
  );

  const locationList = useMemo(() => {
    if (!locationQuery.trim()) {
      return locationData;
    }
    const keyword = locationQuery.trim().toLowerCase();
    return locationData.filter((item) => item.name.toLowerCase().includes(keyword) || item.address.toLowerCase().includes(keyword));
  }, [locationQuery]);

  const mentionList = useMemo(() => {
    if (!mentionQuery.trim()) {
      return mentionUsers;
    }
    const keyword = mentionQuery.trim().toLowerCase();
    return mentionUsers.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [mentionQuery]);

  const guessList = useMemo(() => {
    if (!guessQuery.trim()) {
      return guessActivities;
    }
    const keyword = guessQuery.trim().toLowerCase();
    return guessActivities.filter((item) => item.title.toLowerCase().includes(keyword));
  }, [guessQuery]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  }

  function resetPublish() {
    setPublishText('');
    setSelectedTopics([]);
    setPublishScopes(['public']);
    setScopeDraft(['public']);
    setLocation(null);
    setMentions([]);
    setGuessLink(null);
    setLocationQuery('');
    setMentionQuery('');
    setGuessQuery('');
    setEmojiCategory('😀 表情');
    setScopeOpen(false);
    setLocationOpen(false);
    setMentionOpen(false);
    setGuessOpen(false);
    setEmojiOpen(false);
  }

  function toggleLike(postId: string, currentTab: 'recommend' | 'follow') {
    const update = (list: FeedItem[]) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      );

    if (currentTab === 'recommend') {
      setRecommendFeed(update);
      return;
    }
    setFollowFeed(update);
  }

  function toggleBookmark(postId: string, currentTab: 'recommend' | 'follow', bookmarked: boolean) {
    const update = (list: FeedItem[]) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              bookmarked: !post.bookmarked,
            }
          : post,
      );

    if (currentTab === 'recommend') {
      setRecommendFeed(update);
    } else {
      setFollowFeed(update);
    }

    if (!bookmarked) {
      setBookmarkAnimating(postId);
      window.setTimeout(() => {
        setBookmarkAnimating((current) => (current === postId ? null : current));
      }, 300);
    }

    showToast(bookmarked ? '已取消收藏' : '⭐ 收藏成功');
  }

  function openScopePanel() {
    setScopeDraft(publishScopes);
    setScopeOpen(true);
  }

  function toggleScopeDraft(scope: Scope) {
    setScopeDraft((current) => {
      if (scope === 'public' || scope === 'private') {
        return [scope];
      }

      const next = current.filter((item) => item !== 'public' && item !== 'private');
      if (next.includes(scope)) {
        const filtered = next.filter((item) => item !== scope);
        return filtered.length ? filtered : ['public'];
      }

      return [...next, scope];
    });
  }

  function confirmScopes() {
    const next: Scope[] = scopeDraft.length ? scopeDraft : ['public'];
    setPublishScopes(next);
    setScopeOpen(false);
    showToast(`可见范围：${getScopeLabel(next)}`);
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((current) => (current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]));
  }

  function toggleMention(name: string) {
    setMentions((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
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

  function submitPublish() {
    const text = publishText.trim();
    if (!text) {
      return;
    }

    const tagText = selectedTopics[0]?.replace(/^.\s*/u, '') || '猜友动态';
    const primaryScope = getPrimaryScope(publishScopes);

    const newPost: FeedItem = {
      id: `local-post-${Date.now()}`,
      author: { name: myProfile.name, avatar: myProfile.avatar, verified: false },
      tag: { text: tagText, cls: TAG_CLS_MAP[tagText] ?? styles.tagCommunity },
      title: text.length > 40 ? `${text.slice(0, 40)}...` : text,
      desc: text,
      images: [],
      guessInfo: guessLink
        ? {
            id: guessLink.id,
            options: guessLink.options,
            participants: guessLink.participants,
            pcts: guessLink.pcts,
          }
        : undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      time: '刚刚',
      liked: false,
      bookmarked: false,
      scope: primaryScope,
    };

    setRecommendFeed((current) => [newPost, ...current]);
    setPublishOpen(false);
    showToast(`✅ 动态已发布 · ${getScopeLabel(publishScopes)}可见`);
    resetPublish();
    setTab('recommend');
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
              {followedUsers.map((item) => (
                <button className={styles.followItem} key={item.id} type="button" onClick={() => router.push(`/user/${item.id}`)}>
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
              ))}
            </div>
          </section>
        ) : null}

        {tab === 'recommend' ? (
          <>
            <button className={styles.banner} type="button" onClick={() => router.push('/guess/guess-2')}>
              <img src="/legacy/images/products/p001-lays.jpg" alt="热门竞猜" />
              <div className={styles.bannerOverlay}>
                <div className={styles.bannerTag}>🔥 热门竞猜</div>
                <div className={styles.bannerTitle}>马年糖果品牌大战：德芙 vs 费列罗，谁能称王？</div>
              </div>
            </button>

            <section className={styles.hotBar}>
              {hotTopics.map((item) => (
                <Link className={styles.hotItem} href={item.href} key={item.text}>
                  <span>{item.icon}</span>
                  {item.text}
                </Link>
              ))}
            </section>
          </>
        ) : null}

        <section className={styles.feed}>
          {visibleFeed.length ? (
            visibleFeed.map((item) => (
              <article className={styles.card} key={item.id} onClick={() => router.push(`/post/${encodeURIComponent(item.id)}`)}>
                <header className={styles.authorRow}>
                  <button
                    className={styles.authorAvatarBtn}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/user/${encodeURIComponent(item.author.name)}`);
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
                  <h2 className={styles.titleText}>{item.title}</h2>
                  <p className={styles.descText}>{item.desc}</p>
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
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleLike(item.id, tab);
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
                      const content = window.prompt('添加转发评论（可选）：', '');
                      if (content === null) {
                        return;
                      }
                      updateShares(item.id, tab);
                      showToast('✅ 转发成功');
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
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleBookmark(item.id, tab, Boolean(item.bookmarked));
                    }}
                  >
                    <i className={`fa-${item.bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
                  </button>
                </footer>
              </article>
            ))
          ) : (
            <div className={styles.empty}>
              <i className="fa-solid fa-inbox" />
              <div className={styles.emptyTitle}>暂无该分类内容</div>
              <div className={styles.emptyDesc}>换个分类看看吧~</div>
            </div>
          )}
        </section>

        <div className={styles.loadMore}>
          <i className="fa-solid fa-spinner fa-spin" /> 加载更多动态...
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
                  className={`${styles.publishScope} ${
                    publishScopes.length === 1 && publishScopes[0] === 'public' ? '' : styles.publishScopeChanged
                  }`}
                  type="button"
                  onClick={openScopePanel}
                >
                  <i className={`fa-solid ${SCOPE_META[getPrimaryScope(publishScopes)].icon}`} />
                  {getScopeLabel(publishScopes)}
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
                <button className={styles.mediaBtn} type="button" onClick={() => showToast('选择图片')}>
                  <i className="fa-solid fa-image" />
                  <span>图片</span>
                </button>
                <button className={styles.mediaBtn} type="button" onClick={() => showToast('拍摄视频')}>
                  <i className="fa-solid fa-video" />
                  <span>视频</span>
                </button>
              </div>

              {location || mentions.length || guessLink ? (
                <div className={styles.attachments}>
                  {location ? (
                    <span className={`${styles.attachmentTag} ${styles.attachmentLocation}`}>
                      <i className="fa-solid fa-location-dot" />
                      {location}
                      <button className={styles.attachmentRemove} type="button" onClick={() => setLocation(null)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ) : null}
                  {mentions.map((name) => (
                    <span className={`${styles.attachmentTag} ${styles.attachmentMention}`} key={name}>
                      <i className="fa-solid fa-at" />
                      {name}
                      <button className={styles.attachmentRemove} type="button" onClick={() => toggleMention(name)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ))}
                  {guessLink ? (
                    <span className={`${styles.attachmentTag} ${styles.attachmentGuess}`}>
                      <i className="fa-solid fa-link" />
                      {guessLink.title}
                      <button className={styles.attachmentRemove} type="button" onClick={() => setGuessLink(null)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.topics}>
                {topicOptions.map((item) => (
                  <button
                    className={`${styles.topicTag} ${selectedTopics.includes(item) ? styles.topicSelected : ''}`}
                    type="button"
                    key={item}
                    onClick={() => toggleTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className={styles.toolbar}>
                <button className={styles.toolbarItem} type="button" onClick={() => setLocationOpen(true)}>
                  <i className="fa-solid fa-location-dot" />
                  <span>位置</span>
                </button>
                <button className={styles.toolbarItem} type="button" onClick={() => setMentionOpen(true)}>
                  <i className="fa-solid fa-at" />
                  <span>@好友</span>
                </button>
                <button className={styles.toolbarItem} type="button" onClick={() => setGuessOpen(true)}>
                  <i className="fa-solid fa-link" />
                  <span>竞猜</span>
                </button>
                <button className={styles.toolbarItem} type="button" onClick={() => setEmojiOpen(true)}>
                  <i className="fa-regular fa-face-smile" />
                  <span>表情</span>
                </button>
              </div>

              <button className={styles.submitBtn} type="button" disabled={!publishText.trim()} onClick={submitPublish}>
                <i className="fa-solid fa-paper-plane" /> 发布动态
              </button>
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

              {(['public', 'friends', 'fans', 'private'] as Scope[]).map((item) => (
                <button
                  key={item}
                  className={`${styles.scopeOption} ${scopeDraft.includes(item) ? styles.scopeSelected : ''}`}
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

        {locationOpen ? (
          <div className={styles.subOverlay} onClick={() => setLocationOpen(false)} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>选择位置</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setLocationOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <label className={styles.searchRow}>
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  placeholder="搜索地点..."
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                />
              </label>

              <div className={styles.locationList}>
                <button
                  className={`${styles.locationItem} ${styles.locationCurrent}`}
                  type="button"
                  onClick={() => {
                    setLocation('📍 当前位置');
                    setLocationOpen(false);
                    showToast('📍 已选择：📍 当前位置');
                  }}
                >
                  <span className={`${styles.locationIcon} ${styles.locationIconCurrent}`}>
                    <i className="fa-solid fa-crosshairs" />
                  </span>
                  <span className={styles.locationMeta}>
                    <span className={styles.locationName}>使用当前位置</span>
                    <span className={styles.locationAddress}>北京·朝阳区</span>
                  </span>
                </button>
                <button
                  className={styles.locationItem}
                  type="button"
                  onClick={() => {
                    setLocation(null);
                    setLocationOpen(false);
                    showToast('已取消位置');
                  }}
                >
                  <span className={`${styles.locationIcon} ${styles.locationIconMuted}`}>
                    <i className="fa-solid fa-xmark" />
                  </span>
                  <span className={styles.locationMeta}>
                    <span className={styles.locationName}>不显示位置</span>
                  </span>
                </button>
                {locationList.map((item) => (
                  <button
                    className={styles.locationItem}
                    key={`${item.name}-${item.address}`}
                    type="button"
                    onClick={() => {
                      setLocation(item.name);
                      setLocationOpen(false);
                      showToast(`📍 已选择：${item.name}`);
                    }}
                  >
                    <span className={styles.locationIcon}>
                      <i className="fa-solid fa-location-dot" />
                    </span>
                    <span className={styles.locationMeta}>
                      <span className={styles.locationName}>{item.name}</span>
                      <span className={styles.locationAddress}>{item.address}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {mentionOpen ? (
          <div className={styles.subOverlay} onClick={() => setMentionOpen(false)} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>@ 好友</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setMentionOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <label className={styles.searchRow}>
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  placeholder="搜索好友..."
                  value={mentionQuery}
                  onChange={(event) => setMentionQuery(event.target.value)}
                />
              </label>

              {mentions.length ? (
                <div className={styles.mentionChips}>
                  {mentions.map((name) => (
                    <span className={styles.mentionChip} key={name}>
                      @{name}
                      <button className={styles.mentionChipRemove} type="button" onClick={() => toggleMention(name)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className={styles.mentionList}>
                {mentionList.map((item) => (
                  <button className={styles.mentionItem} key={item.name} type="button" onClick={() => toggleMention(item.name)}>
                    <img src={item.avatar} alt={item.name} />
                    <span className={styles.mentionName}>{item.name}</span>
                    <span className={`${styles.mentionCheck} ${mentions.includes(item.name) ? styles.mentionChecked : ''}`}>
                      <i className="fa-solid fa-circle-check" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {guessOpen ? (
          <div className={styles.subOverlay} onClick={() => setGuessOpen(false)} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>关联竞猜</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setGuessOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <label className={styles.searchRow}>
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  placeholder="搜索竞猜活动..."
                  value={guessQuery}
                  onChange={(event) => setGuessQuery(event.target.value)}
                />
              </label>

              <div className={styles.guessList}>
                {guessList.map((item) => {
                  const selected = guessLink?.id === item.id;
                  return (
                    <button
                      className={`${styles.guessItem} ${selected ? styles.guessItemSelected : ''}`}
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const next = selected ? null : item;
                        setGuessLink(next);
                        if (next) {
                          setGuessOpen(false);
                          showToast(`🎯 已关联：${next.title}`);
                        }
                      }}
                    >
                      <span className={styles.guessItemIcon}>🎯</span>
                      <span className={styles.guessItemInfo}>
                        <span className={styles.guessItemTitle}>{item.title}</span>
                        <span className={styles.guessItemMeta}>
                          {item.participants}人参与 · {item.options.join(' vs ')}
                        </span>
                      </span>
                      <span className={`${styles.guessItemCheck} ${selected ? styles.guessItemCheckSelected : ''}`}>
                        <i className="fa-solid fa-circle-check" />
                      </span>
                    </button>
                  );
                })}
              </div>
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
