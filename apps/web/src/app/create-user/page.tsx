'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

type Friend = {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  winrate: number;
};

type Group = {
  id: string;
  name: string;
  initials: string;
  bg: string;
  members: number;
  desc: string;
};

const topics = [
  { emoji: '🍔', name: '今晚吃啥', title: '今晚吃什么？', a: '火锅', b: '烧烤' },
  { emoji: '🎬', name: '看什么片', title: '周末看什么电影？', a: '科幻片', b: '喜剧片' },
  { emoji: '⚽', name: '谁会赢', title: '今晚比赛谁赢？', a: '主队', b: '客队' },
  { emoji: '🎮', name: '游戏PK', title: '谁是游戏王？', a: '我赢', b: '你赢' },
  { emoji: '☀️', name: '明天天气', title: '明天会下雨吗？', a: '晴天', b: '下雨' },
  { emoji: '🧋', name: '奶茶之选', title: '哪杯奶茶更好喝？', a: '杨枝甘露', b: '珍珠奶茶' },
  { emoji: '✈️', name: '旅行目的地', title: '下次旅行去哪？', a: '海边', b: '山里' },
  { emoji: '📱', name: '数码之争', title: '该买哪个？', a: '苹果', b: '安卓' },
];

const stakeOptions = [
  '🧋 请一杯奶茶',
  '🍕 请吃一顿',
  '🧧 发个红包',
  '💪 做20个俯卧撑',
  '📢 发条朋友圈',
  '🎤 唱首歌',
];

const friends: Friend[] = [
  { id: 'f1', name: '小米', avatar: '/legacy/images/mascot/mouse-main.png', status: 'online', winrate: 67 },
  { id: 'f2', name: '阿星', avatar: '/legacy/images/mascot/mouse-happy.png', status: 'online', winrate: 54 },
  { id: 'f3', name: '雨桐', avatar: '/legacy/images/mascot/mouse-casual.png', status: 'offline', winrate: 72 },
  { id: 'f4', name: '凯文', avatar: '/legacy/images/mascot/mouse-cute.png', status: 'offline', winrate: 49 },
  { id: 'f5', name: 'Luna', avatar: '/legacy/images/mascot/mouse-sunny.png', status: 'online', winrate: 63 },
  { id: 'f6', name: 'Milo', avatar: '/legacy/images/mascot/mouse-reserved.png', status: 'offline', winrate: 58 },
  { id: 'f7', name: 'Coco', avatar: '/legacy/images/mascot/mouse-excited.png', status: 'online', winrate: 71 },
];

const groups: Group[] = [
  { id: 'grp1', name: '吃货研究所', initials: 'CH', bg: '#FF9800', members: 128, desc: '美食爱好者聚集地' },
  { id: 'grp2', name: '办公室摸鱼群', initials: 'MY', bg: '#4CAF50', members: 56, desc: '上班划水好伙伴' },
  { id: 'grp3', name: '周末玩什么', initials: 'WK', bg: '#2196F3', members: 89, desc: '周末活动策划组' },
];

