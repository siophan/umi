'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchMyShop } from '../../lib/api';
import styles from './page.module.css';

const actions = [
  { icon: '📋', label: '品牌授权' },
  { icon: '➕', label: '上架商品' },
  { icon: '📊', label: '数据统计' },
] as const;

const shopLogo = '/legacy/images/mascot/mouse-main.png';

const brandLogoMap: Record<string, string> = {
  乐事: '/legacy/images/products/p001-lays.jpg',
  德芙: '/legacy/images/products/p007-dove.jpg',
  旺旺: '/legacy/images/products/p006-wangwang.jpg',
  良品铺子: '/legacy/images/products/p005-liangpin.jpg',
  三只松鼠: '/legacy/images/products/p003-squirrels.jpg',
};

function getBrandStatusText(status: string) {
  if (status === 'approved') {
    return '已授权';
  }
  if (status === 'rejected') {
    return '已拒绝';
  }
  return '审核中';
}

export default function MyShopPage() {
  const router = useRouter();
  const [statsOpen, setStatsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<Awaited<ReturnType<typeof fetchMyShop>>>({
    shop: null,
    brandAuths: [],
    products: [],
  });

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let ignore = false;

    async function loadShop() {
      try {
        const data = await fetchMyShop();
        if (!ignore) {
          setShopData(data);
        }
      } catch {
        if (ignore) {
          return;
        }
        setShopData({
          shop: null,
          brandAuths: [],
          products: [],
        });
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadShop();

    return () => {
      ignore = true;
    };
  }, [router]);

  const shop = shopData.shop;
  const ratingLabel = useMemo(() => (shop?.rating ? `${shop.rating.toFixed(1)}⭐` : '--'), [shop?.rating]);
  const heroShop = shop
    ? {
        name: shop.name,
        tag: shop.status === 'active' ? '✅ 认证商家' : `⏳ ${shop.status}`,
        productCount: shop.productCount,
        orderCount: shop.orderCount,
        revenue: `¥${shop.revenue.toFixed(1)}`,
        rating: ratingLabel,
        logo: shop.logo || shopLogo,
      }
    : {
        name: '暂未开通店铺',
        tag: '请先完成开店',
        productCount: 0,
        orderCount: 0,
        revenue: '¥0.0',
        rating: '--',
        logo: shopLogo,
      };
  const brandList = shopData.brandAuths;
  const productList = shopData.products;

  function showToast(message: string) {
    setToast(message);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>我的店铺</div>
        <div className={styles.actionsTop}>
          <button className={styles.iconBtn} type="button" onClick={() => router.push('/shop-detail?brand=乐事')}>
            <i className="fa-solid fa-eye" />
          </button>
          <button className={styles.iconBtn} type="button" onClick={() => showToast('店铺设置')}>
            <i className="fa-solid fa-gear" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <img
            className={styles.avatar}
            src={heroShop.logo}
            alt="店铺头像"
          />
          <div>
            <div className={styles.shopName}>{heroShop.name}</div>
            <div className={styles.shopTag}>{heroShop.tag}</div>
          </div>
        </div>
        <div className={styles.stats}>
          <div><strong>{heroShop.productCount}</strong><span>商品</span></div>
          <div><strong>{heroShop.orderCount}</strong><span>总订单</span></div>
          <div><strong>{heroShop.revenue}</strong><span>总收入</span></div>
          <div><strong>{heroShop.rating}</strong><span>评分</span></div>
        </div>
      </section>

      <section className={styles.quickActions}>
        {actions.map((item) => (
          <button
            className={styles.quickItem}
            key={item.label}
            type="button"
            onClick={() => {
              if (item.label === '品牌授权') {
                router.push('/brand-auth');
              }
              if (item.label === '上架商品') {
                router.push('/add-product');
              }
              if (item.label === '数据统计') {
                setStatsOpen(true);
              }
            }}
          >
            <div className={styles.quickIcon}>{item.icon}</div>
            <div className={styles.quickLabel}>{item.label}</div>
          </button>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <i className="fa-solid fa-certificate" style={{ color: '#FF6B35', fontSize: 13 }} /> 品牌授权
          </div>
          <button className={styles.sectionMore} type="button" onClick={() => router.push('/brand-auth')}>
            管理 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        {brandList.length > 0 ? brandList.map((item) => (
            <article className={styles.brandItem} key={item.id}>
              <img
                src={brandLogoMap[item.brandName] || '/legacy/images/products/p001-lays.jpg'}
                alt={item.brandName}
              />
              <div className={styles.brandInfo}>
                <div className={styles.brandName}>{item.brandName}</div>
                <div className={styles.brandMeta}>申请时间 {item.createdAt.slice(0, 10)}</div>
              </div>
              <span className={item.status === 'approved' ? styles.statusActive : styles.statusPending}>
                {getBrandStatusText(item.status)}
              </span>
            </article>
          )) : (
            <article className={styles.brandItem}>
              <div className={styles.brandInfo}>
                <div className={styles.brandName}>暂无品牌授权</div>
                <div className={styles.brandMeta}>提交品牌授权申请后会显示在这里。</div>
              </div>
            </article>
          )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <i className="fa-solid fa-box" style={{ color: '#4E6AE6', fontSize: 13 }} /> 商品管理
          </div>
          <button className={styles.sectionMore} type="button" onClick={() => router.push('/add-product')}>
            上架 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        {productList.length > 0 ? productList.map((item) => (
            <article className={styles.productItem} key={item.id}>
              <img src={item.img || '/legacy/images/products/p001-lays.jpg'} alt={item.name} />
              <div className={styles.productBody}>
                <div className={styles.productName}>{item.name}</div>
                <div className={styles.productPrice}>¥{item.price.toFixed(1)}</div>
                <div className={styles.productBtns}>
                  <button className={styles.miniBtn} type="button" onClick={() => showToast('编辑商品')}>编辑</button>
                  <button
                    className={styles.miniBtnDanger}
                    type="button"
                    onClick={() => {
                      if (window.confirm('确认下架此商品？')) {
                        showToast('已下架');
                      }
                    }}
                  >
                    下架
                  </button>
                </div>
              </div>
            </article>
          )) : (
            <article className={styles.productItem}>
              <div className={styles.productBody}>
                <div className={styles.productName}>暂无在售商品</div>
                <div className={styles.productPrice}>请先完成品牌授权并上架商品</div>
              </div>
            </article>
          )}
      </section>

      {statsOpen ? (
        <div className={styles.statsOverlay} onClick={() => setStatsOpen(false)} role="presentation">
          <div className={styles.statsPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.statsHead}>
              <div className={styles.statsTitle}>📊 经营数据</div>
              <button className={styles.statsClose} type="button" onClick={() => setStatsOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.statsSummary}>
              <div className={`${styles.statsCard} ${styles.revenue}`}>
                <div className={styles.statsCardVal}>{heroShop.revenue}</div>
                <div className={styles.statsCardLbl}>累计收入</div>
                <div className={`${styles.statsCardChange} ${styles.up}`}>↑ 本月 +¥4600</div>
              </div>
              <div className={`${styles.statsCard} ${styles.orders}`}>
                <div className={styles.statsCardVal}>{heroShop.orderCount}</div>
                <div className={styles.statsCardLbl}>累计订单</div>
                <div className={`${styles.statsCardChange} ${styles.up}`}>↑ 本月 +126单</div>
              </div>
              <div className={`${styles.statsCard} ${styles.views}`}>
                <div className={styles.statsCardVal}>{heroShop.productCount}</div>
                <div className={styles.statsCardLbl}>在售商品</div>
                <div className={styles.statsCardChange}>2个品牌</div>
              </div>
              <div className={`${styles.statsCard} ${styles.rate}`}>
                <div className={styles.statsCardVal}>{heroShop.rating}</div>
                <div className={styles.statsCardLbl}>店铺评分</div>
                <div className={`${styles.statsCardChange} ${styles.up}`}>优秀</div>
              </div>
            </div>
            <div className={styles.statsChart}>
              <div className={styles.statsChartTitle}>
                <i className="fa-solid fa-chart-bar" style={{ color: '#FF6B35', fontSize: 12 }} /> 经营概览
              </div>
              <div className={styles.overviewGrid}>
                {[
                  { label: '今日', sales: '¥328', orders: '12单', tone: styles.overviewToday },
                  { label: '本周', sales: '¥2680', orders: '67单', tone: styles.overviewWeek },
                  { label: '本月', sales: '¥4600', orders: '126单', tone: styles.overviewMonth },
                ].map((item) => (
                  <div className={styles.overviewItem} key={item.label}>
                    <div className={styles.overviewLabel}>{item.label}</div>
                    <div className={`${styles.overviewSales} ${item.tone}`}>{item.sales}</div>
                    <div className={styles.overviewOrders}>{item.orders}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.statsRank}>
              <div className={styles.statsRankTitle}>
                <i className="fa-solid fa-trophy" style={{ color: '#FFD700', fontSize: 12 }} /> 在售商品
              </div>
              {productList.length > 0 ? productList.map((item, index) => (
                <div className={styles.statsRankItem} key={item.id}>
                  <span className={`${styles.statsRankNum} ${index === 0 ? styles.r1 : index === 1 ? styles.r2 : index === 2 ? styles.r3 : styles.rn}`}>{index + 1}</span>
                  <img className={styles.statsRankImg} src={item.img || '/legacy/images/products/p001-lays.jpg'} alt={item.name} />
                  <div className={styles.statsRankInfo}>
                    <div className={styles.statsRankName}>{item.name}</div>
                    <div className={styles.statsRankMeta}>¥{item.price.toFixed(1)}</div>
                  </div>
                  <div className={styles.statsRankSales}>{item.status === 'active' ? '在售中' : String(item.status ?? '')}</div>
                </div>
              )) : (
                <div className={styles.statsRankItem}>
                  <div className={styles.statsRankInfo}>
                    <div className={styles.statsRankName}>暂无商品数据</div>
                    <div className={styles.statsRankMeta}>当前店铺还没有上架商品。</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
