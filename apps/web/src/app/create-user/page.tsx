"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Friend = {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
  members: number;
  winrate: number;
};

type Group = {
  id: string;
  name: string;
  avatar: string;
  members: number;
  desc: string;
};

const topics = [
  { emoji: "🍔", name: "今晚吃啥", title: "今晚吃什么？", a: "火锅", b: "烧烤" },
  { emoji: "🎬", name: "看什么片", title: "周末看什么电影？", a: "科幻片", b: "喜剧片" },
  { emoji: "⚽", name: "谁会赢", title: "今晚比赛谁赢？", a: "主队", b: "客队" },
  { emoji: "🎮", name: "游戏PK", title: "谁是游戏王？", a: "我赢", b: "你赢" },
  { emoji: "☀️", name: "明天天气", title: "明天会下雨吗？", a: "晴天", b: "下雨" },
  { emoji: "🧋", name: "奶茶之选", title: "哪杯奶茶更好喝？", a: "杨枝甘露", b: "珍珠奶茶" },
  { emoji: "✈️", name: "旅行目的地", title: "下次旅行去哪？", a: "海边", b: "山里" },
  { emoji: "📱", name: "数码之争", title: "该买哪个？", a: "苹果", b: "安卓" },
];

const stakeChips = ["🧋 请一杯奶茶", "🍕 请吃一顿", "🧧 发个红包", "💪 做20个俯卧撑", "📢 发条朋友圈", "🎤 唱首歌"];

const friends: Friend[] = [
  {
    id: "f1",
    name: "小米",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=xiaomi",
    status: "online",
    members: 0,
    winrate: 67,
  },
  {
    id: "f2",
    name: "阿星",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=axi",
    status: "offline",
    members: 0,
    winrate: 54,
  },
  {
    id: "f3",
    name: "雨桐",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=yutong",
    status: "online",
    members: 0,
    winrate: 72,
  },
  {
    id: "f4",
    name: "凯文",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=kevin",
    status: "offline",
    members: 0,
    winrate: 49,
  },
  {
    id: "f5",
    name: "Luna",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=luna",
    status: "online",
    members: 0,
    winrate: 63,
  },
  {
    id: "f6",
    name: "Milo",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=milo",
    status: "offline",
    members: 0,
    winrate: 58,
  },
  {
    id: "f7",
    name: "Coco",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=coco",
    status: "online",
    members: 0,
    winrate: 71,
  },
];

const groups: Group[] = [
  {
    id: "g1",
    name: "吃货研究所",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CH&backgroundColor=FF9800",
    members: 128,
    desc: "美食爱好者聚集地",
  },
  {
    id: "g2",
    name: "办公室摸鱼群",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MY&backgroundColor=4CAF50",
    members: 56,
    desc: "上班划水好伙伴",
  },
  {
    id: "g3",
    name: "周末玩什么",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=WK&backgroundColor=2196F3",
    members: 89,
    desc: "周末活动策划组",
  },
];

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.8 5.4 5.2 5.2 5.2-5.2 1.4 1.4-5.2 5.2 5.2 5.2-1.4 1.4-5.2-5.2-5.2 5.2-1.4-1.4 5.2-5.2-5.2-5.2 1.4-1.4Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
    </svg>
  );
}

