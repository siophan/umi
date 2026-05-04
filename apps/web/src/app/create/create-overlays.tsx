'use client';

import type { Dispatch, SetStateAction, UIEvent } from 'react';

import type { CategoryId, ProductCategoryItem } from '@umi/shared';

import {
  formatSalesLabel,
  getDiscountPercent,
  templates,
  type ProductItem,
  type TemplateId,
} from './create-helpers';
import styles from './page.module.css';

type Props = {
  previewOpen: boolean;
  setPreviewOpen: Dispatch<SetStateAction<boolean>>;
  template: TemplateId;
  title: string;
  desc: string;
  deadline: string;
  selectedProduct: ProductItem | null;
  options: string[];
  handlePublish: () => void;
  productPickerOpen: boolean;
  closeProductPicker: () => void;
  productKeyword: string;
  setProductKeyword: Dispatch<SetStateAction<string>>;
  productCategoryItems: ProductCategoryItem[];
  productCategoryId: CategoryId | null;
  setProductCategoryId: (value: CategoryId | null) => void;
  sortDropdownOpen: boolean;
  setSortDropdownOpen: Dispatch<SetStateAction<boolean>>;
  sortLabel: string;
  productSort: 'default' | 'sales' | 'price_asc' | 'rating';
  setProductSort: Dispatch<SetStateAction<'default' | 'sales' | 'price_asc' | 'rating'>>;
  productItems: ProductItem[];
  productTotalCount: number;
  productLoading: boolean;
  productLoadingMore: boolean;
  productHasMore: boolean;
  loadMoreProducts: () => void;
  tempProduct: ProductItem | null;
  tempProductId: string | null;
  setTempProductId: Dispatch<SetStateAction<string | null>>;
  confirmProductPick: () => void;
  copyInviteLink: () => void;
  shareVia: () => void | Promise<void>;
  publishing: boolean;
  publishStep: number;
  successOpen: boolean;
  setSuccessOpen: Dispatch<SetStateAction<boolean>>;
  routerPushHome: () => void;
};

