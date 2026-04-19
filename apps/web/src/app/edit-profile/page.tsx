"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchMe, updateMe } from "../../lib/api";
import styles from "./page.module.css";

const avatarOptions = [
  "/legacy/images/mascot/mouse-main.png",
  "/legacy/images/mascot/mouse-happy.png",
  "/legacy/images/mascot/mouse-casual.png",
  "/legacy/images/mascot/mouse-cute.png",
  "/legacy/images/mascot/mouse-sunny.png",
  "/legacy/images/mascot/mouse-reserved.png",
  "/legacy/images/mascot/mouse-excited.png",
];
const defaultSignature = "零食是生活的甜味剂，竞猜是人生的小确幸。🍬✨";

const levelSteps = [
  { lv: 1, title: "新手猜友", icon: "🌱", xpNeed: 100, perks: ["参与竞猜", "基础点赞评论"] },
  { lv: 2, title: "初级猜手", icon: "🌿", xpNeed: 300, perks: ["发布动态", "创建2选项竞猜"] },
  { lv: 3, title: "进阶猜手", icon: "🌳", xpNeed: 600, perks: ["好友PK功能", "每日3次免费竞猜"] },
  { lv: 4, title: "资质猜手", icon: "⭐", xpNeed: 1000, perks: ["创建3选项竞猜", "评论置顶特权"] },
  { lv: 5, title: "优秀猜手", icon: "🌟", xpNeed: 1500, perks: ["自定义头像框", "专属昵称颜色"] },
  { lv: 6, title: "精英猜手", icon: "💫", xpNeed: 2000, perks: ["创建品牌竞猜", "每日5次免费竞猜"] },
  { lv: 7, title: "高级猜手", icon: "🔥", xpNeed: 2500, perks: ["申请品牌授权", "数据分析面板"] },
  { lv: 8, title: "资深猜手", icon: "🏆", xpNeed: 3000, perks: ["开通店铺", "竞猜手续费减免20%"] },
  { lv: 9, title: "大师猜手", icon: "👑", xpNeed: 4000, perks: ["置顶推荐位", "手续费减免30%"] },
  { lv: 10, title: "传奇猜手", icon: "🏅", xpNeed: 5000, perks: ["专属传奇标识", "全部特权", "手续费减免50%"] },
] as const;

const xpRules = [
  { action: "参与竞猜", xp: 10, icon: "🎯" },
  { action: "竞猜猜中", xp: 30, icon: "✅" },
  { action: "PK对战胜利", xp: 25, icon: "⚔️" },
  { action: "发布动态", xp: 15, icon: "📝" },
  { action: "获得点赞", xp: 2, icon: "❤️" },
  { action: "每日签到", xp: 5, icon: "📅" },
  { action: "邀请好友", xp: 50, icon: "🤝" },
  { action: "首次购买商品", xp: 20, icon: "🛒" },
] as const;

const cityOptions = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "重庆", "西安", "长沙", "苏州"];

type GenderSelection = "female" | "male" | "other";

