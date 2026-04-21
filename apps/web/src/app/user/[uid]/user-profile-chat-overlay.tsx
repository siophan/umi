'use client';

import styles from './page.module.css';

type ChatMessage = { id: string; side: 'other' | 'me'; text: string };

type UserProfileChatOverlayProps = {
  open: boolean;
  loading: boolean;
  profileName: string;
  profileAvatar: string;
  chatMessages: ChatMessage[];
  chatInput: string;
  typing: boolean;
  onClose: () => void;
  onMore: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSendImage: () => void;
  onSendEmoji: () => void;
};

export function UserProfileChatOverlay({
  open,
  loading,
  profileName,
  profileAvatar,
  chatMessages,
  chatInput,
  typing,
  onClose,
  onMore,
  onInputChange,
  onSend,
  onSendImage,
  onSendEmoji,
}: UserProfileChatOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.chatOverlay}>
      <button className={styles.chatMask} type="button" onClick={onClose} />
      <div className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          <button className={styles.chatBack} type="button" onClick={onClose}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <img className={styles.chatAvatar} src={profileAvatar} alt={profileName} />
          <div className={styles.chatName}>{profileName}</div>
          <button className={styles.chatMore} type="button" onClick={onMore}>
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
        <div className={styles.chatMessages}>
          {loading ? <div className={styles.timeLabel}>正在读取聊天记录…</div> : <div className={styles.timeLabel}>聊天记录</div>}
          {chatMessages.map((message) => (
            <div key={message.id} className={`${styles.msgRow} ${styles[message.side]}`}>
              <img src={message.side === 'me' ? '/legacy/images/mascot/mouse-main.png' : profileAvatar} alt="" />
              <div className={styles.bubble}>{message.text}</div>
            </div>
          ))}
          {typing ? (
            <div className={`${styles.msgRow} ${styles.other} ${styles.typing}`}>
              <img src={profileAvatar} alt="" />
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
        </div>
        <div className={styles.chatInputBar}>
          <div className={styles.chatTools}>
            <button type="button" onClick={onSendImage}>
              <i className="fa-regular fa-image" />
            </button>
            <button type="button" onClick={onSendEmoji}>
              <i className="fa-regular fa-face-smile" />
            </button>
          </div>
          <textarea className={styles.chatInput} rows={1} placeholder="发送消息…" value={chatInput} onChange={(event) => onInputChange(event.target.value)} />
          <button className={`${styles.chatSend} ${chatInput.trim() ? styles.chatSendActive : ''}`} type="button" onClick={onSend}>
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </div>
    </div>
  );
}
