'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { GuessOption, WarehouseItem } from '@joy/shared';

import { demoGuess, demoProduct, demoProduct2, demoWarehouse } from '../../../lib/demo';
import styles from './page.module.css';

const heroImages = [
  demoProduct.img,
  'https://images.unsplash.com/photo-1523393230790-96c0c7aeebf9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1525955656353-0c621456f06e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1200&q=80',
];

const reviews = [
  {
    user: '阿柠',
    avatar: demoProduct.img,
    stars: 5,
    text: '页面排版很顺，商品图和价格层级非常清晰。',
    time: '2 小时前',
    likes: 12,
  },
  {
    user: 'Mika',
    avatar: demoProduct2.img,
    stars: 5,
    text: '竞猜和直购的切换逻辑很直观，底部操作也很顺手。',
    time: '昨天',
    likes: 8,
  },
];

const recommend = [
  {
    id: demoProduct.id,
    name: demoProduct.name,
    price: demoProduct.price,
    img: demoProduct.img,
  },
  {
    id: demoProduct2.id,
    name: demoProduct2.name,
    price: demoProduct2.price,
    img: demoProduct2.img,
  },
  {
    id: 'prod-3',
    name: '蓝莓冻干酸奶块',
    price: 39,
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
  },
];

const colorOptions = ['曜黑', '雾白', '奶咖', '樱桃红'];
const sizeOptions = ['39', '40', '41', '42'];

