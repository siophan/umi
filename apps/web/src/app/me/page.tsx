'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { clearAuthToken, fetchMe, logout } from '../../lib/api';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

const shortcuts = [
  { label: '我的店铺', href: '/my-shop', icon: 'fa-solid fa-store' },
  { label: '我的仓库', href: '/warehouse', icon: 'fa-solid fa-box-archive' },
  { label: '我的订单', href: '/my-orders', icon: 'fa-solid fa-bag-shopping' },
  { label: '我的竞猜', href: '/guess-history', icon: 'fa-solid fa-clock-rotate-left' },
  { label: '全部功能', href: '/all-features', icon: 'fa-solid fa-ellipsis' },
] as const;

export default function MePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<'works' | 'favs' | 'likes'>('works');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: '',
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
  const stats = useMemo(
    () => [
      { value: currentUser.following, label: '关注' },
      { value: currentUser.followers, label: '粉丝' },
      { value: currentUser.totalGuess, label: '竞猜' },
    ],
    [currentUser.followers, currentUser.following, currentUser.totalGuess],
  );

  useEffect(() => {
    let ignore = false;

    async function loadCurrentUser() {
      try {
        const user = await fetchMe();
        if (ignore) {
          return;
        }
        setCurrentUser({
          id: user.id,
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
        setAuthReady(true);
      } catch {
        if (ignore) {
          return;
        }
        clearAuthToken();
        router.replace(`/login?redirect=${encodeURIComponent(pathname || '/me')}`);
      }
    }

    void loadCurrentUser();

    return () => {
      ignore = true;
    };
  }, [pathname, router]);

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
              </button>
              <button type="button" aria-label="好友" onClick={() => router.push('/friends')}>
                <i className="fa-solid fa-user-group" />
              </button>
              <button type="button" aria-label="搜索" onClick={() => router.push('/community-search')}>
                <i className="fa-solid fa-magnifying-glass" />
              </button>
              <button type="button" aria-label="设置" onClick={() => setSettingsOpen(true)}>
                <i className="fa-solid fa-bars" />
              </button>
            </div>
          </div>
        </section>

        <section className={styles.main}>
          <div className={styles.avatarBox}>
            <img className={styles.avatar} src={currentUser.avatar} alt={currentUser.name} />
            <div className={styles.avatarPlus}>+</div>
          </div>

        <div className={styles.nameRow}>
          <h1>{currentUser.name}</h1>
          <span className={styles.nameBadge}>🌟</span>
          <span className={styles.levelTag}>Lv.{currentUser.level}</span>
        </div>

        <div className={styles.uidRow}>
          <span>优米号：{currentUser.id}</span>
          <button type="button" aria-label="复制优米号">
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
              </div>
              <span className={styles.funcText}>{item.label}</span>
            </Link>
          ))}
        </div>

          {!currentUser.shopVerified ? (
            <button className={styles.openShop} type="button">
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
            <article className={styles.postCard}>
              <div className={styles.postBody}>
                <div className={styles.postTitle}>暂无作品数据</div>
                <div className={styles.postDesc}>真实“作品”接口尚未接入，当前页面不再展示本地 mock 内容。</div>
              </div>
            </article>
          </div>
        </section>

        <section className={tab === 'favs' ? styles.panelActive : styles.panel}>
          <div className={styles.sectionTitle}><i className="fa-solid fa-bookmark" /> 我收藏的猜友圈</div>
          <div className={styles.postList}>
            <article className={styles.postCard}>
              <div className={styles.postBody}>
                <div className={styles.postTitle}>暂无收藏数据</div>
                <div className={styles.postDesc}>真实“收藏”接口尚未接入，当前页面不再展示本地 mock 内容。</div>
              </div>
            </article>
          </div>
        </section>

        <section className={tab === 'likes' ? styles.panelActive : styles.panel}>
          <div className={styles.sectionTitle}><i className="fa-solid fa-heart" /> 我点赞的猜友圈</div>
          <div className={styles.postList}>
            <article className={styles.postCard}>
              <div className={styles.postBody}>
                <div className={styles.postTitle}>暂无点赞数据</div>
                <div className={styles.postDesc}>真实“点赞”接口尚未接入，当前页面不再展示本地 mock 内容。</div>
              </div>
            </article>
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
                  <button className={styles.settingsItem} type="button" onClick={() => router.push('/my-orders')}>
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
                    <span className={styles.settingsSwitch}><span className={styles.settingsSwitchThumb} /></span>
                  </div>
                  <div className={styles.settingsItem}>
                    <span className={`${styles.settingsItemIcon} ${styles.iconCyan}`}><i className="fa-solid fa-bell" /></span>
                    <span className={styles.settingsItemText}>消息通知</span>
                    <span className={`${styles.settingsSwitch} ${styles.settingsSwitchOn}`}><span className={styles.settingsSwitchThumb} /></span>
                  </div>
                </div>

                <div className={styles.settingsGroup}>
                  <div className={styles.settingsGroupTitle}>支持与帮助</div>
                  <button className={styles.settingsItem} type="button">
                    <span className={`${styles.settingsItemIcon} ${styles.iconLime}`}><i className="fa-solid fa-circle-question" /></span>
                    <span className={styles.settingsItemText}>帮助中心</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button">
                    <span className={`${styles.settingsItemIcon} ${styles.iconOrange}`}><i className="fa-solid fa-comment-medical" /></span>
                    <span className={styles.settingsItemText}>意见反馈</span>
                    <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                  </button>
                  <button className={styles.settingsItem} type="button">
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
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </MobileShell>
  );
}
