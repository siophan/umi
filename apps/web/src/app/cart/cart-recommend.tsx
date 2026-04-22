'use client';

import type { ProductFeedItem } from '@umi/shared';

import styles from './page.module.css';

type CartRecommendProps = {
  cartError: string | null;
  discoverError: string | null;
  recommendItems: ProductFeedItem[];
  onRetry: () => void;
  onOpenProduct: (productId: string) => void;
};

export function CartRecommend({
  cartError,
  discoverError,
  recommendItems,
  onRetry,
  onOpenProduct,
}: CartRecommendProps) {
  if (cartError) {
    return null;
  }

  if (discoverError) {
    return (
      <section className={styles.recommendState}>
        <div className={styles.recommendTitle}>
          <i className="fa-solid fa-wand-magic-sparkles" />
          你可能还喜欢
        </div>
        <div className={styles.recommendError}>推荐流加载失败：{discoverError}</div>
        <button className={styles.recommendRetry} type="button" onClick={onRetry}>
          重试
        </button>
      </section>
    );
  }

  if (!recommendItems.length) {
    return null;
  }

  return (
    <section className={styles.recommend}>
      <div className={styles.recommendTitle}>
        <i className="fa-solid fa-wand-magic-sparkles" />
        你可能还喜欢
      </div>
      <div className={styles.recommendScroll}>
        {recommendItems.map((item) => (
          <article key={item.id} className={styles.recommendCard} onClick={() => onOpenProduct(item.id)}>
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
  );
}

