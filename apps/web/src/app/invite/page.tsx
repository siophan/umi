'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchMe } from '../../lib/api/auth';

import styles from './page.module.css';

const REWARD_TIERS = [
  { icon: '👤', title: '邀请 1 位好友', desc: '好友注册即可领取', value: '新人券' },
  { icon: '👥', title: '邀请 3 位好友', desc: '解锁额外品牌优惠券', value: '券礼包' },
  { icon: '🏆', title: '邀请 10 位好友', desc: '获得限量成就徽章', value: '成就' },
  { icon: '💎', title: '邀请 30 位好友', desc: '解锁 VIP 平台特权', value: 'VIP' },
];

export default function InvitePage() {
  const router = useRouter();
  const [toast, setToast] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (cancelled) return;
        setInviteCode(user.inviteCode ?? null);
        setInviteCount(user.inviteCount ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setInviteCode(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const buildInviteLink = (code: string) => `${window.location.origin}/register?invite=${code}`;

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through
      }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  };

  const handleCopy = async () => {
    if (!inviteCode) {
      showToast('邀请码暂未开放');
      return;
    }
    const ok = await copyText(buildInviteLink(inviteCode));
    showToast(ok ? '链接已复制' : '复制失败，请手动复制');
  };

  const handleShare = async () => {
    if (!inviteCode) {
      showToast('邀请码暂未开放');
      return;
    }
    const url = buildInviteLink(inviteCode);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: '优米 邀请有礼',
          text: '加入优米，一起赢取优惠券福利！',
          url,
        });
        return;
      } catch {
        // user cancelled or share failed → fall back to copy
      }
    }
    const ok = await copyText(url);
    showToast(ok ? '已复制邀请链接' : '分享失败，请手动复制链接');
  };

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
        <div className={styles.heroTitle}>邀请好友，一起赢福利！</div>
        <div className={styles.heroDesc}>
          每邀请 1 位好友注册并参与平台
          <br />
          你和好友都能领到优惠券福利
        </div>
      </section>

      <section className={styles.codeCard}>
        <div className={styles.codeLabel}>我的邀请码</div>
        <div className={styles.code}>{inviteCode ?? '敬请期待'}</div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="button" onClick={handleCopy}>
            <i className="fa-solid fa-copy" /> 复制链接
          </button>
          <button className={styles.secondaryBtn} type="button" onClick={handleShare}>
            <i className="fa-solid fa-share-nodes" /> 分享
          </button>
        </div>
      </section>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          邀请奖励{inviteCount > 0 ? `（已邀请 ${inviteCount} 人）` : ''}
        </div>
      </div>
      <section className={styles.rewardList}>
        {REWARD_TIERS.map((tier) => (
          <div className={styles.rewardItem} key={tier.title}>
            <div className={styles.rewardIcon}>{tier.icon}</div>
            <div className={styles.rewardInfo}>
              <div className={styles.rewardTitle}>{tier.title}</div>
              <div className={styles.rewardDesc}>{tier.desc}</div>
            </div>
            <div className={styles.rewardValue}>{tier.value}</div>
          </div>
        ))}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>邀请记录</div>
      </div>
      <section className={styles.recordList}>
        <div className={styles.recordEmpty}>暂无邀请记录，快去邀请好友吧！</div>
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
