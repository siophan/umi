'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CheckinStatus } from '@umi/shared';

import { fetchCheckinStatus, submitCheckin } from '../../lib/api/checkin';
import { hasAuthToken } from '../../lib/api/shared';
import styles from './page.module.css';

const TIMELINE_DAYS = 7;

export default function CheckinPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const load = useCallback(async () => {
    if (!hasAuthToken()) {
      setLoading(false);
      return;
    }
    try {
      const result = await fetchCheckinStatus();
      setStatus(result);
      setError('');
    } catch (loadError) {
      setStatus(null);
      setError(loadError instanceof Error ? loadError.message : '签到状态加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheckin = useCallback(async () => {
    if (submitting) return;
    if (status?.checkedToday) {
      setToast('今日已签到');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitCheckin();
      setStatus({
        streak: result.streak,
        total: result.total,
        checkedToday: true,
        lastCheckinDate: new Date().toISOString().slice(0, 10),
      });
      setToast(`签到成功，已连续 ${result.streak} 天`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '签到失败，请稍后重试';
      setToast(message);
      // 后端如果返回 ALREADY_DONE 也直接刷一次状态保持一致
      void load();
    } finally {
      setSubmitting(false);
    }
  }, [load, status?.checkedToday, submitting]);

  const streak = status?.streak ?? 0;
  const total = status?.total ?? 0;
  const checkedToday = status?.checkedToday ?? false;

  // 7 天时间线视觉：streak 已签 + 未签时下一个为"今日"。streak ≥ 7 整条已签
  const visualStreak = Math.min(streak, TIMELINE_DAYS);
  const todayIndex = checkedToday || visualStreak >= TIMELINE_DAYS ? -1 : visualStreak;

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
        <div className={styles.streakNum}>{loading ? '--' : streak}</div>
        <div className={styles.streakLabel}>连续签到天数</div>
        <div className={styles.streakTotal}>{loading ? ' ' : `累计签到 ${total} 天`}</div>
      </section>

      <section className={styles.btnArea}>
        <button
          className={`${styles.checkinBtn} ${checkedToday ? styles.checkinDone : ''}`}
          type="button"
          disabled={loading || submitting || checkedToday || Boolean(error)}
          onClick={handleCheckin}
        >
          <div className={styles.btnIcon}>{checkedToday ? '✅' : submitting ? '⏳' : '✨'}</div>
          <div>{checkedToday ? '已签到' : submitting ? '签到中' : '签到'}</div>
        </button>
        <p className={styles.tip}>
          {error
            ? error
            : checkedToday
              ? '今天已经签过啦，明天再来'
              : '坚持每日签到，连续越久积累越多'}
        </p>
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>本周签到进度</div>
      </div>
      <section className={styles.timeline}>
        {Array.from({ length: TIMELINE_DAYS }).map((_, idx) => {
          const dayNum = idx + 1;
          const isClaimed = idx < visualStreak;
          const isCurrent = idx === todayIndex;
          const dotClass = isClaimed
            ? styles.claimed
            : isCurrent
              ? styles.current
              : styles.future;
          const statusText = isClaimed ? '已签' : isCurrent ? '今日' : '待签';
          const statusClass = isClaimed
            ? styles.claimedText
            : isCurrent
              ? styles.currentText
              : '';
          return (
            <div key={dayNum} className={styles.row}>
              <div className={`${styles.dot} ${dotClass}`}>
                {isClaimed ? '✓' : dayNum}
              </div>
              <div className={styles.info}>
                <div className={styles.day}>第 {dayNum} 天</div>
                <div className={styles.reward}>奖励待开通</div>
              </div>
              <div className={`${styles.status} ${statusClass}`}>{statusText}</div>
            </div>
          );
        })}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
