'use client';

import Link from 'next/link';

import styles from './page.module.css';
import type { FeedItem, HotTopic } from './page-helpers';

type CommunityRecommendHighlightsProps = {
  heroPost: FeedItem | null;
  hotTopics: HotTopic[];
  onOpenPost: (postId: string) => void;
};

export function CommunityRecommendHighlights({
  heroPost,
  hotTopics,
  onOpenPost,
}: CommunityRecommendHighlightsProps) {
  return (
    <>
      {heroPost ? (
        <button className={styles.banner} type="button" onClick={() => onOpenPost(heroPost.id)}>
          <img src={heroPost.images[0] || heroPost.author.avatar || '/legacy/images/mascot/mouse-main.png'} alt={heroPost.title} />
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerTag}>🔥 社区热议</div>
            <div className={styles.bannerTitle}>{heroPost.title}</div>
          </div>
        </button>
      ) : null}

      <section className={styles.hotBar}>
        {hotTopics.map((item) => (
          <Link className={styles.hotItem} href={item.href} key={item.text}>
            <span>🔥</span>
            {item.text}
          </Link>
        ))}
      </section>
    </>
  );
}
