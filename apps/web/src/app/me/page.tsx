'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { clearAuthToken, fetchMe, fetchMeActivity, logout } from '../../lib/api';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

const shortcuts: ReadonlyArray<{
  label: string;
  href: string;
  icon: string;
  badge?: boolean;
}> = [
  { label: '我的店铺', href: '/myshop', icon: 'fa-solid fa-store' },
  { label: '我的仓库', href: '/warehouse', icon: 'fa-solid fa-box-archive', badge: true },
  { label: '我的订单', href: '/orders', icon: 'fa-solid fa-bag-shopping', badge: true },
  { label: '我的竞猜', href: '/guess-history', icon: 'fa-solid fa-clock-rotate-left' },
  { label: '全部功能', href: '/all-features', icon: 'fa-solid fa-ellipsis' },
];

type ActivityPost = {
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
};

const tagClassMap: Record<string, string> = {
  品牌竞猜: styles.tagBrand,
  品牌资讯: styles.tagBrand,
  新品预告: styles.tagBrand,
  平台公告: styles.tagBrand,
  猜友动态: styles.tagCommunity,
  转发: styles.tagCommunity,
  竞猜分享: styles.tagGuess,
  竞猜预测: styles.tagGuess,
  PK战报: styles.tagPk,
  零食测评: styles.tagHot,
  零食分享: styles.tagHot,
  零食开箱: styles.tagHot,
  店铺动态: styles.tagHot,
  店铺推荐: styles.tagHot,
};

function formatCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
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
  const [merchantOpened, setMerchantOpened] = useState(false);
  const [darkModeOn, setDarkModeOn] = useState(false);
  const [notiOn, setNotiOn] = useState(true);
  const [cacheSize, setCacheSize] = useState('12.3 MB');
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

  const searchableUsers = useMemo(
    () => [
      {
        id: 'friend-1',
        name: '零食侦探社',
        avatar: '/legacy/images/mascot/mouse-main.png',
        desc: '好友 · 竞猜 28 次',
        isFriend: true,
      },
      {
        id: 'friend-2',
        name: '鼠鼠补给站',
        avatar: '/legacy/images/mascot/mouse-happy.png',
        desc: '好友 · 竞猜 17 次',
        isFriend: true,
      },
      {
        id: 'brand-1',
        name: '乐事官方旗舰店',
        avatar: '/legacy/images/products/p001-lays.jpg',
        desc: '官方认证 · 1.2万粉丝',
        isFriend: false,
      },
      {
        id: 'brand-2',
        name: '旺旺零食实验室',
        avatar: '/legacy/images/products/p006-wangwang.jpg',
        desc: '官方认证 · 8,900粉丝',
        isFriend: false,
      },
      {
        id: 'user-3',
        name: '甜品公主',
        avatar: '/legacy/images/mascot/mouse-casual.png',
        desc: '零食达人 · Lv.12',
        isFriend: false,
      },
      {
        id: 'user-4',
        name: '辣条控小明',
        avatar: '/legacy/images/mascot/mouse-main.png',
        desc: '竞猜高手 · 胜率72%',
        isFriend: false,
      },
      {
        id: 'user-5',
        name: '巧克力女王',
        avatar: '/legacy/images/products/p002-oreo.jpg',
        desc: '美食博主 · 6,500粉丝',
        isFriend: false,
      },
    ],
    [],
  );
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const warehouseBadge = currentUser.wins > 0 ? Math.min(currentUser.wins, 99) : 8;
  const orderBadge = unreadMessageCount > 0 ? Math.min(unreadMessageCount, 99) : 5;

  function renderPostCard(post: ActivityPost, liked = false) {
    const imageClass =
      post.images.length >= 3 ? styles.cols3 : post.images.length === 2 ? styles.cols2 : styles.cols1;
    const tagClass = post.tag ? tagClassMap[post.tag] ?? '' : '';

    return (
      <article className={styles.postCard} key={post.id}>
        <div className={styles.postAuthor}>
          <img src={post.authorAvatar || currentUser.avatar} alt={post.authorName || currentUser.name} />
          <div className={styles.postAuthorInfo}>
            <div className={styles.postAuthorName}>{post.authorName || currentUser.name}</div>
            <div className={styles.postAuthorMeta}>{formatTimeLabel(post.createdAt)}</div>
          </div>
          {post.tag ? <span className={`${styles.postTag} ${tagClass}`}>{post.tag}</span> : null}
        </div>
        <div className={styles.postBody}>
          <div className={styles.postTitle}>{post.title}</div>
          {post.desc ? <div className={styles.postDesc}>{post.desc}</div> : null}
        </div>
        {post.images.length > 0 ? (
          <div className={`${styles.postImages} ${imageClass}`}>
            {post.images.slice(0, 3).map((img) => (
              <img src={img} alt={post.title} key={img} />
            ))}
          </div>
        ) : null}
        <div className={styles.postActions}>
          <span className={`${styles.postAction} ${liked ? styles.liked : ''}`}>
            <i className={`${liked ? 'fa-solid' : 'fa-regular'} fa-heart`} />
            {formatCount(post.likes)}
          </span>
          <span className={styles.postAction}>
            <i className="fa-regular fa-comment" />
            {formatCount(post.comments)}
          </span>
          <button className={`${styles.postAction} ${styles.postShare}`} type="button" onClick={() => setToast('分享动态')}>
            <i className="fa-solid fa-share-nodes" />
            分享
          </button>
        </div>
      </article>
    );
  }

  const searchSections = useMemo(() => {
    if (!searchValue.trim()) {
      return [
        {
          title: '推荐关注',
          items: searchableUsers.filter((item) => !item.isFriend).slice(0, 5),
        },
      ];
    }

    const keyword = searchValue.trim().toLowerCase();
    const matched = searchableUsers.filter(
      (item) => item.name.toLowerCase().includes(keyword) || item.desc.toLowerCase().includes(keyword),
    );

    return [
      {
        title: '我的好友',
        items: matched.filter((item) => item.isFriend),
      },
      {
        title: '可能认识的人',
        items: matched.filter((item) => !item.isFriend),
      },
    ].filter((section) => section.items.length > 0);
  }, [searchValue, searchableUsers]);

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      try {
        const [user, meActivity] = await Promise.all([fetchMe(), fetchMeActivity()]);
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
        <section className={styles.cover}>
          <div className={styles.topbar}>
            <div className={styles.brand}>
              优米
            </div>
            <div className={styles.actions}>
              <button type="button" aria-label="消息" onClick={() => router.push('/chat')}>
                <i className="fa-regular fa-comment-dots" />
                {unreadMessageCount > 0 ? <span className={styles.topBadge}>{unreadMessageCount}</span> : null}
              </button>
              <button type="button" aria-label="好友" onClick={() => router.push('/friends')}>
                <i className="fa-solid fa-user-group" />
              </button>
              <button type="button" aria-label="搜索" onClick={() => setSearchOpen(true)}>
                <i className="fa-solid fa-magnifying-glass" />
              </button>
              <button type="button" aria-label="设置" onClick={() => setSettingsOpen(true)}>
                <i className="fa-solid fa-bars" />
              </button>
            </div>
          </div>
        </section>

        <section className={styles.main}>
          <button className={styles.avatarBox} type="button" onClick={() => router.push('/edit-profile')}>
            <img className={styles.avatar} src={currentUser.avatar} alt={currentUser.name} />
            <div className={styles.avatarPlus}>+</div>
          </button>

        <div className={styles.nameRow}>
          <h1>{currentUser.name}</h1>
          <span className={styles.nameBadge}>🌟</span>
          <span className={styles.levelTag}>Lv.{currentUser.level}</span>
        </div>

        <div className={styles.uidRow}>
          <span>优米号：{currentUser.uid || '--'}</span>
          <button type="button" aria-label="复制优米号" onClick={() => void handleCopyUid()}>
            <i className="fa-regular fa-copy" />
          </button>
        </div>

        <div className={styles.statsBar}>
          {stats.map((item) => (
            <button className={styles.statItem} key={item.label} type="button">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          ))}
          <button className={styles.editBtn} type="button" onClick={() => router.push('/edit-profile')}>
            编辑主页
          </button>
        </div>

        <p className={styles.bio}>{currentUser.signature || '暂未填写个人简介'}</p>

        <div className={styles.funcRow}>
          {shortcuts.map((item) => (
            <Link className={styles.funcEntry} href={item.href} key={item.label}>
              <div className={styles.funcCircle}>
                <i className={item.icon} />
                {item.badge ? (
                  <span className={styles.funcBadge}>
                    {item.label === '我的仓库' ? warehouseBadge : orderBadge}
                  </span>
                ) : null}
              </div>
              <span className={styles.funcText}>{item.label}</span>
            </Link>
          ))}
        </div>

          {!currentUser.shopVerified && !merchantOpened ? (
            <button className={styles.openShop} type="button" onClick={() => setShopModalOpen(true)}>
              <div className={styles.openShopIcon}>
                🏪
              </div>
              <div className={styles.openShopInfo}>
                <div className={styles.openShopTitle}>我要开店</div>
                <div className={styles.openShopDesc}>开通商家身份，发布全类型竞猜，关联商品赚佣金</div>
              </div>
              <span className={styles.openShopBtn}>立即开通</span>
            </button>
          ) : (
            <div className={styles.merchantBadge}>
              <span className={styles.merchantIcon}>
                <i className="fa-solid fa-circle-check" />
              </span>
              <div>
                <div className={styles.merchantTitle}>商家身份已开通</div>
                <div className={styles.merchantSub}>可发布全类型竞猜 · 关联商品 · 优惠券</div>
              </div>
            </div>
          )}
        </section>

        <section className={styles.tabs}>
          <button className={tab === 'works' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('works')}>
            作品
          </button>
          <button className={tab === 'favs' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('favs')}>
            收藏
          </button>
          <button className={tab === 'likes' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('likes')}>
            喜欢
          </button>
        </section>

        <section className={tab === 'works' ? styles.panelActive : styles.panel}>
          <div className={styles.sectionTitle}><i className="fa-solid fa-pen-to-square" /> 我发布的猜友圈</div>
          <div className={styles.postList}>
            {activity.works.length > 0 ? activity.works.map((post) => renderPostCard(post)) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>✏️</div>
                <div className={styles.emptyTitle}>还没有发布过猜友圈</div>
                <div className={styles.emptyDesc}>分享你的竞猜心得，和猜友们互动吧！</div>
                <button className={styles.goBtn} type="button" onClick={() => router.push('/community')}>
                  <i className="fa-solid fa-pen" />
                  去发布
                </button>
              </div>
            )}
          </div>
        </section>

        <section className={tab === 'favs' ? styles.panelActive : styles.panel}>
                  <div className={styles.sectionTitle}><i className="fa-solid fa-bookmark" /> 我收藏的猜友圈</div>
          <div className={styles.postList}>
            {activity.bookmarks.length > 0 ? activity.bookmarks.map((post) => renderPostCard(post)) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>⭐</div>
                <div className={styles.emptyTitle}>还没有收藏过内容</div>
                <div className={styles.emptyDesc}>去猜友圈逛逛，收藏喜欢的帖子吧！</div>
                <button className={styles.goBtn} type="button" onClick={() => router.push('/community')}>
                  <i className="fa-solid fa-compass" />
                  逛猜友圈
                </button>
              </div>
            )}
          </div>
        </section>

        <section className={tab === 'likes' ? styles.panelActive : styles.panel}>
                  <div className={styles.sectionTitle}><i className="fa-solid fa-heart" /> 我点赞的猜友圈</div>
          <div className={styles.postList}>
            {activity.likes.length > 0 ? activity.likes.map((post) => renderPostCard(post, true)) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>❤️</div>
                <div className={styles.emptyTitle}>还没有点赞过帖子</div>
                <div className={styles.emptyDesc}>去猜友圈逛逛，为喜欢的内容点赞吧！</div>
                <button className={styles.goBtn} type="button" onClick={() => router.push('/community')}>
                  <i className="fa-solid fa-compass" />
                  逛猜友圈
                </button>
              </div>
            )}
          </div>
        </section>

        {settingsOpen ? (
          <div className={styles.settingsOverlay} onClick={() => setSettingsOpen(false)} role="presentation">
            <aside className={styles.settingsDrawer} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.settingsHeader}>
                <div className={styles.settingsTitle}>设置</div>
                <button className={styles.settingsClose} type="button" onClick={() => setSettingsOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.settingsUser}>
                <img className={styles.settingsAvatar} src={currentUser.avatar} alt={currentUser.name} />
                <div className={styles.settingsUserInfo}>
                  <div className={styles.settingsUserName}>{currentUser.name}</div>
                  <div className={styles.settingsUserMeta}>{currentUser.phone}</div>
                </div>
                <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
              </div>

              <div className={styles.settingsBody}>
                <div className={styles.settingsGroup}>
                  <div className={styles.settingsGroupTitle}>账户</div>
                  <button className={styles.settingsItem} type="button" onClick={() => router.push('/edit-profile')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconGreen}`}><i className="fa-solid fa-user-pen" /></span>
                    <span className={styles.settingsItemText}>编辑资料</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button" onClick={() => router.push('/orders')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconOrange}`}><i className="fa-solid fa-receipt" /></span>
                    <span className={styles.settingsItemText}>我的订单</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button" onClick={() => router.push('/address')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconBlue}`}><i className="fa-solid fa-location-dot" /></span>
                    <span className={styles.settingsItemText}>收货地址</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button" onClick={() => router.push('/coupons')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconRed}`}><i className="fa-solid fa-ticket" /></span>
                    <span className={styles.settingsItemText}>优惠券</span>
                    <span className={styles.settingsItemVal}>3 张</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                </div>

                  <div className={styles.settingsGroup}>
                  <div className={styles.settingsGroupTitle}>偏好设置</div>
                  <div className={styles.settingsItem}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconPurple}`}><i className="fa-solid fa-moon" /></span>
                    <span className={styles.settingsItemText}>深色模式</span>
                    <span
                      className={`${styles.settingsSwitch} ${darkModeOn ? styles.settingsSwitchOn : ''}`}
                      onClick={() => {
                        const next = !darkModeOn;
                        setDarkModeOn(next);
                        setToast(next ? '🌙 深色模式已开启' : '☀️ 已切换回浅色模式');
                      }}
                      role="button"
                      tabIndex={-1}
                    >
                      <span className={styles.settingsSwitchThumb} />
                    </span>
                  </div>
                  <div className={styles.settingsItem}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconCyan}`}><i className="fa-solid fa-bell" /></span>
                    <span className={styles.settingsItemText}>消息通知</span>
                    <span
                      className={`${styles.settingsSwitch} ${notiOn ? styles.settingsSwitchOn : ''}`}
                      onClick={() => {
                        const next = !notiOn;
                        setNotiOn(next);
                        setToast(next ? '🔔 通知已开启' : '🔕 通知已关闭');
                      }}
                      role="button"
                      tabIndex={-1}
                    >
                      <span className={styles.settingsSwitchThumb} />
                    </span>
                  </div>
                  <button className={styles.settingsItem} type="button" onClick={() => setToast('语言切换开发中')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconAmber}`}><i className="fa-solid fa-globe" /></span>
                    <span className={styles.settingsItemText}>语言</span>
                    <span className={styles.settingsItemVal}>简体中文</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                </div>

                <div className={styles.settingsGroup}>
                  <div className={styles.settingsGroupTitle}>支持与帮助</div>
                  <button className={styles.settingsItem} type="button" onClick={() => setToast('帮助中心开发中')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconLime}`}><i className="fa-solid fa-circle-question" /></span>
                    <span className={styles.settingsItemText}>帮助中心</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button" onClick={() => setToast('意见反馈开发中')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconOrange}`}><i className="fa-solid fa-comment-medical" /></span>
                    <span className={styles.settingsItemText}>意见反馈</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button" onClick={() => setToast('关于优米 v2.6.0')}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconSlate}`}><i className="fa-solid fa-circle-info" /></span>
                    <span className={styles.settingsItemText}>关于优米</span>
                    <span className={styles.settingsItemVal}>v2.6.0</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button
                    className={styles.settingsItem}
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                  >
                    <span className={`${styles.settingsItemIcon} ${styles.iconRed}`}><i className="fa-solid fa-right-from-bracket" /></span>
                    <span className={styles.settingsItemText}>{loggingOut ? '退出中...' : '退出登录'}</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                </div>

                <div className={styles.settingsGroup}>
                  <div className={styles.settingsGroupTitle}>其他</div>
                  <button
                    className={styles.settingsItem}
                    type="button"
                    onClick={() => {
                      setCacheSize('0 MB');
                      setToast('🧹 缓存已清除');
                    }}
                  >
                    <span className={`${styles.settingsItemIcon} ${styles.iconDangerSoft}`}><i className="fa-solid fa-broom" /></span>
                    <span className={styles.settingsItemText}>清除缓存</span>
                    <span className={styles.settingsItemVal}>{cacheSize}</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                </div>
              </div>

              <div className={styles.settingsFooter}>
                <div className={styles.settingsVersion}>优米 v2.6.0 · Made with ❤️</div>
              </div>
            </aside>
          </div>
        ) : null}

        {searchOpen ? (
          <div className={styles.searchOverlay} onClick={() => setSearchOpen(false)} role="presentation">
            <div className={styles.searchPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.searchBar}>
                <input
                  autoFocus
                  placeholder="搜索用户 / 添加好友"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
                <button
                  className={styles.searchCancel}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchValue('');
                  }}
                >
                  取消
                </button>
              </div>
              <div className={styles.searchQuick}>
                {[
                  { label: '添加好友', icon: 'fa-solid fa-user-plus' },
                  { label: '零食达人', icon: 'fa-solid fa-fire' },
                  { label: '官方店铺', icon: 'fa-solid fa-store' },
                ].map((item, index) => (
                  <button
                    className={index === 0 ? `${styles.searchChip} ${styles.searchChipAdd}` : styles.searchChip}
                    key={item.label}
                    type="button"
                    onClick={() => setSearchValue(item.label)}
                  >
                    <i className={item.icon} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.searchResults} onClick={(event) => event.stopPropagation()} role="presentation">
              {searchSections.length > 0 ? searchSections.map((section, sectionIndex) => (
                <div className={styles.searchSection} key={section.title}>
                  <div className={styles.searchSectionTitle} style={sectionIndex > 0 ? { marginTop: 16 } : undefined}>
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const added = item.isFriend || followedUsers[item.id];
                    return (
                      <button
                        className={styles.searchItem}
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchValue('');
                          router.push(`/user/${encodeURIComponent(item.id)}`);
                        }}
                      >
                        <img src={item.avatar} alt={item.name} />
                        <div className={styles.searchItemInfo}>
                          <div className={styles.searchItemName}>{item.name}</div>
                          <div className={styles.searchItemDesc}>{item.desc}</div>
                        </div>
                        {added ? (
                          <span className={`${styles.searchAction} ${styles.searchActionAdded}`}>{item.isFriend ? '已添加' : '已关注'}</span>
                        ) : (
                          <span
                            className={styles.searchAction}
                            onClick={(event) => {
                              event.stopPropagation();
                              setFollowedUsers((prev) => ({ ...prev, [item.id]: true }));
                              setToast(`✅ 已关注 ${item.name}`);
                            }}
                            role="button"
                            tabIndex={-1}
                          >
                            <i className="fa-solid fa-user-plus" /> 关注
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )) : (
                <div className={styles.searchEmpty}>
                  <i className="fa-solid fa-search" />
                  未找到“{searchValue}”相关用户
                </div>
              )}
            </div>
          </div>
        ) : null}

        {shopModalOpen ? (
          <div className={styles.shopModalOverlay} onClick={() => setShopModalOpen(false)} role="presentation">
            <div className={styles.shopModal} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.shopModalHero}>
                <div className={styles.shopModalHeroIcon}>🏪</div>
                <div className={styles.shopModalHeroTitle}>开通商家身份</div>
                <div className={styles.shopModalHeroDesc}>解锁完整竞猜能力与商品佣金能力</div>
              </div>
              <div className={styles.shopModalPerks}>
                <div className={styles.shopModalPerk}>
                  <span className={`${styles.shopModalPerkIcon} ${styles.perkOrange}`}>🎯</span>
                  <div>
                    <div className={styles.shopModalPerkText}>解锁全部竞猜模板</div>
                    <div className={styles.shopModalPerkSub}>二选一、多选、数值预测、好友PK</div>
                  </div>
                </div>
                <div className={styles.shopModalPerk}>
                  <span className={`${styles.shopModalPerkIcon} ${styles.perkGold}`}>💰</span>
                  <div>
                    <div className={styles.shopModalPerkText}>关联商品功能</div>
                    <div className={styles.shopModalPerkSub}>竞猜绑定商品，猜中直接购买</div>
                  </div>
                </div>
                <div className={styles.shopModalPerk}>
                  <span className={`${styles.shopModalPerkIcon} ${styles.perkGreen}`}>🎟️</span>
                  <div>
                    <div className={styles.shopModalPerkText}>自动优惠券生成</div>
                    <div className={styles.shopModalPerkSub}>未中用户自动获得补偿券，提升转化</div>
                  </div>
                </div>
                <div className={styles.shopModalPerk}>
                  <span className={`${styles.shopModalPerkIcon} ${styles.perkBlue}`}>📊</span>
                  <div>
                    <div className={styles.shopModalPerkText}>数据看板 & 营销工具</div>
                    <div className={styles.shopModalPerkSub}>查看参与数据、转化率、用户画像</div>
                  </div>
                </div>
              </div>
              <div className={styles.shopModalFooter}>
                <button
                  className={styles.shopModalConfirm}
                  type="button"
                  onClick={() => {
                    setShopModalOpen(false);
                    setMerchantOpened(true);
                    setToast('🎉 商家身份已开通！现在可以发布全类型竞猜了');
                  }}
                >
                  🏪 立即开通商家身份
                </button>
                <button className={styles.shopModalCancel} type="button" onClick={() => setShopModalOpen(false)}>
                  再想想
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    </MobileShell>
  );
}
