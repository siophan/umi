'use client';

import type { ReactNode } from 'react';

import type { FanItem, FollowingItem, FriendItem, RequestItem } from './friends-helpers';
import { winRateClass } from './friends-helpers';
import styles from './page.module.css';

type FriendsTabSectionsProps = {
  socialError: boolean;
  errorContent: ReactNode;
  activeTab: 'friends' | 'following' | 'fans' | 'requests';
  filteredFriends: FriendItem[];
  filteredFollowing: FollowingItem[];
  filteredFans: FanItem[];
  filteredRequests: RequestItem[];
  followSavingId: string;
  requestSavingId: string;
  onToggleSort: () => void;
  onOpenProfile: (uid: string) => void;
  onOpenPk: (item: FriendItem) => void;
  onOpenMessage: (name: string) => void;
  onToggleFollowing: (item: FollowingItem) => void;
  onToggleFanFollow: (item: FanItem) => void;
  onAcceptRequest: (item: RequestItem) => void;
  onRejectRequest: (item: RequestItem) => void;
};

export function FriendsTabSections({
  socialError,
  errorContent,
  activeTab,
  filteredFriends,
  filteredFollowing,
  filteredFans,
  filteredRequests,
  followSavingId,
  requestSavingId,
  onToggleSort,
  onOpenProfile,
  onOpenPk,
  onOpenMessage,
  onToggleFollowing,
  onToggleFanFollow,
  onAcceptRequest,
  onRejectRequest,
}: FriendsTabSectionsProps) {
  if (activeTab === 'friends') {
    return (
      <section>
        <div className={styles.sectionHeader}>
          <span>我的好友 ({filteredFriends.length})</span>
          <button className={styles.sortBtn} type="button" onClick={onToggleSort}>
            <i className="fa-solid fa-arrow-down-short-wide" /> 排序
          </button>
        </div>
        {socialError ? errorContent : filteredFriends.length ? filteredFriends.map((item) => (
          <article className={styles.card} key={item.id}>
            <button className={styles.avatarButton} type="button" onClick={() => onOpenProfile(item.uid)}>
              <img className={styles.avatar} src={item.avatar} alt={item.name} />
              <span className={`${styles.onlineDot} ${item.status === 'online' ? styles.online : styles.offline}`} />
            </button>
            <div className={styles.info}>
              <div className={styles.nameRow}>
                <button className={styles.nameButton} type="button" onClick={() => onOpenProfile(item.uid)}>
                  {item.name}
                </button>
                <span className={styles.level}>Lv.{item.level}</span>
                <span className={item.status === 'online' ? styles.onlineTagOn : styles.onlineTagOff}>
                  {item.status === 'online' ? '在线' : '离线'}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaChip}>
                  <i className="fa-solid fa-crosshairs" />
                  胜率 <b className={winRateClass(item.winRate)}>{item.winRate}%</b>
                </span>
                {item.streak > 0 ? <span className={styles.streak}>🔥{item.streak}连胜</span> : null}
              </div>
              <div className={styles.bio}>{item.bio}</div>
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} type="button" onClick={() => onOpenPk(item)}>
                <i className="fa-solid fa-bolt" /> PK
              </button>
              <button className={styles.outlineIconBtn} type="button" onClick={() => onOpenMessage(item.name)}>
                <i className="fa-regular fa-comment" />
              </button>
            </div>
          </article>
        )) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>👋</div>
            <div className={styles.emptyTitle}>暂无好友</div>
            <div className={styles.emptyDesc}>去猜友圈认识新朋友吧~</div>
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'following') {
    return (
      <section>
        <div className={styles.sectionHeader}>
          <span>我的关注 ({filteredFollowing.length})</span>
        </div>
        {socialError ? errorContent : filteredFollowing.length ? filteredFollowing.map((item) => (
          <article className={styles.card} key={item.id}>
            <button className={styles.avatarButton} type="button" onClick={() => onOpenProfile(item.uid)}>
              <img className={styles.avatar} src={item.avatar} alt={item.name} />
            </button>
            <div className={styles.info}>
              <div className={styles.nameRow}>
                <button className={styles.nameButton} type="button" onClick={() => onOpenProfile(item.uid)}>
                  {item.name}
                </button>
                {item.verified ? <i className={`fa-solid fa-circle-check ${styles.verified}`} /> : null}
                <span className={styles.badgeBrand}>{item.tag}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaChip}>{item.desc}</span>
                <span className={styles.metaChip}><i className="fa-solid fa-users" /> {item.fans}</span>
                <span className={styles.metaChip}><i className="fa-solid fa-file-lines" /> {item.posts}动态</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                className={item.followed ? (item.mutual ? styles.mutualBtn : styles.followedBtn) : styles.primaryBtn}
                type="button"
                disabled={followSavingId === item.id}
                onClick={() => onToggleFollowing(item)}
              >
                {followSavingId === item.id ? '处理中' : item.followed ? (item.mutual ? '互关' : '已关注') : '关注'}
              </button>
            </div>
          </article>
        )) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <div className={styles.emptyTitle}>暂无关注</div>
            <div className={styles.emptyDesc}>发现感兴趣的用户就关注吧~</div>
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'fans') {
    return (
      <section>
        <div className={styles.sectionHeader}>
          <span>我的粉丝 ({filteredFans.length})</span>
        </div>
        {socialError ? errorContent : filteredFans.length ? filteredFans.map((item) => (
          <article className={styles.card} key={item.id}>
            <button className={styles.avatarButton} type="button" onClick={() => onOpenProfile(item.uid)}>
              <img className={styles.avatar} src={item.avatar} alt={item.name} />
            </button>
            <div className={styles.info}>
              <div className={styles.nameRow}>
                <button className={styles.nameButton} type="button" onClick={() => onOpenProfile(item.uid)}>
                  {item.name}
                </button>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaChip}>
                  <i className="fa-solid fa-crosshairs" />
                  胜率 <b className={winRateClass(item.winRate)}>{item.winRate}%</b>
                </span>
                <span className={styles.metaChip}>{item.bio}</span>
              </div>
              <div className={styles.fanTime}>{item.time}关注了你</div>
            </div>
            <div className={styles.actions}>
              <button
                className={item.followedBack ? styles.mutualBtn : styles.primaryBtn}
                type="button"
                disabled={followSavingId === item.id}
                onClick={() => onToggleFanFollow(item)}
              >
                {followSavingId === item.id ? '处理中' : item.followedBack ? '互关' : '回关'}
              </button>
            </div>
          </article>
        )) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✨</div>
            <div className={styles.emptyTitle}>暂无粉丝</div>
            <div className={styles.emptyDesc}>多参与竞猜互动，吸引更多关注~</div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <span>好友申请 ({filteredRequests.length})</span>
      </div>
      {socialError ? errorContent : filteredRequests.length ? filteredRequests.map((item) => (
        <article className={styles.requestCard} key={item.id}>
          <button className={styles.avatarButton} type="button" onClick={() => onOpenProfile(item.uid)}>
            <img className={styles.avatar} src={item.avatar} alt={item.name} />
          </button>
          <div className={styles.info}>
            <div className={styles.nameRow}>
              <button className={styles.nameButton} type="button" onClick={() => onOpenProfile(item.uid)}>
                {item.name}
              </button>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaChip}>
                <i className="fa-solid fa-crosshairs" />
                胜率 <b className={winRateClass(item.winRate)}>{item.winRate}%</b>
              </span>
            </div>
            {item.mutualFriends > 0 ? (
              <div className={styles.requestMutual}>
                <i className="fa-solid fa-user-group" /> {item.mutualFriends} 位共同好友
              </div>
            ) : null}
            {item.message ? <div className={styles.requestMsg}>"{item.message}"</div> : null}
            <div className={styles.requestActions}>
              <button className={styles.primaryBtn} type="button" disabled={requestSavingId === item.id} onClick={() => onAcceptRequest(item)}>
                <i className="fa-solid fa-check" /> {requestSavingId === item.id ? '处理中' : '接受'}
              </button>
              <button className={styles.outlineBtn} type="button" disabled={requestSavingId === item.id} onClick={() => onRejectRequest(item)}>
                <i className="fa-solid fa-xmark" /> {requestSavingId === item.id ? '处理中' : '忽略'}
              </button>
            </div>
            <div className={styles.requestTime}>
              <i className="fa-regular fa-clock" /> {item.time}
            </div>
          </div>
        </article>
      )) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎉</div>
          <div className={styles.emptyTitle}>暂无新申请</div>
          <div className={styles.emptyDesc}>已处理所有好友申请</div>
        </div>
      )}
    </section>
  );
}
