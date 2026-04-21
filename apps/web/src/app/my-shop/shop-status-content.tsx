'use client';

import type { CategoryId } from '@umi/shared';

import styles from './page.module.css';
import { formatDateLabel, type ShopFormState, type ShopStatusData } from './my-shop-helpers';

type ShopStatusContentProps = {
  loading: boolean;
  error: string | null;
  submitting: boolean;
  shopStatus: ShopStatusData;
  form: ShopFormState;
  onRetry: () => void;
  onSubmit: () => void;
  onFormChange: (patch: Partial<ShopFormState>) => void;
};

export function ShopStatusContent({
  loading,
  error,
  submitting,
  shopStatus,
  form,
  onRetry,
  onSubmit,
  onFormChange,
}: ShopStatusContentProps) {
  if (loading) {
    return (
      <section className={styles.applySection}>
        <div className={styles.emptyTitle}>正在读取店铺状态</div>
        <div className={styles.emptyDesc}>稍等片刻，正在同步你的开店申请与店铺信息。</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.applySection}>
        <div className={styles.emptyTitle}>店铺状态读取失败</div>
        <div className={styles.emptyDesc}>{error}</div>
        <button className={styles.submitBtn} type="button" onClick={onRetry}>
          重新加载
        </button>
      </section>
    );
  }

  if (shopStatus.status === 'pending' && shopStatus.latestApplication) {
    return (
      <>
        <section className={styles.applyHero}>
          <div className={styles.applyHeroEyebrow}>开店申请</div>
          <div className={styles.applyHeroTitle}>申请已提交，等待审核</div>
          <div className={styles.applyHeroDesc}>后台审核通过后会自动开通店铺，这里会同步显示结果。</div>
          <div className={styles.applyStatusBadge}>审核中</div>
        </section>

        <section className={styles.applySection}>
          <div className={styles.sectionTitle}>申请进度</div>
          <div className={styles.progressRail}>
            <div className={`${styles.progressStep} ${styles.progressStepActive}`}>
              <div className={styles.progressDot}>1</div>
              <div className={styles.progressBody}>
                <strong>已提交</strong>
                <span>{formatDateLabel(shopStatus.latestApplication.createdAt)}</span>
              </div>
            </div>
            <div className={styles.progressLine} />
            <div className={`${styles.progressStep} ${styles.progressStepActive}`}>
              <div className={styles.progressDot}>
                <i className="fa-regular fa-clock" />
              </div>
              <div className={styles.progressBody}>
                <strong>平台审核中</strong>
                <span>等待后台处理申请</span>
              </div>
            </div>
            <div className={styles.progressLine} />
            <div className={styles.progressStep}>
              <div className={styles.progressDot}>3</div>
              <div className={styles.progressBody}>
                <strong>审核通过后开店</strong>
                <span>自动同步到店铺页</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.applySection}>
          <div className={styles.sectionTitle}>申请信息</div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>申请单号</span>
              <strong>{shopStatus.latestApplication.applyNo}</strong>
              <em>用于后台审核检索</em>
            </div>
            <div className={styles.infoItem}>
              <span>店铺名称</span>
              <strong>{shopStatus.latestApplication.shopName}</strong>
              <em>开通后默认展示名称</em>
            </div>
            <div className={styles.infoItem}>
              <span>经营分类</span>
              <strong>{shopStatus.latestApplication.categoryName || '未填写'}</strong>
              <em>影响店铺类目归属</em>
            </div>
            <div className={styles.infoItem}>
              <span>提交时间</span>
              <strong>{shopStatus.latestApplication.createdAt.slice(0, 10)}</strong>
              <em>审核排序以此为准</em>
            </div>
          </div>
          <div className={styles.reasonCard}>
            <div className={styles.reasonLabel}>开店说明</div>
            <div className={styles.reasonText}>{shopStatus.latestApplication.reason || '未填写说明'}</div>
          </div>
        </section>
      </>
    );
  }

  const latestRejected = shopStatus.status === 'rejected' ? shopStatus.latestApplication : null;

  return (
    <>
      <section className={styles.applyHero}>
        <div className={styles.applyHeroEyebrow}>开店申请</div>
        <div className={styles.applyHeroTitle}>
          {latestRejected ? '申请未通过，支持重新提交' : '申请店铺，等待后台审核'}
        </div>
        <div className={styles.applyHeroDesc}>开通后即可承接品牌授权、上架商品、查看店铺经营数据。</div>
        {latestRejected ? <div className={styles.rejectBadge}>上次申请已拒绝</div> : null}
      </section>

      {latestRejected ? (
        <section className={styles.applySection}>
          <div className={styles.rejectCard}>
            <div className={styles.rejectTitle}>驳回原因</div>
            <div className={styles.rejectText}>
              {latestRejected.rejectReason || '暂无详细原因，请调整资料后重新申请。'}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.applySection}>
        <div className={styles.applyHintCard}>
          <div className={styles.applyHintTitle}>填写建议</div>
          <div className={styles.applyHintList}>
            <span>店铺名称尽量稳定，避免频繁更换。</span>
            <span>经营分类选择最贴近主营方向的类目。</span>
            <span>开店说明建议写清货源、经营目标或内容定位。</span>
          </div>
        </div>
        <div className={styles.sectionTitle}>填写申请</div>
        <div className={styles.formField}>
          <label htmlFor="shopName">店铺名称</label>
          <input
            id="shopName"
            className={styles.formInput}
            maxLength={24}
            placeholder="例如：Umi 零食铺"
            value={form.shopName}
            onChange={(event) => onFormChange({ shopName: event.target.value })}
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="categoryId">经营分类</label>
          <select
            id="categoryId"
            className={styles.formSelect}
            value={form.categoryId}
            onChange={(event) => onFormChange({ categoryId: event.target.value as CategoryId | '' })}
          >
            <option value="">请选择经营分类</option>
            {shopStatus.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <div className={styles.fieldHead}>
            <label htmlFor="reason">开店说明</label>
            <span className={styles.fieldCounter}>{form.reason.length}/200</span>
          </div>
          <textarea
            id="reason"
            className={styles.formTextarea}
            maxLength={200}
            placeholder="介绍你的经营方向、供货能力或开店目的。"
            value={form.reason}
            onChange={(event) => onFormChange({ reason: event.target.value })}
          />
        </div>
        <button className={styles.submitBtn} type="button" disabled={submitting} onClick={onSubmit}>
          {submitting ? '提交中...' : latestRejected ? '重新提交申请' : '提交开店申请'}
        </button>
      </section>
    </>
  );
}
