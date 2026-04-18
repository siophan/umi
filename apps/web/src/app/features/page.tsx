'use client';

import styles from './page.module.css';

const services = [
  { icon: 'fa-solid fa-store', cls: styles.shop, label: '我的店铺', badge: '' },
  { icon: 'fa-solid fa-box-archive', cls: styles.warehouse, label: '我的仓库', badge: '8' },
  { icon: 'fa-solid fa-bag-shopping', cls: styles.order, label: '我的订单', badge: '' },
  { icon: 'fa-solid fa-chart-pie', cls: styles.history, label: '我的竞猜', badge: '' },
  { icon: 'fa-solid fa-ticket', cls: styles.coupon, label: '优惠券', badge: '2' },
  { icon: 'fa-solid fa-user-plus', cls: styles.invite, label: '邀请好友', badge: '' },
  { icon: 'fa-solid fa-calendar-check', cls: styles.checkin, label: '每日签到', badge: '' },
  { icon: 'fa-solid fa-certificate', cls: styles.brand, label: '品牌授权', badge: '' },
];

const extras = [
  { icon: 'fa-solid fa-comments', title: '聊天中心', desc: '消息列表、私聊、系统会话', tag: 'NEW', tone: styles.tagNew, ico: styles.chat },
  { icon: 'fa-solid fa-ranking-star', title: '排行榜', desc: '竞猜达人榜、连胜榜、胜率榜', tag: 'HOT', tone: styles.tagHot, ico: styles.rank },
  { icon: 'fa-solid fa-coins', title: '积分与奖励', desc: '签到奖励、竞猜奖励、权益补偿', tag: 'VIP', tone: styles.tagVip, ico: styles.coin },
];

export default function FeaturesPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => history.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>全部功能</div>
      </header>

      <section className={styles.userCard}>
        <img className={styles.avatar} src="/legacy/images/mascot/mouse-main.png" alt="零食猎人" />
        <div className={styles.userInfo}>
          <div className={styles.userName}>
            <span>零食猎人</span>
            <span className={styles.level}>Lv.8</span>
          </div>
          <div className={styles.userDesc}>查看并编辑个人主页</div>
        </div>
        <i className={`fa-solid fa-chevron-right ${styles.userArrow}`} />
      </section>

      <div className={styles.sectionTitle}>我的服务</div>
      <section className={styles.gridCard}>
        <div className={styles.grid}>
          {services.map((item) => (
            <button className={styles.gridItem} key={item.label} type="button">
              <div className={`${styles.iconWrap} ${item.cls}`}>
                <i className={item.icon} />
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sectionTitle}>扩展功能</div>
      <section className={styles.listCard}>
        {extras.map((item) => (
          <button className={styles.listItem} key={item.title} type="button">
            <div className={`${styles.listIco} ${item.ico}`}>
              <i className={item.icon} />
            </div>
            <div className={styles.listContent}>
              <div className={styles.listTitle}>{item.title}</div>
              <div className={styles.listDesc}>{item.desc}</div>
            </div>
            <div className={styles.listExtra}>
              <span className={item.tone}>{item.tag}</span>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        ))}
      </section>

      <footer className={styles.footer}>
        <div className={styles.version}>UMe v1.0.0</div>
        <div className={styles.links}>
          <button type="button">用户协议</button>
          <button type="button">隐私政策</button>
          <button type="button">帮助中心</button>
        </div>
      </footer>
    </main>
  );
}
