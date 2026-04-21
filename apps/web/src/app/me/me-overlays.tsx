'use client';

import type { UserSearchItem } from '@umi/shared';

import { buildSearchItemDesc, getSearchRelationLabel } from './me-helpers';
import styles from './page.module.css';

type SearchSection = {
  title: string;
  items: UserSearchItem[];
};

type CurrentUser = {
  name: string;
  phone: string;
  avatar: string;
};

type Summary = {
  activeOrderCount: number;
  warehouseItemCount: number;
  availableCouponCount: number;
};

type MeOverlaysProps = {
  settingsOpen: boolean;
  searchOpen: boolean;
  shopModalOpen: boolean;
  loggingOut: boolean;
  searchLoading: boolean;
  searchValue: string;
  searchSections: SearchSection[];
  currentUser: CurrentUser;
  summary: Summary;
  onCloseSettings: () => void;
  onCloseSearch: () => void;
  onCloseShopModal: () => void;
  onChangeSearchValue: (value: string) => void;
  onPickSearchQuick: (value: string) => void;
  onOpenUser: (uid: string, id: string) => void;
  onOpenEditProfile: () => void;
  onOpenOrders: () => void;
  onOpenAddress: () => void;
  onOpenCoupons: () => void;
  onShowToast: (message: string) => void;
  onLogout: () => void;
  onSubmitShopApply: () => void;
};

