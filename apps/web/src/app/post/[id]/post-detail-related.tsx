'use client';

import Link from 'next/link';

import type { CommunityFeedItem } from '@umi/shared';

import { formatCount } from './post-detail-helpers';
import styles from './page.module.css';

type PostDetailRelatedProps = {
  related: CommunityFeedItem[];
};

export function PostDetailRelated({ related }: PostDetailRelatedProps) {
  return (
    <section className={styles.related}>
      <div className={styles.relatedTitle}>
        <span><i className="fa-solid fa-thumbs-up" /></span> 相关推荐
      </div>
      <div className={styles.relatedList}>
        {related.length ? related.map((item) => (
          <Link className={styles.relatedItem} href={`/post/${item.id}`} key={item.id}>
            {item.images.length ? (
              <img className={styles.relatedThumb} src={item.images[0]} alt={item.title} />
            ) : (
              <div className={styles.relatedFallback}>
                <i className="fa-solid fa-fire" />
              </div>
            )}
            <div className={styles.relatedInfo}>
              <div className={styles.relatedName}>{item.title}</div>
              <div className={styles.relatedMeta}>{item.author.name} · {formatCount(item.likes)}赞</div>
            </div>
          </Link>
        )) : (
          <div className={styles.relatedMeta}>暂无更多相关推荐</div>
        )}
      </div>
    </section>
  );
}
