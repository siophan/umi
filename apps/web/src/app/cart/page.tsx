'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CartItem as CartLineItem, ProductFeedItem } from '@umi/shared';

import { fetchCart, removeCartItem, updateCartItem } from '../../lib/api/cart';
import { fetchProductList } from '../../lib/api/products';
import { hasAuthToken } from '../../lib/api/shared';
import { CartFooterBar } from './cart-footer-bar';
import { getErrorMessage, getGroupKey } from './cart-helpers';
import { CartRecommend } from './cart-recommend';
import { CartShopGroups } from './cart-shop-groups';
import styles from './page.module.css';

/**
 * 购物车页主组件。
 * 购物车读写真正走 cart_item，UI 结构则按老购物车页对齐。
 */
export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [discoverItems, setDiscoverItems] = useState<ProductFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [promoThreshold, setPromoThreshold] = useState(0);
  const [toast, setToast] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const touchStartX = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;

    /**
     * 加载购物车主数据和推荐商品。
     * 两条链路独立容错，避免推荐流失败时把购物车主体一起打空。
     */
    async function load() {
      if (!hasAuthToken()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setCartError(null);
      setDiscoverError(null);
      try {
        const [cartResult, productResult] = await Promise.allSettled([
          fetchCart(),
          fetchProductList(12),
        ]);
        if (!ignore) {
          if (cartResult.status === 'fulfilled') {
            setItems(cartResult.value.items);
            setPromoThreshold(cartResult.value.promoThreshold);
          } else {
            setCartError(getErrorMessage(cartResult.reason, '购物车读取失败'));
          }

          if (productResult.status === 'fulfilled') {
            setDiscoverItems(productResult.value.items);
          } else {
            setDiscoverError(getErrorMessage(productResult.reason, '推荐商品读取失败'));
          }
        }
      } catch (error) {
        if (!ignore) {
          const message = getErrorMessage(error, '购物车页面读取失败');
          setCartError(message);
          setDiscoverError(message);
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
  }, [reloadToken]);

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

  /**
   * 按店铺批量更新本地购物车状态。
   * 只做前端乐观更新，真正持久化仍走后端接口。
   */
  function patchShop(shop: string, updater: (item: CartLineItem) => CartLineItem) {
    setItems((current) => current.map((item) => (getGroupKey(item) === shop ? updater(item) : item)));
  }

  /**
   * 切换单个商品勾选状态。
   * 先本地乐观更新，失败后再回滚，保证购物车操作手感。
   */
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

  /**
   * 切换整组店铺勾选状态。
   * 店铺头的“全选/取消全选”会同步落到该组所有 cart_item。
   */
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

  /**
   * 切换购物车全选状态。
   * 这里走逐项更新接口，保证前后端勾选态口径一致。
   */
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

  /**
   * 修改单个购物车商品数量。
   * 数量受库存和 99 上限约束，失败时回滚到旧值。
   */
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

  /**
   * 删除单个购物车商品。
   * 先从本地列表移除，接口失败再恢复，保持老购物车页的滑删体验。
   */
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

  /**
   * 管理态批量删除。
   * 只删除当前勾选商品，成功后退出管理态。
   */
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

  /**
   * 从购物车进入支付页。
   * 这里只传被勾选的 cartItemIds，支付页再按真实购物车数据拉取快照。
   */
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
          {cartError ? (
            <section className={styles.errorCard}>
              <div className={styles.errorTitle}>购物车加载失败</div>
              <div className={styles.errorDesc}>{cartError}</div>
              <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((current) => current + 1)}>
                重新加载
              </button>
            </section>
          ) : null}

          {!cartError && promoGap > 0 ? (
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

          {!cartError && items.length ? (
            <>
              <CartShopGroups
                groupedItems={groupedItems}
                swipedId={swipedId}
                touchStartX={touchStartX}
                onSetSwipedId={setSwipedId}
                onToggleShop={toggleShop}
                onToggleItem={toggleItem}
                onChangeQty={changeQty}
                onRemoveItem={handleRemoveItem}
                onOpenProduct={(productId) => router.push(`/product/${productId}`)}
              />
            </>
          ) : null}

          {!cartError && !items.length ? (
            <section className={styles.empty}>
              <i className="fa-solid fa-cart-shopping" />
              <div className={styles.emptyText}>购物车是空的</div>
              <div className={styles.emptyDesc}>快去商城挑选心仪的商品吧</div>
              <button className={styles.emptyBtn} type="button" onClick={() => router.push('/mall')}>
                <i className="fa-solid fa-store" /> 逛商城
              </button>
            </section>
          ) : null}

          <CartRecommend
            cartError={cartError}
            discoverError={discoverError}
            recommendItems={recommendItems}
            onRetry={() => setReloadToken((current) => current + 1)}
            onOpenProduct={(productId) => router.push(`/product/${productId}`)}
          />
        </>
      ) : null}

      {!loading && !cartError ? (
        <CartFooterBar
          editMode={editMode}
          allChecked={allChecked}
          selectedItems={selectedItems}
          total={total}
          totalSaved={totalSaved}
          totalCount={totalCount}
          onToggleAll={toggleAll}
          onBulkRemove={handleBulkRemove}
          onPay={handlePay}
        />
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