export function MeOverlays({
  settingsOpen,
  searchOpen,
  shopModalOpen,
  loggingOut,
  searchLoading,
  searchValue,
  searchSections,
  currentUser,
  summary,
  onCloseSettings,
  onCloseSearch,
  onCloseShopModal,
  onChangeSearchValue,
  onPickSearchQuick,
  onOpenUser,
  onOpenEditProfile,
  onOpenOrders,
  onOpenAddress,
  onOpenCoupons,
  onShowToast,
  onLogout,
  onSubmitShopApply,
}: MeOverlaysProps) {
  return (
    <>
      {settingsOpen ? (
        <div className={styles.settingsOverlay} onClick={onCloseSettings} role="presentation">
          <aside className={styles.settingsDrawer} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.settingsHeader}>
              <div className={styles.settingsTitle}>设置</div>
              <button className={styles.settingsClose} type="button" onClick={onCloseSettings}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className={styles.settingsUser}>
              <img className={styles.settingsAvatar} src={currentUser.avatar} alt={currentUser.name} />
              <div className={styles.settingsUserInfo}>
                <div className={styles.settingsUserName}>{currentUser.name}</div>
                <div className={styles.settingsUserMeta}>{currentUser.phone}</div>
              </div>
              <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
            </div>

            <div className={styles.settingsBody}>
              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>账户</div>
                <button className={styles.settingsItem} type="button" onClick={onOpenEditProfile}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconGreen}`}><i className="fa-solid fa-user-pen" /></span>
                  <span className={styles.settingsItemText}>编辑资料</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
                <button className={styles.settingsItem} type="button" onClick={onOpenOrders}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconOrange}`}><i className="fa-solid fa-receipt" /></span>
                  <span className={styles.settingsItemText}>我的订单</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
                <button className={styles.settingsItem} type="button" onClick={onOpenAddress}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconBlue}`}><i className="fa-solid fa-location-dot" /></span>
                  <span className={styles.settingsItemText}>收货地址</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
                <button className={styles.settingsItem} type="button" onClick={onOpenCoupons}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconRed}`}><i className="fa-solid fa-ticket" /></span>
                  <span className={styles.settingsItemText}>优惠券</span>
                  <span className={styles.settingsItemVal}>{summary.availableCouponCount} 张</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
              </div>

              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>偏好设置</div>
                <button className={styles.settingsItem} type="button" onClick={() => onShowToast('账号偏好同步尚未接入')}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconPurple}`}><i className="fa-solid fa-moon" /></span>
                  <span className={styles.settingsItemText}>深色模式</span>
                  <span className={styles.settingsItemVal}>未接入</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
                <button className={styles.settingsItem} type="button" onClick={() => onShowToast('消息偏好同步尚未接入')}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconCyan}`}><i className="fa-solid fa-bell" /></span>
                  <span className={styles.settingsItemText}>消息通知</span>
                  <span className={styles.settingsItemVal}>未接入</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
              </div>

              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>支持与帮助</div>
                <button className={styles.settingsItem} type="button" onClick={() => onShowToast('关于Umi v2.6.0')}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconSlate}`}><i className="fa-solid fa-circle-info" /></span>
                  <span className={styles.settingsItemText}>关于Umi</span>
                  <span className={styles.settingsItemVal}>v2.6.0</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
                <button className={styles.settingsItem} type="button" onClick={onLogout} disabled={loggingOut}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconRed}`}><i className="fa-solid fa-right-from-bracket" /></span>
                  <span className={styles.settingsItemText}>{loggingOut ? '退出中...' : '退出登录'}</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
              </div>

              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupTitle}>其他</div>
                <button className={styles.settingsItem} type="button" onClick={() => onShowToast('本地缓存清理尚未接入')}>
                  <span className={`${styles.settingsItemIcon} ${styles.iconDangerSoft}`}><i className="fa-solid fa-broom" /></span>
                  <span className={styles.settingsItemText}>清除缓存</span>
                  <i className={`fa-solid fa-chevron-right ${styles.settingsArrow}`} />
                </button>
              </div>
            </div>

            <div className={styles.settingsFooter}>
              <div className={styles.settingsVersion}>Umi v2.6.0 · Made with ❤️</div>
            </div>
          </aside>
        </div>
      ) : null}

      {searchOpen ? (
        <div className={styles.searchOverlay} onClick={onCloseSearch} role="presentation">
          <div className={styles.searchPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.searchBar}>
              <input autoFocus placeholder="搜索用户 / 添加好友" value={searchValue} onChange={(event) => onChangeSearchValue(event.target.value)} />
              <button className={styles.searchCancel} type="button" onClick={onCloseSearch}>
                取消
              </button>
            </div>
            <div className={styles.searchQuick}>
              {[
                { label: '添加好友', icon: 'fa-solid fa-user-plus' },
                { label: '零食达人', icon: 'fa-solid fa-fire' },
                { label: '官方店铺', icon: 'fa-solid fa-store' },
              ].map((item, index) => (
                <button
                  className={index === 0 ? `${styles.searchChip} ${styles.searchChipAdd}` : styles.searchChip}
                  key={item.label}
                  type="button"
                  onClick={() => onPickSearchQuick(item.label)}
                >
                  <i className={item.icon} /> {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.searchResults} onClick={(event) => event.stopPropagation()} role="presentation">
            {searchLoading ? (
              <div className={styles.searchEmpty}>
                <i className="fa-solid fa-spinner fa-spin" />
                正在加载用户...
              </div>
            ) : searchSections.length > 0 ? searchSections.map((section, sectionIndex) => (
              <div className={styles.searchSection} key={section.title}>
                <div className={styles.searchSectionTitle} style={sectionIndex > 0 ? { marginTop: 16 } : undefined}>
                  {section.title}
                </div>
                {section.items.map((item) => (
                  <button
                    className={styles.searchItem}
                    key={item.id}
                    type="button"
                    onClick={() => onOpenUser(item.uid || '', item.id)}
                  >
                    <img src={item.avatar || '/legacy/images/mascot/mouse-main.png'} alt={item.name} />
                    <div className={styles.searchItemInfo}>
                      <div className={styles.searchItemName}>{item.name}</div>
                      <div className={styles.searchItemDesc}>{buildSearchItemDesc(item)}</div>
                    </div>
                    {item.relation === 'none' ? (
                      <span className={styles.searchAction}>{getSearchRelationLabel(item.relation)}</span>
                    ) : (
                      <span className={`${styles.searchAction} ${styles.searchActionAdded}`}>
                        {getSearchRelationLabel(item.relation)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )) : (
              <div className={styles.searchEmpty}>
                <i className="fa-solid fa-search" />
                {searchValue.trim() ? `未找到“${searchValue}”相关用户` : '暂无可推荐的用户'}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {shopModalOpen ? (
        <div className={styles.shopModalOverlay} onClick={onCloseShopModal} role="presentation">
          <div className={styles.shopModal} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.shopModalHero}>
              <div className={styles.shopModalHeroIcon}>🏪</div>
              <div className={styles.shopModalHeroTitle}>申请开通店铺</div>
              <div className={styles.shopModalHeroDesc}>提交资料后等待审核，通过后自动开通店铺经营能力</div>
            </div>
            <div className={styles.shopModalPerks}>
              <div className={styles.shopModalPerk}>
                <span className={`${styles.shopModalPerkIcon} ${styles.perkOrange}`}>🎯</span>
                <div>
                  <div className={styles.shopModalPerkText}>解锁全部竞猜模板</div>
                  <div className={styles.shopModalPerkSub}>二选一、多选、数值预测、好友PK</div>
                </div>
              </div>
              <div className={styles.shopModalPerk}>
                <span className={`${styles.shopModalPerkIcon} ${styles.perkGold}`}>💰</span>
                <div>
                  <div className={styles.shopModalPerkText}>关联商品功能</div>
                  <div className={styles.shopModalPerkSub}>竞猜绑定商品，猜中直接购买</div>
                </div>
              </div>
              <div className={styles.shopModalPerk}>
                <span className={`${styles.shopModalPerkIcon} ${styles.perkGreen}`}>🎟️</span>
                <div>
                  <div className={styles.shopModalPerkText}>自动优惠券生成</div>
                  <div className={styles.shopModalPerkSub}>未中用户自动获得补偿券，提升转化</div>
                </div>
              </div>
              <div className={styles.shopModalPerk}>
                <span className={`${styles.shopModalPerkIcon} ${styles.perkBlue}`}>📊</span>
                <div>
                  <div className={styles.shopModalPerkText}>数据看板 & 营销工具</div>
                  <div className={styles.shopModalPerkSub}>查看参与数据、转化率、用户画像</div>
                </div>
              </div>
            </div>
            <div className={styles.shopModalFooter}>
              <button className={styles.shopModalConfirm} type="button" onClick={onSubmitShopApply}>
                🏪 去填写开店申请
              </button>
              <button className={styles.shopModalCancel} type="button" onClick={onCloseShopModal}>
                再想想
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
