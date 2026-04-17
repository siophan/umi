import { MobileShell } from '../components/mobile-shell';
import { demoGuesses, demoProduct, demoProduct2 } from '../lib/demo';

export default function HomePage() {
  const mallItems = [
    {
      id: demoProduct.id,
      name: demoProduct.name,
      price: demoProduct.price,
      originalPrice: 1099,
      sales: 12563,
      guessPrice: demoProduct.guessPrice,
      img: demoProduct.img,
      tag: '竞猜',
      miniTag: 'mt-guess',
      height: 212,
    },
    {
      id: demoProduct2.id,
      name: demoProduct2.name,
      price: demoProduct2.price,
      originalPrice: 89,
      sales: 8641,
      guessPrice: demoProduct2.guessPrice,
      img: demoProduct2.img,
      tag: '爆款',
      miniTag: 'mt-hot',
      height: 178,
    },
    {
      id: 'prod-3',
      name: '丝绒哑光限定口红',
      price: 329,
      originalPrice: 420,
      sales: 4260,
      guessPrice: 19.9,
      img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80',
      tag: '新品',
      miniTag: 'mt-new',
      height: 236,
    },
    {
      id: 'prod-4',
      name: '联名限定香氛礼盒',
      price: 599,
      originalPrice: 699,
      sales: 2435,
      guessPrice: 29.9,
      img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80',
      tag: '特惠',
      miniTag: 'mt-sale',
      height: 194,
    },
    {
      id: 'prod-5',
      name: '潮玩盲盒收藏款',
      price: 129,
      originalPrice: 149,
      sales: 6230,
      guessPrice: 12.9,
      img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      tag: '好物',
      miniTag: 'mt-limit',
      height: 220,
    },
  ];

  return (
    <MobileShell tab="home" tone="mall">
      <main className="mall-home">
        <div className="m-nav">
          <div className="m-logo">
            <span className="m-logo-main">优米</span>
            <span className="m-logo-sub">优选</span>
          </div>
          <div className="m-search">
            <span>⌕</span>
            <span>搜索商品/竞猜</span>
          </div>
          <div className="m-icons">
            <button className="m-ico" type="button">
              ☰
            </button>
            <button className="m-ico" type="button">
              🛒
              <span className="m-ico-badge">5</span>
            </button>
          </div>
        </div>

        <div className="m-tabs" id="mTabs">
          <button className="m-tab on" type="button">
            推荐
          </button>
          <button className="m-tab" type="button">
            秒杀 <span className="m-tab-badge badge-seckill">HOT</span>
          </button>
          <button className="m-tab" type="button">
            新品 <span className="m-tab-badge badge-new">NEW</span>
          </button>
          <button className="m-tab" type="button">
            分类▾
          </button>
          <button className="m-tab" type="button">
            特卖 <span className="m-tab-badge badge-special">省</span>
          </button>
        </div>

        <div className="m-cat-dropdown" id="mCatDropdown">
          <div className="m-cat-mask" />
          <div className="m-cat-panel">
            <div className="m-cat-title">🔥 热门分类</div>
            <div className="m-cat-hot" id="mCatHot">
              <div className="m-cat-hot-item on">
                <div className="mchi-icon">💄</div>
                <div className="mchi-name">美妆护肤</div>
              </div>
              <div className="m-cat-hot-item">
                <div className="mchi-icon">🎲</div>
                <div className="mchi-name">潮玩盲盒</div>
              </div>
              <div className="m-cat-hot-item">
                <div className="mchi-icon">🍜</div>
                <div className="mchi-name">食品饮料</div>
              </div>
              <div className="m-cat-hot-item">
                <div className="mchi-icon">📱</div>
                <div className="mchi-name">数码配件</div>
              </div>
            </div>
            <div className="m-cat-title">全部分类</div>
            <div className="m-cat-grid" id="mCatGrid">
              <div className="m-cat-item on">🔖 全部 <span className="mci-count">32</span></div>
              <div className="m-cat-item">💄 美妆护肤 <span className="mci-count">8</span></div>
              <div className="m-cat-item">🎲 潮玩盲盒 <span className="mci-count">5</span></div>
              <div className="m-cat-item">🍜 食品饮料 <span className="mci-count">7</span></div>
              <div className="m-cat-item">📱 数码配件 <span className="mci-count">4</span></div>
              <div className="m-cat-item">👟 服饰鞋包 <span className="mci-count">5</span></div>
              <div className="m-cat-item">🏠 生活好物 <span className="mci-count">3</span></div>
            </div>
            <div className="m-cat-sort">
              <span className="m-cat-sort-label">排序：</span>
              <span className="m-cat-sort-btn on">综合</span>
              <span className="m-cat-sort-btn">销量↓</span>
              <span className="m-cat-sort-btn">价格↑</span>
              <span className="m-cat-sort-btn">价格↓</span>
              <span className="m-cat-sort-btn">折扣↓</span>
            </div>
          </div>
        </div>

        <div className="m-feed-area" id="mFeedArea">
          <section className="m-hero">
            <div className="m-hero-header">
              <div className="m-hero-collab">
                <span className="collab-left">LISA</span>
                <span className="collab-divider" />
                <span className="collab-right">MAC</span>
              </div>
            </div>

            <div className="m-hero-poster-wrap">
              <div className="m-hero-img">
                <img alt="hero" src="https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1600&q=80" />
                <div className="m-hero-img-logo">
                  <span className="m-hero-img-logo-text">M·A·C</span>
                </div>
                <div className="m-hero-img-badge">✦ 限定联名</div>
                <div className="m-hero-img-overlay">
                  <div className="m-hero-promo-l1">
                    <span className="p-yen">¥</span>
                    <span className="p-big">19.9</span> 起
                  </div>
                </div>
                <button className="m-hero-promo-cta" type="button">
                  立即参与 &gt;
                </button>
              </div>
            </div>

            <div className="m-hero-info">
              <div className="m-hero-brand-row">
                <div className="m-hero-brand-av">M</div>
                <div className="m-hero-brand-text">
                  <div className="m-hero-brand-name">MAC 魅可</div>
                  <div className="m-hero-brand-sub">限定联名口红礼遇</div>
                </div>
              </div>
              <div className="m-hero-details">
                <div>
                  <span className="dicon">✅</span> 支付 ¥19.9 享试用装 + 品牌礼遇
                </div>
                <div>
                  <span className="dicon">✅</span> 参与抽奖赢取 ¥329 正装口红
                </div>
              </div>
              <div className="m-hero-progress">
                <span>已参与：85%</span>
                <div className="m-hero-bar">
                  <div className="m-hero-bar-fill" style={{ width: '85%' }} />
                </div>
                <span>距离结束：2天10时</span>
              </div>
              <div className="m-hero-people">
                <div className="m-hero-avatars">
                  <span>A</span>
                  <span>R</span>
                  <span>S</span>
                </div>
                <span className="m-hero-people-text">12.6k+ 人已参与</span>
              </div>
            </div>
          </section>

          <div className="m-grid">
            {mallItems.map((item, index) => (
              <article className="m-card" key={item.id}>
                <div className="m-card-img" style={{ height: item.height }}>
                  <img alt={item.name} src={item.img} />
                  <button className="m-card-fav" type="button">
                    ♡
                  </button>
                </div>
                <div className="m-card-body">
                  <div className="m-card-title">{item.name}</div>
                  <div className="m-card-price-row">
                    <span className="m-card-price">
                      <small>¥</small>
                      {item.price}
                    </span>
                    <span className="m-card-orig">¥{item.originalPrice}</span>
                  </div>
                  <div className="m-card-bottom">
                    <div className="m-card-tags">
                      <span className={`m-card-mini-tag ${item.miniTag}`}>{item.tag}</span>
                    </div>
                    <span className="m-card-sales">{item.sales}人付款</span>
                  </div>
                </div>
              </article>
            ))}

            <article className="m-collab-card text-only">
              <div className="m-collab-badge">品牌大使</div>
              <div className="m-collab-content">
                <div className="m-collab-title">
                  LISA <span className="collab-x">×</span> CELINE
                </div>
                <div className="m-collab-sub">定义你的法式优雅</div>
                <button className="m-collab-cta" type="button">
                  查看系列 →
                </button>
              </div>
            </article>
          </div>

          <div className="m-banner">
            <div className="m-banner-img">
              <div className="m-banner-overlay">
                <div className="m-banner-collab">年少有为 × 乐事</div>
                <div className="m-banner-sub">猜对裴谦最爱的口味，赢大礼包</div>
                <button className="m-banner-cta" type="button">
                  立即参与 →
                </button>
              </div>
            </div>
          </div>

          <div className="m-load-more">加载更多好物 ↓</div>
        </div>
      </main>
    </MobileShell>
  );
}
