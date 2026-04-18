"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const level = {
  name: "Lv.8 资深猜手",
  sub: "再获得 420 经验升级",
  xp: "2,580 / 3,000 XP",
  fill: "86%",
};

const coverColors = ["linear-gradient(135deg,#667eea,#764ba2)", "linear-gradient(135deg,#ff6b35,#ff2442)", "linear-gradient(135deg,#0f2027,#203a43,#2c5364)"];
const avatars = ["A", "J", "M", "L", "N", "Z"];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4.5h6l1.2 2h2.8A2.5 2.5 0 0 1 21.5 9v8A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V9A2.5 2.5 0 0 1 5 6.5h2.8L9 4.5Zm3 4a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5Z" />
    </svg>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [coverIndex, setCoverIndex] = useState(0);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [name, setName] = useState("SnackHunter_001");
  const [bio, setBio] = useState("今天也要认真猜对。");
  const [gender, setGender] = useState<"female" | "male" | "other">("other");
  const [location, setLocation] = useState("上海 · 浦东新区");
  const [toast, setToast] = useState("");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.headerBack} type="button" onClick={() => router.back()}>
          <ArrowIcon />
        </button>
        <div className={styles.headerTitle}>编辑主页</div>
        <button className={styles.headerSave} type="button" onClick={() => setToast("保存成功")}>
          保存
        </button>
      </header>

      <section className={styles.cover} role="button" tabIndex={0} onClick={() => setCoverIndex((n) => (n + 1) % coverColors.length)}>
        <div className={styles.coverPreview} style={{ background: coverColors[coverIndex] }} />
        <div className={styles.coverOverlay}>
          <CameraIcon />
          更换封面
        </div>
      </section>

      <section className={styles.avatarSection}>
        <button className={styles.avatarWrap} type="button" onClick={() => setAvatarIndex((n) => (n + 1) % avatars.length)}>
          <div className={styles.avatarPreview}>{avatars[avatarIndex]}</div>
          <div className={styles.avatarBadge}>
            <CameraIcon />
          </div>
        </button>
        <div className={styles.avatarLabel}>点击更换头像</div>
      </section>

      <div className={styles.sectionTitle}>会员等级</div>
      <section className={styles.levelCard} onClick={() => setToast("查看等级详情")}>
        <div className={styles.levelTop}>
          <div className={styles.levelLeft}>
            <span className={styles.levelIcon}>🏆</span>
            <div>
              <div className={styles.levelName}>{level.name}</div>
              <div className={styles.levelSub}>{level.sub}</div>
            </div>
          </div>
          <div className={styles.levelRight}>
            查看详情 <ArrowIcon />
          </div>
        </div>
        <div className={styles.levelBar}>
          <div className={styles.levelFill} style={{ width: level.fill }} />
        </div>
        <div className={styles.levelDesc}>{level.xp}</div>
      </section>

      <div className={styles.sectionTitle}>基本信息</div>
      <section className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>昵称</span>
          <input value={name} maxLength={16} onChange={(event) => setName(event.target.value)} placeholder="请输入昵称" />
          <span className={styles.count}>{name.length}/16</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>优米号</span>
          <span className={styles.value}>SnackHunter_001</span>
          <span className={styles.lock}>🔒</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>性别</span>
          <div className={styles.genderGroup}>
            {["female", "male", "other"].map((item) => (
              <button
                key={item}
                className={`${styles.genderBtn} ${gender === item ? styles.genderActive : ""}`}
                type="button"
                onClick={() => setGender(item as typeof gender)}
              >
                {item === "female" ? "女" : item === "male" ? "男" : "保密"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>所在地</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="请输入所在地" />
        </div>
        <div className={styles.rowTall}>
          <span className={styles.label}>个人简介</span>
          <textarea value={bio} maxLength={60} onChange={(event) => setBio(event.target.value)} placeholder="介绍一下自己" />
          <span className={styles.count}>{bio.length}/60</span>
        </div>
      </section>

      <div className={styles.avatarSectionBottom}>
        <div className={styles.avatarPickerTitle}>选择头像</div>
        <div className={styles.avatarPicker}>
          {avatars.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`${styles.avatarPick} ${avatarIndex === index ? styles.avatarPickActive : ""}`}
              onClick={() => setAvatarIndex(index)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
