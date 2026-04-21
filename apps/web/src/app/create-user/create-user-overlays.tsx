'use client';

import styles from './page.module.css';
import type { Friend, Group } from './create-user-helpers';

type CreateUserOverlaysProps = {
  previewOpen: boolean;
  publishOpen: boolean;
  publishStep: number;
  successOpen: boolean;
  toast: string;
  title: string;
  desc: string;
  optA: string;
  optB: string;
  deadline: string;
  selectedGroupItem: Group | null;
  selectedFriendItems: Friend[];
  selectedFriendsCount: number;
  stakeEnabled: boolean;
  stakeText: string;
  stepStates: boolean[];
  selectedGroup: string | null;
  onClosePreview: () => void;
  onContinueEdit: () => void;
  onConfirmPublish: () => void;
  onCloseSuccess: () => void;
  onShareAction: (type: 'copy' | 'wechat' | 'friends' | 'poster') => void;
  onGoHome: () => void;
};

export function CreateUserOverlays({
  previewOpen,
  publishOpen,
  publishStep,
  successOpen,
  toast,
  title,
  desc,
  optA,
  optB,
  deadline,
  selectedGroupItem,
  selectedFriendItems,
  selectedFriendsCount,
  stakeEnabled,
  stakeText,
  stepStates,
  selectedGroup,
  onClosePreview,
  onContinueEdit,
  onConfirmPublish,
  onCloseSuccess,
  onShareAction,
  onGoHome,
}: CreateUserOverlaysProps) {
  return (
    <>
      {previewOpen ? (
        <div className={styles.modalOverlay} onClick={(event) => event.target === event.currentTarget && onClosePreview()}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>竞猜预览</div>
              <button className={styles.modalClose} type="button" onClick={onClosePreview}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <section className={styles.previewCard}>
                <div className={styles.previewTitle}>
                  {title.trim() || <span className={styles.previewPlaceholder}>未填写标题</span>}
                </div>
                {desc.trim() ? <div className={styles.previewDesc}>{desc.trim()}</div> : null}
                <div className={styles.previewVsLarge}>
                  <div className={`${styles.previewOption} ${styles.previewOptionA}`}>
                    <div className={styles.previewOptionName}>{optA.trim() || '--'}</div>
                    <div className={styles.previewOptionLabel}>选项 A</div>
                  </div>
                  <div className={styles.previewVsBadge}>
                    <div className={styles.previewVsCircle}>VS</div>
                  </div>
                  <div className={`${styles.previewOption} ${styles.previewOptionB}`}>
                    <div className={styles.previewOptionName}>{optB.trim() || '--'}</div>
                    <div className={styles.previewOptionLabel}>选项 B</div>
                  </div>
                </div>
                <div className={styles.previewMeta}>
                  <span>
                    <i className="fa-solid fa-user-group" />
                    {selectedFriendsCount}人参战
                  </span>
                  {deadline ? (
                    <span>
                      <i className="fa-regular fa-clock" />
                      {new Date(deadline).toLocaleString('zh-CN')}
                    </span>
                  ) : null}
                  {selectedGroupItem ? (
                    <span>
                      <i className="fa-solid fa-people-group" />
                      {selectedGroupItem.name}
                    </span>
                  ) : null}
                  {stakeEnabled && stakeText ? (
                    <span>
                      <i className="fa-solid fa-dice" />
                      {stakeText}
                    </span>
                  ) : null}
                </div>
                {selectedFriendItems.length > 0 ? (
                  <div className={styles.previewFriendsRow}>
                    {selectedFriendItems.slice(0, 6).map((friend) => (
                      <img key={friend.id} className={styles.previewFriendAvatar} src={friend.avatar} alt={friend.name} />
                    ))}
                    <span className={styles.previewFriendsText}>
                      {selectedFriendItems.length > 6 ? `+${selectedFriendItems.length - 6}` : `${selectedFriendItems.length}位好友参战`}
                    </span>
                  </div>
                ) : null}
              </section>
              {!stepStates.every(Boolean) ? (
                <div className={styles.previewWarnings}>
                  <div className={styles.previewWarningsTitle}>以下项目需要完善：</div>
                  {!stepStates[0] ? <div className={styles.previewWarningItem}>⚠️ 标题至少3个字</div> : null}
                  {!stepStates[1] ? <div className={styles.previewWarningItem}>⚠️ 请填写两个PK选项</div> : null}
                  {!stepStates[2] ? <div className={styles.previewWarningItem}>⚠️ 至少邀请1位好友</div> : null}
                </div>
              ) : null}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} type="button" onClick={onContinueEdit}>
                继续编辑
              </button>
              <button className={styles.primaryBtn} type="button" onClick={onConfirmPublish}>
                确认发布
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publishOpen ? (
        <div className={styles.publishOverlay}>
          <div className={styles.publishCard}>
            <div className={styles.publishIcon}>{publishStep >= 2 ? '🎉' : '⏳'}</div>
            <div className={styles.publishTitle}>{publishStep >= 2 ? '发送成功！' : '正在发送竞猜...'}</div>
            <div className={styles.publishDesc}>{publishStep >= 2 ? '竞猜已推送给好友' : '正在推送给好友'}</div>
            <div className={styles.publishBar}>
              <span className={styles.publishFill} style={{ width: `${publishStep < 0 ? 0 : ((publishStep + 1) / 3) * 100}%` }} />
            </div>
            <div className={styles.publishSteps}>
              {['检查竞猜信息', '推送给好友', '发布到社群'].map((item, index) => {
                const done = publishStep > index || (index === 2 && !selectedGroup && publishStep >= 1);
                const active = publishStep === index;
                return (
                  <div
                    key={item}
                    className={`${styles.publishStep} ${done ? styles.publishStepDone : ''} ${active ? styles.publishStepActive : ''}`}
                  >
                    <i
                      className={
                        done ? 'fa-solid fa-circle-check' : active ? 'fa-solid fa-spinner fa-spin' : 'fa-regular fa-circle'
                      }
                    />
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className={styles.successOverlay} onClick={(event) => event.target === event.currentTarget && onCloseSuccess()}>
          <div className={styles.successCard}>
            <div className={styles.successEmoji}>🎉</div>
            <div className={styles.successTitle}>竞猜已发起！</div>
            <div className={styles.successDesc}>已发送给好友，等待参战</div>
            <div className={styles.successShares}>
              {[
                { icon: 'fa-solid fa-link', label: '复制链接', type: 'copy' as const },
                { icon: 'fa-brands fa-weixin', label: '微信', type: 'wechat' as const },
                { icon: 'fa-solid fa-users', label: '猜友圈', type: 'friends' as const },
                { icon: 'fa-solid fa-image', label: '海报', type: 'poster' as const },
              ].map((item) => (
                <button key={item.label} className={styles.shareItem} type="button" onClick={() => onShareAction(item.type)}>
                  <span
                    className={`${styles.shareIcon} ${
                      item.type === 'wechat'
                        ? styles.shareIconwechat
                        : item.type === 'friends'
                          ? styles.shareIconfriends
                          : ''
                    }`}
                  >
                    <i className={item.icon} />
                  </span>
                  <span className={styles.shareLabel}>{item.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.primaryBtnFull} type="button" onClick={onGoHome}>
              返回首页
            </button>
            <button className={styles.laterBtn} type="button" onClick={onGoHome}>
              稍后再说
            </button>
          </div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </>
  );
}
