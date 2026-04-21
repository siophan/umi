'use client';

import Link from 'next/link';

import { shortcuts } from './me-helpers';
import styles from './page.module.css';

type CurrentUser = {
  id: string;
  uid: string;
  name: string;
  phone: string;
  avatar: string;
  signature: string;
  level: number;
  following: number;
  followers: number;
  totalGuess: number;
  wins: number;
  shopVerified: boolean;
};

type MeProfileSummaryProps = {
  currentUser: CurrentUser;
  stats: Array<{ value: number; label: string }>;
  unreadMessageCount: number;
  warehouseBadge: number;
  orderBadge: number;
  onOpenChat: () => void;
  onOpenFriends: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onEditProfile: () => void;
  onCopyUid: () => void;
  onOpenShopApply: () => void;
};

export function MeProfileSummary({
  currentUser,
  stats,
  unreadMessageCount,
  warehouseBadge,
  orderBadge,
  onOpenChat,
  onOpenFriends,
  onOpenSearch,
  onOpenSettings,
  onEditProfile,
  onCopyUid,
  onOpenShopApply,
}: MeProfileSummaryProps) {
  return (
    <>
      <section className={styles.cover}>
        <div className={styles.topbar}>
          <div className={styles.brand}>Umi</div>
          <div className={styles.actions}>
            <button type="button" aria-label="消息" onClick={onOpenChat}>
              <i className="fa-regular fa-comment-dots" />
              {unreadMessageCount > 0 ? <span className={styles.topBadge}>{unreadMessageCount}</span> : null}
            </button>
            <button type="button" aria-label="好友" onClick={onOpenFriends}>
              <i className="fa-solid fa-user-group" />
            </button>
            <button type="button" aria-label="搜索" onClick={onOpenSearch}>
              <i className="fa-solid fa-magnifying-glass" />
            </button>
            <button type="button" aria-label="设置" onClick={onOpenSettings}>
              <i className="fa-solid fa-bars" />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.main}>
        <button className={styles.avatarBox} type="button" onClick={onEditProfile}>
          <img className={styles.avatar} src={currentUser.avatar} alt={currentUser.name} />
          <div className={styles.avatarPlus}>+</div>
        </button>

        <div className={styles.nameRow}>
          <h1>{currentUser.name}</h1>
          <span className={styles.nameBadge}>🌟</span>
          <span className={styles.levelTag}>Lv.{currentUser.level}</span>
        </div>

        <div className={styles.uidRow}>
          <span>优米号：{currentUser.uid || '--'}</span>
          <button type="button" aria-label="复制优米号" onClick={onCopyUid}>
            <i className="fa-regular fa-copy" />
          </button>
        </div>

        <div className={styles.statsBar}>
          {stats.map((item) => (
            <button className={styles.statItem} key={item.label} type="button">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          ))}
          <button className={styles.editBtn} type="button" onClick={onEditProfile}>
            编辑主页
          </button>
        </div>

        <p className={styles.bio}>{currentUser.signature || '暂未填写个人简介'}</p>

        <div className={styles.funcRow}>
          {shortcuts.map((item) => (
            <Link className={styles.funcEntry} href={item.href} key={item.label}>
              <div className={styles.funcCircle}>
                <i className={item.icon} />
                {item.badge && (item.label === '我的仓库' ? warehouseBadge : orderBadge) > 0 ? (
                  <span className={styles.funcBadge}>
                    {item.label === '我的仓库' ? warehouseBadge : orderBadge}
                  </span>
                ) : null}
              </div>
              <span className={styles.funcText}>{item.label}</span>
            </Link>
          ))}
        </div>

        {!currentUser.shopVerified ? (
          <button className={styles.openShop} type="button" onClick={onOpenShopApply}>
            <div className={styles.openShopIcon}>🏪</div>
            <div className={styles.openShopInfo}>
              <div className={styles.openShopTitle}>我要开店</div>
              <div className={styles.openShopDesc}>开通商家身份，发布全类型竞猜，关联商品赚佣金</div>
            </div>
            <span className={styles.openShopBtn}>立即开通</span>
          </button>
        ) : (
          <div className={styles.merchantBadge}>
            <span className={styles.merchantIcon}>
              <i className="fa-solid fa-circle-check" />
            </span>
            <div>
              <div className={styles.merchantTitle}>商家身份已开通</div>
              <div className={styles.merchantSub}>可发布全类型竞猜 · 关联商品 · 优惠券</div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
