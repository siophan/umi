'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import styles from './page.module.css';

const fallbackMessages = [
  { id: 'm1', from: 'other', text: '在吗？一起来猜一局！', time: '09:12' },
  { id: 'm2', from: 'me', text: '在，今天猜什么？', time: '09:13' },
  { id: 'm3', from: 'other', text: '乐事新口味竞猜，赢了有薯片大礼包！', time: '09:13' },
  { id: 'm4', from: 'me', text: '冲！我选番茄味 🍅', time: '09:14' },
];

export default function ChatDetailPage() {
  const params = useSearchParams();
  const friendName = decodeURIComponent(params.get('name') || '好友');
  const avatar = decodeURIComponent(
    params.get('avatar') || '/legacy/images/mascot/mouse-happy.png',
  );
  const [value, setValue] = useState('');

  const messages = useMemo(() => fallbackMessages, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => history.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <img className={styles.avatar} src={avatar} alt={friendName} />
        <div className={styles.name}>{friendName}</div>
        <button className={styles.moreBtn} type="button">
          <i className="fa-solid fa-ellipsis" />
        </button>
      </header>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div className={`${styles.row} ${message.from === 'me' ? styles.sent : styles.received}`} key={message.id}>
            <img className={styles.msgAvatar} src={avatar} alt="" />
            <div className={styles.bubble}>{message.text}</div>
          </div>
        ))}
      </div>

      <footer className={styles.inputBar}>
        <div className={styles.tools}>
          <button type="button">🖼</button>
          <button type="button"><i className="fa-regular fa-image" /></button>
          <button type="button"><i className="fa-regular fa-face-smile" /></button>
        </div>
        <textarea
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="发送消息…"
          rows={1}
        />
        <button className={`${styles.sendBtn} ${value.trim() ? styles.sendActive : ''}`} type="button">
          <i className="fa-solid fa-paper-plane" />
        </button>
      </footer>
    </main>
  );
}
