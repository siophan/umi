'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { BrandId } from '@umi/shared';
import { addShopProducts, fetchBrandAuthOverview, fetchBrandProducts } from '../../lib/api/shops';
import { hasAuthToken } from '../../lib/api/shared';
import styles from './page.module.css';

type BrandProduct = Awaited<ReturnType<typeof fetchBrandProducts>>['items'][number];
type BrandAuthOverview = Awaited<ReturnType<typeof fetchBrandAuthOverview>>;

type BrandMeta = {
  name: string;
  logo: string;
  deposit: number;
};

const brandMetaMap: Record<string, BrandMeta> = {
  旺旺: { name: '旺旺', logo: '/legacy/images/products/p006-wangwang.jpg', deposit: 600 },
  德芙: { name: '德芙', logo: '/legacy/images/products/p007-dove.jpg', deposit: 800 },
  乐事: { name: '乐事', logo: '/legacy/images/products/p001-lays.jpg', deposit: 500 },
  良品铺子: { name: '良品铺子', logo: '/legacy/images/products/p005-liangpin.jpg', deposit: 700 },
};

type BrandRow = {
  id: BrandAuthOverview['available'][number]['id'];
  name: string;
  logo: string;
  deposit: number;
  createdAt: string;
  catalogProductCount: number;
};

