"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchMe, updateMe } from "../../lib/api/auth";
import { EditProfileMainSections } from "./edit-profile-main-sections";
import { EditProfileOverlays } from "./edit-profile-overlays";
import {
  avatarOptions,
  defaultSignature,
  levelSteps,
  type FavPrivacy,
  type GenderSelection,
  type SheetType,
  type WorksPrivacy,
} from "./edit-profile-helpers";
import styles from "./page.module.css";

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
  const [worksPrivacy, setWorksPrivacy] = useState<WorksPrivacy>("all");
  const [favPrivacy, setFavPrivacy] = useState<FavPrivacy>("all");
  const [levelOpen, setLevelOpen] = useState(false);
  const [sheetType, setSheetType] = useState<SheetType>(null);
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
  const currentLevelTitle = currentLevel.title;
  const currentLevelIcon = currentLevel.icon;

  function openSheet(type: Exclude<SheetType, null>) {
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

      <EditProfileMainSections
        avatar={currentAvatar}
        name={name}
        userUid={userUid}
        bio={bio}
        gender={gender}
        birthdayLabel={birthdayLabel}
        birthday={birthday}
        locationLabel={locationLabel}
        trimmedLocation={trimmedLocation}
        worksPrivacy={worksPrivacy}
        favPrivacy={favPrivacy}
        level={level}
        title={title}
        currentLevelTitle={currentLevelTitle}
        currentLevelIcon={currentLevelIcon}
        currentXp={currentXp}
        nextXpNeed={nextXpNeed}
        levelProgress={levelProgress}
        levelRemaining={levelRemaining}
        onNameChange={setName}
        onBioChange={setBio}
        onGenderChange={setGender}
        onWorksPrivacyChange={setWorksPrivacy}
        onFavPrivacyChange={setFavPrivacy}
        onAvatarClick={() => openSheet("avatar")}
        onLevelClick={() => setLevelOpen(true)}
        onBirthdayClick={() => openSheet("birthday")}
        onLocationClick={() => openSheet("location")}
      />

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
      <EditProfileOverlays
        sheetType={sheetType}
        levelOpen={levelOpen}
        level={level}
        title={title}
        currentLevelTitle={currentLevelTitle}
        currentLevelIcon={currentLevelIcon}
        currentXp={currentXp}
        birthYear={birthYear}
        birthMonth={birthMonth}
        birthDay={birthDay}
        onBirthYearChange={setBirthYear}
        onBirthMonthChange={setBirthMonth}
        onBirthDayChange={setBirthDay}
        onCloseSheet={closeSheet}
        onRotateAvatar={rotateAvatar}
        onConfirmBirthday={confirmBirthday}
        onLocationSelect={(value) => {
          setLocation(value);
          closeSheet();
        }}
        onLevelClose={() => setLevelOpen(false)}
      />
    </main>
  );
}
