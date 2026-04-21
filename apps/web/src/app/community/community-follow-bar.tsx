'use client';

import Link from 'next/link';

import styles from './page.module.css';
import type { FollowUser } from './page-helpers';

type CommunityFollowBarProps = {
  followedUsers: FollowUser[];
  socialReady: boolean;
  fallbackUsers: FollowUser[];
  onOpenUser: (userId: string) => void;
};

export function CommunityFollowBar({
  followedUsers,
  socialReady,
  fallbackUsers,
  onOpenUser,
}: CommunityFollowBarProps) {
  return (
    <section className={styles.followBar}>
      <div className={styles.followBarTitle}>
        <span>我关注的猜友</span>
        <Link href="/friends">
          管理关注 <i className="fa-solid fa-chevron-right" />
        </Link>
      </div>
      <div className={styles.followScroll}>
        {followedUsers.length ? followedUsers.map((item) => (
          <button className={styles.followItem} key={item.id} type="button" onClick={() => onOpenUser(item.uid || item.id)}>
            <div className={styles.followAvatarWrap}>
              <img
                className={`${styles.followAvatar} ${item.hasNew ? styles.followAvatarNew : styles.followAvatarOld}`}
                src={item.avatar}
                alt={item.name}
              />
              {item.hasNew ? <span className={styles.followDot} /> : null}
            </div>
            <span className={styles.followName}>{item.name}</span>
          </button>
        )) : socialReady ? (
          <div className={styles.followEmpty}>你还没有关注任何猜友</div>
        ) : (
          fallbackUsers.map((item) => (
            <div className={styles.followItemSkeleton} key={item.id} />
          ))
        )}
      </div>
    </section>
  );
}
