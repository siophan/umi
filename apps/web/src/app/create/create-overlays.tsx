'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  formatSalesLabel,
  getDiscountPercent,
  templates,
  type FriendItem,
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
  productCategories: string[];
  productCategory: string;
  setProductCategory: Dispatch<SetStateAction<string>>;
  sortDropdownOpen: boolean;
  setSortDropdownOpen: Dispatch<SetStateAction<boolean>>;
  sortLabel: string;
  productSort: 'default' | 'sales' | 'price_asc' | 'rating';
  setProductSort: Dispatch<SetStateAction<'default' | 'sales' | 'price_asc' | 'rating'>>;
  filteredProducts: ProductItem[];
  productTotalCount: number;
  tempProduct: ProductItem | null;
  tempProductId: string | null;
  setTempProductId: Dispatch<SetStateAction<string | null>>;
  confirmProductPick: () => void;
  shareOpen: boolean;
  setShareOpen: Dispatch<SetStateAction<boolean>>;
  selectedFriendList: FriendItem[];
  currentUser: { name: string; avatar?: string | null } | null;
  inviteLink: string;
  linkCopied: boolean;
  copyInviteLink: () => void;
  shareVia: (channel: 'wechat' | 'qq' | 'moments' | 'poster') => void | Promise<void>;
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
  productCategories,
  productCategory,
  setProductCategory,
  sortDropdownOpen,
  setSortDropdownOpen,
  sortLabel,
  productSort,
  setProductSort,
  filteredProducts,
  productTotalCount,
  tempProduct,
  tempProductId,
  setTempProductId,
  confirmProductPick,
  shareOpen,
  setShareOpen,
  selectedFriendList,
  currentUser,
  inviteLink,
  linkCopied,
  copyInviteLink,
  shareVia,
  publishing,
  publishStep,
  successOpen,
  setSuccessOpen,
  routerPushHome,
}: Props) {
  const inviteDeadlineText = deadline
    ? new Date(deadline).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未设定';
  const publishFinished = publishStep >= 3;

  function renderFriendAvatar(friend: FriendItem, className: string) {
    if (friend.avatar) {
      return <img className={className} src={friend.avatar} alt={friend.name} />;
    }
    return <span className={className}>{friend.name.slice(0, 1) || '友'}</span>;
  }

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
                    <div className={styles.previewProductPrice}>¥{selectedProduct.price}</div>
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
                {productCategories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.ppCat} ${productCategory === item ? styles.ppCatOn : ''}`}
                    onClick={() => setProductCategory(item)}
                  >
                    {item === 'all' ? '全部' : item}
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
                <span className={styles.ppResultCount}>{filteredProducts.length}件商品</span>
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
                        {tempProduct.price}
                      </span>
                      {tempProduct.originalPrice > tempProduct.price ? <span className={styles.ppSelOrig}>¥{tempProduct.originalPrice}</span> : null}
                      {getDiscountPercent(tempProduct) >= 10 ? <span className={styles.ppSelDiscount}>省{getDiscountPercent(tempProduct)}%</span> : null}
                    </div>
                    <div className={styles.ppSelMeta}>
                      <span className={styles.ppSelMetaItem}>
                        <i className="fa-solid fa-fire" /> {formatSalesLabel(tempProduct.sales)}已售
                      </span>
                      <span className={styles.ppSelMetaItem}>
                        <i className="fa-solid fa-star" /> {tempProduct.rating}分
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
            {filteredProducts.length ? (
              <div className={styles.ppGrid}>
                {filteredProducts.map((item) => (
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
                          {item.price}
                        </span>
                        {item.originalPrice > item.price ? <span className={styles.ppOrigPrice}>¥{item.originalPrice}</span> : null}
                      </div>
                      <div className={styles.ppMetaRow}>
                        <span className={`${styles.ppSales} ${Number.parseFloat(item.sales) >= 5000 ? styles.ppSalesHot : ''}`}>{formatSalesLabel(item.sales)}已售</span>
                        <span className={styles.ppRatingNum}>{item.rating}分</span>
                      </div>
                    </div>
                  </button>
                ))}
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
                    已选 <span className={styles.ppfCount}>1</span> 件 · <span className={styles.ppfLabel}>¥{tempProduct.price}</span>
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

      {shareOpen ? (
        <div className={styles.shareOverlay} onClick={() => setShareOpen(false)}>
          <div className={styles.shareModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.shareDrag} />
            <div className={styles.shareHeader}>
              <div className={styles.shareTitle}>📤 邀请好友参战</div>
              <button className={styles.shareClose} type="button" onClick={() => setShareOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.linkCard}>
              <div className={styles.linkLabel}>
                <i className="fa-solid fa-link" /> 邀请链接
              </div>
              <div className={styles.linkRow}>
                <input className={styles.linkInput} readOnly value={inviteLink} />
                <button className={`${styles.linkCopy} ${linkCopied ? styles.linkCopyDone : ''}`} type="button" onClick={copyInviteLink}>
                  {linkCopied ? '✓ 已复制' : '复制链接'}
                </button>
              </div>
              <div className={styles.linkStats}>
                <div>
                  <i className="fa-solid fa-user-plus" /> 已邀 <b>{selectedFriendList.length}</b> 人
                </div>
              </div>
            </div>
            {selectedFriendList.length ? (
              <div className={styles.shareFriends}>
                <div className={styles.shareFriendsTitle}>
                  <i className="fa-solid fa-check-circle" /> 已选好友将收到邀请
                  <span>{selectedFriendList.length}人</span>
                </div>
                <div className={styles.shareFriendsList}>
                  {selectedFriendList.map((friend) => (
                    <div key={friend.id} className={styles.shareFriendChip}>
                      {renderFriendAvatar(friend, styles.shareFriendAvatar)}
                      <span>{friend.name}</span>
                      <span className={`${styles.shareStatusDot} ${friend.online ? styles.shareStatusOn : styles.shareStatusOff}`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={styles.shareMethods}>
              <button type="button" className={styles.shareMethod} onClick={() => shareVia('wechat')}>
                <div className={`${styles.shareMethodIcon} ${styles.shareMethodWechat}`}>
                  <i className="fa-brands fa-weixin" />
                </div>
                <div className={styles.shareMethodLabel}>微信好友</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => shareVia('qq')}>
                <div className={`${styles.shareMethodIcon} ${styles.shareMethodQq}`}>
                  <i className="fa-brands fa-qq" />
                </div>
                <div className={styles.shareMethodLabel}>QQ好友</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => shareVia('moments')}>
                <div className={`${styles.shareMethodIcon} ${styles.shareMethodMoments}`}>
                  <i className="fa-solid fa-users" />
                </div>
                <div className={styles.shareMethodLabel}>猜友圈</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => shareVia('poster')}>
                <div className={styles.shareMethodIcon}>
                  <i className="fa-solid fa-image" />
                </div>
                <div className={styles.shareMethodLabel}>生成海报</div>
              </button>
            </div>
            <div className={styles.invitePreview}>
              <div className={styles.invitePreviewTitle}>
                <i className="fa-solid fa-eye" /> 好友收到的邀请卡片
              </div>
              <div className={styles.invitePreviewCard}>
                <div className={styles.invitePreviewHead}>
                  <div className={styles.invitePreviewUser}>
                    {currentUser?.avatar ? (
                      <img className={styles.invitePreviewAvatar} src={currentUser.avatar} alt={currentUser.name} />
                    ) : (
                      <span className={styles.invitePreviewAvatarFallback}>{currentUser?.name.slice(0, 1) || '我'}</span>
                    )}
                    <div>
                      <div className={styles.invitePreviewName}>{currentUser?.name || '发起人'}</div>
                      <div className={styles.invitePreviewSub}>邀请你参加好友PK</div>
                    </div>
                  </div>
                  <div className={styles.invitePreviewMainTitle}>
                    <i className="fa-solid fa-bolt" /> {title.trim() || '好友PK竞猜'}
                  </div>
                </div>
                <div className={styles.invitePreviewVs}>
                  <div className={`${styles.invitePreviewOption} ${styles.invitePreviewOptionA}`}>{options.find((item) => item.trim()) || '选项A'}</div>
                  <div className={styles.invitePreviewVsBadge}>VS</div>
                  <div className={`${styles.invitePreviewOption} ${styles.invitePreviewOptionB}`}>
                    {options.filter((item) => item.trim())[1] || '选项B'}
                  </div>
                </div>
                <div className={styles.invitePreviewFooter}>
                  <div className={styles.invitePreviewMeta}>
                    <span>
                      <i className="fa-regular fa-clock" /> {inviteDeadlineText}
                    </span>
                    <span>
                      <i className="fa-solid fa-user-group" />{' '}
                      {selectedFriendList.length ? `${selectedFriendList.length}人参战` : '等你加入'}
                    </span>
                  </div>
                  <div className={styles.invitePreviewJoin}>⚔️ 点击参战</div>
                </div>
              </div>
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
              <button type="button" className={styles.successAction} onClick={() => shareVia('wechat')}>
                <div className={`${styles.successActionIcon} ${styles.successActionWechat}`}>
                  <i className="fa-brands fa-weixin" />
                </div>
                <div>微信</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => shareVia('moments')}>
                <div className={`${styles.successActionIcon} ${styles.successActionMoments}`}>
                  <i className="fa-solid fa-users" />
                </div>
                <div>猜友圈</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => shareVia('poster')}>
                <div className={styles.successActionIcon}>
                  <i className="fa-solid fa-image" />
                </div>
                <div>海报</div>
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
