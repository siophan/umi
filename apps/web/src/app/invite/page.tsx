'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

const inviteReadiness = [
  '邀请后端链路尚未接入当前工作区',
  '邀请码、邀请记录、奖励发放暂未开放',
  '页面不再伪装成“请先登录”或“暂无记录”',
];

export default function InvitePage() {
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
        <div className={styles.title}>邀请有礼</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroIcon}>🎁</div>
        <div className={styles.heroTitle}>邀请功能建设中</div>
        <div className={styles.heroDesc}>
          当前版本还没有接通邀请后端链路，
          <br />
          暂不展示邀请码、邀请奖励和邀请记录。
        </div>
      </section>

      <section className={styles.noticeCard}>
        <div className={styles.noticeTitle}>当前状态</div>
        <div className={styles.noticeList}>
          {inviteReadiness.map((item) => (
            <div className={styles.noticeItem} key={item}>
              <i className="fa-solid fa-circle-info" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="button" disabled>
            <i className="fa-solid fa-copy" /> 邀请功能未开放
          </button>
          <button className={styles.secondaryBtn} type="button" onClick={() => setToast('邀请功能建设中')}>
            <i className="fa-solid fa-circle-info" /> 查看说明
          </button>
        </div>
      </section>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>后续开放后将展示</div>
      </div>
      <section className={styles.placeholderList}>
        <article className={styles.placeholderItem}>
          <div className={styles.placeholderLabel}>邀请码</div>
          <div className={styles.placeholderValue}>待后端接入后生成</div>
        </article>
        <article className={styles.placeholderItem}>
          <div className={styles.placeholderLabel}>奖励规则</div>
          <div className={styles.placeholderValue}>待真实配置接入后展示</div>
        </article>
        <article className={styles.placeholderItem}>
          <div className={styles.placeholderLabel}>邀请记录</div>
          <div className={styles.placeholderValue}>待真实记录链路接入后展示</div>
        </article>
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
