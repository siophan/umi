"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const rewards = [
  { icon: "👤", title: "邀请1位好友", desc: "好友注册即可获得", value: "+50币" },
  { icon: "👥", title: "邀请3位好友", desc: "额外奖励优惠券", value: "+优惠券" },
  { icon: "🏆", title: "邀请10位好友", desc: "获得限量成就徽章", value: "+成就" },
  { icon: "💎", title: "邀请30位好友", desc: "升级VIP特权", value: "VIP" },
];

const records = [
  { name: "小米", time: "2026-04-12 18:20", reward: 50 },
  { name: "阿星", time: "2026-04-10 09:18", reward: 50 },
  { name: "雨桐", time: "2026-04-09 20:01", reward: 50 },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

export default function InvitePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("JY202604");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyLink = () => {
    setToast("链接已复制");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <ArrowIcon />
        </button>
        <div className={styles.title}>邀请有礼</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroIcon}>🎁</div>
        <div className={styles.heroTitle}>邀请好友，一起赢零食！</div>
        <div className={styles.heroDesc}>
          每邀请1位好友注册并参与竞猜
          <br />
          你和好友各获得 <b>50零食币</b>
        </div>
      </section>

      <section className={styles.codeCard}>
        <div className={styles.codeLabel}>我的邀请码</div>
        <div className={styles.code}>{inviteCode}</div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="button" onClick={copyLink}>
            复制链接
          </button>
          <button className={styles.secondaryBtn} type="button" onClick={() => setToast("分享")}>
            分享
          </button>
        </div>
      </section>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>邀请奖励</div>
      </div>
      <section className={styles.rewardList}>
        {rewards.map((item) => (
          <article key={item.title} className={styles.rewardItem}>
            <div className={styles.rewardIcon}>{item.icon}</div>
            <div className={styles.rewardInfo}>
              <div className={styles.rewardTitle}>{item.title}</div>
              <div className={styles.rewardDesc}>{item.desc}</div>
            </div>
            <div className={styles.rewardValue}>{item.value}</div>
          </article>
        ))}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>邀请记录</div>
      </div>
      <section className={styles.recordList}>
        {records.map((item) => (
          <article key={item.name} className={styles.recordItem}>
            <div className={styles.avatar}>{item.name.slice(0, 1)}</div>
            <div className={styles.recordInfo}>
              <div className={styles.recordName}>{item.name}</div>
              <div className={styles.recordTime}>{item.time}</div>
            </div>
            <div className={styles.recordReward}>+{item.reward}币 ✓</div>
          </article>
        ))}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
