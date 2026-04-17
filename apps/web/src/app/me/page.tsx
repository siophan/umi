'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { demoProduct, demoProduct2, demoUser } from '../../lib/demo';
import styles from './page.module.css';

const posts = [
  {
    id: 'post-1',
    user: '优米鼠鼠',
    time: '2 小时前',
    tag: '猜友动态',
    title: '今天这波抢购节奏很快，竞猜和直购都能试一试。',
    desc: '我把自己的预测逻辑整理了一下，偏热的商品更值得先看竞猜。',
    images: [demoProduct.img, demoProduct2.img],
    likes: 18,
    comments: 3,
  },
  {
    id: 'post-2',
    user: '优米鼠鼠',
    time: '昨天',
    tag: '零食开箱',
    title: '换购到账的商品比我想象得更稳，仓库流程也顺了。',
    desc: '从竞猜到仓库，整个链路比之前更像一个完整产品。',
    images: [demoProduct2.img],
    likes: 9,
    comments: 1,
  },
];

const favorites = [
  { id: demoProduct.id, name: demoProduct.name, price: demoProduct.price, original: 999, img: demoProduct.img },
  { id: demoProduct2.id, name: demoProduct2.name, price: demoProduct2.price, original: 79, img: demoProduct2.img },
  {
    id: 'prod-3',
    name: '蓝莓冻干酸奶块',
    price: 39,
    original: 49,
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-4',
    name: '手冲咖啡礼盒',
    price: 129,
    original: 168,
    img: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&q=80',
  },
];

const shortcuts = [
  { label: '订单', href: '/orders', icon: '◫' },
  { label: '仓库', href: '/warehouse', icon: '▣' },
  { label: '竞猜历史', href: '/guess/guess-1', icon: '◎' },
  { label: '全部功能', href: '/login', icon: '⋯' },
] as const;

type BottomTab = {
  label: string;
  href: string;
  icon: string;
  center?: boolean;
  active?: boolean;
};

const bottomTabs: BottomTab[] = [
  { label: '首页', href: '/', icon: '⌂' },
  { label: '订单', href: '/orders', icon: '◫' },
  { label: '发布', href: '/login', icon: '＋', center: true },
  { label: '仓库', href: '/warehouse', icon: '▣' },
  { label: '我的', href: '/me', icon: '◉', active: true },
] as const;

