'use client';

import type { CommunityPostDetailResult } from '@umi/shared';

import { REPORT_REASON_OPTIONS } from './post-detail-helpers';
import styles from './page.module.css';

type PostDetailOverlaysProps = {
  post: CommunityPostDetailResult['post'];
  shareOpen: boolean;
  reportOpen: boolean;
  reportReason: (typeof REPORT_REASON_OPTIONS)[number]['value'];
  reportDetail: string;
  reportSaving: boolean;
  onCloseShare: () => void;
  onShareAction: (label: string) => void;
  onCloseReport: () => void;
  onChangeReportReason: (value: (typeof REPORT_REASON_OPTIONS)[number]['value']) => void;
  onChangeReportDetail: (value: string) => void;
  onSubmitReport: () => void;
};

export function PostDetailOverlays({
  post,
  shareOpen,
  reportOpen,
  reportReason,
  reportDetail,
  reportSaving,
  onCloseShare,
  onShareAction,
  onCloseReport,
  onChangeReportReason,
  onChangeReportDetail,
  onSubmitReport,
}: PostDetailOverlaysProps) {
  return (
    <>
      {shareOpen ? (
        <div className={styles.shareOverlay} onClick={onCloseShare} role="presentation">
          <section className={styles.sharePanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.shareTitle}>分享到</div>
            <div className={styles.shareGrid}>
              {[
                { label: '微信', icon: 'fa-brands fa-weixin', bg: '#07C160', fg: '#fff' },
                { label: '朋友圈', icon: 'fa-solid fa-circle-nodes', bg: '#07C160', fg: '#fff' },
                { label: 'QQ', icon: 'fa-brands fa-qq', bg: '#12B7F5', fg: '#fff' },
                { label: '微博', icon: 'fa-brands fa-weibo', bg: '#E6162D', fg: '#fff' },
                { label: '复制链接', icon: 'fa-solid fa-link', bg: '#f0f0f0', fg: '#666' },
                { label: '举报', icon: 'fa-solid fa-flag', bg: '#f0f0f0', fg: '#666' },
                { label: '收藏', icon: 'fa-solid fa-bookmark', bg: '#FFF3E0', fg: '#FF9800' },
                { label: '保存图片', icon: 'fa-solid fa-download', bg: '#f0f0f0', fg: '#666' },
              ].map((item) => (
                <button className={styles.shareItem} key={item.label} type="button" onClick={() => onShareAction(item.label)}>
                  <span className={styles.shareItemIcon} style={{ background: item.bg, color: item.fg }}><i className={item.icon} /></span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>
            <button className={styles.shareCancelBtn} type="button" onClick={onCloseShare}>
              取消
            </button>
          </section>
        </div>
      ) : null}

      {reportOpen ? (
        <div className={styles.shareOverlay} onClick={() => !reportSaving && onCloseReport()} role="presentation">
          <section className={styles.reportPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.shareTitle}>举报动态</div>
            <div className={styles.reportOptions}>
              {REPORT_REASON_OPTIONS.map((item) => (
                <button
                  className={`${styles.reportOption} ${reportReason === item.value ? styles.reportOptionActive : ''}`}
                  key={item.value}
                  type="button"
                  onClick={() => onChangeReportReason(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <textarea
              className={styles.reportTextarea}
              placeholder={`补充说明（选填）${post.title ? `：${post.title}` : ''}`}
              value={reportDetail}
              onChange={(event) => onChangeReportDetail(event.target.value)}
            />
            <div className={styles.reportActions}>
              <button className={styles.shareCancelBtn} type="button" disabled={reportSaving} onClick={onCloseReport}>
                取消
              </button>
              <button className={styles.reportSubmitBtn} type="button" disabled={reportSaving} onClick={onSubmitReport}>
                {reportSaving ? '提交中' : '提交举报'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
