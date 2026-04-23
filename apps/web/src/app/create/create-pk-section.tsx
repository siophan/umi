'use client';

import type { FriendItem } from './create-helpers';
import styles from './page.module.css';

type Props = {
  selectedFriends: string[];
  openShareInvite: () => void;
  friendKeyword: string;
  setFriendKeyword: (value: string | ((current: string) => string)) => void;
  filteredFriends: FriendItem[];
  selectedFriendList: FriendItem[];
  toggleFriend: (friendId: string) => void;
  showToast: (message: string) => void;
};

export function CreatePkSection({
  selectedFriends,
  openShareInvite,
  friendKeyword,
  setFriendKeyword,
  filteredFriends,
  selectedFriendList,
  toggleFriend,
  showToast,
}: Props) {
  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>×</span> 邀请好友参战<span className={styles.requiredMark}>*</span>
        <span className={`${styles.stepStatus} ${selectedFriends.length ? styles.done : styles.pending}`}>{selectedFriends.length ? `已选 ${selectedFriends.length} 人` : '待选择'}</span>
      </h3>
      <div className={styles.pkFriendsHeader}>
        <span className={styles.pkFriendsCount}>已选 {selectedFriends.length} 人</span>
        <button className={styles.pkShareBtn} type="button" onClick={openShareInvite}>
          <i className="fa-solid fa-share-from-square" /> 分享邀请
        </button>
      </div>
      <div className={styles.pkSearch}>
        <i className="fa-solid fa-magnifying-glass" />
        <input placeholder="搜索好友..." value={friendKeyword} onChange={(event) => setFriendKeyword(event.target.value)} />
      </div>
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
                <img src={friend.avatar} alt={friend.name} />
              </div>
              <span className={styles.friendName}>{friend.name.slice(0, 4)}</span>
              <span className={styles.friendMeta}>胜率{friend.winRate ?? 50}%</span>
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
      {selectedFriendList.length ? (
        <div className={styles.pkSelectedTags}>
          {selectedFriendList.map((friend) => (
            <button key={friend.id} type="button" className={styles.pkSelectedTag} onClick={() => toggleFriend(friend.id)}>
              <img src={friend.avatar} alt={friend.name} />
              <span>{friend.name}</span>
              <i className="fa-solid fa-xmark" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
