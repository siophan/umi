'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiBaseUrl } from '../../lib/env';
import styles from './page.module.css';

const rewards = [
  { day: 1, reward: '5零食币' },
  { day: 2, reward: '8零食币' },
  { day: 3, reward: '10零食币' },
  { day: 4, reward: '12零食币' },
  { day: 5, reward: '15零食币' },
  { day: 6, reward: '20零食币' },
  { day: 7, reward: '超级大礼包' },
];

const tasks = [
  { icon: '🎯', name: '参与1次竞猜', reward: '+10零食币', done: false },
  { icon: '💬', name: '发布1条动态', reward: '+5零食币', done: false },
  { icon: '👥', name: '邀请1位好友', reward: '+50零食币', done: false },
  { icon: '📺', name: '观看1场直播', reward: '已完成 ✓', done: true },
];

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('joy_token') ?? '';
}

async function requestCheckin(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.code !== 0) {
    throw new Error(payload?.message || 'request failed');
  }
  return payload.data;
}

export default function CheckinPage() {
  const router = useRouter();
  const [streak, setStreak] = useState(7);
  const [total, setTotal] = useState(45);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await requestCheckin('/api/checkin/status');
        if (!ignore) {
          setStreak(Number(result?.streak ?? 7));
          setTotal(Number(result?.total ?? 45));
          setDone(Boolean(result?.today));
        }
      } catch {
        if (!ignore) {
          setStreak(7);
          setTotal(45);
          setDone(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const timeline = useMemo(() => {
    const claimedCount = done ? streak : Math.max(streak - 1, 0);
    const currentDay = done ? 0 : Math.min(claimedCount + 1, rewards.length);

    return rewards.map((item) => ({
      ...item,
      state: item.day <= claimedCount ? 'claimed' : item.day === currentDay ? 'current' : 'future',
    }));
  }, [done, streak]);

  async function doCheckin() {
    if (done) {
      return;
    }

    try {
      const result = await requestCheckin('/api/checkin', { method: 'POST', body: JSON.stringify({}) });
      setDone(true);
      setStreak(Number(result?.streak ?? streak + 1));
      setTotal(Number(result?.total ?? total + 1));
      setToast(`🎉 签到成功！+${result?.reward || 50}零食币`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : '签到失败，请稍后重试');
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>签到打卡</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.hero}>
        <div className={styles.streakNum}>{streak}</div>
        <div className={styles.streakLabel}>连续签到天数</div>
        <div className={styles.streakTotal}>累计签到 {total} 天</div>
      </section>

      <section className={styles.btnArea}>
        <button className={`${styles.checkinBtn} ${done ? styles.checkinDone : ''}`} type="button" onClick={() => void doCheckin()} disabled={done}>
          <div className={styles.btnIcon}>{done ? '✅' : '📅'}</div>
          <div>{done ? '已签到' : '签到'}</div>
        </button>
        <p className={styles.tip}>连续签到7天可获得超级大礼包！</p>
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>签到奖励</div>
      </div>
      <section className={styles.timeline}>
        {timeline.map((item) => (
          <div key={item.day} className={styles.row}>
            <div className={`${styles.dot} ${styles[item.state]}`}>{item.state === 'claimed' ? '✓' : item.day}</div>
            <div className={styles.info}>
              <div className={styles.day}>第{item.day}天</div>
              <div className={styles.reward}>{item.reward}</div>
            </div>
            <div className={`${styles.status} ${item.state === 'claimed' ? styles.claimedText : item.state === 'current' ? styles.currentText : ''}`}>
              {item.state === 'claimed' ? '已领取' : item.state === 'current' ? '今日' : ''}
            </div>
          </div>
        ))}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>每日任务</div>
      </div>
      <section className={styles.taskSection}>
        {tasks.map((task) => (
          <article key={task.name} className={styles.taskItem}>
            <div className={styles.taskIcon}>{task.icon}</div>
            <div className={styles.taskInfo}>
              <div className={styles.taskName}>{task.name}</div>
              <div className={styles.taskReward}>{task.reward}</div>
            </div>
            {task.done ? (
              <span className={styles.doneText}>已完成 ✓</span>
            ) : (
              <button className={styles.taskBtn} type="button" onClick={() => setToast('去完成')}>
                去完成
              </button>
            )}
          </article>
        ))}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