export default function MePage() {
  const [tab, setTab] = useState<'works' | 'favs' | 'likes'>('works');
  const stats = useMemo(
    () => [
      { value: demoUser.following, label: '关注' },
      { value: demoUser.followers, label: '粉丝' },
      { value: demoUser.guesses, label: '竞猜' },
    ],
    [],
  );

  return (
    <main className={styles.page}>
      <section className={styles.cover}>
        <div className={styles.topbar}>
          <div className={styles.brand}>
            优米<span>U</span>
          </div>
          <div className={styles.actions}>
            <button type="button">⌕</button>
            <button type="button">⚙</button>
          </div>
        </div>
      </section>

      <section className={styles.main}>
        <div className={styles.avatarBox}>
          <img className={styles.avatar} src={demoProduct.img} alt={demoUser.name} />
          <div className={styles.avatarPlus}>＋</div>
        </div>

        <div className={styles.nameRow}>
          <h1>{demoUser.name}</h1>
          <span className={styles.levelTag}>Lv.7</span>
        </div>

        <div className={styles.uidRow}>
          <span>优米号 1008611</span>
          <button type="button">⌁</button>
        </div>

        <div className={styles.statsBar}>
          {stats.map((item) => (
            <button className={styles.statItem} key={item.label} type="button">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          ))}
          <button className={styles.editBtn} type="button">
            编辑资料
          </button>
        </div>

        <p className={styles.bio}>{demoUser.bio}</p>

        <div className={styles.funcRow}>
          {shortcuts.map((item) => (
            <Link className={styles.funcEntry} href={item.href} key={item.label}>
              <div className={styles.funcCircle}>
                <span>{item.icon}</span>
              </div>
              <span className={styles.funcText}>{item.label}</span>
            </Link>
          ))}
        </div>

        <button className={styles.openShop} type="button">
          <div className={styles.openShopIcon}>🏪</div>
          <div className={styles.openShopInfo}>
            <div className={styles.openShopTitle}>我要开店</div>
            <div className={styles.openShopDesc}>开通商家身份，发布全类型竞猜，关联商品赚佣金</div>
          </div>
          <span className={styles.openShopBtn}>立即开通</span>
        </button>

        <div className={styles.merchantBadge}>
          <span className={styles.merchantIcon}>✅</span>
          <div>
            <div className={styles.merchantTitle}>商家身份已开通</div>
            <div className={styles.merchantSub}>可发布全类型竞猜 · 关联商品 · 优惠券</div>
          </div>
        </div>
      </section>

      <section className={styles.tabs}>
        <button className={tab === 'works' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('works')}>
          作品
        </button>
        <button className={tab === 'favs' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('favs')}>
          收藏
        </button>
        <button className={tab === 'likes' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('likes')}>
          喜欢
        </button>
      </section>

      <section className={tab === 'works' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>我发布的猜友圈</div>
        <div className={styles.postList}>
          {posts.map((post) => (
            <article className={styles.postCard} key={post.id}>
              <div className={styles.postAuthor}>
                <img src={demoProduct.img} alt={post.user} />
                <div className={styles.postAuthorInfo}>
                  <div className={styles.postAuthorName}>{post.user}</div>
                  <div className={styles.postAuthorMeta}>{post.time}</div>
                </div>
                <span className={styles.postTag}>{post.tag}</span>
              </div>
              <div className={styles.postBody}>
                <div className={styles.postTitle}>{post.title}</div>
                <div className={styles.postDesc}>{post.desc}</div>
              </div>
              <div className={`${styles.postImages} ${post.images.length === 1 ? styles.cols1 : styles.cols2}`}>
                {post.images.map((img) => (
                  <img src={img} alt={post.title} key={img} />
                ))}
              </div>
              <div className={styles.postActions}>
                <span>♡ {post.likes}</span>
                <span>◎ {post.comments}</span>
                <span>↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={tab === 'favs' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>我收藏的猜友圈</div>
        <div className={styles.favGrid}>
          {favorites.map((item) => (
            <Link className={styles.favItem} href={`/product/${item.id}`} key={item.id}>
              <img src={item.img} alt={item.name} />
              <div className={styles.favBody}>
                <div className={styles.favName}>{item.name}</div>
                <div className={styles.favPrice}>
                  <small>¥</small>
                  {item.price}
                  <span>¥{item.original}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={tab === 'likes' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>我点赞的猜友圈</div>
        <div className={styles.postList}>
          {posts.slice(0, 1).map((post) => (
            <article className={styles.postCard} key={post.id}>
              <div className={styles.postAuthor}>
                <img src={demoProduct2.img} alt={post.user} />
                <div className={styles.postAuthorInfo}>
                  <div className={styles.postAuthorName}>{post.user}</div>
                  <div className={styles.postAuthorMeta}>{post.time}</div>
                </div>
                <span className={`${styles.postTag} ${styles.tagHot}`}>零食测评</span>
              </div>
              <div className={styles.postBody}>
                <div className={styles.postTitle}>{post.title}</div>
                <div className={styles.postDesc}>{post.desc}</div>
              </div>
              <div className={styles.postImages}>
                <img src={demoProduct2.img} alt={post.title} />
              </div>
              <div className={styles.postActions}>
                <span className={styles.liked}>♡ {post.likes}</span>
                <span>◎ {post.comments}</span>
                <span>↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <nav className={styles.bottomTabs}>
        {bottomTabs.map((item) => (
          <Link
            className={`${styles.bottomTab} ${item.active ? styles.bottomTabActive : ''} ${
              item.center ? styles.bottomTabCenter : ''
            }`}
            href={item.href}
            key={item.label}
          >
            <span className={styles.bottomIcon}>{item.icon}</span>
            <span className={styles.bottomText}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