export default function EditProfilePage() {
  const router = useRouter();
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(avatarOptions[0]);
  const [userUid, setUserUid] = useState("");
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState("");
  const [totalGuess, setTotalGuess] = useState(0);
  const [wins, setWins] = useState(0);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<GenderSelection>("other");
  const [birthday, setBirthday] = useState("");
  const [location, setLocation] = useState("");
  const [worksPrivacy, setWorksPrivacy] = useState<"all" | "friends" | "me">("all");
  const [favPrivacy, setFavPrivacy] = useState<"all" | "me">("all");
  const [levelOpen, setLevelOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"avatar" | "cover" | "birthday" | "location" | null>(null);
  const [birthYear, setBirthYear] = useState("1998");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthDay, setBirthDay] = useState("1");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialProfile, setInitialProfile] = useState({
    avatar: avatarOptions[0],
    name: "",
    bio: "",
    gender: "other" as GenderSelection,
    birthday: "",
    location: "",
    worksPrivacy: "all" as "all" | "friends" | "me",
    favPrivacy: "all" as "all" | "me",
  });

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const user = await fetchMe();
        if (ignore) {
          return;
        }

        setName(user.name || "");
        const nextBio = user.signature || defaultSignature;

        setBio(nextBio);
        setGender((user.gender as GenderSelection | null) || "other");
        setBirthday(user.birthday || "");
        setLocation(user.region || "");
        setUserUid(user.uid || "");
        setLevel(user.level || 1);
        setTitle(user.title || "");
        setTotalGuess(user.totalGuess || 0);
        setWins(user.wins || 0);
        setWorksPrivacy(user.worksPrivacy || "all");
        setFavPrivacy(user.favPrivacy || "all");

        const matchedAvatarIndex = avatarOptions.findIndex((avatar) => user.avatar === avatar);
        const nextAvatarIndex = matchedAvatarIndex >= 0 ? matchedAvatarIndex : 0;
        setAvatarIndex(nextAvatarIndex);
        setAvatarUrl(user.avatar || avatarOptions[nextAvatarIndex] || avatarOptions[0]);
        setInitialProfile({
          avatar: user.avatar || avatarOptions[nextAvatarIndex] || avatarOptions[0],
          name: user.name || "",
          bio: nextBio,
          gender: (user.gender as GenderSelection | null) || "other",
          birthday: user.birthday || "",
          location: user.region || "",
          worksPrivacy: user.worksPrivacy || "all",
          favPrivacy: user.favPrivacy || "all",
        });
      } catch {
        if (ignore) {
          return;
        }
        router.replace("/login?redirect=/edit-profile");
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
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!birthday) {
      return;
    }

    const [year, month, day] = birthday.split("-");
    if (year && month && day) {
      setBirthYear(year);
      setBirthMonth(String(Number(month)));
      setBirthDay(String(Number(day)));
    }
  }, [birthday]);

  const trimmedName = name.trim();
  const trimmedBio = bio.trim();
  const trimmedLocation = location.trim();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentLevel = levelSteps[Math.max(0, Math.min(levelSteps.length - 1, level - 1))] || levelSteps[0];
  const prevXpNeed = level > 1 ? (levelSteps[level - 2]?.xpNeed || 0) : 0;
  const currentXp = Math.max(prevXpNeed, Math.round(totalGuess * 18 + wins * 35));
  const nextXpNeed = currentLevel.xpNeed;
  const levelProgress = Math.max(8, Math.min(100, ((currentXp - prevXpNeed) / Math.max(1, nextXpNeed - prevXpNeed)) * 100));
  const levelRemaining = Math.max(0, nextXpNeed - currentXp);
  const isDirty =
    avatarUrl !== initialProfile.avatar ||
    trimmedName !== initialProfile.name.trim() ||
    trimmedBio !== initialProfile.bio.trim() ||
    gender !== initialProfile.gender ||
    birthday !== initialProfile.birthday ||
    trimmedLocation !== initialProfile.location.trim() ||
    worksPrivacy !== initialProfile.worksPrivacy ||
    favPrivacy !== initialProfile.favPrivacy;
  async function handleSave() {
    if (saving) {
      return;
    }

    if (trimmedName.length < 2) {
      setToast("昵称长度至少2位");
      return;
    }

    if (!isDirty) {
      setToast("资料未变更");
      return;
    }

    try {
      setSaving(true);
      await updateMe({
        name: trimmedName,
        avatar: avatarUrl,
        signature: trimmedBio,
        gender: gender === "other" ? null : gender,
        birthday,
        region: trimmedLocation,
        worksPrivacy,
        favPrivacy,
      });
      setToast("保存成功");
      window.setTimeout(() => {
        router.back();
      }, 800);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const currentAvatar = avatarUrl || avatarOptions[0];
  const birthdayLabel = birthday ? `${birthYear}年${birthMonth}月${birthDay}日` : "未设置";
  const locationLabel = trimmedLocation || "未设置";

  function openSheet(type: "avatar" | "cover" | "birthday" | "location") {
    setSheetType(type);
  }

  function closeSheet() {
    setSheetType(null);
  }

  function rotateAvatar() {
    setAvatarIndex((value) => {
      const next = (value + 1) % avatarOptions.length;
      setAvatarUrl(avatarOptions[next] || avatarOptions[0]);
      return next;
    });
    setToast("已切换预设头像");
    closeSheet();
  }

  function confirmBirthday() {
    const nextBirthday = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;
    if (nextBirthday > today) {
      setToast("生日不能晚于今天");
      return;
    }
    setBirthday(nextBirthday);
    closeSheet();
  }

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

      <section className={styles.cover}>
        <button className={styles.coverButton} type="button" onClick={() => openSheet("cover")}>
          <div className={styles.coverPreview} />
          <div className={styles.coverOverlay}>
            <i className="fa-solid fa-camera" />
            更换封面
          </div>
        </button>
      </section>

      <section className={styles.avatarSection}>
        <div>
          <button className={styles.avatarWrap} type="button" onClick={() => openSheet("avatar")}>
            <div className={styles.avatarPreview}>
              <img src={currentAvatar} alt={name || "头像"} />
            </div>
            <div className={styles.avatarBadge}>
              <i className="fa-solid fa-camera" />
            </div>
          </button>
          <div className={styles.avatarLabel}>点击更换头像</div>
        </div>
      </section>

      <div className={styles.sectionTitle}>会员等级</div>
      <div className={styles.levelCard} onClick={() => setLevelOpen(true)} role="button" tabIndex={0} onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setLevelOpen(true);
        }
      }}>
        <div className={styles.levelTop}>
          <div className={styles.levelLeft}>
            <span className={styles.levelIcon}>{currentLevel.icon}</span>
            <div>
              <div className={styles.levelName}>{title ? `Lv.${level} ${title}` : `Lv.${level} ${currentLevel.title}`}</div>
              <div className={styles.levelSub}>{levelRemaining > 0 ? `再获得 ${levelRemaining} 经验升级` : "已达到当前等级上限"}</div>
            </div>
          </div>
          <div className={styles.levelRight}>
            查看详情 <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }} />
          </div>
        </div>
        <div className={styles.levelBar}>
          <div className={styles.levelFill} style={{ width: `${levelProgress}%` }} />
        </div>
        <div className={styles.levelDesc}>{currentXp.toLocaleString()} / {nextXpNeed.toLocaleString()} XP</div>
      </div>

      <div className={styles.sectionTitle}>基本信息</div>
      <section className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>昵称</span>
          <input value={name} maxLength={16} onChange={(event) => setName(event.target.value)} placeholder="请输入昵称" />
          <span className={styles.count}>{name.length}/16</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>优米号</span>
          <span className={styles.value}>{userUid || "--"}</span>
          <span className={styles.lock}>
            <i className="fa-solid fa-lock" />
          </span>
        </div>
        <div className={`${styles.row} ${styles.rowTop}`}>
          <span className={styles.label}>个性签名</span>
          <textarea value={bio} maxLength={60} onChange={(event) => setBio(event.target.value)} placeholder="介绍一下自己..." />
          <span className={styles.count}>{bio.length}/60</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>性别</span>
          <div className={styles.genderGroup}>
            {[
              { key: "male", label: "男", icon: "fa-solid fa-mars" },
              { key: "female", label: "女", icon: "fa-solid fa-venus" },
              { key: "other", label: "保密" },
            ].map((item) => (
              <button
                key={item.key}
                className={`${styles.genderBtn} ${gender === item.key ? styles.genderActive : ""}`}
                type="button"
                onClick={() => setGender(item.key as typeof gender)}
              >
                {item.icon ? <i className={item.icon} /> : null}
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button className={styles.navRow} type="button" onClick={() => openSheet("birthday")}>
          <span className={styles.label}>生日</span>
          <span className={`${styles.value} ${birthday ? styles.valueActive : ""}`}>{birthdayLabel}</span>
          <span className={styles.arrow}>
            <i className="fa-solid fa-chevron-right" />
          </span>
        </button>
        <button className={styles.navRow} type="button" onClick={() => openSheet("location")}>
          <span className={styles.label}>地区</span>
          <span className={`${styles.value} ${trimmedLocation ? styles.valueActive : ""}`}>{locationLabel}</span>
          <span className={styles.arrow}>
            <i className="fa-solid fa-chevron-right" />
          </span>
        </button>
      </section>

      <div className={styles.sectionTitle}>隐私设置</div>
      <section className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>作品可见</span>
          <div className={styles.genderGroup}>
            {[
              { key: "all", label: "所有人" },
              { key: "friends", label: "好友" },
              { key: "me", label: "仅自己" },
            ].map((item) => (
              <button
                key={item.key}
                className={`${styles.genderBtn} ${worksPrivacy === item.key ? styles.genderActive : ""}`}
                type="button"
                onClick={() => setWorksPrivacy(item.key as "all" | "friends" | "me")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>收藏可见</span>
          <div className={styles.genderGroup}>
            {[
              { key: "all", label: "所有人" },
              { key: "me", label: "仅自己" },
            ].map((item) => (
              <button
                key={item.key}
                className={`${styles.genderBtn} ${favPrivacy === item.key ? styles.genderActive : ""}`}
                type="button"
                onClick={() => setFavPrivacy(item.key as "all" | "me")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
      {sheetType ? (
        <div className={styles.overlay} onClick={closeSheet} role="presentation">
          <div className={styles.sheet} onClick={(event) => event.stopPropagation()} role="presentation">
            {sheetType === "avatar" || sheetType === "cover" ? (
              <>
                <button className={styles.sheetItem} type="button" onClick={rotateAvatar}>
                  <i className="fa-solid fa-image" /> 从相册选择
                </button>
                <button className={styles.sheetItem} type="button" onClick={rotateAvatar}>
                  <i className="fa-solid fa-camera" /> 拍照
                </button>
                {sheetType === "avatar" ? (
                  <button className={styles.sheetItem} type="button" onClick={closeSheet}>
                    <i className="fa-solid fa-eye" /> 查看头像
                  </button>
                ) : null}
                <button className={styles.sheetCancel} type="button" onClick={closeSheet}>
                  取消
                </button>
              </>
            ) : null}
            {sheetType === "birthday" ? (
              <>
                <div className={styles.sheetTitle}>选择生日</div>
                <div className={styles.birthSelectors}>
                  <select value={birthYear} onChange={(event) => setBirthYear(event.target.value)}>
                    {Array.from({ length: 50 }, (_, index) => String(2008 - index)).map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                  <select value={birthMonth} onChange={(event) => setBirthMonth(event.target.value)}>
                    {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
                      <option key={month} value={month}>
                        {month}月
                      </option>
                    ))}
                  </select>
                  <select value={birthDay} onChange={(event) => setBirthDay(event.target.value)}>
                    {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((day) => (
                      <option key={day} value={day}>
                        {day}日
                      </option>
                    ))}
                  </select>
                </div>
                <button className={`${styles.sheetItem} ${styles.sheetItemPrimary}`} type="button" onClick={confirmBirthday}>
                  确定
                </button>
                <button className={styles.sheetCancel} type="button" onClick={closeSheet}>
                  取消
                </button>
              </>
            ) : null}
            {sheetType === "location" ? (
              <>
                <div className={styles.sheetTitle}>选择地区</div>
                <div className={styles.cityGrid}>
                  {cityOptions.map((city) => (
                    <button
                      key={city}
                      className={styles.cityItem}
                      type="button"
                      onClick={() => {
                        setLocation(city);
                        closeSheet();
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                <button className={styles.sheetCancel} type="button" onClick={closeSheet}>
                  取消
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      {levelOpen ? (
        <div className={styles.levelOverlay} onClick={() => setLevelOpen(false)} role="presentation">
          <div className={styles.levelSheet} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.levelSheetHeader}>
              <div className={styles.levelSheetIcon}>{currentLevel.icon}</div>
              <div className={styles.levelSheetTitle}>{title ? `Lv.${level} ${title}` : `Lv.${level} ${currentLevel.title}`}</div>
              <div className={styles.levelSheetSub}>当前经验 {currentXp.toLocaleString()} XP</div>
            </div>
            <div className={styles.levelBlockTitle}>📊 等级进度</div>
            <div className={styles.levelRoute}>
              {levelSteps.map((item) => (
                <div key={item.lv} className={`${styles.levelRouteItem} ${item.lv === level ? styles.levelRouteCurrent : item.lv < level ? styles.levelRouteDone : ""}`}>
                  <span className={styles.levelRouteIcon}>{item.icon}</span>
                  <div className={styles.levelRouteBody}>
                    <div className={styles.levelRouteName}>Lv.{item.lv} {item.title}</div>
                    <div className={styles.levelRouteXp}>需 {item.xpNeed.toLocaleString()} XP</div>
                  </div>
                  <span className={styles.levelRouteState}>{item.lv < level ? "✅" : item.lv === level ? "当前" : "🔒"}</span>
                </div>
              ))}
            </div>
            <div className={styles.levelBlockTitle}>🎁 当前等级权益</div>
            <div className={styles.perkCard}>
              {currentLevel.perks.map((perk) => (
                <div key={perk} className={styles.perkItem}>
                  <i className="fa-solid fa-circle-check" />
                  {perk}
                </div>
              ))}
            </div>
            <div className={styles.levelBlockTitle}>📈 获取经验值途径</div>
            <div className={styles.ruleGrid}>
              {xpRules.map((rule) => (
                <div key={rule.action} className={styles.ruleItem}>
                  <span className={styles.ruleIcon}>{rule.icon}</span>
                  <div>
                    <div className={styles.ruleName}>{rule.action}</div>
                    <div className={styles.ruleXp}>+{rule.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.levelCloseBtn} type="button" onClick={() => setLevelOpen(false)}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
