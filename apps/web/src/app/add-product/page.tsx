'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { addShopProducts, fetchBrandAuthOverview, fetchBrandProducts } from '../../lib/api';
import styles from './page.module.css';

type BrandProduct = Awaited<ReturnType<typeof fetchBrandProducts>>['items'][number];

type BrandMeta = {
  name: string;
  logo: string;
  deposit: number;
};

type ProductMetrics = {
  sales: string;
  rating: string;
};

const brandMetaMap: Record<string, BrandMeta> = {
  旺旺: { name: '旺旺', logo: '/legacy/images/products/p006-wangwang.jpg', deposit: 600 },
  德芙: { name: '德芙', logo: '/legacy/images/products/p007-dove.jpg', deposit: 800 },
  乐事: { name: '乐事', logo: '/legacy/images/products/p001-lays.jpg', deposit: 500 },
  良品铺子: { name: '良品铺子', logo: '/legacy/images/products/p005-liangpin.jpg', deposit: 700 },
};

type BrandRow = {
  id: string;
  name: string;
  logo: string;
  deposit: number;
  createdAt: string;
};

export default function AddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [guessPrice, setGuessPrice] = useState('9.9');
  const [optionCount, setOptionCount] = useState('2');
  const [couponVal, setCouponVal] = useState('10');
  const [couponCond, setCouponCond] = useState('满30可用');
  const [couponDays, setCouponDays] = useState('30');
  const [supportPk, setSupportPk] = useState(true);
  const [expressFree, setExpressFree] = useState(true);
  const [autoRestock, setAutoRestock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadBrands() {
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

  const toggleProduct = (productId: string) => {
    setSelectedProducts((current) => {
      if (current.includes(productId)) {
        return current.filter((item) => item !== productId);
      }

      if (current.length >= 10) {
        setToast('最多选择10个商品');
        return current;
      }

      return [...current, productId];
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
              <span className={styles.stepLabel}>{item === 1 ? '选择品牌' : item === 2 ? '选择商品' : '竞猜设置'}</span>
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
                    <span className={styles.brandCount}>{selectedBrandId === brand.id ? products.length : 0}款商品</span>
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
                return (
                  <button
                    className={`${styles.productItem} ${selected ? styles.productItemSelected : ''}`}
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
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
                    <span className={`${styles.productCheck} ${selected ? styles.productCheckOn : ''}`}>
                      {selected ? <i className="fa-solid fa-check" /> : null}
                    </span>
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
          <div className={styles.section}>已选商品</div>
          <div className={styles.configWrap}>
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

            <div className={styles.configCard}>
              <div className={styles.configTitle}>🎯 竞猜设置</div>
              <div className={styles.inputRow}>
                <span className={styles.inputLabel}>竞猜价格</span>
                <div className={styles.inputVal}>
                  <input type="number" min="0.1" step="0.1" value={guessPrice} onChange={(event) => setGuessPrice(event.target.value)} />
                  <span>币</span>
                </div>
              </div>
              <div className={styles.inputRow}>
                <span className={styles.inputLabel}>选项数量</span>
                <div className={styles.inputVal}>
                  <select value={optionCount} onChange={(event) => setOptionCount(event.target.value)}>
                    <option value="2">2个选项 (二选一)</option>
                    <option value="3">3个选项</option>
                    <option value="4">4个选项</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.configCard}>
              <div className={styles.configTitle}>🎫 补偿券设置</div>
              <div className={styles.inputRow}>
                <span className={styles.inputLabel}>补偿券面额</span>
                <div className={styles.inputVal}>
                  <input type="number" min="1" value={couponVal} onChange={(event) => setCouponVal(event.target.value)} />
                  <span>元</span>
                </div>
              </div>
              <div className={styles.inputRow}>
                <span className={styles.inputLabel}>使用条件</span>
                <div className={styles.inputVal}>
                  <input className={styles.textInput} type="text" value={couponCond} onChange={(event) => setCouponCond(event.target.value)} />
                </div>
              </div>
              <div className={styles.inputRow}>
                <span className={styles.inputLabel}>有效期</span>
                <div className={styles.inputVal}>
                  <input type="number" min="1" value={couponDays} onChange={(event) => setCouponDays(event.target.value)} />
                  <span>天</span>
                </div>
              </div>
            </div>

            <div className={styles.configCard}>
              <div className={styles.configTitle}>⚙️ 其他设置</div>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>支持好友PK</div>
                  <div className={styles.toggleDesc}>允许用户邀请好友对战</div>
                </div>
                <button className={`${styles.toggle} ${supportPk ? styles.toggleOn : ''}`} type="button" onClick={() => setSupportPk((current) => !current)}>
                  <span />
                </button>
              </div>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>顺丰包邮</div>
                  <div className={styles.toggleDesc}>中奖商品顺丰发货</div>
                </div>
                <button className={`${styles.toggle} ${expressFree ? styles.toggleOn : ''}`} type="button" onClick={() => setExpressFree((current) => !current)}>
                  <span />
                </button>
              </div>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>自动补货</div>
                  <div className={styles.toggleDesc}>库存不足时自动补货</div>
                </div>
                <button className={`${styles.toggle} ${autoRestock ? styles.toggleOn : ''}`} type="button" onClick={() => setAutoRestock((current) => !current)}>
                  <span />
                </button>
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
          className={`${styles.primary} ${step === 3 ? styles.primaryWide : ''}`}
          type="button"
          disabled={(step === 1 && !selectedBrandId) || (step === 2 && selectedProducts.length === 0) || submitting}
          onClick={goNext}
        >
          {step === 3 ? (submitting ? '上架中...' : '✅ 确认上架') : '下一步'}
        </button>
      </footer>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
