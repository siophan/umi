"use client";

import styles from "./page.module.css";
import { cityOptions, levelSteps, type SheetType, xpRules } from "./edit-profile-helpers";

type EditProfileOverlaysProps = {
  sheetType: SheetType;
  levelOpen: boolean;
  level: number;
  title: string;
  currentLevelTitle: string;
  currentLevelIcon: string;
  currentXp: number;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  onBirthYearChange: (value: string) => void;
  onBirthMonthChange: (value: string) => void;
  onBirthDayChange: (value: string) => void;
  onCloseSheet: () => void;
  onRotateAvatar: () => void;
  onConfirmBirthday: () => void;
  onLocationSelect: (value: string) => void;
  onLevelClose: () => void;
};

export function EditProfileOverlays({
  sheetType,
  levelOpen,
  level,
  title,
  currentLevelTitle,
  currentLevelIcon,
  currentXp,
  birthYear,
  birthMonth,
  birthDay,
  onBirthYearChange,
  onBirthMonthChange,
  onBirthDayChange,
  onCloseSheet,
  onRotateAvatar,
  onConfirmBirthday,
  onLocationSelect,
  onLevelClose,
}: EditProfileOverlaysProps) {
  const currentLevel = levelSteps[Math.max(0, Math.min(levelSteps.length - 1, level - 1))] || levelSteps[0];

  return (
    <>
      {sheetType ? (
        <div className={styles.overlay} onClick={onCloseSheet} role="presentation">
          <div className={styles.sheet} onClick={(event) => event.stopPropagation()} role="presentation">
            {sheetType === "avatar" ? (
              <>
                <button className={styles.sheetItem} type="button" onClick={onRotateAvatar}>
                  <i className="fa-solid fa-image" /> 从相册选择
                </button>
                <button className={styles.sheetItem} type="button" onClick={onRotateAvatar}>
                  <i className="fa-solid fa-camera" /> 拍照
                </button>
                <button className={styles.sheetItem} type="button" onClick={onCloseSheet}>
                  <i className="fa-solid fa-eye" /> 查看头像
                </button>
                <button className={styles.sheetCancel} type="button" onClick={onCloseSheet}>
                  取消
                </button>
              </>
            ) : null}
            {sheetType === "birthday" ? (
              <>
                <div className={styles.sheetTitle}>选择生日</div>
                <div className={styles.birthSelectors}>
                  <select value={birthYear} onChange={(event) => onBirthYearChange(event.target.value)}>
                    {Array.from({ length: 50 }, (_, index) => String(2008 - index)).map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                  <select value={birthMonth} onChange={(event) => onBirthMonthChange(event.target.value)}>
                    {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
                      <option key={month} value={month}>
                        {month}月
                      </option>
                    ))}
                  </select>
                  <select value={birthDay} onChange={(event) => onBirthDayChange(event.target.value)}>
                    {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((day) => (
                      <option key={day} value={day}>
                        {day}日
                      </option>
                    ))}
                  </select>
                </div>
                <button className={`${styles.sheetItem} ${styles.sheetItemPrimary}`} type="button" onClick={onConfirmBirthday}>
                  确定
                </button>
                <button className={styles.sheetCancel} type="button" onClick={onCloseSheet}>
                  取消
                </button>
              </>
            ) : null}
            {sheetType === "location" ? (
              <>
                <div className={styles.sheetTitle}>选择地区</div>
                <div className={styles.cityGrid}>
                  {cityOptions.map((city) => (
                    <button key={city} className={styles.cityItem} type="button" onClick={() => onLocationSelect(city)}>
                      {city}
                    </button>
                  ))}
                </div>
                <button className={styles.sheetCancel} type="button" onClick={onCloseSheet}>
                  取消
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {levelOpen ? (
        <div className={styles.levelOverlay} onClick={onLevelClose} role="presentation">
          <div className={styles.levelSheet} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.levelSheetHeader}>
              <div className={styles.levelSheetIcon}>{currentLevelIcon}</div>
              <div className={styles.levelSheetTitle}>{title ? `Lv.${level} ${title}` : `Lv.${level} ${currentLevelTitle}`}</div>
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
            <button className={styles.levelCloseBtn} type="button" onClick={onLevelClose}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

