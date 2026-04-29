'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ProductReviewItem } from '@umi/shared';

import {
  appendProductReview,
  fetchProductReviews,
  toggleProductReviewHelpful,
} from '../../../../lib/api/products';
import { uploadOssImage } from '../../../../lib/api/uploads';
import styles from './page.module.css';

const REVIEW_IMAGE_LIMIT = 9;
const ALLOWED_REVIEW_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

const PAGE_SIZE = 20;

export default function ProductReviewsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = typeof params?.id === 'string' ? params.id : '';
  const [items, setItems] = useState<ProductReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ averageRating: 0, totalCount: 0, withImages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appendingFor, setAppendingFor] = useState<string | null>(null);
  const [appendContent, setAppendContent] = useState('');
  const [appendImages, setAppendImages] = useState<string[]>([]);
  const [appendImageUploading, setAppendImageUploading] = useState(false);
  const [appendSubmitting, setAppendSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let ignore = false;
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchProductReviews(productId, { page: 1, pageSize: PAGE_SIZE })
      .then((result) => {
        if (ignore) return;
        setItems(result.items);
        setTotal(result.total);
        setSummary(result.summary);
        setPage(1);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : '评价加载失败');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [productId]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const result = await fetchProductReviews(productId, { page: next, pageSize: PAGE_SIZE });
      setItems((current) => [...current, ...result.items]);
      setPage(next);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openAppendDialog(reviewId: string) {
    setAppendingFor(reviewId);
    setAppendContent('');
    setAppendImages([]);
  }

  function closeAppendDialog() {
    setAppendingFor(null);
    setAppendContent('');
    setAppendImages([]);
  }

  async function selectAppendImages(event: React.ChangeEvent<HTMLInputElement>) {
    const remaining = Math.max(0, REVIEW_IMAGE_LIMIT - appendImages.length);
    const files = Array.from(event.target.files ?? []).slice(0, remaining);
    event.target.value = '';
    if (!files.length) return;
    setAppendImageUploading(true);
    try {
      for (const file of files) {
        if (!ALLOWED_REVIEW_IMAGE_MIME.has(file.type)) {
          setToast('仅支持 jpg/png/webp/gif 图片');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setToast(`图片 ${file.name} 超过 10MB`);
          continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        const result = await uploadOssImage({
          fileName: file.name || 'image',
          contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          contentBase64: dataUrl,
          usage: 'product_review',
        });
        setAppendImages((current) => [...current, result.url].slice(0, REVIEW_IMAGE_LIMIT));
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setAppendImageUploading(false);
    }
  }

  function removeAppendImage(target: string) {
    setAppendImages((current) => current.filter((item) => item !== target));
  }

  async function submitAppend() {
    if (!appendingFor) return;
    const content = appendContent.trim();
    if (!content) {
      setToast('请输入追评内容');
      return;
    }
    setAppendSubmitting(true);
    try {
      const result = await appendProductReview(appendingFor, {
        content,
        images: appendImages,
      });
      const submittedImages = appendImages;
      setItems((current) =>
        current.map((item) =>
          item.id === appendingFor
            ? {
                ...item,
                appendedContent: content,
                appendedImages: submittedImages,
                appendedAt: result.appendedAt,
              }
            : item,
        ),
      );
      setToast('追评成功');
      closeAppendDialog();
    } catch (err) {
      setToast(err instanceof Error ? err.message : '追评失败');
    } finally {
      setAppendSubmitting(false);
    }
  }

  async function handleToggleHelpful(reviewId: string) {
    try {
      const result = await toggleProductReviewHelpful(reviewId);
      setItems((current) =>
        current.map((item) =>
          item.id === reviewId
            ? { ...item, helpfulVoted: result.helpful, helpfulCount: result.helpfulCount }
            : item,
        ),
      );
    } catch {
      // ignore
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <button className={styles.navBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>全部评价</div>
        <div style={{ width: 32 }} />
      </header>

      <section className={styles.summary}>
        <div className={styles.summaryRating}>{summary.averageRating.toFixed(1)}</div>
        <div className={styles.summaryMeta}>
          <span>共 {summary.totalCount} 条评价</span>
          {summary.withImages > 0 ? <span>· 含 {summary.withImages} 条晒图</span> : null}
        </div>
      </section>

      {loading ? (
        <div className={styles.empty}>加载中…</div>
      ) : error ? (
        <div className={styles.empty}>{error}</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>暂无用户评价</div>
      ) : (
        <section className={styles.list}>
          {items.map((review) => (
            <article className={styles.item} key={review.id}>
              <div className={styles.itemHead}>
                <img
                  className={styles.avatar}
                  src={review.userAvatar || '/avatar-default.png'}
                  alt={review.userName}
                />
                <div className={styles.headMeta}>
                  <div className={styles.userName}>{review.userName}</div>
                  <div className={styles.stars}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(Math.max(0, 5 - review.rating))}
                  </div>
                </div>
                <div className={styles.itemDate}>
                  {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>

              {review.content ? <div className={styles.itemText}>{review.content}</div> : null}

              {review.images.length ? (
                <div className={styles.images}>
                  {review.images.map((src, index) => (
                    <img className={styles.image} src={src} alt={`晒图 ${index + 1}`} key={`${src}-${index}`} />
                  ))}
                </div>
              ) : null}

              {review.appendedContent ? (
                <div className={styles.append}>
                  <strong>追评</strong>
                  {review.appendedContent}
                  {review.appendedImages.length ? (
                    <div className={styles.images} style={{ marginTop: 6 }}>
                      {review.appendedImages.map((src, index) => (
                        <img className={styles.image} src={src} alt={`追评图 ${index + 1}`} key={`${src}-${index}`} />
                      ))}
                    </div>
                  ) : null}
                  {review.appendedAt ? (
                    <div className={styles.appendDate}>
                      {new Date(review.appendedAt).toLocaleDateString('zh-CN')} 追评
                    </div>
                  ) : null}
                </div>
              ) : null}

              {review.reply ? (
                <div className={styles.reply}>
                  <strong>店铺回复</strong>
                  {review.reply}
                </div>
              ) : null}

              <div className={styles.itemFoot}>
                {review.isMine && !review.appendedAt ? (
                  <button
                    className={styles.appendBtn}
                    type="button"
                    onClick={() => openAppendDialog(review.id)}
                  >
                    <i className="fa-regular fa-pen-to-square" /> 我要追评
                  </button>
                ) : null}
                <button
                  className={`${styles.helpful} ${review.helpfulVoted ? styles.helpfulActive : ''}`}
                  type="button"
                  onClick={() => void handleToggleHelpful(review.id)}
                >
                  <i className={`fa-${review.helpfulVoted ? 'solid' : 'regular'} fa-heart`} />{' '}
                  {review.helpfulCount > 0 ? review.helpfulCount : '有用'}
                </button>
              </div>
            </article>
          ))}
          {items.length < total ? (
            <button className={styles.loadMore} type="button" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? '加载中…' : `查看更多（${total - items.length}）`}
            </button>
          ) : (
            <div className={styles.empty}>已经到底了</div>
          )}
        </section>
      )}

      {appendingFor ? (
        <>
          <div className={styles.modalMask} onClick={closeAppendDialog} />
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <div className={styles.modalTitle}>追评</div>
              <button className={styles.modalClose} type="button" onClick={closeAppendDialog}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <textarea
                className={styles.modalTextarea}
                placeholder="说说使用一段时间后的感受…（最多 1000 字）"
                rows={5}
                maxLength={1000}
                value={appendContent}
                onChange={(event) => setAppendContent(event.target.value)}
              />
              <div className={styles.uploaderHint}>
                追评晒图（{appendImages.length}/{REVIEW_IMAGE_LIMIT}）
              </div>
              <div className={styles.uploaderGrid}>
                {appendImages.map((src) => (
                  <div className={styles.uploaderItem} key={src}>
                    <img src={src} alt="追评图" />
                    <button
                      type="button"
                      className={styles.uploaderRemove}
                      onClick={() => removeAppendImage(src)}
                      aria-label="删除"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
                {appendImages.length < REVIEW_IMAGE_LIMIT ? (
                  <label
                    className={`${styles.uploaderAdd} ${appendImageUploading ? styles.uploaderAddBusy : ''}`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      hidden
                      disabled={appendImageUploading}
                      onChange={(event) => void selectAppendImages(event)}
                    />
                    {appendImageUploading ? '上传中…' : <i className="fa-solid fa-plus" />}
                  </label>
                ) : null}
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.modalCancel} type="button" onClick={closeAppendDialog}>
                取消
              </button>
              <button
                className={styles.modalSubmit}
                type="button"
                disabled={appendSubmitting}
                onClick={() => void submitAppend()}
              >
                {appendSubmitting ? '提交中…' : '发布追评'}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
