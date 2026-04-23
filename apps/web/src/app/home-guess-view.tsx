'use client';

import { useEffect, useRef } from 'react';

import type { GuessSummary } from '@umi/shared';

import {
  fallbackAvatar,
  fallbackGuessImage,
  type BreakingEvent,
  type HomeCategory,
  type HomeHeroCard,
  type HomeListCard,
  type HomeResultCard,
  type HomeSectionErrors,
  categoryTabs,
} from './home-page-types';
import { formatCompactNumber, getGuessParticipants, getGuessPercents } from './home-page-helpers';
import styles from './page.module.css';

type Props = {
  breakingEvents: BreakingEvent[];
  breakingIndex: number;
  sectionErrors: HomeSectionErrors;
  heroCard: HomeHeroCard | null;
  heroCards: HomeHeroCard[];
  heroIndex: number;
  onSelectHero: (index: number) => void;
  onOpenHero: (card: HomeHeroCard) => void;
  rankings: Array<{ userId: string; rank: number; nickname: string; avatar: string | null; value: string }>;
  focusGuess: GuessSummary | null;
  onJoinFocusGuess: () => void;
  category: HomeCategory;
  onSelectCategory: (category: HomeCategory) => void;
  sectionSubtitle: string;
  posterIndex: number;
  visibleCards: HomeListCard[];
  onOpenCard: (href: string) => void;
  recentResults: HomeResultCard[];
  onOpenHistory: () => void;
  onOpenRanking: () => void;
};

