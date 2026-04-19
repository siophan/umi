'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchNotifications, markAllNotificationsRead } from '../../lib/api';
import styles from './page.module.css';

const icons: Record<'guess' | 'social' | 'system' | 'order', string> = {
  guess: '🎯',
  social: '👥',
  system: '🔔',
  order: '📦',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'guess' | 'social' | 'system' | 'order'>('all');
  const [items, setItems] = useState<Array<{
    id: number;
    type: 'guess' | 'social' | 'system' | 'order';
    read: boolean;
    title: string;
    content: string;
    createdAt: string;
  }>>([]);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchNotifications();
        if (ignore) {
          return;
        }
        setItems(result.items);
        setReady(true);
      } catch {
        if (ignore) {
          return;
        }
        setItems([]);
        setReady(true);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [router]);

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((item) => item.type === tab)),
    [items, tab],
  );

  function handleMarkRead(id: number) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
    } catch {
      // Keep the old static-page behavior when the API is unavailable.
    }
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setToast('全部已读');
    window.setTimeout(() => setToast(''), 1600);
  }

  if (!ready) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>通知中心</div>
        <button className={styles.actionBtn} type="button" onClick={() => void handleMarkAllRead()}>
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
            className={tab === item.key ? styles.tabActive : styles.tab}
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
            className={`${styles.item} ${item.read ? '' : styles.unread}`}
            onClick={() => handleMarkRead(item.id)}
          >
            <div className={`${styles.icon} ${styles[item.type]}`}>
              <span>{icons[item.type]}</span>
            </div>
            <div className={styles.info}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.content}>{item.content}</div>
              <div className={styles.time}>{item.createdAt}</div>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <div className={styles.empty}>暂无通知</div>
        ) : null}
      </section>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
