import Link from 'next/link';

import type { ProductSummary } from '@joy/shared';

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link className="product-card" href={`/product/${product.id}`}>
      <div
        className="product-card__image"
        style={{ backgroundImage: `url(${product.img})` }}
      />
      <div className="product-card__body">
        <div className="product-card__brand">{product.brand}</div>
        <h3>{product.name}</h3>
        <div className="product-card__price">
          <span>¥{product.price}</span>
          <small>竞猜价 ¥{product.guessPrice}</small>
        </div>
      </div>
    </Link>
  );
}
