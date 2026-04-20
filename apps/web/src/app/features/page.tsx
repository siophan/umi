'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserSummary } from '@umi/shared';

import { fetchMe } from '../../lib/api/auth';
import { fetchNotifications } from '../../lib/api/notifications';
import styles from './page.module.css';

const myServices = [
  { href: '/my-shop', icon: 'fa-solid fa-store', cls: styles.shop, label: '我的店铺', badge: '' },
  { href: '/warehouse', icon: 'fa-solid fa-box-archive', cls: styles.warehouse, label: '我的仓库', badge: '8' },
  { href: '/orders', icon: 'fa-solid fa-bag-shopping', cls: styles.order, label: '我的订单', badge: '' },
  { href: '/guess-history', icon: 'fa-solid fa-clock-rotate-left', cls: styles.history, label: '我的竞猜', badge: '' },
];

const welfare = [
  { href: '/coupons', icon: 'fa-solid fa-ticket', cls: styles.coupon, label: '优惠券', badge: '' },
  { href: '/invite', icon: 'fa-solid fa-gift', cls: styles.invite, label: '邀请好友', badge: '' },
  { href: '/checkin', icon: 'fa-solid fa-calendar-check', cls: styles.checkin, label: '每日签到', badge: '' },
  { href: '/mall', icon: 'fa-solid fa-coins', cls: styles.coin, label: '零食币充值', badge: '' },
];

const moreServices = [
  {
    href: '/brand-auth',
    icon: 'fa-solid fa-crown',
    cls: styles.brand,
    title: '品牌授权',
    desc: '申请成为品牌合作方，发起官方竞猜',
    tag: 'VIP',
    tagCls: styles.tagVip,
  },
  {
    href: '/chat',
    icon: 'fa-solid fa-comment-dots',
    cls: styles.chat,
    title: '消息中心',
    desc: '查看好友消息、系统通知和竞猜动态',
    tag: '',
    tagCls: styles.tagNew,
  },
  {
    href: '/ranking',
    icon: 'fa-solid fa-trophy',
    cls: styles.rank,
    title: '排行榜',
    desc: '胜率榜、收益榜、人气榜',
    tag: 'HOT',
    tagCls: styles.tagHot,
  },
];

export default function FeaturesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    avatar: string;
    level: number;
    warehouseCount: number;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userError, setUserError] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const me = await fetchMe();
        if (!ignore) {
          const rawUser = me as UserSummary & { warehouse?: number; warehouseCount?: number };
          setUser({
            name: rawUser.name || '用户',
            avatar: rawUser.avatar || '/legacy/images/mascot/mouse-main.png',
            level: rawUser.level || 1,
            warehouseCount: rawUser.warehouseCount || rawUser.warehouse || 0,
          });
          setUserError('');
        }
      } catch (error) {
        if (!ignore) {
          setUser(null);
          setUserError(error instanceof Error ? error.message : '用户信息加载失败');
        }
      }

      try {
        const result = await fetchNotifications();
        if (!ignore) {
          setUnreadCount(result.items.filter((item) => !item.read).length);
          setNotificationError('');
        }
      } catch (error) {
        if (!ignore) {
          setUnreadCount(0);
          setNotificationError(error instanceof Error ? error.message : '通知加载失败');
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const myServicesWithData = myServices.map((item) =>
    item.label === '我的仓库'
      ? { ...item, badge: user && user.warehouseCount > 0 ? String(user.warehouseCount) : '' }
      : item,
  );

  const moreServicesWithData = moreServices.map((item) =>
    item.title === '消息中心'
      ? {
          ...item,
          tag: unreadCount > 0 ? `${unreadCount}条新` : '',
        }
      : item,
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.push('/me')}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>全部功能</div>
      </header>

      {(userError || notificationError) ? (
        <section className={styles.issueCard}>
          <div className={styles.issueTitle}>页面信息加载不完整</div>
          <div className={styles.issueDesc}>{userError || notificationError}</div>
          <button className={styles.issueBtn} type="button" onClick={() => setReloadToken((value) => value + 1)}>
            重试
          </button>
        </section>
      ) : null}

      <button className={styles.userCard} type="button" onClick={() => user ? router.push('/me') : undefined} disabled={!user}>
        <img className={styles.avatar} src={user?.avatar || '/legacy/images/mascot/mouse-main.png'} alt={user?.name || '用户'} />
        <div className={styles.userInfo}>
          <div className={styles.userName}>
            <span>{user?.name || '用户信息加载中'}</span>
            {user ? <span className={styles.level}>Lv.{user.level}</span> : null}
          </div>
          <div className={styles.userDesc}>{user ? '查看并编辑个人主页' : '等待用户信息加载完成'}</div>
        </div>
        <i className={`fa-solid fa-chevron-right ${styles.userArrow}`} />
      </button>

      <div className={styles.sectionTitle}>我的服务</div>
      <section className={styles.gridCard}>
        <div className={styles.grid}>
          {myServicesWithData.map((item) => (
            <button className={styles.gridItem} key={item.label} type="button" onClick={() => router.push(item.href)}>
              <div className={`${styles.iconWrap} ${item.cls}`}>
                <i className={item.icon} />
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sectionTitle}>福利中心</div>
      <section className={styles.gridCard}>
        <div className={styles.grid}>
          {welfare.map((item) => (
            <button
              className={`${styles.gridItem} ${item.href === '/invite' || item.href === '/checkin' ? styles.gridItemDisabled : ''}`}
              key={item.label}
              type="button"
              onClick={() => {
                if (item.href === '/invite' || item.href === '/checkin') {
                  return;
                }
                router.push(item.href);
              }}
            >
              <div className={`${styles.iconWrap} ${item.cls}`}>
                <i className={item.icon} />
                {(item.href === '/invite' || item.href === '/checkin') ? <span className={styles.badgeMuted}>建设中</span> : null}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sectionTitle}>更多服务</div>
      <section className={styles.listCard}>
        {moreServicesWithData.map((item) => (
          <button className={styles.listItem} key={item.title} type="button" onClick={() => router.push(item.href)}>
            <div className={`${styles.listIco} ${item.cls}`}>
              <i className={item.icon} />
            </div>
            <div className={styles.listContent}>
              <div className={styles.listTitle}>{item.title}</div>
              <div className={styles.listDesc}>{item.desc}</div>
            </div>
            <div className={styles.listExtra}>
              {item.tag ? <span className={item.tagCls}>{item.tag}</span> : null}
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        ))}
      </section>

      <footer className={styles.footer}>
        <div className={styles.version}>Umi UMI v2.1.0</div>
        <div className={styles.links}>
          <button type="button">关于我们</button>
          <button type="button">用户协议</button>
          <button type="button">隐私政策</button>
          <button type="button">帮助中心</button>
        </div>
      </footer>
    </main>
  );
}
