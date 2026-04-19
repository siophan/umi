'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { fetchChatDetail, fetchUserProfile, fetchUserProfileActivity, followUser, sendChatMessage, unfollowUser } from '../../../lib/api';
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

const fallbackProfiles: Record<string, ProfileViewModel> = {
  'friend-1': {
    id: 'friend-1',
    uid: 'Friend_001',
    name: '零食侦探社',
    verified: false,
    level: 'Lv.12 猜圈达人',
    bio: '最擅长研究新品零食和竞猜节奏，偶尔发一点开箱和战报。',
    tags: ['零食达人', '竞猜预测'],
    location: '上海',
    gender: '男',
    age: '26岁',
    cover: '/legacy/images/profile-banner.jpg',
    avatar: '/legacy/images/mascot/mouse-main.png',
    followers: 1256,
    following: 89,
    wins: 2034,
    works: [
      {
        id: 'work-1',
        tag: { text: '竞猜预测', cls: 'tagGuess' },
        title: '乐事马年限定口味这轮我更看好番茄味',
        desc: '从评论区反馈和以往联名销量看，番茄味更容易破圈，竞猜这边我先站番茄。',
        images: ['/legacy/images/products/p001-lays.jpg'],
        likes: 326,
        comments: 48,
        time: '15分钟前',
      },
      {
        id: 'work-2',
        tag: { text: '零食开箱', cls: 'tagHot' },
        title: '这周到手的三份竞猜奖品，一次性开箱',
        desc: '奥利奥礼盒、德芙巧克力和元气森林都到了，包装完整度比上个月明显好。',
        images: [
          '/legacy/images/products/p002-oreo.jpg',
          '/legacy/images/products/p007-dove.jpg',
          '/legacy/images/products/p009-genki.jpg',
        ],
        likes: 518,
        comments: 92,
        time: '2小时前',
      },
    ],
    liked: [
      {
        id: 'liked-1',
        tag: { text: '品牌竞猜', cls: 'tagBrand' },
        title: '三只松鼠周年直播场值得冲吗？',
        desc: '直播转化和福袋机制都在线，偏保守的也可以蹲第二轮补仓。',
        images: ['/legacy/images/products/p003-squirrels.jpg'],
        likes: 641,
        comments: 75,
        time: '昨天',
        author: {
          name: '三只松鼠官方店',
          avatar: '/legacy/images/products/p003-squirrels.jpg',
          verified: true,
        },
      },
    ],
    chatSeed: [
      { id: 'c-1', side: 'other', text: '哈喽，看你也在蹲这轮乐事竞猜。' },
      { id: 'c-2', side: 'me', text: '对，这轮热度很高，你更看好哪个选项？' },
      { id: 'c-3', side: 'other', text: '我先押番茄味，感觉品牌也会推这个。' },
    ],
  },
  'brand-1': {
    id: 'brand-1',
    uid: 'Brand_001',
    name: '乐事官方旗舰店',
    verified: true,
    level: 'Lv.9 品牌认证',
    bio: '乐事中国官方账号，分享新品、竞猜活动和福利信息。',
    tags: ['品牌认证', '食品饮料'],
    location: '上海',
    gender: '',
    age: '',
    cover: '/legacy/images/profile-banner.jpg',
    avatar: '/legacy/images/products/p001-lays.jpg',
    followers: 125600,
    following: 38,
    wins: 892000,
    works: [
      {
        id: 'brand-work-1',
        tag: { text: '品牌竞猜', cls: 'tagBrand' },
        title: '乐事2026马年限定口味投票开启',
        desc: '参与竞猜赢正品零食大礼包，猜中直接发货到家，当前已有3890人参与。',
        images: ['/legacy/images/products/p001-lays.jpg'],
        likes: 2341,
        comments: 456,
        time: '15分钟前',
      },
      {
        id: 'brand-work-2',
        tag: { text: '新品预告', cls: 'tagBrand' },
        title: '春季限定新口味预告：黄瓜味 vs 烧烤味',
        desc: '下一轮竞猜即将开启，参与即可抢先获得新品试吃资格。',
        images: [
          '/legacy/images/products/p001-lays.jpg',
          '/legacy/images/products/p006-wangwang.jpg',
          '/legacy/images/products/p005-liangpin.jpg',
        ],
        likes: 1890,
        comments: 320,
        time: '3小时前',
      },
    ],
    liked: [
      {
        id: 'brand-liked-1',
        tag: { text: '零食测评', cls: 'tagHot' },
        title: '一周内最值得复购的三款经典零食',
        desc: '从口味、性价比和囤货指数三个维度来讲，这三款很稳。',
        images: ['/legacy/images/products/p005-liangpin.jpg'],
        likes: 732,
        comments: 61,
        time: '昨天',
        author: {
          name: '零食测评官',
          avatar: '/legacy/images/mascot/mouse-casual.png',
          verified: false,
        },
      },
    ],
    chatSeed: [
      { id: 'bc-1', side: 'other', text: '你好，这里是乐事官方账号。' },
      { id: 'bc-2', side: 'other', text: '如果想了解活动规则，可以直接问我。' },
    ],
  },
};

