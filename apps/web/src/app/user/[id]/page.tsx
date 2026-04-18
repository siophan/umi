'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import styles from './page.module.css';

const profileDB: Record<
  string,
  {
    name: string;
    verified: boolean;
    level: string;
    bio: string;
    tags: string[];
    cover: string;
    avatar: string;
    works: Array<{
      id: string;
      tag: string;
      title: string;
      desc: string;
      images: string[];
      likes: number;
      comments: number;
      time: string;
    }>;
    liked: Array<{
      id: string;
      tag: string;
      title: string;
      desc: string;
      images: string[];
      likes: number;
      comments: number;
      time: string;
    }>;
  }
> = {
  '乐事官方旗舰店': {
    name: '乐事官方旗舰店',
    verified: true,
    level: 'Lv.6 零食大王',
    bio: '乐事中国官方账号 🥔\n分享美味零食，发起趣味竞猜！\n每月新品抢先体验~',
    tags: ['品牌认证', '零食', '美食'],
    cover: 'https://picsum.photos/seed/user1/1200/720',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Lays&backgroundColor=e53935',
    works: [
      { id: 'w1', tag: '品牌竞猜', title: '乐事2026马年限定口味投票开启！番茄味 vs 黄瓜味', desc: '参与竞猜赢正品零食大礼包，猜中直接发货到家。当前3890人参与！', images: ['https://picsum.photos/seed/productsp001/400/400'], likes: 2341, comments: 456, time: '15分钟前' },
      { id: 'w2', tag: '新品预告', title: '乐事春季限定新口味即将揭晓！黄瓜味 vs 烧烤味', desc: '下一轮竞猜即将开启，敬请期待！参与即有机会获得新品试吃装。', images: ['https://picsum.photos/seed/productsp006/400/400', 'https://picsum.photos/seed/productsp002/400/400'], likes: 1890, comments: 320, time: '3小时前' },
    ],
    liked: [
      { id: 'l1', tag: '零食测评', title: '2026年度十大零食品牌排行榜出炉！三只松鼠再登榜首', desc: '根据全平台销售数据与用户口碑综合评选...', images: ['https://picsum.photos/seed/productsp003/400/400', 'https://picsum.photos/seed/productsp007/400/400'], likes: 8723, comments: 1204, time: '1小时前' },
    ],
  },
  default: {
    name: '零食测评官',
    verified: false,
    level: 'Lv.5 美食家',
    bio: '专业零食测评 🍿\n吃遍天下零食，只为找到最好吃的那一款！\n合作请私信~',
    tags: ['测评达人', '美食博主'],
    cover: 'https://picsum.photos/seed/user2/1200/720',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tester',
    works: [
      { id: 'w1', tag: '零食测评', title: '2026年度十大零食品牌排行榜出炉！', desc: '根据全平台销售数据与用户口碑综合评选...', images: ['https://picsum.photos/seed/productsp003/400/400'], likes: 8723, comments: 1204, time: '1小时前' },
    ],
    liked: [
      { id: 'l1', tag: '品牌竞猜', title: '乐事2026马年限定口味投票开启！', desc: '参与竞猜赢正品零食大礼包', images: ['https://picsum.photos/seed/productsp001/400/400'], likes: 2341, comments: 456, time: '15分钟前' },
    ],
  },
};

