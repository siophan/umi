'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { GuessOption, GuessSummary } from '@umi/shared';

import { fetchGuess } from '../../../lib/api/guesses';
import { formatCountdown, getGuessStatusText } from './guess-detail-helpers';
import { GuessBattlePanel } from './guess-battle-panel';
import { GuessDetailOverlays } from './guess-detail-overlays';
import { GuessHero } from './guess-hero';
import styles from './page.module.css';

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

  const optionStats = useMemo(
    () =>
      (guess?.options || []).map((option: GuessOption, index: number) => {
        const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
        return {
          ...option,
          percent,
          tone: index === 0 ? styles.optionTonePink : styles.optionToneBlue,
        };
      }),
    [guess, totalVotes],
  );

  const displayVotes = useMemo(
    () =>
      optionStats.map((option) =>
        totalVotes > 0 ? Math.max(option.percent, 3) : optionStats.length > 0 ? 100 / optionStats.length : 0,
      ),
    [optionStats, totalVotes],
  );

  const statusText = guess ? getGuessStatusText(guess) : '';
  const countdownLabel = guess?.status === 'active' ? '距截止' : '当前状态';
  const countdownText =
    guess && guess.status === 'active'
      ? Math.max(new Date(guess.endTime).getTime() - nowTs, 0) > 0
        ? formatCountdown(new Date(guess.endTime).getTime() - nowTs)
        : '00:00:00'
      : statusText;
  const topicBadge = guess?.category || '竞猜';
  const heroImage = guess?.product.img || '/legacy/images/guess/g001.jpg';

  function showToast(message: string) {
    setToast(message);
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
            className={styles.navBtn}
            type="button"
            onClick={() => showToast('收藏功能待接入')}
          >
            <i className="fa-regular fa-heart" />
          </button>
        </div>
      </header>
      <GuessHero
        title={guess.title}
        totalVotes={totalVotes}
        optionCount={guess.options.length}
        statusText={statusText}
        countdownLabel={countdownLabel}
        countdownText={countdownText}
        category={guess.category}
        brand={guess.product.brand}
        heroImage={heroImage}
      />

      <GuessBattlePanel
        title={guess.title}
        options={optionStats}
        displayVotes={displayVotes}
        breathing={breathing}
        totalVotes={totalVotes}
        topicBadge={topicBadge}
        endTime={guess.endTime}
        onSelectOption={(index) => {
          setSelectedOption(index);
          setBetOpen(true);
          setBreathing(false);
        }}
        onParticipateClick={scrollToOptions}
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
        onSelectOption={setSelectedOption}
        onSetBetAmount={setBetAmount}
        onConfirmBet={() => {
          setBetOpen(false);
          router.push(`/guess-order?id=${encodeURIComponent(guess.id)}&choice=${selectedOption}&qty=${betAmount}`);
        }}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
