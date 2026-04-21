'use client';

import Link from 'next/link';
import type { CouponListItem, GuessOption, ProductDetailResult, ProductSummary, WarehouseItem } from '@umi/shared';

import type { ActiveGuessDetail, ProductDetailData, ProductMode } from './product-detail-helpers';
import { formatPriceNumber } from './product-detail-helpers';
import styles from './page.module.css';

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
  reviews: ProductDetailResult['reviews'];
  coupons: CouponListItem[];
  currentTab: ProductMode;
  directPrice: number;
  guessPrice: number;
  selectedGuessOpt: number;
  detailExpanded: boolean;
  selectedDeduct: number;
  exchangeToPay: number;
  remainingSlots: number;
  guessTotalVotes: number;
  guessPercent: number;
  reviewCount: number;
  guessCountdown: GuessCountdown | null;
  onChangeTab: (tab: ProductMode) => void;
  onSelectGuessOption: (index: number) => void;
  onOpenExchange: () => void;
  onToggleDetailExpanded: () => void;
  onOpenToast: (message: string) => void;
};

export function ProductDetailBody({
  product,
  activeGuess,
  warehouseItems,
  inventoryPreview,
  inventoryTotalValue,
  recommendations,
  reviews,
  coupons,
  currentTab,
  directPrice,
  guessPrice,
  selectedGuessOpt,
  detailExpanded,
  selectedDeduct,
  exchangeToPay,
  remainingSlots,
  guessTotalVotes,
  guessPercent,
  reviewCount,
  guessCountdown,
  onChangeTab,
  onSelectGuessOption,
  onOpenExchange,
  onToggleDetailExpanded,
  onOpenToast,
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
                  剩余 <strong>{remainingSlots}</strong> 个名额
                </div>
              </div>
              <div className={styles.ringSection}>
                <div className={styles.ringWrap}>
                  <div className={styles.ringInner}>
                    <span className={styles.ringPct}>{guessPercent}%</span>
                    <span className={styles.ringLabel}>已满</span>
                  </div>
                </div>
                <div className={styles.ringInfo}>
                  <div className={styles.ringStat}>
                    <strong>{guessTotalVotes}</strong>
                    <span>/50 人</span>
                  </div>
                  <div className={styles.ringStatLabel}>已参与人数</div>
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
              <button className={styles.guessMore} type="button" onClick={() => onOpenToast('查看全部')}>
                查看更多 <i className="fa-solid fa-chevron-down" />
              </button>
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
                    <strong>{coupon.type === 'shipping' ? '包邮' : `¥${coupon.amount}`}</strong>
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
              <div className={styles.serviceGrid}>
                {[
                  '服务能力以下单页为准',
                  '发货时效以店铺说明为准',
                  '售后规则以下单结果为准',
                ].map((item) => (
                  <div className={styles.serviceItem} key={item}>
                    <span><i className="fa-solid fa-check" /></span>
                    <em>{item}</em>
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

      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}><i className="fa-solid fa-file-lines" style={{ color: '#999' }} /> 商品详情</div>
          </div>
          <div className={`${styles.detailText} ${detailExpanded ? styles.detailExpanded : ''}`}>
            {`${product.description}

• 品牌：${product.brand}
• 分类：${product.category}
• 店铺：${product.shopName || '优米平台'}
• 库存：${product.stock}
• 标签：${product.tags.length ? product.tags.join(' / ') : '暂无标签'}
• 发货与售后：以真实订单和店铺说明为准
`}
          </div>
          <button className={styles.detailToggle} type="button" onClick={onToggleDetailExpanded}>
            {detailExpanded ? '收起' : '展开全部'} <span><i className={`fa-solid ${detailExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></span>
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}><i className="fa-solid fa-comment-dots" style={{ color: '#FFB400' }} /> 用户评价 <span>({reviewCount})</span></div>
            <button className={styles.panelMore} type="button" onClick={() => onOpenToast('查看全部评价')}>
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
                <div className={styles.reviewFoot}>
                  <span>{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className={styles.directRow}>暂无用户评价。</div>
          )}
        </div>
      </div>

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
    </section>
  );
}
