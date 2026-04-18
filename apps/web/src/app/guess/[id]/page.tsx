'use client';

import { useMemo, useState } from 'react';
import type { GuessOption } from '@joy/shared';

import { demoGuess } from '../../../lib/demo';
import styles from './page.module.css';

const participants = [
  { name: '阿柠', time: '刚刚参与', choice: '会', cls: styles.choiceBig, avatar: demoGuess.product.img },
  { name: '小夏', time: '2 分钟前', choice: '不会', cls: styles.choiceSmall, avatar: demoGuess.product.img },
  { name: 'Leo', time: '8 分钟前', choice: '会', cls: styles.choiceBig, avatar: demoGuess.product.img },
  { name: 'Mika', time: '13 分钟前', choice: '不会', cls: styles.choiceSmall, avatar: demoGuess.product.img },
];

const comments = [
  { user: '优米鼠鼠', text: '这波感觉会很快抢空，抢到就赚到。', likes: 18, time: '刚刚', avatar: demoGuess.product.img },
  { user: '奶盖', text: '卡点要抢，差一点就会翻车。', likes: 7, time: '5 分钟前', avatar: demoGuess.product.img },
  { user: '橙子', text: '我押不会，库存看起来不算特别多。', likes: 4, time: '11 分钟前', avatar: demoGuess.product.img },
];

const shareChannels = [
  { label: '微信', icon: 'fa-brands fa-weixin', color: '#07C160' },
  { label: '朋友圈', icon: 'fa-solid fa-comment-dots', color: '#FF6F00' },
  { label: 'QQ', icon: 'fa-brands fa-qq', color: '#12B7F5' },
  { label: '复制链接', icon: 'fa-solid fa-link', color: 'rgba(255,255,255,0.08)' },
] as const;

