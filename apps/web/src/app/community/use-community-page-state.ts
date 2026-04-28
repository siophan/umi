'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

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
import type { GuessId } from '@umi/shared';

import { fetchSocialOverview } from '../../lib/api/friends';
import { fetchGuessList } from '../../lib/api/guesses';
import { hasAuthToken } from '../../lib/api/shared';
import { uploadOssImage } from '../../lib/api/uploads';
import type { EmojiCategory, FeedItem, FollowUser, HotTopic, PublishScope } from './page-helpers';
import {
  defaultFollowedUsers,
  getScopeLabel,
  mapCommunityFeedItem,
  topicOptions,
} from './page-helpers';

type GuessLinkCandidate = {
  id: GuessId;
  title: string;
  cover?: string | null;
  desc?: string | null;
};

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export function useCommunityPageState() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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
  const [imageUploading, setImageUploading] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCandidates, setMentionCandidates] = useState<FollowUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<FollowUser[]>([]);
  const [guessLinkOpen, setGuessLinkOpen] = useState(false);
  const [guessLinkQuery, setGuessLinkQuery] = useState('');
  const [guessLinkCandidates, setGuessLinkCandidates] = useState<GuessLinkCandidate[]>([]);
  const [guessLinkLoading, setGuessLinkLoading] = useState(false);
  const [selectedGuessLink, setSelectedGuessLink] = useState<GuessLinkCandidate | null>(null);

  const visibleFeed = useMemo(
    () => (tab === 'recommend' ? recommendFeed : followFeed),
    [followFeed, recommendFeed, tab],
  );

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(''), 1800);
  }

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

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
      const authed = hasAuthToken();
      const [recommendResult, followResult, discoveryResult] = await Promise.allSettled([
        fetchCommunityFeed('recommend'),
        authed ? fetchCommunityFeed('follow') : Promise.resolve({ items: [] }),
        fetchCommunityDiscovery(),
      ]);

      if (ignore) {
        return;
      }

      if (recommendResult.status === 'fulfilled') {
        setRecommendFeed(recommendResult.value.items.map(mapCommunityFeedItem));
        setFeedError('');
      } else {
        setRecommendFeed([]);
        setFeedError(
          recommendResult.reason instanceof Error
            ? recommendResult.reason.message
            : '社区动态加载失败',
        );
      }

      if (followResult.status === 'fulfilled') {
        setFollowFeed(followResult.value.items.map(mapCommunityFeedItem));
      } else {
        setFollowFeed([]);
      }

      if (discoveryResult.status === 'fulfilled') {
        setHeroPost(discoveryResult.value.hero ? mapCommunityFeedItem(discoveryResult.value.hero) : null);
        setHotTopics(discoveryResult.value.hotTopics);
      } else {
        setHeroPost(null);
        setHotTopics([]);
      }

      setFeedReady(true);
    }

    void loadFeed();
    return () => {
      ignore = true;
    };
  }, []);

  function resetPublish() {
    setPublishText('');
    setSelectedTopic(null);
    setPublishScope('public');
    setScopeDraft('public');
    setEmojiCategory('😀 表情');
    setSelectedImages([]);
    setScopeOpen(false);
    setEmojiOpen(false);
    setSelectedMentions([]);
    setSelectedGuessLink(null);
    setMentionOpen(false);
    setMentionQuery('');
    setGuessLinkOpen(false);
    setGuessLinkQuery('');
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

  function clearSelectedImages() {
    setSelectedImages([]);
  }

  function readFileAsBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(file);
    });
  }

  async function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const remaining = Math.max(0, 3 - selectedImages.length);
    const files = Array.from(event.target.files ?? []).slice(0, remaining);
    event.target.value = '';
    if (!files.length) {
      return;
    }

    setImageUploading(true);
    try {
      for (const file of files) {
        if (!IMAGE_MIME_TYPES.has(file.type)) {
          showToast('仅支持 jpg/png/webp/gif 图片');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showToast(`图片 ${file.name} 超过 10MB`);
          continue;
        }
        const dataUrl = await readFileAsBase64(file);
        const result = await uploadOssImage({
          fileName: file.name || 'image',
          contentType: file.type as AllowedImageMime,
          contentBase64: dataUrl,
          usage: 'community_post',
        });
        setSelectedImages((current) => [...current, result.url].slice(0, 3));
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setImageUploading(false);
    }
  }

  function buildPublishContent(rawText: string) {
    const mentionPrefix = selectedMentions.length
      ? `${selectedMentions.map((user) => `@${user.name}`).join(' ')} `
      : '';
    return `${mentionPrefix}${rawText}`.trim();
  }

  async function submitPublish() {
    const text = publishText.trim();
    if (!text || publishing) {
      return;
    }
    if (imageUploading) {
      showToast('图片仍在上传，请稍候');
      return;
    }

    const tagText = selectedTopic?.replace(/^.\s*/u, '') || '猜友动态';
    const content = buildPublishContent(text);

    try {
      setPublishing(true);
      const created = await createCommunityPost({
        content,
        tag: tagText,
        scope: publishScope,
        images: selectedImages,
        guessId: selectedGuessLink?.id ?? null,
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

  async function openMentionPanel() {
    setMentionOpen(true);
    setMentionQuery('');
    if (mentionCandidates.length || mentionLoading) {
      return;
    }
    setMentionLoading(true);
    try {
      const result = await fetchSocialOverview();
      const merged = [...result.following, ...result.friends];
      const dedup = new Map<string, FollowUser>();
      for (const item of merged) {
        const id = String(item.id);
        if (!id || dedup.has(id)) continue;
        dedup.set(id, {
          id,
          uid: String(item.uid || item.id || ''),
          name: item.name || '未知用户',
          avatar: item.avatar || '/legacy/images/mascot/mouse-main.png',
          hasNew: false,
        });
      }
      setMentionCandidates(Array.from(dedup.values()));
    } catch {
      setMentionCandidates([]);
      showToast('好友列表加载失败');
    } finally {
      setMentionLoading(false);
    }
  }

  function closeMentionPanel() {
    setMentionOpen(false);
  }

  function toggleMention(user: FollowUser) {
    setSelectedMentions((current) => {
      if (current.some((item) => item.id === user.id)) {
        return current.filter((item) => item.id !== user.id);
      }
      return [...current, user].slice(0, 5);
    });
  }

  function removeMention(id: string) {
    setSelectedMentions((current) => current.filter((item) => item.id !== id));
  }

  const filteredMentionCandidates = useMemo(() => {
    const keyword = mentionQuery.trim().toLowerCase();
    if (!keyword) {
      return mentionCandidates;
    }
    return mentionCandidates.filter((user) => {
      const name = user.name?.toLowerCase() ?? '';
      const uid = (user.uid || '').toLowerCase();
      return name.includes(keyword) || uid.includes(keyword);
    });
  }, [mentionCandidates, mentionQuery]);

  async function loadGuessLinkCandidates(keyword: string) {
    setGuessLinkLoading(true);
    try {
      const result = await fetchGuessList({ q: keyword, limit: 20 });
      setGuessLinkCandidates(
        result.items.map((item) => ({
          id: item.id,
          title: item.title,
          cover: item.product?.img ?? null,
          desc: item.category || item.description || null,
        })),
      );
    } catch {
      setGuessLinkCandidates([]);
      showToast('竞猜列表加载失败');
    } finally {
      setGuessLinkLoading(false);
    }
  }

  async function openGuessLinkPanel() {
    setGuessLinkOpen(true);
    setGuessLinkQuery('');
    if (!guessLinkCandidates.length && !guessLinkLoading) {
      await loadGuessLinkCandidates('');
    }
  }

  function closeGuessLinkPanel() {
    setGuessLinkOpen(false);
  }

  function changeGuessLinkQuery(value: string) {
    setGuessLinkQuery(value);
  }

  useEffect(() => {
    if (!guessLinkOpen) {
      return;
    }
    const handle = window.setTimeout(() => {
      void loadGuessLinkCandidates(guessLinkQuery.trim());
    }, 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessLinkQuery, guessLinkOpen]);

  function selectGuessLink(item: GuessLinkCandidate) {
    setSelectedGuessLink((current) => (current?.id === item.id ? null : item));
    setGuessLinkOpen(false);
  }

  function clearGuessLink() {
    setSelectedGuessLink(null);
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

  return {
    textareaRef,
    imageInputRef,
    tab,
    setTab,
    publishOpen,
    setPublishOpen,
    scopeOpen,
    setScopeOpen,
    emojiOpen,
    setEmojiOpen,
    publishText,
    setPublishText,
    selectedTopic,
    recommendFeed,
    followFeed,
    toast,
    publishScope,
    scopeDraft,
    emojiCategory,
    setEmojiCategory,
    bookmarkAnimating,
    followedUsers,
    socialReady,
    feedReady,
    feedError,
    likeSavingId,
    bookmarkSavingId,
    publishing,
    selectedImages,
    imageUploading,
    hotTopics,
    heroPost,
    repostTarget,
    repostDraft,
    setRepostDraft,
    repostSaving,
    visibleFeed,
    showToast,
    openRepostComposer,
    closeRepostComposer,
    toggleLike,
    toggleBookmark,
    openScopePanel,
    toggleScopeDraft,
    confirmScopes,
    toggleTopic,
    insertEmoji,
    removeSelectedImage,
    clearSelectedImages,
    selectImages,
    submitPublish,
    handleRepostSubmit,
    defaultFollowedUsers,
    topicOptions,
    openMentionPanel,
    closeMentionPanel,
    toggleMention,
    removeMention,
    selectedMentions,
    mentionOpen,
    mentionQuery,
    setMentionQuery,
    mentionLoading,
    mentionCandidates: filteredMentionCandidates,
    openGuessLinkPanel,
    closeGuessLinkPanel,
    guessLinkOpen,
    guessLinkQuery,
    setGuessLinkQuery: changeGuessLinkQuery,
    guessLinkCandidates,
    guessLinkLoading,
    selectGuessLink,
    selectedGuessLink,
    clearGuessLink,
  };
}
