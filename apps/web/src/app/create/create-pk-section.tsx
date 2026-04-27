'use client';

import type { FriendItem } from './create-helpers';
import styles from './page.module.css';

type Props = {
  selectedFriends: string[];
  friendKeyword: string;
  setFriendKeyword: (value: string | ((current: string) => string)) => void;
  filteredFriends: FriendItem[];
  selectedFriendList: FriendItem[];
  toggleFriend: (friendId: string) => void;
  showToast: (message: string) => void;
};

export function CreatePkSection({
  selectedFriends,
  friendKeyword,
  setFriendKeyword,
  filteredFriends,
  selectedFriendList,
  toggleFriend,
  showToast,
}: Props) {
  function renderFriendAvatar(friend: FriendItem, className?: string) {
    if (friend.avatar) {
      return <img className={className} src={friend.avatar} alt={friend.name} />;
    }
    return <span className={className ?? styles.friendAvatarInitial}>{friend.name.slice(0, 1) || '友'}</span>;
  }

  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>⚔</span> 邀请好友参战<span className={styles.requiredMark}>*</span>
        <span className={`${styles.stepStatus} ${selectedFriends.length ? styles.done : styles.pending}`}>{selectedFriends.length ? `已选 ${selectedFriends.length} 人` : '待选择'}</span>
      </h3>
      <div className={styles.pkFriendsHeader}>
        <span className={styles.pkFriendsCount}>已选 {selectedFriends.length} 人</span>
      </div>
      <div className={styles.pkSearch}>
        <i className="fa-solid fa-magnifying-glass" />
        <input placeholder="搜索好友..." value={friendKeyword} onChange={(event) => setFriendKeyword(event.target.value)} />
      </div>
      {filteredFriends.length ? (
        <div className={styles.friendsGrid}>
          {filteredFriends.map((friend) => {
            const active = selectedFriends.includes(friend.id);
            return (
              <button
                key={friend.id}
                type="button"
                className={`${styles.friendCard} ${active ? styles.friendSelected : ''}`}
                onClick={() => toggleFriend(friend.id)}
              >
                <div className={styles.friendCheck}>
                  <i className="fa-solid fa-check" />
                </div>
                <div className={`${styles.friendOnline} ${friend.online ? styles.friendOnlineOn : styles.friendOnlineOff}`} />
                <div className={styles.friendAvatarWrap}>
                  {renderFriendAvatar(friend)}
                </div>
                <span className={styles.friendName}>{friend.name.slice(0, 4)}</span>
                <span className={styles.friendMeta}>
                  {typeof friend.winRate === 'number' ? `胜率${friend.winRate}%` : '暂无胜率'}
                </span>
              </button>
            );
          })}
          <button className={styles.inviteMore} type="button" onClick={() => showToast('邀请更多好友')}>
            <div className={styles.inviteMoreIcon}>
              <i className="fa-solid fa-plus" />
            </div>
            <span className={styles.inviteMoreText}>邀请</span>
          </button>
        </div>
      ) : (
        <div className={styles.pkEmptyState}>
          <i className="fa-regular fa-user" />
          <span>{friendKeyword.trim() ? '没有匹配的好友' : '暂无可邀请好友'}</span>
        </div>
      )}
      {selectedFriendList.length ? (
        <div className={styles.pkSelectedTags}>
          {selectedFriendList.map((friend) => (
            <button key={friend.id} type="button" className={styles.pkSelectedTag} onClick={() => toggleFriend(friend.id)}>
              {renderFriendAvatar(friend, styles.pkSelectedTagAvatar)}
              <span>{friend.name}</span>
              <i className="fa-solid fa-xmark" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
