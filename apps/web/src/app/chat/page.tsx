'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { fetchChats } from '../../lib/api/chat';
import styles from './page.module.css';

function formatChatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const diffDays = Math.floor((new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86400000);
  if (diffDays === 1) {
    return '昨天';
  }

  if (diffDays > 1 && diffDays < 7) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] || '';
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ChatListPage() {
  const router = useRouter();
  const [items, setItems] = useState<Array<{
    userId: string;
    name: string;
    avatar?: string | null;
    unreadCount: number;
    lastMessage: string;
    lastMessageAt: string;
  }>>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError(null);
      try {
        const result = await fetchChats();
        if (ignore) {
          return;
        }
        setItems(result.items);
      } catch {
        if (ignore) {
          return;
        }
        setError('会话列表读取失败');
      }

      if (!ignore) {
        setReady(true);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h1>消息</h1>
        <button className={styles.plusBtn} type="button" aria-label="更多">
          <i className="fa-solid fa-plus" />
        </button>
      </header>

      <div className={styles.systemRow}>
        <Link className={styles.systemItem} href="/notifications">
          <div className={styles.systemIcon}>🔔</div>
          <span>通知</span>
        </Link>
        <button className={styles.systemItem} type="button">
          <div className={`${styles.systemIcon} ${styles.infoIcon}`}>📢</div>
          <span>公告</span>
        </button>
        <button className={styles.systemItem} type="button">
          <div className={`${styles.systemIcon} ${styles.successIcon}`}>🎁</div>
          <span>活动</span>
        </button>
      </div>

      <div className={styles.chatList}>
        {ready && error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorTitle}>消息列表加载失败</div>
            <div className={styles.errorDesc}>{error}</div>
            <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
              重新加载
            </button>
          </div>
        ) : null}
        {ready && !error && items.length === 0 ? <div className={styles.empty}>暂无聊天消息</div> : null}
        {!error ? items.map((chat) => (
          <Link className={styles.chatItem} href={`/chat/${encodeURIComponent(chat.userId)}`} key={chat.userId}>
            <div className={styles.avatarWrap}>
              <img className={styles.avatar} src={chat.avatar || '/legacy/images/mascot/mouse-happy.png'} alt={chat.name} />
              {chat.unreadCount > 0 ? <div className={styles.badge}>{chat.unreadCount}</div> : null}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{chat.name}</div>
              <div className={styles.msg}>{chat.lastMessage}</div>
            </div>
            <div className={styles.time}>{formatChatTime(chat.lastMessageAt)}</div>
          </Link>
        )) : null}
      </div>
    </main>
  );
}
