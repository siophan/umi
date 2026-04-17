import { MobileShell } from '../../../components/mobile-shell';
import { PageHeader } from '../../../components/page-header';
import { demoProduct } from '../../../lib/demo';

export default function ProductDetailPage() {
  return (
    <MobileShell>
      <PageHeader backHref="/" title="商品详情" />
      <main className="product-detail-page">
        <div
          className="product-detail__hero"
          style={{ backgroundImage: `url(${demoProduct.img})` }}
        />
        <section className="product-detail__card">
          <span className="product-detail__brand">{demoProduct.brand}</span>
          <h1>{demoProduct.name}</h1>
          <p className="product-detail__desc">
            延续旧版商城的简洁白底卡片风格，商品详情和竞猜入口并列呈现。
          </p>
          <div className="product-detail__price">
            <strong>¥{demoProduct.price}</strong>
            <span>竞猜价 ¥{demoProduct.guessPrice}</span>
          </div>
          <div className="product-detail__actions">
            <button type="button">加入仓库</button>
            <button className="accent" type="button">
              立即购买
            </button>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
