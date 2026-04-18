'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { demoProduct, demoProduct2, demoUser } from '../../lib/demo';
import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

const posts = [
  {
    id: 'post-1',
    user: '优米鼠鼠',
    time: '2 小时前',
    tag: '猜友动态',
    title: '今天这波抢购节奏很快，竞猜和直购都能试一试。',
    desc: '我把自己的预测逻辑整理了一下，偏热的商品更值得先看竞猜。',
    images: ['/legacy/images/guess/g001.jpg', '/legacy/images/products/p001-lays.jpg'],
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
    images: ['/legacy/images/products/p007-dove.jpg'],
    likes: 9,
    comments: 1,
  },
];

const favorites = [
  { id: demoProduct.id, name: demoProduct.name, price: demoProduct.price, original: 999, img: '/legacy/images/products/p001-lays.jpg' },
  { id: demoProduct2.id, name: demoProduct2.name, price: demoProduct2.price, original: 79, img: '/legacy/images/products/p003-squirrels.jpg' },
  {
    id: 'prod-3',
    name: '蓝莓冻干酸奶块',
    price: 39,
    original: 49,
    img: '/legacy/images/products/p005-liangpin.jpg',
  },
  {
    id: 'prod-4',
    name: '手冲咖啡礼盒',
    price: 129,
    original: 168,
    img: '/legacy/images/products/p009-genki.jpg',
  },
];

const shortcuts = [
  { label: '我的店铺', href: '/my-shop', icon: 'fa-solid fa-store' },
  { label: '我的仓库', href: '/warehouse', icon: 'fa-solid fa-box-archive', badge: 8 },
  { label: '我的订单', href: '/my-orders', icon: 'fa-solid fa-bag-shopping' },
  { label: '我的竞猜', href: '/guess-history', icon: 'fa-solid fa-clock-rotate-left' },
  { label: '全部功能', href: '/all-features', icon: 'fa-solid fa-ellipsis' },
] as const;

export default function MePage() {
  const [tab, setTab] = useState<'works' | 'favs' | 'likes'>('works');
  const isMerchant = false;
  const stats = useMemo(
    () => [
      { value: demoUser.following, label: '关注' },
      { value: demoUser.followers, label: '粉丝' },
      { value: '2,034', label: '获赞' },
    ],
    [],
  );

  return (
    <MobileShell tab="me" tone="light">
      <main className={styles.page}>
        <section className={styles.cover}>
          <div className={styles.topbar}>
            <div className={styles.brand}>
              优米
            </div>
            <div className={styles.actions}>
              <button type="button" aria-label="消息">
                <i className="fa-regular fa-comment-dots" />
                <span className={styles.topBadge}>3</span>
              </button>
              <button type="button" aria-label="好友" onClick={() => window.location.assign('/friends')}>
                <i className="fa-solid fa-user-group" />
              </button>
              <button type="button" aria-label="搜索" onClick={() => window.location.assign('/community-search')}>
                <i className="fa-solid fa-magnifying-glass" />
              </button>
              <button type="button" aria-label="设置">
                <i className="fa-solid fa-bars" />
              </button>
            </div>
          </div>
        </section>

        <section className={styles.main}>
          <div className={styles.avatarBox}>
            <img className={styles.avatar} src="/legacy/images/mascot/mouse-main.png" alt={demoUser.name} />
            <div className={styles.avatarPlus}>+</div>
          </div>

        <div className={styles.nameRow}>
          <h1>{demoUser.name}</h1>
          <span className={styles.nameBadge}>🌟</span>
          <span className={styles.levelTag}>Lv.7</span>
        </div>

        <div className={styles.uidRow}>
          <span>优米号：SnackHunter_001</span>
          <button type="button" aria-label="复制优米号">
            <i className="fa-regular fa-copy" />
          </button>
        </div>

        <div className={styles.statsBar}>
          {stats.map((item) => (
            <button className={styles.statItem} key={item.label} type="button">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          ))}
          <button className={styles.editBtn} type="button">
            编辑主页
          </button>
        </div>

        <p className={styles.bio}>零食是生活的甜味剂，竞猜是人生的小确幸。🍬✨</p>

        <div className={styles.funcRow}>
          {shortcuts.map((item) => (
            <Link className={styles.funcEntry} href={item.href} key={item.label}>
              <div className={styles.funcCircle}>
                <i className={item.icon} />
                {'badge' in item && item.badge ? (
                  <span className={styles.funcBadge}>{item.badge}</span>
                ) : null}
              </div>
              <span className={styles.funcText}>{item.label}</span>
            </Link>
          ))}
        </div>

          {!isMerchant ? (
            <button className={styles.openShop} type="button">
              <div className={styles.openShopIcon}>
                🏪
              </div>
              <div className={styles.openShopInfo}>
                <div className={styles.openShopTitle}>我要开店</div>
                <div className={styles.openShopDesc}>开通商家身份，发布全类型竞猜，关联商品赚佣金</div>
              </div>
              <span className={styles.openShopBtn}>立即开通</span>
            </button>
          ) : (
            <div className={styles.merchantBadge}>
              <span className={styles.merchantIcon}>
                <i className="fa-solid fa-circle-check" />
              </span>
              <div>
                <div className={styles.merchantTitle}>商家身份已开通</div>
                <div className={styles.merchantSub}>可发布全类型竞猜 · 关联商品 · 优惠券</div>
              </div>
            </div>
          )}
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
          <div className={styles.sectionTitle}><i className="fa-solid fa-pen-to-square" /> 我发布的猜友圈</div>
          <div className={styles.postList}>
            {posts.map((post) => (
              <article className={styles.postCard} key={post.id}>
                <div className={styles.postAuthor}>
                  <img src="/legacy/images/mascot/mouse-main.png" alt={post.user} />
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
                  <span>
                    <i className="fa-regular fa-heart" /> {post.likes}
                  </span>
                  <span>
                    <i className="fa-regular fa-comment-dots" /> {post.comments}
                  </span>
                  <span>
                    <i className="fa-solid fa-share-nodes" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={tab === 'favs' ? styles.panelActive : styles.panel}>
          <div className={styles.sectionTitle}><i className="fa-solid fa-bookmark" /> 我收藏的猜友圈</div>
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
          <div className={styles.sectionTitle}><i className="fa-solid fa-heart" /> 我点赞的猜友圈</div>
          <div className={styles.postList}>
            {posts.slice(0, 1).map((post) => (
              <article className={styles.postCard} key={post.id}>
                <div className={styles.postAuthor}>
                  <img src="/legacy/images/products/p007-dove.jpg" alt={post.user} />
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
                  <span className={styles.liked}>
                    <i className="fa-solid fa-heart" /> {post.likes}
                  </span>
                  <span>
                    <i className="fa-regular fa-comment-dots" /> {post.comments}
                  </span>
                  <span>
                    <i className="fa-solid fa-share-nodes" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
