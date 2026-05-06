'use client';

import { useRouter } from 'next/navigation';

import styles from './page.module.css';

export default function AnnouncementsPage() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>公告</div>
        <div className={styles.placeholder} />
      </header>

      <section className={styles.empty}>
        <div className={styles.emptyIcon}>📢</div>
        <div className={styles.emptyTitle}>暂无公告</div>
      </section>
    </main>
  );
}
