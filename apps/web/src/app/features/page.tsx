'use client';

import { useRouter } from 'next/navigation';
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.push('/me')}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>全部功能</div>
      </header>

      <button className={styles.userCard} type="button" onClick={() => router.push('/me')}>
        <img className={styles.avatar} src="/legacy/images/mascot/mouse-main.png" alt="零食猎人" />
        <div className={styles.userInfo}>
          <div className={styles.userName}>
            <span>零食猎人</span>
            <span className={styles.level}>Lv.8</span>
          </div>
          <div className={styles.userDesc}>查看并编辑个人主页</div>
        </div>
        <i className={`fa-solid fa-chevron-right ${styles.userArrow}`} />
      </button>

      <div className={styles.sectionTitle}>我的服务</div>
      <section className={styles.gridCard}>
        <div className={styles.grid}>
          {myServices.map((item) => (
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
            <button className={styles.gridItem} key={item.label} type="button" onClick={() => router.push(item.href)}>
              <div className={`${styles.iconWrap} ${item.cls}`}>
                <i className={item.icon} />
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sectionTitle}>更多服务</div>
      <section className={styles.listCard}>
        {moreServices.map((item) => (
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
        <div className={styles.version}>优米 UMe v2.1.0</div>
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
