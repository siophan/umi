"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const rewards = [
  { day: 1, reward: "5 零食币", claimed: true },
  { day: 2, reward: "8 零食币", claimed: true },
  { day: 3, reward: "10 零食币", claimed: true },
  { day: 4, reward: "12 零食币", claimed: true },
  { day: 5, reward: "15 零食币", claimed: true },
  { day: 6, reward: "20 零食币", claimed: true },
  { day: 7, reward: "超级大礼包", claimed: false },
];

const tasks = [
  { icon: "🎯", name: "参与1次竞猜", reward: "+10零食币", done: false },
  { icon: "💬", name: "发布1条动态", reward: "+5零食币", done: false },
  { icon: "👥", name: "邀请1位好友", reward: "+50零食币", done: false },
  { icon: "📺", name: "观看1场直播", reward: "已完成 ✓", done: true },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

export default function CheckinPage() {
  const router = useRouter();
  const [streak, setStreak] = useState(7);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");

  const timeline = useMemo(
    () =>
      rewards.map((item, index) => ({
        ...item,
        state: item.claimed ? "claimed" : index === streak ? "current" : "future",
      })),
    [streak],
  );

  const doCheckin = () => {
    if (done) return;
    setDone(true);
    setStreak((value) => value + 1);
    setToast("🎉 签到成功！+50零食币");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <ArrowIcon />
        </button>
        <div className={styles.title}>签到打卡</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.hero}>
        <div className={styles.streakNum}>{streak}</div>
        <div className={styles.streakLabel}>连续签到天数</div>
        <div className={styles.streakTotal}>累计签到 45 天</div>
      </section>

      <section className={styles.btnArea}>
        <button className={`${styles.checkinBtn} ${done ? styles.checkinDone : ""}`} type="button" onClick={doCheckin} disabled={done}>
          <div className={styles.btnIcon}>{done ? "✅" : "📅"}</div>
          <div>{done ? "已签到" : "签到"}</div>
        </button>
        <p className={styles.tip}>连续签到7天可获得超级大礼包！</p>
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>签到奖励</div>
      </div>
      <section className={styles.timeline}>
        {timeline.map((item) => (
          <div key={item.day} className={styles.row}>
            <div className={`${styles.dot} ${styles[item.state]}`}>{item.claimed ? "✓" : item.day}</div>
            <div className={styles.info}>
              <div className={styles.day}>第{item.day}天</div>
              <div className={styles.reward}>{item.reward}</div>
            </div>
            <div className={`${styles.status} ${styles[item.state]}`}>{item.claimed ? "已领取" : item.state === "current" ? "今日" : ""}</div>
          </div>
        ))}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>每日任务</div>
      </div>
      <section className={styles.taskSection}>
        {tasks.map((task) => (
          <article key={task.name} className={styles.taskItem}>
            <div className={styles.taskIcon}>{task.icon}</div>
            <div className={styles.taskInfo}>
              <div className={styles.taskName}>{task.name}</div>
              <div className={styles.taskReward}>{task.reward}</div>
            </div>
            {task.done ? (
              <span className={styles.doneText}>已完成 ✓</span>
            ) : (
              <button className={styles.taskBtn} type="button">
                去完成
              </button>
            )}
          </article>
        ))}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
