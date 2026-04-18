export function MallHome() {
  const heroAvatars = [
    '/legacy/images/mascot/mouse-main.png',
    '/legacy/images/mascot/mouse-happy.png',
    '/legacy/images/mascot/mouse-casual.png',
  ];

  const mallItems = [
    {
      id: 'p001',
      name: '乐事薯片大礼包',
      price: 29.9,
      originalPrice: 45.9,
      sales: 12563,
      img: '/legacy/images/products/p001-lays.jpg',
      tag: '竞猜',
      miniTag: 'mt-guess',
      height: 212,
    },
    {
      id: 'p002',
      name: '奥利奥夹心饼干组合',
      price: 19.9,
      originalPrice: 32,
      sales: 8641,
      img: '/legacy/images/products/p002-oreo.jpg',
      tag: '爆款',
      miniTag: 'mt-hot',
      height: 178,
    },
    {
      id: 'p007',
      name: '德芙巧克力丝滑礼盒',
      price: 55,
      originalPrice: 78,
      sales: 4260,
      img: '/legacy/images/products/p007-dove.jpg',
      tag: '新品',
      miniTag: 'mt-new',
      height: 236,
    },
    {
      id: 'p010',
      name: '东方树叶乌龙茶',
      price: 5,
      originalPrice: 6.5,
      sales: 2435,
      img: '/legacy/images/products/p010-oriental.jpg',
      tag: '特惠',
      miniTag: 'mt-sale',
      height: 194,
    },
    {
      id: 'p003',
      name: '三只松鼠坚果礼盒',
      price: 68,
      originalPrice: 99,
      sales: 6230,
      img: '/legacy/images/products/p003-squirrels.jpg',
      tag: '好物',
      miniTag: 'mt-limit',
      height: 220,
    },
  ];

  return (
    <main className="mall-home">
      <div className="m-nav">
        <div className="m-logo">
          <span className="m-logo-main">优米</span>
          <span className="m-logo-sub">优选</span>
        </div>
        <div className="m-search">
          <i className="fa-solid fa-magnifying-glass" />
          <span>搜索商品/竞猜</span>
        </div>
        <div className="m-icons">
          <button className="m-ico" type="button">
            <i className="fa-regular fa-comment-dots" />
          </button>
          <button className="m-ico" type="button">
            <i className="fa-solid fa-cart-shopping" />
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
            <div className="m-cat-item on">
              🔖 全部 <span className="mci-count">32</span>
            </div>
            <div className="m-cat-item">
              💄 美妆护肤 <span className="mci-count">8</span>
            </div>
            <div className="m-cat-item">
              🎲 潮玩盲盒 <span className="mci-count">5</span>
            </div>
            <div className="m-cat-item">
              🍜 食品饮料 <span className="mci-count">7</span>
            </div>
            <div className="m-cat-item">
              📱 数码配件 <span className="mci-count">4</span>
            </div>
            <div className="m-cat-item">
              👟 服饰鞋包 <span className="mci-count">5</span>
            </div>
            <div className="m-cat-item">
              🏠 生活好物 <span className="mci-count">3</span>
            </div>
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
              <span className="collab-left">鞠婧祎</span>
              <span className="collab-divider" />
              <span className="collab-right">MAC</span>
            </div>
          </div>

          <div className="m-hero-poster-wrap">
            <div className="m-hero-img">
              <img alt="hero" src="/legacy/images/mac-jjy-hd-poster.jpg" />
              <div className="m-hero-img-logo">
                <span className="m-hero-img-logo-text">M·A·C</span>
              </div>
              <div className="m-hero-img-badge">
                <i className="fa-solid fa-crown" />
                限定联名
              </div>
              <div className="m-hero-img-overlay">
                <div className="m-hero-promo-l1">
                  <span className="p-yen">¥</span>
                  <span className="p-big">9.9</span> 起
                </div>
              </div>
              <button className="m-hero-promo-cta" type="button">
                立即参与 &gt;
              </button>
            </div>
          </div>

          <div className="m-hero-info">
            <div className="m-hero-brand-row">
              <img
                alt="MAC"
                className="m-hero-brand-av"
                src="/legacy/images/products/p007-dove.jpg"
              />
              <div className="m-hero-brand-text">
                <div className="m-hero-brand-name">MAC 魅可</div>
                <div className="m-hero-brand-sub">MAC 鞠婧祎同款柔雾唇膏套装</div>
              </div>
            </div>
            <div className="m-hero-details">
              <div>
                <span className="dicon">✅</span> 支付 ¥9.9 享 1.8g 试用装 + 品牌礼遇
              </div>
              <div>
                <span className="dicon">✅</span> 参与抽奖赢取 ¥300 正装口红（共100份）
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
                {heroAvatars.map((avatar, index) => (
                  <img alt={`participant-${index + 1}`} key={avatar} src={avatar} />
                ))}
              </div>
              <span className="m-hero-people-text">12.6k+ 人已参与</span>
            </div>
          </div>
        </section>

        <div className="m-grid">
          {mallItems.map((item) => (
            <article className="m-card mfc-enter" key={item.id}>
              <div className="m-card-img" style={{ height: item.height }}>
                <img alt={item.name} src={item.img} />
                <button className="m-card-fav" type="button">
                  <i className="fa-regular fa-heart" />
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
      </div>

      <div className="m-banner">
        <div className="m-banner-img">
          <div className="m-banner-center">
            <div className="m-banner-collab">年少有为 × 乐事</div>
            <div className="m-banner-sub">猜对裴谦最爱的口味，赢大礼包🎁</div>
            <button className="m-banner-cta banner-centered" type="button">
              立即参与 →
            </button>
          </div>
        </div>
      </div>
      <div className="m-load-more">加载更多好物 ↓</div>
      <div style={{ height: 24 }} />
    </main>
  );
}
