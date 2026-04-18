"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearAuthToken, fetchMe, updateMe } from "../../lib/api";
import styles from "./page.module.css";

const level = {
  name: "Lv.8 资深猜手",
  sub: "再获得 420 经验升级",
  xp: "2,580 / 3,000 XP",
  fill: "86%",
};

const coverColors = ["linear-gradient(135deg,#667eea,#764ba2)", "linear-gradient(135deg,#ff6b35,#ff2442)", "linear-gradient(135deg,#0f2027,#203a43,#2c5364)"];
const avatars = [
  { id: "main", src: "/legacy/images/mascot/mouse-main.png" },
  { id: "happy", src: "/legacy/images/mascot/mouse-happy.png" },
  { id: "casual", src: "/legacy/images/mascot/mouse-casual.png" },
  { id: "dove", src: "/legacy/images/products/p007-dove.jpg" },
  { id: "cola", src: "/legacy/images/products/p004-cola.jpg" },
  { id: "lays", src: "/legacy/images/products/p006-lays.jpg" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [coverIndex, setCoverIndex] = useState(0);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other">("other");
  const [location, setLocation] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const user = await fetchMe();
        if (ignore) {
          return;
        }

        setName(user.name || "");
        setBio(user.signature || "");
        setGender((user.gender as "female" | "male" | "other" | null) || "other");
        setLocation(user.region || "");

        const matchedAvatarIndex = avatars.findIndex((item) => user.avatar === item.src);
        if (matchedAvatarIndex >= 0) {
          setAvatarIndex(matchedAvatarIndex);
        }
      } catch {
        if (ignore) {
          return;
        }
        clearAuthToken();
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/edit-profile")}`);
        return;
      }

      if (!ignore) {
        setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [pathname, router]);

  async function handleSave() {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      await updateMe({
        name,
        avatar: avatars[avatarIndex]?.src || avatars[0].src,
        signature: bio,
        gender,
        region: location,
      });
      setToast("保存成功");
      window.setTimeout(() => {
        router.back();
      }, 800);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
      window.setTimeout(() => {
        setToast("");
      }, 1800);
    }
  }

  const currentAvatar = avatars[avatarIndex]?.src || avatars[0].src;

  if (loading) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.headerBack} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>编辑主页</div>
        <button className={styles.headerSave} type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "保存中" : "保存"}
        </button>
      </header>

      <section className={styles.cover} role="button" tabIndex={0} onClick={() => setCoverIndex((n) => (n + 1) % coverColors.length)}>
        <div className={styles.coverPreview} style={{ background: coverColors[coverIndex] }} />
        <div className={styles.coverOverlay}>
          <i className="fa-solid fa-camera" />
          更换封面
        </div>
      </section>

      <section className={styles.avatarSection}>
        <button className={styles.avatarWrap} type="button" onClick={() => setAvatarIndex((n) => (n + 1) % avatars.length)}>
          <div className={styles.avatarPreview}>
            <img src={currentAvatar} alt={name || "头像"} />
          </div>
          <div className={styles.avatarBadge}>
            <i className="fa-solid fa-camera" />
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
            查看详情 <i className="fa-solid fa-chevron-right" />
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
          <span className={styles.lock}>
            <i className="fa-solid fa-lock" />
          </span>
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
              key={item.id}
              type="button"
              className={`${styles.avatarPick} ${avatarIndex === index ? styles.avatarPickActive : ""}`}
              onClick={() => setAvatarIndex(index)}
            >
              <img src={item.src} alt={item.id} />
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
