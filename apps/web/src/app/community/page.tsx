'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

import { MobileShell } from '../../components/mobile-shell';
import {
  bookmarkCommunityPost,
  createCommunityPost,
  fetchCommunityDiscovery,
  fetchCommunityFeed,
  likeCommunityPost,
  repostCommunityPost,
  unbookmarkCommunityPost,
  unlikeCommunityPost,
} from '../../lib/api/community';
import { fetchSocialOverview } from '../../lib/api/friends';
import { CommunityFeedList } from './community-feed-list';
import { CommunityFollowBar } from './community-follow-bar';
import { CommunityRecommendHighlights } from './community-recommend-highlights';
import type { EmojiCategory, FeedItem, FollowUser, HotTopic, PublishScope } from './page-helpers';
import {
  SCOPE_META,
  defaultFollowedUsers,
  emojiCategories,
  getScopeLabel,
  mapCommunityFeedItem,
  myProfile,
  topicOptions,
} from './page-helpers';
import styles from './page.module.css';

export default function CommunityPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<'recommend' | 'follow'>('recommend');
  const [publishOpen, setPublishOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [publishText, setPublishText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [recommendFeed, setRecommendFeed] = useState<FeedItem[]>([]);
  const [followFeed, setFollowFeed] = useState<FeedItem[]>([]);
  const [toast, setToast] = useState('');
  const [publishScope, setPublishScope] = useState<PublishScope>('public');
  const [scopeDraft, setScopeDraft] = useState<PublishScope>('public');
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>('😀 表情');
  const [bookmarkAnimating, setBookmarkAnimating] = useState<string | null>(null);
  const [followedUsers, setFollowedUsers] = useState<FollowUser[]>([]);
  const [socialReady, setSocialReady] = useState(false);
  const [feedReady, setFeedReady] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [likeSavingId, setLikeSavingId] = useState('');
  const [bookmarkSavingId, setBookmarkSavingId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [heroPost, setHeroPost] = useState<FeedItem | null>(null);
  const [repostTarget, setRepostTarget] = useState<{
    postId: string;
    tab: 'recommend' | 'follow';
    title: string;
    author: string;
  } | null>(null);
  const [repostDraft, setRepostDraft] = useState('转发动态');
  const [repostSaving, setRepostSaving] = useState(false);

  const visibleFeed = useMemo(
    () => (tab === 'recommend' ? recommendFeed : followFeed),
    [followFeed, recommendFeed, tab],
  );

  useEffect(() => {
    let ignore = false;

    async function loadSocial() {
      try {
        const result = await fetchSocialOverview();
        if (ignore) {
          return;
        }

        const mergedUsers = [...result.following, ...result.friends];
        const deduped = mergedUsers.reduce<FollowUser[]>((acc, item, index) => {
          const uid = String(item.uid || item.id || '').trim();
          if (!uid || acc.some((entry) => entry.id === String(item.id))) {
            return acc;
          }

          acc.push({
            id: String(item.id),
            uid,
            name: item.name || '未知用户',
            avatar: item.avatar || '/legacy/images/mascot/mouse-main.png',
            hasNew: index < result.following.length,
          });
          return acc;
        }, []);

        setFollowedUsers(deduped.filter((_, index) => index < 10));
      } catch {
        if (ignore) {
          return;
        }
        setFollowedUsers([]);
      } finally {
        if (!ignore) {
          setSocialReady(true);
        }
      }
    }

    void loadSocial();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFeed() {
      try {
        const [recommendResult, followResult, discoveryResult] = await Promise.all([
          fetchCommunityFeed('recommend'),
          fetchCommunityFeed('follow'),
          fetchCommunityDiscovery(),
        ]);
        if (ignore) {
          return;
        }

        setRecommendFeed(recommendResult.items.map(mapCommunityFeedItem));
        setFollowFeed(followResult.items.map(mapCommunityFeedItem));
        setHeroPost(discoveryResult.hero ? mapCommunityFeedItem(discoveryResult.hero) : null);
        setHotTopics(discoveryResult.hotTopics);
        setFeedError('');
      } catch (error) {
        if (ignore) {
          return;
        }
        setRecommendFeed([]);
        setFollowFeed([]);
        setHeroPost(null);
        setHotTopics([]);
        setFeedError(error instanceof Error ? error.message : '社区动态加载失败');
      } finally {
        if (!ignore) {
          setFeedReady(true);
        }
      }
    }

    void loadFeed();
    return () => {
      ignore = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  }

  function resetPublish() {
    setPublishText('');
    setSelectedTopic(null);
    setPublishScope('public');
    setScopeDraft('public');
    setEmojiCategory('😀 表情');
    setSelectedImages([]);
    setScopeOpen(false);
    setEmojiOpen(false);
  }

  function openRepostComposer(item: FeedItem, currentTab: 'recommend' | 'follow') {
    setRepostTarget({
      postId: item.id,
      tab: currentTab,
      title: item.title,
      author: item.author.name,
    });
    setRepostDraft('转发动态');
  }

  function closeRepostComposer() {
    if (repostSaving) {
      return;
    }
    setRepostTarget(null);
    setRepostDraft('转发动态');
  }

  function updateFeedList(currentTab: 'recommend' | 'follow', updater: (list: FeedItem[]) => FeedItem[]) {
    if (currentTab === 'recommend') {
      setRecommendFeed(updater);
      return;
    }
    setFollowFeed(updater);
  }

  async function toggleLike(postId: string, currentTab: 'recommend' | 'follow') {
    if (likeSavingId === postId) {
      return;
    }

    const target = (currentTab === 'recommend' ? recommendFeed : followFeed).find((item) => item.id === postId);
    if (!target) {
      return;
    }

    const nextLiked = !target.liked;
    const update = (list: FeedItem[]) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: nextLiked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      );

    updateFeedList(currentTab, update);
    setLikeSavingId(postId);

    try {
      if (nextLiked) {
        await likeCommunityPost(postId);
      } else {
        await unlikeCommunityPost(postId);
      }
    } catch (error) {
      updateFeedList(currentTab, (list) =>
        list.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: target.liked,
                likes: target.likes,
              }
            : post,
        ),
      );
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLikeSavingId('');
    }
  }

  async function toggleBookmark(postId: string, currentTab: 'recommend' | 'follow', bookmarked: boolean) {
    if (bookmarkSavingId === postId) {
      return;
    }

    updateFeedList(currentTab, (list) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              bookmarked: !post.bookmarked,
            }
          : post,
      ),
    );

    if (!bookmarked) {
      setBookmarkAnimating(postId);
      window.setTimeout(() => {
        setBookmarkAnimating((current) => (current === postId ? null : current));
      }, 300);
    }
    setBookmarkSavingId(postId);

    try {
      if (bookmarked) {
        await unbookmarkCommunityPost(postId);
      } else {
        await bookmarkCommunityPost(postId);
      }
      showToast(bookmarked ? '已取消收藏' : '⭐ 收藏成功');
    } catch (error) {
      updateFeedList(currentTab, (list) =>
        list.map((post) =>
          post.id === postId
            ? {
                ...post,
                bookmarked,
              }
            : post,
        ),
      );
      showToast(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBookmarkSavingId('');
    }
  }

  function openScopePanel() {
    setScopeDraft(publishScope);
    setScopeOpen(true);
  }

  function toggleScopeDraft(scope: PublishScope) {
    setScopeDraft(scope);
  }

  function confirmScopes() {
    setPublishScope(scopeDraft);
    setScopeOpen(false);
    showToast(`可见范围：${getScopeLabel(scopeDraft)}`);
  }

  function toggleTopic(topic: string) {
    setSelectedTopic((current) => (current === topic ? null : topic));
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setPublishText((current) => `${current}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? publishText.length;
    const end = textarea.selectionEnd ?? publishText.length;
    const next = `${publishText.slice(0, start)}${emoji}${publishText.slice(end)}`;
    setPublishText(next);

    window.setTimeout(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function updateShares(postId: string, currentTab: 'recommend' | 'follow') {
    const update = (list: FeedItem[]) =>
      list.map((post) =>
        post.id === postId
          ? {
              ...post,
              shares: post.shares + 1,
            }
          : post,
      );

    if (currentTab === 'recommend') {
      setRecommendFeed(update);
      return;
    }

    setFollowFeed(update);
  }

  function removeSelectedImage(target: string) {
    setSelectedImages((current) => current.filter((item) => item !== target));
  }

  async function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 3);
    if (!files.length) {
      return;
    }

    const encoded = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(new Error('图片读取失败'));
            reader.readAsDataURL(file);
          }),
      ),
    );
    setSelectedImages((current) => [...current, ...encoded].filter(Boolean).slice(0, 3));
    event.target.value = '';
  }

  async function submitPublish() {
    const text = publishText.trim();
    if (!text || publishing) {
      return;
    }

    const tagText = selectedTopic?.replace(/^.\s*/u, '') || '猜友动态';

    try {
      setPublishing(true);
      const created = await createCommunityPost({
        content: text,
        tag: tagText,
        scope: publishScope,
        images: selectedImages,
      });
      const mapped = mapCommunityFeedItem(created);
      setRecommendFeed((current) => [mapped, ...current]);
      if (tab === 'follow') {
        setFollowFeed((current) => [mapped, ...current]);
      }
      setPublishOpen(false);
      showToast(`✅ 动态已发布 · ${getScopeLabel(publishScope)}可见`);
      resetPublish();
      setTab('recommend');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  }

  async function handleRepostSubmit() {
    if (!repostTarget || repostSaving) {
      return;
    }

    const content = repostDraft.trim() || '转发动态';

    try {
      setRepostSaving(true);
      const reposted = await repostCommunityPost(repostTarget.postId, {
        content,
        scope: 'public',
      });
      const mapped = mapCommunityFeedItem(reposted);
      setRecommendFeed((current) => [mapped, ...current]);
      if (repostTarget.tab === 'follow') {
        setFollowFeed((current) => [mapped, ...current]);
      }
      updateShares(repostTarget.postId, repostTarget.tab);
      setRepostTarget(null);
      setRepostDraft('转发动态');
      showToast('✅ 转发成功');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '转发失败');
    } finally {
      setRepostSaving(false);
    }
  }

  return (
    <MobileShell tab="community" tone="light">
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.title}>
            猜友<span>圈</span>
          </div>
          <div className={styles.spacer} />
          <button className={styles.iconBtn} type="button" onClick={() => router.push('/community-search')}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button className={styles.iconBtn} type="button" onClick={() => router.push('/notifications')}>
            <i className="fa-regular fa-bell" />
          </button>
        </header>

        <nav className={styles.tabs}>
          <button className={tab === 'recommend' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('recommend')}>
            为您推荐
          </button>
          <button className={tab === 'follow' ? styles.tabActive : styles.tab} type="button" onClick={() => setTab('follow')}>
            你的关注
          </button>
        </nav>

        {tab === 'follow' ? (
          <CommunityFollowBar
            followedUsers={followedUsers}
            socialReady={socialReady}
            fallbackUsers={defaultFollowedUsers}
            onOpenUser={(userId) => router.push(`/user/${encodeURIComponent(userId)}`)}
          />
        ) : null}

        {tab === 'recommend' ? (
          <CommunityRecommendHighlights
            heroPost={heroPost}
            hotTopics={hotTopics}
            onOpenPost={(postId) => router.push(`/post/${encodeURIComponent(postId)}`)}
          />
        ) : null}

        <CommunityFeedList
          feedReady={feedReady}
          feedError={feedError}
          feed={visibleFeed}
          currentTab={tab}
          likeSavingId={likeSavingId}
          bookmarkSavingId={bookmarkSavingId}
          bookmarkAnimating={bookmarkAnimating}
          onOpenPost={(postId) => router.push(`/post/${encodeURIComponent(postId)}`)}
          onOpenUser={(userId) => router.push(`/user/${encodeURIComponent(userId)}`)}
          onOpenGuess={(guessId) => router.push(`/guess/${guessId}`)}
          onToggleLike={(postId, currentTab) => void toggleLike(postId, currentTab)}
          onOpenRepost={openRepostComposer}
          onToggleBookmark={(postId, currentTab, bookmarked) => void toggleBookmark(postId, currentTab, bookmarked)}
        />

        <div className={styles.loadMore}>
          {feedReady ? (
            <><i className="fa-solid fa-check" /> 已展示最新动态</>
          ) : (
            <><i className="fa-solid fa-spinner fa-spin" /> 加载更多动态...</>
          )}
        </div>

        <button className={styles.publishFab} type="button" onClick={() => setPublishOpen(true)}>
          <i className="fa-solid fa-pen-to-square" />
        </button>

        {publishOpen ? (
          <div className={styles.publishOverlay} onClick={() => setPublishOpen(false)} role="presentation">
            <section className={styles.publishPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.handle} />
              <div className={styles.publishHeader}>
                <h3>发布动态</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setPublishOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.publishUser}>
                <img src={myProfile.avatar} alt={myProfile.name} />
                <div className={styles.publishUserName}>{myProfile.name}</div>
                <button
                  className={`${styles.publishScope} ${publishScope === 'public' ? '' : styles.publishScopeChanged}`}
                  type="button"
                  onClick={openScopePanel}
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
                onChange={(event) => setPublishText(event.target.value)}
              />

              <div className={styles.mediaRow}>
                <input
                  ref={imageInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void selectImages(event)}
                />
                <button className={styles.mediaBtn} type="button" onClick={() => imageInputRef.current?.click()}>
                  <i className="fa-solid fa-image" />
                  <span>图片</span>
                </button>
                <button className={styles.mediaBtn} type="button" onClick={() => setSelectedImages([])}>
                  <i className="fa-solid fa-eraser" />
                  <span>清空图片</span>
                </button>
              </div>

              {selectedImages.length ? (
                <div className={styles.imagePreviewRow}>
                  {selectedImages.map((image) => (
                    <div className={styles.imagePreviewCard} key={image}>
                      <img src={image} alt="动态图片" />
                      <button className={styles.imagePreviewRemove} type="button" onClick={() => removeSelectedImage(image)}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedImages.length ? (
                <div className={styles.attachments}>
                  {selectedImages.length ? (
                    <span className={styles.attachmentTag}>
                      <i className="fa-solid fa-image" />
                      已添加 {selectedImages.length} 张图片
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.topics}>
                {topicOptions.map((item) => (
                  <button
                    className={`${styles.topicTag} ${selectedTopic === item ? styles.topicSelected : ''}`}
                    type="button"
                    key={item}
                    onClick={() => toggleTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className={styles.toolbar}>
                <button className={styles.toolbarItem} type="button" onClick={() => setEmojiOpen(true)}>
                  <i className="fa-regular fa-face-smile" />
                  <span>表情</span>
                </button>
              </div>

              <button className={styles.submitBtn} type="button" disabled={!publishText.trim() || publishing} onClick={() => void submitPublish()}>
                <i className={`fa-solid ${publishing ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} /> {publishing ? '发布中' : '发布动态'}
              </button>
            </section>
          </div>
        ) : null}

        {repostTarget ? (
          <div className={styles.subOverlay} onClick={closeRepostComposer} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>转发动态</h3>
                <button className={styles.closeBtn} type="button" onClick={closeRepostComposer}>
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
                  onChange={(event) => setRepostDraft(event.target.value)}
                />
                <div className={styles.repostFieldMeta}>
                  <span>公开发布，所有人可见</span>
                  <span>{repostDraft.trim().length} 字</span>
                </div>
              </div>

              <div className={styles.repostActions}>
                <button className={styles.repostGhostBtn} type="button" onClick={closeRepostComposer}>
                  取消
                </button>
                <button
                  className={styles.repostSubmitBtn}
                  type="button"
                  disabled={repostSaving}
                  onClick={() => void handleRepostSubmit()}
                >
                  <i className={`fa-solid ${repostSaving ? 'fa-spinner fa-spin' : 'fa-retweet'}`} /> {repostSaving ? '转发中' : '确认转发'}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {scopeOpen ? (
          <div className={styles.subOverlay} onClick={() => setScopeOpen(false)} role="presentation">
            <section className={styles.subPanel} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>谁可以看</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setScopeOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {(['public', 'followers', 'private'] as PublishScope[]).map((item) => (
                <button
                  key={item}
                  className={`${styles.scopeOption} ${scopeDraft === item ? styles.scopeSelected : ''}`}
                  type="button"
                  onClick={() => toggleScopeDraft(item)}
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

              <button className={styles.scopeConfirm} type="button" onClick={confirmScopes}>
                确定
              </button>
            </section>
          </div>
        ) : null}

        {emojiOpen ? (
          <div className={styles.subOverlay} onClick={() => setEmojiOpen(false)} role="presentation">
            <section className={`${styles.subPanel} ${styles.emojiPanel}`} onClick={(event) => event.stopPropagation()} role="presentation">
              <div className={styles.scopeHandle} />
              <div className={styles.scopeHeader}>
                <h3>选择表情</h3>
                <button className={styles.closeBtn} type="button" onClick={() => setEmojiOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className={styles.emojiTabs}>
                {(Object.keys(emojiCategories) as Array<keyof typeof emojiCategories>).map((item) => (
                  <button
                    className={`${styles.emojiTab} ${emojiCategory === item ? styles.emojiTabActive : ''}`}
                    key={item}
                    type="button"
                    onClick={() => setEmojiCategory(item)}
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
                    onClick={() => insertEmoji(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {toast ? <div className={styles.toast}>{toast}</div> : null}
      </main>
    </MobileShell>
  );
}