export default function CreateUserPage() {
  const router = useRouter();
  const [topicIndex, setTopicIndex] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [deadline, setDeadline] = useState("2026-04-18T20:00");
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>(["f1", "f3"]);
  const [selectedGroup, setSelectedGroup] = useState<string>("g1");
  const [anonVote, setAnonVote] = useState(true);
  const [allowComment, setAllowComment] = useState(true);
  const [stakeEnabled, setStakeEnabled] = useState(true);
  const [selectedStake, setSelectedStake] = useState<string>(stakeChips[0]);
  const [stakeCustom, setStakeCustom] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [progress, setProgress] = useState(78);

  const filteredFriends = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return friends;
    return friends.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [search]);

  const selectedFriendItems = selectedFriends
    .map((id) => friends.find((friend) => friend.id === id))
    .filter(Boolean) as Friend[];

  const previewStake = stakeEnabled ? stakeCustom || selectedStake : "未开启";

  const toggleFriend = (id: string) => {
    setSelectedFriends((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const selectTopic = (index: number) => {
    const next = topicIndex === index ? null : index;
    setTopicIndex(next);
    if (next === null) return;
    const item = topics[next];
    setTitle(item.title);
    setOptA(item.a);
    setOptB(item.b);
    setProgress(86);
  };

  const updateProgress = (value: number) => {
    setProgress(value);
  };

  const publishGuess = () => {
    setPublishOpen(true);
    window.setTimeout(() => {
      setPublishOpen(false);
      setSuccessOpen(true);
    }, 1200);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <BackIcon />
        </button>
        <div className={styles.titleWrap}>
          <div className={styles.title}>发起好友竞猜</div>
          <div className={styles.subtitle}>用户端 · 好友PK模式</div>
        </div>
        <button className={styles.ruleBtn} type="button" onClick={() => setPreviewOpen(true)}>
          <i className="fa-solid fa-circle-question" />
        </button>
      </header>

      <section className={styles.roleBar}>
        <span className={styles.roleIcon}>👤</span>
        <span className={styles.roleText}>用户端 · 好友PK模式</span>
        <span className={styles.roleDesc}>仅限社群和好友竞猜</span>
        <button className={styles.roleSwitch} type="button">
          <span>切换商家端</span>
          <i className="fa-solid fa-arrow-right-arrow-left" />
        </button>
      </section>

      <section className={styles.progress}>
        <div className={styles.progressBar}>
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressInfo}>
          <span>竞猜完成度</span>
          <span>{progress}%</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-fire" /> 选择话题
          <span>点击快速填充</span>
        </div>
        <div className={styles.topicRow}>
          {topics.map((item, index) => (
            <button
              key={item.name}
              className={`${styles.topicCard} ${topicIndex === index ? styles.topicCardActive : ""}`}
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
            <i className="fa-solid fa-pen-nib" /> 竞猜内容 <span className={styles.required}>*</span>
            <span className={styles.stepTag}>待完善</span>
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.label}>
              竞猜标题
              <span className={styles.charCount}>{title.length}/40</span>
            </label>
            <input
              className={styles.input}
              value={title}
              maxLength={40}
              placeholder="例：今晚吃什么？"
              onChange={(event) => {
                setTitle(event.target.value);
                updateProgress(58);
              }}
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
            <i className="fa-solid fa-bolt" /> PK选项 <span className={styles.required}>*</span>
            <span className={styles.stepTag}>待完善</span>
          </div>
          <div className={styles.vsWrap}>
            <input
              className={`${styles.optionInput} ${styles.optionA}`}
              value={optA}
              placeholder="选项 A"
              onChange={(event) => {
                setOptA(event.target.value);
                updateProgress(68);
              }}
            />
            <div className={styles.vsBadge}>VS</div>
            <input
              className={`${styles.optionInput} ${styles.optionB}`}
              value={optB}
              placeholder="选项 B"
              onChange={(event) => {
                setOptB(event.target.value);
                updateProgress(68);
              }}
            />
          </div>
          <button
            className={styles.swapBtn}
            type="button"
            onClick={() => {
              setOptA(optB);
              setOptB(optA);
            }}
          >
            <i className="fa-solid fa-arrow-right-arrow-left" /> 交换选项
          </button>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-user-group" /> 邀请好友参战 <span className={styles.required}>*</span>
            <span className={styles.stepTag}>待完善</span>
          </div>
          <div className={styles.friendHeader}>
            <span className={styles.friendCount}>已选 {selectedFriends.length} 人</span>
          </div>
          <div className={styles.search}>
            <i className="fa-solid fa-magnifying-glass" />
            <input value={search} placeholder="搜索好友..." onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className={styles.friendGrid}>
            {filteredFriends.map((friend) => {
              const active = selectedFriends.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  className={`${styles.friendCard} ${active ? styles.friendCardActive : ""}`}
                  type="button"
                  onClick={() => toggleFriend(friend.id)}
                >
                  <span className={styles.friendCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                  <span className={`${styles.friendOnline} ${friend.status === "online" ? styles.online : styles.offline}`} />
                  <img className={styles.friendAvatar} src={friend.avatar} alt="" />
                  <span className={styles.friendName}>{friend.name.slice(0, 4)}</span>
                  <span className={styles.friendWinrate}>胜率{friend.winrate}%</span>
                </button>
              );
            })}
            <button className={styles.inviteMore} type="button" onClick={() => setPreviewOpen(true)}>
              <span className={styles.inviteMoreIcon}>
                <PlusIcon />
              </span>
              <span className={styles.inviteMoreText}>邀请</span>
            </button>
          </div>
          <div className={styles.selectedTags}>
            {selectedFriendItems.map((friend) => (
              <span key={friend.id} className={styles.selectedTag}>
                <img src={friend.avatar} alt="" />
                {friend.name.slice(0, 4)}
                <button type="button" onClick={() => toggleFriend(friend.id)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </span>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-people-group" /> 发布到社群
            <span className={styles.optional}>(选填)</span>
          </div>
          <div className={styles.groupList}>
            {groups.map((group) => {
              const active = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  className={`${styles.groupCard} ${active ? styles.groupCardActive : ""}`}
                  type="button"
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <img className={styles.groupAvatar} src={group.avatar} alt="" />
                  <div className={styles.groupInfo}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupMeta}>{group.members}人 · {group.desc}</div>
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
            <i className="fa-solid fa-gear" /> 竞猜设置
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>截止时间</div>
              <div className={styles.settingDesc}>到时间自动开奖</div>
            </div>
            <input className={styles.deadline} type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>匿名投票</div>
              <div className={styles.settingDesc}>好友看不到彼此选择</div>
            </div>
            <button className={`${styles.toggle} ${anonVote ? styles.toggleOn : ""}`} type="button" onClick={() => setAnonVote((value) => !value)}>
              <span />
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>允许评论</div>
              <div className={styles.settingDesc}>好友可以发表看法</div>
            </div>
            <button className={`${styles.toggle} ${allowComment ? styles.toggleOn : ""}`} type="button" onClick={() => setAllowComment((value) => !value)}>
              <span />
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>赌注加码 🎲</div>
              <div className={styles.settingDesc}>输的人请客/发红包</div>
            </div>
            <button className={`${styles.toggle} ${stakeEnabled ? styles.toggleOn : ""}`} type="button" onClick={() => setStakeEnabled((value) => !value)}>
              <span />
            </button>
          </div>
          {stakeEnabled ? (
            <div className={styles.stakeArea}>
              <div className={styles.stakeQuick}>
                {stakeChips.map((item) => (
                  <button
                    key={item}
                    className={`${styles.stakeChip} ${selectedStake === item ? styles.stakeChipActive : ""}`}
                    type="button"
                    onClick={() => setSelectedStake(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <input
                className={styles.input}
                value={stakeCustom}
                placeholder="自定义赌注内容..."
                maxLength={30}
                onChange={(event) => setStakeCustom(event.target.value)}
              />
            </div>
          ) : null}
        </article>
      </section>

      <div className={styles.previewBar}>
        <div className={styles.previewVs}>
          <span className={styles.previewA}>{optA || "--"}</span>
          <span className={styles.previewBadge}>VS</span>
          <span className={styles.previewB}>{optB || "--"}</span>
        </div>
        <div className={styles.previewFriends}>{selectedFriends.length}人参战</div>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.secondaryBtn} type="button" onClick={() => setPreviewOpen(true)}>
          预览
        </button>
        <button className={styles.primaryBtn} type="button" onClick={publishGuess}>
          <i className="fa-solid fa-paper-plane" /> 发起竞猜
        </button>
      </div>

      {previewOpen ? (
        <div className={styles.modalOverlay} onClick={(event) => event.target === event.currentTarget && setPreviewOpen(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>竞猜预览</div>
              <button className={styles.modalClose} type="button" onClick={() => setPreviewOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className={styles.modalBody}>
              <section className={styles.previewCard}>
                <div className={styles.previewTitle}>{title || "竞猜标题"}</div>
                <div className={styles.previewDesc}>{desc || "输入竞猜详情或规则..."}</div>
                <div className={styles.previewVsLarge}>
                  <div className={`${styles.previewOption} ${styles.previewOptionA}`}>
                    <div className={styles.previewOptionName}>{optA || "选项 A"}</div>
                    <div className={styles.previewOptionLabel}>A 方阵营</div>
                  </div>
                  <div className={styles.previewVsCircle}>VS</div>
                  <div className={`${styles.previewOption} ${styles.previewOptionB}`}>
                    <div className={styles.previewOptionName}>{optB || "选项 B"}</div>
                    <div className={styles.previewOptionLabel}>B 方阵营</div>
                  </div>
                </div>
                <div className={styles.previewMeta}>
                  <span><i className="fa-regular fa-clock" /> {deadline.replace("T", " ")}</span>
                  <span><i className="fa-regular fa-user" /> {selectedFriends.length} 位好友</span>
                  <span><i className="fa-solid fa-people-group" /> {selectedGroup ? "已选社群" : "未发布社群"}</span>
                  <span><i className="fa-solid fa-gift" /> {previewStake}</span>
                </div>
                <div className={styles.previewFriendsRow}>
                  {selectedFriendItems.slice(0, 4).map((friend) => (
                    <img key={friend.id} className={styles.previewFriendAvatar} src={friend.avatar} alt="" />
                  ))}
                  <span className={styles.previewFriendsText}>{selectedFriends.length}人参战</span>
                </div>
                <div className={styles.previewWarnings}>
                  <div className={styles.previewWarningsTitle}>发布提醒</div>
                  <div className={styles.previewWarningItem}>确认标题、选项、好友和社群选择无误</div>
                  <div className={styles.previewWarningItem}>开启赌注后，好友会看到加码内容</div>
                </div>
              </section>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={() => setPreviewOpen(false)}>
                继续编辑
              </button>
              <button className={styles.primaryBtn} type="button" onClick={() => {
                setPreviewOpen(false);
                publishGuess();
              }}>
                确认发布
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publishOpen ? (
        <div className={styles.publishOverlay}>
          <div className={styles.publishCard}>
            <div className={styles.publishIcon}>⏳</div>
            <div className={styles.publishTitle}>正在发送竞猜...</div>
            <div className={styles.publishDesc}>正在推送给好友</div>
            <div className={styles.publishBar}>
              <span className={styles.publishFill} />
            </div>
            <div className={styles.publishSteps}>
              <div className={styles.publishStep}><i className="fa-regular fa-circle" /> 检查竞猜信息</div>
              <div className={styles.publishStep}><i className="fa-regular fa-circle" /> 推送给好友</div>
              <div className={styles.publishStep}><i className="fa-regular fa-circle" /> 发布到社群</div>
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className={styles.successOverlay} onClick={(event) => event.target === event.currentTarget && setSuccessOpen(false)}>
          <div className={styles.successCard}>
            <div className={styles.successEmoji}>🎉</div>
            <div className={styles.successTitle}>竞猜已发起！</div>
            <div className={styles.successDesc}>已发送给好友，等待参战</div>
            <div className={styles.successShares}>
              <button className={styles.shareItem} type="button" onClick={() => setSuccessOpen(false)}>
                <span className={styles.shareIcon}><i className="fa-solid fa-link" /></span>
                <span className={styles.shareLabel}>复制链接</span>
              </button>
              <button className={styles.shareItem} type="button">
                <span className={styles.shareIcon}><i className="fa-brands fa-weixin" /></span>
                <span className={styles.shareLabel}>微信</span>
              </button>
              <button className={styles.shareItem} type="button">
                <span className={styles.shareIcon}><i className="fa-solid fa-users" /></span>
                <span className={styles.shareLabel}>猜友圈</span>
              </button>
              <button className={styles.shareItem} type="button">
                <span className={styles.shareIcon}><i className="fa-solid fa-image" /></span>
                <span className={styles.shareLabel}>海报</span>
              </button>
            </div>
            <button className={styles.primaryBtnFull} type="button" onClick={() => router.push("/")}>
              返回首页
            </button>
            <button className={styles.laterBtn} type="button" onClick={() => setSuccessOpen(false)}>
              稍后再说
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
