'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type CartItem = {
  id: string;
  brand: string;
  shop: string;
  shopLogo: string;
  productId: string;
  name: string;
  specs: string;
  img: string;
  price: number;
  originalPrice: number;
  quantity: number;
  checked: boolean;
};

const initialItems: CartItem[] = [
  {
    id: 'cart-1',
    brand: '乐事',
    shop: '乐事官方旗舰店',
    shopLogo: '/legacy/images/products/p001-lays.jpg',
    productId: 'p001',
    name: '乐事薯片春日限定大礼包 组合装',
    specs: '混合口味 / 6 包',
    img: '/legacy/images/products/p001-lays.jpg',
    price: 39.9,
    originalPrice: 49.9,
    quantity: 2,
    checked: true,
  },
  {
    id: 'cart-2',
    brand: '奥利奥',
    shop: '奥利奥旗舰店',
    shopLogo: '/legacy/images/products/p002-oreo.jpg',
    productId: 'p002',
    name: '奥利奥缤纷夹心家庭分享装',
    specs: '草莓香草双拼',
    img: '/legacy/images/products/p002-oreo.jpg',
    price: 29.9,
    originalPrice: 35.9,
    quantity: 1,
    checked: true,
  },
  {
    id: 'cart-3',
    brand: '百草味',
    shop: '百草味旗舰店',
    shopLogo: '/legacy/images/products/p004-baicaowei.jpg',
    productId: 'p004',
    name: '百草味每日坚果礼袋',
    specs: '25g x 10 袋',
    img: '/legacy/images/products/p004-baicaowei.jpg',
    price: 45.8,
    originalPrice: 59.9,
    quantity: 1,
    checked: false,
  },
];

