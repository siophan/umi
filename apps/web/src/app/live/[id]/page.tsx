'use client';

import { useState } from 'react';

import styles from './page.module.css';

const options = [
  { label: '会售罄', odds: 'x1.8' },
  { label: '不会售罄', odds: 'x2.2' },
];

const danmaku = [
  { name: '零食猎人', text: '这场我押会，乐事这波库存不多。' },
  { name: '德芙控', text: '主播刚刚说还有隐藏福利。' },
  { name: '优米鼠鼠', text: '边看边猜真的上头。' },
];

export default function LiveDetailPage() {
  const [selected, setSelected] = useState(0);

  return (
    <main className={styles.page}>
      <section className={styles.video}>
        <img src="/legacy/images/guess/g203.jpg" alt="直播封面" />
        <div className={styles.videoShade} />
        <div className={styles.topBar}>
          <div className={styles.hostInfo}>
            <img src="/legacy/images/products/p001-lays.jpg" alt="乐事官方旗舰店" />
            <span>乐事官方旗舰店</span>
          </div>
          <div className={styles.viewers}>👁 2.8万</div>
        </div>
        <button className={styles.playBtn} type="button">
          <i className="fa-solid fa-circle-play" />
        </button>
      </section>

      <section className={styles.content}>
        <div className={styles.guessSection}>
          <div className={styles.guessCard}>
            <div className={styles.guessHead}>
              <div className={styles.guessTitle}>🎯 实时竞猜</div>
              <div className={styles.timer}>00:12:48</div>
            </div>
            <p className={styles.desc}>乐事春季限定开箱夜，今晚库存会不会在直播结束前售罄？</p>
            <div className={styles.optionRow}>
              {options.map((item, index) => (
                <button
                  className={selected === index ? styles.optionActive : styles.option}
                  key={item.label}
                  type="button"
                  onClick={() => setSelected(index)}
                >
                  <div className={styles.optionName}>{item.label}</div>
                  <div className={styles.optionOdds}>{item.odds}</div>
                </button>
              ))}
            </div>
            <button className={styles.joinBtn} type="button">参与竞猜</button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}><strong>3</strong><span>进行中的竞猜</span></div>
          <div className={styles.stat}><strong>2.8万</strong><span>总参与</span></div>
          <div className={styles.stat}><strong>1.2万</strong><span>参与人次</span></div>
        </div>

        <div className={styles.divider} />

        <section className={styles.danmakuSection}>
          <h3>弹幕互动</h3>
          <div className={styles.danmakuList}>
            {danmaku.map((item) => (
              <div className={styles.danmakuItem} key={item.name}>
                <span className={styles.dmName}>{item.name}：</span>
                <span className={styles.dmText}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <footer className={styles.inputBar}>
        <input placeholder="发送弹幕..." />
        <button className={styles.actionBtn} type="button"><i className="fa-solid fa-paper-plane" /></button>
        <button className={styles.actionBtnMuted} type="button"><i className="fa-solid fa-gift" /></button>
        <button className={styles.actionBtnMuted} type="button"><i className="fa-solid fa-share-nodes" /></button>
      </footer>
    </main>
  );
}
