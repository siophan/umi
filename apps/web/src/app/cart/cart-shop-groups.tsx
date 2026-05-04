'use client';

import { type MutableRefObject } from 'react';
import type { CartItem as CartLineItem } from '@umi/shared';

import { getDisplayShopName } from './cart-helpers';
import styles from './page.module.css';

type CartShopGroupsProps = {
  groupedItems: [string, CartLineItem[]][];
  swipedId: string | null;
  touchStartX: MutableRefObject<number>;
  onSetSwipedId: (value: string | null) => void;
  onToggleShop: (shop: string) => Promise<void>;
  onToggleItem: (itemId: string) => Promise<void>;
  onChangeQty: (itemId: string, delta: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onOpenProduct: (productId: string) => void;
};

export function CartShopGroups({
  groupedItems,
  swipedId,
  touchStartX,
  onSetSwipedId,
  onToggleShop,
  onToggleItem,
  onChangeQty,
  onRemoveItem,
  onOpenProduct,
}: CartShopGroupsProps) {
  return (
    <section className={styles.list}>
      {groupedItems.map(([shop, shopItems], groupIndex) => {
        const shopChecked = shopItems.length > 0 && shopItems.every((item) => item.checked);
        const shopDisplayName = getDisplayShopName(shopItems[0]!);

        return (
          <article
            key={shop}
            className={`${styles.shopGroup} ${styles.fadeIn}`}
            style={{ animationDelay: `${groupIndex * 0.06}s` }}
          >
            <div className={styles.shopHead}>
              <button
                className={`${styles.check} ${shopChecked ? styles.checkOn : ''}`}
                type="button"
                onClick={() => void onToggleShop(shop)}
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
                  if (diff < -30) onSetSwipedId(item.id);
                  if (diff > 30 && swipedId === item.id) onSetSwipedId(null);
                }}
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? 0;
                }}
              >
                <div className={styles.item}>
                  <button
                    className={`${styles.check} ${styles.itemCheck} ${item.checked ? styles.checkOn : ''}`}
                    type="button"
                    onClick={() => void onToggleItem(item.id)}
                  >
                    <i className="fa-solid fa-check" />
                  </button>
                  <img
                    className={styles.itemImg}
                    src={item.img || '/legacy/images/products/p001-lays.jpg'}
                    alt={item.name}
                    onClick={() => onOpenProduct(item.productId)}
                  />
                  <div className={styles.itemBody}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemSpecs}>{item.specs?.trim() || '默认规格'}</div>
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
                          onClick={() => void onChangeQty(item.id, -1)}
                        >
                          <i className="fa-solid fa-minus" />
                        </button>
                        <div className={styles.qtyVal}>{item.quantity}</div>
                        <button
                          className={`${styles.qtyBtn} ${item.stock > 0 && item.quantity >= item.stock ? styles.qtyBtnDisabled : ''}`}
                          type="button"
                          onClick={() => void onChangeQty(item.id, 1)}
                        >
                          <i className="fa-solid fa-plus" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button className={styles.deleteBtn} type="button" onClick={() => void onRemoveItem(item.id)}>
                  <i className="fa-solid fa-trash-can" /> 删除
                </button>
              </div>
            ))}
          </article>
        );
      })}
    </section>
  );
}