const recommendItems = [
  { id: 'p007', img: '/legacy/images/products/p007-dove.jpg', name: '德芙巧克力心形礼盒', price: 59.9 },
  { id: 'p009', img: '/legacy/images/products/p009-genki.jpg', name: '元气森林气泡水组合', price: 26.9 },
  { id: 'p005', img: '/legacy/images/products/p005-liangpin.jpg', name: '良品铺子果干大礼包', price: 42.5 },
];

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editMode, setEditMode] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const touchStartX = useRef(0);

  const groups = useMemo(() => {
    const grouped = new Map<string, CartItem[]>();
    items.forEach((item) => {
      const current = grouped.get(item.shop) ?? [];
      current.push(item);
      grouped.set(item.shop, current);
    });
    return Array.from(grouped.entries());
  }, [items]);

  const selectedItems = items.filter((item) => item.checked);
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSaved = selectedItems.reduce(
    (sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
    0,
  );
  const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allChecked = items.length > 0 && items.every((item) => item.checked);
  const promoGap = Math.max(0, 200 - total);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const toggleItem = (id: string) => {
    setSwipedId(null);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const toggleShop = (shop: string) => {
    setSwipedId(null);
    const shopItems = items.filter((item) => item.shop === shop);
    const nextChecked = !shopItems.every((item) => item.checked);
    setItems((current) =>
      current.map((item) => (item.shop === shop ? { ...item, checked: nextChecked } : item)),
    );
  };

  const toggleAll = () => {
    setSwipedId(null);
    const nextChecked = !allChecked;
    setItems((current) => current.map((item) => ({ ...item, checked: nextChecked })));
  };

  const changeQty = (id: string, delta: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.min(99, Math.max(1, item.quantity + delta)) } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setSwipedId(null);
    setItems((current) => current.filter((item) => item.id !== id));
    showToast('已移除商品');
  };

  const handlePay = () => {
    if (!selectedItems.length) {
      showToast('请选择商品');
      return;
    }
    router.push('/payment');
  };

  return (
    <main className={styles.page} onClick={() => swipedId && setSwipedId(null)}>
      <header className={styles.header}>
        <button className={styles.headerBack} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>
          购物车
          <small>{items.length ? `(${items.length})` : ''}</small>
        </div>
        <button
          className={styles.headerAction}
          type="button"
          onClick={() => {
            const next = !editMode;
            setEditMode(next);
            if (next) showToast('左滑商品可删除');
          }}
        >
          {editMode ? '完成' : '管理'}
        </button>
      </header>

      {promoGap > 0 ? (
        <section className={styles.promo}>
          <div className={styles.promoIcon}>🎁</div>
          <div className={styles.promoText}>
            再凑 <span>¥{promoGap.toFixed(1)}</span> 即可享受 <span>满减优惠</span>
          </div>
          <button className={styles.promoBtn} type="button" onClick={() => router.push('/')}>
            去凑单
          </button>
        </section>
      ) : null}

      {items.length ? (
        <>
          <section className={styles.list}>
            {groups.map(([shop, shopItems]) => {
              const shopChecked = shopItems.every((item) => item.checked);
              return (
                <article key={shop} className={styles.shopGroup}>
                  <div className={styles.shopHead}>
                    <button
                      className={`${styles.check} ${shopChecked ? styles.checkOn : ''}`}
                      type="button"
                      onClick={() => toggleShop(shop)}
                    >
                      <i className="fa-solid fa-check" />
                    </button>
                    <img className={styles.shopLogo} src={shopItems[0]?.shopLogo} alt={shop} />
                    <div className={styles.shopName}>
                      {shop}
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
                          className={`${styles.check} ${item.checked ? styles.checkOn : ''}`}
                          type="button"
                          onClick={() => toggleItem(item.id)}
                        >
                          <i className="fa-solid fa-check" />
                        </button>
                        <img
                          className={styles.itemImg}
                          src={item.img}
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
                                onClick={() => changeQty(item.id, -1)}
                              >
                                <i className="fa-solid fa-minus" />
                              </button>
                              <div className={styles.qtyVal}>{item.quantity}</div>
                              <button className={styles.qtyBtn} type="button" onClick={() => changeQty(item.id, 1)}>
                                <i className="fa-solid fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className={styles.deleteBtn} type="button" onClick={() => removeItem(item.id)}>
                        <i className="fa-solid fa-trash-can" /> 删除
                      </button>
                    </div>
                  ))}
                </article>
              );
            })}
          </section>

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
                  <img className={styles.recommendImg} src={item.img} alt={item.name} />
                  <div className={styles.recommendInfo}>
                    <div className={styles.recommendName}>{item.name}</div>
                    <div className={styles.recommendPrice}>
                      <small>¥</small>
                      {item.price}
                    </div>
                    <button
                      className={styles.recommendAdd}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        showToast('已加入购物车');
                      }}
                    >
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className={styles.empty}>
          <i className="fa-solid fa-cart-shopping" />
          <div className={styles.emptyText}>购物车是空的</div>
          <div className={styles.emptyDesc}>快去商城挑选心仪的商品吧</div>
          <button className={styles.emptyBtn} type="button" onClick={() => router.push('/')}>
            <i className="fa-solid fa-store" /> 逛商城
          </button>
        </section>
      )}

      <footer className={styles.bar}>
        <div className={styles.barLeft}>
          <button className={styles.barAll} type="button" onClick={toggleAll}>
            <span className={`${styles.check} ${allChecked ? styles.checkOn : ''}`}>
              <i className="fa-solid fa-check" />
            </span>
            <span>全选</span>
          </button>
        </div>
        <div className={styles.barSpacer} />
        <div className={styles.barTotal}>
          <div className={styles.barTotalLabel}>合计</div>
          <div className={styles.barTotalPrice}>
            <small>¥</small>
            {total.toFixed(1)}
          </div>
          <div className={styles.barSaved}>{totalSaved > 0 ? `已省 ¥${totalSaved.toFixed(1)}` : ''}</div>
        </div>
        <button
          className={`${styles.barBtn} ${totalCount === 0 ? styles.barBtnDisabled : ''}`}
          type="button"
          onClick={handlePay}
        >
          结算({totalCount})
        </button>
      </footer>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
