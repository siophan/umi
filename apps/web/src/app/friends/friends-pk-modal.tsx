'use client';

import type { FriendItem, HotGuessItem } from './friends-helpers';
import { formatFans, myAvatar } from './friends-helpers';
import styles from './page.module.css';

type FriendsPkModalProps = {
  pkOpen: boolean;
  pkTarget: FriendItem | null;
  hotGuesses: HotGuessItem[];
  selectedGuessId: string;
  currentGuess: HotGuessItem | null;
  onClose: () => void;
  onSelectGuess: (guessId: string) => void;
  onConfirm: () => void;
};

export function FriendsPkModal({
  pkOpen,
  pkTarget,
  hotGuesses,
  selectedGuessId,
  currentGuess,
  onClose,
  onSelectGuess,
  onConfirm,
}: FriendsPkModalProps) {
  if (!pkOpen || !pkTarget) {
    return null;
  }

  return (
    <div className={styles.pkOverlay} onClick={onClose} role="presentation">
      <section className={styles.pkModal} onClick={(event) => event.stopPropagation()} role="presentation">
        <div className={styles.pkHeader}>
          <button className={styles.pkClose} type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className={styles.pkTitle}>⚔️ 发起PK对战</div>
          <div className={styles.pkSubtitle}>选择真实竞猜项目后直接进入竞猜详情</div>
        </div>
        <div className={styles.pkVs}>
          <div className={styles.pkPlayer}>
            <img src={myAvatar} alt="我" />
            <div className={styles.pkPlayerName}>我</div>
            <div className={styles.pkPlayerStats}>进入竞猜后自行选择</div>
          </div>
          <div className={styles.pkVsIcon}>VS</div>
          <div className={styles.pkPlayer}>
            <img src={pkTarget.avatar} alt={pkTarget.name} />
            <div className={styles.pkPlayerName}>{pkTarget.name}</div>
            <div className={styles.pkPlayerStats}>胜率 {pkTarget.winRate}%</div>
          </div>
        </div>
        <div className={styles.pkSelect}>
          <div className={styles.pkSelectLabel}>选择PK竞猜项目：</div>
          <div className={styles.pkList}>
            {hotGuesses.map((item) => (
              <button
                className={selectedGuessId === item.id ? styles.pkItemActive : styles.pkItem}
                key={item.id}
                type="button"
                onClick={() => onSelectGuess(item.id)}
              >
                <div className={styles.pkItemIcon}>{item.icon}</div>
                <div className={styles.pkItemBody}>
                  <div className={styles.pkItemTitle}>{item.title}</div>
                  <div className={styles.pkItemMeta}>{formatFans(item.participants)}人参与 · {item.options.join(' vs ')}</div>
                </div>
                <div className={styles.pkItemCheck}>
                  <i className="fa-solid fa-circle-check" />
                </div>
              </button>
            ))}
            {!hotGuesses.length ? <div className={styles.pkEmpty}>暂无可用竞猜，先去首页看看</div> : null}
          </div>
        </div>
        <div className={styles.pkFooter}>
          <button className={styles.cancelBtn} type="button" onClick={onClose}>
            取消
          </button>
          <button className={styles.primaryFooterBtn} type="button" onClick={onConfirm} disabled={!currentGuess}>
            进入竞猜
          </button>
        </div>
      </section>
    </div>
  );
}
