"use client";

import styles from "./page.module.css";
import {
  favPrivacyOptions,
  genderOptions,
  type FavPrivacy,
  type GenderSelection,
  type WorksPrivacy,
  worksPrivacyOptions,
} from "./edit-profile-helpers";

type EditProfileMainSectionsProps = {
  avatar: string;
  name: string;
  userUid: string;
  bio: string;
  gender: GenderSelection;
  birthdayLabel: string;
  birthday: string;
  locationLabel: string;
  trimmedLocation: string;
  worksPrivacy: WorksPrivacy;
  favPrivacy: FavPrivacy;
  level: number;
  title: string;
  currentLevelTitle: string;
  currentLevelIcon: string;
  currentXp: number;
  nextXpNeed: number;
  levelProgress: number;
  levelRemaining: number;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onGenderChange: (value: GenderSelection) => void;
  onWorksPrivacyChange: (value: WorksPrivacy) => void;
  onFavPrivacyChange: (value: FavPrivacy) => void;
  onAvatarClick: () => void;
  onLevelClick: () => void;
  onBirthdayClick: () => void;
  onLocationClick: () => void;
};

export function EditProfileMainSections({
  avatar,
  name,
  userUid,
  bio,
  gender,
  birthdayLabel,
  birthday,
  locationLabel,
  trimmedLocation,
  worksPrivacy,
  favPrivacy,
  level,
  title,
  currentLevelTitle,
  currentLevelIcon,
  currentXp,
  nextXpNeed,
  levelProgress,
  levelRemaining,
  onNameChange,
  onBioChange,
  onGenderChange,
  onWorksPrivacyChange,
  onFavPrivacyChange,
  onAvatarClick,
  onLevelClick,
  onBirthdayClick,
  onLocationClick,
}: EditProfileMainSectionsProps) {
  return (
    <>
      <section className={styles.avatarSection}>
        <div>
          <button className={styles.avatarWrap} type="button" onClick={onAvatarClick}>
            <div className={styles.avatarPreview}>
              <img src={avatar} alt={name || "头像"} />
            </div>
            <div className={styles.avatarBadge}>
              <i className="fa-solid fa-camera" />
            </div>
          </button>
          <div className={styles.avatarLabel}>点击更换头像</div>
        </div>
      </section>

      <div className={styles.sectionTitle}>会员等级</div>
      <div
        className={styles.levelCard}
        onClick={onLevelClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onLevelClick();
          }
        }}
      >
        <div className={styles.levelTop}>
          <div className={styles.levelLeft}>
            <span className={styles.levelIcon}>{currentLevelIcon}</span>
            <div>
              <div className={styles.levelName}>{title ? `Lv.${level} ${title}` : `Lv.${level} ${currentLevelTitle}`}</div>
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
        <div className={styles.levelDesc}>
          {currentXp.toLocaleString()} / {nextXpNeed.toLocaleString()} XP
        </div>
      </div>

      <div className={styles.sectionTitle}>基本信息</div>
      <section className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>昵称</span>
          <input value={name} maxLength={16} onChange={(event) => onNameChange(event.target.value)} placeholder="请输入昵称" />
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
          <textarea value={bio} maxLength={60} onChange={(event) => onBioChange(event.target.value)} placeholder="介绍一下自己..." />
          <span className={styles.count}>{bio.length}/60</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>性别</span>
          <div className={styles.genderGroup}>
            {genderOptions.map((item) => (
              <button
                key={item.key}
                className={`${styles.genderBtn} ${gender === item.key ? styles.genderActive : ""}`}
                type="button"
                onClick={() => onGenderChange(item.key)}
              >
                {"icon" in item ? <i className={item.icon} /> : null}
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button className={styles.navRow} type="button" onClick={onBirthdayClick}>
          <span className={styles.label}>生日</span>
          <span className={`${styles.value} ${birthday ? styles.valueActive : ""}`}>{birthdayLabel}</span>
          <span className={styles.arrow}>
            <i className="fa-solid fa-chevron-right" />
          </span>
        </button>
        <button className={styles.navRow} type="button" onClick={onLocationClick}>
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
            {worksPrivacyOptions.map((item) => (
              <button
                key={item.key}
                className={`${styles.genderBtn} ${worksPrivacy === item.key ? styles.genderActive : ""}`}
                type="button"
                onClick={() => onWorksPrivacyChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>收藏可见</span>
          <div className={styles.genderGroup}>
            {favPrivacyOptions.map((item) => (
              <button
                key={item.key}
                className={`${styles.genderBtn} ${favPrivacy === item.key ? styles.genderActive : ""}`}
                type="button"
                onClick={() => onFavPrivacyChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
