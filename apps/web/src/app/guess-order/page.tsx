'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const product = {
  name: '奥利奥原味夹心饼干 67g*3',
  brand: '奥利奥官方旗舰店',
  price: 26.8,
  stock: '库存充足 · 24小时内发货',
  image: '/legacy/images/products/p002-oreo.jpg',
};

const predictionOptions = [
  { name: '阿根廷卫冕', pct: 56, odds: '×1.8', trend: 'up', fill: '56%', votes: '5,632人', tone: 'color0' },
  { name: '法国夺冠', pct: 28, odds: '×3.4', trend: 'down', fill: '28%', votes: '2,814人', tone: 'color1' },
  { name: '比赛进加时', pct: 8, odds: '×8.6', trend: 'up', fill: '8%', votes: '812人', tone: 'color2' },
  { name: '点球决胜', pct: 5, odds: '×12.0', trend: 'stable', fill: '5%', votes: '356人', tone: 'color3' },
  { name: '冷门爆出', pct: 3, odds: '×22.5', trend: 'up', fill: '3%', votes: '121人', tone: 'color4' },
];

const coupons = [
  { name: '新人大礼包', cond: '满 29 可用', amount: 5, tone: 'red' },
  { name: '店铺满减券', cond: '满 59 可用', amount: 10, tone: 'blue' },
  { name: '品牌大额券', cond: '满 99 可用', amount: 20, tone: 'green' },
];

const friends = [
  {
    name: '球迷小张',
    avatar: '/legacy/images/mascot/mouse-main.png',
    online: true,
  },
  {
    name: '零食猎人',
    avatar: '/legacy/images/mascot/mouse-happy.png',
    online: true,
  },
  {
    name: '预测家',
    avatar: '/legacy/images/mascot/mouse-casual.png',
    online: false,
  },
];

function GuessOrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const choice = Number(searchParams.get('choice') || 0);
  const qty = Math.max(1, Number(searchParams.get('qty') || 1));
  const [selectedPrediction, setSelectedPrediction] = useState(
    Number.isNaN(choice) ? 0 : Math.min(Math.max(choice, 0), predictionOptions.length - 1),
  );
  const [selectedCoupon, setSelectedCoupon] = useState(-1);
  const [selectedFriend, setSelectedFriend] = useState(-1);
  const [showPk, setShowPk] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const total = useMemo(() => {
    const coupon = coupons[selectedCoupon]?.amount || 0;
    return Math.max(product.price - coupon, 0).toFixed(2);
  }, [selectedCoupon]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          type="button"
          onClick={() => router.back()}
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>竞猜下单</div>
        <div className={styles.headerSpacer} />
      </header>

      <div className={styles.countdownBar}>
        <i className="fa-solid fa-clock" />
        <div className={styles.countdownText}>距开奖</div>
        <div className={styles.countdown}>
          06 <span>时</span> 18 <span>分</span>
        </div>
      </div>

      <section className={styles.productCard}>
        <img alt={product.name} src={product.image} />
        <div className={styles.productInfo}>
          <div className={styles.productName}>{product.name}</div>
          <div className={styles.productBrand}>{product.brand}</div>
          <div className={styles.productPrice}>
            ¥ {product.price.toFixed(2)}
          </div>
          <div className={styles.productStock}>{product.stock}</div>
        </div>
      </section>

      <section className={styles.section}>
        <h3>
          <i className="fa-solid fa-bullseye" /> 你的预测
        </h3>
        <p>赢方瓜分输方下注的商品 · 回报率实时变化</p>
        <div className={styles.options}>
          {predictionOptions.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={`${styles.option} ${selectedPrediction === index ? styles.optionSelected : ''} ${styles[item.tone]}`}
              onClick={() => setSelectedPrediction(index)}
            >
              <div className={styles.optionFill} style={{ width: item.fill }} />
              <div className={styles.optionRadio} />
              <div className={styles.optionInfo}>
                <div className={styles.optionName}>{item.name}</div>
                <div className={styles.optionPct}>
                  <span className={styles.optionPctNum}>{item.pct}%</span>
                  <span>
                    <i className="fa-solid fa-users" /> {item.votes}
                  </span>
                </div>
                <div className={styles.qtyBadge}>
                  <i className="fa-solid fa-box" /> 竞猜{qty}件
                </div>
              </div>
              <div className={styles.optionRight}>
                <div className={styles.optionOdds}>{item.odds}</div>
                <div
                  className={`${styles.trend} ${styles[item.trend === 'stable' ? 'stable' : item.trend === 'up' ? 'up' : 'down']}`}
                >
                  {item.trend === 'stable' ? '→稳定' : item.trend === 'up' ? '↑上升' : '↓下降'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.couponSection}>
        <h4>
          <i className="fa-solid fa-ticket" /> 使用优惠券 <span>(可选)</span>
        </h4>
        <div className={styles.couponList}>
          {coupons.map((coupon, index) => (
            <button
              key={coupon.name}
              type="button"
              className={`${styles.couponItem} ${selectedCoupon === index ? styles.couponSelected : ''}`}
              onClick={() => setSelectedCoupon(index)}
            >
              <div className={`${styles.couponLeft} ${styles[coupon.tone]}`}>
                <div className={styles.couponValue}>
                  <small>¥</small>
                  {coupon.amount}
                </div>
                <div className={styles.couponLabel}>优惠券</div>
              </div>
              <div className={styles.couponInfo}>
                <div className={styles.couponName}>{coupon.name}</div>
                <div className={styles.couponCond}>{coupon.cond}</div>
                <div className={styles.couponExp}>有效期至 2026-04-30</div>
              </div>
              <div className={styles.couponCheck}>
                {selectedCoupon === index ? '✓' : ''}
              </div>
            </button>
          ))}
          <button
            type="button"
            className={styles.noCoupon}
            onClick={() => setSelectedCoupon(-1)}
          >
            不使用优惠券
          </button>
        </div>
      </section>

      <section className={styles.pkSection}>
        <h3>
          <i className="fa-solid fa-user-group" /> 邀请好友 PK <span>(可选)</span>
        </h3>
        <p>输的请客，赢的提货！选择对手开始 PK</p>
        <div className={styles.friends}>
          {friends.map((friend, index) => (
            <button
              key={friend.name}
              type="button"
              className={`${styles.friend} ${selectedFriend === index ? styles.friendSelected : ''}`}
              onClick={() => {
                setSelectedFriend(index);
                setShowPk(true);
              }}
            >
              <img alt={friend.name} src={friend.avatar} />
              {friend.online ? <span className={styles.onlineDot} /> : null}
              <span>{friend.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.explain}>
        <h4>
          <i className="fa-solid fa-clipboard-list" /> 竞猜下单说明
        </h4>
        <div className={styles.expItem}>
          <i className="fa-solid fa-gift" />
          <p>
            <b>猜中</b>：商品直接发货到您的地址
          </p>
        </div>
        <div className={styles.expItem}>
          <i className="fa-solid fa-ticket" />
          <p>
            <b>没猜中</b>：自动获得竞猜补偿券
          </p>
        </div>
        <div className={styles.expItem}>
          <i className="fa-solid fa-user-group" />
          <p>
            <b>好友 PK</b>：输的一方请客，赢的一方提货 + 额外奖励
          </p>
        </div>
        <div className={styles.expItem}>
          <i className="fa-regular fa-clock" />
          <p>
            <b>开奖时间</b>：竞猜倒计时结束后自动开奖并公布结果
          </p>
        </div>
      </section>

      <section className={styles.summary}>
        <div className={styles.sumRow}>
          <span>商品金额</span>
          <strong>¥ {product.price.toFixed(2)}</strong>
        </div>
        <div className={styles.sumRow}>
          <span>优惠券</span>
          <strong>
            - ¥ {(coupons[selectedCoupon]?.amount || 0).toFixed(2)}
          </strong>
        </div>
        <div className={styles.sumRow}>
          <span>实付金额</span>
          <strong className={styles.total}>¥ {total}</strong>
        </div>
      </section>

      <footer className={styles.bottom}>
        <div className={styles.bottomTop}>
          <span>实付金额</span>
          <div className={styles.bottomPrice}>¥ {total}</div>
        </div>
        <div className={styles.bottomButtons}>
          <button
            type="button"
            className={styles.outline}
            onClick={() => router.back()}
          >
            返回
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setShowResult(true)}
          >
            <i className="fa-solid fa-hand-pointer" /> 立即下单
          </button>
        </div>
      </footer>

      {showPk ? (
        <div className={styles.modal}>
          <div className={styles.modalBg} onClick={() => setShowPk(false)} />
          <div className={styles.modalBox}>
            <div className={styles.modalTitle}>PK 对手已选择</div>
            <div className={styles.modalDesc}>
              {friends[selectedFriend].name} 已加入对战，结算后你们将自动对奖。
            </div>
            <button
              type="button"
              className={styles.modalBtn}
              onClick={() => setShowPk(false)}
            >
              确定
            </button>
          </div>
        </div>
      ) : null}

      {showResult ? (
        <div className={styles.modal}>
          <div
            className={styles.modalBg}
            onClick={() => setShowResult(false)}
          />
          <div className={styles.resultBox}>
            <div className={styles.resultIcon}>
              <i className="fa-solid fa-party-horn" />
            </div>
            <div className={styles.resultTitle}>下单成功</div>
            <div className={styles.resultDesc}>
              竞猜已创建，开奖后会自动发货或发放补偿券。
            </div>
            <button
              type="button"
            className={styles.modalBtn}
            onClick={() => setShowResult(false)}
          >
              继续竞猜
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function GuessOrderPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <GuessOrderPageInner />
    </Suspense>
  );
}
