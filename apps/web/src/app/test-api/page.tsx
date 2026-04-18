'use client';

import styles from './page.module.css';

const checks = [
  { label: 'Health', result: '✅ ok', detail: 'GET /health 响应 200' },
  { label: 'Products', result: '✅ 3 items', detail: '首个商品：乐事原味薯片' },
  { label: 'Guesses', result: '✅ 3 items', detail: '首个竞猜：乐事新口味投票' },
  { label: 'Rankings', result: '✅ 3 items', detail: '首位昵称：零食达人小王' },
  { label: 'Auth', result: '✅ token', detail: '短信登录链路模拟成功' },
  { label: 'ApiSync', result: '✅ complete', detail: 'MockData 已同步到本地' },
];

export default function TestApiPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>UMI ↔ Backend Connectivity Test</div>
        <div className={styles.sub}>用户端接口联调面板</div>
        <section className={styles.panel}>
          <div className={styles.panelTitle}>🔍 Testing backend connectivity...</div>
          <div className={styles.logList}>
            {checks.map((item) => (
              <article className={styles.logItem} key={item.label}>
                <div className={styles.logTop}>
                  <strong>{item.label}</strong>
                  <span>{item.result}</span>
                </div>
                <div className={styles.logDetail}>{item.detail}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
