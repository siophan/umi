'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchBrandAuthOverview, submitBrandAuthApplication } from '../../lib/api/shops';
import { hasAuthToken } from '../../lib/api/shared';
import styles from './page.module.css';

const brandLogoMap: Record<string, string> = {
  乐事: '/legacy/images/products/p001-lays.jpg',
  德芙: '/legacy/images/products/p007-dove.jpg',
  旺旺: '/legacy/images/products/p006-wangwang.jpg',
  卫龙: '/legacy/images/products/p008-weilong.jpg',
  良品铺子: '/legacy/images/products/p005-liangpin.jpg',
  元气森林: '/legacy/images/products/p009-genki.jpg',
  海底捞: '/legacy/images/products/p011-haidilao.jpg',
};

export default function BrandAuthPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchBrandAuthOverview>>>({
    shopName: null,
    mine: [],
    available: [],
  });
  const [currentBrandId, setCurrentBrandId] = useState<Awaited<ReturnType<typeof fetchBrandAuthOverview>>['available'][number]['id'] | null>(null);
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!hasAuthToken()) {
        setLoading(false);
        return;
      }
      if (!ignore) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await fetchBrandAuthOverview();
        if (!ignore) {
          setOverview(data);
        }
      } catch (fetchError) {
        if (!ignore) {
          setOverview({
            shopName: null,
            mine: [],
            available: [],
          });
          setError(fetchError instanceof Error ? fetchError.message : '品牌授权概览读取失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mineRows = useMemo(
    () => overview.mine,
    [overview.mine],
  );

  const availableRows = useMemo(() => overview.available, [overview.available]);

  const currentBrand = useMemo(
    () => availableRows.find((item) => item.id === currentBrandId) || null,
    [availableRows, currentBrandId],
  );

  const closeApply = () => {
    setCurrentBrandId(null);
    setReason('');
    setAgreed(false);
    setSubmitting(false);
    setSuccess(false);
  };

  async function handleSubmit() {
    if (!currentBrand || !agreed || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const created = await submitBrandAuthApplication({
        brandId: currentBrand.id,
        reason: reason.trim(),
      });

      setOverview((current) => ({
        ...current,
        mine: [
          ...current.mine,
          {
            id: created.id,
            brandId: currentBrand.id,
            brandName: currentBrand.name,
            brandLogo: currentBrand.logo,
            productCount: 0,
            status: created.status,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setSuccess(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : '申请失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span className={styles.title}>品牌授权</span>
      </header>

      <section className={styles.infoCard}>
        <h4>🔐 品牌授权说明</h4>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.dot}>1</div>
            <div className={styles.stepText}>
              <strong>选择品牌</strong> → 选择你想授权的零食品牌
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.dot}>2</div>
            <div className={styles.stepText}>
              <strong>提交资料</strong> → 填写店铺信息并提交授权申请
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.dot}>3</div>
            <div className={styles.stepText}>
              <strong>审核通过</strong> → 1-3个工作日审核，通过后可上架
            </div>
          </div>
        </div>
      </section>

      {!loading && error ? (
        <section className={styles.errorCard}>
          <div className={styles.errorTitle}>授权概览加载失败</div>
          <div className={styles.errorDesc}>{error}</div>
          <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
            重新加载
          </button>
        </section>
      ) : null}

      <section>
        <div className={styles.sectionTitle}>
          我的授权
          <span>{mineRows.length}个品牌</span>
        </div>
        <div className={styles.list}>
          {loading ? (
            <div className={styles.emptyText}>正在读取授权概览...</div>
          ) : mineRows.length > 0 ? (
            mineRows.map((item) => {
              const sinceText = item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}起` : '';
              return (
                <article className={styles.mineItem} key={item.id}>
                  <img src={item.brandLogo || brandLogoMap[item.brandName] || '/legacy/images/products/p001-lays.jpg'} alt={item.brandName} />
                  <div className={styles.info}>
                    <div className={styles.name}>{item.brandName}</div>
                    <div className={styles.meta}>
                      品牌授权记录{sinceText}
                    </div>
                  </div>
                  <span
                    className={`${styles.status} ${
                      item.status === 'approved'
                        ? styles.statusActive
                        : item.status === 'pending'
                          ? styles.statusPending
                          : styles.statusRejected
                    }`}
                  >
                    {item.status === 'approved'
                      ? '✅ 已授权'
                      : item.status === 'pending'
                        ? '⏳ 审核中'
                        : '❌ 已拒绝'}
                  </span>
                </article>
              );
            })
          ) : !error ? (
            <div className={styles.emptyText}>暂无授权品牌，请在下方申请</div>
          ) : null}
        </div>
      </section>

      <section>
        <div className={styles.sectionTitle}>
          可申请品牌
          <span>选择品牌点击申请</span>
        </div>
        <div className={styles.list}>
          {loading ? (
            <div className={styles.emptyText}>正在同步可申请品牌...</div>
          ) : availableRows.length > 0 ? (
            availableRows.map((item) => (
              <article
                className={styles.availableItem}
                key={item.id}
                onClick={() => setCurrentBrandId(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setCurrentBrandId(item.id);
                  }
                }}
              >
                <img src={item.logo || brandLogoMap[item.name] || '/legacy/images/products/p001-lays.jpg'} alt={item.name} />
                <div className={styles.info}>
                  <div className={styles.name}>{item.name}</div>
                  <div className={styles.meta}>
                    {(item.category || '未分类')} · 可售商品 {item.productCount} 款
                  </div>
                </div>
                <div className={styles.right}>
                  <button
                    className={styles.applyBtn}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentBrandId(item.id);
                    }}
                    disabled={!overview.shopName || item.status === 'approved' || item.status === 'pending'}
                  >
                    {item.status === 'approved' ? '已授权' : item.status === 'pending' ? '审核中' : '申请授权'}
                  </button>
                </div>
              </article>
            ))
          ) : !error ? (
            <div className={styles.emptyText}>所有品牌均已申请</div>
          ) : null}
        </div>
      </section>

      {currentBrand ? (
        <div
          className={styles.overlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeApply();
            }
          }}
        >
          <div className={styles.modal}>
            {success ? (
              <>
                <div className={styles.successState}>
                  <div className={styles.successIcon}>🎉</div>
                  <div className={styles.successTitle}>申请已提交！</div>
                  <div className={styles.successDesc}>
                    「{currentBrand.name}」品牌授权申请已提交
                    <br />
                    预计 1-3 个工作日内完成审核
                  </div>
                  <div className={styles.successRows}>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoKey}>申请品牌</span>
                      <span className={styles.modalInfoVal}>{currentBrand.name}</span>
                    </div>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoKey}>状态</span>
                      <span className={`${styles.modalInfoVal} ${styles.pendingText}`}>⏳ 审核中</span>
                    </div>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={`${styles.modalBtn} ${styles.confirmBtn}`} type="button" onClick={closeApply}>
                    知道了
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.modalBrand}>
                    <img src={currentBrand.logo || brandLogoMap[currentBrand.name] || '/legacy/images/products/p001-lays.jpg'} alt={currentBrand.name} />
                    <span className={styles.modalBrandName}>{currentBrand.name}</span>
                  </div>
                  <div className={styles.modalSubtitle}>品牌授权申请</div>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.modalSection}>
                    <div className={styles.modalLabel}>📋 品牌信息</div>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoKey}>品牌类目</span>
                      <span className={styles.modalInfoVal}>{currentBrand.category || '未分类'}</span>
                    </div>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoKey}>可售商品数</span>
                      <span className={styles.modalInfoVal}>{currentBrand.productCount}款</span>
                    </div>
                  </div>
                  <div className={styles.modalSection}>
                    <div className={styles.modalLabel}>📝 申请说明（选填）</div>
                    <textarea
                      className={styles.modalTextarea}
                      value={reason}
                      placeholder="简要说明你的经营计划和优势..."
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>
                  <div className={styles.checkboxRow}>
                    <input
                      id="brand-agree"
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                    />
                    <label htmlFor="brand-agree">
                      我已阅读并同意《品牌授权协议》
                    </label>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={`${styles.modalBtn} ${styles.cancelBtn}`} type="button" onClick={closeApply}>
                    取消
                  </button>
                  <button
                    className={`${styles.modalBtn} ${styles.confirmBtn}`}
                    type="button"
                    disabled={!agreed || submitting}
                    onClick={() => void handleSubmit()}
                  >
                    {submitting ? '提交中...' : '提交申请'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