function buildDefaultProfile(id: string): ProfileViewModel {
  return {
    id,
    uid: id || 'Guest_001',
    name: '优米用户',
    verified: false,
    level: 'Lv.1 新人',
    bio: '这个人很神秘，还没有留下个性签名。',
    tags: ['普通用户'],
    location: '',
    gender: '',
    age: '',
    cover: '/legacy/images/profile-banner.jpg',
    avatar: '/legacy/images/mascot/mouse-casual.png',
    followers: 0,
    following: 0,
    wins: 0,
    works: [],
    liked: [],
    chatSeed: [{ id: 'd-1', side: 'other', text: '你好呀，很高兴认识你。' }],
  };
}

function getFallbackProfile(id: string) {
  return fallbackProfiles[id] ?? buildDefaultProfile(id);
}

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
  const fallbackProfile = useMemo(() => getFallbackProfile(profileUid), [profileUid]);
  const [profile, setProfile] = useState<ProfileViewModel>(fallbackProfile);
  const [tab, setTab] = useState<'works' | 'liked'>('works');
  const [following, setFollowing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(fallbackProfile.chatSeed);
  const [typing, setTyping] = useState(false);
  const [visibility, setVisibility] = useState({ works: true, liked: true });
  const [chatLoading, setChatLoading] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);

  const statItems = useMemo(
    () => [
      { value: profile.wins ?? 0, label: '获赞' },
      { value: profile.following ?? 0, label: '关注' },
      { value: profile.followers ?? 0, label: '粉丝' },
    ],
    [profile.followers, profile.following, profile.wins],
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

    setProfile(fallbackProfile);
    setChatMessages(fallbackProfile.chatSeed);
    setVisibility({ works: true, liked: true });
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
          ...fallbackProfile,
          id: user.id,
          uid: user.uid || fallbackProfile.uid,
          name: user.name || fallbackProfile.name,
          verified: Boolean(user.shopVerified),
          level: `Lv.${user.level || 1}${user.title ? ` ${user.title}` : ''}`,
          bio: user.signature || fallbackProfile.bio,
          tags: [
            user.shopVerified ? '店铺用户' : '普通用户',
            user.title || `Lv.${user.level || 1}`,
            ...fallbackProfile.tags.slice(1),
          ].filter(Boolean),
          location: user.region || fallbackProfile.location,
          gender: user.gender || fallbackProfile.gender,
          age: user.birthday
            ? `${Math.max(1, new Date().getFullYear() - new Date(user.birthday).getFullYear())}岁`
            : fallbackProfile.age,
          avatar: user.avatar || fallbackProfile.avatar,
          followers: user.followers || fallbackProfile.followers,
          following: user.following || fallbackProfile.following,
          wins: user.wins || fallbackProfile.wins,
          works: activity.works.map((item) => mapProfilePost(item)),
          liked: activity.likes.map((item) => mapProfilePost(item)),
        });
        setVisibility({
          works: activity.worksVisible,
          liked: activity.likedVisible,
        });
        setFollowing(user.relation === 'friend' || user.relation === 'following');
      } catch {
        if (!ignore) {
          setProfile(fallbackProfile);
          setVisibility({ works: true, liked: true });
          setFollowing(false);
          setToast('已显示默认主页');
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
      setLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, [fallbackProfile, profileUid]);

  async function handleCopyUid() {
    try {
      await navigator.clipboard.writeText(profile.uid || profile.id);
    } catch {
      // ignore clipboard issues
    }
    setToast('已复制优米号');
  }

  async function handleToggleFollow() {
    if (!profile.id || followSaving) {
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
    if (!profile.id) {
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
    if (!text || !profile.id) {
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

  const renderPostCard = (post: ProfilePost, liked: boolean) => {
    const author = post.author ?? {
      name: profile.name,
      avatar: profile.avatar,
      verified: profile.verified,
    };

    return (
      <article className={styles.postCard} key={post.id}>
        <div className={styles.postAuthor}>
          <img src={author.avatar} alt={author.name} />
          <div className={styles.postAuthorInfo}>
            <div className={styles.postAuthorName}>
              {author.name}
              {author.verified ? <i className={`fa-solid fa-circle-check ${styles.postVerified}`} /> : null}
            </div>
            <div className={styles.postAuthorMeta}>{post.time}</div>
          </div>
          <span className={`${styles.postTag} ${post.tag.cls ? styles[post.tag.cls] : liked ? styles.tagHot : ''}`}>
            {post.tag.text}
          </span>
        </div>
        <div className={styles.postBody}>
          <div className={styles.postTitle}>{post.title}</div>
          <div className={styles.postDesc}>{post.desc}</div>
        </div>
        {post.images.length > 0 ? (
          <div
            className={`${styles.postImages} ${
              post.images.length === 1 ? styles.cols1 : post.images.length === 2 ? styles.cols2 : styles.cols3
            }`}
          >
            {post.images.map((img) => (
              <img src={img} alt={post.title} key={img} />
            ))}
          </div>
        ) : null}
        <div className={styles.postActions}>
          <button
            type="button"
            className={liked || likedPosts[post.id] ? styles.liked : ''}
            onClick={() =>
              setLikedPosts((current) => ({
                ...current,
                [post.id]: !current[post.id],
              }))
            }
          >
            <i className={`${liked || likedPosts[post.id] ? 'fa-solid' : 'fa-regular'} fa-heart`} /> {post.likes}
          </button>
          <span><i className="fa-regular fa-comment" /> {post.comments}</span>
          <button className={styles.postShare} type="button" onClick={() => setToast('分享主页')}>
            <i className="fa-solid fa-share-nodes" /> 分享
          </button>
        </div>
      </article>
    );
  };

  if (loading) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <header className={`${styles.topbar} ${scrolled ? styles.topbarScrolled : ''}`}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.topName}>{profile.name}</div>
        <div className={styles.topRight}>
          <button type="button" aria-label="分享主页" onClick={() => setToast('分享主页')}>
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button type="button" aria-label="更多选项" onClick={() => setToast('更多选项')}>
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
      </header>

      <section className={styles.cover}>
        <img src={profile.cover} alt={profile.name} />
      </section>

      <section className={styles.info}>
        <img className={styles.avatar} src={profile.avatar} alt={profile.name} />
        <div className={styles.nameRow}>
          <span className={styles.name}>{profile.name}</span>
          {profile.verified ? <span className={styles.verified}><i className="fa-solid fa-circle-check" /></span> : null}
          <span className={styles.level}>{profile.level}</span>
        </div>
        <div className={styles.uid}>
          优米号：{profile.uid || '--'}
          {profile.location ? <> · IP: {profile.location}</> : null}
          {profile.gender ? <> · {profile.gender}</> : null}
          {profile.age ? <> · {profile.age}</> : null}
          <button className={styles.uidCopy} type="button" onClick={() => void handleCopyUid()}>
            <i className="fa-regular fa-copy" />
          </button>
        </div>

        <div className={styles.stats}>
          {statItems.map((item) => (
            <div className={styles.stat} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
          <button className={styles.chatBtn} type="button" onClick={() => void openChat()} disabled={!profile.id}>
            <i className="fa-regular fa-comment-dots" />
            私信
          </button>
          <button
            className={`${styles.followBtn} ${following ? styles.following : ''}`}
            type="button"
            onClick={() => void handleToggleFollow()}
            disabled={!profile.id || followSaving}
          >
            {following ? (
              <>
                <i className="fa-solid fa-check" />
                已关注
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus" />
                关注
              </>
            )}
          </button>
        </div>

        <p className={styles.bio}>{profile.bio}</p>
        <div className={styles.tags}>
          {profile.tags.filter(Boolean).map((item) => (
            <span className={styles.tag} key={item}>
              {item}
            </span>
          ))}
          {profile.location ? (
            <span className={`${styles.tag} ${styles.tagLoc}`}>
              <i className="fa-solid fa-location-dot" />
              {profile.location}
            </span>
          ) : null}
          {profile.gender ? (
            <span className={`${styles.tag} ${styles.tagGender}`}>
              {profile.gender}
              {profile.age ? ` · ${profile.age}` : ''}
            </span>
          ) : null}
        </div>
      </section>

      <section className={styles.tabs}>
        <button className={tab === 'works' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('works')}>
          作品
        </button>
        <button className={tab === 'liked' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('liked')}>
          喜欢
        </button>
      </section>

      <section className={tab === 'works' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>
          <span><i className="fa-solid fa-pen-to-square" /></span> TA发布的猜友圈
        </div>
        <div className={styles.postList}>
          {profile.works.length > 0 ? (
            profile.works.map((post) => renderPostCard(post, false))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📝</div>
              <div className={styles.emptyTitle}>{visibility.works ? 'TA还没有发布过猜友圈' : '作品内容已设为不可见'}</div>
              <div className={styles.emptyDesc}>
                {visibility.works ? '关注TA，第一时间获取新动态' : '当前仅自己或好友可见'}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={tab === 'liked' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>
          <span><i className="fa-solid fa-heart" /></span> TA点赞的猜友圈
        </div>
        <div className={styles.postList}>
          {profile.liked.length > 0 ? (
            profile.liked.map((post) => renderPostCard(post, true))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💗</div>
              <div className={styles.emptyTitle}>{visibility.liked ? 'TA还没有点赞过帖子' : '喜欢列表已设为不可见'}</div>
              <div className={styles.emptyDesc}>
                {visibility.liked ? '暂无喜欢的内容' : '当前仅自己可见'}
              </div>
            </div>
          )}
        </div>
      </section>

      {chatOpen ? (
        <div className={styles.chatOverlay}>
          <button className={styles.chatMask} type="button" onClick={() => setChatOpen(false)} />
          <div className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <button className={styles.chatBack} type="button" onClick={() => setChatOpen(false)}>
                <i className="fa-solid fa-arrow-left" />
              </button>
              <img className={styles.chatAvatar} src={profile.avatar} alt={profile.name} />
              <div className={styles.chatName}>{profile.name}</div>
              <button className={styles.chatMore} type="button" onClick={() => setToast('更多设置')}>
                <i className="fa-solid fa-ellipsis" />
              </button>
            </div>
            <div className={styles.chatMessages}>
              {chatLoading ? <div className={styles.timeLabel}>正在读取聊天记录…</div> : <div className={styles.timeLabel}>聊天记录</div>}
              {chatMessages.map((message) => (
                <div key={message.id} className={`${styles.msgRow} ${styles[message.side]}`}>
                  <img src={message.side === 'me' ? '/legacy/images/mascot/mouse-main.png' : profile.avatar} alt="" />
                  <div className={styles.bubble}>{message.text}</div>
                </div>
              ))}
              {typing ? (
                <div className={`${styles.msgRow} ${styles.other} ${styles.typing}`}>
                  <img src={profile.avatar} alt="" />
                  <div className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
            </div>
            <div className={styles.chatInputBar}>
              <div className={styles.chatTools}>
                <button type="button" onClick={() => setToast('发送图片')}>
                  <i className="fa-regular fa-image" />
                </button>
                <button type="button" onClick={() => setToast('发送表情')}>
                  <i className="fa-regular fa-face-smile" />
                </button>
              </div>
              <textarea
                className={styles.chatInput}
                rows={1}
                placeholder="发送消息…"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <button
                className={`${styles.chatSend} ${chatInput.trim() ? styles.chatSendActive : ''}`}
                type="button"
                onClick={sendMessage}
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
