'use client';

import type { Dispatch, RefObject, SetStateAction } from 'react';

import styles from './page.module.css';

type TopicItem = {
  text: string;
  icon: string;
  hot?: boolean;
};

type Props = {
  stepDone: boolean;
  titleInputRef: RefObject<HTMLInputElement | null>;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  visibleTopics: TopicItem[];
  selectedTopic: string;
  pickTopic: (topicText: string) => void;
  refreshTopics: () => void;
  titleTipVisible: boolean;
  titleInputError: boolean;
  desc: string;
  setDesc: Dispatch<SetStateAction<string>>;
  coverInputRef: RefObject<HTMLInputElement | null>;
  coverPreviewUrl: string;
  coverUploading: boolean;
  coverUploaded: boolean;
  handleCoverPick: (file: File | null) => void;
};

export function CreateBasicInfoSection({
  stepDone,
  titleInputRef,
  title,
  setTitle,
  visibleTopics,
  selectedTopic,
  pickTopic,
  refreshTopics,
  titleTipVisible,
  titleInputError,
  desc,
  setDesc,
  coverInputRef,
  coverPreviewUrl,
  coverUploading,
  coverUploaded,
  handleCoverPick,
}: Props) {
  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>1</span> 基本信息
        <span className={`${styles.stepStatus} ${stepDone ? styles.done : styles.pending}`}>{stepDone ? '✓ 已完成' : '待完善'}</span>
      </h3>

      <div className={styles.field}>
        <label className={styles.label}>
          竞猜标题<span className={styles.requiredMark}>*</span>
        </label>
        <input
          ref={titleInputRef}
          className={`${styles.input} ${titleInputError ? styles.inputError : ''}`}
          placeholder="例如：猜猜今年最火零食是什么？"
          maxLength={50}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className={styles.topics}>
          <span className={styles.topicsTag}>
            <i className="fa-solid fa-fire" />
            热门
          </span>
          <div className={styles.topicsScroll}>
            {visibleTopics.map((item) => (
              <button
                key={item.text}
                type="button"
                className={`${styles.topicChip} ${item.hot ? styles.topicChipHot : ''} ${selectedTopic === item.text ? styles.topicChipPicked : ''}`}
                onClick={() => pickTopic(item.text)}
              >
                {item.icon} {item.text}
              </button>
            ))}
          </div>
          <button className={styles.topicsMore} type="button" onClick={refreshTopics} title="换一批">
            <i className="fa-solid fa-rotate" />
          </button>
        </div>
        {titleTipVisible ? (
          <div className={styles.validationTip}>
            <i className="fa-solid fa-circle-exclamation" /> 请输入竞猜标题（至少5个字）
          </div>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>竞猜描述</label>
        <textarea
          className={styles.textarea}
          placeholder="描述一下竞猜规则和奖品..."
          value={desc}
          onChange={(event) => setDesc(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>封面图片</label>
        <button
          className={`${styles.coverUpload} ${coverUploaded ? styles.coverUploadDone : ''}`}
          type="button"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverPreviewUrl ? <img className={styles.coverPreview} src={coverPreviewUrl} alt="封面预览" /> : null}
          {coverUploading ? (
            <div className={styles.coverUploading}>
              <i className="fa-solid fa-spinner fa-spin" />
              <span>上传中...</span>
            </div>
          ) : null}
          {!coverPreviewUrl && !coverUploading ? (
            <div className={styles.coverPlaceholder}>
              <i className="fa-solid fa-camera" />
              <span>点击上传封面</span>
            </div>
          ) : null}
        </button>
        <input
          ref={coverInputRef}
          hidden
          accept="image/jpeg,image/png,image/webp,image/gif"
          type="file"
          onChange={(event) => handleCoverPick(event.target.files?.[0] ?? null)}
        />
      </div>
    </section>
  );
}
