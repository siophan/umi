'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { NotificationItem } from '@umi/shared';

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/api/notifications';
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
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markAllSaving, setMarkAllSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  function formatTime(value: string) {
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return value;
    }

    const diff = Date.now() - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '刚刚';
    }
    if (diff < hour) {
      return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
    }
    if (diff < day) {
      return `${Math.max(1, Math.floor(diff / hour))}小时前`;
    }
    return new Date(value).toISOString().slice(0, 10);
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError(null);
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
        setError('通知读取失败');
        setReady(true);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [reloadToken, router]);

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((item) => item.type === tab)),
    [items, tab],
  );

  async function handleMarkRead(item: NotificationItem) {
    if (item.read) {
      return;
    }

    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));

    try {
      await markNotificationRead(item.id);
    } catch {
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: false } : entry)));
    }
  }

  async function handleMarkAllRead() {
    if (markAllSaving) {
      return;
    }
    try {
      setMarkAllSaving(true);
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setToast('全部已读');
    } catch (markError) {
      setToast(markError instanceof Error ? markError.message : '全部已读失败');
    } finally {
      setMarkAllSaving(false);
    }
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
        <button className={styles.actionBtn} type="button" onClick={() => void handleMarkAllRead()} disabled={markAllSaving}>
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
        {error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorTitle}>通知加载失败</div>
            <div className={styles.errorDesc}>{error}</div>
            <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
              重新加载
            </button>
          </div>
        ) : null}
        {!error ? filtered.map((item) => (
          <article
            key={item.id}
            className={`${styles.item} ${item.read ? '' : styles.unread}`}
            onClick={() => void handleMarkRead(item)}
          >
            <div className={`${styles.icon} ${styles[item.type]}`}>
              <span>{icons[item.type]}</span>
            </div>
            <div className={styles.info}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.content}>{item.content}</div>
              <div className={styles.time}>{formatTime(item.createdAt)}</div>
            </div>
          </article>
        )) : null}
        {!error && filtered.length === 0 ? (
          <div className={styles.empty}>暂无通知</div>
        ) : null}
      </section>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
