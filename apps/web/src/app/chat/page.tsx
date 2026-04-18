'use client';

import Link from 'next/link';

import styles from './page.module.css';

const chats = [
  {
    id: 'chat-1',
    friendId: '乐事官方旗舰店',
    friend: '乐事官方旗舰店',
    avatar: '/legacy/images/products/p001-lays.jpg',
    unread: 3,
    lastMsg: '今晚的新口味竞猜马上开始，记得来参与。',
    time: '09:31',
  },
  {
    id: 'chat-2',
    friendId: '零食达人小王',
    friend: '零食达人小王',
    avatar: '/legacy/images/mascot/mouse-happy.png',
    unread: 0,
    lastMsg: '刚刚我押了会，你要不要一起？',
    time: '昨天',
  },
  {
    id: 'chat-3',
    friendId: '德芙官方旗舰店',
    friend: '德芙官方旗舰店',
    avatar: '/legacy/images/products/p007-dove.jpg',
    unread: 1,
    lastMsg: '限定礼盒已经上架，欢迎查看。',
    time: '周一',
  },
];

export default function ChatListPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => history.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h1>消息</h1>
        <button className={styles.plusBtn} type="button">
          <i className="fa-solid fa-plus" />
        </button>
      </header>

      <div className={styles.systemRow}>
        <button className={styles.systemItem} type="button">
          <div className={styles.systemIcon}><i className="fa-solid fa-bell" /></div>
          <span>通知</span>
        </button>
        <button className={styles.systemItem} type="button">
          <div className={`${styles.systemIcon} ${styles.infoIcon}`}><i className="fa-solid fa-bullhorn" /></div>
          <span>公告</span>
        </button>
        <button className={styles.systemItem} type="button">
          <div className={`${styles.systemIcon} ${styles.successIcon}`}><i className="fa-solid fa-gift" /></div>
          <span>活动</span>
        </button>
      </div>

      <div className={styles.chatList}>
        {chats.map((chat) => (
          <Link className={styles.chatItem} href={`/chat/${encodeURIComponent(chat.friendId)}`} key={chat.id}>
            <div className={styles.avatarWrap}>
              <img className={styles.avatar} src={chat.avatar} alt={chat.friend} />
              {chat.unread > 0 ? <div className={styles.badge}>{chat.unread}</div> : null}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{chat.friend}</div>
              <div className={styles.msg}>{chat.lastMsg}</div>
            </div>
            <div className={styles.time}>{chat.time}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
