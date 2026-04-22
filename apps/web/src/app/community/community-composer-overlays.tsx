'use client';

import type { ChangeEvent, RefObject } from 'react';

import type { EmojiCategory, PublishScope } from './page-helpers';
import { SCOPE_META, emojiCategories, getScopeLabel, myProfile, topicOptions } from './page-helpers';
import styles from './page.module.css';

type RepostTarget = {
  postId: string;
  tab: 'recommend' | 'follow';
  title: string;
  author: string;
} | null;

type Props = {
  publishOpen: boolean;
  onClosePublish: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  imageInputRef: RefObject<HTMLInputElement | null>;
  publishScope: PublishScope;
  onOpenScopePanel: () => void;
  publishText: string;
  onChangePublishText: (value: string) => void;
  selectedImages: string[];
  onSelectImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearImages: () => void;
  onRemoveSelectedImage: (target: string) => void;
  selectedTopic: string | null;
  onToggleTopic: (topic: string) => void;
  onOpenEmoji: () => void;
  publishing: boolean;
  onSubmitPublish: () => void;
  repostTarget: RepostTarget;
  repostDraft: string;
  onChangeRepostDraft: (value: string) => void;
  onCloseRepost: () => void;
  repostSaving: boolean;
  onSubmitRepost: () => void;
  scopeOpen: boolean;
  onCloseScope: () => void;
  scopeDraft: PublishScope;
  onToggleScopeDraft: (scope: PublishScope) => void;
  onConfirmScopes: () => void;
  emojiOpen: boolean;
  onCloseEmoji: () => void;
  emojiCategory: EmojiCategory;
  onChangeEmojiCategory: (category: EmojiCategory) => void;
  onInsertEmoji: (emoji: string) => void;
};

