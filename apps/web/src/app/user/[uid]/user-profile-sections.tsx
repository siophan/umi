'use client';

import styles from './page.module.css';

type ProfilePost = {
  id: string;
  tag: { text: string; cls?: string };
  title: string;
  desc: string;
  images: string[];
  likes: number;
  comments: number;
  time: string;
  author?: { name: string; avatar: string; verified?: boolean };
};

type ProfileViewModel = {
  id: string;
  uid: string;
  name: string;
  verified: boolean;
  level: string;
  bio: string;
  tags: string[];
  location: string;
  gender: string;
  age: string;
  cover: string;
  avatar: string;
  followers: number;
  following: number;
  wins: number;
  works: ProfilePost[];
  liked: ProfilePost[];
};

type UserProfileSectionsProps = {
  profile: ProfileViewModel;
  tab: 'works' | 'liked';
  following: boolean;
  scrolled: boolean;
  statItems: Array<{ value: number; label: string }>;
  likedPosts: Record<string, boolean>;
  visibility: { works: boolean; liked: boolean };
  followSaving: boolean;
  onBack: () => void;
  onCopyUid: () => void;
  onOpenChat: () => void;
  onToggleFollow: () => void;
  onToggleTab: (tab: 'works' | 'liked') => void;
  onToggleLike: (id: string) => void;
  onShare: () => void;
  onMore: () => void;
};

