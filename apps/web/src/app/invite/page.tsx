'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiBaseUrl } from '../../lib/env';
import styles from './page.module.css';

type InviteRecord = {
  name: string;
  time: string;
  reward: number;
  avatar: string;
};

const fallbackRewards = [
  { icon: '👤', title: '邀请1位好友', desc: '好友注册即可获得', value: '+50币' },
  { icon: '👥', title: '邀请3位好友', desc: '额外奖励优惠券', value: '+优惠券' },
  { icon: '🏆', title: '邀请10位好友', desc: '获得限量成就徽章', value: '+成就' },
  { icon: '💎', title: '邀请30位好友', desc: '升级VIP特权', value: 'VIP' },
];

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('umi_token') ?? '';
}

async function requestInvite(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.code !== 0) {
    throw new Error(payload?.message || 'request failed');
  }

  return payload.data;
}

export default function InvitePage() {
  const router = useRouter();
  const [toast, setToast] = useState('');
  const [inviteCode, setInviteCode] = useState('加载中...');
  const [inviteLink, setInviteLink] = useState('');
  const [records, setRecords] = useState<InviteRecord[] | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadInviteInfo() {
      try {
        const result = await requestInvite('/api/invite/my');
        let code = result?.inviteCode || '';
        let link = code ? `${window.location.origin}/register?invite=${code}` : '';

        if (!code) {
          try {
            const generated = await requestInvite('/api/invite/generate', { method: 'POST', body: JSON.stringify({}) });
            code = generated?.inviteCode || '';
            link = generated?.link || (code ? `${window.location.origin}/register?invite=${code}` : '');
          } catch {
            // Keep the old-page fallback text when generation is unavailable.
          }
        }

        if (!ignore) {
          setInviteCode(code || '请先登录');
          setInviteLink(link);
        }
      } catch {
        if (!ignore) {
          setInviteCode('请先登录');
          setInviteLink('');
        }
      }

      try {
        const result = await requestInvite('/api/invite/records');
        const items = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
        if (!ignore) {
          setRecords(items.map((item: any) => ({
            name: item.name || '好友',
            time: item.time || item.createdAt || '',
            reward: Number(item.reward || 50),
            avatar: item.avatar || '/legacy/images/mascot/mouse-happy.png',
          })));
        }
      } catch {
        if (!ignore) {
          setRecords([]);
        }
      }
    }

    void loadInviteInfo();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const canCopy = useMemo(() => Boolean(inviteCode && inviteCode !== '加载中...' && inviteCode !== '请先登录'), [inviteCode]);

  async function copyInviteLink() {
    const link = inviteLink || (canCopy ? `${window.location.origin}/register?invite=${inviteCode}` : '');
    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Keep old-page behavior: still show copied toast.
    }
    setToast('链接已复制');
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>邀请有礼</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroIcon}>🎁</div>
        <div className={styles.heroTitle}>邀请好友，一起赢零食！</div>
        <div className={styles.heroDesc}>
          每邀请1位好友注册并参与竞猜
          <br />
          你和好友各获得 <b>50零食币</b>
        </div>
      </section>

      <section className={styles.codeCard}>
        <div className={styles.codeLabel}>我的邀请码</div>
        <div className={styles.code}>{inviteCode}</div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="button" onClick={() => void copyInviteLink()}>
            <i className="fa-solid fa-copy" /> 复制链接
          </button>
          <button className={styles.secondaryBtn} type="button" onClick={() => setToast('分享')}>
            <i className="fa-solid fa-share-nodes" /> 分享
          </button>
        </div>
      </section>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>邀请奖励</div>
      </div>
      <section className={styles.rewardList}>
        {fallbackRewards.map((item) => (
          <article key={item.title} className={styles.rewardItem}>
            <div className={styles.rewardIcon}>{item.icon}</div>
            <div className={styles.rewardInfo}>
              <div className={styles.rewardTitle}>{item.title}</div>
              <div className={styles.rewardDesc}>{item.desc}</div>
            </div>
            <div className={styles.rewardValue}>{item.value}</div>
          </article>
        ))}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>邀请记录</div>
      </div>
      <section className={styles.recordList}>
        {records === null ? (
          <div className={styles.recordEmpty}>加载中...</div>
        ) : records.length ? (
          records.map((item) => (
            <article key={`${item.name}-${item.time}`} className={styles.recordItem}>
              <img className={styles.avatar} src={item.avatar} alt={item.name} />
              <div className={styles.recordInfo}>
                <div className={styles.recordName}>{item.name}</div>
                <div className={styles.recordTime}>{item.time}</div>
              </div>
              <div className={styles.recordReward}>+{item.reward}币 ✓</div>
            </article>
          ))
        ) : (
          <div className={styles.recordEmpty}>暂无邀请记录，快去邀请好友吧！</div>
        )}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
