'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type NotificationItem = {
  id: string;
  type: 'guess' | 'social' | 'system' | 'order';
  read: boolean;
  title: string;
  content: string;
  time: string;
};

const listData: NotificationItem[] = [
  { id: '1', type: 'guess', read: false, title: '竞猜结果已公布', content: '你参与的「今天谁会赢」已结算，去看看有没有中奖。', time: '10 分钟前' },
  { id: '2', type: 'social', read: false, title: '好友邀请你参加竞猜', content: '小米邀请你加入新一轮的商品竞猜。', time: '1 小时前' },
  { id: '3', type: 'order', read: true, title: '订单已发货', content: '订单 20260417001 已进入物流运输中。', time: '昨天 12:48' },
  { id: '4', type: 'system', read: true, title: '系统维护通知', content: '今晚 02:00-03:00 会进行短暂维护。', time: '昨天 09:00' },
];

const icons: Record<NotificationItem['type'], string> = {
  guess: '🎯',
  social: '👥',
  system: '🔔',
  order: '📦',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | NotificationItem['type']>('all');
  const [items, setItems] = useState(listData);
  const [toast, setToast] = useState('');

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((item) => item.type === tab)),
    [tab, items],
  );

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setToast('全部已读');
    window.setTimeout(() => setToast(''), 1600);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>通知中心</div>
        <button className={styles.actionBtn} type="button" onClick={markAllRead}>
          <i className="fa-solid fa-check-double" />
        </button>
      </header>

      <nav className={styles.tabs}>
        {[
          { key: 'all', label: '全部' },
          { key: 'guess', label: '竞猜' },
          { key: 'social', label: '社交' },
          { key: 'order', label: '订单' },
          { key: 'system', label: '系统' },
        ].map((item) => (
          <button
            key={item.key}
            className={`${styles.tab} ${tab === item.key ? styles.tabActive : ''}`}
            type="button"
            onClick={() => setTab(item.key as typeof tab)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className={styles.list}>
        {filtered.map((item) => (
          <article
            key={item.id}
            className={`${styles.item} ${item.read ? "" : styles.unread}`}
            onClick={() =>
              setItems((prev) =>
                prev.map((entry) =>
                  entry.id === item.id ? { ...entry, read: true } : entry,
                ),
              )
            }
          >
            <div className={`${styles.icon} ${styles[item.type]}`}>
              <span>{icons[item.type]}</span>
            </div>
            <div className={styles.info}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.content}>{item.content}</div>
              <div className={styles.time}>{item.time}</div>
            </div>
          </article>
        ))}
      </section>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
