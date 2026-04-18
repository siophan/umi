'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import styles from './page.module.css';

const authors = {
  'post-1': {
    name: '乐事官方旗舰店',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Lays&backgroundColor=e53935',
    title: '乐事2026马年限定口味投票开启！番茄味 vs 黄瓜味',
    text: '参与竞猜赢正品零食大礼包，猜中直接发货到家。当前3890人参与！',
    tag: { text: '品牌竞猜', cls: styles.tagBrand },
    images: ['https://picsum.photos/seed/post1/900/540'],
    guess: true,
  },
  default: {
    name: '优米数据中心',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Data',
    title: '2026年度十大零食品牌排行榜出炉！三只松鼠再登榜首',
    text: '根据全平台销售数据与用户口碑综合评选...',
    tag: { text: '零食测评', cls: styles.tagHot },
    images: ['https://picsum.photos/seed/post2/900/540', 'https://picsum.photos/seed/post3/900/540'],
    guess: true,
  },
};

const comments = [
  {
    id: 'c1',
    author: '零食测评官',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tester',
    time: '1小时前',
    text: '这波我觉得会很快冲上热搜，标题就很有爆点。',
    likes: 18,
    replies: [
      { name: '优米鼠鼠', text: '我也觉得会。', time: '刚刚' },
      { name: 'Mika', text: '数据看起来很稳。', time: '5分钟前' },
    ],
  },
  {
    id: 'c2',
    author: '吃货小分队',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Foodie',
    time: '2小时前',
    text: '标题和图片都很强，评论区很容易热起来。',
    likes: 6,
    replies: [],
  },
];

const related = [
  { id: 'post-2', title: '2026年度十大零食品牌排行榜出炉', meta: '5.8万浏览' },
  { id: 'post-3', title: '实测全网最辣辣条！卫龙 vs 源氏', meta: '2.3万浏览' },
];

