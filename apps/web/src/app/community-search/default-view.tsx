'use client';

import type { UserSearchItem } from '@umi/shared';

import styles from './page.module.css';
import type { HotSearchItem } from './page-helpers';
import { userDesc } from './page-helpers';

type CommunitySearchDefaultViewProps = {
  loggedIn: boolean;
  searchHistory: string[];
  hotSearches: HotSearchItem[];
  hotError: string;
  ready: boolean;
  recommendedUsers: UserSearchItem[];
  recommendError: string;
  followSavingId: string;
  onLogin: () => void;
  onSearch: (value: string) => void;
  onClearHistory: () => void;
  onRetryDiscovery: () => void;
  onUserOpen: (uid: string) => void;
  onToggleFollow: (user: UserSearchItem) => void;
};

export function CommunitySearchDefaultView({
  loggedIn,
  searchHistory,
  hotSearches,
  hotError,
  ready,
  recommendedUsers,
  recommendError,
  followSavingId,
  onLogin,
  onSearch,
  onClearHistory,
  onRetryDiscovery,
  onUserOpen,
  onToggleFollow,
}: CommunitySearchDefaultViewProps) {
  return (
    <div className={styles.defaultView}>
      {!loggedIn ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-user-lock" />
          <div className={styles.emptyTitle}>登录后查看社区热搜和推荐关注</div>
          <div className={styles.emptyDesc}>社区搜索支持搜动态、竞猜话题和猜友</div>
          <button className={styles.emptyRetry} type="button" onClick={onLogin}>
            去登录
          </button>
        </div>
      ) : null}

      {loggedIn && searchHistory.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>
              <i className="fa-solid fa-clock-rotate-left" />
            </span>{' '}
            搜索历史
            <button type="button" onClick={onClearHistory}>
              <i className="fa-solid fa-trash-can" /> 清除
            </button>
          </div>
          <div className={styles.historyList}>
            {searchHistory.map((item) => (
              <button className={styles.historyItem} key={item} type="button" onClick={() => onSearch(item)}>
                <i className="fa-solid fa-clock-rotate-left" />
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {loggedIn ? (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>
              <i className="fa-solid fa-fire" />
            </span>{' '}
            热搜榜
          </div>
          {hotSearches.length ? (
            <div className={styles.hotList}>
              {hotSearches.map((item, index) => (
                <button className={styles.hotItem} key={item.title} type="button" onClick={() => onSearch(item.title)}>
                  <div className={`${styles.hotRank} ${styles[`rank${index < 3 ? index + 1 : 4}` as const]}`}>
                    {index + 1}
                  </div>
                  <div className={styles.hotText}>
                    <div className={styles.hotItemTitle}>{item.title}</div>
                    <div className={styles.hotItemDesc}>{item.desc}</div>
                  </div>
                  <span className={styles[item.kind]}>{item.tag}</span>
                </button>
              ))}
            </div>
          ) : hotError ? (
            <div className={styles.sectionIssue}>
              <div className={styles.sectionIssueTitle}>热搜加载失败</div>
              <div className={styles.sectionIssueDesc}>{hotError}</div>
              <button className={styles.sectionRetry} type="button" onClick={onRetryDiscovery}>
                重试
              </button>
            </div>
          ) : (
            <div className={styles.sectionEmpty}>暂无热搜内容</div>
          )}
        </section>
      ) : null}

      {loggedIn ? (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>
              <i className="fa-solid fa-user-plus" />
            </span>{' '}
            推荐关注
          </div>
          {ready && recommendedUsers.length ? (
            <div className={styles.userScroll}>
              {recommendedUsers.map((user) => {
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
          ) : recommendError ? (
            <div className={styles.sectionIssue}>
              <div className={styles.sectionIssueTitle}>推荐关注加载失败</div>
              <div className={styles.sectionIssueDesc}>{recommendError}</div>
              <button className={styles.sectionRetry} type="button" onClick={onRetryDiscovery}>
                重试
              </button>
            </div>
          ) : (
            <div className={styles.sectionEmpty}>暂无推荐用户</div>
          )}
        </section>
      ) : null}
    </div>
  );
}
