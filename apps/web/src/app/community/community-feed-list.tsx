'use client';

import type { FeedItem, Scope } from './page-helpers';
import { SCOPE_META, fmtNum, shouldRenderStandaloneTitle } from './page-helpers';
import styles from './page.module.css';

type CommunityFeedListProps = {
  feedReady: boolean;
  feedError: string;
  feed: FeedItem[];
  currentTab: 'recommend' | 'follow';
  likeSavingId: string;
  bookmarkSavingId: string;
  bookmarkAnimating: string | null;
  onOpenPost: (postId: string) => void;
  onOpenUser: (userId: string) => void;
  onOpenGuess: (guessId: string) => void;
  onToggleLike: (postId: string, tab: 'recommend' | 'follow') => void;
  onOpenRepost: (item: FeedItem, tab: 'recommend' | 'follow') => void;
  onToggleBookmark: (postId: string, tab: 'recommend' | 'follow', bookmarked: boolean) => void;
};

function CommunityFeedCard({
  item,
  currentTab,
  likeSavingId,
  bookmarkSavingId,
  bookmarkAnimating,
  onOpenPost,
  onOpenUser,
  onOpenGuess,
  onToggleLike,
  onOpenRepost,
  onToggleBookmark,
}: {
  item: FeedItem;
  currentTab: 'recommend' | 'follow';
  likeSavingId: string;
  bookmarkSavingId: string;
  bookmarkAnimating: string | null;
  onOpenPost: (postId: string) => void;
  onOpenUser: (userId: string) => void;
  onOpenGuess: (guessId: string) => void;
  onToggleLike: (postId: string, tab: 'recommend' | 'follow') => void;
  onOpenRepost: (item: FeedItem, tab: 'recommend' | 'follow') => void;
  onToggleBookmark: (postId: string, tab: 'recommend' | 'follow', bookmarked: boolean) => void;
}) {
  const showStandaloneTitle = shouldRenderStandaloneTitle(item.title, item.desc);
  const guessInfo = item.guessInfo;

  return (
    <article className={styles.card} onClick={() => onOpenPost(item.id)}>
      <header className={styles.authorRow}>
        <button
          className={styles.authorAvatarBtn}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenUser(item.author.uid || item.author.name);
          }}
        >
          <img src={item.author.avatar} alt={item.author.name} />
        </button>
        <div className={styles.authorMeta}>
          <div className={styles.authorName}>
            {item.author.name}
            {item.author.verified ? <i className="fa-solid fa-circle-check" /> : null}
          </div>
          <div className={styles.authorTime}>
            {item.time}
            {item.scope && item.scope !== 'public' ? (
              <>
                {' · '}
                <i className={`fa-solid ${SCOPE_META[item.scope as Scope].icon}`} />
                {' '}
                {SCOPE_META[item.scope as Scope].feedLabel}
              </>
            ) : null}
          </div>
        </div>
        <span className={`${styles.tag} ${item.tag.cls}`}>{item.tag.text}</span>
      </header>

      <div className={styles.body}>
        {showStandaloneTitle ? <h2 className={styles.titleText}>{item.title}</h2> : null}
        <p className={`${styles.descText} ${showStandaloneTitle ? '' : styles.descTextOnly}`}>{item.desc}</p>
      </div>

      {item.images.length ? (
        <div
          className={`${styles.images} ${
            item.images.length === 1 ? styles.img1 : item.images.length === 2 ? styles.img2 : styles.img3
          }`}
        >
          {item.images.slice(0, 3).map((src) => (
            <img src={src} alt={item.title} key={src} />
          ))}
        </div>
      ) : null}

      {guessInfo ? (
        <>
          <button
            className={styles.guessBar}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenGuess(guessInfo.id);
            }}
          >
            <div className={styles.guessIcon}>🎯</div>
            <div className={styles.guessInfo}>
              <div className={styles.guessTitle}>{guessInfo.options.join(' vs ')}</div>
              <div className={styles.guessData}>{fmtNum(guessInfo.participants)}人参与</div>
            </div>
            <span className={styles.guessBtn}>去竞猜</span>
          </button>

          <div className={styles.pkMini}>
            <div className={`${styles.pkSeg} ${styles.pkSeg0}`} style={{ width: `${guessInfo.pcts[0]}%` }}>
              {guessInfo.pcts[0]}%
            </div>
            <div className={`${styles.pkSeg} ${styles.pkSeg1}`} style={{ width: `${guessInfo.pcts[1]}%` }}>
              {guessInfo.pcts[1]}%
            </div>
          </div>
        </>
      ) : null}

      <footer className={styles.actions}>
        <button
          className={styles.actionItem}
          type="button"
          disabled={likeSavingId === item.id}
          onClick={(event) => {
            event.stopPropagation();
            onToggleLike(item.id, currentTab);
          }}
        >
          <i className={`fa-${item.liked ? 'solid' : 'regular'} fa-heart ${item.liked ? styles.actionLiked : ''}`} />
          {fmtNum(item.likes)}
        </button>
        <button
          className={styles.actionItem}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenPost(item.id);
          }}
        >
          <i className="fa-regular fa-comment" />
          {fmtNum(item.comments)}
        </button>
        <button
          className={styles.actionItem}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenRepost(item, currentTab);
          }}
        >
          <i className="fa-solid fa-share-nodes" />
          {fmtNum(item.shares)}
        </button>
        <button
          className={`${styles.actionItem} ${styles.actionFav} ${item.bookmarked ? styles.favorited : ''} ${
            bookmarkAnimating === item.id ? styles.favoritedPop : ''
          }`}
          type="button"
          disabled={bookmarkSavingId === item.id}
          onClick={(event) => {
            event.stopPropagation();
            onToggleBookmark(item.id, currentTab, Boolean(item.bookmarked));
          }}
        >
          <i className={`fa-${item.bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
        </button>
      </footer>
    </article>
  );
}

export function CommunityFeedList({
  feedReady,
  feedError,
  feed,
  currentTab,
  likeSavingId,
  bookmarkSavingId,
  bookmarkAnimating,
  onOpenPost,
  onOpenUser,
  onOpenGuess,
  onToggleLike,
  onOpenRepost,
  onToggleBookmark,
}: CommunityFeedListProps) {
  const hideFeedError = currentTab === 'follow';
  const emptyTitle = feedError && !hideFeedError ? '动态加载失败' : currentTab === 'follow' ? '暂无关注动态' : '暂无该分类内容';
  const emptyDesc = feedError && !hideFeedError ? feedError : currentTab === 'follow' ? '去关注一些猜友后再来看看吧~' : '换个分类看看吧~';

  return (
    <section className={styles.feed}>
      {!feedReady ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-spinner fa-spin" />
          <div className={styles.emptyTitle}>动态加载中</div>
          <div className={styles.emptyDesc}>正在同步社区内容...</div>
        </div>
      ) : feed.length ? (
        feed.map((item) => (
          <CommunityFeedCard
            key={item.id}
            item={item}
            currentTab={currentTab}
            likeSavingId={likeSavingId}
            bookmarkSavingId={bookmarkSavingId}
            bookmarkAnimating={bookmarkAnimating}
            onOpenPost={onOpenPost}
            onOpenUser={onOpenUser}
            onOpenGuess={onOpenGuess}
            onToggleLike={onToggleLike}
            onOpenRepost={onOpenRepost}
            onToggleBookmark={onToggleBookmark}
          />
        ))
      ) : (
        <div className={styles.empty}>
          <i className={`fa-solid ${feedError && !hideFeedError ? 'fa-triangle-exclamation' : 'fa-inbox'}`} />
          <div className={styles.emptyTitle}>{emptyTitle}</div>
          <div className={styles.emptyDesc}>{emptyDesc}</div>
        </div>
      )}
    </section>
  );
}
