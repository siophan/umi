'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CartItem as CartLineItem, ProductFeedItem } from '@umi/shared';

import { fetchCart, removeCartItem, updateCartItem } from '../../lib/api/cart';
import { fetchProductList } from '../../lib/api/products';
import styles from './page.module.css';

function getGroupKey(item: CartLineItem) {
  return item.brand?.trim() || item.shop?.trim() || '其他';
}

function getDisplayShopName(item: CartLineItem) {
  if (item.shop?.trim() && item.shop !== '未知店铺') {
    return item.shop;
  }
  const groupKey = getGroupKey(item);
  return `${groupKey}旗舰店`;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [discoverItems, setDiscoverItems] = useState<ProductFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [promoThreshold, setPromoThreshold] = useState(0);
  const [toast, setToast] = useState('');
  const touchStartX = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const [cartResult, productResult] = await Promise.allSettled([
          fetchCart(),
          fetchProductList(12),
        ]);
        if (!ignore) {
          setItems(cartResult.status === 'fulfilled' ? cartResult.value.items : []);
          setPromoThreshold(cartResult.status === 'fulfilled' ? cartResult.value.promoThreshold : 0);
          setDiscoverItems(productResult.status === 'fulfilled' ? productResult.value.items : []);
        }
      } catch (error) {
        if (!ignore) {
          setItems([]);
          setDiscoverItems([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 1800);
  };

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, CartLineItem[]>();
    items.forEach((item) => {
      const key = getGroupKey(item);
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });
    return Array.from(grouped.entries());
  }, [items]);

  const selectedItems = useMemo(() => items.filter((item) => item.checked), [items]);
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSaved = selectedItems.reduce(
    (sum, item) => sum + Math.max(0, item.originalPrice - item.price) * item.quantity,
    0,
  );
  const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allChecked = items.length > 0 && items.every((item) => item.checked);
  const promoGap = promoThreshold > 0 ? Math.max(0, promoThreshold - total) : 0;
  const recommendItems = useMemo(
    () => discoverItems.filter((item) => !items.some((cartItem) => cartItem.productId === item.id)).slice(0, 8),
    [discoverItems, items],
  );

  function patchItem(itemId: string, updater: (item: CartLineItem) => CartLineItem) {
    setItems((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
  }

  function patchShop(shop: string, updater: (item: CartLineItem) => CartLineItem) {
    setItems((current) => current.map((item) => (getGroupKey(item) === shop ? updater(item) : item)));
  }

  async function toggleItem(itemId: string) {
    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }
    const nextChecked = !currentItem.checked;
    setSwipedId(null);
    patchItem(itemId, (item) => ({ ...item, checked: nextChecked }));

    try {
      await updateCartItem(itemId, { checked: nextChecked });
    } catch {
      patchItem(itemId, (item) => ({ ...item, checked: currentItem.checked }));
      showToast('更新购物车失败');
    }
  }

  async function toggleShop(shop: string) {
    const shopItems = items.filter((item) => getGroupKey(item) === shop);
    if (!shopItems.length) {
      return;
    }
    const nextChecked = !shopItems.every((item) => item.checked);
    const previous = shopItems.map((item) => ({ id: item.id, checked: item.checked }));
    setSwipedId(null);
    patchShop(shop, (item) => ({ ...item, checked: nextChecked }));

    try {
      await Promise.all(shopItems.map((item) => updateCartItem(item.id, { checked: nextChecked })));
    } catch {
      setItems((current) =>
        current.map((item) => {
          const snapshot = previous.find((entry) => entry.id === item.id);
          return snapshot ? { ...item, checked: snapshot.checked } : item;
        }),
      );
      showToast('更新购物车失败');
    }
  }

  async function toggleAll() {
    if (!items.length) {
      return;
    }
    const nextChecked = !allChecked;
    const previous = items.map((item) => ({ id: item.id, checked: item.checked }));
    setSwipedId(null);
    setItems((current) => current.map((item) => ({ ...item, checked: nextChecked })));

    try {
      await Promise.all(items.map((item) => updateCartItem(item.id, { checked: nextChecked })));
    } catch {
      setItems((current) =>
        current.map((item) => {
          const snapshot = previous.find((entry) => entry.id === item.id);
          return snapshot ? { ...item, checked: snapshot.checked } : item;
        }),
      );
      showToast('更新购物车失败');
    }
  }

  async function changeQty(itemId: string, delta: number) {
    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }

    const maxStock = currentItem.stock > 0 ? currentItem.stock : 99;
    const nextQuantity = Math.min(99, Math.max(1, Math.min(maxStock, currentItem.quantity + delta)));
    if (nextQuantity === currentItem.quantity) {
      return;
    }

    patchItem(itemId, (item) => ({ ...item, quantity: nextQuantity }));

    try {
      await updateCartItem(itemId, { quantity: nextQuantity });
    } catch {
      patchItem(itemId, (item) => ({ ...item, quantity: currentItem.quantity }));
      showToast('更新数量失败');
    }
  }

  async function handleRemoveItem(itemId: string) {
    const previous = items;
    setSwipedId(null);
    setItems((current) => current.filter((item) => item.id !== itemId));

    try {
      await removeCartItem(itemId);
      showToast('已移除商品');
    } catch {
      setItems(previous);
      showToast('移除商品失败');
    }
  }

  async function handleBulkRemove() {
    if (!selectedItems.length) {
      showToast('请选择商品');
      return;
    }

    const selectedIds = new Set(selectedItems.map((item) => item.id));
    const previous = items;
    setSwipedId(null);
    setItems((current) => current.filter((item) => !selectedIds.has(item.id)));

    try {
      await Promise.all(selectedItems.map((item) => removeCartItem(item.id)));
      showToast(`已删除${selectedItems.length}件商品`);
      setEditMode(false);
    } catch {
      setItems(previous);
      showToast('批量删除失败');
    }
  }

  const handlePay = () => {
    if (!selectedItems.length) {
      showToast('请选择商品');
      return;
    }
    const ids = selectedItems.map((item) => item.id).join(',');
    router.push(`/payment?from=cart&cartItemIds=${encodeURIComponent(ids)}`);
  };

  return (
    <main className={styles.page} onClick={() => swipedId && setSwipedId(null)}>
      <header className={styles.header}>
        <button className={styles.headerBack} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>
          购物车
          <small>{`(${items.length})`}</small>
        </div>
        <button
          className={styles.headerAction}
          type="button"
          onClick={() => setEditMode((current) => !current)}
        >
          {editMode ? '完成' : '管理'}
        </button>
      </header>

      {loading ? <section className={styles.empty}><div className={styles.emptyText}>正在加载购物车...</div></section> : null}
      {!loading ? (
        <>
          {promoGap > 0 ? (
            <section className={`${styles.promo} ${styles.fadeIn}`} style={{ animationDelay: '0.05s' }}>
              <div className={styles.promoIcon}>🎁</div>
              <div className={styles.promoText}>
                再凑 <span>¥{promoGap.toFixed(1)}</span> 即可享受 <span>满减优惠</span>
              </div>
              <button className={styles.promoBtn} type="button" onClick={() => router.push('/mall')}>
                去凑单
              </button>
            </section>
          ) : null}

          {items.length ? (
            <>
              <section className={styles.list}>
                {groupedItems.map(([shop, shopItems]) => {
                  const shopChecked = shopItems.length > 0 && shopItems.every((item) => item.checked);
                  const shopDisplayName = getDisplayShopName(shopItems[0]!);

                  return (
                    <article
                      key={shop}
                      className={`${styles.shopGroup} ${styles.fadeIn}`}
                      style={{ animationDelay: `${groupedItems.findIndex(([key]) => key === shop) * 0.06}s` }}
                    >
                      <div className={styles.shopHead}>
                        <button
                          className={`${styles.check} ${shopChecked ? styles.checkOn : ''}`}
                          type="button"
                          onClick={() => void toggleShop(shop)}
                        >
                          <i className="fa-solid fa-check" />
                        </button>
                        <span className={styles.shopLogo} aria-hidden="true">
                          {shop.charAt(0)}
                        </span>
                        <div className={styles.shopName}>
                          {shopDisplayName}
                          <span className={styles.shopTag}>官方</span>
                        </div>
                        <i className={`fa-solid fa-chevron-right ${styles.shopArrow}`} />
                      </div>

                      {shopItems.map((item) => (
                        <div
                          key={item.id}
                          className={`${styles.itemWrap} ${swipedId === item.id ? styles.itemWrapSwiped : ''}`}
                          onClick={(event) => event.stopPropagation()}
                          onTouchEnd={(event) => {
                            const endX = event.changedTouches[0]?.clientX ?? 0;
                            const diff = endX - touchStartX.current;
                            if (diff < -30) setSwipedId(item.id);
                            if (diff > 30 && swipedId === item.id) setSwipedId(null);
                          }}
                          onTouchStart={(event) => {
                            touchStartX.current = event.touches[0]?.clientX ?? 0;
                          }}
                        >
                          <div className={styles.item}>
                            <button
                              className={`${styles.check} ${styles.itemCheck} ${item.checked ? styles.checkOn : ''}`}
                              type="button"
                              onClick={() => void toggleItem(item.id)}
                            >
                              <i className="fa-solid fa-check" />
                            </button>
                            <img
                              className={styles.itemImg}
                              src={item.img || '/legacy/images/products/p001-lays.jpg'}
                              alt={item.name}
                              onClick={() => router.push(`/product/${item.productId}`)}
                            />
                            <div className={styles.itemBody}>
                              <div className={styles.itemName}>{item.name}</div>
                              <div className={styles.itemSpecs}>{item.specs}</div>
                              <div className={styles.itemBottom}>
                                <div>
                                  <span className={styles.itemPrice}>
                                    <small>¥</small>
                                    {item.price}
                                  </span>
                                  <span className={styles.itemOrig}>¥{item.originalPrice}</span>
                                </div>
                                <div className={styles.qty}>
                                  <button
                                    className={`${styles.qtyBtn} ${item.quantity <= 1 ? styles.qtyBtnDisabled : ''}`}
                                    type="button"
                                    onClick={() => void changeQty(item.id, -1)}
                                  >
                                    <i className="fa-solid fa-minus" />
                                  </button>
                                  <div className={styles.qtyVal}>{item.quantity}</div>
                                  <button
                                    className={`${styles.qtyBtn} ${item.stock > 0 && item.quantity >= item.stock ? styles.qtyBtnDisabled : ''}`}
                                    type="button"
                                    onClick={() => void changeQty(item.id, 1)}
                                  >
                                    <i className="fa-solid fa-plus" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button className={styles.deleteBtn} type="button" onClick={() => void handleRemoveItem(item.id)}>
                            <i className="fa-solid fa-trash-can" /> 删除
                          </button>
                        </div>
                      ))}
                    </article>
                  );
                })}
              </section>

            </>
          ) : (
            <section className={styles.empty}>
              <i className="fa-solid fa-cart-shopping" />
              <div className={styles.emptyText}>购物车是空的</div>
              <div className={styles.emptyDesc}>快去商城挑选心仪的商品吧</div>
              <button className={styles.emptyBtn} type="button" onClick={() => router.push('/mall')}>
                <i className="fa-solid fa-store" /> 逛商城
              </button>
            </section>
          )}

          {recommendItems.length ? (
            <section className={styles.recommend}>
              <div className={styles.recommendTitle}>
                <i className="fa-solid fa-wand-magic-sparkles" />
                你可能还喜欢
              </div>
              <div className={styles.recommendScroll}>
                {recommendItems.map((item) => (
                  <article
                    key={item.id}
                    className={styles.recommendCard}
                    onClick={() => router.push(`/product/${item.id}`)}
                  >
                    <img className={styles.recommendImg} src={item.img || '/legacy/images/products/p001-lays.jpg'} alt={item.name} />
                    <div className={styles.recommendInfo}>
                      <div className={styles.recommendName}>{item.name}</div>
                      <div className={styles.recommendPrice}>
                        <small>¥</small>
                        {item.price}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {!loading ? (
        <footer className={styles.bar}>
          <div className={styles.barLeft}>
            <button className={styles.barAll} type="button" onClick={() => void toggleAll()}>
              <span className={`${styles.check} ${allChecked ? styles.checkOn : ''}`}>
                <i className="fa-solid fa-check" />
              </span>
              <span>全选</span>
            </button>
          </div>
          <div className={styles.barSpacer} />
          {editMode ? (
            <div className={styles.barEditSummary}>已选 {selectedItems.length} 件</div>
          ) : (
            <div className={styles.barTotal}>
              <div className={styles.barTotalLabel}>合计</div>
              <div className={styles.barTotalPrice}>
                <small>¥</small>
                {total.toFixed(1)}
              </div>
              <div className={styles.barSaved}>{totalSaved > 0 ? `已省 ¥${totalSaved.toFixed(1)}` : ''}</div>
            </div>
          )}
          <button
            className={`${styles.barBtn} ${editMode ? styles.barBtnDanger : ''} ${(editMode ? selectedItems.length === 0 : totalCount === 0) ? styles.barBtnDisabled : ''}`}
            type="button"
            onClick={editMode ? () => void handleBulkRemove() : handlePay}
          >
            {editMode ? `删除(${selectedItems.length})` : `结算(${totalCount})`}
          </button>
        </footer>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
