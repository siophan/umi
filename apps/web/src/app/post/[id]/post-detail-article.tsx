'use client';

import Link from 'next/link';
import type { CommunityPostDetailResult } from '@umi/shared';

import { formatCount, formatRelativeTime, guessLabel } from './post-detail-helpers';
import styles from './page.module.css';

type PostDetailArticleProps = {
  post: CommunityPostDetailResult['post'];
  imageClass: string;
  tagClass: string;
  likeSaving: boolean;
  bookmarkSaving: boolean;
  totalCommentCount: number;
  onOpenUser: (uid: string) => void;
  onOpenGuess: (guessId: string) => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onToggleBookmark: () => void;
};

export function PostDetailArticle({
  post,
  imageClass,
  tagClass,
  likeSaving,
  bookmarkSaving,
  totalCommentCount,
  onOpenUser,
  onOpenGuess,
  onToggleLike,
  onOpenComments,
  onOpenShare,
  onToggleBookmark,
}: PostDetailArticleProps) {
  return (
    <article className={styles.card}>
      <button className={styles.cardAuthor} type="button" onClick={() => onOpenUser(post.author.uid)}>
        <img src={post.author.avatar || '/legacy/images/mascot/mouse-main.png'} alt={post.author.name} />
        <div className={styles.cardAuthorInfo}>
          <div className={styles.cardAuthorName}>
            {post.author.name}
            {post.author.verified ? <span><i className="fa-solid fa-circle-check" /></span> : null}
          </div>
          <div className={styles.cardAuthorMeta}>
            <span>{formatRelativeTime(post.createdAt)}</span>
            {post.location ? (
              <span className={styles.cardAuthorLoc}>
                <i className="fa-solid fa-location-dot" />
                {post.location}
              </span>
            ) : null}
          </div>
        </div>
      </button>

      <div className={styles.content}>
        {post.title ? <h1 className={styles.title}>{post.title}</h1> : null}
        <p className={styles.text}>{post.desc}</p>
        <div className={styles.tags}>
          <span className={tagClass}>{guessLabel(post)}</span>
          {post.scope !== 'public' ? <span className={styles.tagHot}>{post.scope === 'followers' ? '粉丝可见' : '仅自己'}</span> : null}
        </div>
      </div>

      {post.images.length ? (
        <div className={styles.images}>
          <div className={imageClass}>
            {post.images.map((img) => (
              <img src={img} alt={post.title} key={img} />
            ))}
          </div>
        </div>
      ) : null}

      {post.guessInfo ? (
        <section className={styles.guessBar}>
          <div className={styles.guessHead}>
            <div className={styles.guessTitle}>
              <i className="fa-solid fa-bullseye" /> 参与竞猜
            </div>
            <span className={styles.guessCount}>{formatCount(post.guessInfo.participants)}人参与</span>
          </div>
          <div className={styles.guessOptions}>
            {post.guessInfo.options.map((item, index) => (
              <button className={styles.guessOption} key={item} type="button" onClick={() => onOpenGuess(post.guessInfo!.id)}>
                <div className={styles.guessName}>{item}</div>
                <div className={styles.guessBarWrap}>
                  <span style={{ width: `${post.guessInfo!.pcts[index] ?? 0}%` }} />
                </div>
                <div className={styles.guessPct}>{post.guessInfo!.pcts[index] ?? 0}%</div>
              </button>
            ))}
          </div>
          <div className={styles.guessCta}>
            <Link href={`/guess/${post.guessInfo.id}`}>去参与竞猜 <i className="fa-solid fa-arrow-right" /></Link>
          </div>
        </section>
      ) : null}

      <section className={styles.interact}>
        <button className={`${styles.interactItem} ${post.liked ? styles.active : ''}`} type="button" disabled={likeSaving} onClick={onToggleLike}>
          <i className={`${post.liked ? 'fa-solid' : 'fa-regular'} fa-heart`} /> <span>{formatCount(post.likes)}</span>
        </button>
        <button className={styles.interactItem} type="button" onClick={onOpenComments}>
          <i className="fa-regular fa-comment" /> <span>{formatCount(totalCommentCount)}</span>
        </button>
        <button className={styles.interactItem} type="button" onClick={onOpenShare}>
          <i className="fa-solid fa-share-nodes" /> <span>{formatCount(post.shares)}</span>
        </button>
        <button className={`${styles.interactItem} ${post.bookmarked ? styles.faved : ''}`} type="button" disabled={bookmarkSaving} onClick={onToggleBookmark}>
          <i className={`${post.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark`} />
        </button>
      </section>
    </article>
  );
}
