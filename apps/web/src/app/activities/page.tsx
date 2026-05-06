'use client';

import { useRouter } from 'next/navigation';

import styles from './page.module.css';

export default function ActivitiesPage() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>活动</div>
        <div className={styles.placeholder} />
      </header>

      <section className={styles.empty}>
        <div className={styles.emptyIcon}>🎁</div>
        <div className={styles.emptyTitle}>暂无活动</div>
        <div className={styles.emptyDesc}>限时活动与福利将在此处展示</div>
      </section>
    </main>
  );
}
