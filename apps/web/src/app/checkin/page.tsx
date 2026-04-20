'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

const readinessItems = [
  '签到状态接口未接入当前工作区',
  '签到奖励和每日任务暂未从后端配置下发',
  '页面不再展示固定连续签到和任务完成度',
];

export default function CheckinPage() {
  const router = useRouter();
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
        <div className={styles.streakNum}>--</div>
        <div className={styles.streakLabel}>签到功能建设中</div>
        <div className={styles.streakTotal}>真实签到进度待后端链路接入后展示</div>
      </section>

      <section className={styles.btnArea}>
        <button className={`${styles.checkinBtn} ${styles.checkinDone}`} type="button" disabled>
          <div className={styles.btnIcon}>⏳</div>
          <div>暂未开放</div>
        </button>
        <p className={styles.tip}>当前不再展示本地伪造的签到天数、奖励和任务。</p>
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>当前状态</div>
      </div>
      <section className={styles.taskSection}>
        {readinessItems.map((item) => (
          <article key={item} className={styles.taskItem}>
            <div className={styles.taskIcon}>ℹ️</div>
            <div className={styles.taskInfo}>
              <div className={styles.taskName}>{item}</div>
              <div className={styles.taskReward}>能力接通后再展示真实内容</div>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>操作说明</div>
      </div>
      <section className={styles.taskSection}>
        <article className={styles.taskItem}>
          <div className={styles.taskIcon}>📌</div>
          <div className={styles.taskInfo}>
            <div className={styles.taskName}>后端未承接时不再显示固定进度</div>
            <div className={styles.taskReward}>避免把未开通能力伪装成正常数据</div>
          </div>
          <button className={styles.taskBtn} type="button" onClick={() => setToast('签到功能建设中')}>
            知道了
          </button>
        </article>
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