export function HomeGuessView({
  breakingEvents,
  breakingIndex,
  sectionErrors,
  heroCard,
  heroCards,
  heroIndex,
  onSelectHero,
  onOpenHero,
  rankings,
  focusGuess,
  onJoinFocusGuess,
  category,
  onSelectCategory,
  sectionSubtitle,
  posterIndex,
  visibleCards,
  onOpenCard,
  recentResults,
  onOpenHistory,
  onOpenRanking,
}: Props) {
  const heroTrackRef = useRef<HTMLDivElement | null>(null);
  const focusPercents = focusGuess ? getGuessPercents(focusGuess) : [50, 50];
  const focusLeftPct = focusPercents[0] ?? 50;
  const focusRightPct = focusPercents[1] ?? Math.max(0, 100 - focusLeftPct);
  const focusLeftLabel = focusGuess?.options[0]?.optionText || '选项A';
  const focusRightLabel = focusGuess?.options[1]?.optionText || '选项B';
  const rankLabels = ['🏆 TOP 1', '🥈 TOP 2', '🥉 TOP 3', '#4', '#5'];

  useEffect(() => {
    const track = heroTrackRef.current;
    const target = track?.children.item(heroIndex) as HTMLElement | null;
    if (!track || !target) {
      return;
    }

    track.scrollTo({
      left: target.offsetLeft - 16,
      behavior: 'smooth',
    });
  }, [heroIndex]);

  return (
    <>
      <div className={styles.breakingBar}>
        <span
          className={`${styles.breakingTag} ${styles[`breakingTag${(breakingEvents[breakingIndex] ?? breakingEvents[0]).tagClass[0].toUpperCase()}${(breakingEvents[breakingIndex] ?? breakingEvents[0]).tagClass.slice(1)}`]}`}
        >
          {(breakingEvents[breakingIndex] ?? breakingEvents[0]).tag}
        </span>
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

      {sectionErrors.banners ? (
        <div className={styles.sectionNotice}>首页头图加载失败，当前已降级展示其他真实内容。</div>
      ) : null}

      {heroCards.length ? (
        <section className={styles.heroSwiper}>
          <div className={styles.heroTrack} ref={heroTrackRef}>
            {heroCards.map((item, index) => (
              <article className={styles.heroSlide} key={item.key} onClick={() => onOpenHero(item)}>
                <img alt={item.title} src={item.image || fallbackGuessImage} />
                <div className={styles.heroRank}>{rankLabels[index] || `#${index + 1}`}</div>
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
                onClick={() => onSelectHero(index)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.pkBanner}>
        <div className={styles.pkLive}>LIVE</div>
        <div className={styles.pkPlayers}>
          <img alt="focus-left" src={rankings[0]?.avatar || fallbackAvatar} />
          <div className={styles.pkVs}>VS</div>
          <img alt="focus-right" src={rankings[1]?.avatar || fallbackAvatar} />
        </div>
        <div className={styles.pkInfo}>
          <div className={styles.pkTitle}>{focusGuess ? focusGuess.title : '好友PK对战中'}</div>
          <div className={styles.pkSub}>
            {focusGuess
              ? `${focusLeftLabel} vs ${focusRightLabel} · 👥${formatCompactNumber(getGuessParticipants(focusGuess))}`
              : '暂无进行中的热门竞猜'}
          </div>
        </div>
        {focusGuess ? (
          <div className={styles.pkProgressWrap}>
            <div className={styles.pkProgressTrack}>
              <div className={styles.pkProgressLeft} style={{ width: `${focusLeftPct}%` }}>
                {focusLeftPct}%
              </div>
              <div className={styles.pkProgressRight} style={{ width: `${focusRightPct}%` }}>
                {focusRightPct}%
              </div>
            </div>
            <div className={styles.pkProgressLabels}>
              <span>{focusLeftLabel}</span>
              <span>{focusRightLabel}</span>
            </div>
          </div>
        ) : null}
        <button className={styles.pkBtn} type="button" onClick={onJoinFocusGuess}>
          加入PK
        </button>
      </div>

      <div className={styles.catBar}>
        <div className={styles.catScroll}>
          {categoryTabs.map((item) => (
            <button
              className={`${styles.catChip} ${styles[`cat${item.cls[0].toUpperCase()}${item.cls.slice(1)}`]} ${category === item.key ? styles.catActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => onSelectCategory(item.key)}
            >
              <span className={styles.catIcon}>
                <i className={item.icon} />
              </span>
              <span className={styles.catText}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>正在进行</div>
          <div className={styles.sectionSubtitle}>{sectionSubtitle}</div>
        </div>
        <div className={styles.modeRoller}>
          <div className={styles.modeViewport}>
            <div className={styles.modeTrack} style={{ transform: `translateY(-${posterIndex * 42}px)` }}>
              <div className={`${styles.modeItem} ${styles.modeChampion}`}>
                <span className={styles.modeEmoji}>🏆</span>
                <span className={styles.modeName}>冠军之路</span>
                <span className={styles.modeSub}>连胜封神</span>
                <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
              </div>
              <div className={`${styles.modeItem} ${styles.modeTriple}`}>
                <span className={styles.modeEmoji}>⛩️</span>
                <span className={styles.modeName}>闯三关</span>
                <span className={styles.modeSub}>奖金翻倍</span>
                <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
              </div>
              <div className={`${styles.modeItem} ${styles.modeBlind}`}>
                <span className={styles.modeEmoji}>🎁</span>
                <span className={styles.modeName}>盲盒竞猜</span>
                <span className={styles.modeSub}>惊喜开箱</span>
                <i className={`fa-solid fa-chevron-right ${styles.modeArrow}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className={styles.listArea}>
        {visibleCards.length ? (
          visibleCards.map((card) => (
            <article className={styles.guessCard} key={card.id} onClick={() => onOpenCard(card.href)}>
              <div className={styles.cardImageWrap}>
                <img alt={card.title} src={card.image || fallbackGuessImage} />
                <span className={`${styles.cardStatus} ${styles[card.statusClass]}`}>{card.status}</span>
                <div
                  className={`${styles.cardCountdown} ${card.statusClass === 'ending' ? styles.cardCountdownUrgent : ''}`}
                >
                  <span className={styles.cdNum}>{card.countdown[0]}</span>
                  <span className={styles.cdSep}>{card.countdown[1]}</span>
                  <span className={styles.cdNum}>{card.countdown[2]}</span>
                  <span className={styles.cdSep}>{card.countdown[3]}</span>
                </div>
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
                  {card.showPk ? (
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
          recentResults.map((item) => (
            <div className={styles.resultItem} key={`${item.title}-${item.amount}`}>
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
            <div className={styles.rankRow} key={`${item.userId}-${item.rank}`}>
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
