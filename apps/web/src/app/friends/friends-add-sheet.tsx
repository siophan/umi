'use client';

import { useEffect, useRef, useState } from 'react';
import type { UserSearchItem } from '@umi/shared';

import { sendFriendRequest } from '../../lib/api/friends';
import { searchUsers } from '../../lib/api/users';
import styles from './page.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
  onAccepted?: () => void;
};

const FALLBACK_AVATAR = '/legacy/images/mascot/mouse-happy.png';

export function FriendsAddSheet({ open, onClose, onShowToast, onAccepted }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const debounceTimer = useRef<number | null>(null);
  const reqToken = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setItems([]);
    setError('');
    setPendingIds(new Set());
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }
    const token = ++reqToken.current;
    setLoading(true);
    setError('');
    debounceTimer.current = window.setTimeout(async () => {
      try {
        const result = await searchUsers(query.trim() || undefined);
        if (token !== reqToken.current) {
          return;
        }
        setItems(result.items.filter((item) => item.relation !== 'self'));
      } catch (err) {
        if (token !== reqToken.current) {
          return;
        }
        setError(err instanceof Error ? err.message : '搜索失败');
        setItems([]);
      } finally {
        if (token === reqToken.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [open, query]);

  if (!open) {
    return null;
  }

  async function handleAdd(item: UserSearchItem) {
    const id = String(item.id);
    if (savingId) {
      return;
    }
    try {
      setSavingId(id);
      const result = await sendFriendRequest(id);
      if (result.status === 'accepted') {
        onShowToast(`已添加 ${item.name} 为好友`);
        onAccepted?.();
        onClose();
        return;
      }
      onShowToast(`已发送好友申请给 ${item.name}`);
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '发送好友申请失败');
    } finally {
      setSavingId('');
    }
  }

  function renderAction(item: UserSearchItem) {
    const id = String(item.id);
    if (item.relation === 'friend') {
      return <span className={styles.addActionDisabled}>已是好友</span>;
    }
    if (item.relation === 'pending' || pendingIds.has(id)) {
      return <span className={styles.addActionDisabled}>已申请</span>;
    }
    return (
      <button
        className={styles.addAction}
        type="button"
        disabled={savingId === id}
        onClick={() => void handleAdd(item)}
      >
        {savingId === id ? '处理中' : '添加'}
      </button>
    );
  }

  return (
    <div className={styles.addOverlay} onClick={onClose}>
      <div
        className={styles.addSheet}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="添加好友"
      >
        <div className={styles.addHeader}>
          <div className={styles.addTitle}>添加好友</div>
          <button className={styles.addClose} type="button" onClick={onClose} aria-label="关闭">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.addSearchBox}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索昵称、优米号或店铺名"
            autoFocus
          />
        </div>

        <div className={styles.addList}>
          {loading ? (
            <div className={styles.addEmpty}>搜索中...</div>
          ) : error ? (
            <div className={styles.addEmpty}>{error}</div>
          ) : items.length ? (
            items.map((item) => (
              <div className={styles.addItem} key={String(item.id)}>
                <button className={styles.addAvatarBtn} type="button">
                  <img
                    className={styles.addAvatar}
                    src={item.avatar || FALLBACK_AVATAR}
                    alt={item.name}
                  />
                </button>
                <div className={styles.addInfo}>
                  <div className={styles.addNameRow}>
                    <span>{item.name}</span>
                    {item.shopVerified ? (
                      <i className="fa-solid fa-circle-check" style={{ color: '#1976d2', fontSize: 12 }} />
                    ) : null}
                  </div>
                  {item.uid ? <div className={styles.addUid}>UID: {item.uid}</div> : null}
                  {item.signature ? <div className={styles.addBio}>{item.signature}</div> : null}
                </div>
                {renderAction(item)}
              </div>
            ))
          ) : (
            <div className={styles.addEmpty}>{query.trim() ? '没找到匹配的用户' : '试试搜索昵称或优米号'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