export default function GuessDetailPage() {
  const [shareOpen, setShareOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const totalVotes = useMemo(
    () =>
      demoGuess.options.reduce(
        (sum: number, option: GuessOption) => sum + option.voteCount,
        0,
      ),
    [],
  );

  const optionStats = demoGuess.options.map((option: GuessOption, index: number) => {
    const percent = Math.round((option.voteCount / totalVotes) * 100);
    return {
      ...option,
      percent,
      tone: index === 0 ? styles.optionTonePink : styles.optionToneBlue,
    };
  });

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <button className={styles.navBtn} type="button" onClick={() => history.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.navTitle}>竞猜详情</div>
        <div className={styles.navActions}>
          <button className={styles.navBtn} type="button" onClick={() => setShareOpen(true)}>
            <i className="fa-solid fa-share-nodes" />
          </button>
          <button className={styles.navBtn} type="button">
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <img src={demoGuess.product.img} alt={demoGuess.title} className={styles.heroImg} />
        <div className={styles.danmakuLayer}>
          <span className={`${styles.danmakuItem} ${styles.danmakuOne}`}>
            <b>阿柠</b> 刚刚押了 <em>会</em>
          </span>
          <span className={`${styles.danmakuItem} ${styles.danmakuTwo}`}>
            <b>Mika</b> 选择了 <em>不会</em>
          </span>
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroCountdown}>
            <span>距开奖</span>
            <strong>00:38:21</strong>
          </div>
          <h1 className={styles.heroTitle}>{demoGuess.title}</h1>
          <div className={styles.heroMeta}>
            <span className={styles.badge}>热度</span>
            <span>{demoGuess.product.brand}</span>
            <span>{demoGuess.category}</span>
            <span>{totalVotes} 人参与</span>
          </div>
        </div>
        <div className={styles.heroSource}>
          <span>数据来源：</span>平台官方数据
        </div>
      </section>

      <section className={styles.topDashboard}>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}>
              <i className="fa-solid fa-fire" />
            </span>
            {totalVotes}
          </div>
          <div className={styles.topLabel}>参与人数</div>
        </div>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}><i className="fa-solid fa-dice" /></span>
            {demoGuess.options.length}
          </div>
          <div className={styles.topLabel}>竞猜选项</div>
        </div>
        <div className={styles.topItem}>
          <div className={styles.topValue}>
            <span className={styles.topIcon}><i className="fa-solid fa-chart-column" /></span>
            21
          </div>
          <div className={styles.topLabel}>总订单</div>
        </div>
      </section>

      <section className={styles.pkPanel}>
        <h2 className={styles.pkTitle}>实时对阵</h2>
        <div className={styles.vsRow}>
          {optionStats.map((option: (typeof optionStats)[number], index: number) => (
            <article className={`${styles.optionPill} ${option.tone}`} key={option.id}>
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
          {participants.map((item, index) => (
            <div className={styles.participant} key={`${item.name}-${index}`}>
              <img src={item.avatar} alt={item.name} />
              <div className={styles.participantMeta}>
                <strong>{item.name}</strong>
                <span>{item.time}</span>
              </div>
              <em className={item.cls}>{item.choice}</em>
            </div>
          ))}
          <div className={styles.moreBtn}>查看更多</div>
        </div>
      </section>

      <section className={styles.topicCard}>
        <div className={styles.topicHeader}>
          <div className={styles.topicLabel}>话题详情</div>
          <span className={styles.topicBadge}>深度解读</span>
        </div>
        <p className={styles.topicText}>
          这是一个围绕商品热度和发售节奏的竞猜场景。用户可以依据库存、品牌热度、历史发售节奏等信息做出判断，猜中即获得商品。
        </p>
        <div className={styles.topicMeta}>
          <span>商品猜中直接发货</span>
          <span>支持率实时变化</span>
          <span>数据同步开奖</span>
        </div>
      </section>

      <section className={styles.descBlock}>
        <p>
          商品热度、库存状态和竞猜概率会实时更新。你可以在这里先看规则，再选择参与竞猜，判断结果后会直接影响最终发货或补偿。
        </p>
      </section>

      <section className={styles.commentsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>热门评论</div>
          <span className={styles.sectionMore}>{comments.length} 条</span>
        </div>
        <div className={styles.commentsList}>
          {comments.map((comment) => (
            <article className={styles.commentItem} key={comment.user}>
              <img src={comment.avatar} alt={comment.user} />
              <div className={styles.commentBody}>
                <div className={styles.commentAuthor}>{comment.user}</div>
                <div className={styles.commentText}>{comment.text}</div>
                <div className={styles.commentActions}>
                  <span>{comment.time}</span>
                  <span className={styles.likeBtn}><i className="fa-regular fa-heart" /> {comment.likes}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.rulesCard}>
        <h3><i className="fa-solid fa-clipboard-list" /> 竞猜规则</h3>
        <div className={styles.ruleItem}>
          <span><i className="fa-solid fa-gift" /></span>
          <p>
            <b>猜中</b>：商品直接发货
          </p>
        </div>
        <div className={styles.ruleItem}>
          <span><i className="fa-solid fa-ticket" /></span>
          <p>
            <b>没猜中</b>：自动获得竞猜补偿券
          </p>
        </div>
        <div className={styles.ruleItem}>
          <span><i className="fa-solid fa-handshake" /></span>
          <p>
            <b>好友PK</b>：输的请客赢的提货
          </p>
        </div>
      </section>

      <section className={styles.detailBottom}>
        <button className={styles.detailPrimary} type="button" onClick={() => setBetOpen(true)}>
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
                <button className={styles.shareItem} type="button" key={item.label}>
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
              <h3>参与竞猜</h3>
              <button type="button" onClick={() => setBetOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.betOptionCard}>
              <div className={styles.betOptionLine}>
                <span className={selectedOption === 0 ? styles.betAccent : styles.betMuted}>会</span>
                <strong>{demoGuess.options[0].odds.toFixed(2)} 倍</strong>
              </div>
              <p>你可以直接选择支持的选项，并决定下注金额。</p>
            </div>
            <div className={styles.betPills}>
              {demoGuess.options.map((option: GuessOption, index: number) => (
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
              {[50, 100, 200, 500].map((value: number) => (
                <button
                  className={betAmount === value ? styles.betAmountActive : styles.betAmount}
                  key={value}
                  type="button"
                  onClick={() => setBetAmount(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className={styles.betStepper}>
              <button type="button" onClick={() => setBetAmount((value) => Math.max(10, value - 10))}>
                -
              </button>
              <span>{betAmount}</span>
              <button type="button" onClick={() => setBetAmount((value) => value + 10)}>
                +
              </button>
            </div>
            <button className={styles.betConfirm} type="button" onClick={() => setBetOpen(false)}>
              确认下注
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
