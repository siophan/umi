'use client';

import { useEffect, useRef, useState } from 'react';

import type { FriendPkSummary } from '@umi/shared';

import {
  fallbackAvatar,
  fallbackGuessImage,
  type BreakingEvent,
  type HomeCategory,
  type HomeCategoryTab,
  type HomeHeroCard,
  type HomeListCard,
  type HomeResultCard,
  type HomeSectionErrors,
} from './home-page-types';
import { formatInlineCountdown } from './home-page-helpers';
import styles from './page.module.css';

type Props = {
  breakingEvents: BreakingEvent[];
  breakingIndex: number;
  sectionErrors: HomeSectionErrors;
  heroCards: HomeHeroCard[];
  heroIndex: number;
  onSelectHero: (index: number) => void;
  onHeroInteraction: () => void;
  onOpenHero: (card: HomeHeroCard) => void;
  rankings: Array<{ userId: string; rank: number; nickname: string; avatar: string | null; value: string }>;
  friendPk: FriendPkSummary | null;
  onJoinFriendPk: () => void;
  category: HomeCategory;
  onSelectCategory: (category: HomeCategory) => void;
  categoryFellBack: boolean;
  sectionSubtitle: string;
  posterIndex: number;
  onOpenMode: (index: number) => void;
  visibleCards: HomeListCard[];
  onOpenCard: (href: string) => void;
  recentResults: HomeResultCard[];
  onOpenHistory: () => void;
  onOpenRanking: () => void;
  hasMoreGuesses: boolean;
  loadingMoreGuesses: boolean;
  loadingGuesses: boolean;
  onLoadMoreGuesses: () => void;
  categoryTabs: HomeCategoryTab[];
};

const MODE_ITEMS: Array<{
  className: 'modeChampion' | 'modeTriple' | 'modeBlind';
  emoji: string;
  name: string;
  sub: string;
}> = [
  { className: 'modeChampion', emoji: '🏆', name: '冠军之路', sub: '连胜封神' },
  { className: 'modeTriple', emoji: '⛩️', name: '闯三关', sub: '奖金翻倍' },
  { className: 'modeBlind', emoji: '🎁', name: '盲盒竞猜', sub: '惊喜开箱' },
];

