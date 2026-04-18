'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import styles from './page.module.css';

const hotGueses = [
  { id: 'g1', title: '2026世界杯决赛 阿根廷vs法国', icon: '⚽', participants: 8500, options: ['阿根廷', '法国'] },
  { id: 'g2', title: '2026NBA总冠军花落谁家', icon: '🏀', participants: 6200, options: ['凯尔特人', '雷霆'] },
  { id: 'g3', title: '《流浪地球3》首周票房预测', icon: '🎬', participants: 5800, options: ['超30亿', '20-30亿'] },
];

const friendsData = [
  { id: 'f1', name: '零食达人小王', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Wang', bio: '竞猜高手·专注体育', level: 'Lv.8', online: true, streak: 5, verified: false, mutual: true },
  { id: 'f2', name: '坚果控大李', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BigLi', bio: '坚果评测博主', level: 'Lv.6', online: false, streak: 3, verified: false, mutual: true },
  { id: 'f3', name: '三只松鼠官方店', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=3S&backgroundColor=4caf50', bio: '品牌官方', level: 'Lv.7', online: true, streak: 0, verified: true, mutual: false },
  { id: 'f4', name: '德芙官方旗舰店', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Dove&backgroundColor=6d4c41', bio: '品牌官方', level: 'Lv.6', online: true, streak: 0, verified: true, mutual: false },
  { id: 'f5', name: '甜品公主', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Princess', bio: '甜品爱好者', level: 'Lv.5', online: false, streak: 2, verified: false, mutual: true },
];

const followingData = [
  { id: 'fw1', name: '乐事官方旗舰店', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Lays&backgroundColor=e53935', desc: '品牌官方', fans: 128000, mutual: false, posts: 356, tag: '品牌', verified: true },
  { id: 'fw2', name: '零食测评官', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tester', desc: '胜率82%', fans: 45600, mutual: true, posts: 89, tag: '猜友', verified: false },
];

const fansData = [
  { id: 'fan1', name: '薯片星球人', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chips', followedBack: false, time: '3天前', winRate: 55, bio: '薯片鉴赏家' },
  { id: 'fan2', name: '巧克力控小A', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ChocoA', followedBack: true, time: '1周前', winRate: 48, bio: '甜蜜生活' },
];

const requestsData = [
  { id: 'req1', name: '饼干小魔王', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie', msg: '我也喜欢猜零食，一起PK呀！', time: '1小时前', mutualFriends: 3, winRate: 52 },
  { id: 'req2', name: '竞猜玄学大师', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Master', msg: '大佬带带我', time: '2天前', mutualFriends: 5, winRate: 78 },
];

const quickActions = [
  { label: '邀请好友', icon: '📨' },
  { label: '排行榜', icon: '🏆' },
  { label: 'PK记录', icon: '⚔️' },
  { label: '社区', icon: '💬' },
];

const tabs = [
  { key: 'friends', label: '好友' },
  { key: 'following', label: '关注' },
  { key: 'fans', label: '粉丝' },
  { key: 'requests', label: '申请', badge: 5 },
] as const;

const profileDB = {
  default: {
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Me',
  },
};

export default function FriendsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('friends');
  const [query, setQuery] = useState('');
  const [pkOpen, setPkOpen] = useState(false);
  const [selectedPk, setSelectedPk] = useState<string>('g1');

  const filteredFriends = useMemo(
    () => friendsData.filter((item) => item.name.includes(query.trim())),
    [query],
  );

  const currentPk = hotGueses.find((item) => item.id === selectedPk) || hotGueses[0];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => history.back()}>
          ←
        </button>
        <div className={styles.headerTitle}>好友</div>
        <button className={styles.actionBtn} type="button">
          ＋
        </button>
      </header>

      <section className={styles.heroCard}>
        <div className={styles.statsGrid}>
          <button className={styles.statItem} type="button" onClick={() => setTab('friends')}>
            <strong>5</strong>
            <span>好友</span>
          </button>
          <button className={styles.statItem} type="button" onClick={() => setTab('following')}>
            <strong>12</strong>
            <span>关注</span>
          </button>
          <button className={styles.statItem} type="button" onClick={() => setTab('fans')}>
            <strong>28</strong>
            <span>粉丝</span>
          </button>
          <div className={styles.statItem}>
            <strong>15</strong>
            <span>PK场</span>
          </div>
        </div>
      </section>

      <section className={styles.quickBar}>
        {quickActions.map((item) => (
          <button className={styles.quickItem} type="button" key={item.label}>
            <div className={styles.quickIcon}>{item.icon}</div>
            <div className={styles.quickLabel}>{item.label}</div>
          </button>
        ))}
      </section>

      <section className={styles.hotStrip}>
        <div className={styles.stripTitle}>
          <span>✦</span> 好友都在猜 <em>查看更多</em>
        </div>
        <div className={styles.hotScroll}>
          {hotGueses.map((item) => (
            <button className={styles.hotCard} type="button" key={item.id} onClick={() => setPkOpen(true)}>
              <div className={styles.hotIcon}>{item.icon}</div>
              <div className={styles.hotTitle}>{item.title}</div>
              <div className={styles.hotMeta}>{item.participants} 人参与 · {item.options.join(' vs ')}</div>
            </button>
          ))}
        </div>
      </section>

      <nav className={styles.tabs}>
        {tabs.map((item) => (
          <button
            className={tab === item.key ? styles.tabActive : styles.tab}
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
          >
            {item.label}
            {'badge' in item && item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <section className={styles.searchBar}>
        <span>⌕</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户..." />
      </section>

      {tab === 'friends' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>我的好友 (<b>{filteredFriends.length}</b>)</span>
            <button type="button">▾ 排序</button>
          </div>
          <div>
            {filteredFriends.map((item) => (
              <article className={styles.friendCard} key={item.id}>
                <div className={styles.avatarWrap}>
                  <img className={styles.friendAvatar} src={item.avatar} alt={item.name} />
                  <span className={`${styles.onlineDot} ${item.online ? styles.online : styles.offline}`} />
                </div>
                <div className={styles.friendInfo}>
                  <div className={styles.friendNameRow}>
                    <div className={styles.friendName}>{item.name}</div>
                    <span className={styles.friendLevel}>{item.level}</span>
                    <span className={item.online ? styles.onlineTagOn : styles.onlineTagOff}>
                      {item.online ? '在线' : '离线'}
                    </span>
                  </div>
                  <div className={styles.friendMetaRow}>
                    <span>胜率 <b className={styles.winHigh}>{item.streak ? `连胜 ${item.streak}` : '稳定'}</b></span>
                    <span>·</span>
                    <span>{item.bio}</span>
                  </div>
                  {item.verified ? <div className={styles.badgeBrand}>品牌</div> : null}
                </div>
                <div className={styles.friendActions}>
                  <button className={styles.primaryBtn} type="button" onClick={() => setPkOpen(true)}>
                    ⚔️ PK
                  </button>
                  <button className={styles.outlineBtn} type="button">
                    私信
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'following' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>我的关注 (<b>{followingData.length}</b>)</span>
          </div>
          {followingData.map((item) => (
            <article className={styles.followCard} key={item.id}>
              <img className={styles.friendAvatar} src={item.avatar} alt={item.name} />
              <div className={styles.friendInfo}>
                <div className={styles.friendNameRow}>
                  <div className={styles.friendName}>{item.name}</div>
                  {item.verified ? <span className={styles.badgeBrand}>品牌</span> : null}
                </div>
                <div className={styles.friendMetaRow}>
                  <span>{item.desc}</span>
                  <span>· {item.fans} 粉丝</span>
                </div>
              </div>
              <div className={styles.friendActions}>
                <button className={item.mutual ? styles.mutualBtn : styles.outlineBtn} type="button">
                  {item.mutual ? '互相关注' : '已关注'}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'fans' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>我的粉丝 ({fansData.length})</span>
          </div>
          {fansData.map((item) => (
            <article className={styles.requestCard} key={item.id}>
              <img className={styles.friendAvatar} src={item.avatar} alt={item.name} />
              <div className={styles.requestInfo}>
                <div className={styles.friendName}>{item.name}</div>
                <div className={styles.friendMetaRow}>
                  <span>{item.bio}</span>
                </div>
                <div className={styles.requestTime}>{item.time}</div>
              </div>
              <button className={item.followedBack ? styles.followedBtn : styles.primaryBtn} type="button">
                {item.followedBack ? '已回关' : '回关'}
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'requests' ? (
        <section>
          <div className={styles.sectionHeader}>
            <span>好友申请 ({requestsData.length})</span>
          </div>
          {requestsData.map((item) => (
            <article className={styles.requestCard} key={item.id}>
              <img className={styles.friendAvatar} src={item.avatar} alt={item.name} />
              <div className={styles.requestInfo}>
                <div className={styles.friendName}>{item.name}</div>
                <div className={styles.requestMsg}>{item.msg}</div>
                <div className={styles.requestMeta}>{item.time} · 互相关注 {item.mutualFriends} 人</div>
              </div>
              <div className={styles.requestActions}>
                <button className={styles.outlineBtn} type="button">
                  拒绝
                </button>
                <button className={styles.primaryBtn} type="button">
                  同意
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {pkOpen ? (
        <div className={styles.pkOverlay} onClick={() => setPkOpen(false)} role="presentation">
          <section className={styles.pkModal} onClick={(event) => event.stopPropagation()} role="presentation">
            <header className={styles.pkHeader}>
              <button className={styles.pkClose} type="button" onClick={() => setPkOpen(false)}>
                ×
              </button>
              <div className={styles.pkTitle}>好友 PK</div>
              <div className={styles.pkSubtitle}>选择一场竞猜，和好友一起开战</div>
            </header>
            <div className={styles.pkVs}>
              <div className={styles.pkPlayer}>
                <img src={profileDB.default.avatar} alt="我" />
                <div className={styles.pkPlayerName}>我</div>
                <div className={styles.pkPlayerStats}>胜率 62%</div>
              </div>
              <div className={styles.pkVsIcon}>VS</div>
              <div className={styles.pkPlayer}>
                <img src={currentPk.id === 'g1' ? 'https://api.dicebear.com/7.x/adventurer/svg?seed=Wang' : 'https://api.dicebear.com/7.x/adventurer/svg?seed=BigLi'} alt="好友" />
                <div className={styles.pkPlayerName}>好友</div>
                <div className={styles.pkPlayerStats}>连胜 3 场</div>
              </div>
            </div>
            <div className={styles.pkGuessSelect}>
              <div className={styles.pkGuessLabel}>选择竞猜</div>
              <div className={styles.pkGuessList}>
                {hotGueses.map((item) => (
                  <button
                    className={selectedPk === item.id ? styles.pkGuessItemActive : styles.pkGuessItem}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPk(item.id)}
                  >
                    <div className={styles.pkIcon}>{item.icon}</div>
                    <div className={styles.pkGuessBody}>
                      <div className={styles.pkGuessTitle}>{item.title}</div>
                      <div className={styles.pkGuessMeta}>{item.participants} 人参与 · {item.options.join(' vs ')}</div>
                    </div>
                    <div className={styles.pkCheck}>✓</div>
                  </button>
                ))}
              </div>
            </div>
            <footer className={styles.pkFooter}>
              <button className={styles.cancelBtn} type="button" onClick={() => setPkOpen(false)}>
                取消
              </button>
              <button className={styles.primaryBtn} type="button">
                发起 PK
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