export function CreateOverlays({
  previewOpen,
  setPreviewOpen,
  template,
  title,
  desc,
  deadline,
  selectedProduct,
  options,
  handlePublish,
  productPickerOpen,
  closeProductPicker,
  productKeyword,
  setProductKeyword,
  productCategoryItems,
  productCategoryId,
  setProductCategoryId,
  sortDropdownOpen,
  setSortDropdownOpen,
  sortLabel,
  productSort,
  setProductSort,
  productItems,
  productTotalCount,
  productLoading,
  productLoadingMore,
  productHasMore,
  loadMoreProducts,
  tempProduct,
  tempProductId,
  setTempProductId,
  confirmProductPick,
  copyInviteLink,
  shareVia,
  publishing,
  publishStep,
  successOpen,
  setSuccessOpen,
  routerPushHome,
}: Props) {
  const publishFinished = publishStep >= 3;

  return (
    <>
      {previewOpen ? (
        <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.previewCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>竞猜预览</div>
              <button className={styles.previewClose} type="button" onClick={() => setPreviewOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewHero}>
                <div className={styles.previewTemplateMeta}>
                  竞猜模板: <b>{templates.find((item) => item.id === template)?.name ?? '二选一'}</b>
                </div>
                <div className={styles.previewGuessTitle}>{title || '未填写标题'}</div>
                {desc ? <div className={styles.previewGuessDesc}>{desc}</div> : null}
                {deadline ? (
                  <div className={styles.previewMeta}>
                    <i className="fa-regular fa-clock" /> 开奖: {new Date(deadline).toLocaleString('zh-CN')}
                  </div>
                ) : null}
              </div>

              {selectedProduct ? (
                <div className={styles.previewProduct}>
                  <img src={selectedProduct.img} alt={selectedProduct.name} />
                  <div className={styles.previewProductInfo}>
                    <div className={styles.previewProductName}>{selectedProduct.name}</div>
                    <div className={styles.previewProductPrice}>¥{selectedProduct.guessPrice}</div>
                  </div>
                </div>
              ) : null}

              {options.filter(Boolean).length ? (
                <>
                  <div className={styles.previewOptionsLabel}>竞猜选项:</div>
                  <div className={styles.previewOptions}>
                    {options.filter(Boolean).map((item, index) => (
                      <div key={item} className={styles.previewOption}>
                        <div className={styles.previewOptionBadge}>{String.fromCharCode(65 + index)}</div>
                        <div className={styles.previewOptionText}>{item}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {!title.trim() || title.trim().length < 5 || options.filter((item) => item.trim()).length < 2 || !deadline ? (
                <div className={styles.previewWarnings}>
                  <div className={styles.previewWarningsTitle}>以下项目需要完善：</div>
                  {!title.trim() || title.trim().length < 5 ? <div className={styles.previewWarning}>⚠️ 标题至少5个字</div> : null}
                  {options.filter((item) => item.trim()).length < 2 ? <div className={styles.previewWarning}>⚠️ 至少需要2个选项</div> : null}
                  {!deadline ? <div className={styles.previewWarning}>⚠️ 未设置开奖时间</div> : null}
                </div>
              ) : null}
            </div>
            <div className={styles.previewFooter}>
              <button className={styles.previewOutline} type="button" onClick={() => setPreviewOpen(false)}>
                继续编辑
              </button>
              <button
                className={styles.previewPrimary}
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  handlePublish();
                }}
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productPickerOpen ? (
        <div className={styles.productPickerOverlay} onClick={closeProductPicker}>
          <div className={styles.productPicker} onClick={(event) => event.stopPropagation()}>
            <div className={styles.ppDragBar} />
            <div className={styles.ppHeader}>
              <div className={styles.ppTitle}>
                <div className={styles.ppTitleIcon}>
                  <i className="fa-solid fa-box-open" />
                </div>
                选择关联商品
                <span className={styles.ppCount}>{productTotalCount}件</span>
              </div>
              <button className={styles.ppClose} type="button" onClick={closeProductPicker}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.ppSearch}>
              <i className="fa-solid fa-magnifying-glass" />
              <input placeholder="搜索商品名称/品牌..." value={productKeyword} onChange={(event) => setProductKeyword(event.target.value)} />
              {productKeyword ? (
                <button className={styles.ppSearchClear} type="button" onClick={() => setProductKeyword('')}>
                  <i className="fa-solid fa-xmark" />
                </button>
              ) : null}
            </div>
            <div className={styles.ppToolbar}>
              <div className={styles.ppCats}>
                <button
                  type="button"
                  className={`${styles.ppCat} ${productCategoryId === null ? styles.ppCatOn : ''}`}
                  onClick={() => setProductCategoryId(null)}
                >
                  全部
                </button>
                {productCategoryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.ppCat} ${productCategoryId === item.id ? styles.ppCatOn : ''}`}
                    onClick={() => setProductCategoryId(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className={styles.ppSortWrap} data-create-sort-wrap="true">
                <button className={`${styles.ppSortBtn} ${sortDropdownOpen ? styles.ppSortBtnOpen : ''}`} type="button" onClick={() => setSortDropdownOpen((value) => !value)}>
                  <span>{sortLabel}</span>
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {sortDropdownOpen ? (
                  <div className={styles.ppSortDropdown}>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'default' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('default'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-fire" /> 综合排序
                    </button>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'sales' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('sales'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-chart-line" /> 销量优先
                    </button>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'price_asc' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('price_asc'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-arrow-up-short-wide" /> 价格低→高
                    </button>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'rating' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('rating'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-star" /> 好评优先
                    </button>
                  </div>
                ) : null}
                <span className={styles.ppResultCount}>{productTotalCount}件商品</span>
              </div>
            </div>
            {tempProduct ? (
              <div className={`${styles.ppSelected} ${styles.ppSelectedShow}`}>
                <div className={styles.ppSelectedLabel}>
                  <i className="fa-solid fa-circle-check" /> 已选商品
                </div>
                <div className={styles.ppSelectedCard}>
                  <img src={tempProduct.img} alt={tempProduct.name} />
                  <div className={styles.ppSelInfo}>
                    <div className={styles.ppSelName}>{tempProduct.name}</div>
                    <div className={styles.ppSelBrand}>{tempProduct.shopName ?? tempProduct.brand}</div>
                    <div className={styles.ppSelPriceRow}>
                      <span className={styles.ppSelPrice}>
                        <small>¥</small>
                        {tempProduct.guessPrice}
                      </span>
                      {tempProduct.originalPrice > tempProduct.guessPrice ? <span className={styles.ppSelOrig}>¥{tempProduct.originalPrice}</span> : null}
                      {getDiscountPercent(tempProduct) >= 10 ? <span className={styles.ppSelDiscount}>省{getDiscountPercent(tempProduct)}%</span> : null}
                    </div>
                    <div className={styles.ppSelMeta}>
                      <span className={styles.ppSelMetaItem}>
                        <i className="fa-solid fa-fire" /> {formatSalesLabel(tempProduct.sales)}已售
                      </span>
                      <span className={styles.ppSelMetaItem}>
                        <i className="fa-solid fa-star" /> {tempProduct.rating.toFixed(1)}分
                      </span>
                      {tempProduct.stock ? (
                        <span className={styles.ppSelMetaItem}>
                          <i className="fa-solid fa-box" /> 库存{tempProduct.stock}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button className={styles.ppsRemove} type="button" onClick={() => setTempProductId(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              </div>
            ) : null}
            {productLoading && productItems.length === 0 ? (
              <div className={styles.ppLoading}>
                <i className="fa-solid fa-spinner fa-spin" /> 加载中...
              </div>
            ) : productItems.length ? (
              <div
                className={styles.ppGrid}
                onScroll={(event: UIEvent<HTMLDivElement>) => {
                  if (!productHasMore || productLoadingMore) return;
                  const target = event.currentTarget;
                  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 80) {
                    loadMoreProducts();
                  }
                }}
              >
                {productItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.ppItem} ${tempProductId === item.id ? styles.ppItemSelected : ''}`}
                    onClick={() => setTempProductId((current) => (current === item.id ? null : item.id))}
                  >
                    <div className={styles.ppItemImg}>
                      <img src={item.img} alt={item.name} />
                      {getDiscountPercent(item) >= 10 ? <div className={styles.ppItemDiscount}>省{getDiscountPercent(item)}%</div> : null}
                    </div>
                    <div className={styles.ppInfo}>
                      <div className={styles.ppName}>{item.name}</div>
                      <div className={styles.ppBrand}>
                        <span className={styles.ppBrandDot} />
                        {item.brand}
                      </div>
                      <div className={styles.ppPriceRow}>
                        <span className={styles.ppPrice}>
                          <small>¥</small>
                          {item.guessPrice}
                        </span>
                        {item.originalPrice > item.guessPrice ? <span className={styles.ppOrigPrice}>¥{item.originalPrice}</span> : null}
                      </div>
                      <div className={styles.ppMetaRow}>
                        <span className={`${styles.ppSales} ${item.sales >= 5000 ? styles.ppSalesHot : ''}`}>{formatSalesLabel(item.sales)}已售</span>
                        <span className={styles.ppRatingNum}>{item.rating.toFixed(1)}分</span>
                      </div>
                    </div>
                  </button>
                ))}
                {productLoadingMore ? (
                  <div className={styles.ppLoadingMore}>
                    <i className="fa-solid fa-spinner fa-spin" /> 加载中...
                  </div>
                ) : null}
                {!productHasMore && productItems.length > 0 ? (
                  <div className={styles.ppListEnd}>没有更多了</div>
                ) : null}
              </div>
            ) : (
              <div className={styles.ppEmpty}>
                <i className="fa-regular fa-face-meh-blank" />
                <div>未找到相关商品</div>
                <div className={styles.ppEmptyHint}>试试更换关键词或分类</div>
              </div>
            )}
            <div className={styles.ppFooter}>
              <div className={styles.ppFooterInfo}>
                {tempProduct ? (
                  <>
                    已选 <span className={styles.ppfCount}>1</span> 件 · <span className={styles.ppfLabel}>¥{tempProduct.guessPrice}</span>
                  </>
                ) : (
                  <span className={styles.ppfLabel}>请选择一件关联商品</span>
                )}
              </div>
              <button className={styles.ppFooterBtnOutline} type="button" onClick={closeProductPicker}>
                取消
              </button>
              <button className={styles.ppFooterBtnPrimary} type="button" onClick={confirmProductPick}>
                确认选择
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publishing ? (
        <div className={styles.publishOverlay}>
          <div className={styles.publishCard}>
            <div className={styles.publishIcon}>{publishFinished ? '🎉' : '⏳'}</div>
            <div className={styles.publishTitle}>{publishFinished ? '发布成功！' : '正在发布竞猜...'}</div>
            <div className={styles.publishDesc}>{publishFinished ? '竞猜已创建，快去分享给好友吧' : '请稍候，正在提交您的竞猜'}</div>
            <div className={styles.publishBar}>
              <div className={styles.publishFill} style={{ width: `${(publishStep / 3) * 100}%` }} />
            </div>
            <div className={styles.publishSteps}>
              <div className={`${styles.publishStep} ${publishStep >= 1 ? styles.publishStepActive : ''} ${publishStep >= 1 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 1 ? 'solid' : 'regular'} fa-circle`} /> 验证竞猜信息
              </div>
              <div className={`${styles.publishStep} ${publishStep >= 2 ? styles.publishStepActive : ''} ${publishStep >= 2 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 2 ? 'solid' : 'regular'} fa-circle`} /> 上传竞猜数据
              </div>
              <div className={`${styles.publishStep} ${publishStep >= 3 ? styles.publishStepActive : ''} ${publishStep >= 3 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 3 ? 'solid' : 'regular'} fa-circle`} /> 发布竞猜
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className={styles.successOverlay} onClick={() => setSuccessOpen(false)}>
          <div className={styles.successCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.successEmoji}>🎉</div>
            <div className={styles.successTitle}>竞猜创建成功！</div>
            <div className={styles.successDesc}>
              {selectedProduct ? `📦 关联: ${selectedProduct.name}` : '你的竞猜已发布，快分享给好友吧'}
            </div>
            <div className={styles.successActions}>
              <button type="button" className={styles.successAction} onClick={copyInviteLink}>
                <div className={styles.successActionIcon}>
                  <i className="fa-solid fa-link" />
                </div>
                <div>复制链接</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => shareVia()}>
                <div className={`${styles.successActionIcon} ${styles.successActionWechat}`}>
                  <i className="fa-brands fa-weixin" />
                </div>
                <div>微信</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => shareVia()}>
                <div className={`${styles.successActionIcon} ${styles.successActionMoments}`}>
                  <i className="fa-solid fa-users" />
                </div>
                <div>猜友圈</div>
              </button>
              <button
                type="button"
                className={`${styles.successAction} ${styles.successActionDisabled}`}
                disabled
                aria-disabled="true"
              >
                <div className={styles.successActionIcon}>
                  <i className="fa-solid fa-image" />
                </div>
                <div>海报</div>
                <span className={styles.successActionBadge}>未开放</span>
              </button>
            </div>
            <button className={styles.successPrimary} type="button" onClick={routerPushHome}>
              返回首页
            </button>
            <button className={styles.successGhost} type="button" onClick={routerPushHome}>
              稍后再说
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
