'use client';

import styles from './page.module.css';

const mine = [
  { name: '乐事', meta: '授权有效期至 2027-03-31', status: '✅ 已授权', cls: styles.ok, img: '/legacy/images/products/p001-lays.jpg' },
  { name: '德芙', meta: '提交于 2026-04-10', status: '⏳ 审核中', cls: styles.pending, img: '/legacy/images/products/p007-dove.jpg' },
];

const available = [
  { name: '卫龙', category: '辣味零食', count: 234, deposit: 400, img: '/legacy/images/products/p008-weilong.jpg' },
  { name: '良品铺子', category: '综合零食', count: 178, deposit: 700, img: '/legacy/images/products/p005-liangpin.jpg' },
  { name: '旺旺', category: '膨化食品', count: 156, deposit: 600, img: '/legacy/images/products/p016-wangzai.jpg' },
];

export default function BrandAuthPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => history.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span className={styles.title}>品牌授权</span>
      </header>

      <section className={styles.infoCard}>
        <h4>🔐 品牌授权说明</h4>
        <div className={styles.steps}>
          <div className={styles.step}><div className={styles.dot}>1</div><div><strong>选择品牌</strong> → 选择你想授权的零食品牌</div></div>
          <div className={styles.step}><div className={styles.dot}>2</div><div><strong>提交资料</strong> → 填写店铺信息并缴纳保证金</div></div>
          <div className={styles.step}><div className={styles.dot}>3</div><div><strong>审核通过</strong> → 1-3个工作日审核，通过后可上架</div></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>我的授权 <span>{mine.length}个品牌</span></div>
        <div className={styles.list}>
          {mine.map((item) => (
            <article className={styles.row} key={item.name}>
              <img src={item.img} alt={item.name} />
              <div className={styles.info}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.meta}>{item.meta}</div>
              </div>
              <span className={item.cls}>{item.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>可申请品牌 <span>选择品牌点击申请</span></div>
        <div className={styles.list}>
          {available.map((item) => (
            <article className={styles.availableRow} key={item.name}>
              <img src={item.img} alt={item.name} />
              <div className={styles.info}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.meta}>{item.category} · 已有 {item.count} 个商家授权</div>
              </div>
              <div className={styles.right}>
                <div className={styles.deposit}>保证金 ¥{item.deposit}</div>
                <button className={styles.apply} type="button">申请</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
