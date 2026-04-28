'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { GuessCommentSummary, GuessOption, GuessSummary } from '@umi/shared';

import {
  favoriteGuess,
  fetchGuess,
  fetchGuessComments,
  likeGuessComment,
  participateInGuess,
  postGuessComment,
  unfavoriteGuess,
  unlikeGuessComment,
} from '../../../lib/api/guesses';
import { hasAuthToken } from '../../../lib/api/shared';
import { formatCountdown, getGuessStatusText, getTopicBadge } from './guess-detail-helpers';
import { GuessBattlePanel } from './guess-battle-panel';
import { GuessDetailOverlays } from './guess-detail-overlays';
import { GuessHero } from './guess-hero';
import styles from './page.module.css';

async function copyShareLink(url: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return;
    } catch {
      // fall through to legacy fallback
    }
  }
  if (typeof document === 'undefined') return;
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // ignore
  } finally {
    document.body.removeChild(ta);
  }
}

export default function GuessDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vsAreaRef = useRef<HTMLDivElement | null>(null);
  const [guess, setGuess] = useState<GuessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [toast, setToast] = useState('');
  const [selectedOption, setSelectedOption] = useState(0);
  const [betAmount, setBetAmount] = useState(1);
  const [comments, setComments] = useState<GuessCommentSummary[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [betSubmitting, setBetSubmitting] = useState(false);
  const guessId = typeof params?.id === 'string' ? params.id : '';

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!guessId) {
        setLoading(false);
        return;
      }
      try {
        const result = await fetchGuess(guessId);
        if (!ignore) {
          setGuess(result);
        }
      } catch {
        if (!ignore) {
          setGuess(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [guessId]);

  useEffect(() => {
    if (!guessId) return undefined;
    let ignore = false;
    setCommentsLoading(true);
    fetchGuessComments(guessId)
      .then((result) => {
        if (!ignore) setComments(result.items);
      })
      .catch(() => {
        if (!ignore) setComments([]);
      })
      .finally(() => {
        if (!ignore) setCommentsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [guessId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!breathing) return undefined;
    const timer = window.setTimeout(() => setBreathing(false), 2600);
    return () => window.clearTimeout(timer);
  }, [breathing]);

  useEffect(() => {
    if (!guess || guess.status !== 'active') {
      return undefined;
    }
    const interval = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [guess]);

  const totalVotes = useMemo(
    () =>
      (guess?.options || []).reduce(
        (sum: number, option: GuessOption) => sum + option.voteCount,
        0,
      ),
    [guess],
  );

  const optionStats = useMemo(() => {
    const list = guess?.options || [];
    const toneClasses = [
      styles.optionTone0,
      styles.optionTone1,
      styles.optionTone2,
      styles.optionTone3,
      styles.optionTone4,
    ];
    return list.map((option: GuessOption, index: number) => {
      const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
      return {
        ...option,
        percent,
        tone: toneClasses[index % 5],
      };
    });
  }, [guess, totalVotes]);

  const displayVotes = useMemo(
    () =>
      optionStats.map((option) =>
        totalVotes > 0 ? Math.max(option.percent, 3) : optionStats.length > 0 ? 100 / optionStats.length : 0,
      ),
    [optionStats, totalVotes],
  );

  const statusText = guess ? getGuessStatusText(guess) : '';
  const totalOrders = guess?.totalOrders ?? 0;
  const countdownLabel = '距开奖';
  const countdownText =
    guess && guess.status === 'active'
      ? Math.max(new Date(guess.endTime).getTime() - nowTs, 0) > 0
        ? formatCountdown(new Date(guess.endTime).getTime() - nowTs)
        : '00:00:00'
      : statusText;
  const isBrandGuess = Boolean(guess?.product.brand);
  const heroBadgeText = isBrandGuess ? `👑 ${guess?.product.brand}` : `🏷 ${guess?.category || '竞猜'}`;
  const heroSourceText = isBrandGuess ? '品牌官方销售数据' : '平台官方数据';
  const heroTags = [guess?.category, `${totalVotes}人参与`].filter(Boolean) as string[];
  const topicBadge = getTopicBadge(guess?.category);
  const heroImage = guess?.product.img || '/legacy/images/guess/g001.jpg';

  function showToast(message: string) {
    setToast(message);
  }

  const favorited = Boolean(guess?.isFavorited);

  async function toggleFavorite() {
    if (!guess) return;
    if (!hasAuthToken()) {
      router.push('/login');
      return;
    }
    const next = !favorited;
    setGuess({ ...guess, isFavorited: next });
    try {
      if (next) {
        await favoriteGuess(guess.id);
      } else {
        await unfavoriteGuess(guess.id);
      }
      showToast(next ? '已加入收藏' : '已取消收藏');
    } catch (error) {
      setGuess({ ...guess, isFavorited: !next });
      showToast(error instanceof Error ? error.message : '操作失败');
    }
  }

  async function handlePostComment(content: string) {
    if (!guess) return;
    if (!hasAuthToken()) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      const created = await postGuessComment(guess.id, { content });
      setComments((prev) => [created, ...prev]);
      setGuess((prev) => (prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : prev));
      showToast('评论成功');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '评论失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleCommentLike(commentId: string, liked: boolean) {
    if (!hasAuthToken()) {
      router.push('/login');
      return;
    }
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked, likes: Math.max(0, c.likes + (liked ? 1 : -1)) }
          : c,
      ),
    );
    try {
      if (liked) {
        await likeGuessComment(commentId);
      } else {
        await unlikeGuessComment(commentId);
      }
    } catch (error) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, liked: !liked, likes: Math.max(0, c.likes + (liked ? -1 : 1)) }
            : c,
        ),
      );
      showToast(error instanceof Error ? error.message : '操作失败');
    }
  }

  async function handleConfirmParticipate() {
    if (!guess || betSubmitting) return;
    if (!hasAuthToken()) {
      router.push('/login');
      return;
    }
    setBetSubmitting(true);
    try {
      await participateInGuess(guess.id, { choiceIdx: selectedOption, quantity: betAmount });
      setBetOpen(false);
      showToast('参与成功，开奖后通知你');
      const refreshed = await fetchGuess(guess.id);
      setGuess(refreshed);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '参与失败');
    } finally {
      setBetSubmitting(false);
    }
  }

  function scrollToOptions() {
    const node = vsAreaRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    window.setTimeout(() => setBreathing(true), 600);
  }

  if (loading) {
    return <main className={styles.page} />;
  }

  if (!guess) {
    return (
      <main className={styles.page}>
        <header className={styles.nav}>
          <button className={styles.navBtn} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className={styles.navTitle}>竞猜详情</div>
          <div className={styles.navActions} />
        </header>
        <section className={styles.commentsSection}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎲</div>
            <div className={styles.emptyTitle}>竞猜不存在</div>
            <div className={styles.emptyDesc}>这条竞猜可能已下线或暂不可见。</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <button className={styles.navBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.navTitle}>竞猜详情</div>
        <div className={styles.navActions}>
          <button className={styles.navBtn} type="button" onClick={() => setShareOpen(true)}>
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button
            className={`${styles.navBtn} ${favorited ? styles.navBtnFav : ''}`}
            type="button"
            onClick={() => {
              void toggleFavorite();
            }}
          >
            <i className={favorited ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
          </button>
        </div>
      </header>
      <GuessHero
        title={guess.title}
        totalVotes={totalVotes}
        optionCount={guess.options.length}
        totalOrders={totalOrders}
        countdownLabel={countdownLabel}
        countdownText={countdownText}
        badgeText={heroBadgeText}
        tags={heroTags}
        heroImage={heroImage}
        heroSourceText={heroSourceText}
      />

      <GuessBattlePanel
        title={guess.title}
        options={optionStats}
        displayVotes={displayVotes}
        breathing={breathing}
        totalVotes={totalVotes}
        topicBadge={topicBadge}
        endTime={guess.endTime}
        topicDetail={guess.topicDetail}
        description={guess.description}
        tags={guess.tags}
        comments={comments}
        commentCount={guess.commentCount ?? 0}
        commentsLoading={commentsLoading}
        commentSubmitting={submitting}
        onSelectOption={(index) => {
          setSelectedOption(index);
          setBetOpen(true);
          setBreathing(false);
        }}
        onParticipateClick={scrollToOptions}
        onPostComment={handlePostComment}
        onToggleCommentLike={handleToggleCommentLike}
        vsAreaRef={vsAreaRef}
      />

      <GuessDetailOverlays
        shareOpen={shareOpen}
        betOpen={betOpen}
        guess={guess}
        optionStats={optionStats}
        selectedOption={selectedOption}
        betAmount={betAmount}
        onCloseShare={() => setShareOpen(false)}
        onOpenShareChannel={(label) => {
          if (typeof window !== 'undefined') {
            void copyShareLink(window.location.href);
          }
          showToast(
            label === '微信'
              ? '已复制，去微信分享吧！'
              : label === '朋友圈'
                ? '已生成分享卡片'
                : label === 'QQ'
                  ? '已复制，去QQ分享吧！'
                  : '链接已复制',
          );
          setShareOpen(false);
        }}
        onCloseBet={() => setBetOpen(false)}
        onSetBetAmount={setBetAmount}
        betSubmitting={betSubmitting}
        onConfirmBet={() => {
          void handleConfirmParticipate();
        }}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