export default function AddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId | ''>('');
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<BrandProduct['id'][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;

    async function loadBrands() {
      if (!hasAuthToken()) {
        return;
      }
      try {
        const data = await fetchBrandAuthOverview();
        if (ignore) {
          return;
        }

        const approved = data.mine
          .filter((item) => item.status === 'approved')
          .map((item) => {
            const meta = brandMetaMap[item.brandName];
            return {
              id: item.brandId || item.id,
              name: item.brandName,
              logo: meta?.logo || '/legacy/images/products/p001-lays.jpg',
              deposit: meta?.deposit || 0,
              createdAt: item.createdAt,
              catalogProductCount: item.catalogProductCount,
            };
          });

        setBrands(approved);
      } catch {
        if (!ignore) {
          setBrands([]);
        }
      }
    }

    void loadBrands();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      if (!hasAuthToken()) {
        setProducts([]);
        setSelectedProducts([]);
        return;
      }
      if (!selectedBrandId) {
        setProducts([]);
        setSelectedProducts([]);
        return;
      }

      try {
        const data = await fetchBrandProducts(selectedBrandId);
        if (!ignore) {
          setProducts(data.items);
          setSelectedProducts([]);
        }
      } catch {
        if (!ignore) {
          setProducts([]);
          setSelectedProducts([]);
        }
      }
    }

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, [selectedBrandId]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedBrand = useMemo(
    () => brands.find((item) => item.id === selectedBrandId) || null,
    [brands, selectedBrandId],
  );

  const selectedProductRows = useMemo(
    () => products.filter((item) => selectedProducts.includes(item.id)),
    [products, selectedProducts],
  );

  const toggleProduct = (product: BrandProduct) => {
    if (product.listed) {
      setToast('该商品已在本店铺上架');
      return;
    }
    setSelectedProducts((current) => {
      if (current.includes(product.id)) {
        return current.filter((item) => item !== product.id);
      }

      if (current.length >= 10) {
        setToast('最多选择10个商品');
        return current;
      }

      return [...current, product.id];
    });
  };

  const goNext = () => {
    if (step === 1) {
      if (!selectedBrandId) {
        setToast('请选择品牌');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (selectedProducts.length === 0) {
        setToast('请至少选择一个商品');
        return;
      }
      setStep(3);
      return;
    }

    void handleSubmit();
  };

  const goPrev = () => {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }

    router.back();
  };

  async function handleSubmit() {
    if (!selectedBrandId || selectedProducts.length === 0 || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      await addShopProducts({
        brandId: selectedBrandId,
        brandProductIds: selectedProducts,
      });
      router.replace('/my-shop');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '上架失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={goPrev}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span className={styles.title}>上架商品</span>
      </header>

      <div className={styles.steps}>
        {[1, 2, 3].map((item) => (
          <div className={styles.stepWrap} key={item}>
              <div className={`${styles.step} ${item === step ? styles.stepActive : ''} ${item < step ? styles.stepDone : ''}`}>
                <div className={styles.stepDot}>{item}</div>
                <span className={styles.stepLabel}>{item === 1 ? '选择品牌' : item === 2 ? '选择商品' : '确认上架'}</span>
              </div>
            {item < 3 ? <div className={`${styles.stepLine} ${item < step ? styles.stepLineDone : ''}`} /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <section className={styles.panel}>
          <div className={styles.section}>选择已授权品牌</div>
          <div className={styles.brandList}>
            {brands.length > 0 ? (
              brands.map((brand) => {
                return (
                  <button
                    className={`${styles.brandItem} ${selectedBrandId === brand.id ? styles.brandItemSelected : ''}`}
                    key={brand.id}
                    type="button"
                    onClick={() => setSelectedBrandId(brand.id)}
                  >
                    <img src={brand.logo} alt={brand.name} />
                    <div className={styles.brandInfo}>
                      <div className={styles.brandName}>{brand.name}</div>
                      <div className={styles.brandMeta}>
                        保证金 ¥{brand.deposit} ·{' '}
                        {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : '已授权'}
                      </div>
                    </div>
                    <span className={styles.brandCount}>{brand.catalogProductCount}款商品</span>
                    <i className={`fa-solid fa-circle-check ${styles.brandCheck}`} />
                  </button>
                );
              })
            ) : (
              <div className={styles.empty}>
                <i className="fa-solid fa-store-slash" />
                <div>暂无已授权品牌</div>
                <div className={styles.emptySub}>请先申请品牌授权后再上架商品</div>
              </div>
            )}
          </div>
          <div className={styles.moreLinkWrap}>
            <Link className={styles.moreLink} href="/brand-auth">
              <i className="fa-solid fa-plus-circle" />
              申请更多品牌授权
            </Link>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className={styles.panel}>
          <div className={styles.section}>
            {selectedBrand?.name || ''}商品库
            <span className={styles.selectedCount}>{selectedProducts.length > 0 ? `已选 ${selectedProducts.length} 件` : ''}</span>
          </div>
          <div className={styles.productList}>
            {products.length > 0 ? (
              products.map((product) => {
                const selected = selectedProducts.includes(product.id);
                const disabled = product.listed;
                return (
                  <button
                    className={`${styles.productItem} ${selected ? styles.productItemSelected : ''} ${disabled ? styles.productItemDisabled : ''}`}
                    key={product.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleProduct(product)}
                  >
                    <img src={product.defaultImg || '/legacy/images/products/p001-lays.jpg'} alt={product.name} />
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productMeta}>
                        {product.category || '未分类'}
                      </div>
                      <div className={styles.productPrice}>
                        <small>¥</small>
                        {product.supplyPrice.toFixed(1)}
                        <span className={styles.productPriceOri}>¥{product.guidePrice.toFixed(1)}</span>
                      </div>
                    </div>
                    {disabled ? (
                      <span className={styles.listedBadge}>已上架</span>
                    ) : (
                      <span className={`${styles.productCheck} ${selected ? styles.productCheckOn : ''}`}>
                        {selected ? <i className="fa-solid fa-check" /> : null}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className={styles.empty}>
                <i className="fa-solid fa-box-open" />
                <div>该品牌暂无可上架商品</div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className={styles.panel}>
          <div className={styles.section}>确认上架</div>
          <div className={styles.confirmWrap}>
            <div className={styles.previewList}>
              {selectedProductRows.map((product) => (
                <div className={styles.previewItem} key={product.id}>
                  <img src={product.defaultImg || '/legacy/images/products/p001-lays.jpg'} alt={product.name} />
                  <div className={styles.previewInfo}>
                    <div className={styles.previewName}>{product.name}</div>
                    <div className={styles.previewPrice}>¥{product.supplyPrice.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.confirmCard}>
              <div className={styles.confirmTitle}>本次上架信息</div>
              <div className={styles.confirmList}>
                <div className={styles.confirmRow}>
                  <span>授权品牌</span>
                  <strong>{selectedBrand?.name || '-'}</strong>
                </div>
                <div className={styles.confirmRow}>
                  <span>上架商品数</span>
                  <strong>{selectedProductRows.length} 件</strong>
                </div>
              </div>
              <div className={styles.confirmDesc}>
                确认后，所选商品将加入店铺商品库；商品的价格、库存、竞猜价等由平台统一维护，店铺侧无法自行编辑。
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <footer className={styles.bottom}>
        {step > 1 ? (
          <button className={styles.secondary} type="button" onClick={goPrev}>
            上一步
          </button>
        ) : null}
        <button
          className={`${styles.primary} ${step === 3 ? styles.primaryConfirm : ''}`}
          type="button"
          disabled={(step === 1 && !selectedBrandId) || (step === 2 && selectedProducts.length === 0) || submitting}
          onClick={goNext}
        >
          {step === 3 ? (
            submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                <span>上架中...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check" />
                <span>确认上架</span>
              </>
            )
          ) : (
            '下一步'
          )}
        </button>
      </footer>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
