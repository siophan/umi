'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const actions = [
  { icon: 'fa-regular fa-rectangle-list', label: '品牌授权' },
  { icon: 'fa-solid fa-plus', label: '上架商品' },
  { icon: 'fa-solid fa-chart-simple', label: '数据统计' },
];

const brands = [
  { name: '乐事', meta: '12个商品 · 保证金¥600', status: '已授权', cls: styles.statusActive, img: '/legacy/images/products/p001-lays.jpg' },
  { name: '德芙', meta: '4个商品 · 保证金¥800', status: '审核中', cls: styles.statusPending, img: '/legacy/images/products/p007-dove.jpg' },
];

const products = [
  { name: '乐事原味薯片 70g', price: '¥12.9', img: '/legacy/images/products/p001-lays.jpg' },
  { name: '德芙丝滑黑巧克力', price: '¥22.9', img: '/legacy/images/products/p007-dove.jpg' },
  { name: '三只松鼠坚果礼盒', price: '¥99', img: '/legacy/images/products/p003-squirrels.jpg' },
];

export default function MyShopPage() {
  const router = useRouter();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>我的店铺</div>
        <div className={styles.actionsTop}>
          <button className={styles.iconBtn} type="button">
            <i className="fa-solid fa-eye" />
          </button>
          <button className={styles.iconBtn} type="button">
            <i className="fa-solid fa-gear" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <img className={styles.avatar} src="/legacy/images/mascot/mouse-main.png" alt="店铺头像" />
          <div>
            <div className={styles.shopName}>零食猎人の小店</div>
            <div className={styles.shopTag}><i className="fa-solid fa-circle-check" /> 认证商家</div>
          </div>
        </div>
        <div className={styles.stats}>
          <div><strong>20</strong><span>商品</span></div>
          <div><strong>892</strong><span>总订单</span></div>
          <div><strong>¥28.5K</strong><span>总收入</span></div>
          <div><strong>4.8<i className="fa-solid fa-star" /></strong><span>评分</span></div>
        </div>
      </section>

      <section className={styles.quickActions}>
        {actions.map((item) => (
          <button className={styles.quickItem} key={item.label} type="button">
            <div className={styles.quickIcon}><i className={item.icon} /></div>
            <div className={styles.quickLabel}>{item.label}</div>
          </button>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}><i className="fa-solid fa-certificate" /> 品牌授权</div>
          <span className={styles.sectionMore}>管理 <i className="fa-solid fa-chevron-right" /></span>
        </div>
        {brands.map((item) => (
          <article className={styles.brandItem} key={item.name}>
            <img src={item.img} alt={item.name} />
            <div className={styles.brandInfo}>
              <div className={styles.brandName}>{item.name}</div>
              <div className={styles.brandMeta}>{item.meta}</div>
            </div>
            <span className={item.cls}>{item.status}</span>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}><i className="fa-solid fa-box" /> 商品管理</div>
          <span className={styles.sectionMore}>上架 <i className="fa-solid fa-chevron-right" /></span>
        </div>
        {products.map((item) => (
          <article className={styles.productItem} key={item.name}>
            <img src={item.img} alt={item.name} />
            <div className={styles.productBody}>
              <div className={styles.productName}>{item.name}</div>
              <div className={styles.productPrice}>{item.price}</div>
              <div className={styles.productBtns}>
                <button className={styles.miniBtn} type="button">编辑</button>
                <button className={styles.miniBtn} type="button">预览</button>
                <button className={styles.miniBtnDanger} type="button">下架</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