export default function CreateUserPage() {
  const router = useRouter();
  const [topicIndex, setTopicIndex] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [deadline, setDeadline] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [anonVote, setAnonVote] = useState(true);
  const [allowComment, setAllowComment] = useState(true);
  const [stakeEnabled, setStakeEnabled] = useState(false);
  const [selectedStakeIndex, setSelectedStakeIndex] = useState<number | null>(null);
  const [stakeCustom, setStakeCustom] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishStep, setPublishStep] = useState(-1);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!publishOpen) {
      setPublishStep(-1);
      return undefined;
    }

    const timers = [
      window.setTimeout(() => setPublishStep(0), 60),
      window.setTimeout(() => setPublishStep(1), 520),
      window.setTimeout(() => setPublishStep(2), selectedGroup ? 980 : 700),
      window.setTimeout(() => {
        setPublishOpen(false);
        setSuccessOpen(true);
      }, selectedGroup ? 1560 : 1280),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [publishOpen, selectedGroup]);

  const filteredFriends = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return friends;
    }

    return friends.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [search]);

  const selectedFriendItems = useMemo(
    () =>
      selectedFriends
        .map((id) => friends.find((friend) => friend.id === id))
        .filter(Boolean) as Friend[],
    [selectedFriends],
  );

  const selectedGroupItem = useMemo(
    () => groups.find((item) => item.id === selectedGroup) || null,
    [selectedGroup],
  );

  const stepStates = useMemo(
    () => [title.trim().length >= 3, optA.trim().length > 0 && optB.trim().length > 0, selectedFriends.length > 0],
    [optA, optB, selectedFriends.length, title],
  );

  const progress = Math.round((stepStates.filter(Boolean).length / 3) * 100);
  const previewVisible = optA.trim().length > 0 || optB.trim().length > 0;
  const stakeText = stakeCustom.trim() || (selectedStakeIndex === null ? '' : stakeOptions[selectedStakeIndex]);

  const toggleFriend = (id: string) => {
    setSelectedFriends((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const selectTopic = (index: number) => {
    const next = topicIndex === index ? null : index;
    setTopicIndex(next);
    if (next === null) {
      return;
    }

    const topic = topics[next];
    setTitle(topic.title);
    setOptA(topic.a);
    setOptB(topic.b);
  };

  const swapOptions = () => {
    setOptA(optB);
    setOptB(optA);
  };

  const toggleGroup = (id: string) => {
    setSelectedGroup((current) => (current === id ? null : id));
  };

  const toggleStake = () => {
    setStakeEnabled((current) => {
      const next = !current;
      if (!next) {
        setSelectedStakeIndex(null);
        setStakeCustom('');
      }
      return next;
    });
  };

  const selectStake = (index: number) => {
    if (selectedStakeIndex === index) {
      setSelectedStakeIndex(null);
      setStakeCustom('');
      return;
    }

    setSelectedStakeIndex(index);
    setStakeCustom(stakeOptions[index]);
  };

  const validateBeforePublish = () => {
    if (title.trim().length < 3) {
      setToast('⚠️ 标题至少3个字');
      return false;
    }

    if (!optA.trim() || !optB.trim()) {
      setToast('⚠️ 请填写两个PK选项');
      return false;
    }

    if (selectedFriends.length === 0) {
      setToast('⚠️ 至少邀请1位好友');
      return false;
    }

    return true;
  };

  const publishGuess = () => {
    if (!validateBeforePublish()) {
      return;
    }

    setPreviewOpen(false);
    setPublishOpen(true);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>发起好友竞猜</div>
        <button className={styles.ruleBtn} type="button" onClick={() => setToast('竞猜规则')}>
          <i className="fa-solid fa-circle-question" />
        </button>
      </header>

      <section className={styles.roleBar}>
        <span className={styles.roleIcon}>👤</span>
        <span className={styles.roleText}>用户端 · 好友PK模式</span>
        <span className={styles.roleDesc}>仅限社群和好友竞猜</span>
        <button className={styles.roleSwitch} type="button" onClick={() => router.push('/create')}>
          <span>切换商家端</span>
          <i className="fa-solid fa-arrow-right-arrow-left" />
        </button>
      </section>

      <section className={styles.progress}>
        <div className={styles.progressSegments}>
          {stepStates.map((done, index) => (
            <span
              key={`seg-${index}`}
              className={`${styles.progressSeg} ${done ? styles.progressSegDone : ''}`}
            />
          ))}
        </div>
        <div className={styles.progressInfo}>
          <span>竞猜完成度</span>
          <span className={styles.progressPct}>{progress}%</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-fire" />
          选择话题
          <span>点击快速填充</span>
        </div>
        <div className={styles.topicRow}>
          {topics.map((item, index) => (
            <button
              key={item.name}
              className={`${styles.topicCard} ${topicIndex === index ? styles.topicCardActive : ''}`}
              type="button"
              onClick={() => selectTopic(index)}
            >
              <span className={styles.topicEmoji}>{item.emoji}</span>
              <span className={styles.topicName}>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.form}>
        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-pen-nib" />
            竞猜内容
            <span className={styles.required}>*</span>
            <span className={`${styles.stepTag} ${stepStates[0] ? styles.stepTagDone : styles.stepTagPending}`}>
              {stepStates[0] ? '✓ 完成' : '待完善'}
            </span>
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.label}>
              <span>竞猜标题</span>
              <span className={styles.charCount}>{title.length}/40</span>
            </label>
            <input
              className={styles.input}
              value={title}
              maxLength={40}
              placeholder="例：今晚吃什么？"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.label}>补充说明（选填）</label>
            <textarea
              className={styles.textarea}
              value={desc}
              placeholder="输入竞猜详情或规则..."
              onChange={(event) => setDesc(event.target.value)}
            />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-bolt" />
            PK选项
            <span className={styles.required}>*</span>
            <span className={`${styles.stepTag} ${stepStates[1] ? styles.stepTagDone : styles.stepTagPending}`}>
              {stepStates[1] ? '✓ 完成' : '待完善'}
            </span>
          </div>
          <div className={styles.vsWrap}>
            <div className={styles.vsRow}>
              <input
                className={`${styles.optionInput} ${styles.optionA}`}
                value={optA}
                placeholder="选项 A"
                onChange={(event) => setOptA(event.target.value)}
              />
              <div className={styles.vsBadge}>VS</div>
              <input
                className={`${styles.optionInput} ${styles.optionB}`}
                value={optB}
                placeholder="选项 B"
                onChange={(event) => setOptB(event.target.value)}
              />
            </div>
            <button className={styles.swapBtn} type="button" onClick={swapOptions}>
              <i className="fa-solid fa-arrow-right-arrow-left" />
              交换选项
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-user-group" />
            邀请好友参战
            <span className={styles.required}>*</span>
            <span className={`${styles.stepTag} ${stepStates[2] ? styles.stepTagDone : styles.stepTagPending}`}>
              {stepStates[2] ? `✓ ${selectedFriends.length}人` : '待完善'}
            </span>
          </div>
          <div className={styles.friendHeader}>
            <span className={styles.friendCount}>已选 {selectedFriends.length} 人</span>
          </div>
          <div className={styles.search}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              value={search}
              placeholder="搜索好友..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.friendGrid}>
            {filteredFriends.map((friend) => {
              const active = selectedFriends.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  className={`${styles.friendCard} ${active ? styles.friendCardActive : ''}`}
                  type="button"
                  onClick={() => toggleFriend(friend.id)}
                >
                  <span className={styles.friendCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                  <span
                    className={`${styles.friendOnline} ${
                      friend.status === 'online' ? styles.online : styles.offline
                    }`}
                  />
                  <img className={styles.friendAvatar} src={friend.avatar} alt={friend.name} />
                  <span className={styles.friendName}>{friend.name.slice(0, 4)}</span>
                  <span className={styles.friendWinrate}>胜率{friend.winrate}%</span>
                </button>
              );
            })}
            <button className={styles.inviteMore} type="button" onClick={() => setToast('邀请更多好友')}>
              <span className={styles.inviteMoreIcon}>
                <i className="fa-solid fa-plus" />
              </span>
              <span className={styles.inviteMoreText}>邀请</span>
            </button>
          </div>
          {selectedFriendItems.length > 0 ? (
            <div className={styles.selectedTags}>
              {selectedFriendItems.map((friend) => (
                <span key={friend.id} className={styles.selectedTag}>
                  <img src={friend.avatar} alt={friend.name} />
                  {friend.name.slice(0, 4)}
                  <button type="button" onClick={() => toggleFriend(friend.id)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-people-group" />
            发布到社群
            <span className={styles.optional}>（选填）</span>
          </div>
          <div className={styles.groupList}>
            {groups.map((group) => {
              const active = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  className={`${styles.groupCard} ${active ? styles.groupCardActive : ''}`}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className={styles.groupAvatar} style={{ backgroundColor: group.bg }}>
                    {group.initials}
                  </span>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupMeta}>
                      {group.members}人 · {group.desc}
                    </div>
                  </div>
                  <span className={styles.groupCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-gear" />
            竞猜设置
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>截止时间</div>
              <div className={styles.settingDesc}>到时间自动开奖</div>
            </div>
            <input
              className={`${styles.input} ${styles.deadline}`}
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>匿名投票</div>
              <div className={styles.settingDesc}>好友看不到彼此选择</div>
            </div>
            <button
              className={`${styles.toggle} ${anonVote ? styles.toggleOn : ''}`}
              type="button"
              onClick={() => setAnonVote((current) => !current)}
            >
              <span />
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>允许评论</div>
              <div className={styles.settingDesc}>好友可以发表看法</div>
            </div>
            <button
              className={`${styles.toggle} ${allowComment ? styles.toggleOn : ''}`}
              type="button"
              onClick={() => setAllowComment((current) => !current)}
            >
              <span />
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>赌注加码 🎲</div>
              <div className={styles.settingDesc}>输的人请客/发红包</div>
            </div>
            <button
              className={`${styles.toggle} ${stakeEnabled ? styles.toggleOn : ''}`}
              type="button"
              onClick={toggleStake}
            >
              <span />
            </button>
          </div>
          {stakeEnabled ? (
            <div className={styles.stakeArea}>
              <div className={styles.stakeQuick}>
                {stakeOptions.map((item, index) => (
                  <button
                    key={item}
                    className={`${styles.stakeChip} ${selectedStakeIndex === index ? styles.stakeChipActive : ''}`}
                    type="button"
                    onClick={() => selectStake(index)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <input
                className={`${styles.input} ${styles.stakeInput}`}
                value={stakeCustom}
                placeholder="自定义赌注内容..."
                maxLength={30}
                onChange={(event) => {
                  setStakeCustom(event.target.value);
                  if (event.target.value.trim()) {
                    setSelectedStakeIndex(null);
                  }
                }}
              />
            </div>
          ) : null}
        </article>
      </section>

      {previewVisible ? (
        <div className={styles.previewBar}>
          <div className={styles.previewVs}>
            <span className={styles.previewA}>{optA.trim() || '--'}</span>
            <span className={styles.previewBadge}>VS</span>
            <span className={styles.previewB}>{optB.trim() || '--'}</span>
          </div>
          <div className={styles.previewFriends}>{selectedFriends.length}人参战</div>
        </div>
      ) : null}

      <div className={styles.bottomBar}>
        <button className={styles.secondaryBtn} type="button" onClick={() => setPreviewOpen(true)}>
          预览
        </button>
        <button className={styles.primaryBtn} type="button" onClick={publishGuess}>
          <i className="fa-solid fa-paper-plane" />
          发起竞猜
        </button>
      </div>

      {previewOpen ? (
        <div
          className={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewOpen(false);
            }
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>竞猜预览</div>
              <button className={styles.modalClose} type="button" onClick={() => setPreviewOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <section className={styles.previewCard}>
                <div className={styles.previewTitle}>
                  {title.trim() || <span className={styles.previewPlaceholder}>未填写标题</span>}
                </div>
                {desc.trim() ? <div className={styles.previewDesc}>{desc.trim()}</div> : null}
                <div className={styles.previewVsLarge}>
                  <div className={`${styles.previewOption} ${styles.previewOptionA}`}>
                    <div className={styles.previewOptionName}>{optA.trim() || '--'}</div>
                    <div className={styles.previewOptionLabel}>选项 A</div>
                  </div>
                  <div className={styles.previewVsBadge}>
                    <div className={styles.previewVsCircle}>VS</div>
                  </div>
                  <div className={`${styles.previewOption} ${styles.previewOptionB}`}>
                    <div className={styles.previewOptionName}>{optB.trim() || '--'}</div>
                    <div className={styles.previewOptionLabel}>选项 B</div>
                  </div>
                </div>
                <div className={styles.previewMeta}>
                  <span>
                    <i className="fa-solid fa-user-group" />
                    {selectedFriends.length}人参战
                  </span>
                  {deadline ? (
                    <span>
                      <i className="fa-regular fa-clock" />
                      {new Date(deadline).toLocaleString('zh-CN')}
                    </span>
                  ) : null}
                  {selectedGroupItem ? (
                    <span>
                      <i className="fa-solid fa-people-group" />
                      {selectedGroupItem.name}
                    </span>
                  ) : null}
                  {stakeEnabled && stakeText ? (
                    <span>
                      <i className="fa-solid fa-dice" />
                      {stakeText}
                    </span>
                  ) : null}
                </div>
                {selectedFriendItems.length > 0 ? (
                  <div className={styles.previewFriendsRow}>
                    {selectedFriendItems.slice(0, 6).map((friend) => (
                      <img
                        key={friend.id}
                        className={styles.previewFriendAvatar}
                        src={friend.avatar}
                        alt={friend.name}
                      />
                    ))}
                    <span className={styles.previewFriendsText}>
                      {selectedFriendItems.length > 6
                        ? `+${selectedFriendItems.length - 6}`
                        : `${selectedFriendItems.length}位好友参战`}
                    </span>
                  </div>
                ) : null}
              </section>
              {!stepStates.every(Boolean) ? (
                <div className={styles.previewWarnings}>
                  <div className={styles.previewWarningsTitle}>以下项目需要完善：</div>
                  {!stepStates[0] ? <div className={styles.previewWarningItem}>⚠️ 标题至少3个字</div> : null}
                  {!stepStates[1] ? <div className={styles.previewWarningItem}>⚠️ 请填写两个PK选项</div> : null}
                  {!stepStates[2] ? <div className={styles.previewWarningItem}>⚠️ 至少邀请1位好友</div> : null}
                </div>
              ) : null}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => setPreviewOpen(false)}>
                继续编辑
              </button>
              <button className={styles.primaryBtn} type="button" onClick={publishGuess}>
                确认发布
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publishOpen ? (
        <div className={styles.publishOverlay}>
          <div className={styles.publishCard}>
            <div className={styles.publishIcon}>{publishStep >= 2 ? '🎉' : '⏳'}</div>
            <div className={styles.publishTitle}>{publishStep >= 2 ? '发送成功！' : '正在发送竞猜...'}</div>
            <div className={styles.publishDesc}>
              {publishStep >= 2 ? '竞猜已推送给好友' : '正在推送给好友'}
            </div>
            <div className={styles.publishBar}>
              <span
                className={styles.publishFill}
                style={{ width: `${publishStep < 0 ? 0 : ((publishStep + 1) / 3) * 100}%` }}
              />
            </div>
            <div className={styles.publishSteps}>
              {[
                '检查竞猜信息',
                '推送给好友',
                '发布到社群',
              ].map((item, index) => {
                const done = publishStep > index || (index === 2 && !selectedGroup && publishStep >= 1);
                const active = publishStep === index;
                return (
                  <div
                    key={item}
                    className={`${styles.publishStep} ${done ? styles.publishStepDone : ''} ${
                      active ? styles.publishStepActive : ''
                    }`}
                  >
                    <i
                      className={
                        done
                          ? 'fa-solid fa-circle-check'
                          : active
                            ? 'fa-solid fa-spinner fa-spin'
                            : 'fa-regular fa-circle'
                      }
                    />
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div
          className={styles.successOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSuccessOpen(false);
            }
          }}
        >
          <div className={styles.successCard}>
            <div className={styles.successEmoji}>🎉</div>
            <div className={styles.successTitle}>竞猜已发起！</div>
            <div className={styles.successDesc}>已发送给好友，等待参战</div>
            <div className={styles.successShares}>
              {[
                { icon: 'fa-solid fa-link', label: '复制链接', type: 'copy' },
                { icon: 'fa-brands fa-weixin', label: '微信', type: 'wechat' },
                { icon: 'fa-solid fa-users', label: '猜友圈', type: 'friends' },
                { icon: 'fa-solid fa-image', label: '海报', type: 'poster' },
              ].map((item) => (
                <button
                  key={item.label}
                  className={styles.shareItem}
                  type="button"
                  onClick={() => setToast(
                    item.type === 'copy'
                      ? '已复制链接'
                      : item.type === 'wechat'
                        ? '分享到微信'
                        : item.type === 'friends'
                          ? '分享到猜友圈'
                          : '生成海报',
                  )}
                >
                  <span
                    className={`${styles.shareIcon} ${
                      item.type === 'wechat'
                        ? styles.shareIconwechat
                        : item.type === 'friends'
                          ? styles.shareIconfriends
                          : ''
                    }`}
                  >
                    <i className={item.icon} />
                  </span>
                  <span className={styles.shareLabel}>{item.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.primaryBtnFull} type="button" onClick={() => router.push('/')}>
              返回首页
            </button>
            <button className={styles.laterBtn} type="button" onClick={() => router.push('/')}>
              稍后再说
            </button>
          </div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
