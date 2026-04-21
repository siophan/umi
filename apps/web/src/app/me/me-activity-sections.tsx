'use client';

import type { ActivityPost } from './me-helpers';
import { formatCount, formatTimeLabel, tagClassMap } from './me-helpers';
import styles from './page.module.css';

type MeActivitySectionsProps = {
  tab: 'works' | 'favs' | 'likes';
  currentUser: {
    avatar: string;
    name: string;
  };
  activity: {
    works: ActivityPost[];
    bookmarks: ActivityPost[];
    likes: ActivityPost[];
  };
  onChangeTab: (tab: 'works' | 'favs' | 'likes') => void;
  onSharePost: () => void;
  onOpenCommunity: () => void;
};

function renderPostCard(post: ActivityPost, currentUser: { avatar: string; name: string }, onSharePost: () => void, liked = false) {
  const imageClass =
    post.images.length >= 3 ? styles.cols3 : post.images.length === 2 ? styles.cols2 : styles.cols1;
  const tagClass = post.tag ? tagClassMap[post.tag] ?? '' : '';

  return (
    <article className={styles.postCard} key={post.id}>
      <div className={styles.postAuthor}>
        <img src={post.authorAvatar || currentUser.avatar} alt={post.authorName || currentUser.name} />
        <div className={styles.postAuthorInfo}>
          <div className={styles.postAuthorName}>{post.authorName || currentUser.name}</div>
          <div className={styles.postAuthorMeta}>{formatTimeLabel(post.createdAt)}</div>
        </div>
        {post.tag ? <span className={`${styles.postTag} ${tagClass}`}>{post.tag}</span> : null}
      </div>
      <div className={styles.postBody}>
        <div className={styles.postTitle}>{post.title}</div>
        {post.desc ? <div className={styles.postDesc}>{post.desc}</div> : null}
      </div>
      {post.images.length > 0 ? (
        <div className={`${styles.postImages} ${imageClass}`}>
          {post.images.slice(0, 3).map((img) => (
            <img src={img} alt={post.title} key={img} />
          ))}
        </div>
      ) : null}
      <div className={styles.postActions}>
        <span className={`${styles.postAction} ${liked ? styles.liked : ''}`}>
          <i className={`${liked ? 'fa-solid' : 'fa-regular'} fa-heart`} />
          {formatCount(post.likes)}
        </span>
        <span className={styles.postAction}>
          <i className="fa-regular fa-comment" />
          {formatCount(post.comments)}
        </span>
        <button className={`${styles.postAction} ${styles.postShare}`} type="button" onClick={onSharePost}>
          <i className="fa-solid fa-share-nodes" />
          分享
        </button>
      </div>
    </article>
  );
}

export function MeActivitySections({
  tab,
  currentUser,
  activity,
  onChangeTab,
  onSharePost,
  onOpenCommunity,
}: MeActivitySectionsProps) {
  return (
    <>
      <section className={styles.tabs}>
        <button className={tab === 'works' ? styles.tabActive : styles.tab} type="button" onClick={() => onChangeTab('works')}>
          作品
        </button>
        <button className={tab === 'favs' ? styles.tabActive : styles.tab} type="button" onClick={() => onChangeTab('favs')}>
          收藏
        </button>
        <button className={tab === 'likes' ? styles.tabActive : styles.tab} type="button" onClick={() => onChangeTab('likes')}>
          喜欢
        </button>
      </section>

      <section className={tab === 'works' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}><i className="fa-solid fa-pen-to-square" /> 我发布的猜友圈</div>
        <div className={styles.postList}>
          {activity.works.length > 0 ? activity.works.map((post) => renderPostCard(post, currentUser, onSharePost)) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>✏️</div>
              <div className={styles.emptyTitle}>还没有发布过猜友圈</div>
              <div className={styles.emptyDesc}>分享你的竞猜心得，和猜友们互动吧！</div>
              <button className={styles.goBtn} type="button" onClick={onOpenCommunity}>
                <i className="fa-solid fa-pen" />
                去发布
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={tab === 'favs' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}><i className="fa-solid fa-bookmark" /> 我收藏的猜友圈</div>
        <div className={styles.postList}>
          {activity.bookmarks.length > 0 ? activity.bookmarks.map((post) => renderPostCard(post, currentUser, onSharePost)) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⭐</div>
              <div className={styles.emptyTitle}>还没有收藏过内容</div>
              <div className={styles.emptyDesc}>去猜友圈逛逛，收藏喜欢的帖子吧！</div>
              <button className={styles.goBtn} type="button" onClick={onOpenCommunity}>
                <i className="fa-solid fa-compass" />
                逛猜友圈
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={tab === 'likes' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}><i className="fa-solid fa-heart" /> 我点赞的猜友圈</div>
        <div className={styles.postList}>
          {activity.likes.length > 0 ? activity.likes.map((post) => renderPostCard(post, currentUser, onSharePost, true)) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>❤️</div>
              <div className={styles.emptyTitle}>还没有点赞过帖子</div>
              <div className={styles.emptyDesc}>去猜友圈逛逛，为喜欢的内容点赞吧！</div>
              <button className={styles.goBtn} type="button" onClick={onOpenCommunity}>
                <i className="fa-solid fa-compass" />
                逛猜友圈
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
