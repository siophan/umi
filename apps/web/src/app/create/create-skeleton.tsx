'use client';

import styles from './page.module.css';

export function CreateSkeleton() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonBackBtn}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonHeaderTitle}`} />
        <div className={styles.headerAction} />
      </header>

      <div className={`${styles.skeletonBlock} ${styles.skeletonRoleBar}`} />

      <div className={styles.formProgress}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonProgressBar}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonProgressInfo}`} />
      </div>

      <div className={`${styles.skeletonBlock} ${styles.skeletonSectionHeader}`} />
      <div className={styles.templateGrid}>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`${styles.skeletonBlock} ${styles.skeletonTemplateCard}`} />
        ))}
      </div>

      <div className={styles.dividerThick} />

      <section className={styles.formSection}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonSectionTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonInput}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonInput}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTextarea}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonCover}`} />
      </section>

      <div className={styles.dividerThick} />

      <section className={styles.formSection}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonSectionTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonInput}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonInput}`} />
      </section>

      <div className={styles.dividerThick} />

      <section className={styles.formSection}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonSectionTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonInput}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonInput}`} />
      </section>

      <div className={styles.bottomBar}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonPreviewBtn}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonPublishBtn}`} />
      </div>
    </main>
  );
}