export function CommunityComposerOverlays({
  publishOpen,
  onClosePublish,
  textareaRef,
  imageInputRef,
  publishScope,
  onOpenScopePanel,
  publishText,
  onChangePublishText,
  selectedImages,
  onSelectImages,
  onClearImages,
  onRemoveSelectedImage,
  selectedTopic,
  onToggleTopic,
  onOpenEmoji,
  publishing,
  onSubmitPublish,
  repostTarget,
  repostDraft,
  onChangeRepostDraft,
  onCloseRepost,
  repostSaving,
  onSubmitRepost,
  scopeOpen,
  onCloseScope,
  scopeDraft,
  onToggleScopeDraft,
  onConfirmScopes,
  emojiOpen,
  onCloseEmoji,
  emojiCategory,
  onChangeEmojiCategory,
  onInsertEmoji,
}: Props) {
  return (
    <>
      {publishOpen ? (
        <div className={styles.publishOverlay} onClick={onClosePublish} role="presentation">
          <section className={styles.publishPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.handle} />
            <div className={styles.publishHeader}>
              <h3>发布动态</h3>
              <button className={styles.closeBtn} type="button" onClick={onClosePublish}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className={styles.publishUser}>
              <img src={myProfile.avatar} alt={myProfile.name} />
              <div className={styles.publishUserName}>{myProfile.name}</div>
              <button
                className={`${styles.publishScope} ${publishScope === 'public' ? '' : styles.publishScopeChanged}`}
                type="button"
                onClick={onOpenScopePanel}
              >
                <i className={`fa-solid ${SCOPE_META[publishScope].icon}`} />
                {getScopeLabel(publishScope)}
                <i className="fa-solid fa-chevron-down" />
              </button>
            </div>

            <textarea
              autoFocus
              ref={textareaRef}
              className={styles.textarea}
              placeholder="分享你的竞猜心得、零食测评、PK战报..."
              value={publishText}
              onChange={(event) => onChangePublishText(event.target.value)}
            />

            <div className={styles.mediaRow}>
              <input
                ref={imageInputRef}
                className={styles.hiddenInput}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void onSelectImages(event)}
              />
              <button className={styles.mediaBtn} type="button" onClick={() => imageInputRef.current?.click()}>
                <i className="fa-solid fa-image" />
                <span>图片</span>
              </button>
              <button className={styles.mediaBtn} type="button" onClick={onClearImages}>
                <i className="fa-solid fa-eraser" />
                <span>清空图片</span>
              </button>
            </div>

            {selectedImages.length ? (
              <div className={styles.imagePreviewRow}>
                {selectedImages.map((image) => (
                  <div className={styles.imagePreviewCard} key={image}>
                    <img src={image} alt="动态图片" />
                    <button className={styles.imagePreviewRemove} type="button" onClick={() => onRemoveSelectedImage(image)}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {selectedImages.length ? (
              <div className={styles.attachments}>
                <span className={styles.attachmentTag}>
                  <i className="fa-solid fa-image" />
                  已添加 {selectedImages.length} 张图片
                </span>
              </div>
            ) : null}

            <div className={styles.topics}>
              {topicOptions.map((item) => (
                <button
                  className={`${styles.topicTag} ${selectedTopic === item ? styles.topicSelected : ''}`}
                  type="button"
                  key={item}
                  onClick={() => onToggleTopic(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className={styles.toolbar}>
              <button className={styles.toolbarItem} type="button" onClick={onOpenEmoji}>
                <i className="fa-regular fa-face-smile" />
                <span>表情</span>
              </button>
            </div>

            <button className={styles.submitBtn} type="button" disabled={!publishText.trim() || publishing} onClick={onSubmitPublish}>
              <i className={`fa-solid ${publishing ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} /> {publishing ? '发布中' : '发布动态'}
            </button>
          </section>
        </div>
      ) : null}

      {repostTarget ? (
        <div className={styles.subOverlay} onClick={onCloseRepost} role="presentation">
          <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.scopeHandle} />
            <div className={styles.scopeHeader}>
              <h3>转发动态</h3>
              <button className={styles.closeBtn} type="button" onClick={onCloseRepost}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className={styles.repostLead}>
              <span className={styles.repostLeadIcon}>
                <i className="fa-solid fa-retweet" />
              </span>
              <div className={styles.repostLeadText}>
                <strong>转发到猜友圈</strong>
                <span>补一句态度，动态会更完整。</span>
              </div>
            </div>

            <div className={styles.repostSummary}>
              <div className={styles.repostLabel}>原动态</div>
              <div className={styles.repostTitle}>{repostTarget.title || '未命名动态'}</div>
              <div className={styles.repostMeta}>作者 · {repostTarget.author}</div>
            </div>

            <div className={styles.repostField}>
              <textarea
                autoFocus
                className={styles.repostTextarea}
                placeholder="这一条我为什么想转发？"
                value={repostDraft}
                onChange={(event) => onChangeRepostDraft(event.target.value)}
              />
              <div className={styles.repostFieldMeta}>
                <span>公开发布，所有人可见</span>
                <span>{repostDraft.trim().length} 字</span>
              </div>
            </div>

            <div className={styles.repostActions}>
              <button className={styles.repostGhostBtn} type="button" onClick={onCloseRepost}>
                取消
              </button>
              <button className={styles.repostSubmitBtn} type="button" disabled={repostSaving} onClick={onSubmitRepost}>
                <i className={`fa-solid ${repostSaving ? 'fa-spinner fa-spin' : 'fa-retweet'}`} /> {repostSaving ? '转发中' : '确认转发'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {scopeOpen ? (
        <div className={styles.subOverlay} onClick={onCloseScope} role="presentation">
          <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.scopeHandle} />
            <div className={styles.scopeHeader}>
              <h3>谁可以看</h3>
              <button className={styles.closeBtn} type="button" onClick={onCloseScope}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {(['public', 'followers', 'private'] as PublishScope[]).map((item) => (
              <button
                key={item}
                className={`${styles.scopeOption} ${scopeDraft === item ? styles.scopeSelected : ''}`}
                type="button"
                onClick={() => onToggleScopeDraft(item)}
              >
                <span className={`${styles.scopeIcon} ${SCOPE_META[item].iconClass}`}>
                  <i className={`fa-solid ${SCOPE_META[item].icon}`} />
                </span>
                <span className={styles.scopeInfo}>
                  <span className={styles.scopeName}>{SCOPE_META[item].label}</span>
                  <span className={styles.scopeDesc}>{SCOPE_META[item].desc}</span>
                </span>
                <i className={`fa-solid fa-circle-check ${styles.scopeCheck}`} />
              </button>
            ))}

            <button className={styles.scopeConfirm} type="button" onClick={onConfirmScopes}>
              确定
            </button>
          </section>
        </div>
      ) : null}

      {emojiOpen ? (
        <div className={styles.subOverlay} onClick={onCloseEmoji} role="presentation">
          <section className={`${styles.subPanel} ${styles.emojiPanel}`} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.scopeHandle} />
            <div className={styles.scopeHeader}>
              <h3>选择表情</h3>
              <button className={styles.closeBtn} type="button" onClick={onCloseEmoji}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className={styles.emojiTabs}>
              {(Object.keys(emojiCategories) as Array<keyof typeof emojiCategories>).map((item) => (
                <button
                  className={`${styles.emojiTab} ${emojiCategory === item ? styles.emojiTabActive : ''}`}
                  key={item}
                  type="button"
                  onClick={() => onChangeEmojiCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className={styles.emojiGrid}>
              {emojiCategories[emojiCategory].map((item) => (
                <button
                  className={styles.emojiButton}
                  key={`${emojiCategory}-${item}`}
                  type="button"
                  onClick={() => onInsertEmoji(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
