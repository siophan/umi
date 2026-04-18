'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { MobileShell } from '../../components/mobile-shell';
import styles from './page.module.css';

type FeedItem = {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  tag: { text: string; cls: string };
  title: string;
  desc: string;
  images: string[];
  guessInfo?: {
    id: string;
    options: [string, string];
    participants: number;
    pcts: [number, number];
  };
  likes: number;
  comments: number;
  shares: number;
  time: string;
  liked?: boolean;
  bookmarked?: boolean;
  scope?: 'public' | 'friends' | 'fans' | 'private';
};

const TAG_CLS_MAP: Record<string, string> = {
  '品牌竞猜': styles.tagBrand,
  '猜友动态': styles.tagCommunity,
  '品牌资讯': styles.tagBrand,
  '零食测评': styles.tagHot,
  'PK战报': styles.tagPk,
  '平台公告': styles.tagBrand,
  '店铺动态': styles.tagHot,
  '店铺推荐': styles.tagHot,
  '转发': styles.tagCommunity,
};

const hotTopics = [
  { icon: 'fa-solid fa-fire', text: '德芙vs费列罗', href: '/post/post-1' },
  { icon: 'fa-solid fa-trophy', text: '马年年货王', href: '/post/post-2' },
  { icon: 'fa-solid fa-bullseye', text: '薯片新口味', href: '/post/post-3' },
  { icon: 'fa-solid fa-chart-simple', text: '本周胜率榜', href: '/ranking' },
  { icon: 'fa-solid fa-gift', text: '情人节竞猜', href: '/guess/guess-1' },
  { icon: 'fa-solid fa-star', text: '热门竞猜', href: '/guess/guess-2' },
];