export default function ProductDetailPage() {
  const [currentTab, setCurrentTab] = useState<'direct' | 'guess' | 'inv'>('direct');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>(['vw-1']);

  const guessPrice = useMemo(() => demoProduct.guessPrice, []);
  const directPrice = useMemo(() => demoProduct.price, []);
  const invPrice = useMemo(() => demoProduct.price - 120, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activePrice = currentTab === 'guess' ? guessPrice : currentTab === 'inv' ? invPrice : directPrice;

  const bottomPrimary =
    currentTab === 'guess' ? '参与竞猜' : currentTab === 'inv' ? '立即换购' : '立即购买';
  const bottomSecondary =
    currentTab === 'guess' ? '猜中即发货' : currentTab === 'inv' ? '库存抵扣' : '直购发货';

  return (
    <main className={styles.page}>
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <button className={styles.navBtn} type="button" onClick={() => history.back()}>
          ←
        </button>
        <div className={styles.navTitle}>商品详情</div>
        <div className={styles.navActions}>
          <button className={styles.navBtn} type="button">
            ↗
          </button>
          <button className={styles.navBtn} type="button">
            ⋯
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div
          className={styles.heroSlider}
          onScroll={(event) => {
            const target = event.currentTarget;
            const slide = Math.round(target.scrollLeft / target.clientWidth);
            setCurrentSlide(Math.max(0, Math.min(heroImages.length - 1, slide)));
          }}
        >
          {heroImages.map((src, index) => (
            <div className={styles.heroSlide} key={`${src}-${index}`}>
              <img src={src} alt={`${demoProduct.name} ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className={styles.heroDots}>
          {heroImages.map((_, index) => (
            <button
              className={index === currentSlide ? styles.heroDotActive : styles.heroDot}
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
        <div className={styles.heroCounter}>
          {currentSlide + 1}/{heroImages.length}
        </div>
      </section>

      <section className={styles.priceCard}>
        <div className={styles.priceRow}>
          <div className={styles.priceMain}>
            <small>¥</small>
            {activePrice}
          </div>
          <div className={styles.priceOrig}>¥{demoProduct.price}</div>
          <div className={styles.priceTags}>
            <span className={`${styles.priceTag} ${styles.tagHot}`}>热门</span>
            <span className={`${styles.priceTag} ${styles.tagOff}`}>低价</span>
          </div>
        </div>
        <div className={styles.titleArea}>
          <span className={`${styles.titleBadge} ${styles.selfBadge}`}>自营</span>
          <span className={`${styles.titleBadge} ${styles.authBadge}`}>认证</span>
          <span className={`${styles.titleBadge} ${styles.guessBadge}`}>竞猜</span>
          <span className={styles.productTitle}>{demoProduct.name}</span>
        </div>
        <div className={styles.productSub}>
          <span>{demoProduct.brand}</span>
          <span className={styles.sep}>·</span>
          <span>{demoProduct.category}</span>
          <span className={styles.sep}>·</span>
          <span>{guessPrice} 竞猜价</span>
        </div>
        <div className={styles.promoStrip}>
          <button className={styles.promoChip} type="button">
            <span className={`${styles.pcTag} ${styles.pcCoupon}`}>券</span> 满 50 减 5
          </button>
          <button className={styles.promoChip} type="button">
            <span className={`${styles.pcTag} ${styles.pcGuess}`}>猜</span> 参与竞猜得好礼
          </button>
          <button className={styles.promoChip} type="button">
            <span className={`${styles.pcTag} ${styles.pcSvc}`}>保</span> 正品保障
          </button>
        </div>
      </section>

      <section className={styles.modeSection}>
        <div className={styles.modeBar}>
          <button
            className={`${styles.modeTab} ${currentTab === 'direct' ? styles.modeDirectOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('direct')}
          >
            <span className={styles.modeIcon}>🛒</span> 直购 <span className={styles.modePrice}>¥{directPrice}</span>
          </button>
          <button
            className={`${styles.modeTab} ${currentTab === 'guess' ? styles.modeGuessOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('guess')}
          >
            <span className={styles.modeIcon}>🎲</span> 竞猜 <span className={styles.modePrice}>¥{guessPrice}</span>
          </button>
          <button
            className={`${styles.modeTab} ${currentTab === 'inv' ? styles.modeInvOn : ''}`}
            type="button"
            onClick={() => setCurrentTab('inv')}
          >
            <span className={styles.modeIcon}>💰</span> 换购 <span className={styles.modePrice}>¥{invPrice}</span>
          </button>
        </div>
      </section>

      <section className={styles.specSection}>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>颜色</div>
          <div className={styles.specScroll}>
            {colorOptions.map((item, index) => (
              <button
                className={selectedColor === index ? styles.specChipOn : styles.specChip}
                key={item}
                type="button"
                onClick={() => setSelectedColor(index)}
              >
                <span className={styles.specDot} />
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.specRow}>
          <div className={styles.specLabel}>尺码</div>
          <div className={styles.specScroll}>
            {sizeOptions.map((item, index) => (
              <button
                className={selectedSize === index ? styles.specChipOn : styles.specChip}
                key={item}
                type="button"
                onClick={() => setSelectedSize(index)}
              >
                {item}
                <span className={styles.specDp}>现货</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.specFoot}>
          <span className={styles.specFootSel}>
            已选 <b>{colorOptions[selectedColor]}</b> / <b>{sizeOptions[selectedSize]}</b>
          </span>
          <span className={styles.specFootPrice}>
            ¥{activePrice} <small>现价</small>
          </span>
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>
                <span>⟡</span> {currentTab === 'guess' ? '竞猜玩法' : currentTab === 'inv' ? '换购玩法' : '直购玩法'}
              </div>
              <button className={styles.panelMore} type="button" onClick={() => setCurrentTab('guess')}>
                去竞猜
              </button>
            </div>

            {currentTab === 'guess' ? (
              <>
                <div className={styles.guessHero}>
                  <div className={styles.guessHeroTop}>
                    <div className={styles.guessLabel}>竞猜价格</div>
                    <span className={styles.guessTag}>热门</span>
                  </div>
                  <div className={styles.guessPrice}>
                    <small>¥</small>
                    {guessPrice}
                  </div>
                  <div className={styles.guessSub}>原价 ¥{demoProduct.price}</div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>当前进度</div>
                  <div className={styles.panelMore}>
                    剩余 <strong>2</strong> 个名额
                  </div>
                </div>
                <div className={styles.ringSection}>
                  <div className={styles.ringWrap}>
                    <div className={styles.ringInner}>
                      <span className={styles.ringPct}>96%</span>
                      <span className={styles.ringLabel}>已满</span>
                    </div>
                  </div>
                  <div className={styles.ringInfo}>
                    <div className={styles.ringStat}>
                      <strong>48</strong>
                      <span>/50 人</span>
                    </div>
                    <div className={styles.ringStatLabel}>已参与人数</div>
                    <div className={styles.ringStat}>
                      <strong>¥{demoProduct.price}</strong>
                    </div>
                    <div className={styles.ringStatLabel}>商品市场价值</div>
                  </div>
                </div>
                <div className={styles.guessOptions}>
                  {demoGuess.options.map((option: GuessOption, index: number) => (
                    <button className={styles.guessOption} key={option.id} type="button">
                      <span className={styles.optionRadio} />
                      <span className={styles.optionName}>{option.optionText}</span>
                      <span className={styles.optionOdds}>{option.odds.toFixed(1)}x</span>
                      <span className={styles.optionDesc}>{index === 0 ? '偏大 · 58%' : '偏小 · 42%'}</span>
                      <span className={styles.optionBar}>
                        <span style={{ width: index === 0 ? '58%' : '42%' }} />
                      </span>
                    </button>
                  ))}
                </div>
                <div className={styles.recList}>
                  {[
                    { name: '阿柠', choice: '猜大', time: '1 分钟前', av: demoProduct.img, cls: styles.recTagBig },
                    { name: 'Mika', choice: '猜小', time: '4 分钟前', av: demoProduct2.img, cls: styles.recTagSmall },
                    { name: 'Leo', choice: '猜大', time: '6 分钟前', av: demoProduct.img, cls: styles.recTagBig },
                  ].map((item) => (
                    <div className={styles.recItem} key={`${item.name}-${item.time}`}>
                      <img src={item.av} alt={item.name} />
                      <div className={styles.recInfo}>
                        <div className={styles.recName}>{item.name}</div>
                        <div className={styles.recTime}>{item.time}</div>
                      </div>
                      <span className={item.cls}>{item.choice}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : currentTab === 'direct' ? (
              <>
                <div className={styles.directHero}>
                  <div className={styles.directLabel}>直购价</div>
                  <div className={styles.directPrice}>
                    <small>¥</small>
                    {directPrice}
                  </div>
                  <div className={styles.directRow}>
                    <span className={styles.directOrig}>¥{demoProduct.price + 120}</span>
                    <span className={styles.directSave}>省 ¥120</span>
                  </div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>优惠券</div>
                </div>
                <div className={styles.couponStrip}>
                  <div className={styles.couponCard}>
                    <strong>¥5</strong>
                    <div>
                      <span>满 50 可用</span>
                      <em>领取</em>
                    </div>
                  </div>
                  <div className={styles.couponCard}>
                    <strong>¥15</strong>
                    <div>
                      <span>满 100 可用</span>
                      <em>领取</em>
                    </div>
                  </div>
                  <div className={styles.couponCard}>
                    <strong>¥20</strong>
                    <div>
                      <span>新人专享</span>
                      <em>领取</em>
                    </div>
                  </div>
                </div>
                <div className={styles.serviceGrid}>
                  {['正品保证', '24h发货', '顺丰包邮', '7天退换', '运费险', '极速退款'].map((item) => (
                    <div className={styles.serviceItem} key={item}>
                      <span>✓</span>
                      <em>{item}</em>
                    </div>
                  ))}
                </div>
                <div className={styles.compareRow}>
                  <button className={styles.compareCard} type="button" onClick={() => setCurrentTab('guess')}>
                    <span>竞猜价</span>
                    <strong>¥{guessPrice}</strong>
                    <em>去竞猜 →</em>
                  </button>
                  <button className={styles.compareCardGreen} type="button" onClick={() => setCurrentTab('inv')}>
                    <span>换购价</span>
                    <strong>¥{invPrice}</strong>
                    <em>去换购 →</em>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.invHero}>
                  <div className={styles.invLabel}>库存换购</div>
                  <div className={styles.invPrice}>
                    <small>¥</small>
                    {invPrice}
                  </div>
                  <div className={styles.invRow}>用仓库库存商品抵扣商品价值</div>
                </div>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}>换购计算</div>
                  <button className={styles.panelMore} type="button" onClick={() => setExchangeOpen(true)}>
                    选择抵扣
                  </button>
                </div>
                <div className={styles.exchangeVis}>
                  <div className={styles.exchangeBlock}>
                    <div className={styles.exchangeValueMuted}>¥{demoProduct.price}</div>
                    <div className={styles.exchangeLabel}>商品售价</div>
                  </div>
                  <div className={styles.exchangeArrow}>-</div>
                  <div className={styles.exchangeBlock}>
                    <div className={styles.exchangeValueAccent}>¥{Math.min(demoProduct.price - invPrice, 120)}</div>
                    <div className={styles.exchangeLabel}>库存可抵</div>
                  </div>
                  <div className={styles.exchangeArrow}>=</div>
                  <div className={styles.exchangeBlock}>
                    <div className={styles.exchangeValueGreen}>¥0</div>
                    <div className={styles.exchangeLabel}>免费换购</div>
                  </div>
                </div>
                <div className={styles.inventoryList}>
                  {demoWarehouse.map((item: WarehouseItem) => (
                    <div className={styles.inventoryItem} key={item.id}>
                      <img src={item.warehouseType === 'virtual' ? demoProduct.img : demoProduct2.img} alt={item.productName} />
                      <div className={styles.inventoryInfo}>
                        <div className={styles.inventoryName}>{item.productName}</div>
                        <div className={styles.inventoryMeta}>来源：{item.sourceType}</div>
                      </div>
                      <span className={styles.inventoryPrice}>¥{item.warehouseType === 'virtual' ? 49 : 59}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.flowSteps}>
                  {['选择抵扣', '确认价格', '下单发货'].map((item, index) => (
                    <div className={styles.flowStep} key={item}>
                      <div className={styles.flowNum}>{index + 1}</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>商品详情</div>
            </div>
            <div className={`${styles.detailText} ${detailExpanded ? styles.detailExpanded : ''}`}>
              这是一个接近旧版商城的商品详情页，顶部展示商品图轮播和价格信息，中部提供竞猜、直购、换购三种方式，并在底部继续保留商品详情、评价和推荐区块。
            </div>
            <button className={styles.detailToggle} type="button" onClick={() => setDetailExpanded((value) => !value)}>
              {detailExpanded ? '收起' : '展开全部'} <span>{detailExpanded ? '↑' : '↓'}</span>
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>用户评价 <span>{reviews.length}</span></div>
              <button className={styles.panelMore} type="button">
                全部
              </button>
            </div>
              {reviews.map((review) => (
              <article className={styles.reviewItem} key={review.user}>
                <img src={review.avatar} alt={review.user} />
                <div className={styles.reviewBody}>
                  <div className={styles.reviewName}>
                    {review.user}
                    <span className={styles.reviewStars}>★★★★★</span>
                  </div>
                  <div className={styles.reviewText}>{review.text}</div>
                  <div className={styles.reviewFoot}>
                    <span>{review.time}</span>
                    <span>♡ {review.likes}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.recommendTitle}>猜你喜欢</div>
          <div className={styles.recommendGrid}>
            {recommend.map((item) => (
              <Link className={styles.recommendItem} href={`/product/${item.id}`} key={item.id}>
                <img className={styles.recommendImg} src={item.img} alt={item.name} />
                <div className={styles.recommendName}>{item.name}</div>
                <div className={styles.recommendPrice}>¥{item.price}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.bottomBar}>
        <div className={styles.barLeft}>
          <button className={styles.barIcon} type="button">
            <span>◫</span>
            <em>店铺</em>
          </button>
          <button className={styles.barIcon} type="button">
            <span>♡</span>
            <em>收藏</em>
          </button>
          <button className={styles.barIcon} type="button">
            <span>◎</span>
            <em>客服</em>
          </button>
        </div>
        <div className={styles.barBtns}>
          <button className={styles.barSub} type="button">
            {currentTab === 'guess' ? '规则' : currentTab === 'inv' ? '库存' : '仓库'}
          </button>
          <button
            className={styles.barPrimary}
            type="button"
            onClick={() => {
              if (currentTab === 'inv') setExchangeOpen(true);
            }}
          >
            {bottomPrimary}
            <span>{bottomSecondary}</span>
          </button>
        </div>
      </div>

      {exchangeOpen ? (
        <div className={styles.exchangeOverlay}>
          <button className={styles.exchangeMask} type="button" onClick={() => setExchangeOpen(false)} />
          <section className={styles.exchangeSheet}>
            <div className={styles.exchangeHeader}>
              <div className={styles.exchangeTitle}>库存换购</div>
              <button type="button" onClick={() => setExchangeOpen(false)}>
                ×
              </button>
            </div>
            <div className={styles.exchangeTarget}>
              <img src={demoProduct.img} alt={demoProduct.name} />
              <div>
                <h3>{demoProduct.name}</h3>
                <strong>¥{demoProduct.price}</strong>
                <p>当前可用库存合计足以抵扣这件商品的绝大部分价格。</p>
              </div>
            </div>
            <div className={styles.exchangeBody}>
              <div className={styles.exchangeBodyTitle}>我的仓库库存</div>
              {demoWarehouse.map((item: WarehouseItem) => (
                <button
                  className={selectedWarehouse.includes(item.id) ? styles.exchangeCardSelected : styles.exchangeCard}
                  type="button"
                  key={item.id}
                  onClick={() =>
                    setSelectedWarehouse((current) =>
                      current.includes(item.id)
                        ? current.filter((id) => id !== item.id)
                        : [...current, item.id],
                    )
                  }
                >
                  <img src={item.warehouseType === 'virtual' ? demoProduct.img : demoProduct2.img} alt={item.productName} />
                  <div className={styles.exchangeCardInfo}>
                    <div className={styles.exchangeCardName}>{item.productName}</div>
                    <div className={styles.exchangeCardMeta}>{item.sourceType}</div>
                  </div>
                  <div className={styles.exchangeCardPrice}>¥{item.warehouseType === 'virtual' ? 49 : 59}</div>
                </button>
              ))}
            </div>
            <div className={styles.exchangeFooter}>
              <div className={styles.exchangeSummary}>
                <div>
                  <span>已选</span>
                  <strong>{selectedWarehouse.length}</strong>
                </div>
                <div>
                  <span>预计抵扣</span>
                  <strong>¥108</strong>
                </div>
                <div>
                  <span>需补差价</span>
                  <strong>¥0</strong>
                </div>
              </div>
              <button className={styles.exchangeConfirm} type="button" onClick={() => setExchangeOpen(false)}>
                确认换购
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
