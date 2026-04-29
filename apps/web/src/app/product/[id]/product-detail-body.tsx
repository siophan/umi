'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type {
  CouponListItem,
  GuessOption,
  ProductDetailResult,
  ProductSummary,
  PublicShopDetailResult,
  WarehouseItem,
} from '@umi/shared';

import type { ActiveGuessDetail, ProductDetailData, ProductMode } from './product-detail-helpers';
import { formatPriceNumber } from './product-detail-helpers';
import styles from './page.module.css';

type DetailTabKey = 'detail' | 'spec' | 'package';

type GuessCountdown = {
  hours: string;
  minutes: string;
  seconds: string;
};

type ProductDetailBodyProps = {
  product: ProductDetailData;
  activeGuess: ActiveGuessDetail | null;
  warehouseItems: WarehouseItem[];
  inventoryPreview: WarehouseItem[];
  inventoryTotalValue: number;
  recommendations: ProductSummary[];
  sameShopProducts: ProductSummary[];
  shopStats: PublicShopDetailResult['shop'] | null;
  shopFollowing: boolean;
  shopFollowBusy: boolean;
  onToggleShopFollow: () => void;
  reviews: ProductDetailResult['reviews'];
  onToggleReviewHelpful: (reviewId: string) => void;
  onViewAllReviews: () => void;
  coupons: CouponListItem[];
  currentTab: ProductMode;
  directPrice: number;
  guessPrice: number;
  selectedGuessOpt: number;
  detailExpanded: boolean;
  selectedDeduct: number;
  exchangeToPay: number;
  guessTotalVotes: number;
  reviewCount: number;
  guessCountdown: GuessCountdown | null;
  onChangeTab: (tab: ProductMode) => void;
  onSelectGuessOption: (index: number) => void;
  onOpenExchange: () => void;
  onToggleDetailExpanded: () => void;
};

