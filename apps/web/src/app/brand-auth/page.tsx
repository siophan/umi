'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

const mine = [
  { name: '乐事', meta: '授权有效期至 2027-03-31', status: '✅ 已授权', cls: styles.ok, img: '/legacy/images/products/p001-lays.jpg' },
  { name: '德芙', meta: '提交于 2026-04-10', status: '⏳ 审核中', cls: styles.pending, img: '/legacy/images/products/p007-dove.jpg' },
];

const available = [
  { name: '卫龙', category: '辣味零食', count: 234, deposit: 400, monthSales: '3.5万', img: '/legacy/images/products/p008-weilong.jpg' },
  { name: '良品铺子', category: '综合零食', count: 178, deposit: 700, monthSales: '2.8万', img: '/legacy/images/products/p005-liangpin.jpg' },
  { name: '旺旺', category: '膨化食品', count: 156, deposit: 600, monthSales: '2.1万', img: '/legacy/images/products/p016-wangzai.jpg' },
];

export default function BrandAuthPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<(typeof available)[number] | null>(null);
  const [shopName, setShopName] = useState('');
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [success, setSuccess] = useState(false);

  const closeModal = () => {
    setCurrent(null);
    setSuccess(false);
    setShopName('');
    setReason('');
    setAgreed(true);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span className={styles.title}>品牌授权</span>
      </header>

      <section className={styles.infoCard}>
        <h4>🔐 品牌授权说明</h4>
        <div className={styles.steps}>
          <div className={styles.step}><div className={styles.dot}>1</div><div><strong>选择品牌</strong> → 选择你想授权的零食品牌</div></div>
          <div className={styles.step}><div className={styles.dot}>2</div><div><strong>提交资料</strong> → 填写店铺信息并缴纳保证金</div></div>
          <div className={styles.step}><div className={styles.dot}>3</div><div><strong>审核通过</strong> → 1-3个工作日审核，通过后可上架</div></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>我的授权 <span>{mine.length}个品牌</span></div>
        <div className={styles.list}>
          {mine.map((item) => (
            <article className={styles.row} key={item.name}>
              <img src={item.img} alt={item.name} />
              <div className={styles.info}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.meta}>{item.meta}</div>
              </div>
              <span className={item.cls}>{item.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>可申请品牌 <span>选择品牌点击申请</span></div>
        <div className={styles.list}>
          {available.map((item) => (
            <article className={styles.availableRow} key={item.name} onClick={() => setCurrent(item)}>
              <img src={item.img} alt={item.name} />
              <div className={styles.info}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.meta}>{item.category} · 已有{item.count}家授权商 · 月均{item.monthSales}销量</div>
              </div>
              <div className={styles.right}>
                <div className={styles.deposit}>¥{item.deposit}</div>
                <button
                  className={styles.apply}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrent(item);
                  }}
                >
                  申请授权
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {current ? (
        <div className={styles.overlay} onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <div className={styles.modal}>
            {success ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>✅</div>
                <div className={styles.successTitle}>申请已提交</div>
                <div className={styles.successDesc}>我们会在 1-3 个工作日内完成审核，请留意系统通知。</div>
                <div className={styles.modalFooter}>
                  <button className={`${styles.modalBtn} ${styles.confirmBtn}`} type="button" onClick={closeModal}>
                    我知道了
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.modalBrand}>
                    <img src={current.img} alt={current.name} />
                    <span className={styles.modalBrandName}>{current.name}</span>
                  </div>
                  <div className={styles.modalSubtitle}>品牌授权申请</div>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.modalSection}>
                    <div className={styles.modalLabel}>品牌信息</div>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoKey}>品牌类目</span>
                      <span className={styles.modalInfoVal}>{current.category}</span>
                    </div>
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalInfoKey}>保证金</span>
                      <span className={`${styles.modalInfoVal} ${styles.priceVal}`}>¥{current.deposit}</span>
                    </div>
                  </div>

                  <div className={styles.modalSection}>
                    <div className={styles.modalLabel}>店铺信息</div>
                    <input
                      className={styles.modalInput}
                      value={shopName}
                      onChange={(event) => setShopName(event.target.value)}
                      placeholder="请输入店铺名称"
                    />
                  </div>

                  <div className={styles.modalSection}>
                    <div className={styles.modalLabel}>申请说明</div>
                    <textarea
                      className={styles.modalTextarea}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="请填写主营商品、运营经验等信息"
                    />
                  </div>

                  <div className={styles.checkboxRow}>
                    <input id="brand-agree" type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                    <label htmlFor="brand-agree">
                      我已阅读并同意品牌授权协议及平台保证金规则
                    </label>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={`${styles.modalBtn} ${styles.cancelBtn}`} type="button" onClick={closeModal}>
                    取消
                  </button>
                  <button
                    className={`${styles.modalBtn} ${styles.confirmBtn}`}
                    type="button"
                    disabled={!shopName.trim() || !reason.trim() || !agreed}
                    onClick={() => setSuccess(true)}
                  >
                    提交申请
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