export default function UserProfilePage() {
  const params = useSearchParams();
  const name = decodeURIComponent(params.get('name') || '乐事官方旗舰店');
  const profile = profileDB[name] || profileDB.default;
  const [tab, setTab] = useState<'works' | 'liked'>('works');
  const [following, setFollowing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const statItems = useMemo(
    () => [
      { value: 125600, label: '粉丝' },
      { value: 38, label: '关注' },
      { value: 892000, label: '喜欢' },
    ],
    [],
  );

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} type="button" onClick={() => history.back()}>
          ←
        </button>
        <div className={styles.topName}>{profile.name}</div>
        <div className={styles.topRight}>
          <button type="button" onClick={() => setChatOpen(true)}>
            ✉
          </button>
          <button type="button">
            ⋯
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
          {profile.verified ? <span className={styles.verified}>✓</span> : null}
          <span className={styles.level}>{profile.level}</span>
        </div>
        <div className={styles.uid}>
          优米号 1008611 <span>⌁</span>
        </div>

        <div className={styles.stats}>
          {statItems.map((item) => (
            <div className={styles.stat} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
          <button className={styles.followBtn} type="button" onClick={() => setFollowing((v) => !v)}>
            {following ? '已关注' : '+ 关注'}
          </button>
          <button className={styles.chatBtn} type="button" onClick={() => setChatOpen(true)}>
            私信
          </button>
        </div>

        <p className={styles.bio}>{profile.bio}</p>
        <div className={styles.tags}>
          {profile.tags.map((item) => (
            <span className={styles.tag} key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.tabs}>
        <button className={tab === 'works' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('works')}>
          作品
        </button>
        <button className={tab === 'liked' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('liked')}>
          喜欢
        </button>
      </section>

      <section className={tab === 'works' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>
          <span>✎</span> TA发布的猜友圈
        </div>
        <div className={styles.postList}>
          {profile.works.map((post) => (
            <article className={styles.postCard} key={post.id}>
              <div className={styles.postAuthor}>
                <img src={profile.avatar} alt={profile.name} />
                <div className={styles.postAuthorInfo}>
                  <div className={styles.postAuthorName}>{profile.name}</div>
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

      <section className={tab === 'liked' ? styles.panelActive : styles.panel}>
        <div className={styles.sectionTitle}>
          <span>♥</span> TA点赞的猜友圈
        </div>
        <div className={styles.postList}>
          {profile.liked.map((post) => (
            <article className={styles.postCard} key={post.id}>
              <div className={styles.postAuthor}>
                <img src={profile.avatar} alt={profile.name} />
                <div className={styles.postAuthorInfo}>
                  <div className={styles.postAuthorName}>{profile.name}</div>
                  <div className={styles.postAuthorMeta}>{post.time}</div>
                </div>
                <span className={`${styles.postTag} ${styles.pinkTag}`}>{post.tag}</span>
              </div>
              <div className={styles.postBody}>
                <div className={styles.postTitle}>{post.title}</div>
                <div className={styles.postDesc}>{post.desc}</div>
              </div>
              <div className={styles.postImages}>
                <img src={post.images[0]} alt={post.title} />
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

      {chatOpen ? (
        <div className={styles.chatOverlay}>
          <button className={styles.chatMask} type="button" onClick={() => setChatOpen(false)} />
          <section className={styles.chatPanel}>
            <header className={styles.chatHeader}>
              <button className={styles.chatBack} type="button" onClick={() => setChatOpen(false)}>
                ←
              </button>
              <img className={styles.chatAvatar} src={profile.avatar} alt={profile.name} />
              <div className={styles.chatName}>{profile.name}</div>
              <button className={styles.chatMore} type="button">
                ⋯
              </button>
            </header>
            <div className={styles.chatMessages}>
              <div className={styles.timeLabel}>09:12</div>
              <div className={`${styles.msgRow} ${styles.other}`}>
                <img src={profile.avatar} alt="" />
                <div className={styles.bubble}>在吗？一起来猜一局！</div>
              </div>
              <div className={`${styles.msgRow} ${styles.me}`}>
                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Me" alt="" />
                <div className={styles.bubble}>好啊，猜什么？</div>
              </div>
              <div className={`${styles.msgRow} ${styles.other}`}>
                <img src={profile.avatar} alt="" />
                <div className={styles.bubble}>最新竞猜马上开始，欢迎来参与。</div>
              </div>
            </div>
            <footer className={styles.chatInputBar}>
              <div className={styles.chatTools}>
                <button type="button">🖼</button>
                <button type="button">☺</button>
              </div>
              <textarea className={styles.chatInput} placeholder="发送消息…" rows={1} />
              <button className={styles.chatSend} type="button">
                ➤
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
