import type { ReactNode } from 'react';
import styles from './legacy-page.module.css';

type GridItem = {
  icon: string;
  label: string;
  gradient?: string;
};

type ListItem = {
  icon: string;
  title: string;
  desc: string;
  gradient?: string;
};

export function LegacyPage({
  title,
  eyebrow,
  heroTitle,
  heroDesc,
  stats,
  gridTitle,
  gridItems,
  listTitle,
  listItems,
}: {
  title: string;
  eyebrow: string;
  heroTitle: string;
  heroDesc: string;
  stats: Array<{ value: string; label: string }>;
  gridTitle?: string;
  gridItems?: GridItem[];
  listTitle?: string;
  listItems?: ListItem[];
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.back} href="javascript:void(0)">
          <i className="fa-solid fa-chevron-left" />
        </a>
        <div className={styles.title}>{title}</div>
      </header>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <div className={styles.heroTitle}>{heroTitle}</div>
        <div className={styles.heroDesc}>{heroDesc}</div>
        <div className={styles.stats}>
          {stats.map((stat) => (
            <div className={styles.stat} key={stat.label}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {gridTitle && gridItems?.length ? (
        <>
          <div className={styles.sectionTitle}>{gridTitle}</div>
          <section className={styles.gridCard}>
            <div className={styles.grid}>
              {gridItems.map((item) => (
                <div className={styles.gridItem} key={item.label}>
                  <div
                    className={styles.gridIcon}
                    style={item.gradient ? { background: item.gradient } : undefined}
                  >
                    <i className={item.icon} />
                  </div>
                  <span className={styles.gridLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {listTitle && listItems?.length ? (
        <>
          <div className={styles.sectionTitle}>{listTitle}</div>
          <section className={styles.listCard}>
            {listItems.map((item) => (
              <div className={styles.listItem} key={item.title}>
                <div
                  className={styles.listIcon}
                  style={item.gradient ? { background: item.gradient } : undefined}
                >
                  <i className={item.icon} />
                </div>
                <div className={styles.listBody}>
                  <div className={styles.listTitle}>{item.title}</div>
                  <div className={styles.listDesc}>{item.desc}</div>
                </div>
                <i className={`fa-solid fa-chevron-right ${styles.listArrow}`} />
              </div>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