export function ProductDetailBody({
  product,
  activeGuess,
  warehouseItems,
  inventoryPreview,
  inventoryTotalValue,
  recommendations,
  sameShopProducts,
  shopStats,
  shopFollowing,
  shopFollowBusy,
  onToggleShopFollow,
  reviews,
  onToggleReviewHelpful,
  onViewAllReviews,
  coupons,
  currentTab,
  directPrice,
  guessPrice,
  selectedGuessOpt,
  detailExpanded,
  selectedDeduct,
  exchangeToPay,
  guessTotalVotes,
  reviewCount,
  guessCountdown,
  onChangeTab,
  onSelectGuessOption,
  onOpenExchange,
  onToggleDetailExpanded,
}: ProductDetailBodyProps) {
  return (
    <section className={styles.body}>
      {currentTab === 'guess' ? (
        <>
          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.guessHero}>
                <div className={styles.guessHeroTop}>
                  <div className={styles.guessLabel}>竞猜价格</div>
                </div>
                <div className={styles.guessPrice}>
                  <small>¥</small>
                  {guessPrice}
                </div>
                <div className={styles.guessSub}>原价 ¥{product.originalPrice}</div>
              </div>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <i className="fa-solid fa-chart-pie" style={{ color: '#ff6b00' }} /> 当前进度
                </div>
                <div className={styles.panelMore}>
                  已 <strong>{guessTotalVotes}</strong> 人参与
                </div>
              </div>
              <div className={styles.ringSection}>
                <div className={styles.ringInfo}>
                  <div className={styles.ringStat}>
                    <strong>{guessTotalVotes}</strong>
                    <span>人参与</span>
                  </div>
                  <div className={styles.ringStatLabel}>累计下注人数</div>
                  <div className={styles.ringStat}>
                    <strong>¥{product.price}</strong>
                  </div>
                  <div className={styles.ringStatLabel}>商品市场价值</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <i className="fa-solid fa-hand-pointer" style={{ color: '#ff6b00' }} /> 选择竞猜
                </div>
              </div>
              <div className={styles.guessOptions}>
                {(activeGuess?.options || []).map((option: GuessOption, index: number) => {
                  const percent = guessTotalVotes > 0 ? Math.round((option.voteCount / guessTotalVotes) * 100) : 0;
                  return (
                    <button
                      className={`${styles.guessOption} ${selectedGuessOpt === index ? styles.guessOptionSelected : ''}`}
                      key={option.id}
                      type="button"
                      onClick={() => onSelectGuessOption(index)}
                    >
                      <span className={styles.optionRadio} />
                      <span className={styles.optionName}>{option.optionText}</span>
                      <span className={styles.optionOdds}>{option.odds.toFixed(1)}x</span>
                      <span className={styles.optionDesc}>{`当前占比 · ${percent}%`}</span>
                      <span className={styles.optionBar}>
                        <span style={{ width: `${percent}%` }} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {!activeGuess ? <div className={styles.directRow}>当前暂无进行中的竞猜。</div> : null}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <i className="fa-solid fa-users" style={{ color: '#ff6b00' }} /> 参与记录
                </div>
                <div className={styles.panelMore}>共 {guessTotalVotes} 人</div>
              </div>
              <div className={styles.recList}>
                {(activeGuess?.options || []).map((item, index) => {
                  const percent = guessTotalVotes > 0 ? Math.round((item.voteCount / guessTotalVotes) * 100) : 0;
                  return (
                    <div className={styles.recItem} key={item.id}>
                      <img src={product.img} alt={item.optionText} />
                      <div className={styles.recInfo}>
                        <div className={styles.recName}>{item.optionText}</div>
                        <div className={styles.recTime}>{item.voteCount} 票 · 当前占比 {percent}%</div>
                      </div>
                      <span className={index === 0 ? styles.recTagBig : styles.recTagSmall}>
                        {index === 0 ? '高热度' : '待反转'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {activeGuess ? (
                <Link className={styles.guessMore} href={`/guess/${activeGuess.id}`}>
                  查看完整记录 <i className="fa-solid fa-chevron-right" />
                </Link>
              ) : null}
            </div>
          </div>

          {guessCountdown ? (
            <div className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={styles.panelHead}>
                  <div className={styles.panelTitle}><i className="fa-solid fa-clock" style={{ color: '#E64A19' }} /> 倒计时</div>
                </div>
                <div className={styles.countdownBar}>
                  <div className={styles.countdownBox}>{guessCountdown.hours}</div>
                  <div className={styles.countdownSep}>:</div>
                  <div className={styles.countdownBox}>{guessCountdown.minutes}</div>
                  <div className={styles.countdownSep}>:</div>
                  <div className={styles.countdownBox}>{guessCountdown.seconds}</div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : currentTab === 'direct' ? (
        <>
          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.directHero}>
                <div className={styles.directLabel}>直购价</div>
                <div className={styles.directPrice}>
                  <small>¥</small>
                  {directPrice}
                </div>
                <div className={styles.directRow}>
                  <span className={styles.directOrig}>¥{product.originalPrice}</span>
                  <span className={styles.directSave}>省 ¥{Math.max(0, product.originalPrice - directPrice)}</span>
                </div>
              </div>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <i className="fa-solid fa-ticket" style={{ color: '#4e6ae6' }} /> 优惠券
                </div>
              </div>
              <div className={styles.couponStrip}>
                {coupons.length ? coupons.map((coupon) => (
                  <div className={styles.couponCard} key={coupon.id}>
                    <strong>
                      {coupon.type === 'shipping'
                        ? '包邮'
                        : coupon.type === 'percent'
                          ? `${(coupon.amount / 10).toFixed(1).replace(/\.0$/, '')}折`
                          : `¥${coupon.amount}`}
                    </strong>
                    <div>
                      <span>{coupon.condition}</span>
                      <em>{coupon.name}</em>
                    </div>
                  </div>
                )) : (
                  <div className={styles.couponCard}>
                    <strong>暂无</strong>
                    <div>
                      <span>当前暂无可用优惠券</span>
                      <em>以领券中心为准</em>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}><i className="fa-solid fa-shield-halved" style={{ color: '#4e6ae6' }} /> 服务保障</div>
              </div>
              {(() => {
                const items: { label: string; value: string }[] = [];
                if (product.freight === 0 || product.freight == null) {
                  items.push({ label: '运费', value: '包邮' });
                } else if (product.freight > 0) {
                  items.push({ label: '运费', value: `¥${product.freight}` });
                }
                if (product.shipFrom) items.push({ label: '发货地', value: product.shipFrom });
                if (product.deliveryDays) items.push({ label: '发货时效', value: product.deliveryDays });
                if (items.length === 0) return null;
                return (
                  <div className={styles.shipInfo}>
                    {items.map((item) => (
                      <span key={item.label}>
                        {item.label}：<strong>{item.value}</strong>
                      </span>
                    ))}
                  </div>
                );
              })()}
              <div className={styles.serviceGrid}>
                {[
                  { icon: 'fa-certificate', label: '正品保证' },
                  { icon: 'fa-truck-fast', label: '24h发货' },
                  { icon: 'fa-box-open', label: '顺丰包邮' },
                  { icon: 'fa-rotate-left', label: '7天退换' },
                  { icon: 'fa-shield-halved', label: '运费险' },
                  { icon: 'fa-bolt', label: '极速退款' },
                ].map((item) => (
                  <div className={styles.serviceItem} key={item.label}>
                    <span><i className={`fa-solid ${item.icon}`} /></span>
                    <em>{item.label}</em>
                  </div>
                ))}
              </div>
              <div className={styles.compareRow}>
                {activeGuess ? (
                  <button className={styles.compareCard} type="button" onClick={() => onChangeTab('guess')}>
                    <span>竞猜价</span>
                    <strong>¥{guessPrice}</strong>
                    <em>去竞猜 <i className="fa-solid fa-arrow-right" /></em>
                  </button>
                ) : null}
                <button className={styles.compareCardGreen} type="button" onClick={() => onChangeTab('inv')}>
                  <span>换购价</span>
                  <strong>¥{directPrice}</strong>
                  <em>去换购 <i className="fa-solid fa-arrow-right" /></em>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.invHero}>
                <div className={styles.invLabel}>库存抵扣</div>
                <div className={styles.invPrice}>
                  <small>¥</small>
                  {directPrice}
                </div>
                <div className={styles.invRow}>用仓库库存商品抵扣商品价值</div>
              </div>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <i className="fa-solid fa-calculator" style={{ color: '#00875A' }} /> 换购计算
                </div>
                <button className={styles.panelMore} type="button" onClick={onOpenExchange}>
                  选择抵扣
                </button>
              </div>
              <div className={styles.exchangeVis}>
                <div className={styles.exchangeBlock}>
                  <div className={styles.exchangeValueMuted}>¥{directPrice}</div>
                  <div className={styles.exchangeLabel}>商品售价</div>
                </div>
                <div className={styles.exchangeArrow}>-</div>
                <div className={styles.exchangeBlock}>
                  <div className={styles.exchangeValueAccent}>¥{selectedDeduct}</div>
                  <div className={styles.exchangeLabel}>库存可抵</div>
                </div>
                <div className={styles.exchangeArrow}>=</div>
                <div className={styles.exchangeBlock}>
                  <div className={styles.exchangeValueGreen}>¥{exchangeToPay}</div>
                  <div className={styles.exchangeLabel}>预计补差价</div>
                </div>
              </div>
              {inventoryTotalValue >= directPrice ? (
                <div className={styles.exchangeCoverTip}>
                  <i className="fa-solid fa-check-circle" /> 库存充足，可免费换购此商品
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}><i className="fa-solid fa-boxes-stacked" style={{ color: '#00875A' }} /> 我的仓库库存</div>
                <button className={styles.panelMore} type="button" onClick={onOpenExchange}>
                  选择抵扣
                </button>
              </div>
              <div className={styles.inventorySummary}>
                共 {warehouseItems.length} 件可用库存，总价值 <strong>¥{formatPriceNumber(inventoryTotalValue)}</strong>
              </div>
              <div className={styles.inventoryList}>
                {inventoryPreview.map((item: WarehouseItem) => (
                  <div className={styles.inventoryItem} key={item.id}>
                    <img src={item.productImg || product.img} alt={item.productName} />
                    <div className={styles.inventoryInfo}>
                      <div className={styles.inventoryName}>{item.productName}</div>
                      <div className={styles.inventoryMeta}>来源：{item.sourceType}</div>
                    </div>
                    <span className={styles.inventoryPrice}>¥{Number(item.price ?? 0)}</span>
                  </div>
                ))}
                {warehouseItems.length === 0 ? <div className={styles.directRow}>当前没有可用于换购的同款库存。</div> : null}
              </div>
              {warehouseItems.length > 3 ? (
                <button className={styles.inventoryMore} type="button" onClick={onOpenExchange}>
                  查看全部 {warehouseItems.length} 件 <i className="fa-solid fa-chevron-right" />
                </button>
              ) : null}
              <div className={styles.planBanner}>
                <div className={styles.planIcon}>💡</div>
                <div className={styles.planBody}>
                  <div className={styles.planTitle}>推荐方案</div>
                  <div className={styles.planDesc}>
                    选择 {warehouseItems.length} 件库存（价值 ¥{formatPriceNumber(inventoryTotalValue)}）
                    {inventoryTotalValue >= directPrice ? '，可完全覆盖' : `，需补差价 ¥${exchangeToPay}`}
                  </div>
                </div>
                <button className={styles.planCta} type="button" onClick={onOpenExchange}>
                  去选择
                </button>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelInner}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <i className="fa-solid fa-list-ol" style={{ color: '#00875A' }} /> 换购流程
                </div>
              </div>
              <div className={styles.flowSteps}>
                {['选择抵扣', '确认价格', '下单发货'].map((item, index) => (
                  <div className={styles.flowStep} key={item}>
                    <div className={styles.flowNum}>{index + 1}</div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {activeGuess ? (
                <div className={styles.flowLeadRow}>
                  库存不够？ <button type="button" onClick={() => onChangeTab('guess')}>去竞猜赚库存</button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      <ProductDetailInfoPanel
        product={product}
        detailExpanded={detailExpanded}
        onToggleDetailExpanded={onToggleDetailExpanded}
      />

      {product.shopId ? (
        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.shopCard}>
              {product.shopLogo ? (
                <img className={styles.shopLogo} src={product.shopLogo} alt={product.shopName || '店铺'} />
              ) : (
                <div className={`${styles.shopLogo} ${styles.shopLogoFallback}`}>
                  {(product.shopName || '店').slice(0, 1)}
                </div>
              )}
              <div className={styles.shopMeta}>
                <div className={styles.shopName}>{product.shopName || '官方店铺'}</div>
                <div className={styles.shopStats}>
                  <span><strong>{shopStats?.fans ?? 0}</strong>粉丝</span>
                  <span><strong>{shopStats?.productCount ?? 0}</strong>商品</span>
                  <span>评分 <strong>{(shopStats?.avgRating ?? 0).toFixed(1)}</strong></span>
                </div>
              </div>
              <div className={styles.shopActions}>
                {product.shopUserId ? (
                  <button
                    className={`${styles.shopFollowBtn} ${shopFollowing ? styles.shopFollowBtnActive : ''}`}
                    type="button"
                    disabled={shopFollowBusy}
                    onClick={onToggleShopFollow}
                  >
                    {shopFollowing ? '已关注' : '+ 关注'}
                  </button>
                ) : null}
                <Link className={styles.shopVisitBtn} href={`/shop/${product.shopId}`}>
                  进店
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}><i className="fa-solid fa-comment-dots" style={{ color: '#FFB400' }} /> 用户评价 <span>({reviewCount})</span></div>
            <button className={styles.panelMore} type="button" onClick={onViewAllReviews}>
              全部 <i className="fa-solid fa-chevron-right" style={{ fontSize: 8 }} />
            </button>
          </div>
          {reviews.length ? reviews.map((review) => (
            <div className={styles.reviewItem} key={review.id}>
              <img src={review.userAvatar || product.img} alt={review.userName} />
              <div className={styles.reviewBody}>
                <div className={styles.reviewName}>
                  {review.userName}
                  <span className={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(Math.max(0, 5 - review.rating))}</span>
                </div>
                <div className={styles.reviewText}>{review.content || '该用户未填写评价内容。'}</div>
                {review.images.length ? (
                  <div className={styles.reviewImages}>
                    {review.images.slice(0, 4).map((src, index) => (
                      <img className={styles.reviewImage} src={src} alt={`晒图 ${index + 1}`} key={`${src}-${index}`} />
                    ))}
                  </div>
                ) : null}
                {review.appendedContent ? (
                  <div className={styles.reviewAppend}>
                    <strong>追评</strong>{review.appendedContent}
                    {review.appendedImages.length ? (
                      <div className={styles.reviewImages}>
                        {review.appendedImages.slice(0, 4).map((src, index) => (
                          <img className={styles.reviewImage} src={src} alt={`追评图 ${index + 1}`} key={`${src}-${index}`} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {review.reply ? (
                  <div className={styles.reviewReply}>
                    <strong>店铺回复</strong>{review.reply}
                  </div>
                ) : null}
                <div className={styles.reviewFoot}>
                  <span>{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                  <button
                    className={`${styles.reviewLike} ${review.helpfulVoted ? styles.reviewLikeActive : ''}`}
                    type="button"
                    onClick={() => onToggleReviewHelpful(review.id)}
                  >
                    <i className={`fa-${review.helpfulVoted ? 'solid' : 'regular'} fa-heart`} />{' '}
                    {review.helpfulCount > 0 ? review.helpfulCount : '有用'}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className={styles.directRow}>暂无用户评价。</div>
          )}
        </div>
      </div>

      {sameShopProducts.length > 0 ? (
        <div className={styles.panel}>
          <div className={styles.recommendTitle}>
            <i className="fa-solid fa-store" style={{ color: '#4e6ae6' }} /> 同店推荐
            {product.shopName ? <span style={{ marginLeft: 6, fontSize: 11, color: '#999' }}>{product.shopName}</span> : null}
          </div>
          <div className={styles.recommendGrid}>
            {sameShopProducts.map((item) => (
              <Link className={styles.recommendItem} href={`/product/${item.id}`} key={item.id}>
                <img className={styles.recommendImg} src={item.img} alt={item.name} />
                <div className={styles.recommendName}>{item.name}</div>
                <div className={styles.recommendPrice}>¥{item.price}</div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className={styles.panel}>
          <div className={styles.recommendTitle}><i className="fa-solid fa-fire" style={{ color: '#ff6b35' }} /> 猜你喜欢</div>
          <div className={styles.recommendGrid}>
            {recommendations.map((item) => (
              <Link className={styles.recommendItem} href={`/product/${item.id}`} key={item.id}>
                <img className={styles.recommendImg} src={item.img} alt={item.name} />
                <div className={styles.recommendName}>{item.name}</div>
                <div className={styles.recommendPrice}>¥{item.price}</div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type ProductDetailInfoPanelProps = {
  product: ProductDetailData;
  detailExpanded: boolean;
  onToggleDetailExpanded: () => void;
};

function ProductDetailInfoPanel({
  product,
  detailExpanded,
  onToggleDetailExpanded,
}: ProductDetailInfoPanelProps) {
  const tabs = useMemo(() => {
    const list: { key: DetailTabKey; label: string }[] = [];
    list.push({ key: 'detail', label: '商品详情' });
    if (product.specTable.length > 0) {
      list.push({ key: 'spec', label: '参数' });
    }
    if (product.packageList.length > 0) {
      list.push({ key: 'package', label: '包装清单' });
    }
    return list;
  }, [product.specTable.length, product.packageList.length]);
  const [activeTab, setActiveTab] = useState<DetailTabKey>('detail');

  return (
    <div className={styles.panel}>
      <div className={styles.panelInner}>
        <div className={styles.panelHead}>
          <div className={styles.panelTitle}>
            <i className="fa-solid fa-file-lines" style={{ color: '#999' }} /> 商品详情
          </div>
        </div>
        {tabs.length > 1 ? (
          <div className={styles.detailTabs}>
            {tabs.map((tab) => (
              <button
                className={`${styles.detailTab} ${activeTab === tab.key ? styles.detailTabActive : ''}`}
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {activeTab === 'detail' ? (
          product.detailHtml ? (
            <div
              className={styles.detailHtml}
              dangerouslySetInnerHTML={{ __html: product.detailHtml }}
            />
          ) : (
            <>
              <div className={`${styles.detailText} ${detailExpanded ? styles.detailExpanded : ''}`}>
                {`${product.description}

• 品牌：${product.brand}
• 分类：${product.category}
• 店铺：${product.shopName || '优米平台'}
• 库存：${product.stock}
• 标签：${product.tags.length ? product.tags.join(' / ') : '暂无标签'}
`}
              </div>
              <button className={styles.detailToggle} type="button" onClick={onToggleDetailExpanded}>
                {detailExpanded ? '收起' : '展开全部'}{' '}
                <span>
                  <i className={`fa-solid ${detailExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                </span>
              </button>
            </>
          )
        ) : null}

        {activeTab === 'spec' ? (
          <div className={styles.specTable}>
            {product.specTable.map((row) => (
              <div className={styles.specTableRow} key={row.key}>
                <span className={styles.specTableKey}>{row.key}</span>
                <span className={styles.specTableValue}>{row.value || '-'}</span>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === 'package' ? (
          <ul className={styles.packageList}>
            {product.packageList.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
