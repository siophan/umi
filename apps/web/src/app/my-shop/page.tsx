'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { CategoryId } from '@umi/shared';
import { fetchMyShop, fetchShopStatus, submitShopApplication } from '../../lib/api/shops';
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

function getShopStatusText(status: string) {
  if (status === 'active') {
    return '✅ 认证商家';
  }
  if (status === 'paused') {
    return '⏸ 暂停营业';
  }
  if (status === 'closed') {
    return '🔒 店铺关闭';
  }
  return `⏳ ${status}`;
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return '待更新';
  }
  return new Date(value).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

type ShopStatusData = Awaited<ReturnType<typeof fetchShopStatus>>;
type ShopData = Awaited<ReturnType<typeof fetchMyShop>>;

const initialShopStatus: ShopStatusData = {
  status: 'none',
  shop: null,
  latestApplication: null,
  categories: [],
};

const initialShopData: ShopData = {
  shop: null,
  brandAuths: [],
  products: [],
};

export default function MyShopPage() {
  const router = useRouter();
  const [statsOpen, setStatsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopStatusData>(initialShopStatus);
  const [shopData, setShopData] = useState<ShopData>(initialShopData);
  const [form, setForm] = useState({
    shopName: '',
    categoryId: '' as CategoryId | '',
    reason: '',
  });

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadPage(shouldIgnore: () => boolean = () => false) {
    setLoading(true);
    setError(null);
    try {
      const status = await fetchShopStatus();
      if (shouldIgnore()) {
        return;
      }
      setShopStatus(status);

      if (status.status === 'active') {
        const data = await fetchMyShop();
        if (!shouldIgnore()) {
          setShopData(data);
        }
      } else {
        setShopData(initialShopData);
        if (status.latestApplication) {
          setForm({
            shopName: status.latestApplication.shopName,
            categoryId: status.latestApplication.categoryId || '',
            reason: status.latestApplication.reason || '',
          });
        }
      }
    } catch (loadError) {
      if (shouldIgnore()) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : '读取店铺状态失败');
    } finally {
      if (!shouldIgnore()) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let ignore = false;
    void loadPage(() => ignore);
    return () => {
      ignore = true;
    };
  }, []);

  const shop = shopData.shop;
  const brandList = shopData.brandAuths;
  const productList = shopData.products;
  const approvedBrandCount = useMemo(
    () => brandList.filter((item) => item.status === 'approved').length,
    [brandList],
  );
  const ratingLabel = useMemo(() => (shop?.rating ? `${shop.rating.toFixed(1)}⭐` : '--'), [shop?.rating]);
  const heroShop = shop
    ? {
        name: shop.name,
        tag: getShopStatusText(shop.status),
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
  const shopOverview = useMemo(
    () => [
      { label: '累计收入', value: heroShop.revenue, meta: '当前店铺累计成交金额', tone: styles.overviewToday },
      { label: '累计订单', value: `${heroShop.orderCount}`, meta: '当前店铺累计履约单量', tone: styles.overviewWeek },
      { label: '品牌授权', value: `${approvedBrandCount}`, meta: '已通过授权品牌数', tone: styles.overviewMonth },
    ],
    [approvedBrandCount, heroShop.orderCount, heroShop.revenue],
  );
  const statsCards = useMemo(
    () => [
      { value: heroShop.revenue, label: '累计收入', helper: '真实累计成交金额', className: styles.revenue },
      { value: `${heroShop.orderCount}`, label: '累计订单', helper: '履约单统计', className: styles.orders },
      { value: `${heroShop.productCount}`, label: '在售商品', helper: `${approvedBrandCount} 个授权品牌`, className: styles.views },
      {
        value: heroShop.rating,
        label: '店铺评分',
        helper: shop?.rating ? '当前评分' : '评分暂未接入',
        className: styles.rate,
      },
    ],
    [approvedBrandCount, heroShop.orderCount, heroShop.productCount, heroShop.rating, heroShop.revenue, shop?.rating],
  );

  function showToast(message: string) {
    setToast(message);
  }

  async function refreshStatusAndShop() {
    const status = await fetchShopStatus();
    setShopStatus(status);
    if (status.status === 'active') {
      setShopData(await fetchMyShop());
    } else {
      setShopData(initialShopData);
    }
  }

  async function handleSubmitApplication() {
    if (!form.shopName.trim()) {
      showToast('请填写店铺名称');
      return;
    }
    if (!form.categoryId) {
      showToast('请选择经营分类');
      return;
    }
    if (!form.reason.trim()) {
      showToast('请填写开店说明');
      return;
    }

    setSubmitting(true);
    try {
      await submitShopApplication({
        shopName: form.shopName.trim(),
        categoryId: form.categoryId,
        reason: form.reason.trim(),
      });
      showToast('开店申请已提交');
      await refreshStatusAndShop();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '提交申请失败');
    } finally {
      setSubmitting(false);
    }
  }

  function renderStatusContent() {
    if (loading) {
      return (
        <section className={styles.applySection}>
          <div className={styles.emptyTitle}>正在读取店铺状态</div>
          <div className={styles.emptyDesc}>稍等片刻，正在同步你的开店申请与店铺信息。</div>
        </section>
      );
    }

    if (error) {
      return (
        <section className={styles.applySection}>
          <div className={styles.emptyTitle}>店铺状态读取失败</div>
          <div className={styles.emptyDesc}>{error}</div>
          <button className={styles.submitBtn} type="button" onClick={() => void loadPage()}>
            重新加载
          </button>
        </section>
      );
    }

    if (shopStatus.status === 'pending' && shopStatus.latestApplication) {
      return (
        <>
          <section className={styles.applyHero}>
            <div className={styles.applyHeroEyebrow}>开店申请</div>
            <div className={styles.applyHeroTitle}>申请已提交，等待审核</div>
            <div className={styles.applyHeroDesc}>后台审核通过后会自动开通店铺，这里会同步显示结果。</div>
            <div className={styles.applyStatusBadge}>审核中</div>
          </section>

          <section className={styles.applySection}>
            <div className={styles.sectionTitle}>申请进度</div>
            <div className={styles.progressRail}>
              <div className={`${styles.progressStep} ${styles.progressStepActive}`}>
                <div className={styles.progressDot}>1</div>
                <div className={styles.progressBody}>
                  <strong>已提交</strong>
                  <span>{formatDateLabel(shopStatus.latestApplication.createdAt)}</span>
                </div>
              </div>
              <div className={styles.progressLine} />
              <div className={`${styles.progressStep} ${styles.progressStepActive}`}>
                <div className={styles.progressDot}>
                  <i className="fa-regular fa-clock" />
                </div>
                <div className={styles.progressBody}>
                  <strong>平台审核中</strong>
                  <span>等待后台处理申请</span>
                </div>
              </div>
              <div className={styles.progressLine} />
              <div className={styles.progressStep}>
                <div className={styles.progressDot}>3</div>
                <div className={styles.progressBody}>
                  <strong>审核通过后开店</strong>
                  <span>自动同步到店铺页</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.applySection}>
            <div className={styles.sectionTitle}>申请信息</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span>申请单号</span>
                <strong>{shopStatus.latestApplication.applyNo}</strong>
                <em>用于后台审核检索</em>
              </div>
              <div className={styles.infoItem}>
                <span>店铺名称</span>
                <strong>{shopStatus.latestApplication.shopName}</strong>
                <em>开通后默认展示名称</em>
              </div>
              <div className={styles.infoItem}>
                <span>经营分类</span>
                <strong>{shopStatus.latestApplication.categoryName || '未填写'}</strong>
                <em>影响店铺类目归属</em>
              </div>
              <div className={styles.infoItem}>
                <span>提交时间</span>
                <strong>{shopStatus.latestApplication.createdAt.slice(0, 10)}</strong>
                <em>审核排序以此为准</em>
              </div>
            </div>
            <div className={styles.reasonCard}>
              <div className={styles.reasonLabel}>开店说明</div>
              <div className={styles.reasonText}>{shopStatus.latestApplication.reason || '未填写说明'}</div>
            </div>
          </section>
        </>
      );
    }

    const latestRejected = shopStatus.status === 'rejected' ? shopStatus.latestApplication : null;

    return (
      <>
        <section className={styles.applyHero}>
          <div className={styles.applyHeroEyebrow}>开店申请</div>
          <div className={styles.applyHeroTitle}>
            {latestRejected ? '申请未通过，支持重新提交' : '申请店铺，等待后台审核'}
          </div>
          <div className={styles.applyHeroDesc}>
            开通后即可承接品牌授权、上架商品、查看店铺经营数据。
          </div>
          {latestRejected ? <div className={styles.rejectBadge}>上次申请已拒绝</div> : null}
        </section>

        {latestRejected ? (
          <section className={styles.applySection}>
            <div className={styles.rejectCard}>
              <div className={styles.rejectTitle}>驳回原因</div>
              <div className={styles.rejectText}>{latestRejected.rejectReason || '暂无详细原因，请调整资料后重新申请。'}</div>
            </div>
          </section>
        ) : null}

        <section className={styles.applySection}>
          <div className={styles.applyHintCard}>
            <div className={styles.applyHintTitle}>填写建议</div>
            <div className={styles.applyHintList}>
              <span>店铺名称尽量稳定，避免频繁更换。</span>
              <span>经营分类选择最贴近主营方向的类目。</span>
              <span>开店说明建议写清货源、经营目标或内容定位。</span>
            </div>
          </div>
          <div className={styles.sectionTitle}>填写申请</div>
          <div className={styles.formField}>
            <label htmlFor="shopName">店铺名称</label>
            <input
              id="shopName"
              className={styles.formInput}
              maxLength={24}
              placeholder="例如：Umi 零食铺"
              value={form.shopName}
              onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="categoryId">经营分类</label>
            <select
              id="categoryId"
              className={styles.formSelect}
              value={form.categoryId}
              onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value as typeof current.categoryId }))}
            >
              <option value="">请选择经营分类</option>
              {shopStatus.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <div className={styles.fieldHead}>
              <label htmlFor="reason">开店说明</label>
              <span className={styles.fieldCounter}>{form.reason.length}/200</span>
            </div>
            <textarea
              id="reason"
              className={styles.formTextarea}
              maxLength={200}
              placeholder="介绍你的经营方向、供货能力或开店目的。"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            />
          </div>
          <button className={styles.submitBtn} type="button" disabled={submitting} onClick={() => void handleSubmitApplication()}>
            {submitting ? '提交中...' : latestRejected ? '重新提交申请' : '提交开店申请'}
          </button>
        </section>
      </>
    );
  }

  if (shopStatus.status !== 'active') {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className={styles.headerTitle}>开店申请</div>
          <div className={styles.actionsTop} />
        </header>

        {renderStatusContent()}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>我的店铺</div>
        <div className={styles.actionsTop}>
          <button
            className={styles.iconBtn}
            type="button"
            onClick={() => {
              if (!shop?.id) {
                showToast(loading ? '店铺数据加载中' : '暂无店铺可预览');
                return;
              }
              router.push(`/shop/${shop.id}`);
            }}
          >
            <i className="fa-solid fa-eye" />
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
        <div className={styles.sectionHint}>当前仅开放查看与上架商品，编辑和上下架能力暂未开放。</div>
        {productList.length > 0 ? productList.map((item) => (
          <article className={styles.productItem} key={item.id}>
            <img src={item.img || '/legacy/images/products/p001-lays.jpg'} alt={item.name} />
            <div className={styles.productBody}>
              <div className={styles.productName}>{item.name}</div>
              <div className={styles.productPrice}>¥{item.price.toFixed(1)}</div>
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