export default function PostDetailPage() {
  const params = useSearchParams();
  const id = params.get('id') || 'post-1';
  const post = authors[id as keyof typeof authors] || authors.default;
  const [shareOpen, setShareOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [comment, setComment] = useState('');

  const imageClass = useMemo(() => {
    if (post.images.length === 1) return styles.img1;
    if (post.images.length === 2) return styles.img2;
    return styles.img3;
  }, [post.images.length]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => history.back()}>
          ←
        </button>
        <div className={styles.headerAuthor}>
          <img src={post.avatar} alt={post.name} />
          <div className={styles.authorInfo}>
            <div className={styles.authorName}>{post.name}</div>
            <div className={styles.authorMeta}>优米号 · 16:30 发布</div>
          </div>
          <button className={styles.followBtn} type="button">
            + 关注
          </button>
        </div>
        <button className={styles.moreBtn} type="button" onClick={() => setShareOpen(true)}>
          ⋯
        </button>
      </header>

      <article className={styles.card}>
        <div className={styles.cardAuthor}>
          <img src={post.avatar} alt={post.name} />
          <div className={styles.cardAuthorInfo}>
            <div className={styles.cardAuthorName}>
              {post.name} <span>✓</span>
            </div>
            <div className={styles.cardAuthorMeta}>
              <span>优米号 1008611</span>
              <span>· 上海</span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.text}>{post.text}</p>
          <div className={styles.tags}>
            <span className={post.tag.cls}>{post.tag.text}</span>
            <span className={styles.tagBrand}>平台公告</span>
            <span className={styles.tagHot}>热搜</span>
          </div>
        </div>

        <div className={styles.images}>
          <div className={imageClass}>
            {post.images.map((img) => (
              <img src={img} alt={post.title} key={img} />
            ))}
          </div>
        </div>

        {post.guess ? (
          <section className={styles.guessBar}>
            <div className={styles.guessHead}>
              <div className={styles.guessTitle}>竞猜价格</div>
              <span className={styles.guessCount}>3890人参与</span>
            </div>
            <div className={styles.guessOptions}>
              {['会', '不会'].map((item, index) => (
                <button className={styles.guessOption} key={item} type="button">
                  <div className={styles.guessName}>{item}</div>
                  <div className={styles.guessBarWrap}>
                    <span style={{ width: index === 0 ? '58%' : '42%' }} />
                  </div>
                  <div className={styles.guessPct}>{index === 0 ? '58%' : '42%'}</div>
                </button>
              ))}
            </div>
            <div className={styles.guessCta}>
              <Link href="/guess/guess-1">去参与竞猜 →</Link>
            </div>
          </section>
        ) : null}

        <section className={styles.interact}>
          <button className={`${styles.interactItem} ${liked ? styles.active : ''}`} type="button" onClick={() => setLiked((v) => !v)}>
            ♡ <span>{liked ? '已赞' : '点赞'}</span>
          </button>
          <button className={`${styles.interactItem} ${faved ? styles.faved : ''}`} type="button" onClick={() => setFaved((v) => !v)}>
            ★ <span>{faved ? '已收藏' : '收藏'}</span>
          </button>
          <button className={styles.interactItem} type="button" onClick={() => setShareOpen(true)}>
            ↗ <span>分享</span>
          </button>
        </section>
      </article>

      <section className={styles.comments}>
        <div className={styles.commentsHeader}>
          <div>
            <span className={styles.commentsTitle}>评论</span>
            <span className={styles.commentsCount}>{comments.length} 条</span>
          </div>
          <button className={styles.sortBtn} type="button">
            ▾ 热门
          </button>
        </div>
        {comments.map((item) => (
          <article className={styles.comment} key={item.id}>
            <img className={styles.commentAvatar} src={item.avatar} alt={item.author} />
            <div className={styles.commentBody}>
              <div className={styles.commentTop}>
                <div className={styles.commentName}>{item.author}</div>
                <div className={styles.commentTime}>{item.time}</div>
              </div>
              <div className={styles.commentText}>{item.text}</div>
              <div className={styles.commentActions}>
                <span>回复</span>
                <span>转发</span>
              </div>
              {item.replies.length ? (
                <div className={styles.replies}>
                  {item.replies.map((reply, index) => (
                    <div className={styles.reply} key={`${reply.name}-${index}`}>
                      <div className={styles.replyHead}>
                        <span>{reply.name}</span>
                        <em>回复</em>
                      </div>
                      <div className={styles.replyText}>{reply.text}</div>
                      <div className={styles.replyMeta}>{reply.time}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <button className={styles.likeBtn} type="button">
              ♡ {item.likes}
            </button>
          </article>
        ))}
      </section>

      <section className={styles.related}>
        <div className={styles.relatedTitle}>
          <span>✦</span> 相关推荐
        </div>
        <div className={styles.relatedList}>
          {related.map((item) => (
            <Link className={styles.relatedItem} href={`/post/${item.id}`} key={item.id}>
              <div className={styles.relatedInfo}>
                <div className={styles.relatedName}>{item.title}</div>
                <div className={styles.relatedMeta}>{item.meta}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.inputBar}>
        <input
          className={styles.input}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="说点什么..."
        />
        <button className={styles.emojiBtn} type="button">
          ☺
        </button>
        <button className={styles.sendBtn} type="button" disabled={!comment.trim()}>
          发送
        </button>
      </footer>

      {shareOpen ? (
        <div className={styles.shareOverlay} onClick={() => setShareOpen(false)} role="presentation">
          <section className={styles.sharePanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.shareGrab} />
            <div className={styles.shareTitle}>分享到</div>
            <div className={styles.shareGrid}>
              {[
                { label: '微信', icon: '◎', bg: '#07C160' },
                { label: '朋友圈', icon: '◉', bg: '#07C160' },
                { label: 'QQ', icon: '◍', bg: '#12B7F5' },
                { label: '微博', icon: '◌', bg: '#E6162D' },
                { label: '复制链接', icon: '⌁', bg: '#f0f0f0' },
                { label: '举报', icon: '⚑', bg: '#f0f0f0' },
                { label: '收藏', icon: '★', bg: '#FFF3E0' },
                { label: '保存图片', icon: '⬇', bg: '#f0f0f0' },
              ].map((item) => (
                <button className={styles.shareItem} key={item.label} type="button">
                  <span style={{ background: item.bg }}>{item.icon}</span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>
            <button className={styles.cancelBtn} type="button" onClick={() => setShareOpen(false)}>
              取消
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