export function HomeGuessView({
  breakingEvents,
  breakingIndex,
  sectionErrors,
  heroCards,
  heroIndex,
  onSelectHero,
  onHeroInteraction,
  onOpenHero,
  rankings,
  friendPk,
  onJoinFriendPk,
  category,
  onSelectCategory,
  categoryFellBack,
  sectionSubtitle,
  posterIndex,
  onOpenMode,
  visibleCards,
  onOpenCard,
  recentResults,
  onOpenHistory,
  onOpenRanking,
  hasMoreGuesses,
  loadingMoreGuesses,
  loadingGuesses,
  onLoadMoreGuesses,
  categoryTabs,
}: Props) {
  const heroTrackRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollUntilRef = useRef(0);
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (!friendPk) {
      return undefined;
    }
    const timer = window.setInterval(() => setNowTick((v) => v + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [friendPk?.id, friendPk?.endTime]);
  const pkLeftPct = friendPk?.options[0]?.pct ?? 50;
  const pkRightPct = friendPk?.options[1]?.pct ?? Math.max(0, 100 - pkLeftPct);
  const pkLeftLabel = friendPk?.options[0]?.text || '选项A';
  const pkRightLabel = friendPk?.options[1]?.text || '选项B';
  const heroRankLabels = ['🏆 TOP 1', '🥈 TOP 2', '🥉 TOP 3', '#4', '#5'];
  const currentBreaking = breakingEvents[breakingIndex] ?? breakingEvents[0];
  const breakingTagClass = currentBreaking
    ? styles[
        `breakingTag${currentBreaking.tagClass[0].toUpperCase()}${currentBreaking.tagClass.slice(1)}`
      ]
    : '';
  const currentMode = MODE_ITEMS[posterIndex] ?? MODE_ITEMS[0];

  useEffect(() => {
    const track = heroTrackRef.current;
    const target = track?.children.item(heroIndex) as HTMLElement | null;
    if (!track || !target) {
      return;
    }

    programmaticScrollUntilRef.current = Date.now() + 700;
    track.scrollTo({
      left: target.offsetLeft - 16,
      behavior: 'smooth',
    });
  }, [heroIndex]);

  useEffect(() => {
    const track = heroTrackRef.current;
    if (!track || heroCards.length <= 1) {
      return undefined;
    }

    let frame: number | null = null;
    const onScroll = () => {
      if (Date.now() < programmaticScrollUntilRef.current) {
        return;
      }
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        const first = track.children.item(0) as HTMLElement | null;
        if (!first) {
          return;
        }
        const slideWidth = first.clientWidth + 10;
        const next = Math.round(track.scrollLeft / slideWidth);
        const clamped = Math.max(0, Math.min(heroCards.length - 1, next));
        if (clamped !== heroIndex) {
          onHeroInteraction();
          onSelectHero(clamped);
        }
      });
    };
    const onTouch = () => {
      onHeroInteraction();
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('touchstart', onTouch, { passive: true });
    track.addEventListener('pointerdown', onTouch, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('touchstart', onTouch);
      track.removeEventListener('pointerdown', onTouch);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [heroCards.length, heroIndex, onHeroInteraction, onSelectHero]);

  return (
    <>
      {currentBreaking ? (
        <div className={styles.breakingBar}>
          <span className={`${styles.breakingTag} ${breakingTagClass}`}>{currentBreaking.tag}</span>
          <span className={styles.breakingDot} />
          <div className={styles.breakingScroll}>
            <div className={styles.breakingInner}>
              {[...breakingEvents, ...breakingEvents].map((item, index) => (
                <span className={styles.breakingEvt} key={`${item.tag}-${item.text}-${index}`}>
                  {item.text}
                  <span className={styles.highlight}>{item.highlight}</span>
                  <span className={styles.sep}>•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {sectionErrors.banners ? (
        <div className={styles.sectionNotice}>首页头图加载失败，当前已降级展示其他真实内容。</div>
      ) : null}

      {heroCards.length ? (
        <section className={styles.heroSwiper}>
          <div className={styles.heroTrack} ref={heroTrackRef}>
            {heroCards.map((item, index) => (
              <article className={styles.heroSlide} key={item.key} onClick={() => onOpenHero(item)}>
                <img alt={item.title} src={item.image || fallbackGuessImage} />
                <div className={styles.heroRank}>{heroRankLabels[index] || `#${index + 1}`}</div>
                <div className={styles.heroOverlay}>
                  <div className={styles.heroBadge}>{item.badge}</div>
                  <div className={styles.heroTitle}>{item.title}</div>
                  <div className={styles.heroMeta}>
                    <span>{item.meta[0]}</span>
                    <span>{item.meta[1]}</span>
                  </div>
                  {item.showPk ? (
                    <div className={styles.heroPk}>
                      <div className={styles.heroPkLabels}>
                        <span className={styles.heroPkLeftLabel}>
                          {item.left} {item.leftPct}
                        </span>
                        <span className={styles.heroPkVs}>VS</span>
                        <span className={styles.heroPkRightLabel}>
                          {item.rightPct} {item.right}
                        </span>
                      </div>
                      <div className={styles.heroPkBar}>
                        <div className={styles.heroPkLeft} style={{ width: item.leftPct }} />
                        <div className={styles.heroPkRight} style={{ width: item.rightPct }} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <div className={styles.heroDots}>
            {heroCards.map((item, index) => (
              <button
                className={`${styles.heroDot} ${index === heroIndex ? styles.heroDotActive : ''}`}
                key={item.key}
                type="button"
                onClick={() => {
                  onHeroInteraction();
                  onSelectHero(index);
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {friendPk ? (
        <div className={styles.pkBanner}>
          <div className={styles.pkLive}>⏰ {formatInlineCountdown(friendPk.endTime)}</div>
          <div className={styles.pkPlayers}>
            <img alt={friendPk.creator.name} src={friendPk.creator.avatar || fallbackAvatar} />
          </div>
          <div className={styles.pkInfo}>
            <div className={styles.pkTitle}>{friendPk.title}</div>
            <div className={styles.pkSub}>{`${friendPk.creator.name} 邀你参与PK`}</div>
          </div>
          <div className={styles.pkProgressWrap}>
            <div className={styles.pkProgressTrack}>
              <div className={styles.pkProgressLeft} style={{ width: `${pkLeftPct}%` }}>
                {pkLeftPct}%
              </div>
              <div className={styles.pkProgressRight} style={{ width: `${pkRightPct}%` }}>
                {pkRightPct}%
              </div>
            </div>
            <div className={styles.pkProgressLabels}>
              <span>{pkLeftLabel}</span>
              <span>{pkRightLabel}</span>
            </div>
          </div>
          <button className={styles.pkBtn} type="button" onClick={onJoinFriendPk}>
            加入PK
          </button>
        </div>
      ) : null}

      <div className={styles.catBar}>
        <div className={styles.catScroll}>
          {categoryTabs.map((item) => {
            const themeKey = `cat${item.themeClass[0].toUpperCase()}${item.themeClass.slice(1)}`;
            return (
              <button
                className={`${styles.catChip} ${styles[themeKey] ?? ''} ${category === item.key ? styles.catActive : ''}`}
                key={item.key}
                type="button"
                onClick={() => onSelectCategory(item.key)}
              >
                <span className={styles.catIcon}>
                  <i className={item.iconClass} />
                </span>
                <span className={styles.catText}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {categoryFellBack ? (
        <div className={styles.sectionNotice}>该分类暂无内容</div>
      ) : null}

      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>正在进行</div>
          <div className={styles.sectionSubtitle}>{sectionSubtitle}</div>
        </div>
        <div className={styles.modeRoller}>
          <button
            className={styles.modeViewport}
            type="button"
            aria-label={`进入${currentMode.name}`}
            onClick={() => onOpenMode(posterIndex)}
          >
            <div className={styles.modeTrack} style={{ transform: `translateY(-${posterIndex * 42}px)` }}>
              {MODE_ITEMS.map((item) => (
                <div className={`${styles.modeItem} ${styles[item.className]}`} key={item.className}>
                  <span className={styles.modeEmoji}>{item.emoji}</span>
                  <span className={styles.modeName}>{item.name}</span>
                  <span className={styles.modeSub}>{item.sub}</span>
                  <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
                </div>
              ))}
            </div>
          </button>
        </div>
      </div>

      <section className={styles.listArea}>
        {loadingGuesses ? (
          <div className={styles.emptyState}>加载中…</div>
        ) : visibleCards.length ? (
          visibleCards.map((card) => (
            <article className={styles.guessCard} key={card.id} onClick={() => onOpenCard(card.href)}>
              <div className={styles.cardImageWrap}>
                <img alt={card.title} src={card.image || fallbackGuessImage} />
                <span className={`${styles.cardStatus} ${styles[card.statusClass]}`}>{card.status}</span>
                {card.ended ? (
                  <div className={`${styles.cardCountdown} ${styles.cardCountdownEnded}`}>
                    <span className={styles.cdEnded}>已开奖</span>
                  </div>
                ) : (
                  <div
                    className={`${styles.cardCountdown} ${card.statusClass === 'ending' ? styles.cardCountdownUrgent : ''}`}
                  >
                    <span className={styles.cdNum}>{card.countdown[0]}</span>
                    <span className={styles.cdSep}>{card.countdown[1]}</span>
                    <span className={styles.cdNum}>{card.countdown[2]}</span>
                    <span className={styles.cdSep}>{card.countdown[3]}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{card.title}</div>
                {card.odds.length ? (
                  <div className={styles.oddsRow}>
                    {card.odds.map((odd) => (
                      <span className={`${styles.oddChip} ${styles[odd.trend]}`} key={`${card.id}-${odd.label}`}>
                        {odd.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className={styles.pkRow}>
                  <div className={styles.duel}>
                    <div className={styles.duelLabels}>
                      <span>{card.leftLabel}</span>
                      <span className={styles.duelVs}>VS</span>
                      <span>{card.rightLabel}</span>
                    </div>
                    {card.showPk ? (
                      <div className={styles.duelBar}>
                        <div className={styles.duelLeft} style={{ width: card.leftWidth }} />
                        <div className={styles.duelRight} style={{ width: card.rightWidth }} />
                      </div>
                    ) : null}
                  </div>
                  {card.showPk && !card.ended ? (
                    <button
                      className={styles.pkMiniBtn}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCard(card.href);
                      }}
                    >
                      ⚡
                    </button>
                  ) : null}
                  {card.ended ? null : (
                    <button
                      className={styles.joinBtn}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCard(card.href);
                      }}
                    >
                      参与
                    </button>
                  )}
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.cardMeta}>{card.meta}</span>
                </div>
              </div>
            </article>
          ))
        ) : sectionErrors.guesses ? (
          <div className={styles.sectionNotice}>竞猜列表加载失败，请稍后刷新重试。</div>
        ) : (
          <div className={styles.emptyState}>暂无可展示的竞猜内容</div>
        )}
        {hasMoreGuesses && visibleCards.length ? (
          <button
            className={styles.loadMoreBtn}
            type="button"
            disabled={loadingMoreGuesses}
            onClick={onLoadMoreGuesses}
          >
            {loadingMoreGuesses ? '加载中…' : '加载更多'}
          </button>
        ) : null}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>🎉 最近开奖</div>
        <button className={styles.sectionMore} type="button" onClick={onOpenHistory}>
          全部记录 <i className="fa-solid fa-chevron-right" />
        </button>
      </div>

      <section className={styles.resultArea}>
        {recentResults.length ? (
          recentResults.map((item, index) => (
            <div className={styles.resultItem} key={`result-${index}-${item.title}`}>
              <div className={`${styles.resultIcon} ${styles[item.type]}`}>{item.type === 'won' ? '🎉' : '🎫'}</div>
              <div className={styles.resultInfo}>
                <div className={styles.resultTitle}>{item.title}</div>
                <div className={styles.resultDetail}>{item.detail}</div>
              </div>
              <div className={`${styles.resultAmount} ${styles[item.type]}`}>{item.amount}</div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>登录后可查看你的开奖记录</div>
        )}
      </section>

      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>🏆 竞猜达人榜</div>
        <button className={styles.sectionMore} type="button" onClick={onOpenRanking}>
          完整榜单 <i className="fa-solid fa-chevron-right" />
        </button>
      </div>

      <section className={styles.rankArea}>
        {rankings.length ? (
          rankings.map((item, index) => (
            <div className={styles.rankRow} key={item.userId}>
              <div className={styles.rankNo}>{['🥇', '🥈', '🥉'][index] || `#${item.rank}`}</div>
              <img alt={item.nickname} className={styles.rankAvatar} src={item.avatar || fallbackAvatar} />
              <div className={styles.rankName}>{item.nickname}</div>
              <div className={styles.rankRate}>{item.value}</div>
            </div>
          ))
        ) : sectionErrors.rankings ? (
          <div className={styles.sectionNotice}>榜单加载失败，请稍后刷新重试。</div>
        ) : (
          <div className={styles.emptyState}>暂无排行榜结果</div>
        )}
      </section>
    </>
  );
}
