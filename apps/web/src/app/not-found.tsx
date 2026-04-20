import Link from 'next/link';

import styles from './not-found.module.css';

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <section className={styles.emptyState}>
        <div className={styles.emptyIconWrap}>
          <i className="fa-regular fa-compass" />
        </div>
        <h1 className={styles.emptyTitle}>页面不存在</h1>
        <p className={styles.emptyDesc}>你访问的内容可能已下线，或者链接地址有误。</p>
        <Link className={styles.emptyAction} href="/">
          返回首页
        </Link>
      </section>
    </main>
  );
}
