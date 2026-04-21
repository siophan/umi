"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { reviewOrder } from "../../lib/api/orders";
import styles from "./page.module.css";

function ReviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const productId = searchParams.get("productId") ?? "";

  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const hasReviewContext = Boolean(orderId && productId);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function handleSubmit() {
    if (!orderId || !productId) {
      showToast("参数缺失，无法提交评价");
      return;
    }
    try {
      setSubmitting(true);
      await reviewOrder(orderId, { productId, rating, content: content.trim() || undefined });
      showToast("评价成功！");
      window.setTimeout(() => router.replace("/orders"), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <h1 className={styles.title}>评价商品</h1>
        <div className={styles.placeholder} />
      </header>

      {!hasReviewContext ? (
        <div className={styles.issueWrap}>
          <div className={styles.issueCard}>
            <div className={styles.issueIcon}>
              <i className="fa-solid fa-circle-exclamation" />
            </div>
            <div className={styles.issueTitle}>缺少评价上下文</div>
            <div className={styles.issueDesc}>当前入口没有携带订单和商品信息，暂时无法提交评价。</div>
            <div className={styles.issueActions}>
              <button className={styles.issueGhostBtn} type="button" onClick={() => router.back()}>
                返回上一页
              </button>
              <button className={styles.issuePrimaryBtn} type="button" onClick={() => router.replace("/orders")}>
                回到订单
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className={styles.card}>
        <p className={styles.label}>综合评分</p>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.star} ${displayRating >= star ? styles.starActive : ""}`}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} 星`}
            >
              <i className="fa-solid fa-star" />
            </button>
          ))}
        </div>
        <p className={styles.ratingLabel}>
          {["", "非常差", "较差", "一般", "较好", "非常好"][displayRating]}
        </p>

        <p className={styles.label}>评价内容（选填）</p>
        <textarea
          className={styles.textarea}
          placeholder="分享你的使用感受，帮助其他人做出更好的选择..."
          maxLength={500}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
        />
        <p className={styles.count}>{content.length}/500</p>

        <p className={styles.label}>晒单图片（暂未开放）</p>
        <div className={styles.uploadGrid}>
          <button className={styles.uploadPlaceholder} type="button" disabled aria-disabled="true">
            <span className={styles.uploadIcon}>
              <i className="fa-solid fa-camera" />
            </span>
            <span className={styles.uploadTitle}>上传图片</span>
            <span className={styles.uploadHint}>图片晒单能力建设中</span>
          </button>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className={styles.uploadGhost} aria-hidden="true">
              <i className="fa-regular fa-image" />
            </div>
          ))}
        </div>

        <button
          className={styles.submitBtn}
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? "提交中..." : "提交评价"}
        </button>
      </div>
      )}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewPageInner />
    </Suspense>
  );
}
