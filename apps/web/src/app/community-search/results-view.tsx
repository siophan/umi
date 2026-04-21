'use client';

import type { CommunityFeedItem, UserSearchItem } from '@umi/shared';

import styles from './page.module.css';
import { formatNum, formatRelativeTime, highlight, postTagClass, userDesc } from './page-helpers';

type CommunitySearchResultsViewProps = {
  loggedIn: boolean;
  searchedQuery: string;
  searching: boolean;
  searchError: string;
  filteredUsers: UserSearchItem[];
  filteredPosts: CommunityFeedItem[];
  followSavingId: string;
  onLogin: () => void;
  onRetrySearch: () => void;
  onUserOpen: (uid: string) => void;
  onToggleFollow: (user: UserSearchItem) => void;
  onPostOpen: (postId: string) => void;
};

export function CommunitySearchResultsView({
  loggedIn,
  searchedQuery,
  searching,
  searchError,
  filteredUsers,
  filteredPosts,
  followSavingId,
  onLogin,
  onRetrySearch,
  onUserOpen,
  onToggleFollow,
  onPostOpen,
}: CommunitySearchResultsViewProps) {
  return (
    <div className={styles.resultsView}>
      {!loggedIn ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-user-lock" />
          <div className={styles.emptyTitle}>登录后可查看“{searchedQuery}”相关内容</div>
          <div className={styles.emptyDesc}>社区搜索、热搜和推荐关注需要登录后使用</div>
          <button className={styles.emptyRetry} type="button" onClick={onLogin}>
            去登录
          </button>
        </div>
      ) : searching ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-spinner fa-spin" />
          <div className={styles.emptyTitle}>搜索中</div>
          <div className={styles.emptyDesc}>正在查找相关内容...</div>
        </div>
      ) : searchError ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-circle-exclamation" />
          <div className={styles.emptyTitle}>搜索失败</div>
          <div className={styles.emptyDesc}>{searchError}</div>
          <button className={styles.emptyRetry} type="button" onClick={onRetrySearch}>
            重试
          </button>
        </div>
      ) : (
        <>
          {filteredUsers.length ? (
            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                <span>
                  <i className="fa-solid fa-user" />
                </span>{' '}
                相关猜友
              </div>
              <div className={styles.userScroll}>
                {filteredUsers.map((user) => {
                  const followed = user.relation === 'friend' || user.relation === 'following';
                  return (
                    <button
                      className={styles.userCard}
                      key={user.id}
                      type="button"
                      onClick={() => onUserOpen(user.uid)}
                    >
                      <img src={user.avatar || '/legacy/images/mascot/mouse-main.png'} alt={user.name} />
                      <div className={styles.userName}>
                        {user.name}
                        {user.shopVerified ? <i className="fa-solid fa-circle-check" /> : null}
                      </div>
                      <div className={styles.userDesc}>{userDesc(user)}</div>
                      <span
                        className={followed ? styles.followedBtn : styles.followBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleFollow(user);
                        }}
                      >
                        {followSavingId === user.id ? '处理中' : followed ? '已关注' : '+ 关注'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {filteredPosts.length
            ? filteredPosts.map((item) => (
                <button
                  className={styles.resultCard}
                  key={item.id}
                  type="button"
                  onClick={() => onPostOpen(item.id)}
                >
                  <div className={styles.resultAuthor}>
                    <img src={item.author.avatar || '/legacy/images/mascot/mouse-main.png'} alt={item.author.name} />
                    <div>
                      <div className={styles.resultName}>
                        {item.author.name}
                        {item.author.verified ? <i className="fa-solid fa-circle-check" /> : null}
                      </div>
                      <div className={styles.resultTime}>{formatRelativeTime(item.createdAt)}</div>
                    </div>
                    <span className={`${styles.resultTag} ${styles[postTagClass(item)]}`}>
                      {item.tag || '猜友动态'}
                    </span>
                  </div>
                  <div className={styles.resultBody}>
                    <div className={styles.resultTitle}>{highlight(item.title, searchedQuery)}</div>
                    <div className={styles.resultDesc}>{item.desc}</div>
                  </div>
                  {item.images.length ? (
                    <div
                      className={`${styles.resultImages} ${styles[`img${item.images.length >= 3 ? 3 : item.images.length}` as const]}`}
                    >
                      {item.images.slice(0, 3).map((image) => (
                        <img src={image} alt={item.title} key={image} />
                      ))}
                    </div>
                  ) : null}
                  <div className={styles.resultActions}>
                    <span>
                      <i className="fa-regular fa-heart" /> {formatNum(item.likes)}
                    </span>
                    <span>
                      <i className="fa-regular fa-comment" /> {formatNum(item.comments)}
                    </span>
                    <span>
                      <i className="fa-solid fa-share-nodes" /> {formatNum(item.shares)}
                    </span>
                  </div>
                </button>
              ))
            : null}

          {!filteredPosts.length && !filteredUsers.length ? (
            <div className={styles.empty}>
              <i className="fa-solid fa-magnifying-glass" />
              <div className={styles.emptyTitle}>未找到“{searchedQuery}”相关内容</div>
              <div className={styles.emptyDesc}>换个关键词试试吧~</div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