const followedUsers = [
  { name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', hasNew: true },
  { name: '零食达人小王', avatar: '/legacy/images/mascot/mouse-main.png', hasNew: false },
  { name: '三只松鼠', avatar: '/legacy/images/products/p003-squirrels.jpg', hasNew: false },
  { name: '德芙官方', avatar: '/legacy/images/products/p007-dove.jpg', hasNew: true },
];

const feedData: FeedItem[] = [
  {
    id: 'post-1',
    author: { name: '乐事官方旗舰店', avatar: '/legacy/images/products/p001-lays.jpg', verified: true },
    tag: { text: '品牌竞猜', cls: TAG_CLS_MAP['品牌竞猜'] },
    title: '乐事2026马年限定口味投票开启！番茄味 vs 黄瓜味',
    desc: '参与竞猜赢正品零食大礼包，猜中直接发货到家。当前3890人参与！',
    images: ['/legacy/images/guess/g001.jpg'],
    guessInfo: { id: 'guess-1', options: ['番茄味', '黄瓜味'], participants: 3890, pcts: [58, 42] },
    likes: 2341,
    comments: 456,
    shares: 89,
    time: '15分钟前',
    liked: true,
    bookmarked: false,
    scope: 'public',
  },
  {
    id: 'post-2',
    author: { name: '零食测评官', avatar: '/legacy/images/guess/g202.jpg', verified: false },
    tag: { text: '零食测评', cls: TAG_CLS_MAP['零食测评'] },
    title: '2026年度十大零食品牌排行榜出炉！三只松鼠再登榜首',
    desc: '根据全平台销售数据与用户口碑综合评选，看看你喜欢的品牌有没有上榜。',
    images: ['/legacy/images/products/p002-oreo.jpg', '/legacy/images/products/p005-liangpin.jpg'],
    likes: 8723,
    comments: 1204,
    shares: 188,
    time: '1小时前',
    liked: false,
    bookmarked: true,
    scope: 'friends',
  },
  {
    id: 'post-3',
    author: { name: '品牌观察员', avatar: '/legacy/images/products/p009-genki.jpg', verified: false },
    tag: { text: '品牌资讯', cls: TAG_CLS_MAP['品牌资讯'] },
    title: '新品试吃开箱：今年最值得期待的年货礼盒',
    desc: '这期给大家看一下礼盒开箱和口味预测，最后还会附上开奖时间。',
    images: ['/legacy/images/guess/g202.jpg'],
    likes: 5031,
    comments: 681,
    shares: 96,
    time: '3小时前',
    liked: false,
    bookmarked: false,
    scope: 'fans',
  },
];

const myProfile = {
  name: '我',
  avatar: '/legacy/images/mascot/mouse-main.png',
};

export default function CommunityPage() {
  const [tab, setTab] = useState<'recommend' | 'follow'>('recommend');
  const [publishOpen, setPublishOpen] = useState(false);

  const visibleFeed = useMemo(() => (tab === 'recommend' ? feedData : feedData.slice(0, 2)), [tab]);

  return (
    <MobileShell tab="community" tone="light">
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.title}>
            猜友<span>圈</span>
          </div>
          <div className={styles.spacer} />
          <button className={styles.iconBtn} type="button" onClick={() => window.location.assign('/community-search')}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button className={styles.iconBtn} type="button">
            <i className="fa-regular fa-bell" />
          </button>
        </header>

        <nav className={styles.tabs}>
          <button className={tab === 'recommend' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('recommend')}>
            为您推荐
          </button>
          <button className={tab === 'follow' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('follow')}>
            你的关注
          </button>
        </nav>

        {tab === 'follow' ? (
          <section className={styles.followBar}>
            <div className={styles.followBarTitle}>
              <span>我关注的猜友</span>
              <Link href="/friends">管理关注 <i className="fa-solid fa-chevron-right" /></Link>
            </div>
            <div className={styles.followScroll}>
              {followedUsers.map((item) => (
                <button className={styles.followItem} key={item.name} type="button">
                  <div className={styles.followAvatarWrap}>
                    <img className={`${styles.followAvatar} ${item.hasNew ? styles.followAvatarNew : styles.followAvatarOld}`} src={item.avatar} alt={item.name} />
                    {item.hasNew ? <span className={styles.followDot} /> : null}
                  </div>
                  <span className={styles.followName}>{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.banner}>
          <img src="/legacy/images/products/p001-lays.jpg" alt="热门竞猜" />
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerTag}><i className="fa-solid fa-fire" /> 热门竞猜</div>
            <div className={styles.bannerTitle}>马年糖果品牌大战：德芙 vs 费列罗，谁能称王？</div>
          </div>
        </section>

        <section className={styles.hotBar}>
          {hotTopics.map((item) => (
            <Link className={styles.hotItem} href={item.href} key={item.text}>
              <i className={item.icon} /> {item.text}
            </Link>
          ))}
        </section>

        <section className={styles.feed}>
          {visibleFeed.map((item) => (
            <article className={styles.card} key={item.id}>
              <header className={styles.authorRow}>
                <button
                  className={styles.authorAvatarBtn}
                  type="button"
                  onClick={() => window.location.assign(`/user/${encodeURIComponent(item.author.name)}`)}
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
                        <i
                          className={`fa-solid ${
                            item.scope === 'friends' ? 'fa-user-group' : item.scope === 'fans' ? 'fa-heart' : 'fa-lock'
                          }`}
                        />{' '}
                        {item.scope === 'friends' ? '好友可见' : item.scope === 'fans' ? '粉丝可见' : '仅自己'}
                      </>
                    ) : null}
                  </div>
                </div>
                <span className={`${styles.tag} ${item.tag.cls}`}>{item.tag.text}</span>
              </header>

              <div className={styles.body}>
                <h2 className={styles.titleText}>{item.title}</h2>
                <p className={styles.descText}>{item.desc}</p>
              </div>

              <div className={`${styles.images} ${item.images.length === 1 ? styles.img1 : item.images.length === 2 ? styles.img2 : styles.img3}`}>
                {item.images.map((src) => (
                  <img src={src} alt={item.title} key={src} />
                ))}
              </div>

              {item.guessInfo ? (
                <button
                  className={styles.guessBar}
                  type="button"
                  onClick={() => window.location.assign(`/guess/${item.guessInfo?.id}`)}
                >
                  <div className={styles.guessIcon}><i className="fa-solid fa-bullseye" /></div>
                  <div className={styles.guessInfo}>
                    <div className={styles.guessTitle}>{item.guessInfo.options.join(' vs ')}</div>
                    <div className={styles.guessData}>{item.guessInfo.participants}人参与</div>
                  </div>
                  <span className={styles.guessBtn}>去竞猜</span>
                </button>
              ) : null}

              {item.guessInfo ? (
                <div className={styles.pkMini}>
                  <div className={`${styles.pkSeg} ${styles.pkSeg0}`} style={{ width: `${item.guessInfo.pcts[0]}%` }}>
                    {item.guessInfo.pcts[0]}%
                  </div>
                  <div className={`${styles.pkSeg} ${styles.pkSeg1}`} style={{ width: `${item.guessInfo.pcts[1]}%` }}>
                    {item.guessInfo.pcts[1]}%
                  </div>
                </div>
              ) : null}

              <footer className={styles.actions}>
                <button className={styles.actionItem} type="button">
                  <i className={`fa-${item.liked ? 'solid' : 'regular'} fa-heart ${item.liked ? styles.actionLiked : ''}`} /> {item.likes}
                </button>
                <button className={styles.actionItem} type="button">
                  <i className="fa-regular fa-comment" /> {item.comments}
                </button>
                <button className={styles.actionItem} type="button">
                  <i className="fa-solid fa-share-nodes" /> {item.shares}
                </button>
                <button className={`${styles.actionItem} ${item.bookmarked ? styles.favorited : ''}`} type="button">
                  <i className={`fa-${item.bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
                </button>
              </footer>
            </article>
          ))}
        </section>

        <div className={styles.loadMore}>
          <i className="fa-solid fa-spinner fa-spin" /> 加载更多动态...
        </div>

        <button className={styles.publishFab} type="button" onClick={() => setPublishOpen(true)}>
          <i className="fa-solid fa-pen-to-square" />
        </button>

        {publishOpen ? (
          <div className={styles.publishOverlay} onClick={() => setPublishOpen(false)} role="presentation">
            <section className={styles.publishPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.handle} />
              <div className={styles.publishHeader}>
                <h3>发布动态</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setPublishOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className={styles.publishUser}>
                <img src={myProfile.avatar} alt={myProfile.name} />
                <div className={styles.publishUserName}>{myProfile.name}</div>
                <button className={styles.publishScope} type="button">
                  <i className="fa-solid fa-earth-americas" /> 所有人 <i className="fa-solid fa-chevron-down" />
                </button>
              </div>
              <textarea className={styles.textarea} placeholder="分享你的竞猜心得、零食测评、PK战报..." />
              <div className={styles.mediaRow}>
                <button className={styles.mediaBtn} type="button">
                  <i className="fa-solid fa-image" />
                  <span>图片</span>
                </button>
                <button className={styles.mediaBtn} type="button">
                  <i className="fa-solid fa-video" />
                  <span>视频</span>
                </button>
              </div>
              <div className={styles.topics}>
                {[
                  { icon: 'fa-solid fa-bullseye', text: '竞猜心得' },
                  { icon: 'fa-solid fa-cookie-bite', text: '零食测评' },
                  { icon: 'fa-solid fa-handshake', text: 'PK战报' },
                  { icon: 'fa-solid fa-fire', text: '热门话题' },
                  { icon: 'fa-solid fa-chart-simple', text: '数据分析' },
                  { icon: 'fa-regular fa-lightbulb', text: '攻略分享' },
                ].map((item) => (
                  <button className={styles.topicTag} type="button" key={item.text}>
                    <i className={item.icon} /> {item.text}
                  </button>
                ))}
              </div>
              <div className={styles.toolbar}>
                <button className={styles.toolbarItem} type="button">
                  <i className="fa-solid fa-location-dot" />
                  <span>位置</span>
                </button>
                <button className={styles.toolbarItem} type="button">
                  <i className="fa-solid fa-at" />
                  <span>@好友</span>
                </button>
                <button className={styles.toolbarItem} type="button">
                  <i className="fa-solid fa-link" />
                  <span>竞猜</span>
                </button>
                <button className={styles.toolbarItem} type="button">
                  <i className="fa-regular fa-face-smile" />
                  <span>表情</span>
                </button>
              </div>
              <button className={styles.submitBtn} type="button">
                <i className="fa-solid fa-paper-plane" /> 发布动态
              </button>
            </section>
          </div>
        ) : null}
      </main>
    </MobileShell>
  );
}
