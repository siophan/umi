'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { fetchChatDetail, sendChatMessage } from '../../../lib/api/chat';
import styles from './page.module.css';

type MessageItem = {
  key: string;
  from: 'me' | 'other';
  content: string;
  createdAt: string;
};

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const pad = (part: number) => String(part).padStart(2, '0');
  if (date.toDateString() === now.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function shouldRenderTime(prev?: string, current?: string) {
  if (!current) {
    return false;
  }
  if (!prev) {
    return true;
  }
  const prevDate = new Date(prev);
  const currentDate = new Date(current);
  if (Number.isNaN(prevDate.getTime()) || Number.isNaN(currentDate.getTime())) {
    return true;
  }
  return currentDate.getTime() - prevDate.getTime() > 5 * 60 * 1000;
}

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const peerId = String(params?.id || '');
  const toastTimer = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const optimisticId = useRef(0);
  const [value, setValue] = useState('');
  const [toast, setToast] = useState('');
  const [peer, setPeer] = useState<{ name: string; avatar: string }>({
    name: '好友',
    avatar: '/legacy/images/mascot/mouse-happy.png',
  });
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchChatDetail(peerId);
        if (ignore) {
          return;
        }
        setPeer({
          name: result.peer.name || '好友',
          avatar: result.peer.avatar || '/legacy/images/mascot/mouse-happy.png',
        });
        setMessages(result.items.map((item) => ({
          key: item.id,
          from: item.from,
          content: item.content,
          createdAt: item.createdAt,
        })));
      } catch {
        if (ignore) {
          return;
        }
        setPeer({
          name: '好友',
          avatar: '/legacy/images/mascot/mouse-happy.png',
        });
        setMessages([]);
      }

      if (!ignore) {
        setReady(true);
      }
    }

    if (!peerId) {
      setReady(true);
      return;
    }

    void load();
    return () => {
      ignore = true;
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, [peerId]);

  useEffect(() => {
    document.title = `${peer.name} - Umi`;
  }, [peer.name]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      if (!listRef.current) {
        return;
      }
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, [messages, ready]);

  const canSend = useMemo(() => value.trim().length > 0 && !sending, [sending, value]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  }

  async function handleSend() {
    const content = value.trim();
    if (!content || !peerId || sending) {
      return;
    }

    const tempId = `temp-${optimisticId.current}`;
    optimisticId.current += 1;
    const now = new Date().toISOString();

    setMessages((current) => [...current, { key: tempId, from: 'me', content, createdAt: now }]);
    setValue('');
    setSending(true);

    try {
      const next = await sendChatMessage(peerId, { content });
      setMessages((current) => current.map((item) => (
        item.key === tempId
          ? { key: next.id, from: next.from, content: next.content, createdAt: next.createdAt }
          : item
      )));
    } catch {
      showToast('发送失败，请重试');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <span className={styles.friendName}>{peer.name}</span>
      </div>

      <div className={styles.messageList} ref={listRef}>
        {!peerId && ready ? <div className={styles.emptyHint}>无效的聊天</div> : null}
        {ready && peerId && messages.length === 0 ? <div className={styles.emptyHint}>暂无消息，说点什么吧~</div> : null}
        {messages.map((message, index) => (
          <div key={message.key}>
            {shouldRenderTime(messages[index - 1]?.createdAt, message.createdAt) ? (
              <div className={styles.timeDivider}>{formatMessageTime(message.createdAt)}</div>
            ) : null}
            <div className={`${styles.row} ${message.from === 'me' ? styles.sent : styles.received}`}>
              <img
                className={styles.avatar}
                src={message.from === 'me' ? myAvatar : peer.avatar}
                alt=""
              />
              <div className={styles.bubble}>{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.inputBar}>
        <input
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canSend) {
              void handleSend();
            }
          }}
          placeholder="输入消息..."
          autoComplete="off"
        />
        <button className={styles.sendBtn} disabled={!canSend} type="button" onClick={() => void handleSend()}>
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}

const myAvatar = '/legacy/images/mascot/mouse-main.png';
