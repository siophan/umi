'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { GuessOption, GuessSummary } from '@umi/shared';

import { fetchGuess } from '../../../lib/api/guesses';
import styles from './page.module.css';

const shareChannels = [
  { label: '微信', icon: 'fa-brands fa-weixin', color: '#07C160' },
  { label: '朋友圈', icon: 'fa-solid fa-sun', color: '#FF6F00' },
  { label: 'QQ', icon: 'fa-brands fa-qq', color: '#12B7F5' },
  { label: '复制链接', icon: 'fa-solid fa-link', color: 'rgba(255,255,255,0.08)' },
] as const;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatEndTime(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return '结束时间待确认';
  }
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function getGuessStatusText(guess: GuessSummary) {
  if (guess.reviewStatus === 'pending') {
    return '待审核';
  }
  if (guess.reviewStatus === 'rejected') {
    return '审核未通过';
  }
  if (guess.status === 'settled') {
    return '已开奖';
  }
  if (guess.status === 'cancelled') {
    return '已取消';
  }
  if (guess.status === 'draft') {
    return '草稿';
  }
  return '进行中';
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

      <section className={styles.topDashboard}>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>🔥</span>
            {totalVotes}
          </div>
          <div className={styles.topLabel}>参与人数</div>
        </div>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>🎯</span>
            {guess.options.length}
          </div>
          <div className={styles.topLabel}>竞猜选项</div>
        </div>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>📊</span>
            <span className={styles.topValueText}>{statusText}</span>
          </div>
          <div className={styles.topLabel}>当前状态</div>
        </div>
      </section>

      <section className={styles.hero}>
        <img src={heroImage} alt={guess.title} className={styles.heroImg} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroCountdown}>
            <i className="fa-solid fa-clock" />
            <span>{countdownLabel}</span>
            <strong>{countdownText}</strong>
          </div>
          <h1 className={styles.heroTitle}>{guess.title}</h1>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>{statusText}</span>
            <span>{guess.product.brand}</span>
            <span>{guess.category}</span>
            <span>{totalVotes} 人参与</span>
          </div>
        </div>
        <div className={styles.heroSource}>
          <i className="fa-solid fa-database" />
          开奖数据来源：<span>平台官方数据</span>
        </div>
      </section>

      <section className={styles.pkPanel}>
        <h2 className={styles.pkTitle}>
          <span className={styles.pkTitleIcon}>🎲</span>
          {guess.title}
        </h2>
        <div className={styles.dpBarWrap}>
          <div className={styles.dpBarLabels}>
            {optionStats.map((option) => (
              <div className={styles.dblItem} key={`label-${option.id}`} style={{ width: `${Math.max(option.percent, 3)}%` }}>
                <span className={styles.dblName}>{option.optionText}</span>
              </div>
            ))}
          </div>
          <div className={styles.dpBarOuter}>
            <div className={styles.dpBar}>
              {optionStats.map((option, index) => (
                <div
                  className={`${styles.dbSeg} ${styles[`dbSeg${index}` as keyof typeof styles]}`}
                  key={`seg-${option.id}`}
                  style={{ width: `${displayVotes[index]}%` }}
                >
                  {displayVotes[index] >= 15 ? `${option.percent}%` : ''}
                </div>
              ))}
            </div>
            {displayVotes.slice(0, -1).map((_, index) => {
              const offset = displayVotes
                .slice(0, index + 1)
                .reduce((sum, value) => sum + value, 0);
              return (
                <div className={styles.barClash} key={`clash-${index}`} style={{ left: `${offset}%` }}>
                  <div className={styles.clashGlow} />
                  <div className={styles.clashRing} />
                  <div className={styles.clashBolt}>⚡</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.betGuideHint}>
          <i className={`fa-solid fa-angle-down ${styles.ghArrow}`} />
          点击下方选项即可参与竞猜
          <i className={`fa-solid fa-angle-down ${styles.ghArrow}`} />
        </div>
        <div className={styles.vsRow} ref={vsAreaRef}>
          {optionStats.map((option: (typeof optionStats)[number], index: number) => (
            <article
              className={`${styles.optionPill} ${option.tone} ${breathing ? styles.breathing : ''}`}
              key={option.id}
              onClick={() => {
                setSelectedOption(index);
                setBetOpen(true);
                setBreathing(false);
              }}
            >
              <div className={styles.optionFill} style={{ width: `${option.percent}%` }} />
              <div className={styles.optionContent}>
                <div className={styles.optionName}>{option.optionText}</div>
                <div className={styles.optionPercent}>{option.percent}%</div>
                <div className={styles.optionMeta}>
                  <span>{option.odds.toFixed(2)} 倍</span>
                  <span>{option.voteCount} 票</span>
                </div>
              </div>
              {index === 0 ? <div className={styles.vsBadge}>VS</div> : null}
            </article>
          ))}
        </div>

        <div className={styles.participantsRow}>
          <span className={styles.participantBadge}>{totalVotes}人参与</span>
          <span className={styles.participantText}>共 {optionStats.length} 个竞猜选项</span>
        </div>
      </section>

      <section className={styles.topicCard}>
        <div className={styles.topicHeader}>
          <div className={styles.topicLabel}><i className="fa-solid fa-scroll" /> 话题详情</div>
          <span className={styles.topicBadge}>{topicBadge}</span>
        </div>
        <p className={styles.topicText}>
          竞猜背景说明待补充，当前页仅展示真实竞猜标题、商品、选项、赔率、票数和结束时间。
        </p>
        <div className={styles.topicMeta}>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-users" /> {totalVotes}人参与</span>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-clock" /> {formatEndTime(guess.endTime)}</span>
          <span className={styles.topicMetaItem}><i className="fa-solid fa-fire" /> {guess.category || '热门'}</span>
        </div>
      </section>

      <section className={styles.descBlock}>
        <p>
          当前详情页已对齐真实竞猜数据；收藏和评论功能仍待接入，因此这里不再展示本地演示态统计或互动结果。
        </p>
      </section>

      <section className={styles.commentsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>评论</div>
          <span className={styles.sectionMore}>待接入</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <div className={styles.emptyTitle}>评论功能待接入</div>
          <div className={styles.emptyDesc}>当前页不再展示演示评论，也不会再用本地状态伪装评论互动。</div>
        </div>
      </section>

      <section className={styles.rulesCard}>
        <h3>📋 竞猜规则</h3>
        <div className={styles.ruleItem}>
          <span>🎉</span>
          <div className={styles.ruleText}>
            <b>猜中</b>：商品直接发货
          </div>
        </div>
        <div className={styles.ruleItem}>
          <span>🎫</span>
          <div className={styles.ruleText}>
            <b className={styles.ruleWarn}>没猜中</b>：自动获得竞猜补偿券
          </div>
        </div>
        <div className={styles.ruleItem}>
          <span>🤝</span>
          <div className={styles.ruleText}>
            <b className={styles.ruleCyan}>好友PK</b>：输的请客赢的提货
          </div>
        </div>
        <div className={styles.ruleItem}>
          <span>📊</span>
          <div className={styles.ruleText}>支持率根据投票人数实时变化</div>
        </div>
      </section>

      <section className={styles.detailBottom}>
        <button className={styles.detailPrimary} type="button" onClick={scrollToOptions}>
          <i className="fa-solid fa-hand-pointer" />
          <span>参与竞猜</span>
          <small>· 猜中即发货</small>
        </button>
      </section>

      {shareOpen ? (
        <div className={styles.sheet}>
          <button className={styles.sheetMask} type="button" onClick={() => setShareOpen(false)} />
          <section className={styles.sheetPanel}>
            <div className={styles.sheetGrab} />
            <h3>分享竞猜</h3>
            <div className={styles.shareGrid}>
              {shareChannels.map((item) => (
                <button
                  className={styles.shareItem}
                  type="button"
                  key={item.label}
                  onClick={() => {
                    showToast(
                      item.label === '微信'
                        ? '已复制，去微信分享吧！'
                        : item.label === '朋友圈'
                          ? '已生成分享卡片'
                          : item.label === 'QQ'
                            ? '已复制，去QQ分享吧！'
                            : '链接已复制',
                    );
                    setShareOpen(false);
                  }}
                >
                  <span style={{ background: item.color }}><i className={item.icon} /></span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>
            <button className={styles.sheetCancel} type="button" onClick={() => setShareOpen(false)}>
              取消
            </button>
          </section>
        </div>
      ) : null}

      {betOpen ? (
        <div className={styles.sheet}>
          <button className={styles.sheetMask} type="button" onClick={() => setBetOpen(false)} />
          <section className={`${styles.sheetPanel} ${styles.betPanel}`}>
            <div className={styles.sheetGrab} />
            <div className={styles.betHeader}>
              <h3>🎰 竞猜下单</h3>
              <button type="button" onClick={() => setBetOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.betOptionCard}>
              <div className={styles.betOptionLine}>
                <span className={styles.betMuted}>预测: {guess.options[selectedOption]?.optionText || ''}</span>
                <strong>×{(guess.options[selectedOption]?.odds || 1).toFixed(2)}</strong>
              </div>
              <p>{optionStats[selectedOption]?.percent || 0}% 选择 · {guess.options[selectedOption]?.voteCount || 0}人投票</p>
            </div>
            <div className={styles.betProductRow}>
              <div className={styles.betProductImgWrap}>
                <img src={guess.product.img} alt={guess.product.name} />
                <div className={styles.betImgTag}>
                  {guess.product.name.length > 8 ? `${guess.product.name.slice(0, 8)}…` : guess.product.name}
                </div>
              </div>
              <div className={styles.betProductRight}>
                <div className={styles.betQtyLabel}>
                  <i className="fa-solid fa-box" />
                  竞猜产品数量
                </div>
                <div className={styles.betQtyHint}>按件数参与竞猜</div>
              </div>
            </div>
            <div className={styles.betPills}>
              {guess.options.map((option: GuessOption, index: number) => (
                <button
                  className={selectedOption === index ? styles.betPillActive : styles.betPill}
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(index)}
                >
                  {option.optionText}
                </button>
              ))}
            </div>
            <div className={styles.betAmounts}>
              {[1, 3, 5].map((value: number) => (
                <button
                  className={betAmount === value ? styles.betAmountActive : styles.betAmount}
                  key={value}
                  type="button"
                  onClick={() => setBetAmount(value)}
                >
                  {value}件
                </button>
              ))}
            </div>
            <div className={styles.betStepper}>
              <button
                className={betAmount <= 1 ? styles.betStepperDisabled : ''}
                type="button"
                onClick={() => setBetAmount((value) => Math.max(1, value - 1))}
              >
                -
              </button>
              <span className={styles.betStepperValue}>{betAmount}</span>
              <span className={styles.betStepperUnit}>件</span>
              <button
                className={betAmount >= 999 ? styles.betStepperDisabled : ''}
                type="button"
                onClick={() => setBetAmount((value) => Math.min(999, value + 1))}
              >
                +
              </button>
            </div>
            <div className={styles.betSummary}>
              <div className={styles.betRow}>
                <span className={styles.betLabel}>竞猜数量</span>
                <span className={styles.betVal}>{betAmount}件 {guess.product.name}</span>
              </div>
              <div className={styles.betRow}>
                <span className={styles.betLabel}>合计金额</span>
                <span className={styles.betVal}>¥{(guess.product.price * betAmount).toFixed(2)}</span>
              </div>
              <div className={`${styles.betRow} ${styles.betRowHighlight}`}>
                <span className={styles.betLabel}>🎁 猜中可获得</span>
                <span className={styles.betWin}>
                  {Math.round(betAmount * (guess.options[selectedOption]?.odds || 1))}件{guess.product.name} · 价值¥{(guess.product.price * betAmount * (guess.options[selectedOption]?.odds || 1)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className={styles.betFooterText}>🎁赢方瓜分输方商品 · 🎫没猜中退补偿券 · 🤝支持好友PK</div>
            <button
              className={styles.betConfirm}
              type="button"
              onClick={() => {
                setBetOpen(false);
                router.push(
                  `/guess-order?id=${encodeURIComponent(guess.id)}&choice=${selectedOption}&qty=${betAmount}`,
                );
              }}
            >
              🎰 立即竞猜
            </button>
          </section>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
