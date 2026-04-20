'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { fetchChatDetail, sendChatMessage } from '../../../lib/api/chat';
import { fetchUserProfile, fetchUserProfileActivity, followUser, unfollowUser } from '../../../lib/api/users';
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

  const renderPostCard = (post: ProfilePost, liked: boolean) => {
    if (!profile) {
      return null;
    }
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
      <header className={`${styles.topbar} ${scrolled ? styles.topbarScrolled : ''}`}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.topName}>{profileData.name}</div>
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
        <img src={profileData.cover} alt={profileData.name} />
      </section>

      <section className={styles.info}>
        <img className={styles.avatar} src={profileData.avatar} alt={profileData.name} />
        <div className={styles.nameRow}>
          <span className={styles.name}>{profileData.name}</span>
          {profileData.verified ? <span className={styles.verified}><i className="fa-solid fa-circle-check" /></span> : null}
          <span className={styles.level}>{profileData.level}</span>
        </div>
        <div className={styles.uid}>
          优米号：{profileData.uid || '--'}
          {profileData.location ? <> · IP: {profileData.location}</> : null}
          {profileData.gender ? <> · {profileData.gender}</> : null}
          {profileData.age ? <> · {profileData.age}</> : null}
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

        <p className={styles.bio}>{profileData.bio}</p>
        <div className={styles.tags}>
          {profileData.tags.filter(Boolean).map((item) => (
            <span className={styles.tag} key={item}>
              {item}
            </span>
          ))}
          {profileData.location ? (
            <span className={`${styles.tag} ${styles.tagLoc}`}>
              <i className="fa-solid fa-location-dot" />
              {profileData.location}
            </span>
          ) : null}
          {profileData.gender ? (
            <span className={`${styles.tag} ${styles.tagGender}`}>
              {profileData.gender}
              {profileData.age ? ` · ${profileData.age}` : ''}
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
          {profileData.works.length > 0 ? (
            profileData.works.map((post) => renderPostCard(post, false))
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
          {profileData.liked.length > 0 ? (
            profileData.liked.map((post) => renderPostCard(post, true))
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
              <img className={styles.chatAvatar} src={profileData.avatar} alt={profileData.name} />
              <div className={styles.chatName}>{profileData.name}</div>
              <button className={styles.chatMore} type="button" onClick={() => setToast('更多设置')}>
                <i className="fa-solid fa-ellipsis" />
              </button>
            </div>
            <div className={styles.chatMessages}>
              {chatLoading ? <div className={styles.timeLabel}>正在读取聊天记录…</div> : <div className={styles.timeLabel}>聊天记录</div>}
              {chatMessages.map((message) => (
                <div key={message.id} className={`${styles.msgRow} ${styles[message.side]}`}>
                  <img src={message.side === 'me' ? '/legacy/images/mascot/mouse-main.png' : profileData.avatar} alt="" />
                  <div className={styles.bubble}>{message.text}</div>
                </div>
              ))}
              {typing ? (
                <div className={`${styles.msgRow} ${styles.other} ${styles.typing}`}>
                  <img src={profileData.avatar} alt="" />
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