export function UserProfileSections({
  profile,
  tab,
  following,
  scrolled,
  statItems,
  likedPosts,
  visibility,
  followSaving,
  onBack,
  onCopyUid,
  onOpenChat,
  onToggleFollow,
  onToggleTab,
  onToggleLike,
  onShare,
  onMore,
}: UserProfileSectionsProps) {
  const renderPostCard = (post: ProfilePost, liked: boolean) => {
    const author = post.author ?? {
      name: profile.name,
      avatar: profile.avatar,
      verified: profile.verified,
    };

    return (
      <article className={styles.postCard} key={post.id}>
        <div className={styles.postAuthor}>
          <img src={author.avatar} alt={author.name} />
          <div className={styles.postAuthorInfo}>
            <div className={styles.postAuthorName}>
              {author.name}
              {author.verified ? <i className={`fa-solid fa-circle-check ${styles.postVerified}`} /> : null}
            </div>
            <div className={styles.postAuthorMeta}>{post.time}</div>
          </div>
          <span className={`${styles.postTag} ${post.tag.cls ? styles[post.tag.cls] : liked ? styles.tagHot : ''}`}>
            {post.tag.text}
          </span>
        </div>
        <div className={styles.postBody}>
          <div className={styles.postTitle}>{post.title}</div>
          <div className={styles.postDesc}>{post.desc}</div>
        </div>
        {post.images.length > 0 ? (
          <div className={`${styles.postImages} ${post.images.length === 1 ? styles.cols1 : post.images.length === 2 ? styles.cols2 : styles.cols3}`}>
            {post.images.map((img) => (
              <img src={img} alt={post.title} key={img} />
            ))}
          </div>
        ) : null}
        <div className={styles.postActions}>
          <button type="button" className={liked || likedPosts[post.id] ? styles.liked : ''} onClick={() => onToggleLike(post.id)}>
            <i className={`${liked || likedPosts[post.id] ? 'fa-solid' : 'fa-regular'} fa-heart`} /> {post.likes}
          </button>
          <span><i className="fa-regular fa-comment" /> {post.comments}</span>
          <button className={styles.postShare} type="button" onClick={onShare}>
            <i className="fa-solid fa-share-nodes" /> 分享
          </button>
        </div>
      </article>
    );
  };

  return (
    <>
      <header className={`${styles.topbar} ${scrolled ? styles.topbarScrolled : ''}`}>
        <button className={styles.backBtn} type="button" onClick={onBack}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.topName}>{profile.name}</div>
        <div className={styles.topRight}>
          <button type="button" aria-label="分享主页" onClick={onShare}>
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button type="button" aria-label="更多选项" onClick={onMore}>
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
      </header>

      <section className={styles.cover}>
        <img src={profile.cover} alt={profile.name} />
      </section>

      <section className={styles.info}>
        <img className={styles.avatar} src={profile.avatar} alt={profile.name} />
        <div className={styles.nameRow}>
          <span className={styles.name}>{profile.name}</span>
          {profile.verified ? <span className={styles.verified}><i className="fa-solid fa-circle-check" /></span> : null}
          <span className={styles.level}>{profile.level}</span>
        </div>
        <div className={styles.uid}>
          优米号：{profile.uid || '--'}
          {profile.location ? <> · IP: {profile.location}</> : null}
          {profile.gender ? <> · {profile.gender}</> : null}
          {profile.age ? <> · {profile.age}</> : null}
          <button className={styles.uidCopy} type="button" onClick={onCopyUid}>
            <i className="fa-regular fa-copy" />
          </button>
        </div>

        <div className={styles.stats}>
          {statItems.map((item) => (
            <div className={styles.stat} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
          <button className={styles.chatBtn} type="button" onClick={onOpenChat} disabled={!profile.id}>
            <i className="fa-regular fa-comment-dots" />
            私信
          </button>
          <button className={`${styles.followBtn} ${following ? styles.following : ''}`} type="button" onClick={onToggleFollow} disabled={!profile.id || followSaving}>
            {following ? (
              <>
                <i className="fa-solid fa-check" />
                已关注
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus" />
                关注
              </>
            )}
          </button>
        </div>

        <p className={styles.bio}>{profile.bio}</p>
        <div className={styles.tags}>
          {profile.tags.filter(Boolean).map((item) => (
            <span className={styles.tag} key={item}>
              {item}
            </span>
          ))}
          {profile.location ? (
            <span className={`${styles.tag} ${styles.tagLoc}`}>
              <i className="fa-solid fa-location-dot" />
              {profile.location}
            </span>
          ) : null}
          {profile.gender ? (
            <span className={`${styles.tag} ${styles.tagGender}`}>
              {profile.gender}
              {profile.age ? ` · ${profile.age}` : ''}
            </span>
          ) : null}
        </div>
      </section>

      <section className={styles.tabs}>
        <button className={tab === 'works' ? styles.tabActive : styles.tab} type="button" onClick={() => onToggleTab('works')}>
          作品
        </button>
        <button className={tab === 'liked' ? styles.tabActive : styles.tab} type="button" onClick={() => onToggleTab('liked')}>
          喜欢
        </button>
      </section>

      <section className={tab === 'works' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>
          <span><i className="fa-solid fa-pen-to-square" /></span> TA发布的猜友圈
        </div>
        <div className={styles.postList}>
          {profile.works.length > 0 ? (
            profile.works.map((post) => renderPostCard(post, false))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📝</div>
              <div className={styles.emptyTitle}>{visibility.works ? 'TA还没有发布过猜友圈' : '作品内容已设为不可见'}</div>
              <div className={styles.emptyDesc}>{visibility.works ? '关注TA，第一时间获取新动态' : '当前仅自己或好友可见'}</div>
            </div>
          )}
        </div>
      </section>

      <section className={tab === 'liked' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>
          <span><i className="fa-solid fa-heart" /></span> TA点赞的猜友圈
        </div>
        <div className={styles.postList}>
          {profile.liked.length > 0 ? (
            profile.liked.map((post) => renderPostCard(post, true))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💗</div>
              <div className={styles.emptyTitle}>{visibility.liked ? 'TA还没有点赞过帖子' : '喜欢列表已设为不可见'}</div>
              <div className={styles.emptyDesc}>{visibility.liked ? '暂无喜欢的内容' : '当前仅自己可见'}</div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
