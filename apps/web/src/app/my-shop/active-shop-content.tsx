'use client';

import styles from './page.module.css';
import {
  brandLogoMap,
  getBrandStatusText,
  shopActions,
  type ShopData,
} from './my-shop-helpers';

type ActiveShopContentProps = {
  heroShop: {
    name: string;
    tag: string;
    productCount: number;
    orderCount: number;
    revenue: string;
    rating: string;
    logo: string;
  };
  brandList: ShopData['brandAuths'];
  productList: ShopData['products'];
  statsOpen: boolean;
  statsCards: Array<{ value: string; label: string; helper: string; className: string }>;
  shopOverview: Array<{ label: string; value: string; meta: string; tone: string }>;
  onQuickAction: (label: string) => void;
  onCloseStats: () => void;
  onManageBrands: () => void;
  onAddProduct: () => void;
  onEditProduct: (productId: string) => void;
  onRemoveProduct: (productId: string) => void;
};

export function ActiveShopContent({
  heroShop,
  brandList,
  productList,
  statsOpen,
  statsCards,
  shopOverview,
  onQuickAction,
  onCloseStats,
  onManageBrands,
  onAddProduct,
  onEditProduct,
  onRemoveProduct,
}: ActiveShopContentProps) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <img className={styles.avatar} src={heroShop.logo} alt="店铺头像" />
          <div>
            <div className={styles.shopName}>{heroShop.name}</div>
            <div className={styles.shopTag}>{heroShop.tag}</div>
          </div>
        </div>
        <div className={styles.stats}>
          <div>
            <strong>{heroShop.productCount}</strong>
            <span>商品</span>
          </div>
          <div>
            <strong>{heroShop.orderCount}</strong>
            <span>总订单</span>
          </div>
          <div>
            <strong>{heroShop.revenue}</strong>
            <span>总收入</span>
          </div>
          <div>
            <strong>{heroShop.rating}</strong>
            <span>评分</span>
          </div>
        </div>
      </section>

      <section className={styles.quickActions}>
        {shopActions.map((item) => (
          <button className={styles.quickItem} key={item.label} type="button" onClick={() => onQuickAction(item.label)}>
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
          <button className={styles.sectionMore} type="button" onClick={onManageBrands}>
            管理 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        {brandList.length > 0 ? (
          brandList.map((item) => (
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
          ))
        ) : (
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
          <button className={styles.sectionMore} type="button" onClick={onAddProduct}>
            上架 <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
        {productList.length > 0 ? (
          productList.map((item) => (
            <article className={styles.productItem} key={item.id}>
              <img src={item.img || '/legacy/images/products/p001-lays.jpg'} alt={item.name} />
              <div className={styles.productBody}>
                <div className={styles.productName}>{item.name}</div>
                <div className={styles.productPrice}>¥{item.price.toFixed(1)}</div>
                <div className={styles.productBtns}>
                  <button className={styles.productBtn} type="button" onClick={() => onEditProduct(item.id)}>
                    编辑
                  </button>
                  <button
                    className={`${styles.productBtn} ${styles.productBtnDanger}`}
                    type="button"
                    onClick={() => onRemoveProduct(item.id)}
                  >
                    下架
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <article className={styles.productItem}>
            <div className={styles.productBody}>
              <div className={styles.productName}>暂无在售商品</div>
              <div className={styles.productPrice}>请先完成品牌授权并上架商品</div>
            </div>
          </article>
        )}
      </section>

      {statsOpen ? (
        <div className={styles.statsOverlay} onClick={onCloseStats} role="presentation">
          <div className={styles.statsPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.statsHead}>
              <div className={styles.statsTitle}>📊 经营数据</div>
              <button className={styles.statsClose} type="button" onClick={onCloseStats}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.statsSummary}>
              {statsCards.map((item) => (
                <div className={`${styles.statsCard} ${item.className}`} key={item.label}>
                  <div className={styles.statsCardVal}>{item.value}</div>
                  <div className={styles.statsCardLbl}>{item.label}</div>
                  <div className={styles.statsCardChange}>{item.helper}</div>
                </div>
              ))}
            </div>
            <div className={styles.statsChart}>
              <div className={styles.statsChartTitle}>
                <i className="fa-solid fa-chart-bar" style={{ color: '#FF6B35', fontSize: 12 }} /> 经营概览
              </div>
              <div className={styles.overviewGrid}>
                {shopOverview.map((item) => (
                  <div className={styles.overviewItem} key={item.label}>
                    <div className={styles.overviewLabel}>{item.label}</div>
                    <div className={`${styles.overviewSales} ${item.tone}`}>{item.value}</div>
                    <div className={styles.overviewOrders}>{item.meta}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.statsRank}>
              <div className={styles.statsRankTitle}>
                <i className="fa-solid fa-trophy" style={{ color: '#FFD700', fontSize: 12 }} /> 在售商品
              </div>
              {productList.length > 0 ? (
                productList.map((item, index) => (
                  <div className={styles.statsRankItem} key={item.id}>
                    <span
                      className={`${styles.statsRankNum} ${index === 0 ? styles.r1 : index === 1 ? styles.r2 : index === 2 ? styles.r3 : styles.rn}`}
                    >
                      {index + 1}
                    </span>
                    <img
                      className={styles.statsRankImg}
                      src={item.img || '/legacy/images/products/p001-lays.jpg'}
                      alt={item.name}
                    />
                    <div className={styles.statsRankInfo}>
                      <div className={styles.statsRankName}>{item.name}</div>
                      <div className={styles.statsRankMeta}>¥{item.price.toFixed(1)}</div>
                    </div>
                    <div className={styles.statsRankSales}>
                      {item.status === 'active' ? '在售中' : String(item.status ?? '')}
                    </div>
                  </div>
                ))
              ) : (
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
    </>
  );
}
