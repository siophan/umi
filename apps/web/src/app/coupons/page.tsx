"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Coupon = {
  id: string;
  status: "unused" | "used" | "expired";
  type: "percent" | "amount";
  amount: number;
  name: string;
  condition: string;
  expire: string;
  source: string;
};

const couponsData: Coupon[] = [
  { id: "1", status: "unused", type: "amount", amount: 20, name: "新用户满减券", condition: "满 99 元可用", expire: "2026-05-01", source: "注册赠送" },
  { id: "2", status: "unused", type: "percent", amount: 9, name: "店铺折扣券", condition: "全场商品可用", expire: "2026-05-08", source: "活动奖励" },
  { id: "3", status: "used", type: "amount", amount: 30, name: "周末大额券", condition: "满 199 元可用", expire: "2026-04-02", source: "任务兑换" },
  { id: "4", status: "expired", type: "amount", amount: 15, name: "签到奖励券", condition: "满 79 元可用", expire: "2026-03-18", source: "签到打卡" },
];

export default function CouponsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Coupon["status"]>("unused");
  const [toast, setToast] = useState("");

  const coupons = useMemo(() => couponsData.filter((item) => item.status === tab), [tab]);
  const availableCount = couponsData.filter((item) => item.status === "unused").length;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>我的优惠券</div>
        <div className={styles.spacer} />
      </header>

      <section className={styles.summary}>
        <div className={styles.count}>{availableCount}</div>
        <div className={styles.label}>可用优惠券</div>
      </section>

      <nav className={styles.tabs}>
        {[
          { key: "unused", label: "未使用" },
          { key: "used", label: "已使用" },
          { key: "expired", label: "已过期" },
        ].map((item) => (
          <button key={item.key} className={`${styles.tab} ${tab === item.key ? styles.tabActive : ""}`} type="button" onClick={() => setTab(item.key as Coupon["status"])}>
            {item.label}
          </button>
        ))}
      </nav>

      <section className={styles.list}>
        {coupons.length ? (
          coupons.map((coupon) => (
            <article key={coupon.id} className={`${styles.card} ${coupon.status === "used" ? styles.used : ""}`}>
              <div className={styles.value}>
                <div className={styles.amount}>{coupon.type === "percent" ? `${coupon.amount}%` : `¥${coupon.amount}`}</div>
                <div className={styles.unit}>{coupon.type === "percent" ? "折扣" : "满减"}</div>
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{coupon.name}</div>
                <div className={styles.condition}>{coupon.condition}</div>
                <div className={styles.expire}>有效期至 {coupon.expire} · 来源: {coupon.source}</div>
              </div>
              <div className={styles.action}>
                {coupon.status === "unused" ? (
                  <button className={styles.useBtn} type="button" onClick={() => setToast("去使用")}>
                    使用
                  </button>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <i className="fa-solid fa-ticket" />
            </div>
            <div className={styles.emptyText}>暂无优惠券</div>
          </div>
        )}
      </section>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
